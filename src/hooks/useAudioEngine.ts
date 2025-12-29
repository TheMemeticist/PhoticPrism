// ============================================
// Audio Engine Hook
// ============================================
// Manages binaural beat generation using Tone.js

import { useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'
import { useAppStore } from '../store/appStore'
import { calculateAutoCarrier } from '../utils/audioUtils'

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
  const isPlayingRef = useRef(false) // Track actual audio playing state

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

  // Start audio - properly resume oscillators
  const startAudio = useCallback(async () => {
    if (isPlayingRef.current) return // Guard: already playing
    
    await initAudio()
    
    const nodes = nodesRef.current
    if (!nodes.leftOsc || !nodes.rightOsc || !nodes.masterGain) return

    // Cancel any pending ramps to prevent race conditions
    nodes.masterGain.gain.cancelScheduledValues(Tone.now())
    
    // Start oscillators if not already started
    if (nodes.leftOsc.state !== 'started') {
      nodes.leftOsc.start()
    }
    if (nodes.rightOsc.state !== 'started') {
      nodes.rightOsc.start()
    }

    // Fade in to target volume
    const targetVolume = neurofeedbackEnabled ? beatVolumeModulation : audio.volume
    nodes.masterGain.gain.rampTo(targetVolume / 100, 0.3)
    
    isPlayingRef.current = true
    console.log('🔊 Audio started')
  }, [initAudio, audio.volume, neurofeedbackEnabled, beatVolumeModulation])

  // Stop audio - properly halt oscillators
  const stopAudio = useCallback(() => {
    if (!isPlayingRef.current) return // Guard: already stopped
    
    const nodes = nodesRef.current
    if (!nodes.masterGain) return
    
    // Cancel any pending ramps to prevent race conditions
    nodes.masterGain.gain.cancelScheduledValues(Tone.now())
    
    // Immediately set to 0 (no ramp - for instant pause response)
    nodes.masterGain.gain.value = 0
    
    // Stop oscillators completely to save CPU and prevent drift
    if (nodes.leftOsc && nodes.leftOsc.state === 'started') {
      nodes.leftOsc.stop()
    }
    if (nodes.rightOsc && nodes.rightOsc.state === 'started') {
      nodes.rightOsc.stop()
    }
    if (nodes.noiseSource && nodes.noiseSource.state === 'started') {
      nodes.noiseSource.stop()
    }
    
    isPlayingRef.current = false
    console.log('🔊 Audio stopped')
  }, [])

  // Update audio parameters
  useEffect(() => {
    const nodes = nodesRef.current
    if (!isInitializedRef.current) return

    // Calculate frequencies
    const beatFreq = audio.lockedToFlicker ? flickerHz : audio.beatFreq
    
    // Calculate carrier frequency: Auto mode uses formula-based mapping, Manual uses user setting
    const carrierFreq = audio.carrierMode === 'auto' 
      ? calculateAutoCarrier(beatFreq)
      : audio.carrierFreq
    
    const leftFreq = carrierFreq
    const rightFreq = carrierFreq + beatFreq

    // Update oscillator frequencies
    if (nodes.leftOsc) {
      nodes.leftOsc.frequency.rampTo(leftFreq, 0.1)
      nodes.leftOsc.type = audio.waveform
    }
    if (nodes.rightOsc) {
      nodes.rightOsc.frequency.rampTo(rightFreq, 0.1)
      nodes.rightOsc.type = audio.waveform
    }

    // Volume Hierarchy: Master Volume * Individual Volume * NF Modulation
    // Master volume acts as a multiplier for all audio sources
    
    // Update binaural beats volume (multiply master * individual * NF)
    if (nodes.leftGain && nodes.rightGain && audio.enabled) {
      // Individual binaural volume (0-100%)
      const binauralVolume = audio.volume / 100
      // Master volume (0-100%)
      const masterVolume = audio.masterVolume / 100
      // Neurofeedback modulation (if enabled, affects the final output)
      const nfModulation = neurofeedbackEnabled ? beatVolumeModulation / 100 : 1.0
      
      // Final volume = master * individual * NF
      const finalBinauralVolume = masterVolume * binauralVolume * nfModulation * 0.3
      
      nodes.leftGain.gain.rampTo(finalBinauralVolume, 0.1)
      nodes.rightGain.gain.rampTo(finalBinauralVolume, 0.1)
    }
    
    // Master gain just passes through (individual gains handle volume)
    if (nodes.masterGain) {
      nodes.masterGain.gain.value = 1.0
    }

    // Update ambient noise volume (multiply master * individual * NF)
    if (nodes.noiseSource && nodes.noiseGain) {
      if (audio.ambientEnabled && audio.ambientType !== 'none') {
        nodes.noiseSource.type = audio.ambientType as 'pink' | 'white' | 'brown'
        
        // Individual noise volume (0-100%)
        const noiseVolume = audio.ambientVolume / 100
        // Master volume (0-100%)
        const masterVolume = audio.masterVolume / 100
        // Neurofeedback modulation (if enabled, inverse for noise)
        const nfModulation = neurofeedbackEnabled ? noiseVolumeModulation / 100 : 1.0
        
        // Final volume = master * individual * NF
        const finalNoiseVolume = masterVolume * noiseVolume * nfModulation
        
        nodes.noiseGain.gain.rampTo(finalNoiseVolume, 0.3)
      } else {
        nodes.noiseGain.gain.rampTo(0, 0.3)
      }
    }
  }, [audio, flickerHz, neurofeedbackEnabled, beatVolumeModulation, noiseVolumeModulation])

  // Handle audio enable/disable and pause state (including noise)
  useEffect(() => {
    const nodes = nodesRef.current
    
    if (audio.enabled && !isPaused) {
      // Start main audio
      startAudio()
      
      // Start noise if ambient is enabled
      if (audio.ambientEnabled && nodes.noiseSource && nodes.noiseSource.state !== 'started') {
        nodes.noiseSource.start()
      }
    } else {
      // Stop all audio including noise
      stopAudio()
    }
  }, [audio.enabled, audio.ambientEnabled, isPaused, startAudio, stopAudio])

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
