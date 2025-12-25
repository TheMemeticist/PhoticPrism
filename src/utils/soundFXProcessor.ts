// ============================================
// Sound FX Processor
// ============================================
// Spatial audio FX chain with neurofeedback modulation

import { SoundVariant, ActiveSoundChain, NeurofeedbackSoundPolicy, ReinforcementMode } from '../types/soundscape'
import { NeurofeedbackState } from '../types'

/**
 * Simple algorithmic reverb using multiple delays
 */
class AlgorithmicReverb {
  private context: AudioContext
  private input: GainNode
  private output: GainNode
  private delays: DelayNode[] = []
  private gains: GainNode[] = []

  constructor(context: AudioContext) {
    this.context = context
    this.input = context.createGain()
    this.output = context.createGain()

    // Create 6 delays with different times for diffusion
    const delayTimes = [0.037, 0.041, 0.043, 0.047, 0.053, 0.059]
    const gainValues = [0.6, 0.5, 0.45, 0.4, 0.35, 0.3]

    delayTimes.forEach((time, i) => {
      const delay = context.createDelay()
      delay.delayTime.value = time

      const gain = context.createGain()
      gain.gain.value = gainValues[i]

      this.input.connect(delay)
      delay.connect(gain)
      gain.connect(this.output)

      // Feedback for reverb tail
      gain.connect(delay)

      this.delays.push(delay)
      this.gains.push(gain)
    })
  }

  getInput(): AudioNode {
    return this.input
  }

  getOutput(): AudioNode {
    return this.output
  }

  dispose(): void {
    this.delays.forEach(d => d.disconnect())
    this.gains.forEach(g => g.disconnect())
    this.input.disconnect()
    this.output.disconnect()
  }
}

/**
 * FX Processor - Creates and manages audio effect chains
 */
export class SoundFXProcessor {
  private context: AudioContext
  private masterGain: GainNode
  private reverbNode: AlgorithmicReverb
  private echoDelay: DelayNode
  private echoFeedback: GainNode
  private echoWet: GainNode
  private activeSounds: Set<ActiveSoundChain> = new Set()
  
  // Neurofeedback state
  private nfState: NeurofeedbackState | null = null
  private nfPolicy: NeurofeedbackSoundPolicy
  
  // LFO for pan oscillation
  private lfoPhase: number = 0
  private lastLfoUpdate: number = 0

  constructor(
    context: AudioContext,
    masterGain: GainNode,
    nfPolicy: NeurofeedbackSoundPolicy
  ) {
    this.context = context
    this.masterGain = masterGain
    this.nfPolicy = nfPolicy

    // Create reverb
    this.reverbNode = new AlgorithmicReverb(context)
    this.reverbNode.getOutput().connect(masterGain)

    // Create echo (delay + feedback)
    this.echoDelay = context.createDelay(5.0) // Max 5 seconds
    this.echoDelay.delayTime.value = 0.3 // Default 300ms

    this.echoFeedback = context.createGain()
    this.echoFeedback.gain.value = 0.3 // 30% feedback

    this.echoWet = context.createGain()
    this.echoWet.gain.value = 0.2 // 20% wet

    // Echo routing: delay -> feedback -> delay (loop) + output
    this.echoDelay.connect(this.echoFeedback)
    this.echoFeedback.connect(this.echoDelay) // Feedback loop
    this.echoFeedback.connect(this.echoWet)
    this.echoWet.connect(masterGain)
  }

  /**
   * Update neurofeedback state (called from React hook)
   */
  updateNFState(nfState: NeurofeedbackState): void {
    this.nfState = nfState
    
    // Update active sounds with new NF state
    this.activeSounds.forEach(chain => {
      this.applyNeurofeedbackModulation(chain)
    })
  }

  /**
   * Update NF policy
   */
  updateNFPolicy(policy: Partial<NeurofeedbackSoundPolicy>): void {
    this.nfPolicy = { ...this.nfPolicy, ...policy }
  }

