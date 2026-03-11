export interface SubComponent {
  name: string;
  status: string;
  detail: string;
  icon?: string;
}

export interface SlotData {
  id: string;
  label: string;
  icon: string;
  status: 'active' | 'degraded' | 'offline' | 'empty';
  component: string;
  version?: string;
  details: Record<string, unknown>;
  subComponents: SubComponent[];
}

export interface Loadout {
  schema: number;
  meta: {
    name: string;
    author: string;
    version: number;
    exportedAt: string;
    template?: string;
    tags?: string[];
    description?: string;
  };
  slots: Record<string, {
    label: string;
    status: string;
    component: string;
    version?: string;
    details: Record<string, unknown>;
  }>;
  mods: Mod[];
}

export interface Mod {
  name: string;
  source: 'bundled' | 'custom' | 'plugin' | 'community';
  enabled: boolean;
  version?: string;
  description?: string;
}

export interface SlotDiff {
  slotId: string;
  label: string;
  yours: {
    component: string;
    status: string;
    details: Record<string, unknown>;
  } | null;
  theirs: {
    component: string;
    status: string;
    details: Record<string, unknown>;
  } | null;
  differences: { field: string; yours: unknown; theirs: unknown }[];
}

export interface LoadoutComparison {
  meta: {
    yourName: string;
    theirName: string;
  };
  slotDiffs: SlotDiff[];
  modsOnlyYours: string[];
  modsOnlyTheirs: string[];
  modVersionDiffs: { name: string; yours?: string; theirs?: string }[];
}
