import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle, Color, FontFamily, FontSize } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef, useState } from 'react'

const FONTS = ['Nunito', 'Georgia', 'Arial', 'Courier New', 'Times New Roman', 'Verdana']
const SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px']
const TEXT_COLORS = ['#f0e6ff', '#c084fc', '#f9a8d4', '#93c5fd', '#5eead4', '#fde68a', '#fca5a5', '#ffffff']
const HIGHLIGHT_COLORS = ['#c084fc44', '#f9a8d444', '#93c5fd44', '#5eead444', '#fde68a44', '#fca5a544']

function ToolBtn({ onClick, active, title, children, style }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className="flex items-center justify-center rounded-lg transition-all hover:scale-105 active:scale-95"
      style={{
        minWidth: 28, height: 28, padding: '0 6px',
        background: active ? 'rgba(192,132,252,0.25)' : 'transparent',
        border: active ? '1px solid rgba(192,132,252,0.4)' : '1px solid transparent',
        color: active ? '#c084fc' : '#d4b8ff',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div style={{ width: 1, height: 20, background: 'rgba(192,132,252,0.15)', margin: '0 2px', flexShrink: 0 }} />
}

function ColorPicker({ colors, onSelect, currentColor, label }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o) }}
        title={label}
        className="flex items-center gap-1 rounded-lg px-1.5 h-7 transition-all hover:bg-white/10"
        style={{ color: '#d4b8ff', fontSize: 11, fontWeight: 700, border: '1px solid transparent', cursor: 'pointer' }}
      >
        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: currentColor || '#f0e6ff', border: '1px solid rgba(255,255,255,0.2)' }} />
        <span style={{ fontSize: 9 }}>▾</span>
      </button>
      {open && (
        <div
          className="absolute top-8 left-0 z-50 p-2 rounded-xl flex flex-wrap gap-1.5"
          style={{ background: 'rgba(15,0,35,0.97)', border: '1px solid rgba(192,132,252,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 120 }}
        >
          {colors.map(c => (
            <button
              key={c}
              type="button"
              onMouseDown={e => { e.preventDefault(); onSelect(c); setOpen(false) }}
              style={{ width: 20, height: 20, borderRadius: 4, background: c, border: c === currentColor ? '2px solid white' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Dropdown({ value, options, onChange, width = 90 }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onMouseDown={e => e.stopPropagation()}
      style={{
        background: 'rgba(20,0,45,0.9)',
        border: '1px solid rgba(192,132,252,0.2)',
        borderRadius: 8,
        color: '#d4b8ff',
        fontSize: 11,
        padding: '2px 4px',
        height: 28,
        width,
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  )
}

export default function RichEditor({ content, onChange, placeholder = 'Schreibe deine Notiz…' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      FontFamily,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: 'outline:none; min-height:300px; padding: 20px 24px; color:#f0e6ff; font-family:"Nunito",sans-serif; font-size:15px; line-height:1.8;',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    if (content !== editor.getHTML()) editor.commands.setContent(content || '', false)
  }, [content])

  if (!editor) return null

  const activeFont = editor.getAttributes('textStyle').fontFamily || 'Nunito'
  const activeSize = editor.getAttributes('textStyle').fontSize || '15px'
  const activeColor = editor.getAttributes('textStyle').color || null
  const activeHL    = editor.getAttributes('highlight').color || null

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'rgba(8,0,20,0.7)' }}>
      {/* Toolbar */}
      <div
        className="flex items-center gap-0.5 px-3 py-1.5 flex-wrap flex-shrink-0"
        style={{ background: 'rgba(14,0,32,0.95)', borderBottom: '1px solid rgba(192,132,252,0.15)', minHeight: 44 }}
      >
        {/* Font family */}
        <Dropdown
          value={activeFont}
          options={FONTS.map(f => ({ value: f, label: f }))}
          onChange={f => editor.chain().focus().setFontFamily(f).run()}
          width={100}
        />
        {/* Font size */}
        <Dropdown
          value={activeSize}
          options={SIZES.map(s => ({ value: s, label: s.replace('px', '') }))}
          onChange={s => editor.chain().focus().setFontSize(s).run()}
          width={54}
        />
        <Sep />

        {/* Text formatting */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Fett (Ctrl+B)" style={{ fontWeight: 900 }}>B</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Kursiv (Ctrl+I)" style={{ fontStyle: 'italic' }}>I</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Unterstrichen (Ctrl+U)" style={{ textDecoration: 'underline' }}>U</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Durchgestrichen" style={{ textDecoration: 'line-through' }}>S</ToolBtn>
        <Sep />

        {/* Headings */}
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Überschrift 1">H1</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Überschrift 2">H2</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Überschrift 3">H3</ToolBtn>
        <Sep />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Aufzählung">•</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Nummerierung">1.</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Checkliste">☑</ToolBtn>
        <Sep />

        {/* Alignment */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()}   active={editor.isActive({ textAlign: 'left' })}   title="Links">⬅</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Mitte">⬛</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()}  active={editor.isActive({ textAlign: 'right' })}  title="Rechts">➡</ToolBtn>
        <Sep />

        {/* Color */}
        <ColorPicker
          label="Textfarbe"
          colors={TEXT_COLORS}
          currentColor={activeColor}
          onSelect={c => editor.chain().focus().setColor(c).run()}
        />
        <ColorPicker
          label="Hintergrundfarbe"
          colors={HIGHLIGHT_COLORS}
          currentColor={activeHL}
          onSelect={c => editor.chain().focus().setHighlight({ color: c }).run()}
        />
        <Sep />

        {/* Extras */}
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Code">&lt;/&gt;</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code-Block">{ }</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Trennlinie">—</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Rückgängig (Ctrl+Z)">↩</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Wiederholen (Ctrl+Y)">↪</ToolBtn>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* Styles for editor content */}
      <style>{`
        .tiptap { outline: none; min-height: 100%; }
        .tiptap h1 { font-size: 1.8rem; font-weight: 900; color: #c084fc; margin: 0.8em 0 0.4em; }
        .tiptap h2 { font-size: 1.3rem; font-weight: 800; color: #f9a8d4; margin: 0.7em 0 0.3em; }
        .tiptap h3 { font-size: 1.1rem; font-weight: 700; color: #93c5fd; margin: 0.5em 0 0.25em; }
        .tiptap p  { margin: 0.3em 0; }
        .tiptap strong { color: #fde68a; font-weight: 800; }
        .tiptap em { color: #f9a8d4; }
        .tiptap code { background: rgba(192,132,252,0.15); padding: 1px 6px; border-radius: 4px; color: #5eead4; font-family: monospace; font-size: 0.88em; }
        .tiptap pre  { background: rgba(192,132,252,0.1); padding: 12px 16px; border-radius: 10px; margin: 0.6em 0; border: 1px solid rgba(192,132,252,0.2); }
        .tiptap pre code { background: none; padding: 0; color: #5eead4; }
        .tiptap ul  { padding-left: 1.4em; margin: 0.4em 0; }
        .tiptap ol  { padding-left: 1.4em; margin: 0.4em 0; }
        .tiptap li  { margin: 0.15em 0; }
        .tiptap hr  { border: none; border-top: 1px solid rgba(192,132,252,0.2); margin: 1em 0; }
        .tiptap blockquote { border-left: 3px solid #c084fc; padding-left: 14px; opacity: 0.75; margin: 0.6em 0; font-style: italic; }
        .tiptap ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .tiptap ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 8px; }
        .tiptap ul[data-type="taskList"] li > label { margin-top: 2px; }
        .tiptap ul[data-type="taskList"] li > label input[type="checkbox"] { accent-color: #c084fc; width: 15px; height: 15px; cursor: pointer; }
        .tiptap .is-editor-empty:before { content: attr(data-placeholder); color: rgba(192,132,252,0.3); pointer-events: none; float: left; height: 0; }
        .tiptap mark { border-radius: 3px; padding: 0 2px; }
        .tiptap a { color: #93c5fd; text-decoration: underline; }
      `}</style>
    </div>
  )
}