  /**
   * Update echo parameters
   */
  updateEcho(time: number, feedback: number): void {
    this.echoDelay.delayTime.value = time
    this.echoFeedback.gain.value = feedback
  }

  /**
   * Create a complete FX chain for a sound event
   */
  createSoundChain(
    buffer: AudioBuffer,
    variant: SoundVariant,
    scheduledTime: number,
    reinforcementMode: ReinforcementMode
  ): ActiveSoundChain {
    const now = this.context.currentTime

    // Create source
    const source = this.context.createBufferSource()
    source.buffer = buffer

    // Apply pitch jitter
    const [minPitch, maxPitch] = variant.pitchJitter
    const pitch = minPitch + Math.random() * (maxPitch - minPitch)
    source.playbackRate.value = pitch

    // Create gain with jitter
    const gainNode = this.context.createGain()
    const baseGain = variant.baseGain
    const jitter = (Math.random() - 0.5) * 2 * variant.gainJitter
    gainNode.gain.value = baseGain + jitter

    // Create stereo panner
    const panNode = this.context.createStereoPanner()
    const initialPan = this.getPanValue(variant.panPolicy)
    panNode.pan.value = initialPan

    // Create filter (for distance illusion)
    const filterNode = this.context.createBiquadFilter()
    filterNode.type = 'lowpass'
    filterNode.frequency.value = 20000 // Full brightness by default
    filterNode.Q.value = 1.0

    // Create reverb/echo sends
    const reverbSend = this.context.createGain()
    reverbSend.gain.value = variant.reverbSend

    const echoSend = this.context.createGain()
    echoSend.gain.value = 0.1 // Light echo by default

    // Connect chain: source -> gain -> pan -> filter -> master + sends
    source.connect(gainNode)
    gainNode.connect(panNode)
    panNode.connect(filterNode)
    
    // Dry signal to master
    filterNode.connect(this.masterGain)
    
    // Wet signals to FX
    filterNode.connect(reverbSend)
    reverbSend.connect(this.reverbNode.getInput())
    
    filterNode.connect(echoSend)
    echoSend.connect(this.echoDelay)

    // Create cleanup function
    const cleanup = () => {
      source.disconnect()
      gainNode.disconnect()
      panNode.disconnect()
      filterNode.disconnect()
      reverbSend.disconnect()
      echoSend.disconnect()
      this.activeSounds.delete(chain)
    }

    // Auto-cleanup when sound ends
    source.onended = cleanup

    const chain: ActiveSoundChain = {
      source,
      gainNode,
      panNode,
      filterNode,
      reverbSend,
      echoSend,
      startTime: now,
      variant,
      cleanup
    }

    // Apply neurofeedback modulation
    this.applyNeurofeedbackModulation(chain, reinforcementMode)

    // Start playback at scheduled time
    const playTime = Math.max(scheduledTime, now)
    source.start(playTime)

    // Track active sound
    this.activeSounds.add(chain)

    return chain
  }

  /**
   * Get pan value based on policy
   */
  private getPanValue(policy: string): number {
    switch (policy) {
      case 'center':
        return 0
      case 'random':
        return (Math.random() - 0.5) * 2 // -1 to 1
      case 'biased-left':
        return -0.5 + Math.random() * 0.5 // -1 to -0.5
      case 'biased-right':
        return 0.5 + Math.random() * 0.5 // 0.5 to 1
      default:
        return 0
    }
  }

