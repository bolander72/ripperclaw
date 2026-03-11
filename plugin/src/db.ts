import Database from "better-sqlite3";
import type { NostrEvent } from "./types.js";

export class RelayDB {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        pubkey TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        kind INTEGER NOT NULL,
        tags TEXT NOT NULL,
        content TEXT NOT NULL,
        sig TEXT NOT NULL,
        d_tag TEXT,
        received_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE INDEX IF NOT EXISTS idx_events_kind ON events(kind);
      CREATE INDEX IF NOT EXISTS idx_events_pubkey ON events(pubkey);
      CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
      CREATE INDEX IF NOT EXISTS idx_events_d_tag ON events(d_tag);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_events_replaceable
        ON events(kind, pubkey, d_tag) WHERE d_tag IS NOT NULL;
    `);
  }

  storeEvent(event: NostrEvent): { stored: boolean; replaced?: string } {
    const dTag = event.tags.find((t) => t[0] === "d")?.[1] ?? null;

    // For parameterized replaceable events (30000-39999), replace older versions
    if (event.kind >= 30000 && event.kind < 40000 && dTag !== null) {
      const existing = this.db
        .prepare(
          "SELECT id, created_at FROM events WHERE kind = ? AND pubkey = ? AND d_tag = ?",
        )
        .get(event.kind, event.pubkey, dTag) as
        | { id: string; created_at: number }
        | undefined;

      if (existing) {
        if (existing.created_at >= event.created_at) {
          return { stored: false }; // Older or same timestamp, skip
        }
        // Replace with newer event
        this.db.prepare("DELETE FROM events WHERE id = ?").run(existing.id);
      }
    }

    try {
      this.db
        .prepare(
          `INSERT INTO events (id, pubkey, created_at, kind, tags, content, sig, d_tag)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          event.id,
          event.pubkey,
          event.created_at,
          event.kind,
          JSON.stringify(event.tags),
          event.content,
          event.sig,
          dTag,
        );
      return { stored: true };
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message.includes("UNIQUE constraint failed")
      ) {
        return { stored: false };
      }
      throw err;
    }
  }

  queryEvents(filter: {
    kinds?: number[];
    authors?: string[];
    ids?: string[];
    since?: number;
    until?: number;
    limit?: number;
    "#d"?: string[];
  }): NostrEvent[] {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.kinds?.length) {
      conditions.push(
        `kind IN (${filter.kinds.map(() => "?").join(",")})`,
      );
      params.push(...filter.kinds);
    }

    if (filter.authors?.length) {
      conditions.push(
        `pubkey IN (${filter.authors.map(() => "?").join(",")})`,
      );
      params.push(...filter.authors);
    }

    if (filter.ids?.length) {
      conditions.push(
        `id IN (${filter.ids.map(() => "?").join(",")})`,
      );
      params.push(...filter.ids);
    }

    if (filter["#d"]?.length) {
      conditions.push(
        `d_tag IN (${filter["#d"].map(() => "?").join(",")})`,
      );
      params.push(...filter["#d"]);
    }

    if (filter.since !== undefined) {
      conditions.push("created_at >= ?");
      params.push(filter.since);
    }

    if (filter.until !== undefined) {
      conditions.push("created_at <= ?");
      params.push(filter.until);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";
    const limit = filter.limit ?? 100;

    const rows = this.db
      .prepare(
        `SELECT id, pubkey, created_at, kind, tags, content, sig
       FROM events ${where}
       ORDER BY created_at DESC
       LIMIT ?`,
      )
      .all(...params, limit) as Array<{
      id: string;
      pubkey: string;
      created_at: number;
      kind: number;
      tags: string;
      content: string;
      sig: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      pubkey: row.pubkey,
      created_at: row.created_at,
      kind: row.kind,
      tags: JSON.parse(row.tags),
      content: row.content,
      sig: row.sig,
    }));
  }

  getEventCount(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) as count FROM events")
      .get() as { count: number };
    return row.count;
  }

  getUniqueAuthors(): number {
    const row = this.db
      .prepare("SELECT COUNT(DISTINCT pubkey) as count FROM events")
      .get() as { count: number };
    return row.count;
  }

  pruneOldest(maxEvents: number): number {
    const count = this.getEventCount();
    if (count <= maxEvents) return 0;

    const toDelete = count - maxEvents;
    this.db
      .prepare(
        `DELETE FROM events WHERE id IN (
        SELECT id FROM events ORDER BY created_at ASC LIMIT ?
      )`,
      )
      .run(toDelete);
    return toDelete;
  }

  close() {
    this.db.close();
  }
}
