// ============================================
// Photic Prism - Core Type Definitions
// ============================================

// Display & Flicker Types
export interface RefreshRateOption {
  label: string
  hz: number
}

export interface ValidFlickerFrequency {
  hz: number
  framesPerCycle: number
  label: string
}

// Pattern Types (from science research)
export type PatternType = 
  | 'fullfield'           // 1) Full-field luminance flicker (baseline)
  | 'checkerboard'        // 2) Pattern-reversal checkerboards (clinical workhorse)
  | 'grating'             // 3) Gratings (sine/square wave)
  | 'gabor'               // 3) Gabor patches (windowed grating)
  | 'concentric'          // 4) Concentric rings / radial checkerboard
  | 'motion-radial'       // 5) Motion-based: radial expansion/contraction
  | 'motion-rotation'     // 5) Motion-based: rotation
  | 'sparse'              // 6) QR-code-like sparse patterns
  | 'fractal'             // 7) Fractal backgrounds

// Generative Pattern Types (meditation/sacred geometry)
export type GenerativePatternType =
  | 'sri-yantra'          // Sacred geometry - proven EEG alpha induction
  | 'flower-of-life'      // Interlocking circles - harmony/unity
  | 'metatron-cube'       // Complex lattice with Platonic solids
  | 'l-system-tree'       // Organic branching L-system
  | 'l-system-spiral'     // Spiral L-system pattern
  | 'julia-set'           // Mathematical fractal
  | 'mandelbrot'          // Classic fractal zoom
  | 'kaleidoscope'        // Real-time mirroring effect
  | 'mandala-parametric'  // Rotating symmetric mandala
  | 'perlin-flow'         // Organic flowing noise field
  | 'sacred-spiral'       // Golden ratio spiral
  | 'torus-knot'          // 3D torus knot projection

export type PatternMode = 'clinical' | 'generative'

export type GratingWaveform = 'sine' | 'square'

export type ColorPalette = 'rainbow' | 'chakra' | 'monochrome' | 'earth' | 'ocean' | 'fire'

export interface PatternConfig {
  // Common parameters
  contrast: number // 0-100, affects black-white difference
  
  // Checkerboard specific
  checkSize: number // pixels per check
  
  // Grating/Gabor specific
  spatialFrequency: number // cycles per degree (or pixels)
  orientation: number // degrees, 0-180
  gratingWaveform: GratingWaveform
  gaborSigma: number // Gaussian window size (for Gabor only)
  
  // Concentric rings specific
  ringCount: number // number of rings
  ringWidth: number // pixels per ring
  
  // Motion specific
  motionSpeed: number // pixels/second or degrees/second
  motionAmplitude: number // max displacement
  
  // Sparse pattern specific
  sparsity: number // 0-100, percentage of filled area
  blockSize: number // size of QR-like blocks
  
  // Fractal specific
  fractalDimension: number // 1.0 to 3.0, complexity
  fractalScale: number // zoom level
  fractalOctaves: number // detail layers
}

// Generative Pattern Configuration (meditation/sacred geometry)
export interface GenerativeConfig {
  // Base parameters
  complexity: number // 0-100, overall detail/intricacy
  evolutionSpeed: number // 0-100, how fast patterns evolve/breathe
  symmetryOrder: number // 3,4,5,6,8,12... rotational symmetry
  scale: number // 0.5-2.0, overall size multiplier
  rotation: number // 0-360, base rotation angle
  
  // Visual style
  colorPalette: ColorPalette
  lineThickness: number // 1-10, stroke width
  glowIntensity: number // 0-100, glow/bloom effect
  
  // Animation
  breathingRate: number // 0-2, pulsation cycles per second
  rotationSpeed: number // -100 to 100, rotation speed (negative = reverse)
  zoomSpeed: number // -100 to 100, zoom in/out speed
  
  // Fractal-specific
  juliaC: { real: number; imag: number } // Julia set parameter
  mandelbrotZoom: number // Mandelbrot zoom level
  maxIterations: number // Fractal iteration limit (quality)
  
  // L-System specific
  lSystemRules: string // Production rules
  lSystemAngle: number // Turn angle in degrees
  lSystemIterations: number // Recursion depth
  
  // Sacred geometry specific
  geometryDetail: number // Triangle/circle count for sacred patterns
  innerGlow: boolean // Luminous effect
  
  // Neurofeedback modulation (0-100 = % influence)
  alphaInfluence: number // How much alpha waves affect complexity
  thetaInfluence: number // Theta influence on depth/flow
  betaInfluence: number // Beta influence on speed/sharpness
  gammaInfluence: number // Gamma influence on detail/sparkle
  coherenceResponse: number // Pattern breathing synced to coherence
}

