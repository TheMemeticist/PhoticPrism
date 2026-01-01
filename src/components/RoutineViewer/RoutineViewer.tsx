// ============================================
// Routine Viewer Component (Card-Based)
// ============================================
// Displays the daily routine blocks as fully editable cards

import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { ScheduleBlock } from '../../types'
import './RoutineViewer.css'

interface EditState {
  blockId: string
  field: 'slotType' | 'hz' | 'color' | 'link'
  value: string
}

export function RoutineViewer() {
  const schedule = useAppStore((s) => s.schedule)
  const setDojoWindow = useAppStore((s) => s.setDojoWindow)
  const updateScheduleBlock = useAppStore((s) => s.updateScheduleBlock)
  const setFlickerHz = useAppStore((s) => s.setFlickerHz)
  const setColors = useAppStore((s) => s.setColors)
  
  const [editState, setEditState] = useState<EditState | null>(null)

  // Use randomized blocks if available, otherwise use today's routine
  const blocks = schedule?.randomizedBlocks?.length > 0 
    ? schedule.randomizedBlocks 
    : schedule?.todayRoutine || []

  if (!blocks || blocks.length === 0) {
    return null
  }

  const handleJumpTo = (blockId: string) => {
    // Find the index of this block in the routine
    const blockIndex = blocks.findIndex(b => b.id === blockId)
    
    if (blockIndex === -1) return
    
    // Use goToActivity to properly update trainer mode state
    const goToActivity = useAppStore.getState().goToActivity
    goToActivity(blockIndex)
  }

  const handleStartEdit = (blockId: string, field: EditState['field'], currentValue: string) => {
    setEditState({ blockId, field, value: currentValue })
  }

  const handleSaveEdit = () => {
    if (!editState) return
    
    const { blockId, field, value } = editState
    
    switch (field) {
      case 'slotType':
        updateScheduleBlock(blockId, { slotType: value })
        break
      case 'hz':
        const hz = parseFloat(value)
        if (!isNaN(hz) && hz > 0) {
          updateScheduleBlock(blockId, {
            metadata: { brainwaveHz: hz, onColor: blocks.find(b => b.id === blockId)?.metadata?.onColor || '#ffffff' }
          })
        }
        break
      case 'color':
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
          updateScheduleBlock(blockId, {
            metadata: { onColor: value, brainwaveHz: blocks.find(b => b.id === blockId)?.metadata?.brainwaveHz || 10 }
          })
        }
        break
      case 'link':
        updateScheduleBlock(blockId, { youtubeUrl: value })
        break
    }
    
    setEditState(null)
  }

  const handleCancelEdit = () => {
    setEditState(null)
  }

  return (
    <div className="routine-viewer">
      <div className="routine-header">
        <h3>Today's Routine</h3>
        <span className="routine-count">{blocks.length} activities</span>
      </div>
      <div className="routine-grid">
        {blocks.map((block, index) => {
          const borderColor = block.metadata?.onColor || '#ffffff'
          const hz = block.metadata?.brainwaveHz || 10
          const isEditingThis = (field: string) => editState?.blockId === block.id && editState?.field === field
          
          return (
            <div 
              key={block?.id || `block-${index}`} 
              className="routine-card"
              style={{ 
                borderColor: borderColor,
                borderWidth: '2px',
                borderStyle: 'solid'
              }}
            >
              {/* SlotType Header */}
              <div className="routine-card-header" style={{ borderBottomColor: borderColor }}>
                {isEditingThis('slotType') ? (
                  <input
                    type="text"
                    className="routine-inline-edit"
                    value={editState!.value}
                    onChange={(e) => setEditState({ ...editState!, value: e.target.value })}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    autoFocus
                  />
                ) : (
                  <span 
                    className="routine-slot-type"
                    onClick={() => handleStartEdit(block.id, 'slotType', block.slotType)}
                    title="Click to edit"
                  >
                    {block.slotType}
                  </span>
                )}
                
                {/* Hz Badge - Editable */}
                {isEditingThis('hz') ? (
                  <input
                    type="number"
                    className="routine-inline-edit routine-hz-edit"
                    value={editState!.value}
                    onChange={(e) => setEditState({ ...editState!, value: e.target.value })}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    autoFocus
                  />
                ) : (
                  <span 
                    className="routine-hz-badge" 
                    style={{ 
                      backgroundColor: borderColor,
                      color: '#000',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleStartEdit(block.id, 'hz', hz.toString())}
                    title="Click to edit Hz"
                  >
                    {hz} Hz
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="routine-card-body">
                {/* Title */}
                <div className="routine-title">{block.title}</div>
                
                {/* Color Picker */}
                <div className="routine-field">
                  <label className="routine-field-label">Color:</label>
                  {isEditingThis('color') ? (
                    <div className="routine-color-edit">
                      <input
                        type="text"
                        className="routine-inline-edit"
                        value={editState!.value}
                        onChange={(e) => setEditState({ ...editState!, value: e.target.value })}
                        onBlur={handleSaveEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        placeholder="#RRGGBB"
                        autoFocus
                      />
                      <input
                        type="color"
                        value={editState!.value}
                        onChange={(e) => setEditState({ ...editState!, value: e.target.value.toUpperCase() })}
                        onBlur={handleSaveEdit}
                      />
                    </div>
                  ) : (
                    <div 
                      className="routine-color-display"
                      onClick={() => handleStartEdit(block.id, 'color', borderColor)}
                      title="Click to edit color"
                    >
                      <div 
                        className="routine-color-swatch" 
                        style={{ backgroundColor: borderColor }}
                      />
                      <span className="routine-color-value">{borderColor}</span>
                    </div>
                  )}
                </div>
                
                {/* Editable Link Field */}
                <div className="routine-field">
                  <label className="routine-field-label">Video Link:</label>
                  {isEditingThis('link') ? (
                    <div className="routine-link-edit">
                      <input
                        type="text"
                        className="routine-inline-edit"
                        value={editState!.value}
                        onChange={(e) => setEditState({ ...editState!, value: e.target.value })}
                        onBlur={handleSaveEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        placeholder="https://youtube.com/..."
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="routine-link-display">
                      <div className="routine-link-text">
                        {block.youtubeUrl ? (
                          <a 
                            href={block.youtubeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="routine-link-url"
                          >
                            {block.youtubeUrl.length > 35 
                              ? block.youtubeUrl.substring(0, 35) + '...' 
                              : block.youtubeUrl}
                          </a>
                        ) : (
                          <span className="routine-link-empty">No link</span>
                        )}
                      </div>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleStartEdit(block.id, 'link', block.youtubeUrl || '')}
                        title="Edit link"
                      >
                        ✎
                      </button>
                    </div>
                  )}
                  
                  {/* Edited indicator */}
                  {block.isEdited && (
                    <span className="routine-edited-badge">Edited</span>
                  )}
                </div>

                {/* Jump To Button */}
                {block.youtubeUrl && (
                  <button
                    className="btn-jump-to"
                    onClick={() => handleJumpTo(block.id)}
                    style={{ 
                      borderColor: borderColor,
                      color: borderColor
                    }}
                  >
                    JUMP TO
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
