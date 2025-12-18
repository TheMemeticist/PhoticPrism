// ============================================
// Pause Overlay Component
// ============================================
// Shows pause symbol when app is paused

import { useAppStore } from '../../store/appStore'
import './PauseOverlay.css'

export function PauseOverlay() {
  const isPaused = useAppStore((s) => s.pause.isPaused)
  const togglePause = useAppStore((s) => s.togglePause)

  if (!isPaused) {
    return null
  }

  return (
    <div className="pause-overlay" onClick={togglePause}>
      <div className="pause-symbol">
        <div className="pause-bar"></div>
        <div className="pause-bar"></div>
      </div>
    </div>
  )
}
