export interface SubComponent {
  name: string;
  status: string;
  detail: string;
  icon?: string;
}

export interface BlockData {
  id: string;
  label: string;
  icon: string;
  status: 'active' | 'degraded' | 'offline' | 'empty';
  component: string;
  version?: string;
  details: Record<string, unknown>;
  subComponents: SubComponent[];
}

export interface Build {
  schema: 2;
  meta: {
    name: string;
    agentName: string;
    description?: string;
    author: string;
    version: number;
    exportedAt: string;
    openclawVersion?: string;
    tags?: string[];
  };
  blocks: {
    model?: BlockContent;
    persona?: BlockContent;
    skills?: BlockContent;
    integrations?: BlockContent;
    automations?: BlockContent;
    memory?: BlockContent;
    [key: string]: BlockContent | undefined;
  };
}

export interface BlockContent {
  label?: string;
  status?: string;
  component?: string;
  version?: string;
  details?: Record<string, unknown>;
  items?: unknown[];
  [key: string]: unknown;
}

export interface SkillItem {
  name: string;
  source: 'bundled' | 'custom' | 'clawhub' | 'local';
  enabled?: boolean;
  version?: string;
  description?: string;
}

export interface BlockDiff {
  blockId: string;
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

export interface BuildComparison {
  meta: {
    yourName: string;
    theirName: string;
  };
  blockDiffs: BlockDiff[];
  skillsOnlyYours: string[];
  skillsOnlyTheirs: string[];
  skillVersionDiffs: { name: string; yours?: string; theirs?: string }[];
  integrationsOnlyYours: string[];
  integrationsOnlyTheirs: string[];
}
