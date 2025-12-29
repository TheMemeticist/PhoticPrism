// ============================================
// Photic Prism - Zustand Global State Store
// ============================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  AppState, 
  SafetyState, 
  PauseState,
  ColorConfig, 
  AudioConfig, 
  DojoWindowConfig,
  ScheduleConfig,
  SessionLog,
  ValidFlickerFrequency,
  RandomizerMode,
  DaySchedule,
  PatternType,
  PatternConfig,
  PatternMode,
  GenerativePatternType,
  GenerativeConfig,
  SoundscapeConfig,
  SoundClass,
  SoundClassConfig
} from '../types'
import { calculateValidFrequencies } from '../utils/refreshRateUtils'
import { parseSchedule, randomizeBlocks } from '../utils/scheduleParser'
import { parseTableSchedule } from '../utils/tableScheduleParser'
import { randomizeTableSchedule } from '../utils/tableScheduleRandomizer'

// Default values
const DEFAULT_SAFETY: SafetyState = {
  acknowledged: false,
  emergencyStop: false,
  warningDismissed: false
}

const DEFAULT_PAUSE: PauseState = {
  isPaused: true // Always start paused - user must explicitly hit play
}

const DEFAULT_COLORS: ColorConfig = {
  onColor: '#ffffff',
  offColor: '#000000',
  brightness: 50, // Conservative default
  contrast: 50
}

const DEFAULT_AUDIO: AudioConfig = {
  enabled: true, // Audio enabled by default (starts paused)
  masterVolume: 80, // Master volume control (0-100%)
  carrierMode: 'auto', // Default to auto carrier frequency
  carrierFreq: 400, // Used when carrierMode = 'manual'
  beatFreq: 5, // Safe default frequency
  lockedToFlicker: true,
  volume: 70, // Binaural beats volume (0-100%)
  waveform: 'sine',
  ambientEnabled: false,
  ambientType: 'none',
  ambientVolume: 50, // Noise volume (0-100%)
  visualNoiseEnabled: false, // Visual noise disabled by default (auto-enable with neurofeedback)
  visualNoise: 20, // Default visual noise level
  visualNoiseLockedToAudio: true // Locked to audio noise by default
}

const DEFAULT_DOJO_WINDOW: DojoWindowConfig = {
  visible: false,
  position: { x: 50, y: 50 },
  size: { width: 640, height: 360 },
  youtubeUrl: '',
  webcamEnabled: false,
  minimized: false
}

const DEFAULT_SCHEDULE: ScheduleConfig = {
  rawContent: '',
  parsedSchedule: [],
  currentDay: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
  randomMode: 'blocked',
  randomizedBlocks: [],
  trainerMode: false,
  currentRoutineIndex: 0,
  todayRoutine: []
}

// Initial refresh rate (will be updated on app load)
const INITIAL_REFRESH_RATE = 60

const DEFAULT_EEG: import('../types').EEGState = {
  connected: false,
  calibrated: false,
  device: null,
  streaming: false,
  isCalibrating: false,
  calibrationStartTime: undefined,
  calibrationDuration: undefined
}

const DEFAULT_NEUROFEEDBACK: import('../types').NeurofeedbackConfig = {
  enabled: false,
  targetBand: 'auto',
  sensitivity: 1.5, // Increased default sensitivity
  smoothing: 0.7,
  modulationDepth: {
    brightness: 50, // Increased modulation depth
    beatVolume: 50,
    noiseVolume: 40
  }
}

const DEFAULT_NEUROFEEDBACK_STATE: import('../types').NeurofeedbackState = {
  coherenceScore: 0,
  targetBand: 'alpha',
  brightnessModulation: 50,
  beatVolumeModulation: 50,
  noiseVolumeModulation: 20
}

// Default pattern configuration (science-based defaults)
const DEFAULT_PATTERN_CONFIG: PatternConfig = {
  // Common
  contrast: 100, // Full contrast for maximum effect
  
  // Checkerboard (ISCEV standard: 0.8 degree checks)
  checkSize: 32, // pixels, ~0.8 degrees at typical viewing distance
  
  // Grating/Gabor
  spatialFrequency: 0.5, // cycles per degree
  orientation: 0, // horizontal
  gratingWaveform: 'sine',
  gaborSigma: 50, // Gaussian window size in pixels
  
  // Concentric rings
  ringCount: 8,
  ringWidth: 60, // pixels per ring
  
  // Motion
  motionSpeed: 100, // pixels/second
  motionAmplitude: 50, // max displacement in pixels
  
  // Sparse (QR-like)
  sparsity: 30, // 30% filled for comfort
  blockSize: 24, // pixel size of blocks
  
  // Fractal
  fractalDimension: 1.5, // Mid-range complexity
  fractalScale: 1.0,
  fractalOctaves: 4
}

