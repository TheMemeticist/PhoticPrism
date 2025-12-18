// ============================================
// Flicker Canvas Component
// ============================================
// High-performance flicker renderer using Canvas API and
// requestAnimationFrame for science-based geometric patterns.
// Does NOT use React state for frame-rate updates to avoid re-render overhead.

import { useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '../../store/appStore'
import { calculateFrameTiming } from '../../utils/refreshRateUtils'
import { renderPattern, RenderContext } from '../../utils/patternRenderers'
import { renderGenerativePattern, GenerativeRenderContext } from '../../utils/generativePatternRenderers'
import './FlickerCanvas.css'

export function FlickerCanvas() {
  const patternCanvasRef = useRef<HTMLCanvasElement>(null)
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const frameCountRef = useRef(0)
  const isOnRef = useRef(false)
  const startTimeRef = useRef<number>(Date.now())
  
  // Read from store (these are stable references)
  const flickerEnabled = useAppStore((s) => s.flickerEnabled)
  const flickerHz = useAppStore((s) => s.flickerHz)
  const flickerMode = useAppStore((s) => s.flickerMode)
  const patternMode = useAppStore((s) => s.patternMode)
  const patternType = useAppStore((s) => s.patternType)
  const patternConfig = useAppStore((s) => s.patternConfig)
  const generativePatternType = useAppStore((s) => s.generativePatternType)
  const generativeConfig = useAppStore((s) => s.generativeConfig)
  const colors = useAppStore((s) => s.colors)
  const refreshRate = useAppStore((s) => s.refreshRate)
  const safetyAcknowledged = useAppStore((s) => s.safety.acknowledged)
  const isPaused = useAppStore((s) => s.pause.isPaused)
  const togglePause = useAppStore((s) => s.togglePause)
  
  // Audio & Visual Noise
  const audioConfig = useAppStore((s) => s.audio)
  const visualNoise = audioConfig.visualNoiseLockedToAudio ? audioConfig.ambientVolume : audioConfig.visualNoise
  
  // Neurofeedback
  const neurofeedbackEnabled = useAppStore((s) => s.neurofeedback.enabled)
  const brightnessModulation = useAppStore((s) => s.neurofeedbackState.brightnessModulation)
  const noiseVolumeModulation = useAppStore((s) => s.neurofeedbackState.noiseVolumeModulation)
  const eegReadings = useAppStore((s) => s.eegReadings)
  const coherenceScore = useAppStore((s) => s.neurofeedbackState.coherenceScore)

  // Calculate timing based on current Hz
  const timing = calculateFrameTiming(flickerHz, refreshRate)

  // Animation loop - runs at display refresh rate
  // Uses two modes:
  // 1. PERFECT MODE: Hz is exact divisor of refresh rate (frame counting)
  // 2. APPROXIMATE MODE: Hz is arbitrary (time accumulation)
  const animate = useCallback((timestamp: number) => {
    const canvas = patternCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isPerfectHz = timing.framesPerCycle === Math.round(refreshRate / flickerHz)
    
    let shouldBeOn = false
    
    if (isPerfectHz) {
      // PERFECT MODE: Frame-locked counting
      frameCountRef.current++
      const cyclePosition = frameCountRef.current % timing.framesPerCycle
      shouldBeOn = cyclePosition < timing.framesOn
    } else {
      // APPROXIMATE MODE: Time-based accumulation for non-divisor frequencies
      const cycleDuration = 1000 / flickerHz // ms per cycle
      const halfCycle = cycleDuration / 2
      const elapsed = timestamp % cycleDuration
      shouldBeOn = elapsed < halfCycle
    }

    // Always render on state change OR for motion/generative patterns (which need continuous updates)
    const needsUpdate = shouldBeOn !== isOnRef.current || 
                        patternType.startsWith('motion-') || 
                        patternMode === 'generative'
    
    if (needsUpdate) {
      isOnRef.current = shouldBeOn
      
      // Calculate elapsed time for motion patterns
      const elapsedTime = timestamp - startTimeRef.current
      
      // Apply brightness modulation
      const brightness = (neurofeedbackEnabled ? brightnessModulation : colors.brightness) / 100
      
      // Route to appropriate renderer based on pattern mode
      if (patternMode === 'generative') {
        // Prepare neurofeedback data if available
        let neurofeedbackData: GenerativeRenderContext['neurofeedback'] | undefined
        if (neurofeedbackEnabled && eegReadings.length > 0) {
          const latest = eegReadings[eegReadings.length - 1]
          neurofeedbackData = {
            coherenceScore,
            alphaPower: latest.alpha,
            thetaPower: latest.theta,
            betaPower: latest.beta,
            gammaPower: latest.gamma
          }
        }
        
        const generativeContext: GenerativeRenderContext = {
          ctx,
          width: canvas.width,
          height: canvas.height,
          config: generativeConfig,
          time: elapsedTime,
          flickerState: shouldBeOn,
          neurofeedback: neurofeedbackData
        }
        
        renderGenerativePattern(generativePatternType, generativeContext)
      } else {
        // Clinical patterns
        const renderContext: RenderContext = {
          ctx,
          width: canvas.width,
          height: canvas.height,
          isOn: shouldBeOn,
          onColor: colors.onColor,
          offColor: colors.offColor,
          config: patternConfig,
          time: elapsedTime
        }
        
        renderPattern(patternType, renderContext)
      }
      
      // Apply brightness via canvas opacity
      canvas.style.opacity = brightness.toString()
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [timing, colors, refreshRate, flickerHz, neurofeedbackEnabled, brightnessModulation, patternMode, patternType, patternConfig, generativePatternType, generativeConfig, eegReadings, coherenceScore])

  // Initialize pattern canvas size
  useEffect(() => {
    const canvas = patternCanvasRef.current
    if (!canvas) return
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // Start/stop animation based on flickerEnabled/generative mode and pause state
  useEffect(() => {
    const shouldRun = (flickerEnabled || patternMode === 'generative') && safetyAcknowledged && !isPaused
    
    if (shouldRun && patternCanvasRef.current) {
      // Reset frame counter and start time
      frameCountRef.current = 0
      isOnRef.current = false
      startTimeRef.current = Date.now()
      
      // Start animation
      animationRef.current = requestAnimationFrame(animate)
    } else {
      // Stop animation
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      
      // Clear canvas when stopped
      const canvas = patternCanvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = colors.offColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        canvas.style.opacity = '1'
      }
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [flickerEnabled, patternMode, safetyAcknowledged, isPaused, animate, colors.offColor])

  // Page Visibility API - pause when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
        
        // Clear canvas when hidden
        const canvas = patternCanvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.fillStyle = colors.offColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }
          canvas.style.opacity = '1'
        }
      } else if (!document.hidden && (flickerEnabled || patternMode === 'generative') && safetyAcknowledged) {
        // Resume when visible
        frameCountRef.current = 0
        startTimeRef.current = Date.now()
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [flickerEnabled, patternMode, safetyAcknowledged, animate, colors.offColor])

  // Generate noise texture
  useEffect(() => {
    const canvas = noiseCanvasRef.current
    if (!canvas) return
    
    // Set canvas to fill the screen
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Create noise pattern
    const imageData = ctx.createImageData(canvas.width, canvas.height)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255
      data[i] = value     // R
      data[i + 1] = value // G
      data[i + 2] = value // B
      data[i + 3] = 255   // A
    }
    
    ctx.putImageData(imageData, 0, 0)
    
    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      const imageData = ctx.createImageData(canvas.width, canvas.height)
      const data = imageData.data
      
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255
        data[i] = value
        data[i + 1] = value
        data[i + 2] = value
        data[i + 3] = 255
      }
      
      ctx.putImageData(imageData, 0, 0)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Update noise opacity based on visualNoise and neurofeedback
  useEffect(() => {
    const canvas = noiseCanvasRef.current
    if (!canvas) return
    
    // Calculate final noise opacity
    // Use neurofeedback modulation if enabled, otherwise use base visualNoise
    const effectiveNoise = neurofeedbackEnabled ? noiseVolumeModulation : visualNoise
    const opacity = effectiveNoise / 100 // Map 0-100 to 0-1
    
    canvas.style.opacity = opacity.toString()
  }, [visualNoise, neurofeedbackEnabled, noiseVolumeModulation])

  // Compute class based on mode
  const modeClass = `flicker-canvas flicker-${flickerMode}`

  return (
    <>
      {/* Pattern canvas - renders geometric patterns */}
      <canvas 
        ref={patternCanvasRef}
        className={modeClass}
        onClick={togglePause}
        aria-hidden="true"
        data-active={flickerEnabled}
      />
      {/* Visual noise overlay - always on top */}
      <canvas
        ref={noiseCanvasRef}
        className="visual-noise-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 5,
          mixBlendMode: 'overlay'
        }}
      />
    </>
  )
}
