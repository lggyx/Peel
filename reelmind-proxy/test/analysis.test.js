const assert = require('node:assert/strict');
const test = require('node:test');
const {
  DEFAULT_THEME,
  extractJSON,
  normalizeAnalysis,
  normalizeTheme,
} = require('../analysis');

test('extractJSON parses direct JSON', () => {
  assert.deepEqual(extractJSON('{"plotSummary":"ok"}'), { plotSummary: 'ok' });
});

test('extractJSON parses fenced JSON', () => {
  const content = '```json\n{"characters":[]}\n```';
  assert.deepEqual(extractJSON(content), { characters: [] });
});

test('extractJSON extracts JSON object from surrounding text', () => {
  const content = '分析结果如下：{"timeline":[{"time":"00:01","event":"开始"}]}';
  assert.deepEqual(extractJSON(content), {
    timeline: [{ time: '00:01', event: '开始' }],
  });
});

test('extractJSON returns null for invalid content', () => {
  assert.equal(extractJSON('not json'), null);
});

test('normalizeTheme fills missing and invalid colors', () => {
  const theme = normalizeTheme({
    primary: 'blue',
    accent: '#AABBCC',
    mood: '史诗',
  });

  assert.equal(theme.primary, DEFAULT_THEME.primary);
  assert.equal(theme.accent, '#AABBCC');
  assert.equal(theme.surface, DEFAULT_THEME.surface);
  assert.equal(theme.mood, '史诗');
});

test('normalizeAnalysis returns complete fallback shape', () => {
  const analysis = normalizeAnalysis({});

  assert.deepEqual(analysis.characters, []);
  assert.deepEqual(analysis.timeline, []);
  assert.deepEqual(analysis.relationships, []);
  assert.deepEqual(analysis.storyline, []);
  assert.equal(analysis.theme.primary, DEFAULT_THEME.primary);
});

test('normalizeAnalysis filters invalid storyline entries and highlights', () => {
  const analysis = normalizeAnalysis({
    storyline: [
      { phase: '第一幕', summary: '开篇', highlights: ['节点', 1], mood: '紧张' },
      { phase: '坏数据' },
    ],
  });

  assert.equal(analysis.storyline.length, 1);
  assert.deepEqual(analysis.storyline[0].highlights, ['节点']);
});
