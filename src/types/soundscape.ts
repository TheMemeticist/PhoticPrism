// ============================================
// Soundscape Engine - Type Definitions
// ============================================

export type SoundClass = 
  | 'ambience'
  | 'amphibians'
  | 'birds'
  | 'foley'
  | 'insects'
  | 'mammals'
  | 'water'
  | 'weather'

export type PanPolicy = 'center' | 'random' | 'biased-left' | 'biased-right'

export type ReinforcementMode = 'positive' | 'negative' | 'neutral'

export interface SoundVariant {
  id: string
  class: SoundClass
  tags: string[]
  path: string
  duration: number
  weight: number // Relative selection probability (1.0 = normal)
  baseGain: number // 0-1, base volume
  gainJitter: number // ±random variation in gain
  pitchJitter: [number, number] // playbackRate range [min, max]
  panPolicy: PanPolicy
  reverbSend: number // 0-1, dry/wet mix for reverb
  cooldown: number // Min seconds before this variant can play again
}

export interface SoundManifest {
  version: string
  sounds: SoundVariant[]
}

export interface SoundClassConfig {
  enabled: boolean
  bpm: number // Events per minute (0.01-60)
  minGap: number // Minimum seconds between events (cluster prevention)
  maxGap: number // Maximum seconds between events (ensures activity)
  reinforcementMode: ReinforcementMode // How NF affects this class
}

export interface NeurofeedbackSoundPolicy {
  enabled: boolean
  spatialBias: boolean // Pan bias based on coherence
  distanceMapping: boolean // Distance illusion based on coherence
  positiveClasses: SoundClass[] // Classes that get "closer" on-target
  negativeClasses: SoundClass[] // Classes that get "harsher" off-target
  lfoFrequency: number // Hz, pan oscillation rate (0.05-0.5)
  lfoBias: number // 0-1, how much NF affects LFO center point
}

export interface SoundscapeConfig {
  enabled: boolean
  masterVolume: number // 0-100
  classes: Record<SoundClass, SoundClassConfig>
  neurofeedbackPolicy: NeurofeedbackSoundPolicy
  reverbEnabled: boolean
  echoEnabled: boolean
  echoTime: number // Delay time in seconds
  echoFeedback: number // 0-1, echo decay rate
}

export interface ScheduledSoundEvent {
  variant: SoundVariant
  scheduledTime: number // AudioContext.currentTime when it should play
  actualPlayTime?: number // When it was actually triggered
}

export interface ActiveSoundChain {
  source: AudioBufferSourceNode
  gainNode: GainNode
  panNode: StereoPannerNode
  filterNode: BiquadFilterNode
  reverbSend: GainNode
  echoSend: GainNode
  startTime: number
  variant: SoundVariant
  cleanup: () => void
}