// Color Types
export interface ColorConfig {
  onColor: string
  offColor: string
  brightness: number // 0-100
  contrast: number // 0-100
}

// Audio Types
export type WaveformType = 'sine' | 'triangle' | 'square' | 'sawtooth'
export type CarrierMode = 'manual' | 'auto'

export interface AudioConfig {
  enabled: boolean
  masterVolume: number // 0-100 - master volume control for all audio
  carrierMode: CarrierMode // Manual or Auto carrier frequency selection
  carrierFreq: number // Hz, typically 200-600 (used when carrierMode = 'manual')
  beatFreq: number // Hz, the binaural beat frequency
  lockedToFlicker: boolean
  volume: number // 0-100 - binaural beats volume
  waveform: WaveformType
  ambientEnabled: boolean
  ambientType: 'pink' | 'white' | 'brown' | 'none'
  ambientVolume: number // 0-100 - noise volume
  visualNoiseEnabled: boolean // Toggle visual noise on/off (performance debugging)
  visualNoise: number // 0-100 - visual noise overlay opacity
  visualNoiseLockedToAudio: boolean // Lock visual noise to audio noise
}

// Dojo Window Types
export type WindowPreset = 'corner-tl' | 'corner-tr' | 'corner-bl' | 'corner-br' | 'center' | 'side-left' | 'side-right'

export interface WindowPosition {
  x: number
  y: number
}

export interface WindowSize {
  width: number
  height: number
}

export interface DojoWindowConfig {
  visible: boolean
  position: WindowPosition
  size: WindowSize
  youtubeUrl: string
  webcamEnabled: boolean
  minimized: boolean
}

// Schedule Types
export type RandomizerMode = 'blocked' | 'random' | 'progressive'

export interface ScheduleBlock {
  id: string
  slotType: string // e.g., "Qigong", "Yoga", "Pranayama"
  title: string
  duration?: number // minutes
  youtubeUrl?: string
  tags: string[]
  description?: string
  order?: number
  phase?: 'warmup' | 'main' | 'cooldown'
  metadata?: {
    brainwaveHz?: number
    onColor?: string
  }
  // Editing support
  isEdited?: boolean
  originalData?: {
    title?: string
    youtubeUrl?: string
    brainwaveHz?: number
    onColor?: string
  }
}

export interface DaySchedule {
  day: string
  blocks: ScheduleBlock[]
}

export interface ScheduleConfig {
  rawContent: string
  parsedSchedule: DaySchedule[]
  currentDay: string
  randomMode: RandomizerMode
  randomizedBlocks: ScheduleBlock[]
  trainerMode: boolean
  currentRoutineIndex: number
  todayRoutine: ScheduleBlock[]
}

// Session Logging Types
export interface SessionLog {
  id: string
  startTime: number
  endTime?: number
  flickerHz: number
  audioHz: number
  colors: ColorConfig
  audioConfig: AudioConfig
  notes?: string
}

// EEG Types
export interface EEGDataPoint {
  timestamp: number
  alpha: number
  beta: number
  delta: number
  gamma: number
  theta: number
}

export interface CoherenceDataPoint {
  timestamp: number
  score: number
  targetBand: BrainwaveBand
}

export interface EEGState {
  connected: boolean
  calibrated: boolean
  device: string | null
  streaming: boolean
  isCalibrating?: boolean
  calibrationStartTime?: number
  calibrationDuration?: number
}

// Neurofeedback Types
export type BrainwaveBand = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'

export interface NeurofeedbackConfig {
  enabled: boolean
  targetBand: 'auto' | BrainwaveBand
  sensitivity: number // 0.5 to 2.0
  smoothing: number // 0.1 to 0.9 (exponential moving average factor)
  modulationDepth: {
    brightness: number // 0-50% max deviation from base
    beatVolume: number // 0-50% max deviation from base
    noiseVolume: number // 0-50% max deviation from base
  }
}

export interface NeurofeedbackState {
  coherenceScore: number // -3 to +3 typically
  targetBand: BrainwaveBand
  brightnessModulation: number // 0-100%
  beatVolumeModulation: number // 0-100%
  noiseVolumeModulation: number // 0-100%
}

// Safety Types
export interface SafetyState {
  acknowledged: boolean
  acknowledgedAt?: number
  emergencyStop: boolean
  warningDismissed: boolean
}

// Pause State
export interface PauseState {
  isPaused: boolean
  lastPausedAt?: number
}