// Default generative pattern configuration (meditation/sacred geometry defaults)
const DEFAULT_GENERATIVE_CONFIG: GenerativeConfig = {
  // Base parameters
  complexity: 50, // Medium complexity
  evolutionSpeed: 30, // Gentle evolution
  symmetryOrder: 6, // Hexagonal symmetry (common in nature)
  scale: 1.0, // Normal size
  rotation: 0, // Start at 0 degrees
  
  // Visual style
  colorPalette: 'chakra',
  lineThickness: 2,
  glowIntensity: 30,
  
  // Animation
  breathingRate: 0.5, // Slow breathing (calming)
  rotationSpeed: 5, // Gentle rotation
  zoomSpeed: 0, // No zoom by default
  
  // Fractal-specific
  juliaC: { real: -0.7, imag: 0.27015 }, // Classic Julia set parameter
  mandelbrotZoom: 1.0,
  maxIterations: 100,
  
  // L-System specific
  lSystemRules: 'F→F+F--F+F', // Simple fractal rule
  lSystemAngle: 60, // 60 degree turns
  lSystemIterations: 4,
  
  // Sacred geometry specific
  geometryDetail: 12, // 12 circles/triangles
  innerGlow: true,
  
  // Neurofeedback modulation (moderate influence by default)
  alphaInfluence: 50, // Alpha affects complexity
  thetaInfluence: 40, // Theta affects depth/flow
  betaInfluence: 20, // Beta affects speed
  gammaInfluence: 30, // Gamma affects detail
  coherenceResponse: 60 // Strong breathing sync with coherence
}

