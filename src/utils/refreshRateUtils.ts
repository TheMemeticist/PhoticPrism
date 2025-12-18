// ============================================
// Refresh Rate & Hz Calculation Utilities
// ============================================

import { ValidFlickerFrequency, SENSITIVE_HZ_RANGES } from '../types'

/**
 * Calculate all valid flicker frequencies for a given refresh rate.
 * Valid frequencies are exact divisors: refreshHz / N where N is integer frames per cycle.
 * 
 * @param refreshRate - Display refresh rate in Hz
 * @param minHz - Minimum flicker frequency to include (default 1)
 * @param maxHz - Maximum flicker frequency to include (default 60)
 * @returns Array of valid flicker frequencies with metadata
 */
export function calculateValidFrequencies(
  refreshRate: number,
  minHz: number = 1,
  maxHz: number = 60
): ValidFlickerFrequency[] {
  const frequencies: ValidFlickerFrequency[] = []
  
  // Calculate N (frames per cycle) for each valid frequency
  // N must be at least 2 (one frame on, one frame off minimum)
  const maxN = Math.floor(refreshRate / minHz)
  const minN = Math.max(2, Math.ceil(refreshRate / maxHz))
  
  for (let n = minN; n <= maxN; n++) {
    const hz = refreshRate / n
    
    // Only include if within bounds
    if (hz >= minHz && hz <= maxHz) {
      frequencies.push({
        hz: Math.round(hz * 100) / 100, // Round to 2 decimal places
        framesPerCycle: n,
        label: formatHzLabel(hz, n)
      })
    }
  }
  
  // Sort by frequency descending
  return frequencies.sort((a, b) => b.hz - a.hz)
}

/**
 * Format a Hz value with its frames-per-cycle for display
 */
function formatHzLabel(hz: number, framesPerCycle: number): string {
  const hzStr = hz % 1 === 0 ? hz.toString() : hz.toFixed(2)
  return `${hzStr} Hz (${framesPerCycle}f)`
}

/**
 * Find the closest valid frequency to a target Hz
 */
export function findClosestValidFrequency(
  targetHz: number,
  validFrequencies: ValidFlickerFrequency[]
): ValidFlickerFrequency | null {
  if (validFrequencies.length === 0) return null
  
  return validFrequencies.reduce((closest, current) => {
    const closestDiff = Math.abs(closest.hz - targetHz)
    const currentDiff = Math.abs(current.hz - targetHz)
    return currentDiff < closestDiff ? current : closest
  })
}

/**
 * Snap a Hz value to the nearest valid frequency
 */
export function snapToValidHz(
  targetHz: number,
  validFrequencies: ValidFlickerFrequency[]
): number {
  const closest = findClosestValidFrequency(targetHz, validFrequencies)
  return closest?.hz ?? targetHz
}

/**
 * Check if a target Hz matches a valid frequency exactly
 */
export function isValidHz(
  targetHz: number,
  validFrequencies: ValidFlickerFrequency[]
): boolean {
  return validFrequencies.some(f => Math.abs(f.hz - targetHz) < 0.01)
}

/**
 * Get Hz sensitivity warning if applicable
 */
export function getHzSensitivityWarning(hz: number): {
  level: 'high' | 'medium' | 'low' | null
  warning: string | null
} {
  for (const range of SENSITIVE_HZ_RANGES) {
    if (hz >= range.min && hz <= range.max) {
      return {
        level: range.level,
        warning: range.warning
      }
    }
  }
  return { level: null, warning: null }
}

/**
 * Calculate frames-on and frames-off for a given frequency
 * For 50% duty cycle: equal on/off time
 */
export function calculateFrameTiming(
  flickerHz: number,
  refreshRate: number
): { framesOn: number; framesOff: number; framesPerCycle: number } {
  const framesPerCycle = Math.round(refreshRate / flickerHz)
  const framesOn = Math.floor(framesPerCycle / 2)
  const framesOff = framesPerCycle - framesOn
  
  return { framesOn, framesOff, framesPerCycle }
}

/**
 * Attempt to detect display refresh rate using requestAnimationFrame
 * Returns a promise that resolves with estimated refresh rate
 */
export function detectRefreshRate(): Promise<number> {
  return new Promise((resolve) => {
    const timestamps: number[] = []
    const targetSamples = 60
    
    function measure(timestamp: number) {
      timestamps.push(timestamp)
      
      if (timestamps.length < targetSamples) {
        requestAnimationFrame(measure)
      } else {
        // Calculate average frame duration
        const frameDurations: number[] = []
        for (let i = 1; i < timestamps.length; i++) {
          frameDurations.push(timestamps[i] - timestamps[i - 1])
        }
        
        // Filter out outliers (more than 2x median)
        const sorted = [...frameDurations].sort((a, b) => a - b)
        const median = sorted[Math.floor(sorted.length / 2)]
        const filtered = frameDurations.filter(d => d < median * 2)
        
        if (filtered.length === 0) {
          resolve(60) // Fallback
          return
        }
        
        const avgDuration = filtered.reduce((a, b) => a + b, 0) / filtered.length
        const estimatedHz = Math.round(1000 / avgDuration)
        
        // Snap to common refresh rates
        const commonRates = [60, 75, 90, 120, 144, 165, 240]
        const closest = commonRates.reduce((prev, curr) => 
          Math.abs(curr - estimatedHz) < Math.abs(prev - estimatedHz) ? curr : prev
        )
        
        resolve(closest)
      }
    }
    
    requestAnimationFrame(measure)
  })
}

/**
 * Filter valid frequencies to only include "safe" presets
 */
export function getSafePresets(
  validFrequencies: ValidFlickerFrequency[],
  presets: readonly number[]
): ValidFlickerFrequency[] {
  return validFrequencies.filter(f => 
    presets.some(p => Math.abs(f.hz - p) < 0.5)
  )
}
