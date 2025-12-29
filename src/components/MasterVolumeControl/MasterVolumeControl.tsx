// ============================================
// Master Volume Control Component
// ============================================
// Floating volume control in lower-right corner with auto-hide

import { useAppStore } from '../../store/appStore'
import { useAutoHide } from '../../hooks/useAutoHide'
import './MasterVolumeControl.css'

export function MasterVolumeControl() {
  const audio = useAppStore((s) => s.audio)
  const neurofeedback = useAppStore((s) => s.neurofeedback)
  const neurofeedbackState = useAppStore((s) => s.neurofeedbackState)
  const setAudio = useAppStore((s) => s.setAudio)
  
  const { isVisible, showUI } = useAutoHide({ hideDelay: 3000 })

  // Calculate effective volume with neurofeedback
  const effectiveMasterVolume = neurofeedback.enabled 
    ? Math.round((audio.masterVolume / 100) * (neurofeedbackState.beatVolumeModulation / 100) * 100)
    : audio.masterVolume

  const isMuted = audio.masterVolume === 0 || !audio.enabled

  const handleToggleMute = () => {
    if (audio.masterVolume === 0) {
      setAudio({ masterVolume: 80 }) // Restore to default
    } else {
      setAudio({ masterVolume: 0 }) // Mute
    }
  }

  const handleVolumeChange = (value: number) => {
    setAudio({ masterVolume: value })
    showUI()
  }

  return (
    <div 
      className={`master-volume-control ${isVisible ? 'visible' : ''}`}
      onMouseEnter={showUI}
      onMouseMove={showUI}
    >
      {/* Speaker Icon / Mute Button */}
      <button
        className="volume-icon-btn"
        onClick={handleToggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? '🔇' : audio.masterVolume < 30 ? '🔈' : audio.masterVolume < 70 ? '🔉' : '🔊'}
      </button>

      {/* Volume Slider (appears on hover) */}
      <div className="volume-slider-container">
        <input
          type="range"
          className="volume-slider"
          min={0}
          max={100}
          value={audio.masterVolume}
          onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
        />
        
        {/* Volume Labels */}
        <div className="volume-labels">
          <span className="volume-current">{audio.masterVolume}%</span>
          {neurofeedback.enabled && (
            <span className="volume-effective">
              → {effectiveMasterVolume}%
            </span>
          )}
        </div>

        {/* Neurofeedback indicator */}
        {neurofeedback.enabled && (
          <div className="nf-indicator">
            🧠 NF Cap
          </div>
        )}
      </div>
    </div>
  )
}
