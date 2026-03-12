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

export interface FeedRig {
  id: string;
  name: string;
  author: string;
  content: string;
  tags: string[];
  published_at: number;
  template: string | null;
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
  const [feed, setFeed] = useState<FeedRig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async (limit?: number, relayUrls?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const rigs = await invoke<FeedRig[]>('nostr_fetch_feed', { limit, relayUrls });
      setFeed(rigs);
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

  const publish = async (loadoutJson: string, loadoutName: string, tags: string[]) => {
    setPublishing(true);
    try {
      const result = await invoke<PublishResult>('nostr_publish_loadout', {
        loadoutJson,
        loadoutName,
        tags,
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
      const result = await invoke<[unknown, ScrubReport]>('export_loadout_safe', {
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

  useEffect(() => {
    invoke<RelayInfo[]>('nostr_get_relays')
      .then(setRelays)
      .catch(console.error);
  }, []);

  return { relays };
}