// Hz Sensitivity Ranges
export const SENSITIVE_HZ_RANGES = [
  { min: 10, max: 25, level: 'high' as const, warning: 'This range (10-25 Hz) is most associated with photosensitive seizure risk.' },
  { min: 3, max: 10, level: 'medium' as const, warning: 'Lower alpha range - use with caution.' },
  { min: 25, max: 40, level: 'medium' as const, warning: 'Beta/gamma range - monitor for discomfort.' },
  { min: 40, max: 60, level: 'low' as const, warning: 'High gamma - generally considered safer.' },
]

// Preset Refresh Rates
export const COMMON_REFRESH_RATES: RefreshRateOption[] = [
  { label: '60 Hz (Standard)', hz: 60 },
  { label: '75 Hz', hz: 75 },
  { label: '90 Hz', hz: 90 },
  { label: '120 Hz', hz: 120 },
  { label: '144 Hz (Gaming)', hz: 144 },
  { label: '165 Hz', hz: 165 },
  { label: '240 Hz', hz: 240 },
]

// Default safe Hz presets
export const SAFE_HZ_PRESETS = [10, 12, 15, 20, 30, 40] as const

// Import soundscape types
import type { SoundscapeConfig, SoundClass, SoundClassConfig } from './soundscape'

// App State (complete Zustand store type)
export interface AppState {
  // Safety
  safety: SafetyState
  
  // Pause
  pause: PauseState
  
  // Display
  refreshRate: number
  validFrequencies: ValidFlickerFrequency[]
  
  // Flicker
  flickerEnabled: boolean
  flickerHz: number
  flickerMode: 'fullscreen' | 'reduced' | 'border'
  snapToValid: boolean
  
  // Pattern (science-based clinical patterns)
  patternMode: PatternMode
  patternType: PatternType
  patternConfig: PatternConfig
  
  // Generative patterns (meditation/sacred geometry)
  generativePatternType: GenerativePatternType
  generativeConfig: GenerativeConfig
  
  // Colors
  colors: ColorConfig
  
  // Audio
  audio: AudioConfig
  
  // Dojo Window
  dojoWindow: DojoWindowConfig
  
  // Schedule
  schedule: ScheduleConfig
  
  // Session
  currentSession: SessionLog | null
  sessionHistory: SessionLog[]
  
  // EEG
  eeg: EEGState
  eegReadings: EEGDataPoint[]
  eegGraphVisible: boolean
  eegGraphTimeWindow: number // seconds to display
  
  // Neurofeedback
  neurofeedback: NeurofeedbackConfig
  neurofeedbackState: NeurofeedbackState
  coherenceHistory: CoherenceDataPoint[]
  
  // Soundscape
  soundscape: SoundscapeConfig
  
  // Actions
  setSafety: (safety: Partial<SafetyState>) => void
  togglePause: () => void
  emergencyStop: () => void
  setRefreshRate: (hz: number) => void
  setFlickerEnabled: (enabled: boolean) => void
  setFlickerHz: (hz: number) => void
  setFlickerMode: (mode: 'fullscreen' | 'reduced' | 'border') => void
  setPatternMode: (mode: PatternMode) => void
  setPatternType: (type: PatternType) => void
  setPatternConfig: (config: Partial<PatternConfig>) => void
  setGenerativePatternType: (type: GenerativePatternType) => void
  setGenerativeConfig: (config: Partial<GenerativeConfig>) => void
  setColors: (colors: Partial<ColorConfig>) => void
  setAudio: (audio: Partial<AudioConfig>) => void
  setDojoWindow: (config: Partial<DojoWindowConfig>) => void
  loadSchedule: (content: string) => void
  setRandomMode: (mode: RandomizerMode) => void
  randomizeSchedule: () => void
  setTrainerMode: (enabled: boolean) => void
  nextActivity: () => void
  previousActivity: () => void
  goToActivity: (index: number) => void
  updateScheduleBlock: (blockId: string, updates: Partial<ScheduleBlock>) => void
  startSession: () => void
  endSession: () => void
  exportSession: () => SessionLog | null
  setEEG: (state: Partial<EEGState>) => void
  addEEGReading: (reading: EEGDataPoint) => void
  setEEGGraphVisible: (visible: boolean) => void
  setEEGGraphTimeWindow: (seconds: number) => void
  setNeurofeedback: (config: Partial<NeurofeedbackConfig>) => void
  updateNeurofeedbackState: (state: Partial<NeurofeedbackState>) => void
  addCoherenceReading: (reading: CoherenceDataPoint) => void
  setSoundscape: (config: Partial<SoundscapeConfig>) => void
  setSoundscapeClass: (soundClass: SoundClass, config: Partial<SoundClassConfig>) => void
}

// Re-export soundscape types for convenience
export type { SoundscapeConfig, SoundClass, SoundClassConfig } from './soundscape'