// Default soundscape configuration
const DEFAULT_SOUNDSCAPE: SoundscapeConfig = {
  enabled: false,
  masterVolume: 50,
  classes: {
    ambience: { enabled: false, bpm: 0.5, minGap: 10, maxGap: 120, reinforcementMode: 'neutral' },
    amphibians: { enabled: false, bpm: 1.5, minGap: 8, maxGap: 90, reinforcementMode: 'positive' },
    birds: { enabled: false, bpm: 2, minGap: 5, maxGap: 60, reinforcementMode: 'positive' },
    foley: { enabled: false, bpm: 3, minGap: 2, maxGap: 30, reinforcementMode: 'neutral' },
    insects: { enabled: false, bpm: 1, minGap: 5, maxGap: 60, reinforcementMode: 'neutral' },
    mammals: { enabled: false, bpm: 0.3, minGap: 20, maxGap: 180, reinforcementMode: 'positive' },
    water: { enabled: false, bpm: 1.5, minGap: 5, maxGap: 60, reinforcementMode: 'neutral' },
    weather: { enabled: false, bpm: 1, minGap: 10, maxGap: 120, reinforcementMode: 'negative' }
  },
  neurofeedbackPolicy: {
    enabled: false,
    spatialBias: true,
    distanceMapping: true,
    positiveClasses: ['amphibians', 'birds', 'mammals'],
    negativeClasses: ['weather'],
    lfoFrequency: 0.1,
    lfoBias: 0.5
  },
  reverbEnabled: true,
  echoEnabled: false,
  echoTime: 0.3,
  echoFeedback: 0.3
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Safety
      safety: DEFAULT_SAFETY,
      
      // Pause
      pause: DEFAULT_PAUSE,
      
      // Display
      refreshRate: INITIAL_REFRESH_RATE,
      validFrequencies: calculateValidFrequencies(INITIAL_REFRESH_RATE),
      
      // Flicker - safe defaults
      flickerEnabled: true, // Default ON since we start paused (user just needs to unpause)
      flickerHz: 5, // Safe default frequency (theta/alpha transition)
      flickerMode: 'fullscreen',
      snapToValid: true, // Default to snapping to perfect Hz
      
      // Pattern - science-based defaults
      patternMode: 'clinical' as PatternMode,
      patternType: 'fullfield' as PatternType,
      patternConfig: DEFAULT_PATTERN_CONFIG,
      
      // Generative patterns - meditation/sacred geometry defaults
      generativePatternType: 'flower-of-life' as GenerativePatternType,
      generativeConfig: DEFAULT_GENERATIVE_CONFIG,
      
      // Colors
      colors: DEFAULT_COLORS,
      
      // Audio
      audio: DEFAULT_AUDIO,
      
      // Dojo Window
      dojoWindow: DEFAULT_DOJO_WINDOW,
      
      // Schedule
      schedule: DEFAULT_SCHEDULE,
      
      // Session
      currentSession: null,
      sessionHistory: [],
      
      // EEG
      eeg: DEFAULT_EEG,
      eegReadings: [],
      eegGraphVisible: false,
      eegGraphTimeWindow: 60, // Default to 60 seconds
      
      // Neurofeedback
      neurofeedback: DEFAULT_NEUROFEEDBACK,
      neurofeedbackState: DEFAULT_NEUROFEEDBACK_STATE,
      coherenceHistory: [],
      
      // Soundscape
      soundscape: DEFAULT_SOUNDSCAPE,
      
      // Actions
      setSafety: (safety) => set((state) => ({
        safety: { ...state.safety, ...safety }
      })),
      
      togglePause: () => {
        const state = get()
        const newPaused = !state.pause.isPaused
        
        set((state) => ({
          pause: {
            isPaused: newPaused,
            lastPausedAt: newPaused ? Date.now() : undefined
          }
        }))
        
        console.log(newPaused ? '⏸️ PAUSED' : '▶️ RESUMED')
      },
      
      emergencyStop: () => {
        console.warn('🛑 EMERGENCY STOP TRIGGERED')
        set({
          flickerEnabled: false,
          audio: { ...get().audio, enabled: false },
          safety: { ...get().safety, emergencyStop: true }
        })
      },
      
      setRefreshRate: (hz) => {
        const validFrequencies = calculateValidFrequencies(hz)
        // Find closest valid Hz to current flickerHz
        const currentHz = get().flickerHz
        const closest = validFrequencies.reduce((prev, curr) => 
          Math.abs(curr.hz - currentHz) < Math.abs(prev.hz - currentHz) ? curr : prev
        )
        
        set({
          refreshRate: hz,
          validFrequencies,
          flickerHz: closest?.hz ?? 12
        })
      },
      
      setFlickerEnabled: (enabled) => {
        // Require safety acknowledgment before enabling
        if (enabled && !get().safety.acknowledged) {
          console.warn('Cannot enable flicker without safety acknowledgment')
          return
        }
        set({ flickerEnabled: enabled })
      },
      
      setFlickerHz: (hz) => {
        const state = get()
        // Snap to valid frequency
        const valid = state.validFrequencies.find(f => Math.abs(f.hz - hz) < 0.1)
        if (valid) {
          set({ flickerHz: valid.hz })
          // If audio is locked to flicker, update beat frequency
          if (state.audio.lockedToFlicker) {
            set({
              audio: { ...state.audio, beatFreq: valid.hz }
            })
          }
        }
      },
      
      setFlickerMode: (mode) => set({ flickerMode: mode }),
      
      setPatternMode: (mode) => {
        set({ patternMode: mode })
        console.log(`🎨 Pattern mode changed to: ${mode}`)
      },
      
      setPatternType: (type) => {
        set({ patternType: type })
        console.log(`🎨 Clinical pattern changed to: ${type}`)
      },
      
      setPatternConfig: (config) => set((state) => ({
        patternConfig: { ...state.patternConfig, ...config }
      })),
      
      setGenerativePatternType: (type) => {
        set({ generativePatternType: type })
        console.log(`🌀 Generative pattern changed to: ${type}`)
      },
      
      setGenerativeConfig: (config) => set((state) => ({
        generativeConfig: { ...state.generativeConfig, ...config }
      })),
      
      setColors: (colors) => set((state) => ({
        colors: { ...state.colors, ...colors }
      })),
      
      setAudio: (audio) => set((state) => ({
        audio: { ...state.audio, ...audio }
      })),
      
      setDojoWindow: (config) => set((state) => ({
        dojoWindow: { ...state.dojoWindow, ...config }
      })),
      
      loadSchedule: (content) => {
        // Auto-detect format: table vs markdown
        const isTableFormat = content.includes('| Activity') && content.includes('| Brainwave Target')
        const parsed = isTableFormat ? parseTableSchedule(content) : parseSchedule(content)
        
        // Get today's routine
        const today = get().schedule.currentDay
        const todaySchedule = parsed.find((d: DaySchedule) => d.day === today)
        const todayRoutine = todaySchedule?.blocks || []
        
        set((state) => ({
          schedule: {
            ...state.schedule,
            rawContent: content,
            parsedSchedule: parsed,
            todayRoutine
          }
        }))
        
        console.log(`📅 Loaded schedule: ${parsed.length} days, ${todayRoutine.length} activities today`)
      },
      
      setRandomMode: (mode) => set((state) => ({
        schedule: { ...state.schedule, randomMode: mode }
      })),
      
      randomizeSchedule: () => {
        const state = get()
        
        // Check if using table format (has all 7 days)
        if (state.schedule.parsedSchedule.length === 7) {
          // Table format: randomize by picking day variants for each activity slot
          const randomized = randomizeTableSchedule(state.schedule.parsedSchedule)
          set((state) => ({
            schedule: { 
              ...state.schedule, 
              randomizedBlocks: randomized,
              todayRoutine: randomized
            }
          }))
          console.log(`🔀 Table randomized: ${randomized.length} activities (picked random day variant per activity)`)
        } else {
          // Markdown format: use traditional randomizer
          const todaySchedule = state.schedule.parsedSchedule.find(
            d => d.day.toLowerCase() === state.schedule.currentDay.toLowerCase()
          )
          
          if (todaySchedule) {
            const randomized = randomizeBlocks(
              todaySchedule.blocks,
              state.schedule.randomMode
            )
            set((state) => ({
              schedule: { 
                ...state.schedule, 
                randomizedBlocks: randomized,
                todayRoutine: randomized
              }
            }))
            console.log(`🔀 Randomized ${randomized.length} activities (${state.schedule.randomMode} mode)`)
          }
        }
      },
      
      setTrainerMode: (enabled) => {
        set((state) => ({
          schedule: { ...state.schedule, trainerMode: enabled }
        }))
        
        // If enabling, load first activity
        if (enabled) {
          get().goToActivity(0)
        }
      },
      
      nextActivity: () => {
        const state = get()
        const routine = state.schedule.todayRoutine
        if (routine.length === 0) return
        
        const nextIndex = (state.schedule.currentRoutineIndex + 1) % routine.length
        get().goToActivity(nextIndex)
      },
      
      previousActivity: () => {
        const state = get()
        const routine = state.schedule.todayRoutine
        if (routine.length === 0) return
        
        const prevIndex = state.schedule.currentRoutineIndex === 0
          ? routine.length - 1
          : state.schedule.currentRoutineIndex - 1
        get().goToActivity(prevIndex)
      },
      
      goToActivity: (index) => {
        const state = get()
        const routine = state.schedule.todayRoutine
        if (!routine[index]) return
        
        const activity = routine[index]
        
        // Update schedule index
        set((state) => ({
          schedule: { ...state.schedule, currentRoutineIndex: index }
        }))
        
        // Apply activity settings if metadata exists
        if (activity.metadata) {
          if (activity.metadata.brainwaveHz) {
            set({ flickerHz: activity.metadata.brainwaveHz })
          }
          if (activity.metadata.onColor) {
            set((state) => ({
              colors: { ...state.colors, onColor: activity.metadata!.onColor! }
            }))
          }
        }
        
        // Load YouTube video
        if (activity.youtubeUrl) {
          // Check if pop-out window is active
          const popout = (window as any).__photoprism_popout
          const hasPopout = popout && !popout.closed
          
          // Update URL but don't set visible if pop-out is active
          set((state) => ({
            dojoWindow: {
              ...state.dojoWindow,
              youtubeUrl: activity.youtubeUrl!,
              visible: hasPopout ? false : true // Don't re-open if pop-out exists
            }
          }))
          
          // Notify pop-out window of video change
          if (hasPopout) {
            popout.postMessage({ 
              type: 'video-change', 
              videoId: activity.youtubeUrl 
            }, '*')
          }
        }
        
        console.log(`🎯 Trainer: Loaded activity ${index + 1}/${routine.length}: ${activity.title}`)
      },
      
      startSession: () => {
        const state = get()
        const session: SessionLog = {
          id: crypto.randomUUID(),
          startTime: Date.now(),
          flickerHz: state.flickerHz,
          audioHz: state.audio.beatFreq,
          colors: { ...state.colors },
          audioConfig: { ...state.audio }
        }
        set({ currentSession: session })
      },
      
      endSession: () => {
        const state = get()
        if (state.currentSession) {
          const completedSession: SessionLog = {
            ...state.currentSession,
            endTime: Date.now()
          }
          set((state) => ({
            currentSession: null,
            sessionHistory: [...state.sessionHistory, completedSession]
          }))
        }
      },
      
      exportSession: () => {
        const state = get()
        return state.currentSession || 
          (state.sessionHistory.length > 0 
            ? state.sessionHistory[state.sessionHistory.length - 1] 
            : null)
      },
      
      setEEG: (eegState) => set((state) => ({
        eeg: { ...state.eeg, ...eegState }
      })),
      
      addEEGReading: (reading) => set((state) => {
        const newReadings = [...state.eegReadings, reading]
        // Keep only last 5 minutes of data (300 seconds * typical 1Hz = ~300 readings)
        const maxReadings = 300
        return {
          eegReadings: newReadings.length > maxReadings 
            ? newReadings.slice(-maxReadings) 
            : newReadings
        }
      }),
      
      setEEGGraphVisible: (visible) => set({ eegGraphVisible: visible }),
      
      setEEGGraphTimeWindow: (seconds) => set({ eegGraphTimeWindow: seconds }),
      
      setNeurofeedback: (config) => {
        const state = get()
        
        // Auto-enable visual noise + ambient noise when neurofeedback is enabled
        if (config.enabled === true) {
          const updates: Partial<AudioConfig> = {}
          
          if (!state.audio.visualNoiseEnabled) {
            updates.visualNoiseEnabled = true
            console.log('🧠 Neurofeedback enabled - auto-enabled visual noise for modulation')
          }
          
          if (!state.audio.ambientEnabled) {
            updates.ambientEnabled = true
            updates.ambientType = 'pink' // Default to pink noise
            console.log('🧠 Neurofeedback enabled - auto-enabled ambient noise for modulation')
          }
          
          if (Object.keys(updates).length > 0) {
            set((state) => ({
              neurofeedback: { ...state.neurofeedback, ...config },
              audio: { ...state.audio, ...updates }
            }))
          } else {
            set((state) => ({
              neurofeedback: { ...state.neurofeedback, ...config }
            }))
          }
        } else if (config.enabled === false) {
          // Optionally disable visual/ambient when neurofeedback is disabled
          // For now, just update neurofeedback config (user can manually control noise)
          set((state) => ({
            neurofeedback: { ...state.neurofeedback, ...config }
          }))
        } else {
          set((state) => ({
            neurofeedback: { ...state.neurofeedback, ...config }
          }))
        }
      },
      
      updateNeurofeedbackState: (nfState) => set((state) => ({
        neurofeedbackState: { ...state.neurofeedbackState, ...nfState }
      })),
      
      addCoherenceReading: (reading) => set((state) => {
        const newHistory = [...state.coherenceHistory, reading]
        // Keep only last hour of data (3600 seconds at typical 1Hz = ~3600 readings)
        const maxReadings = 3600
        return {
          coherenceHistory: newHistory.length > maxReadings 
            ? newHistory.slice(-maxReadings) 
            : newHistory
        }
      }),
      
      setSoundscape: (config) => set((state) => ({
        soundscape: { ...state.soundscape, ...config }
      })),
      
      setSoundscapeClass: (soundClass, config) => set((state) => ({
        soundscape: {
          ...state.soundscape,
          classes: {
            ...state.soundscape.classes,
            [soundClass]: { ...state.soundscape.classes[soundClass], ...config }
          }
        }
      }))
    }),
    {
      name: 'photic-prism-storage',
      // Only persist certain fields
      partialize: (state) => ({
        safety: { 
          acknowledged: state.safety.acknowledged,
          acknowledgedAt: state.safety.acknowledgedAt,
          warningDismissed: state.safety.warningDismissed
        },
        refreshRate: state.refreshRate,
        flickerHz: state.flickerHz,
        flickerMode: state.flickerMode,
        colors: state.colors,
        audio: state.audio,
        dojoWindow: {
          position: state.dojoWindow.position,
          size: state.dojoWindow.size
        },
        schedule: {
          rawContent: state.schedule.rawContent,
          randomMode: state.schedule.randomMode
        },
        sessionHistory: state.sessionHistory.slice(-20) // Keep last 20 sessions
      })
    }
  )
)

// Selector hooks for performance
export const useSafety = () => useAppStore((s) => s.safety)
export const useFlicker = () => useAppStore((s) => ({
  enabled: s.flickerEnabled,
  hz: s.flickerHz,
  mode: s.flickerMode,
  colors: s.colors,
  validFrequencies: s.validFrequencies
}))
export const useAudio = () => useAppStore((s) => s.audio)
export const useDojoWindow = () => useAppStore((s) => s.dojoWindow)
export const useSchedule = () => useAppStore((s) => s.schedule)
