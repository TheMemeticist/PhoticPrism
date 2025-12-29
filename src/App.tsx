// ============================================
// Photic Prism - Main App Component
// ============================================

import { useEffect, useState } from 'react'
import { useAppStore } from './store/appStore'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useSoundscapeEngine } from './hooks/useSoundscapeEngine'
import { useAutoHide } from './hooks/useAutoHide'
import { useEEGPolling } from './hooks/useEEGPolling'
import { useNeurofeedback } from './hooks/useNeurofeedback'
import { detectRefreshRate } from './utils/refreshRateUtils'

// Components
import { SafetyModal } from './components/SafetyModal/SafetyModal'
import { FlickerCanvas } from './components/FlickerCanvas/FlickerCanvas'
import { ControlPanel } from './components/ControlPanel/ControlPanel'
import { DojoWindow } from './components/DojoWindow/DojoWindow'
import { PauseOverlay } from './components/PauseOverlay/PauseOverlay'
import { PauseHint } from './components/PauseHint/PauseHint'
import { EEGGraph } from './components/EEGGraph/EEGGraph'
import { CalibrationOverlay } from './components/CalibrationOverlay/CalibrationOverlay'
import { MasterVolumeControl } from './components/MasterVolumeControl/MasterVolumeControl'

import './index.css'

function App() {
  const setRefreshRate = useAppStore((s) => s.setRefreshRate)
  const safetyAcknowledged = useAppStore((s) => s.safety.acknowledged)
  const startSession = useAppStore((s) => s.startSession)
  const endSession = useAppStore((s) => s.endSession)
  const flickerEnabled = useAppStore((s) => s.flickerEnabled)
  const audioEnabled = useAppStore((s) => s.audio.enabled)
  const eegReadings = useAppStore((s) => s.eegReadings)
  const eegGraphVisible = useAppStore((s) => s.eegGraphVisible)

  // Track hover state for persistent regions (EEG graph and control panel)
  const [isHoveringEEGGraph, setIsHoveringEEGGraph] = useState(false)
  const [isHoveringControlPanel, setIsHoveringControlPanel] = useState(false)
  const isHoveringPersistentRegion = isHoveringEEGGraph || isHoveringControlPanel

  // Initialize audio engine
  useAudioEngine()
  
  // Initialize soundscape engine
  useSoundscapeEngine()
  
  // Initialize EEG polling (runs continuously in background)
  useEEGPolling()
  
  // Initialize neurofeedback calculations
  useNeurofeedback()
  
  // Auto-hide UI when flicker or audio is active
  // Keep visible if hovering over persistent regions
  const { isVisible: isUIVisible, forceShow } = useAutoHide({
    hideDelay: 3000,
    enabled: flickerEnabled || audioEnabled,
    isHoveringPersistentRegion
  })

  // Detect refresh rate on mount
  useEffect(() => {
    detectRefreshRate().then((hz) => {
      console.log(`🖥️ Detected refresh rate: ${hz} Hz`)
      setRefreshRate(hz)
    })
  }, [setRefreshRate])
  
  // Load default Schedule.MD on mount
  useEffect(() => {
    fetch('/Schedule.MD')
      .then(res => res.text())
      .then(content => {
        if (content) {
          useAppStore.getState().loadSchedule(content)
          console.log('📅 Loaded default Schedule.MD')
        }
      })
      .catch(err => console.warn('Could not load Schedule.MD:', err))
  }, [])

  // Session tracking
  useEffect(() => {
    if (flickerEnabled || audioEnabled) {
      startSession()
    } else {
      endSession()
    }
  }, [flickerEnabled, audioEnabled, startSession, endSession])
  
  // Listen for trainer navigation from pop-out window
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'trainer-next') {
        useAppStore.getState().nextActivity()
      } else if (e.data.type === 'trainer-previous') {
        useAppStore.getState().previousActivity()
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div className="app">
      {/* Safety Modal - shown first */}
      <SafetyModal />

      {/* Flicker Canvas - background layer */}
      <FlickerCanvas />

      {/* Pause Overlay - shows pause symbol when paused */}
      <PauseOverlay />

      {/* Calibration Overlay - shows countdown timer during EEG calibration */}
      <CalibrationOverlay />

      {/* Dojo Window - draggable video + webcam + integrated trainer */}
      <DojoWindow />

      {/* EEG Graph - upper-left corner with auto-hide */}
      {eegGraphVisible && (
        <EEGGraph 
          readings={eegReadings} 
          isVisible={isUIVisible}
          onMouseEnter={() => setIsHoveringEEGGraph(true)}
          onMouseLeave={() => setIsHoveringEEGGraph(false)}
        />
      )}

      {/* Control Panel Hover Trigger - always active on right edge */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '40px',
          height: '100vh',
          zIndex: 150, // Below controls but above everything else
          pointerEvents: 'auto'
        }}
        onMouseEnter={() => setIsHoveringControlPanel(true)}
        onMouseLeave={() => setIsHoveringControlPanel(false)}
      />

      {/* Control Panel - right side with auto-hide */}
      <div 
        className={`ui-container ${isUIVisible ? 'visible' : 'hidden'}`}
        onMouseEnter={() => setIsHoveringControlPanel(true)}
        onMouseLeave={() => setIsHoveringControlPanel(false)}
      >
        <ControlPanel />
      </div>

      {/* Master Volume Control - floating speaker icon with volume slider */}
      {safetyAcknowledged && <MasterVolumeControl />}

      {/* Pause Hint - appears after UI fades, then auto-fades */}
      {safetyAcknowledged && !isUIVisible && <PauseHint />}

      {/* Main Content Area */}
      <main className="main-content">
        {!safetyAcknowledged && (
          <div className="welcome-message">
            <h1>Welcome to Photic Prism</h1>
            <p>Please review the safety information to continue.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
