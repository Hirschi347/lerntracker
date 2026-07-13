import { useRef, useCallback } from 'react'

const TOOLS = [
  { label: 'B', title: 'Fett (Ctrl+B)', style: { fontWeight: 900 }, wrap: ['**', '**'] },
  { label: 'I', title: 'Kursiv (Ctrl+I)', style: { fontStyle: 'italic' }, wrap: ['*', '*'] },
  { label: 'H1', title: 'Überschrift 1', wrap: ['# ', ''] },
  { label: 'H2', title: 'Überschrift 2', wrap: ['## ', ''] },
  { label: '•', title: 'Liste', wrap: ['- ', ''] },
  { label: '[ ]', title: 'Checkbox', wrap: ['- [ ] ', ''] },
  { label: '<>', title: 'Code', wrap: ['`', '`'] },
  { label: '---', title: 'Trennlinie', insert: '\n\n---\n\n' },
]

export default function MarkdownEditor({ value, onChange, placeholder, minHeight = 220, className = '' }) {
  const ref = useRef(null)

  const insertText = useCallback((tool) => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end)

    let newText, newStart, newEnd

    if (tool.insert) {
      newText = value.slice(0, start) + tool.insert + value.slice(end)
      newStart = newEnd = start + tool.insert.length
    } else {
      const [before, after] = tool.wrap
      if (after) {
        newText = value.slice(0, start) + before + selected + after + value.slice(end)
        newStart = start + before.length
        newEnd = newStart + selected.length
      } else {
        // prefix mode (headings, lists) — apply to start of line
        const lineStart = value.lastIndexOf('\n', start - 1) + 1
        newText = value.slice(0, lineStart) + before + value.slice(lineStart)
        newStart = start + before.length
        newEnd = end + before.length
      }
    }

    onChange(newText)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(newStart, newEnd)
    })
  }, [value, onChange])

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); insertText(TOOLS[0]) }
      if (e.key === 'i') { e.preventDefault(); insertText(TOOLS[1]) }
    }
    // Auto-indent lists on Enter
    if (e.key === 'Enter') {
      const el = ref.current
      const pos = el.selectionStart
      const lineStart = value.lastIndexOf('\n', pos - 1) + 1
      const line = value.slice(lineStart, pos)
      const listMatch = line.match(/^(- |\d+\. |- \[[ x]\] )/)
      if (listMatch) {
        e.preventDefault()
        const prefix = listMatch[0]
        const insert = '\n' + prefix
        onChange(value.slice(0, pos) + insert + value.slice(pos))
        requestAnimationFrame(() => {
          el.focus()
          el.setSelectionRange(pos + insert.length, pos + insert.length)
        })
      }
    }
    // Tab inserts spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = ref.current
      const pos = el.selectionStart
      onChange(value.slice(0, pos) + '  ' + value.slice(pos))
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(pos + 2, pos + 2)
      })
    }
  }, [value, onChange, insertText])

  return (
    <div className={`flex flex-col overflow-hidden ${className}`} style={{ border: '1px solid rgba(192,132,252,0.15)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap" style={{ background: 'rgba(20,0,45,0.9)', borderBottom: '1px solid rgba(192,132,252,0.15)' }}>
        {TOOLS.map((tool, i) => (
          <button
            key={i}
            type="button"
            title={tool.title}
            onClick={() => insertText(tool)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all hover:bg-white/10 active:scale-95"
            style={{ color: '#c084fc', minWidth: 28, ...tool.style }}
          >
            {tool.label}
          </button>
        ))}
        <div className="ml-auto text-xs opacity-30 pr-1" style={{ color: '#c084fc' }}>Markdown</div>
      </div>

      {/* Textarea */}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          minHeight: minHeight || 0,
          flex: 1,
          background: 'rgba(8,0,20,0.7)',
          color: '#f0e6ff',
          padding: '16px 20px',
          resize: 'none',
          outline: 'none',
          border: 'none',
          fontFamily: '"Nunito", sans-serif',
          fontSize: '0.92rem',
          lineHeight: 1.75,
          width: '100%',
        }}
      />
    </div>
  )
}
