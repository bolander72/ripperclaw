import { ClawClawGoRelay } from "./src/relay.js";
import type { RelayConfig } from "./src/types.js";
import { homedir } from "os";
import { join } from "path";

let relay: ClawClawGoRelay | null = null;

export default function register(api: any) {
  const logger = api.logger ?? {
    info: (...args: unknown[]) => console.log("[clawclawgo-relay]", ...args),
    error: (...args: unknown[]) => console.error("[clawclawgo-relay]", ...args),
  };

  // Resolve config with defaults
  function getConfig(): RelayConfig {
    const pluginConfig =
      api.config?.loadConfig?.()?.plugins?.entries?.["clawclawgo-relay"]
        ?.config ?? {};

    return {
      port: pluginConfig.port ?? 7447,
      host: pluginConfig.host ?? "0.0.0.0",
      dbPath:
        pluginConfig.dbPath ??
        join(homedir(), ".openclaw", "clawclawgo-relay.db"),
      maxEvents: pluginConfig.maxEvents ?? 10000,
      allowedKinds: pluginConfig.allowedKinds ?? [38333],
      publicRelays: pluginConfig.publicRelays ?? [],
    };
  }

  // Background service: starts relay on gateway start, stops on shutdown
  api.registerService({
    id: "clawclawgo-relay",
    async start() {
      const config = getConfig();
      relay = new ClawClawGoRelay(config, logger);
      await relay.start();
      logger.info(
        `Relay service started on ws://${config.host}:${config.port}`,
      );
    },
    async stop() {
      if (relay) {
        await relay.stop();
        relay = null;
        logger.info("Relay service stopped");
      }
    },
  });

  // Gateway RPC: status
  api.registerGatewayMethod(
    "clawclawgo-relay.status",
    ({ respond }: { respond: (ok: boolean, data: unknown) => void }) => {
      if (!relay) {
        respond(true, { running: false });
        return;
      }
      const stats = relay.getStats();
      respond(true, { running: true, ...stats });
    },
  );

  // Gateway RPC: relay info (NIP-11)
  api.registerGatewayMethod(
    "clawclawgo-relay.info",
    ({ respond }: { respond: (ok: boolean, data: unknown) => void }) => {
      if (!relay) {
        respond(false, { error: "Relay not running" });
        return;
      }
      respond(true, relay.getRelayInfo());
    },
  );

  // HTTP route: NIP-11 relay information document
  api.registerHttpRoute({
    path: "/clawclawgo/relay",
    auth: "plugin",
    match: "exact",
    handler: async (
      req: { headers: Record<string, string> },
      res: {
        statusCode: number;
        setHeader: (k: string, v: string) => void;
        end: (body?: string) => void;
      },
    ) => {
      if (!relay) {
        res.statusCode = 503;
        res.end(JSON.stringify({ error: "Relay not running" }));
        return true;
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/nostr+json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(JSON.stringify(relay.getRelayInfo()));
      return true;
    },
  });

  // HTTP route: relay stats
  api.registerHttpRoute({
    path: "/clawclawgo/stats",
    auth: "plugin",
    match: "exact",
    handler: async (
      _req: unknown,
      res: {
        statusCode: number;
        setHeader: (k: string, v: string) => void;
        end: (body?: string) => void;
      },
    ) => {
      if (!relay) {
        res.statusCode = 503;
        res.end(JSON.stringify({ running: false }));
        return true;
      }

      const stats = relay.getStats();
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(JSON.stringify({ running: true, ...stats }));
      return true;
    },
  });

  // CLI command: clawclawgo-relay status
  api.registerCli(
    ({ program }: { program: any }) => {
      const cmd = program
        .command("clawclawgo-relay")
        .description("ClawClawGo Nostr relay management");

      cmd
        .command("status")
        .description("Show relay status and stats")
        .action(async () => {
          if (!relay) {
            console.log("Relay is not running");
            return;
          }
          const stats = relay.getStats();
          const info = relay.getRelayInfo();
          console.log(`${info.name} v${info.version}`);
          console.log(`Status: running`);
          console.log(`Events: ${stats.events}`);
          console.log(`Authors: ${stats.authors}`);
          console.log(`Connections: ${stats.connections}`);
          console.log(`Active subscriptions: ${stats.subscriptions}`);
          console.log(`Accepted kinds: ${getConfig().allowedKinds.join(", ")}`);
        });
    },
    { commands: ["clawclawgo-relay"] },
  );
}
