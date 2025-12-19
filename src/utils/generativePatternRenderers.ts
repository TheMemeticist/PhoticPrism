// ============================================
// Generative Pattern Rendering Utilities - OPTIMIZED
// ============================================
// Sacred geometry and meditation-focused patterns for deep states
// Based on neuroscience research on fractals, mandalas, and sacred geometry
// OPTIMIZATIONS: Cached allocations, pre-computed colors, reduced GC pressure

import { GenerativePatternType, GenerativeConfig } from '../types'

export interface GenerativeRenderContext {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  config: GenerativeConfig
  time: number // milliseconds
  flickerState: boolean // true = "on" phase, for optional brightness modulation
  neurofeedback?: {
    coherenceScore: number
    alphaPower: number
    thetaPower: number
    betaPower: number
    gammaPower: number
  }
}

// ============================================
// Pre-allocated buffers and caches
// ============================================
// Reserved for future WebGL optimization
// let cachedImageData: ImageData | null = null
// let cachedWidth = 0
// let cachedHeight = 0
// const colorCache = new Map<string, { r: number; g: number; b: number }>()
const paletteCache = new Map<string, string[]>()

// ============================================
// Helper Functions - OPTIMIZED
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

// Cached version for future use (currently generative patterns use direct hexToRgb)
// function hexToRgbCached(hex: string): { r: number; g: number; b: number } {
//   let cached = colorCache.get(hex)
//   if (!cached) {
//     cached = hexToRgb(hex)
//     colorCache.set(hex, cached)
//   }
//   return cached
// }

function getPaletteColors(palette: string): string[] {
  // Use cache to avoid recreating arrays
  let cached = paletteCache.get(palette)
  if (cached) return cached
  
  let colors: string[]
  switch (palette) {
    case 'rainbow':
      colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']
      break
    case 'chakra':
      colors = ['#FF0000', '#FF6600', '#FFFF00', '#00FF00', '#00AAFF', '#0000FF', '#9933FF']
      break
    case 'monochrome':
      colors = ['#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333', '#000000']
      break
    case 'earth':
      colors = ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#D2691E', '#F4A460']
      break
    case 'ocean':
      colors = ['#000080', '#0000CD', '#1E90FF', '#00BFFF', '#87CEEB', '#B0E0E6']
      break
    case 'fire':
      colors = ['#8B0000', '#FF0000', '#FF4500', '#FF6347', '#FF8C00', '#FFA500']
      break
    default:
      colors = ['#FFFFFF', '#CCCCCC']
  }
  
  paletteCache.set(palette, colors)
  return colors
}

function applyNeurofeedbackModulation(
  baseValue: number,
  config: GenerativeConfig,
  nf?: GenerativeRenderContext['neurofeedback']
): number {
  if (!nf) return baseValue
  
  // Modulate based on brainwave influences
  let modulation = 0
  
  if (config.alphaInfluence > 0) {
    modulation += (nf.alphaPower - 1) * (config.alphaInfluence / 100)
  }
  if (config.thetaInfluence > 0) {
    modulation += (nf.thetaPower - 1) * (config.thetaInfluence / 100)
  }
  if (config.betaInfluence > 0) {
    modulation += (nf.betaPower - 1) * (config.betaInfluence / 100)
  }
  if (config.gammaInfluence > 0) {
    modulation += (nf.gammaPower - 1) * (config.gammaInfluence / 100)
  }
  
  return baseValue * (1 + modulation * 0.5) // Scale effect
}

