const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

const DEFAULT_THEME = {
  primary: '#2563EB',
  secondary: '#1F2937',
  accent: '#3B82F6',
  surface: '#111827',
  text: '#F3F4F6',
  textMuted: '#9CA3AF',
  bubbleUser: '#2563EB',
  bubbleAi: '#374151',
  tagBg: '#374151',
  tagText: '#D1D5DB',
  mood: '默认',
};

function extractJSON(content) {
  if (!content || typeof content !== 'string') return null;

  try {
    return JSON.parse(content);
  } catch {}

  const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) {
    try {
      return JSON.parse(codeBlock[1]);
    } catch {}
  }

  const braceMatch = content.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {}
  }

  return null;
}

function normalizeTheme(raw) {
  const theme = {};
  const source = raw && typeof raw === 'object' ? raw : {};

  for (const key of Object.keys(DEFAULT_THEME)) {
    const value = source[key];
    if (key === 'mood') {
      theme[key] = typeof value === 'string' && value.trim() ? value.trim() : DEFAULT_THEME[key];
    } else {
      theme[key] = typeof value === 'string' && HEX_RE.test(value.trim())
        ? value.trim()
        : DEFAULT_THEME[key];
    }
  }

  return theme;
}

function normalizeStoryline(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((entry) => (
      entry &&
      typeof entry.phase === 'string' &&
      typeof entry.summary === 'string' &&
      Array.isArray(entry.highlights) &&
      typeof entry.mood === 'string'
    ))
    .map((entry) => ({
      phase: entry.phase,
      summary: entry.summary,
      highlights: entry.highlights.filter((item) => typeof item === 'string'),
      mood: entry.mood,
    }));
}

function normalizeAnalysis(raw) {
  return {
    characters: Array.isArray(raw?.characters) ? raw.characters : [],
    plotSummary: typeof raw?.plotSummary === 'string' ? raw.plotSummary : '',
    timeline: Array.isArray(raw?.timeline) ? raw.timeline : [],
    relationships: Array.isArray(raw?.relationships) ? raw.relationships : [],
    storyline: normalizeStoryline(raw?.storyline),
    theme: normalizeTheme(raw?.theme),
  };
}

module.exports = {
  DEFAULT_THEME,
  extractJSON,
  normalizeAnalysis,
  normalizeTheme,
};
