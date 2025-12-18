// ============================================
// Dojo Window Component
// ============================================
// Draggable/resizable window containing YouTube
// embed and optional webcam mirror.
// Now includes integrated trainer controls with auto-hide.

import { useCallback, useRef, useState, useEffect } from 'react'
import { Rnd } from 'react-rnd'
import Webcam from 'react-webcam'
import { useAppStore } from '../../store/appStore'
import { extractYouTubeId } from '../../utils/scheduleParser'
import './DojoWindow.css'

interface DojoWindowProps {
  onClose?: () => void
}

export function DojoWindow({ onClose }: DojoWindowProps) {
  const dojoWindow = useAppStore((s) => s.dojoWindow)
  const setDojoWindow = useAppStore((s) => s.setDojoWindow)
  const webcamRef = useRef<Webcam>(null)
  
  // Trainer mode state
  const trainerMode = useAppStore((s) => s.schedule.trainerMode)
  const todayRoutine = useAppStore((s) => s.schedule.todayRoutine)
  const currentIndex = useAppStore((s) => s.schedule.currentRoutineIndex)
  const setTrainerMode = useAppStore((s) => s.setTrainerMode)
  const nextActivity = useAppStore((s) => s.nextActivity)
  const previousActivity = useAppStore((s) => s.previousActivity)
  
  // Auto-hide state
  const [chromeVisible, setChromeVisible] = useState(true)
  const hideTimeoutRef = useRef<number>()
  
  // Mouse movement handler for auto-hide
  const handleMouseMove = useCallback(() => {
    setChromeVisible(true)
    
    // Clear existing timeout
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current)
    }
    
    // Set new timeout to hide chrome after 3 seconds
    hideTimeoutRef.current = window.setTimeout(() => {
      setChromeVisible(false)
    }, 3000)
  }, [])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  const handleDragStop = useCallback((_e: unknown, d: { x: number; y: number }) => {
    setDojoWindow({ position: { x: d.x, y: d.y } })
  }, [setDojoWindow])

  const handleResizeStop = useCallback(
    (_e: unknown, _direction: unknown, ref: HTMLElement, _delta: unknown, position: { x: number; y: number }) => {
      setDojoWindow({
        size: {
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10)
        },
        position
      })
    },
    [setDojoWindow]
  )

  const handleClose = () => {
    setDojoWindow({ visible: false })
    onClose?.()
  }

  const handleMinimize = () => {
    setDojoWindow({ minimized: !dojoWindow.minimized })
  }

  const handlePopOut = () => {
    const videoId = extractYouTubeId(dojoWindow.youtubeUrl)
    if (!videoId) {
      alert('No video loaded to pop out')
      return
    }
    
    // Calculate dimensions based on 16:9 aspect ratio
    // If webcam enabled, add 50% more width (2:1 ratio for video:webcam)
    const baseWidth = 1280
    const baseHeight = 720 // 16:9 ratio
    const width = dojoWindow.webcamEnabled ? baseWidth * 1.5 : baseWidth
    const height = baseHeight + 60 // Add space for trainer bar
    
    const left = (screen.width - width) / 2
    const top = (screen.height - height) / 2
    
    const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,toolbar=no,menubar=no,location=no`
    
    // Build URL with parameters
    const params = new URLSearchParams({
      videoId,
      webcam: dojoWindow.webcamEnabled.toString()
    })
    
    const popout = window.open(`/popout.html?${params.toString()}`, 'PhotoPrismDojoWindow', features)
    
    // Store pop-out reference globally so we can update it
    if (popout) {
      (window as any).__photoprism_popout = popout
    }
    
    // Close the original Dojo Window
    setDojoWindow({ visible: false })
    
    console.log('🪟 Opened pop-out window and closed original')
  }

  // Preset positions
  const applyPreset = (preset: string) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const pw = 320 // Control panel width

    switch (preset) {
      case 'corner-tr':
        setDojoWindow({ position: { x: vw - pw - dojoWindow.size.width - 20, y: 20 } })
        break
      case 'corner-tl':
        setDojoWindow({ position: { x: 20, y: 20 } })
        break
      case 'corner-br':
        setDojoWindow({ position: { x: vw - pw - dojoWindow.size.width - 20, y: vh - dojoWindow.size.height - 100 } })
        break
      case 'corner-bl':
        setDojoWindow({ position: { x: 20, y: vh - dojoWindow.size.height - 100 } })
        break
      case 'center':
        setDojoWindow({ 
          position: { 
            x: (vw - pw - dojoWindow.size.width) / 2, 
            y: (vh - dojoWindow.size.height) / 2 
          } 
        })
        break
    }
  }

  if (!dojoWindow.visible) {
    return null
  }

  const videoId = extractYouTubeId(dojoWindow.youtubeUrl)
  const currentActivity = trainerMode && todayRoutine && todayRoutine[currentIndex]
  const progress = trainerMode && todayRoutine && todayRoutine.length > 0
    ? ((currentIndex + 1) / todayRoutine.length) * 100
    : 0

  return (
    <Rnd
      className={`dojo-window ${chromeVisible ? 'chrome-visible' : 'chrome-hidden'}`}
      position={dojoWindow.position}
      size={dojoWindow.minimized ? { width: 300, height: 40 } : dojoWindow.size}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseMove={handleMouseMove}
      minWidth={300}
      minHeight={dojoWindow.minimized ? 40 : 200}
      bounds="window"
      dragHandleClassName="dojo-window-header"
      enableResizing={!dojoWindow.minimized && chromeVisible}
    >
      {/* Header / Drag Handle - only visible when chrome is visible */}
      <div className={`dojo-window-header ${chromeVisible ? 'visible' : 'hidden'}`}>
        <span className="dojo-title">🥋 Dojo Window</span>
        
        <div className="dojo-header-actions">
          {/* Preset Buttons */}
          <div className="dojo-presets">
            <button onClick={() => applyPreset('corner-tl')} title="Top Left">↖</button>
            <button onClick={() => applyPreset('corner-tr')} title="Top Right">↗</button>
            <button onClick={() => applyPreset('center')} title="Center">◉</button>
            <button onClick={() => applyPreset('corner-bl')} title="Bottom Left">↙</button>
            <button onClick={() => applyPreset('corner-br')} title="Bottom Right">↘</button>
          </div>
          
          <button 
            className="dojo-btn popout" 
            onClick={handlePopOut}
            title="Pop Out to Separate Window"
          >
            ⧉
          </button>
          <button 
            className="dojo-btn minimize" 
            onClick={handleMinimize}
            title={dojoWindow.minimized ? 'Expand' : 'Minimize'}
          >
            {dojoWindow.minimized ? '□' : '−'}
          </button>
          <button 
            className="dojo-btn close" 
            onClick={handleClose}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      {!dojoWindow.minimized && (
        <>
          <div className="dojo-window-content">
            {/* YouTube Embed */}
            <div className={`dojo-youtube ${dojoWindow.webcamEnabled ? 'with-webcam' : ''}`}>
              {videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&mute=0`}
                  title="YouTube video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="dojo-placeholder">
                  <span>📺</span>
                  <p>No video loaded</p>
                  <p className="hint">Paste a YouTube URL in Display settings</p>
                </div>
              )}
            </div>

            {/* Webcam Mirror */}
            {dojoWindow.webcamEnabled && (
              <div className="dojo-webcam">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  mirrored={true}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: 'user',
                    width: { ideal: 320 },
                    height: { ideal: 240 }
                  }}
                />
              </div>
            )}
          </div>
          
          {/* Trainer Controls Bar Below Video */}
          {trainerMode && currentActivity && chromeVisible && (
            <div className="dojo-trainer-bar">
              <div className="trainer-info-section">
                <div className="trainer-activity-info">
                  <span className="trainer-activity-title">{currentActivity.title}</span>
                  <span className="trainer-activity-meta">
                    {currentActivity.metadata?.brainwaveHz && `${currentActivity.metadata.brainwaveHz} Hz`}
                  </span>
                </div>
                <span className="trainer-progress-text">
                  {currentIndex + 1} / {todayRoutine.length}
                </span>
              </div>
              
              <div className="trainer-controls-section">
                <button
                  className="trainer-nav-btn"
                  onClick={previousActivity}
                  title="Previous Activity"
                >
                  ◀
                </button>
                
                <div className="trainer-progress-bar">
                  <div 
                    className="trainer-progress-fill" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <button
                  className="trainer-nav-btn"
                  onClick={nextActivity}
                  title="Next Activity"
                >
                  ▶
                </button>
                
                <button
                  className="trainer-exit-btn"
                  onClick={() => setTrainerMode(false)}
                  title="Exit Trainer Mode"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Rnd>
  )
}
