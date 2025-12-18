// ============================================
// Routine Viewer Component
// ============================================
// Displays the daily routine blocks

import { useAppStore } from '../../store/appStore'
import './RoutineViewer.css'

export function RoutineViewer() {
  const schedule = useAppStore((s) => s.schedule)
  const setDojoWindow = useAppStore((s) => s.setDojoWindow)

  // Use randomized blocks if available, otherwise use today's routine
  const blocks = schedule?.randomizedBlocks?.length > 0 
    ? schedule.randomizedBlocks 
    : schedule?.todayRoutine || []

  if (!blocks || blocks.length === 0) {
    return null
  }

  const handleLoadVideo = (url?: string) => {
    if (url) {
      setDojoWindow({ youtubeUrl: url, visible: true })
    }
  }

  return (
    <div className="routine-viewer">
      <div className="routine-header">
        <h3>Today's Routine</h3>
        <span className="routine-count">{blocks.length} activities</span>
      </div>
      <div className="routine-list">
        {blocks.map((block, index) => (
          <div key={block?.id || `block-${index}`} className="routine-item">
            <div className="routine-item-header">
              <span className="routine-number">{index + 1}</span>
              <span className="routine-title">{block.title}</span>
            </div>
            {block.description && (
              <p className="routine-description">{block.description}</p>
            )}
            {block.metadata && (
              <div className="routine-metadata">
                {block.metadata.brainwaveHz && (
                  <span className="routine-hz">{block.metadata.brainwaveHz} Hz</span>
                )}
                {block.metadata.onColor && (
                  <div 
                    className="routine-color-dot" 
                    style={{ backgroundColor: block.metadata.onColor }}
                  />
                )}
              </div>
            )}
            {block.youtubeUrl && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleLoadVideo(block.youtubeUrl)}
                style={{ marginTop: '4px', fontSize: '0.75rem', padding: '4px 8px' }}
              >
                Load Video
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
