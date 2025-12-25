// ============================================
// Sound Asset Loader
// ============================================
// Manifest-driven audio asset loader with buffer caching

import { SoundVariant, SoundManifest, SoundClass } from '../types/soundscape'

export class SoundAssetLoader {
  private manifest: SoundManifest | null = null
  private bufferCache: Map<string, AudioBuffer> = new Map()
  private audioContext: AudioContext
  private loadingPromises: Map<string, Promise<AudioBuffer>> = new Map()
  private lastPlayedTimes: Map<string, number> = new Map() // Track cooldowns

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
  }

  /**
   * Load the sound manifest
   */
  async loadManifest(): Promise<void> {
    try {
      const response = await fetch('/sounds/sounds.manifest.json')
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.statusText}`)
      }
      this.manifest = await response.json()
      console.log(`🎵 Loaded sound manifest: ${this.manifest?.sounds.length || 0} variants`)
    } catch (err) {
      console.error('Failed to load sound manifest:', err)
      throw err
    }
  }

  /**
   * Get all variants for a given class
   */
  getVariantsForClass(soundClass: SoundClass): SoundVariant[] {
    if (!this.manifest) {
      console.warn('Manifest not loaded')
      return []
    }
    return this.manifest.sounds.filter(s => s.class === soundClass)
  }

  /**
   * Get a weighted random variant from a class, respecting cooldowns
   */
  getRandomVariant(soundClass: SoundClass): SoundVariant | null {
    const variants = this.getVariantsForClass(soundClass)
    if (variants.length === 0) return null

    const now = this.audioContext.currentTime

    // Filter out variants still on cooldown
    const availableVariants = variants.filter(v => {
      const lastPlayed = this.lastPlayedTimes.get(v.id)
      if (!lastPlayed) return true
      return (now - lastPlayed) >= v.cooldown
    })

    // If all variants are on cooldown, use the one that cooled down longest ago
    const pool = availableVariants.length > 0 ? availableVariants : variants

    // Weighted random selection
    const totalWeight = pool.reduce((sum, v) => sum + v.weight, 0)
    let random = Math.random() * totalWeight
    
    for (const variant of pool) {
      random -= variant.weight
      if (random <= 0) {
        // Mark as played
        this.lastPlayedTimes.set(variant.id, now)
        return variant
      }
    }

    // Fallback (shouldn't reach here)
    return pool[0]
  }

  /**
   * Preload all audio buffers for a given class
   */
  async preloadClass(soundClass: SoundClass): Promise<void> {
    const variants = this.getVariantsForClass(soundClass)
    
    console.log(`🔄 Preloading ${soundClass}: ${variants.length} variants...`)
    
    const promises = variants.map(v => this.loadBuffer(v))
    await Promise.all(promises)
    
    console.log(`✅ Preloaded ${soundClass}: ${variants.length} buffers cached`)
  }

  /**
   * Load a single audio buffer (with caching and deduplication)
   */
  async loadBuffer(variant: SoundVariant): Promise<AudioBuffer> {
    // Check cache first
    if (this.bufferCache.has(variant.id)) {
      return this.bufferCache.get(variant.id)!
    }

    // Check if already loading
    if (this.loadingPromises.has(variant.id)) {
      return this.loadingPromises.get(variant.id)!
    }

    // Start loading
    const loadPromise = this._fetchAndDecode(variant)
    this.loadingPromises.set(variant.id, loadPromise)

    try {
      const buffer = await loadPromise
      this.bufferCache.set(variant.id, buffer)
      return buffer
    } finally {
      this.loadingPromises.delete(variant.id)
    }
  }

  /**
   * Fetch and decode audio file
   */
  private async _fetchAndDecode(variant: SoundVariant): Promise<AudioBuffer> {
    try {
      const response = await fetch(variant.path)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${variant.path}: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      
      return audioBuffer
    } catch (err) {
      console.error(`Failed to load sound ${variant.id}:`, err)
      throw err
    }
  }

  /**
   * Get cached buffer (returns null if not loaded)
   */
  getCachedBuffer(variant: SoundVariant): AudioBuffer | null {
    return this.bufferCache.get(variant.id) || null
  }

  /**
   * Clear all cached buffers (memory cleanup)
   */
  clearCache(): void {
    this.bufferCache.clear()
    this.loadingPromises.clear()
    console.log('🗑️ Sound buffer cache cleared')
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { cached: number; total: number; sizeEstimate: string } {
    const total = this.manifest?.sounds.length || 0
    const cached = this.bufferCache.size
    
    // Estimate memory usage (rough approximation)
    let totalBytes = 0
    this.bufferCache.forEach(buffer => {
      // Each sample is 4 bytes (Float32), times number of channels and samples
      totalBytes += buffer.length * buffer.numberOfChannels * 4
    })
    
    const sizeMB = (totalBytes / 1024 / 1024).toFixed(2)
    
    return {
      cached,
      total,
      sizeEstimate: `${sizeMB} MB`
    }
  }
}
