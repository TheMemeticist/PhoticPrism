// ============================================
// Pattern Rendering Utilities
// ============================================
// Science-based geometric patterns for photic stimulation
// Based on research: SSVEP, pattern-reversal VEP, motion SSMVEP

import { PatternType, PatternConfig } from '../types'

export interface RenderContext {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  isOn: boolean // Current state (for flicker/reversal)
  onColor: string
  offColor: string
  config: PatternConfig
  time: number // For motion patterns (milliseconds)
}

// ============================================
// 1) Full-field luminance flicker (baseline)
// ============================================
export function renderFullField(context: RenderContext): void {
  const { ctx, width, height, isOn, onColor, offColor } = context
  
  ctx.fillStyle = isOn ? onColor : offColor
  ctx.fillRect(0, 0, width, height)
}

// ============================================
// 2) Pattern-reversal checkerboard (clinical standard)
// ============================================
export function renderCheckerboard(context: RenderContext): void {
  const { ctx, width, height, isOn, onColor, offColor, config } = context
  const checkSize = config.checkSize
  
  const cols = Math.ceil(width / checkSize)
  const rows = Math.ceil(height / checkSize)
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Alternate pattern
      const isWhiteSquare = (row + col) % 2 === 0
      
      // Reverse pattern when isOn is true (pattern reversal)
      const shouldBeWhite = isOn ? !isWhiteSquare : isWhiteSquare
      
      ctx.fillStyle = shouldBeWhite ? onColor : offColor
      ctx.fillRect(col * checkSize, row * checkSize, checkSize, checkSize)
    }
  }
}

// ============================================
// 3) Sine wave grating
// ============================================
export function renderGrating(context: RenderContext): void {
  const { ctx, width, height, isOn, onColor, offColor, config } = context
  const { spatialFrequency, orientation, gratingWaveform } = config
  
  // Convert orientation to radians
  const angle = (orientation * Math.PI) / 180
  
  // Create image data for pixel-level control
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data
  
  // Parse colors
  const onRgb = hexToRgb(onColor)
  const offRgb = hexToRgb(offColor)
  
  // Phase shift for reversal
  const phaseShift = isOn ? Math.PI : 0
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Rotate coordinates
      const xRotated = x * Math.cos(angle) + y * Math.sin(angle)
      
      // Calculate wave value
      let wave: number
      if (gratingWaveform === 'sine') {
        wave = Math.sin(xRotated * spatialFrequency * 0.05 + phaseShift)
      } else {
        // Square wave
        wave = Math.sin(xRotated * spatialFrequency * 0.05 + phaseShift) > 0 ? 1 : -1
      }
      
      // Map wave [-1, 1] to color interpolation [0, 1]
      const t = (wave + 1) / 2
      
      const idx = (y * width + x) * 4
      data[idx] = Math.round(offRgb.r + t * (onRgb.r - offRgb.r))
      data[idx + 1] = Math.round(offRgb.g + t * (onRgb.g - offRgb.g))
      data[idx + 2] = Math.round(offRgb.b + t * (onRgb.b - offRgb.b))
      data[idx + 3] = 255
    }
  }
  
  ctx.putImageData(imageData, 0, 0)
}

// ============================================
// 4) Gabor patch (windowed grating)
// ============================================
export function renderGabor(context: RenderContext): void {
  const { ctx, width, height, isOn, onColor, offColor, config } = context
  const { spatialFrequency, orientation, gratingWaveform, gaborSigma } = config
  
  const centerX = width / 2
  const centerY = height / 2
  
  const angle = (orientation * Math.PI) / 180
  const phaseShift = isOn ? Math.PI : 0
  
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data
  
  const onRgb = hexToRgb(onColor)
  const offRgb = hexToRgb(offColor)
  const midRgb = {
    r: (onRgb.r + offRgb.r) / 2,
    g: (onRgb.g + offRgb.g) / 2,
    b: (onRgb.b + offRgb.b) / 2
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Distance from center
      const dx = x - centerX
      const dy = y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Gaussian envelope
      const gaussian = Math.exp(-(distance * distance) / (2 * gaborSigma * gaborSigma))
      
      // Rotate coordinates
      const xRotated = dx * Math.cos(angle) + dy * Math.sin(angle)
      
      // Calculate wave
      let wave: number
      if (gratingWaveform === 'sine') {
        wave = Math.sin(xRotated * spatialFrequency * 0.05 + phaseShift)
      } else {
        wave = Math.sin(xRotated * spatialFrequency * 0.05 + phaseShift) > 0 ? 1 : -1
      }
      
      // Apply Gaussian window
      const modulatedWave = wave * gaussian
      const t = (modulatedWave + 1) / 2
      
      const idx = (y * width + x) * 4
      // Interpolate between off and on, with mid as background
      data[idx] = Math.round(midRgb.r + modulatedWave * (onRgb.r - midRgb.r) * gaussian)
      data[idx + 1] = Math.round(midRgb.g + modulatedWave * (onRgb.g - midRgb.g) * gaussian)
      data[idx + 2] = Math.round(midRgb.b + modulatedWave * (onRgb.b - midRgb.b) * gaussian)
      data[idx + 3] = 255
    }
  }
  
  ctx.putImageData(imageData, 0, 0)
}

