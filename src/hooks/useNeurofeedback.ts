// ============================================
// Neurofeedback Hook
// ============================================
// Calculates coherence score and modulates brightness/volume based on EEG data

import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { BrainwaveBand } from '../types'

// Helper function to determine target band from Hz
function getTargetBandFromHz(hz: number): BrainwaveBand {
  if (hz < 4) return 'delta'
  if (hz < 8) return 'theta'
  if (hz < 13) return 'alpha'
  if (hz < 30) return 'beta'
  return 'gamma'
}

// Helper function to clamp values between min and max
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function useNeurofeedback() {
  const neurofeedback = useAppStore((s) => s.neurofeedback)
  const eegReadings = useAppStore((s) => s.eegReadings)
  const flickerHz = useAppStore((s) => s.flickerHz)
  const updateNeurofeedbackState = useAppStore((s) => s.updateNeurofeedbackState)
  
  // Store smoothed coherence score
  const smoothedScoreRef = useRef(0)

  useEffect(() => {
    if (!neurofeedback.enabled || eegReadings.length === 0) {
      return
    }

    // Use 20-second rolling average of EEG readings
    const now = Date.now()
    const twentySecondsAgo = now - 20000
    const recentReadings = eegReadings.filter(r => r.timestamp >= twentySecondsAgo)
    
    if (recentReadings.length === 0) {
      return // Not enough data yet
    }

    // Calculate average of recent readings
    const avgBands = {
      delta: recentReadings.reduce((sum, r) => sum + r.delta, 0) / recentReadings.length,
      theta: recentReadings.reduce((sum, r) => sum + r.theta, 0) / recentReadings.length,
      alpha: recentReadings.reduce((sum, r) => sum + r.alpha, 0) / recentReadings.length,
      beta: recentReadings.reduce((sum, r) => sum + r.beta, 0) / recentReadings.length,
      gamma: recentReadings.reduce((sum, r) => sum + r.gamma, 0) / recentReadings.length
    }
    
    // Determine target band
    const targetBand: BrainwaveBand = neurofeedback.targetBand === 'auto' 
      ? getTargetBandFromHz(flickerHz)
      : neurofeedback.targetBand

    // Calculate coherence score using Z-Score Difference method
    const targetValue = avgBands[targetBand]
    
    // Calculate average of other bands
    const otherBands = Object.entries(avgBands)
      .filter(([band]) => band !== targetBand)
      .map(([_, value]) => value)
    
    const othersAverage = otherBands.reduce((sum, val) => sum + val, 0) / otherBands.length
    
    // Coherence score = target minus average of others
    // Positive = target band is elevated (good!)
    // Negative = target band is suppressed (need improvement)
    const rawCoherence = (targetValue - othersAverage) * neurofeedback.sensitivity
    
    // Apply exponential moving average for smoothing
    const smoothing = neurofeedback.smoothing
    smoothedScoreRef.current = 
      smoothing * smoothedScoreRef.current + (1 - smoothing) * rawCoherence
    
    const coherenceScore = smoothedScoreRef.current
    
    // Map coherence score to modulation values
    // Coherence typically ranges from -3 to +3
    // We map this to percentage deviations
    
    // For brightness and beat volume: higher coherence = higher values
    // Base is 50%, range is ±modulationDepth
    const brightnessBase = 50
    const beatVolumeBase = 50
    const noiseVolumeBase = 20
    
    // Normalized coherence (-1 to +1, clamped from -2 to +2 range for more sensitivity)
    const normalizedCoherence = clamp(coherenceScore / 2, -1, 1)
    
    // Calculate modulations
    const brightnessModulation = clamp(
      brightnessBase + (normalizedCoherence * neurofeedback.modulationDepth.brightness),
      10,
      90
    )
    
    const beatVolumeModulation = clamp(
      beatVolumeBase + (normalizedCoherence * neurofeedback.modulationDepth.beatVolume),
      5,
      95
    )
    
    // Noise volume is inverse: higher coherence = lower noise (less distraction needed)
    const noiseVolumeModulation = clamp(
      noiseVolumeBase - (normalizedCoherence * neurofeedback.modulationDepth.noiseVolume),
      0,
      50
    )
    
    // Update state
    updateNeurofeedbackState({
      coherenceScore,
      targetBand,
      brightnessModulation,
      beatVolumeModulation,
      noiseVolumeModulation
    })
    
    // Add to coherence history
    useAppStore.getState().addCoherenceReading({
      timestamp: now,
      score: coherenceScore,
      targetBand
    })
    
  }, [
    neurofeedback.enabled,
    neurofeedback.targetBand,
    neurofeedback.sensitivity,
    neurofeedback.smoothing,
    neurofeedback.modulationDepth,
    eegReadings,
    flickerHz,
    updateNeurofeedbackState
  ])
}
