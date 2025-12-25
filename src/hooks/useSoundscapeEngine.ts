// ============================================
// Soundscape Engine Hook
// ============================================
// Orchestrates the complete soundscape system

import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { SoundAssetLoader } from '../utils/soundAssetLoader'
import { SoundscapeScheduler } from '../utils/soundscapeScheduler'
import { SoundFXProcessor } from '../utils/soundFXProcessor'
import { SoundClass, ScheduledSoundEvent } from '../types/soundscape'

export function useSoundscapeEngine() {
  // Refs for engine components
  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const assetLoaderRef = useRef<SoundAssetLoader | null>(null)
  const schedulerRef = useRef<SoundscapeScheduler | null>(null)
  const fxProcessorRef = useRef<SoundFXProcessor | null>(null)
  const isInitializedRef = useRef(false)
  
  // Use ref to avoid recreating callbacks
  const soundscapeConfigRef = useRef<typeof soundscapeConfig>(null as any)

  // Store state
  const soundscapeConfig = useAppStore(s => s.soundscape)
  const neurofeedbackState = useAppStore(s => s.neurofeedbackState)
  const isPaused = useAppStore(s => s.pause.isPaused)
  
  // Update ref
  soundscapeConfigRef.current = soundscapeConfig

  /**
   * Initialize the soundscape engine
   */
  const initialize = useCallback(async () => {
    if (isInitializedRef.current) {
      console.log('🎵 Soundscape already initialized, skipping')
      return
    }

    try {
      console.log('🎵 Initializing soundscape engine...')
      
      // Create audio context
      const context = new AudioContext()
      audioContextRef.current = context
      console.log('🎵 AudioContext created:', context.state)

      // Create master gain
      const masterGain = context.createGain()
      masterGain.gain.value = soundscapeConfigRef.current.masterVolume / 100
      masterGain.connect(context.destination)
      masterGainRef.current = masterGain
      console.log('🎵 Master gain created, volume:', soundscapeConfigRef.current.masterVolume)

      // Create asset loader
      const assetLoader = new SoundAssetLoader(context)
      await assetLoader.loadManifest()
      assetLoaderRef.current = assetLoader

      // Create FX processor
      const fxProcessor = new SoundFXProcessor(
        context,
        masterGain,
        soundscapeConfigRef.current.neurofeedbackPolicy
      )
      fxProcessorRef.current = fxProcessor
      console.log('🎵 FX processor created')

      // Create scheduler
      const scheduler = new SoundscapeScheduler(context, assetLoader)
      
      // Set event callback
      scheduler.setEventCallback((event: ScheduledSoundEvent) => {
        console.log('🎵 Event scheduled:', event.variant.class, event.variant.id)
        handleSoundEvent(event)
      })
      
      schedulerRef.current = scheduler
      console.log('🎵 Scheduler created')

      // Initialize all sound classes
      Object.entries(soundscapeConfigRef.current.classes).forEach(([className, config]) => {
        scheduler.initClass(className as SoundClass, config)
        console.log(`🎵 Initialized class: ${className}, enabled: ${config.enabled}, bpm: ${config.bpm}`)
      })

      isInitializedRef.current = true
      console.log('✅ Soundscape engine fully initialized')
    } catch (err) {
      console.error('❌ Failed to initialize soundscape engine:', err)
    }
  }, [])

  /**
   * Handle a scheduled sound event
   */
  const handleSoundEvent = useCallback((event: ScheduledSoundEvent) => {
    console.log('🎵 handleSoundEvent called for:', event.variant.class, event.variant.id, 'at', event.scheduledTime)
    
    if (!assetLoaderRef.current || !fxProcessorRef.current) {
      console.warn('🎵 AssetLoader or FX processor not ready')
      return
    }

    const { variant, scheduledTime } = event

    // Get pre-loaded buffer
    const buffer = assetLoaderRef.current.getCachedBuffer(variant)
    
    if (!buffer) {
      console.warn(`🎵 Buffer not loaded for ${variant.id}, loading on-demand...`)
      // Load on-demand if not cached
      assetLoaderRef.current.loadBuffer(variant).then(loadedBuffer => {
        console.log(`🎵 Buffer loaded for ${variant.id}, creating sound chain`)
        // Get class config for reinforcement mode
        const classConfig = soundscapeConfigRef.current.classes[variant.class]
        fxProcessorRef.current!.createSoundChain(
          loadedBuffer,
          variant,
          scheduledTime,
          classConfig.reinforcementMode
        )
      }).catch(err => {
        console.error(`🎵 Failed to load buffer for ${variant.id}:`, err)
      })
      return
    }

    // Get class config for reinforcement mode
    const classConfig = soundscapeConfigRef.current.classes[variant.class]
    
    console.log(`🎵 Creating sound chain for ${variant.id}, reinforcement mode: ${classConfig.reinforcementMode}`)
    
    // Create and play sound chain
    fxProcessorRef.current.createSoundChain(
      buffer,
      variant,
      scheduledTime,
      classConfig.reinforcementMode
    )
  }, [])

  /**
   * Preload a sound class
   */
  const preloadClass = useCallback(async (soundClass: SoundClass) => {
    if (!assetLoaderRef.current) {
      await initialize()
    }
    
    await assetLoaderRef.current?.preloadClass(soundClass)
  }, [initialize])

  /**
   * Update class BPM
   */
  const setClassBPM = useCallback((soundClass: SoundClass, bpm: number) => {
    useAppStore.getState().setSoundscapeClass(soundClass, { bpm })
  }, [])

  /**
   * Toggle class enabled state
   */
  const toggleClass = useCallback((soundClass: SoundClass) => {
    const current = soundscapeConfig.classes[soundClass]
    useAppStore.getState().setSoundscapeClass(soundClass, { enabled: !current.enabled })
  }, [soundscapeConfig.classes])

  /**
   * Update neurofeedback policy
   */
  const updateNFPolicy = useCallback((policy: Partial<typeof soundscapeConfig.neurofeedbackPolicy>) => {
    useAppStore.getState().setSoundscape({ 
      neurofeedbackPolicy: { ...soundscapeConfig.neurofeedbackPolicy, ...policy }
    })
  }, [soundscapeConfig.neurofeedbackPolicy])

  // Initialize on mount
  useEffect(() => {
    initialize()

    return () => {
      // Cleanup
      schedulerRef.current?.stop()
      fxProcessorRef.current?.dispose()
      assetLoaderRef.current?.clearCache()
      masterGainRef.current?.disconnect()
      audioContextRef.current?.close()
      isInitializedRef.current = false
    }
  }, [initialize])

  // Handle enable/pause changes
  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('🎵 Soundscape not initialized yet, skipping enable/pause logic')
      return
    }

    console.log('🎵 Enable/pause changed - enabled:', soundscapeConfig.enabled, 'paused:', isPaused)

    if (soundscapeConfig.enabled && !isPaused) {
      // Resume audio context if suspended
      const contextState = audioContextRef.current?.state
      console.log('🎵 Starting soundscape, AudioContext state:', contextState)
      
      if (contextState === 'suspended') {
        audioContextRef.current?.resume().then(() => {
          console.log('🎵 AudioContext resumed')
        })
      }
      
      schedulerRef.current?.start()
      console.log('🎵 Scheduler started')
    } else {
      schedulerRef.current?.stop()
      console.log('🎵 Scheduler stopped')
    }
  }, [soundscapeConfig.enabled, isPaused])

  // Update master volume
  useEffect(() => {
    if (fxProcessorRef.current) {
      fxProcessorRef.current.setMasterVolume(soundscapeConfig.masterVolume)
    }
  }, [soundscapeConfig.masterVolume])

  // Update echo settings
  useEffect(() => {
    if (fxProcessorRef.current) {
      fxProcessorRef.current.updateEcho(
        soundscapeConfig.echoTime,
        soundscapeConfig.echoFeedback
      )
    }
  }, [soundscapeConfig.echoTime, soundscapeConfig.echoFeedback])

  // Update class configurations
  useEffect(() => {
    if (!schedulerRef.current) {
      return
    }

    Object.entries(soundscapeConfig.classes).forEach(([className, config]) => {
      schedulerRef.current!.updateClass(className as SoundClass, config)
      
      // Preload if enabled
      if (config.enabled && assetLoaderRef.current) {
        const variants = assetLoaderRef.current.getVariantsForClass(className as SoundClass)
        const cached = variants.filter(v => assetLoaderRef.current!.getCachedBuffer(v) !== null)
        
        // Only preload if not already cached
        if (cached.length === 0) {
          preloadClass(className as SoundClass)
        }
      }
    })
  }, [soundscapeConfig.classes, preloadClass])

  // Update neurofeedback state
  useEffect(() => {
    if (fxProcessorRef.current) {
      fxProcessorRef.current.updateNFState(neurofeedbackState)
    }
  }, [neurofeedbackState])

  // Update NF policy
  useEffect(() => {
    if (fxProcessorRef.current) {
      fxProcessorRef.current.updateNFPolicy(soundscapeConfig.neurofeedbackPolicy)
    }
  }, [soundscapeConfig.neurofeedbackPolicy])

  return {
    isInitialized: isInitializedRef.current,
    preloadClass,
    setClassBPM,
    toggleClass,
    updateNFPolicy,
    getStats: () => ({
      activeSounds: fxProcessorRef.current?.getActiveSoundCount() || 0,
      cacheStats: assetLoaderRef.current?.getCacheStats() || { cached: 0, total: 0, sizeEstimate: '0 MB' }
    })
  }
}
