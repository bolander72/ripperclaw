import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect, useCallback } from 'react';

export interface KeyInfo {
  npub: string;
  npub_short: string;
  has_keys: boolean;
}

export interface StoredKeys {
  nsec: string;
  npub: string;
}

export interface NostrProfile {
  name: string;
  display_name: string;
  about: string;
  picture: string;
  website: string;
  nip05: string;
  banner: string;
}

export interface PublishResult {
  event_id: string;
  relays_sent: number;
  relays_failed: number;
}

export interface FeedBuild {
  id: string;
  name: string;
  author: string;
  author_hex: string;
  content: string;
  tags: string[];
  published_at: number;
  template: string | null;
  fork_of: string | null;
  fork_author: string | null;
  publish_type: string;
  section_type: string | null;
}

export interface RelayInfo {
  url: string;
  connected: boolean;
}

export function useNostrKeys() {
  const [keys, setKeys] = useState<KeyInfo>({ npub: '', npub_short: '', has_keys: false });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const info = await invoke<KeyInfo>('nostr_get_keys');
      setKeys(info);
    } catch (err) {
      console.error('Failed to get keys:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const generate = async () => {
    try {
      const info = await invoke<KeyInfo>('nostr_generate_keys');
      setKeys(info);
      return info;
    } catch (err) {
      console.error('Failed to generate keys:', err);
      throw err;
    }
  };

  const importKey = async (nsec: string) => {
    try {
      const info = await invoke<KeyInfo>('nostr_import_keys', { nsec });
      setKeys(info);
      return info;
    } catch (err) {
      console.error('Failed to import keys:', err);
      throw err;
    }
  };

  const exportKeys = async (): Promise<StoredKeys> => {
    return invoke<StoredKeys>('nostr_export_keys');
  };

  return { keys, loading, generate, importKey, exportKeys, refresh };
}

export function useNostrProfile() {
  const [profile, setProfile] = useState<NostrProfile>({
    name: '', display_name: '', about: '', picture: '', website: '', nip05: '', banner: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    invoke<NostrProfile>('nostr_get_profile')
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (updated: NostrProfile) => {
    setSaving(true);
    try {
      await invoke<string>('nostr_set_profile', { profile: updated });
      setProfile(updated);
    } finally {
      setSaving(false);
    }
  };

  return { profile, loading, saving, saveProfile, setProfile };
}

export function useNostrFeed() {
  const [feed, setFeed] = useState<FeedBuild[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async (limit?: number, relayUrls?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const items = await invoke<FeedBuild[]>('nostr_fetch_feed', { limit, relayUrls });
      setFeed(items);
    } catch (err) {
      const msg = String(err);
      setError(msg);
      console.error('Failed to fetch feed:', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { feed, loading, error, fetchFeed };
}

export function useNostrPublish() {
  const [publishing, setPublishing] = useState(false);

  const publish = async (
    buildJson: string,
    buildName: string,
    tags: string[],
    forkOf?: string,
    forkAuthor?: string,
  ) => {
    setPublishing(true);
    try {
      const result = await invoke<PublishResult>('nostr_publish_build', {
        buildJson,
        buildName,
        tags,
        forkOf: forkOf || null,
        forkAuthor: forkAuthor || null,
        publishType: 'build',
        blockType: null,
      });
      return result;
    } catch (err) {
      console.error('Failed to publish:', err);
      throw err;
    } finally {
      setPublishing(false);
    }
  };

  return { publish, publishing };
}

export interface ScrubReport {
  scrubbed_fields: string[];
  warnings: string[];
}

export function useSafeExport() {
  const [exporting, setExporting] = useState(false);

  const exportSafe = async (
    template?: string,
    description?: string,
    tags?: string[],
  ): Promise<[unknown, ScrubReport]> => {
    setExporting(true);
    try {
      const result = await invoke<[unknown, ScrubReport]>('export_build_safe', {
        template: template || null,
        description: description || null,
        tags: tags || null,
      });
      return result;
    } catch (err) {
      console.error('Failed to export:', err);
      throw err;
    } finally {
      setExporting(false);
    }
  };

  return { exportSafe, exporting };
}

export function useNostrRelays() {
  const [relays, setRelays] = useState<RelayInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await invoke<RelayInfo[]>('nostr_get_relays');
      setRelays(list);
    } catch (err) {
      console.error('Failed to get relays:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addRelay = async (url: string) => {
    const updated = await invoke<RelayInfo[]>('nostr_add_relay', { url });
    setRelays(updated);
    return updated;
  };

  const removeRelay = async (url: string) => {
    const updated = await invoke<RelayInfo[]>('nostr_remove_relay', { url });
    setRelays(updated);
    return updated;
  };

  return { relays, loading, addRelay, removeRelay, refresh };
}
