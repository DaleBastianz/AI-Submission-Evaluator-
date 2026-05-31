export type MindMapColor = 'teal' | 'purple' | 'amber' | 'coral' | 'blue';

export type MindMapSubtopic = {
  id: string;
  label: string;
};

export type MindMapBranch = {
  id: string;
  label: string;
  color: MindMapColor;
  subtopics: MindMapSubtopic[];
};

export type MindMapData = {
  root: string;
  branches: MindMapBranch[];
};

const COLORS: MindMapColor[] = ['teal', 'purple', 'amber', 'coral', 'blue'];

export const BRANCH_STYLES: Record<
  MindMapColor,
  { fill: string; border: string; text: string; line: string }
> = {
  teal: { fill: '#0d3d32', border: '#00e5c0', text: '#00e5c0', line: '#00e5c0' },
  purple: { fill: '#1e1040', border: '#a78bfa', text: '#a78bfa', line: '#a78bfa' },
  amber: { fill: '#2d1f00', border: '#fbbf24', text: '#fbbf24', line: '#fbbf24' },
  coral: { fill: '#2d1010', border: '#f87171', text: '#f87171', line: '#f87171' },
  blue: { fill: '#0d2040', border: '#60a5fa', text: '#60a5fa', line: '#60a5fa' }
};

function truncateWords(text: string, maxWords = 5) {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(0, maxWords).join(' ') || 'Topic';
}

function normalizeColor(value: unknown, index: number): MindMapColor {
  const raw = String(value || '').toLowerCase();
  if (COLORS.includes(raw as MindMapColor)) return raw as MindMapColor;
  return COLORS[index % COLORS.length];
}

function normalizeSubtopics(raw: unknown, branchIndex: number): MindMapSubtopic[] {
  if (!Array.isArray(raw)) return [];

  return raw.slice(0, 5).map((item, subIndex) => {
    if (typeof item === 'string') {
      return {
        id: `b${branchIndex}-s${subIndex + 1}`,
        label: truncateWords(item)
      };
    }
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      return {
        id: String(obj.id || `b${branchIndex}-s${subIndex + 1}`),
        label: truncateWords(String(obj.label || obj.topic || ''))
      };
    }
    return {
      id: `b${branchIndex}-s${subIndex + 1}`,
      label: 'Subtopic'
    };
  });
}

/** Normalize Gemini / legacy mind map JSON into chart-ready structure. */
export function normalizeMindMapData(raw: unknown): MindMapData | null {
  if (!raw || typeof raw !== 'object') return null;

  const obj = raw as Record<string, unknown>;
  const root = truncateWords(String(obj.root || ''), 6);
  if (!root) return null;

  if (!Array.isArray(obj.branches) || obj.branches.length === 0) return null;

  const branches: MindMapBranch[] = obj.branches.slice(0, 6).map((branch, index) => {
    if (!branch || typeof branch !== 'object') {
      return {
        id: `b${index + 1}`,
        label: 'Branch',
        color: normalizeColor(null, index),
        subtopics: []
      };
    }

    const b = branch as Record<string, unknown>;
    const label = truncateWords(String(b.label || b.topic || ''));

    const subtopicsRaw = b.subtopics;
    return {
      id: String(b.id || `b${index + 1}`),
      label: label || 'Branch',
      color: normalizeColor(b.color, index),
      subtopics: normalizeSubtopics(subtopicsRaw, index + 1)
    };
  });

  if (!branches.some((b) => b.label)) return null;

  return { root, branches };
}
