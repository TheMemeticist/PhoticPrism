// ============================================
// Pause Hint Component
// ============================================
// Shows a hint message after UI fades, then auto-fades

import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import './PauseHint.css'

export function PauseHint() {
  const [isVisible, setIsVisible] = useState(false)
  const isPaused = useAppStore((s) => s.pause.isPaused)

  useEffect(() => {
    // Don't show if already paused (PauseOverlay handles that)
    if (isPaused) {
      setIsVisible(false)
      return
    }

    // Show hint after a short delay
    const showTimer = setTimeout(() => {
      setIsVisible(true)
    }, 500)

    // Auto-fade after 4 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false)
    }, 4500)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [isPaused])

  // Don't render if paused
  if (isPaused) return null

  return (
    <div className={`pause-hint ${isVisible ? 'visible' : ''}`}>
      <div className="pause-hint-icon">⚠️</div>
      <div className="pause-hint-text">Click anywhere to pause</div>
    </div>
  )
}
