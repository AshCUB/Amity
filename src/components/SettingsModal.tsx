import { useEffect } from 'react'
import { PAPERS, resetDemoData, useSettings, type Paper, type TextSize } from '../settings'
import { SparkleIcon } from './Icons'

const sizes: { id: TextSize; label: string }[] = [
  { id: 'sm', label: 'Small' },
  { id: 'md', label: 'Medium' },
  { id: 'lg', label: 'Large' },
  { id: 'xl', label: 'Extra large' },
]

export default function SettingsModal() {
  const { settings, update, open, setOpen } = useSettings()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open) return null

  const reset = () => {
    if (!confirm('This clears your notes, replies, reading progress, and settings saved in this browser. Continue?')) return
    resetDemoData()
    window.location.href = '/'
  }

  return (
    <div className="modal-backdrop" onMouseDown={() => setOpen(false)}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={(e) => e.stopPropagation()}>
        <button className="note-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        <h2 id="settings-title"><SparkleIcon size={16} /> Settings</h2>

        <label className="field">
          <span className="subheader">Your name</span>
          <input
            className="text-input"
            value={settings.name}
            maxLength={40}
            onChange={(e) => update({ name: e.target.value })}
            onBlur={(e) => !e.target.value.trim() && update({ name: 'Reader' })}
          />
        </label>

        <div className="field">
          <span className="subheader">Reading text size</span>
          <div className="segmented">
            {sizes.map((s) => (
              <button key={s.id} className={settings.textSize === s.id ? 'active' : ''} onClick={() => update({ textSize: s.id })}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="subheader">Page color</span>
          <div className="swatches">
            {(Object.keys(PAPERS) as Paper[]).map((p) => (
              <button
                key={p}
                className={`swatch ${settings.paper === p ? 'active' : ''}`}
                style={{ background: PAPERS[p] }}
                onClick={() => update({ paper: p })}
                aria-label={p}
              >
                <span>{p}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="field toggle-row">
          <span>
            <span className="subheader">Show friends' notes</span>
            <span className="hint">Squiggly underlines for notes your friends left.</span>
          </span>
          <input type="checkbox" className="toggle" checked={settings.showFriendNotes} onChange={(e) => update({ showFriendNotes: e.target.checked })} />
        </label>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={reset}>Reset demo data</button>
          <button className="btn btn-primary" onClick={() => setOpen(false)}>Done</button>
        </div>
      </div>
    </div>
  )
}
