// ============================================
// Emergency Stop Button Component
// ============================================
// Always visible, high-contrast button that 
// immediately kills flicker and audio.

import { useEffect, useCallback } from 'react'
import { useAppStore } from '../../store/appStore'
import './StopButton.css'

export function StopButton() {
  const emergencyStop = useAppStore((s) => s.emergencyStop)
  const flickerEnabled = useAppStore((s) => s.flickerEnabled)
  const audioEnabled = useAppStore((s) => s.audio.enabled)

  const handleStop = useCallback(() => {
    emergencyStop()
  }, [emergencyStop])

  // ESC key triggers stop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleStop()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleStop])

  // Show active state when flicker or audio is running
  const isActive = flickerEnabled || audioEnabled

  return (
    <button
      className={`stop-button ${isActive ? 'active' : ''}`}
      onClick={handleStop}
      aria-label="Emergency stop - Press to immediately stop flicker and audio"
      title="STOP (ESC)"
    >
      <span className="stop-icon">■</span>
      <span className="stop-text">STOP</span>
      <span className="stop-hint">ESC</span>
    </button>
  )
}