// ============================================
// 1) Sri Yantra (Sacred Geometry)
// ============================================
// Proven to induce alpha waves and meditative states
export function renderSriYantra(context: GenerativeRenderContext): void {
  const { ctx, width, height, config, time, neurofeedback } = context
  
  const centerX = width / 2
  const centerY = height / 2
  const baseSize = Math.min(width, height) * 0.4 * config.scale
  
  // Apply breathing animation
  const breathingPhase = Math.sin((time / 1000) * config.breathingRate * Math.PI * 2)
  const breathingMod = 1 + breathingPhase * 0.1
  const size = baseSize * breathingMod
  
  // Apply rotation
  const rotation = (time / 1000) * config.rotationSpeed * (Math.PI / 180)
  
  // Apply neurofeedback to complexity
  const triangleCount = Math.round(applyNeurofeedbackModulation(9, config, neurofeedback))
  
  // Clear background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)
  
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(rotation)
  
  // Get colors
  const colors = getPaletteColors(config.colorPalette)
  ctx.strokeStyle = colors[0]
  ctx.lineWidth = config.lineThickness
  
  // Draw interlocking triangles (simplified Sri Yantra)
  for (let i = 0; i < triangleCount; i++) {
    const angleMod = (i / triangleCount) * Math.PI * 2
    const sizeScale = 1 - (i / triangleCount) * 0.8
    const currentSize = size * sizeScale
    
    ctx.strokeStyle = colors[i % colors.length]
    
    ctx.beginPath()
    // Upward triangle
    for (let vertex = 0; vertex < 3; vertex++) {
      const angle = angleMod + (vertex * 2 * Math.PI) / 3
      const x = Math.cos(angle) * currentSize
      const y = Math.sin(angle) * currentSize
      if (vertex === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
    
    // Downward triangle (offset)
    ctx.beginPath()
    for (let vertex = 0; vertex < 3; vertex++) {
      const angle = angleMod + Math.PI + (vertex * 2 * Math.PI) / 3
      const x = Math.cos(angle) * currentSize * 0.9
      const y = Math.sin(angle) * currentSize * 0.9
      if (vertex === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }
  
  // Outer circles
  const circleCount = 3
  for (let i = 0; i < circleCount; i++) {
    const radius = size * (1 + i * 0.15)
    ctx.strokeStyle = colors[colors.length - 1 - i]
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()
  }
  
  // Apply glow effect
  if (config.innerGlow && config.glowIntensity > 0) {
    ctx.shadowBlur = config.glowIntensity
    ctx.shadowColor = colors[0]
  }
  
  ctx.restore()
}

// ============================================
// 2) Flower of Life (Sacred Geometry)
// ============================================
export function renderFlowerOfLife(context: GenerativeRenderContext): void {
  const { ctx, width, height, config, time, neurofeedback } = context
  
  const centerX = width / 2
  const centerY = height / 2
  const baseRadius = Math.min(width, height) * 0.08 * config.scale
  
  // Breathing animation
  const breathingPhase = Math.sin((time / 1000) * config.breathingRate * Math.PI * 2)
  const breathingMod = 1 + breathingPhase * 0.15
  const radius = baseRadius * breathingMod
  
  // Rotation
  const rotation = (time / 1000) * config.rotationSpeed * (Math.PI / 180)
  
  // Neurofeedback affects detail
  const detail = Math.round(applyNeurofeedbackModulation(config.geometryDetail, config, neurofeedback))
  
  // Clear background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)
  
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(rotation)
  
  const colors = getPaletteColors(config.colorPalette)
  ctx.lineWidth = config.lineThickness
  
  // Apply glow
  if (config.innerGlow && config.glowIntensity > 0) {
    ctx.shadowBlur = config.glowIntensity
    ctx.shadowColor = colors[0]
  }
  
  // Draw overlapping circles in hexagonal pattern
  const layers = Math.ceil(detail / 6)
  let circleIndex = 0
  
  // Center circle
  ctx.strokeStyle = colors[circleIndex % colors.length]
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.stroke()
  circleIndex++
  
  // Concentric hexagonal layers
  for (let layer = 1; layer <= layers; layer++) {
    const distance = radius * 2 * layer / Math.sqrt(3)
    
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3
      const x = Math.cos(angle) * distance
      const y = Math.sin(angle) * distance
      
      ctx.strokeStyle = colors[circleIndex % colors.length]
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.stroke()
      circleIndex++
      
      if (circleIndex >= detail) break
    }
    if (circleIndex >= detail) break
  }
  
  ctx.restore()
}

// ============================================
// 3) Mandala (Parametric Rotating Pattern)
// ============================================
export function renderMandalaParametric(context: GenerativeRenderContext): void {
  const { ctx, width, height, config, time, neurofeedback } = context
  
  const centerX = width / 2
  const centerY = height / 2
  const baseSize = Math.min(width, height) * 0.45 * config.scale
  
  // Breathing
  const breathingPhase = Math.sin((time / 1000) * config.breathingRate * Math.PI * 2)
  const breathingMod = 1 + breathingPhase * 0.2
  
  // Rotation
  const rotation = (time / 1000) * config.rotationSpeed * (Math.PI / 180)
  
  // Neurofeedback modulates complexity
  const petalCount = Math.round(applyNeurofeedbackModulation(config.symmetryOrder * 2, config, neurofeedback))
  
  // Clear
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)
  
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(rotation)
  
  const colors = getPaletteColors(config.colorPalette)
  ctx.lineWidth = config.lineThickness
  
  // Glow
  if (config.innerGlow && config.glowIntensity > 0) {
    ctx.shadowBlur = config.glowIntensity
    ctx.shadowColor = colors[0]
  }
  
  // Draw petals/rays
  for (let i = 0; i < petalCount; i++) {
    const angle = (i * 2 * Math.PI) / petalCount
    const colorIndex = Math.floor((i / petalCount) * colors.length)
    
    ctx.strokeStyle = colors[colorIndex]
    ctx.fillStyle = colors[colorIndex] + '33' // Semi-transparent
    
    // Petal shape
    ctx.beginPath()
    ctx.moveTo(0, 0)
    
    const points = 20
    for (let p = 0; p <= points; p++) {
      const t = (p / points) * Math.PI * 2
      const r = baseSize * breathingMod * (0.5 + 0.5 * Math.sin(t * 3))
      const x = Math.cos(angle) * r * Math.cos(t) - Math.sin(angle) * r * Math.sin(t) * 0.3
      const y = Math.sin(angle) * r * Math.cos(t) + Math.cos(angle) * r * Math.sin(t) * 0.3
      ctx.lineTo(x, y)
    }
    
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
  
  // Center circle
  ctx.fillStyle = colors[colors.length - 1]
  ctx.beginPath()
  ctx.arc(0, 0, baseSize * 0.1 * breathingMod, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.restore()
}

// ============================================
// 4) Julia Set Fractal
// ============================================
export function renderJuliaSet(context: GenerativeRenderContext): void {
  const { ctx, width, height, config, time, neurofeedback } = context
  
  // Animate Julia constant
  const timeScale = time / 10000
  const c = {
    real: config.juliaC.real + Math.sin(timeScale * config.evolutionSpeed / 10) * 0.1,
    imag: config.juliaC.imag + Math.cos(timeScale * config.evolutionSpeed / 10) * 0.1
  }
  
  // Zoom breathing
  const breathingPhase = Math.sin((time / 1000) * config.breathingRate * Math.PI * 2)
  const zoom = config.scale * (1 + breathingPhase * 0.2)
  
  // Neurofeedback affects iterations (detail)
  const maxIter = Math.round(applyNeurofeedbackModulation(config.maxIterations, config, neurofeedback))
  
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data
  const colors = getPaletteColors(config.colorPalette)
  
  // Render Julia set
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      // Map pixel to complex plane
      const x0 = ((px - width / 2) / (width / 4)) / zoom
      const y0 = ((py - height / 2) / (height / 4)) / zoom
      
      let x = x0
      let y = y0
      let iter = 0
      
      // Julia iteration
      while (x * x + y * y <= 4 && iter < maxIter) {
        const xtemp = x * x - y * y + c.real
        y = 2 * x * y + c.imag
        x = xtemp
        iter++
      }
      
      // Color based on iteration count
      const idx = (py * width + px) * 4
      if (iter === maxIter) {
        data[idx] = 0
        data[idx + 1] = 0
        data[idx + 2] = 0
      } else {
        const colorIndex = Math.floor((iter / maxIter) * (colors.length - 1))
        const rgb = hexToRgb(colors[colorIndex])
        data[idx] = rgb.r
        data[idx + 1] = rgb.g
        data[idx + 2] = rgb.b
      }
      data[idx + 3] = 255
    }
  }
  
  ctx.putImageData(imageData, 0, 0)
}

// ============================================
// 5) Golden Spiral (Sacred Geometry)
// ============================================
export function renderSacredSpiral(context: GenerativeRenderContext): void {
  const { ctx, width, height, config, time, neurofeedback } = context
  
  const centerX = width / 2
  const centerY = height / 2
  
  // Golden ratio
  const phi = (1 + Math.sqrt(5)) / 2
  
  // Breathing
  const breathingPhase = Math.sin((time / 1000) * config.breathingRate * Math.PI * 2)
  const breathingMod = 1 + breathingPhase * 0.15
  
  // Rotation
  const rotation = (time / 1000) * config.rotationSpeed * (Math.PI / 180)
  
  // Neurofeedback affects detail
  const spiralTurns = applyNeurofeedbackModulation(5, config, neurofeedback)
  
  // Clear
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)
  
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(rotation)
  
  const colors = getPaletteColors(config.colorPalette)
  ctx.strokeStyle = colors[0]
  ctx.lineWidth = config.lineThickness * 2
  
  // Glow
  if (config.innerGlow && config.glowIntensity > 0) {
    ctx.shadowBlur = config.glowIntensity
    ctx.shadowColor = colors[0]
  }
  
  // Draw golden spiral
  ctx.beginPath()
  const points = 500
  const maxRadius = Math.min(width, height) * 0.4 * config.scale * breathingMod
  
  for (let i = 0; i < points; i++) {
    const t = (i / points) * spiralTurns * Math.PI * 2
    const r = maxRadius * Math.pow(phi, -t / (Math.PI * 2))
    const x = r * Math.cos(t)
    const y = r * Math.sin(t)
    
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
    
    // Change color along spiral
    if (i % 50 === 0) {
      ctx.stroke()
      const colorIndex = Math.floor((i / points) * colors.length)
      ctx.strokeStyle = colors[colorIndex]
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }
  ctx.stroke()
  
  ctx.restore()
}

// ============================================
// Main Dispatcher
// ============================================
export function renderGenerativePattern(
  patternType: GenerativePatternType,
  context: GenerativeRenderContext
): void {
  switch (patternType) {
    case 'sri-yantra':
      renderSriYantra(context)
      break
    case 'flower-of-life':
      renderFlowerOfLife(context)
      break
    case 'mandala-parametric':
      renderMandalaParametric(context)
      break
    case 'julia-set':
      renderJuliaSet(context)
      break
    case 'sacred-spiral':
      renderSacredSpiral(context)
      break
    // Stubs for future implementation
    case 'metatron-cube':
    case 'l-system-tree':
    case 'l-system-spiral':
    case 'mandelbrot':
    case 'kaleidoscope':
    case 'perlin-flow':
    case 'torus-knot':
      // Fallback to Sri Yantra for now
      renderSriYantra(context)
      break
    default:
      renderFlowerOfLife(context)
  }
}