  /**
   * Apply neurofeedback modulation to a sound chain
   */
  private applyNeurofeedbackModulation(
    chain: ActiveSoundChain,
    reinforcementMode?: ReinforcementMode
  ): void {
    if (!this.nfPolicy.enabled || !this.nfState) {
      return
    }

    const mode = reinforcementMode || 'neutral'
    const coherence = this.nfState.coherenceScore

    // Normalize coherence to 0-1 range (assuming -3 to +3 range)
    const normalizedCoherence = Math.max(-1, Math.min(1, coherence / 3))

    // Determine if this is a positive or negative reinforcement class
    const isPositive = this.nfPolicy.positiveClasses.includes(chain.variant.class as any)
    const isNegative = this.nfPolicy.negativeClasses.includes(chain.variant.class as any)

    // Calculate distance based on mode and coherence
    let distance = 0.5 // Neutral distance

    if (mode === 'positive' || isPositive) {
      // Positive reinforcement: on-target = closer (lower distance)
      // normalizedCoherence: -1 (off-target) to +1 (on-target)
      // distance: 0 (close) to 1 (far)
      distance = 0.5 - (normalizedCoherence * 0.5) // On-target: 0, Off-target: 1
    } else if (mode === 'negative' || isNegative) {
      // Negative reinforcement: on-target = farther/harsher
      distance = 0.5 + (normalizedCoherence * 0.5) // On-target: 1, Off-target: 0
    }

    // Clamp distance
    distance = Math.max(0, Math.min(1, distance))

    // Apply distance mapping if enabled
    if (this.nfPolicy.distanceMapping) {
      this.applyDistanceMapping(chain, distance)
    }

    // Apply spatial bias (pan oscillation) if enabled
    if (this.nfPolicy.spatialBias) {
      this.applyPanOscillation(chain, normalizedCoherence)
    }
  }

  /**
   * Apply distance illusion (gain + LPF + reverb)
   */
  private applyDistanceMapping(chain: ActiveSoundChain, distance: number): void {
    const now = this.context.currentTime

    // Gain attenuation: closer = louder
    const gainAttenuation = 1 - (distance * 0.7) // 0.3 to 1.0
    chain.gainNode.gain.setTargetAtTime(
      chain.variant.baseGain * gainAttenuation,
      now,
      0.1
    )

    // LPF: closer = brighter (higher cutoff)
    const cutoffFreq = 20000 - (distance * 18000) // 2000Hz to 20000Hz
    chain.filterNode.frequency.setTargetAtTime(cutoffFreq, now, 0.1)

    // Reverb: closer = drier (less reverb)
    const reverbMix = distance * 0.6 // 0 to 0.6
    chain.reverbSend.gain.setTargetAtTime(reverbMix, now, 0.1)
  }

  /**
   * Apply pan oscillation with NF bias
   */
  private applyPanOscillation(chain: ActiveSoundChain, normalizedCoherence: number): void {
    const now = this.context.currentTime

    // Update LFO phase
    if (this.lastLfoUpdate > 0) {
      const deltaTime = now - this.lastLfoUpdate
      this.lfoPhase += deltaTime * this.nfPolicy.lfoFrequency * Math.PI * 2
    }
    this.lastLfoUpdate = now

    // Calculate LFO value
    const lfoValue = Math.sin(this.lfoPhase) * 0.5 // -0.5 to 0.5

    // Add NF bias: on-target = centered/wider, off-target = narrower
    const bias = normalizedCoherence * this.nfPolicy.lfoBias * 0.3

    const pan = lfoValue + bias
    const clampedPan = Math.max(-1, Math.min(1, pan))

    chain.panNode.pan.setTargetAtTime(clampedPan, now, 0.05)
  }

  /**
   * Update master volume
   */
  setMasterVolume(volume: number): void {
    // Volume is 0-100, convert to 0-1
    this.masterGain.gain.setTargetAtTime(volume / 100, this.context.currentTime, 0.1)
  }

  /**
   * Stop all active sounds
   */
  stopAll(): void {
    this.activeSounds.forEach(chain => {
      try {
        chain.source.stop()
        chain.cleanup()
      } catch (err) {
        // Ignore if already stopped
      }
    })
    this.activeSounds.clear()
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.stopAll()
    this.reverbNode.dispose()
    this.echoDelay.disconnect()
    this.echoFeedback.disconnect()
    this.echoWet.disconnect()
  }

  /**
   * Get active sound count
   */
  getActiveSoundCount(): number {
    return this.activeSounds.size
  }
}
