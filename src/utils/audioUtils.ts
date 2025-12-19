// ============================================
// Audio Utility Functions
// ============================================

/**
 * Calculate auto carrier frequency based on binaural beat target frequency
 * Uses smooth interpolation for continuous carrier mapping (not fixed bins)
 * 
 * Research-based mapping:
 * - 5-6 Hz (theta/alpha border) → 220 Hz
 * - 10-11 Hz (alpha) → 400 Hz  
 * - 15 Hz (low beta) → 500 Hz
 * - 20-25 Hz (beta) → 600 Hz
 * - 35-45 Hz (gamma) → 750-900 Hz (approaching AM/isochronic range)
 */
export function calculateAutoCarrier(beatFreqHz: number): number {
  // Clamp to reasonable range
  const hz = Math.max(1, Math.min(60, beatFreqHz))
  
  // Piecewise linear interpolation for smooth continuous output
  // Each target Hz gets a unique carrier
  
  if (hz <= 6) {
    // 1-6 Hz: interpolate from 180 Hz to 220 Hz
    return 180 + ((hz - 1) / 5) * 40
  } 
  else if (hz <= 11) {
    // 6-11 Hz: interpolate from 220 Hz to 400 Hz
    return 220 + ((hz - 6) / 5) * 180
  }
  else if (hz <= 15) {
    // 11-15 Hz: interpolate from 400 Hz to 500 Hz
    return 400 + ((hz - 11) / 4) * 100
  }
  else if (hz <= 25) {
    // 15-25 Hz: interpolate from 500 Hz to 600 Hz
    return 500 + ((hz - 15) / 10) * 100
  }
  else if (hz <= 45) {
    // 25-45 Hz: interpolate from 600 Hz to 900 Hz
    // Higher carriers for gamma range (approaching AM/isochronic territory)
    return 600 + ((hz - 25) / 20) * 300
  }
  else {
    // 45+ Hz: cap at 900 Hz
    return 900
  }
}