// ============================================
// 5) Concentric rings / radial checkerboard
// ============================================
export function renderConcentric(context: RenderContext): void {
  const { ctx, width, height, isOn, onColor, offColor, config } = context
  const { ringCount, ringWidth } = config
  
  const centerX = width / 2
  const centerY = height / 2
  
  // Clear with background
  ctx.fillStyle = offColor
  ctx.fillRect(0, 0, width, height)
  
  // Draw rings from outside in
  for (let i = ringCount; i >= 0; i--) {
    const radius = (i + 1) * ringWidth
    
    // Alternate colors, with reversal
    const isWhiteRing = i % 2 === 0
    const shouldBeWhite = isOn ? !isWhiteRing : isWhiteRing
    
    ctx.fillStyle = shouldBeWhite ? onColor : offColor
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ============================================
// 6) Motion-based: Radial expansion/contraction
// ============================================
export function renderMotionRadial(context: RenderContext): void {
  const { ctx, width, height, onColor, offColor, config, time } = context
  const { motionSpeed, motionAmplitude, ringWidth } = config
  
  const centerX = width / 2
  const centerY = height / 2
  
  // Oscillating offset based on time
  const phase = (time * motionSpeed) / 1000
  const offset = Math.sin(phase) * motionAmplitude
  
  ctx.fillStyle = offColor
  ctx.fillRect(0, 0, width, height)
  
  // Draw animated rings
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) + motionAmplitude
  for (let r = offset; r < maxRadius; r += ringWidth * 2) {
    if (r > 0) {
      ctx.fillStyle = onColor
      ctx.beginPath()
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
      ctx.fill()
      
      if (r + ringWidth < maxRadius) {
        ctx.fillStyle = offColor
        ctx.beginPath()
        ctx.arc(centerX, centerY, r + ringWidth, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

// ============================================
// 7) Motion-based: Rotation
// ============================================
export function renderMotionRotation(context: RenderContext): void {
  const { ctx, width, height, onColor, offColor, config, time } = context
  const { motionSpeed } = config
  
  const centerX = width / 2
  const centerY = height / 2
  
  // Rotating angle
  const angle = (time * motionSpeed) / 1000
  
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(angle)
  ctx.translate(-centerX, -centerY)
  
  // Draw a radial pattern (like pizza slices)
  const slices = 12
  for (let i = 0; i < slices; i++) {
    ctx.fillStyle = i % 2 === 0 ? onColor : offColor
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(
      centerX,
      centerY,
      Math.max(width, height),
      (i * 2 * Math.PI) / slices,
      ((i + 1) * 2 * Math.PI) / slices
    )
    ctx.closePath()
    ctx.fill()
  }
  
  ctx.restore()
}

// ============================================
// 8) Sparse pattern (QR-code-like blocks)
// ============================================
export function renderSparse(context: RenderContext): void {
  const { ctx, width, height, isOn, onColor, offColor, config } = context
  const { sparsity, blockSize } = config
  
  // Background
  ctx.fillStyle = offColor
  ctx.fillRect(0, 0, width, height)
  
  const cols = Math.ceil(width / blockSize)
  const rows = Math.ceil(height / blockSize)
  
  // Use seeded random for consistent pattern
  const seed = isOn ? 12345 : 54321 // Different seeds for on/off states
  let rng = seed
  const random = () => {
    rng = (rng * 9301 + 49297) % 233280
    return rng / 233280
  }
  
  ctx.fillStyle = onColor
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Randomly fill based on sparsity
      if (random() * 100 < sparsity) {
        ctx.fillRect(col * blockSize, row * blockSize, blockSize, blockSize)
      }
    }
  }
}

// ============================================
// 9) Fractal pattern (Perlin-ish noise)
// ============================================
export function renderFractal(context: RenderContext): void {
  const { ctx, width, height, onColor, offColor, config } = context
  const { fractalDimension, fractalScale, fractalOctaves } = config
  
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data
  
  const onRgb = hexToRgb(onColor)
  const offRgb = hexToRgb(offColor)
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Multi-octave noise
      let value = 0
      let amplitude = 1
      let frequency = fractalScale * 0.005
      
      for (let octave = 0; octave < fractalOctaves; octave++) {
        // Simple pseudo-noise (not true Perlin, but sufficient)
        const noiseValue = simpleNoise(x * frequency, y * frequency)
        value += noiseValue * amplitude
        
        amplitude *= 0.5 * fractalDimension
        frequency *= 2
      }
      
      // Normalize to [0, 1]
      const t = Math.max(0, Math.min(1, (value + 1) / 2))
      
      const idx = (y * width + x) * 4
      data[idx] = Math.round(offRgb.r + t * (onRgb.r - offRgb.r))
      data[idx + 1] = Math.round(offRgb.g + t * (onRgb.g - offRgb.g))
      data[idx + 2] = Math.round(offRgb.b + t * (onRgb.b - offRgb.b))
      data[idx + 3] = 255
    }
  }
  
  ctx.putImageData(imageData, 0, 0)
}

// ============================================
// Utility Functions
// ============================================

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 255, g: 255, b: 255 }
}

function simpleNoise(x: number, y: number): number {
  // Simple deterministic pseudo-random noise
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return (n - Math.floor(n)) * 2 - 1
}

// ============================================
// Main renderer dispatcher
// ============================================
export function renderPattern(
  patternType: PatternType,
  context: RenderContext
): void {
  switch (patternType) {
    case 'fullfield':
      renderFullField(context)
      break
    case 'checkerboard':
      renderCheckerboard(context)
      break
    case 'grating':
      renderGrating(context)
      break
    case 'gabor':
      renderGabor(context)
      break
    case 'concentric':
      renderConcentric(context)
      break
    case 'motion-radial':
      renderMotionRadial(context)
      break
    case 'motion-rotation':
      renderMotionRotation(context)
      break
    case 'sparse':
      renderSparse(context)
      break
    case 'fractal':
      renderFractal(context)
      break
    default:
      renderFullField(context)
  }
}
