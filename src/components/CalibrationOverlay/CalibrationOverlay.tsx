// ============================================
// Calibration Overlay Component
// ============================================
// Shows countdown timer during EEG calibration

import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import * as Tone from 'tone'
import './CalibrationOverlay.css'

export function CalibrationOverlay() {
  const isCalibrating = useAppStore((s) => s.eeg.isCalibrating)
  const calibrationStartTime = useAppStore((s) => s.eeg.calibrationStartTime)
  const calibrationDuration = useAppStore((s) => s.eeg.calibrationDuration)
  
  const [remainingTime, setRemainingTime] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isCalibrating || !calibrationStartTime || !calibrationDuration) {
      return
    }

    const interval = setInterval(() => {
      const elapsed = (Date.now() - calibrationStartTime) / 1000
      const remaining = Math.max(0, calibrationDuration - elapsed)
      const progressPercent = Math.min(100, (elapsed / calibrationDuration) * 100)
      
      setRemainingTime(remaining)
      setProgress(progressPercent)

      // Calibration complete
      if (remaining <= 0) {
        playCompletionTone()
      }
    }, 100) // Update every 100ms for smooth animation

    return () => clearInterval(interval)
  }, [isCalibrating, calibrationStartTime, calibrationDuration])

  const playCompletionTone = async () => {
    try {
      await Tone.start()
      
      // Create a pleasant completion chime (C major arpeggio)
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0.1,
          release: 0.5
        }
      }).toDestination()

      const now = Tone.now()
      synth.triggerAttackRelease('C5', '0.3', now)
      synth.triggerAttackRelease('E5', '0.3', now + 0.15)
      synth.triggerAttackRelease('G5', '0.3', now + 0.30)
      synth.triggerAttackRelease('C6', '0.5', now + 0.45)

      // Clean up after completion
      setTimeout(() => {
        synth.dispose()
      }, 2000)
    } catch (error) {
      console.error('Failed to play completion tone:', error)
    }
  }

  if (!isCalibrating) {
    return null
  }

  const minutes = Math.floor(remainingTime / 60)
  const seconds = Math.floor(remainingTime % 60)
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="calibration-overlay">
      <div className="calibration-content">
        <div className="calibration-icon">🧠</div>
        
        <h2 className="calibration-title">Calibrating Baseline</h2>
        
        <div className="calibration-timer">
          <svg className="timer-ring" width="200" height="200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="var(--accent-primary, #60a5fa)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 0.1s linear' }}
            />
          </svg>
          
          <div className="timer-text">
            <div className="timer-time">{timeString}</div>
            <div className="timer-label">remaining</div>
          </div>
        </div>

        <div className="calibration-instructions">
          <p>🧘 Sit still with eyes closed</p>
          <p>Take slow, deep breaths</p>
          <p>Clear your mind and relax</p>
        </div>

        <div className="calibration-progress-bar">
          <div 
            className="calibration-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
