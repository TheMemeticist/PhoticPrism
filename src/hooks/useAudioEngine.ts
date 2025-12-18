// ============================================
// Audio Engine Hook
// ============================================
// Manages binaural beat generation using Tone.js

import { useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import { useAppStore } from '../store/appStore'

interface AudioNodes {
  leftOsc: Tone.Oscillator | null
  rightOsc: Tone.Oscillator | null
  leftGain: Tone.Gain | null
  rightGain: Tone.Gain | null
  leftPanner: Tone.Panner | null
  rightPanner: Tone.Panner | null
  noiseSource: Tone.Noise | null
  noiseGain: Tone.Gain | null
  masterGain: Tone.Gain | null
  filter: Tone.Filter | null
}

export function useAudioEngine() {
  const nodesRef = useRef<AudioNodes>({
    leftOsc: null,
    rightOsc: null,
    leftGain: null,
    rightGain: null,
    leftPanner: null,
    rightPanner: null,
    noiseSource: null,
    noiseGain: null,
    masterGain: null,
    filter: null
  })

  const isInitializedRef = useRef(false)

  // State from store
  const audio = useAppStore((s) => s.audio)
  const flickerHz = useAppStore((s) => s.flickerHz)
  const isPaused = useAppStore((s) => s.pause.isPaused)
  
  // Neurofeedback
  const neurofeedbackEnabled = useAppStore((s) => s.neurofeedback.enabled)
  const beatVolumeModulation = useAppStore((s) => s.neurofeedbackState.beatVolumeModulation)
  const noiseVolumeModulation = useAppStore((s) => s.neurofeedbackState.noiseVolumeModulation)

  // Initialize audio nodes
  const initAudio = useCallback(async () => {
    if (isInitializedRef.current) return

    try {
      // Start Tone.js context (requires user gesture)
      await Tone.start()
      console.log('🔊 Audio context started')

      const nodes = nodesRef.current

      // Create master gain
      nodes.masterGain = new Tone.Gain(0).toDestination()

      // Create filter for pleasantness
      nodes.filter = new Tone.Filter({
        type: 'lowpass',
        frequency: 2000,
        Q: 0.5
      }).connect(nodes.masterGain)

      // Left channel
      nodes.leftPanner = new Tone.Panner(-1).connect(nodes.filter)
      nodes.leftGain = new Tone.Gain(0.3).connect(nodes.leftPanner)
      nodes.leftOsc = new Tone.Oscillator({
        type: 'sine',
        frequency: 400
      }).connect(nodes.leftGain)

      // Right channel
      nodes.rightPanner = new Tone.Panner(1).connect(nodes.filter)
      nodes.rightGain = new Tone.Gain(0.3).connect(nodes.rightPanner)
      nodes.rightOsc = new Tone.Oscillator({
        type: 'sine',
        frequency: 410
      }).connect(nodes.rightGain)

      // Ambient noise
      nodes.noiseGain = new Tone.Gain(0).connect(nodes.masterGain)
      nodes.noiseSource = new Tone.Noise('pink').connect(nodes.noiseGain)

      isInitializedRef.current = true
      console.log('🔊 Audio engine initialized')
    } catch (err) {
      console.error('Audio initialization failed:', err)
    }
  }, [])

  // Start audio
  const startAudio = useCallback(async () => {
    await initAudio()
    
    const nodes = nodesRef.current
    if (!nodes.leftOsc || !nodes.rightOsc) return

    // Start oscillators if not already started
    if (nodes.leftOsc.state !== 'started') {
      nodes.leftOsc.start()
    }
    if (nodes.rightOsc.state !== 'started') {
      nodes.rightOsc.start()
    }

    // Fade in
    nodes.masterGain?.gain.rampTo(audio.volume / 100, 0.5)

    console.log('🔊 Audio started')
  }, [initAudio, audio.volume])

  // Stop audio
  const stopAudio = useCallback(() => {
    const nodes = nodesRef.current
    
    // Fade out
    nodes.masterGain?.gain.rampTo(0, 0.3)
    
    console.log('🔊 Audio stopped')
  }, [])

  // Update audio parameters
  useEffect(() => {
    const nodes = nodesRef.current
    if (!isInitializedRef.current) return

    // Calculate frequencies
    const beatFreq = audio.lockedToFlicker ? flickerHz : audio.beatFreq
    const leftFreq = audio.carrierFreq
    const rightFreq = audio.carrierFreq + beatFreq

    // Update oscillator frequencies
    if (nodes.leftOsc) {
      nodes.leftOsc.frequency.rampTo(leftFreq, 0.1)
      nodes.leftOsc.type = audio.waveform
    }
    if (nodes.rightOsc) {
      nodes.rightOsc.frequency.rampTo(rightFreq, 0.1)
      nodes.rightOsc.type = audio.waveform
    }

    // Update master volume (use neurofeedback modulation if enabled)
    if (nodes.masterGain && audio.enabled) {
      const volume = neurofeedbackEnabled ? beatVolumeModulation : audio.volume
      nodes.masterGain.gain.rampTo(volume / 100, 0.1)
    }

    // Update ambient noise (use neurofeedback modulation if enabled)
    if (nodes.noiseSource && nodes.noiseGain) {
      if (audio.ambientEnabled && audio.ambientType !== 'none') {
        nodes.noiseSource.type = audio.ambientType as 'pink' | 'white' | 'brown'
        const noiseVolume = neurofeedbackEnabled ? noiseVolumeModulation : audio.ambientVolume
        // Removed 0.3 multiplier - now uses full volume range
        nodes.noiseGain.gain.rampTo(noiseVolume / 100, 0.3)
        
        if (nodes.noiseSource.state !== 'started') {
          nodes.noiseSource.start()
        }
      } else {
        nodes.noiseGain.gain.rampTo(0, 0.3)
      }
    }
  }, [audio, flickerHz, neurofeedbackEnabled, beatVolumeModulation, noiseVolumeModulation])

  // Handle audio enable/disable and pause state
  useEffect(() => {
    if (audio.enabled && !isPaused) {
      startAudio()
    } else {
      stopAudio()
    }
  }, [audio.enabled, isPaused, startAudio, stopAudio])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const nodes = nodesRef.current
      
      nodes.leftOsc?.stop()
      nodes.rightOsc?.stop()
      nodes.noiseSource?.stop()
      
      nodes.leftOsc?.dispose()
      nodes.rightOsc?.dispose()
      nodes.leftGain?.dispose()
      nodes.rightGain?.dispose()
      nodes.leftPanner?.dispose()
      nodes.rightPanner?.dispose()
      nodes.noiseSource?.dispose()
      nodes.noiseGain?.dispose()
      nodes.masterGain?.dispose()
      nodes.filter?.dispose()
      
      isInitializedRef.current = false
    }
  }, [])

  return {
    initAudio,
    startAudio,
    stopAudio,
    isInitialized: isInitializedRef.current
  }
}
