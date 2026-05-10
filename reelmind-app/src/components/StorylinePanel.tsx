import type { StorylineEntry } from '../types/analysis'

interface StorylinePanelProps {
  storyline?: StorylineEntry[]
}

function MoodBadge({ mood }: { mood: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{
        backgroundColor: 'var(--theme-tagBg, #374151)',
        color: 'var(--theme-tagText, #D1D5DB)',
      }}
    >
      {mood}
    </span>
  )
}

function HighlightTag({ text }: { text: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-md text-[11px]"
      style={{
        backgroundColor: 'var(--theme-secondary, #1F2937)',
        color: 'var(--theme-textMuted, #9CA3AF)',
      }}
    >
      {text}
    </span>
  )
}

export default function StorylinePanel({ storyline }: StorylinePanelProps) {
  if (!storyline || storyline.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <p className="text-3xl mb-2">📖</p>
        <p className="text-sm" style={{ color: 'var(--theme-textMuted, #9CA3AF)' }}>
          暂无故事线数据
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--theme-textMuted, #6B7280)' }}>
          该视频为旧数据，未生成故事发展线
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
      {storyline.map((entry, idx) => (
        <div
          key={idx}
          className="rounded-xl p-3 space-y-2"
          style={{
            backgroundColor: 'var(--theme-surface, #111827)',
            borderLeft: `3px solid var(--theme-primary, #2563EB)`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <h4
              className="text-sm font-semibold flex-1"
              style={{ color: 'var(--theme-text, #F3F4F6)' }}
            >
              {entry.phase}
            </h4>
            <MoodBadge mood={entry.mood} />
          </div>

          <p
            className="text-[13px] leading-relaxed"
            style={{ color: 'var(--theme-textMuted, #9CA3AF)' }}
          >
            {entry.summary}
          </p>

          {entry.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {entry.highlights.map((h, hIdx) => (
                <HighlightTag key={hIdx} text={h} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
