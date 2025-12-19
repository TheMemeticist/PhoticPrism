// ============================================
// Flicker Canvas Component - OPTIMIZED
// ============================================
// High-performance flicker renderer using Canvas API and
// requestAnimationFrame for science-based geometric patterns.
// Does NOT use React state for frame-rate updates to avoid re-render overhead.

import { useRef, useEffect, useCallback, useMemo } from 'react'
import { useAppStore } from '../../store/appStore'
import { calculateFrameTiming } from '../../utils/refreshRateUtils'
import { renderPattern, RenderContext } from '../../utils/patternRenderers'
import { renderGenerativePattern, GenerativeRenderContext } from '../../utils/generativePatternRenderers'
import { NoiseOverlay } from './NoiseOverlay'
import './FlickerCanvas.css'

// Performance tracking
interface FrameStats {
  lastFrameTime: number
  droppedFrames: number
  actualHz: number
}

export function FlickerCanvas() {
  const patternCanvasRef = useRef<HTMLCanvasElement>(null)
  const cacheCanvasRef = useRef<HTMLCanvasElement | null>(null) // For static pattern caching
  const animationRef = useRef<number | null>(null)
  const frameCountRef = useRef(0)
  const isOnRef = useRef(false)
  const startTimeRef = useRef<number>(0) // NOW: Using performance.now() for consistency
  const lastRenderTimeRef = useRef<number>(0)
  const phaseAccumulatorRef = useRef<number>(0) // For drift-free approximate mode
  const statsRef = useRef<FrameStats>({ lastFrameTime: 0, droppedFrames: 0, actualHz: 0 })
  const lastStateHashRef = useRef<string>('') // For detecting state changes
  
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
  const visualNoiseEnabled = audioConfig.visualNoiseEnabled
  const visualNoise = audioConfig.visualNoiseLockedToAudio ? audioConfig.ambientVolume : audioConfig.visualNoise
  
  // Neurofeedback
  const neurofeedbackEnabled = useAppStore((s) => s.neurofeedback.enabled)
  const brightnessModulation = useAppStore((s) => s.neurofeedbackState.brightnessModulation)
  const noiseVolumeModulation = useAppStore((s) => s.neurofeedbackState.noiseVolumeModulation)
  const eegReadings = useAppStore((s) => s.eegReadings)
  const coherenceScore = useAppStore((s) => s.neurofeedbackState.coherenceScore)

  // Memoize timing calculation (only recalculates when Hz or refresh rate changes)
  const timing = useMemo(
    () => calculateFrameTiming(flickerHz, refreshRate),
    [flickerHz, refreshRate]
  )

  // Memoize parsed colors to avoid repeated hex parsing
  const parsedColors = useMemo(
    () => ({
      on: colors.onColor,
      off: colors.offColor,
      onRgb: hexToRgb(colors.onColor),
      offRgb: hexToRgb(colors.offColor)
    }),
    [colors.onColor, colors.offColor]
  )

  // Calculate state hash for cache invalidation
  const stateHash = useMemo(() => {
    return JSON.stringify({
      patternMode,
      patternType,
      generativePatternType,
      patternConfig,
      generativeConfig,
      colors
    })
  }, [patternMode, patternType, generativePatternType, patternConfig, generativeConfig, colors])

  // Determine if pattern is static (can be cached)
  const isStaticPattern = useMemo(() => {
    if (patternMode === 'generative') return false
    if (patternType.startsWith('motion-')) return false
    return true
  }, [patternMode, patternType])

  // OPTIMIZED: Animation loop with frame budgeting and smart skipping
  const animate = useCallback((timestamp: number) => {
    const canvas = patternCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false }) // alpha: false for better performance
    if (!ctx) return

    // Frame budgeting: Skip rendering if we're behind schedule
    const targetFrameTime = 1000 / refreshRate
    const timeSinceLastFrame = timestamp - lastRenderTimeRef.current
    
    // Allow 10% tolerance for jitter
    if (timeSinceLastFrame < targetFrameTime * 0.9) {
      animationRef.current = requestAnimationFrame(animate)
      return
    }

    // Track dropped frames
    if (timeSinceLastFrame > targetFrameTime * 1.5) {
      statsRef.current.droppedFrames++
    }

    lastRenderTimeRef.current = timestamp

    const isPerfectHz = Math.abs(timing.framesPerCycle - (refreshRate / flickerHz)) < 0.01
    
    let shouldBeOn = false
    
    if (isPerfectHz) {
      // PERFECT MODE: Frame-locked counting (drift-free)
      frameCountRef.current++
      
      // Reset frame counter periodically to prevent overflow
      if (frameCountRef.current >= timing.framesPerCycle * 1000) {
        frameCountRef.current = frameCountRef.current % timing.framesPerCycle
      }
      
      const cyclePosition = frameCountRef.current % timing.framesPerCycle
      shouldBeOn = cyclePosition < timing.framesOn
    } else {
      // APPROXIMATE MODE: Phase accumulation (no drift)
      const dt = timeSinceLastFrame / 1000 // Convert to seconds
      phaseAccumulatorRef.current += dt * flickerHz
      
      // Keep phase in [0, 1) range
      phaseAccumulatorRef.current = phaseAccumulatorRef.current % 1
      
      // 50% duty cycle: on when phase < 0.5
      shouldBeOn = phaseAccumulatorRef.current < 0.5
    }

    // Determine if we need to render
    const stateChanged = shouldBeOn !== isOnRef.current
    const configChanged = stateHash !== lastStateHashRef.current
    const needsMotion = patternType.startsWith('motion-') || patternMode === 'generative'
    
    const needsUpdate = stateChanged || configChanged || needsMotion
    
    if (needsUpdate) {
      isOnRef.current = shouldBeOn
      lastStateHashRef.current = stateHash
      
      // Calculate elapsed time for motion patterns (FIXED: use consistent timestamp)
      const elapsedTime = timestamp - startTimeRef.current
      
      // Apply brightness modulation
      const brightness = (neurofeedbackEnabled ? brightnessModulation : colors.brightness) / 100
      
      // Always render - caching disabled for now to ensure flicker works correctly
      // TODO: Implement dual-buffer caching (one for ON state, one for OFF state)
      if (patternMode === 'generative') {
        renderGenerativePatternOptimized(ctx, canvas.width, canvas.height, {
          generativePatternType,
          config: generativeConfig,
          time: elapsedTime,
          flickerState: shouldBeOn,
          neurofeedback: getNeurofeedbackData()
        })
      } else {
        renderPatternOptimized(ctx, canvas.width, canvas.height, {
          patternType,
          isOn: shouldBeOn,
          onColor: parsedColors.on,
          offColor: parsedColors.off,
          config: patternConfig,
          time: elapsedTime,
          parsedColors
        })
      }
      
      // Apply brightness via canvas opacity (batch style changes)
      if (canvas.style.opacity !== brightness.toString()) {
        canvas.style.opacity = brightness.toString()
      }
      
      // Apply blur for neurofeedback (if changed)
      const blurAmount = neurofeedbackEnabled 
        ? Math.max(0, (100 - coherenceScore) * 0.2) 
        : 0
      const blurStyle = blurAmount > 0 ? `blur(${blurAmount}px)` : 'none'
      if (canvas.style.filter !== blurStyle) {
        canvas.style.filter = blurStyle
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [timing, colors, refreshRate, flickerHz, neurofeedbackEnabled, brightnessModulation, 
      patternMode, patternType, patternConfig, generativePatternType, generativeConfig, 
      coherenceScore, parsedColors, stateHash, isStaticPattern])

  // Helper to get neurofeedback data
  const getNeurofeedbackData = useCallback(() => {
    if (!neurofeedbackEnabled || eegReadings.length === 0) return undefined
    
    const latest = eegReadings[eegReadings.length - 1]
    return {
      coherenceScore,
      alphaPower: latest.alpha,
      thetaPower: latest.theta,
      betaPower: latest.beta,
      gammaPower: latest.gamma
    }
  }, [neurofeedbackEnabled, eegReadings, coherenceScore])

  // Initialize pattern canvas size
  useEffect(() => {
    const canvas = patternCanvasRef.current
    if (!canvas) return
    
    const resizeCanvas = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      
      // Only resize if dimensions actually changed
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth
        canvas.height = newHeight
        
        // Invalidate cache on resize
        cacheCanvasRef.current = null
      }
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // Start/stop animation based on flickerEnabled/generative mode and pause state
  useEffect(() => {
    const shouldRun = (flickerEnabled || patternMode === 'generative') && safetyAcknowledged && !isPaused
    
    if (shouldRun && patternCanvasRef.current) {
      // Reset state
      frameCountRef.current = 0
      phaseAccumulatorRef.current = 0
      isOnRef.current = false
      startTimeRef.current = performance.now() // FIXED: Use performance.now()
      lastRenderTimeRef.current = performance.now()
      statsRef.current = { lastFrameTime: 0, droppedFrames: 0, actualHz: 0 }
      
      // Invalidate cache when restarting
      cacheCanvasRef.current = null
      
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
        canvas.style.filter = 'none'
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
          canvas.style.filter = 'none'
        }
      } else if (!document.hidden && (flickerEnabled || patternMode === 'generative') && safetyAcknowledged && !isPaused) {
        // Resume when visible
        frameCountRef.current = 0
        phaseAccumulatorRef.current = 0
        startTimeRef.current = performance.now() // FIXED: Use performance.now()
        lastRenderTimeRef.current = performance.now()
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [flickerEnabled, patternMode, safetyAcknowledged, isPaused, animate, colors.offColor])

  // Compute class based on mode
  const modeClass = `flicker-canvas flicker-${flickerMode}`

  // Calculate final noise opacity
  const effectiveNoise = neurofeedbackEnabled ? noiseVolumeModulation : visualNoise
  const noiseOpacity = effectiveNoise / 100

  // Calculate pattern blur based on coherence (moved to animate loop for batching)
  // No longer needed here

  return (
    <>
      {/* Pattern canvas - renders geometric patterns */}
      <canvas 
        ref={patternCanvasRef}
        className={modeClass}
        onClick={togglePause}
        aria-hidden="true"
        data-active={flickerEnabled}
        style={{
          transition: 'filter 0.5s ease' // Smooth blur transitions
        }}
      />
      
      {/* Visual noise overlay - dynamic WebGL noise (performance debugging toggle) */}
      {visualNoiseEnabled && <NoiseOverlay opacity={noiseOpacity} />}
    </>
  )
}

// ============================================
// Optimized Helper Functions
// ============================================

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 255, g: 255, b: 255 }
}

// Optimized pattern rendering dispatcher
function renderPatternOptimized(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    patternType: string
    isOn: boolean
    onColor: string
    offColor: string
    config: any
    time: number
    parsedColors: { onRgb: any; offRgb: any }
  }
) {
  const renderContext: RenderContext = {
    ctx,
    width,
    height,
    isOn: options.isOn,
    onColor: options.onColor,
    offColor: options.offColor,
    config: options.config,
    time: options.time
  }
  
  renderPattern(options.patternType as any, renderContext)
}

// Optimized generative pattern rendering
function renderGenerativePatternOptimized(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    generativePatternType: string
    config: any
    time: number
    flickerState: boolean
    neurofeedback: any
  }
) {
  const generativeContext: GenerativeRenderContext = {
    ctx,
    width,
    height,
    config: options.config,
    time: options.time,
    flickerState: options.flickerState,
    neurofeedback: options.neurofeedback
  }
  
  renderGenerativePattern(options.generativePatternType as any, generativeContext)
}
