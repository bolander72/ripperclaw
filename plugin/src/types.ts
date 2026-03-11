export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  limit?: number;
  [key: string]: unknown; // For tag filters like #d, #t, etc.
}

export interface RelayConfig {
  port: number;
  host: string;
  dbPath: string;
  maxEvents: number;
  allowedKinds: number[];
  publicRelays: string[];
}

// NIP-01 client message types
export type ClientMessage =
  | ["EVENT", NostrEvent]
  | ["REQ", string, ...NostrFilter[]]
  | ["CLOSE", string];

// NIP-01 relay message types
export type RelayMessage =
  | ["EVENT", string, NostrEvent]
  | ["OK", string, boolean, string]
  | ["EOSE", string]
  | ["NOTICE", string]
  | ["CLOSED", string, string];
