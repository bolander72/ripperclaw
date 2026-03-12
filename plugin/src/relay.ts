import { WebSocketServer, WebSocket } from "ws";
import { createHash } from "crypto";
import { RelayDB } from "./db.js";
import type {
  NostrEvent,
  NostrFilter,
  ClientMessage,
  RelayMessage,
  RelayConfig,
} from "./types.js";

interface Subscription {
  id: string;
  filters: NostrFilter[];
  ws: WebSocket;
}

export class ClawClawGoRelay {
  private wss: WebSocketServer | null = null;
  private db: RelayDB;
  private config: RelayConfig;
  private subscriptions: Map<string, Subscription> = new Map();
  private logger: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void };

  constructor(
    config: RelayConfig,
    logger?: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void },
  ) {
    this.config = config;
    this.db = new RelayDB(config.dbPath);
    this.logger = logger ?? {
      info: (...args: unknown[]) => console.log("[clawclawgo-relay]", ...args),
      error: (...args: unknown[]) => console.error("[clawclawgo-relay]", ...args),
    };
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.wss = new WebSocketServer({
        port: this.config.port,
        host: this.config.host,
      });

      this.wss.on("connection", (ws, req) => {
        const clientId = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
        this.logger.info(`Client connected: ${clientId}`);

        // Send relay info on connect (NIP-11 via WebSocket isn't standard,
        // but we handle NIP-11 via HTTP upgrade)
        ws.on("message", (data) => {
          try {
            const msg = JSON.parse(data.toString()) as ClientMessage;
            this.handleMessage(ws, msg, clientId);
          } catch {
            this.send(ws, ["NOTICE", "Invalid message format"]);
          }
        });

        ws.on("close", () => {
          // Clean up subscriptions for this client
          for (const [key, sub] of this.subscriptions) {
            if (sub.ws === ws) {
              this.subscriptions.delete(key);
            }
          }
          this.logger.info(`Client disconnected: ${clientId}`);
        });

        ws.on("error", (err) => {
          this.logger.error(`WebSocket error from ${clientId}:`, err.message);
        });
      });

      // Handle NIP-11 relay information document
      this.wss.on("headers", (headers, req) => {
        if (req.headers.accept === "application/nostr+json") {
          // This is handled at the HTTP level, not WebSocket
        }
      });

      this.wss.on("listening", () => {
        this.logger.info(
          `ClawClawGo relay listening on ws://${this.config.host}:${this.config.port}`,
        );
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.subscriptions.clear();
      if (this.wss) {
        // Close all client connections
        for (const client of this.wss.clients) {
          client.close(1000, "Relay shutting down");
        }
        this.wss.close(() => {
          this.db.close();
          this.logger.info("Relay stopped");
          resolve();
        });
      } else {
        this.db.close();
        resolve();
      }
    });
  }

  private handleMessage(ws: WebSocket, msg: ClientMessage, clientId: string) {
    const [type] = msg;

    switch (type) {
      case "EVENT":
        this.handleEvent(ws, msg[1]);
        break;
      case "REQ":
        this.handleReq(ws, msg[1], msg.slice(2) as NostrFilter[], clientId);
        break;
      case "CLOSE":
        this.handleClose(ws, msg[1], clientId);
        break;
      default:
        this.send(ws, ["NOTICE", `Unknown message type: ${type}`]);
    }
  }

  private handleEvent(ws: WebSocket, event: NostrEvent) {
    // Validate event
    const validation = this.validateEvent(event);
    if (!validation.valid) {
      this.send(ws, ["OK", event.id, false, validation.reason!]);
      return;
    }

    // Check allowed kinds
    if (
      this.config.allowedKinds.length > 0 &&
      !this.config.allowedKinds.includes(event.kind)
    ) {
      this.send(ws, [
        "OK",
        event.id,
        false,
        `blocked: kind ${event.kind} not accepted (allowed: ${this.config.allowedKinds.join(", ")})`,
      ]);
      return;
    }

    // Store event
    const result = this.db.storeEvent(event);
    if (result.stored) {
      this.send(ws, ["OK", event.id, true, ""]);

      // Notify matching subscriptions
      this.notifySubscribers(event);

      // Prune if over limit
      this.db.pruneOldest(this.config.maxEvents);

      this.logger.info(
        `Stored event ${event.id.slice(0, 8)}... (kind ${event.kind}, by ${event.pubkey.slice(0, 8)}...)`,
      );
    } else {
      this.send(ws, ["OK", event.id, true, "duplicate: already have this event"]);
    }
  }

  private handleReq(
    ws: WebSocket,
    subscriptionId: string,
    filters: NostrFilter[],
    clientId: string,
  ) {
    const subKey = `${clientId}:${subscriptionId}`;

    // Store subscription
    this.subscriptions.set(subKey, { id: subscriptionId, filters, ws });

    // Send matching stored events
    for (const filter of filters) {
      const events = this.db.queryEvents(filter);
      for (const event of events) {
        this.send(ws, ["EVENT", subscriptionId, event]);
      }
    }

    // Send EOSE (End of Stored Events)
    this.send(ws, ["EOSE", subscriptionId]);
  }

  private handleClose(ws: WebSocket, subscriptionId: string, clientId: string) {
    const subKey = `${clientId}:${subscriptionId}`;
    this.subscriptions.delete(subKey);
    this.send(ws, ["CLOSED", subscriptionId, ""]);
  }

  private validateEvent(event: NostrEvent): { valid: boolean; reason?: string } {
    // Check required fields
    if (!event.id || !event.pubkey || !event.sig || event.kind === undefined) {
      return { valid: false, reason: "invalid: missing required fields" };
    }

    // Verify event id matches content hash (NIP-01)
    const serialized = JSON.stringify([
      0,
      event.pubkey,
      event.created_at,
      event.kind,
      event.tags,
      event.content,
    ]);
    const hash = createHash("sha256").update(serialized).digest("hex");
    if (hash !== event.id) {
      return { valid: false, reason: "invalid: event id does not match hash" };
    }

    // Don't accept events too far in the future (5 min tolerance)
    const now = Math.floor(Date.now() / 1000);
    if (event.created_at > now + 300) {
      return { valid: false, reason: "invalid: event timestamp too far in the future" };
    }

    return { valid: true };
  }

  private notifySubscribers(event: NostrEvent) {
    for (const sub of this.subscriptions.values()) {
      if (sub.ws.readyState !== WebSocket.OPEN) continue;

      for (const filter of sub.filters) {
        if (this.matchesFilter(event, filter)) {
          this.send(sub.ws, ["EVENT", sub.id, event]);
          break; // Only send once per subscription
        }
      }
    }
  }

  private matchesFilter(event: NostrEvent, filter: NostrFilter): boolean {
    if (filter.ids?.length && !filter.ids.includes(event.id)) return false;
    if (filter.authors?.length && !filter.authors.includes(event.pubkey))
      return false;
    if (filter.kinds?.length && !filter.kinds.includes(event.kind)) return false;
    if (filter.since !== undefined && event.created_at < filter.since)
      return false;
    if (filter.until !== undefined && event.created_at > filter.until)
      return false;

    // Tag filters (#d, #t, etc.)
    for (const key of Object.keys(filter)) {
      if (key.startsWith("#") && Array.isArray(filter[key])) {
        const tagName = key.slice(1);
        const filterValues = filter[key] as string[];
        const eventValues = event.tags
          .filter((t) => t[0] === tagName)
          .map((t) => t[1]);
        if (!filterValues.some((v) => eventValues.includes(v))) return false;
      }
    }

    return true;
  }

  private send(ws: WebSocket, msg: RelayMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  // Public stats
  getStats() {
    return {
      events: this.db.getEventCount(),
      authors: this.db.getUniqueAuthors(),
      connections: this.wss?.clients.size ?? 0,
      subscriptions: this.subscriptions.size,
    };
  }

  getRelayInfo() {
    return {
      name: "ClawClawGo Relay",
      description: "Self-hosted Nostr relay for AI agent loadout sharing",
      supported_nips: [1, 11, 33],
      software: "clawclawgo-relay",
      version: "0.1.0",
      limitation: {
        max_message_length: 65536,
        max_event_tags: 100,
        created_at_lower_limit: 0,
        auth_required: false,
      },
      retention: [
        {
          kinds: this.config.allowedKinds,
          count: this.config.maxEvents,
        },
      ],
    };
  }
}
