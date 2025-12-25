// ============================================
// Soundscape Scheduler
// ============================================
// Stochastic event scheduler using Poisson process with lookahead

import { SoundClass, SoundClassConfig, ScheduledSoundEvent, SoundVariant } from '../types/soundscape'
import { SoundAssetLoader } from './soundAssetLoader'

/**
 * Per-class scheduler implementing Poisson process
 */
class SoundClassScheduler {
  private soundClass: SoundClass
  private config: SoundClassConfig
  private assetLoader: SoundAssetLoader
  private nextEventTime: number = 0
  private audioContext: AudioContext

  constructor(
    soundClass: SoundClass,
    config: SoundClassConfig,
    audioContext: AudioContext,
    assetLoader: SoundAssetLoader
  ) {
    this.soundClass = soundClass
    this.config = config
    this.audioContext = audioContext
    this.assetLoader = assetLoader
    this.scheduleNext() // Initialize first event time
  }

  /**
   * Update configuration (BPM, gaps, etc.)
   */
  updateConfig(config: Partial<SoundClassConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Calculate next inter-arrival time using exponential distribution
   * Formula: Δt = -ln(U) / λ
   * where λ = events/sec (BPM / 60)
   */
  private calculateInterArrivalTime(): number {
    const lambda = this.config.bpm / 60 // Convert BPM to events/sec
    
    if (lambda <= 0) {
      return Infinity // No events if BPM is 0
    }

    // Exponential distribution: -ln(U) / λ
    const u = Math.random()
    let delta = -Math.log(u) / lambda

    // Clamp to min/max gap to prevent clustering or long silence
    if (this.config.minGap > 0) {
      delta = Math.max(delta, this.config.minGap)
    }
    if (this.config.maxGap > 0 && this.config.maxGap < Infinity) {
      delta = Math.min(delta, this.config.maxGap)
    }

    return delta
  }

  /**
   * Schedule the next event time
   */
  private scheduleNext(): void {
    const now = this.audioContext.currentTime
    
    // If this is the first event, schedule it immediately
    if (this.nextEventTime === 0) {
      // Add small random delay (0-2 seconds) to avoid all classes starting simultaneously
      this.nextEventTime = now + Math.random() * 2
    } else {
      const delta = this.calculateInterArrivalTime()
      this.nextEventTime += delta
    }
  }

  /**
   * Check if an event is ready within the lookahead window
   * Returns the event if ready, null otherwise
   */
  checkLookahead(lookaheadTime: number): ScheduledSoundEvent | null {
    if (!this.config.enabled) {
      return null
    }

    const now = this.audioContext.currentTime
    const lookaheadEdge = now + lookaheadTime

    if (this.nextEventTime <= lookaheadEdge) {
      // Event is within lookahead window
      const variant = this.assetLoader.getRandomVariant(this.soundClass)
      
      if (!variant) {
        // No variant available, schedule next anyway
        this.scheduleNext()
        return null
      }

      const event: ScheduledSoundEvent = {
        variant,
        scheduledTime: this.nextEventTime
      }

      // Schedule next event
      this.scheduleNext()

      return event
    }

    return null
  }

  /**
   * Reset scheduler (clear next event time)
   */
  reset(): void {
    this.nextEventTime = 0
    this.scheduleNext()
  }
}

/**
 * Master soundscape scheduler
 * Manages all sound class schedulers with lookahead timing
 */
export class SoundscapeScheduler {
  private audioContext: AudioContext
  private assetLoader: SoundAssetLoader
  private classSchedulers: Map<SoundClass, SoundClassScheduler> = new Map()
  private lookaheadTime: number = 0.1 // 100ms lookahead
  private scheduleInterval: number = 25 // Check every 25ms
  private tickIntervalId: number | null = null
  private isRunning: boolean = false
  private eventCallback: ((event: ScheduledSoundEvent) => void) | null = null

  constructor(audioContext: AudioContext, assetLoader: SoundAssetLoader) {
    this.audioContext = audioContext
    this.assetLoader = assetLoader
  }

  /**
   * Initialize a sound class scheduler
   */
  initClass(soundClass: SoundClass, config: SoundClassConfig): void {
    const scheduler = new SoundClassScheduler(
      soundClass,
      config,
      this.audioContext,
      this.assetLoader
    )
    this.classSchedulers.set(soundClass, scheduler)
  }

  /**
   * Update configuration for a sound class
   */
  updateClass(soundClass: SoundClass, config: Partial<SoundClassConfig>): void {
    const scheduler = this.classSchedulers.get(soundClass)
    if (scheduler) {
      scheduler.updateConfig(config)
    } else {
      // Initialize if doesn't exist
      this.initClass(soundClass, config as SoundClassConfig)
    }
  }

  /**
   * Set event callback (called when an event should be played)
   */
  setEventCallback(callback: (event: ScheduledSoundEvent) => void): void {
    this.eventCallback = callback
  }

  /**
   * Start the scheduler tick
   */
  start(): void {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.tickIntervalId = window.setInterval(() => {
      this.tick()
    }, this.scheduleInterval)

    console.log('🎵 Soundscape scheduler started')
  }

  /**
   * Stop the scheduler tick
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    if (this.tickIntervalId !== null) {
      clearInterval(this.tickIntervalId)
      this.tickIntervalId = null
    }

    console.log('🎵 Soundscape scheduler stopped')
  }

  /**
   * Scheduler tick - check all classes for events within lookahead
   */
  private tick(): void {
    if (!this.eventCallback) {
      return
    }

    // Check each class scheduler
    this.classSchedulers.forEach(scheduler => {
      const event = scheduler.checkLookahead(this.lookaheadTime)
      if (event) {
        this.eventCallback!(event)
      }
    })
  }

  /**
   * Reset all schedulers
   */
  reset(): void {
    this.classSchedulers.forEach(scheduler => scheduler.reset())
  }

  /**
   * Get running state
   */
  getIsRunning(): boolean {
    return this.isRunning
  }
}
