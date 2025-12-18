// ============================================
// EEG Graph Component
// ============================================
// Real-time visualization of brainwave bands and coherence score with historical data

import { useEffect, useRef } from 'react'
import { useAppStore } from '../../store/appStore'
import './EEGGraph.css'

interface EEGDataPoint {
  timestamp: number
  alpha: number
  beta: number
  delta: number
  gamma: number
  theta: number
}

interface EEGGraphProps {
  readings: EEGDataPoint[]
  isVisible: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const BAND_COLORS = {
  alpha: '#22c55e',   // Green
  beta: '#3b82f6',    // Blue
  delta: '#a855f7',   // Purple
  gamma: '#f59e0b',   // Amber
  theta: '#ef4444'    // Red
}

const BAND_LABELS = {
  alpha: 'Alpha (8-13 Hz)',
  beta: 'Beta (13-30 Hz)',
  delta: 'Delta (0.5-4 Hz)',
  gamma: 'Gamma (30+ Hz)',
  theta: 'Theta (4-8 Hz)'
}

const TIME_WINDOWS = [
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
  { label: '1 hour', seconds: 3600 }
]

export function EEGGraph({ readings, isVisible, onMouseEnter, onMouseLeave }: EEGGraphProps) {
  const bandsCanvasRef = useRef<HTMLCanvasElement>(null)
  const coherenceCanvasRef = useRef<HTMLCanvasElement>(null)
  const timeWindow = useAppStore((s) => s.eegGraphTimeWindow)
  const setTimeWindow = useAppStore((s) => s.setEEGGraphTimeWindow)
  const coherenceHistory = useAppStore((s) => s.coherenceHistory)
  const neurofeedbackEnabled = useAppStore((s) => s.neurofeedback.enabled)
  
  // Render bands graph
  useEffect(() => {
    const canvas = bandsCanvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    canvas.width = width
    canvas.height = height
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    if (readings.length === 0) {
      // Draw "No Data" message
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '14px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('No EEG data yet...', width / 2, height / 2)
      return
    }
    
    // Calculate time window
    const now = Date.now()
    const timeWindowMs = timeWindow * 1000
    const startTime = now - timeWindowMs
    
    // Filter to time window
    const visibleReadings = readings.filter(r => r.timestamp >= startTime)
    
    if (visibleReadings.length === 0) return
    
    // Find min/max for scaling
    let minValue = Infinity
    let maxValue = -Infinity
    
    visibleReadings.forEach(r => {
      const values = [r.alpha, r.beta, r.delta, r.gamma, r.theta]
      values.forEach(v => {
        minValue = Math.min(minValue, v)
        maxValue = Math.max(maxValue, v)
      })
    })
    
    // Add padding to range
    const range = maxValue - minValue
    const padding = range * 0.1
    minValue -= padding
    maxValue += padding
    
    // Ensure reasonable bounds
    if (minValue === maxValue) {
      minValue -= 1
      maxValue += 1
    }
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (height * i) / 4
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    
    // Vertical grid lines
    const numVLines = 6
    for (let i = 0; i <= numVLines; i++) {
      const x = (width * i) / numVLines
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    
    // Draw zero line if in range
    if (minValue <= 0 && maxValue >= 0) {
      const zeroY = height - ((0 - minValue) / (maxValue - minValue)) * height
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(0, zeroY)
      ctx.lineTo(width, zeroY)
      ctx.stroke()
      ctx.setLineDash([])
    }
    
    // Draw each band
    const bands: Array<keyof typeof BAND_COLORS> = ['alpha', 'beta', 'delta', 'gamma', 'theta']
    
    bands.forEach(band => {
      ctx.strokeStyle = BAND_COLORS[band]
      ctx.lineWidth = 2
      ctx.beginPath()
      
      let first = true
      visibleReadings.forEach(reading => {
        const x = ((reading.timestamp - startTime) / timeWindowMs) * width
        const value = reading[band]
        const y = height - ((value - minValue) / (maxValue - minValue)) * height
        
        if (first) {
          ctx.moveTo(x, y)
          first = false
        } else {
          ctx.lineTo(x, y)
        }
      })
      
      ctx.stroke()
    })
    
    // Draw legend
    const legendX = 10
    let legendY = 20
    const legendSpacing = 18
    
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    
    bands.forEach(band => {
      // Draw colored square
      ctx.fillStyle = BAND_COLORS[band]
      ctx.fillRect(legendX, legendY - 10, 12, 12)
      
      // Draw label and current value
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      const latestValue = visibleReadings[visibleReadings.length - 1][band]
      ctx.fillText(
        `${BAND_LABELS[band]}: ${latestValue.toFixed(2)}`,
        legendX + 18,
        legendY
      )
      
      legendY += legendSpacing
    })
    
    // Draw time scale labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'right'
    const timeLabel = TIME_WINDOWS.find(w => w.seconds === timeWindow)?.label || '60s'
    ctx.fillText(`${timeLabel} ago`, width - 5, height - 5)
    ctx.textAlign = 'left'
    ctx.fillText('now', 5, height - 5)
    
  }, [readings, timeWindow])
  
  // Render coherence graph
  useEffect(() => {
    if (!neurofeedbackEnabled) return
    
    const canvas = coherenceCanvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    canvas.width = width
    canvas.height = height
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    if (coherenceHistory.length === 0) {
      // Draw "No Data" message
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('No coherence data yet...', width / 2, height / 2)
      return
    }
    
    // Calculate time window
    const now = Date.now()
    const timeWindowMs = timeWindow * 1000
    const startTime = now - timeWindowMs
    
    // Filter to time window
    const visibleData = coherenceHistory.filter(r => r.timestamp >= startTime)
    
    if (visibleData.length === 0) return
    
    // Find min/max for scaling
    let minValue = Math.min(...visibleData.map(r => r.score), -2)
    let maxValue = Math.max(...visibleData.map(r => r.score), 2)
    
    // Add padding
    const range = maxValue - minValue
    const padding = range * 0.1
    minValue -= padding
    maxValue += padding
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (height * i) / 4
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    
    // Vertical grid lines
    const numVLines = 6
    for (let i = 0; i <= numVLines; i++) {
      const x = (width * i) / numVLines
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    
    // Draw zero line
    const zeroY = height - ((0 - minValue) / (maxValue - minValue)) * height
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(0, zeroY)
    ctx.lineTo(width, zeroY)
    ctx.stroke()
    ctx.setLineDash([])
    
    // Draw coherence line with gradient (green above zero, red below)
    ctx.lineWidth = 3
    
    visibleData.forEach((point, index) => {
      if (index === 0) return
      
      const prevPoint = visibleData[index - 1]
      const x1 = ((prevPoint.timestamp - startTime) / timeWindowMs) * width
      const y1 = height - ((prevPoint.score - minValue) / (maxValue - minValue)) * height
      const x2 = ((point.timestamp - startTime) / timeWindowMs) * width
      const y2 = height - ((point.score - minValue) / (maxValue - minValue)) * height
      
      // Color based on score
      const color = point.score > 0 ? '#22c55e' : '#ef4444'
      ctx.strokeStyle = color
      
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    })
    
    // Draw current value
    const latest = visibleData[visibleData.length - 1]
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(
      `Coherence: ${latest.score.toFixed(2)} (${latest.targetBand.toUpperCase()})`,
      10,
      20
    )
    
    // Draw time scale labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'right'
    const timeLabel = TIME_WINDOWS.find(w => w.seconds === timeWindow)?.label || '60s'
    ctx.fillText(`${timeLabel} ago`, width - 5, height - 5)
    ctx.textAlign = 'left'
    ctx.fillText('now', 5, height - 5)
    
  }, [coherenceHistory, timeWindow, neurofeedbackEnabled])
  
  return (
    <div 
      className={`eeg-graph-container ${isVisible ? 'visible' : 'hidden'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Time window selector */}
      <div className="time-selector">
        {TIME_WINDOWS.map(tw => (
          <button
            key={tw.seconds}
            className={`time-btn ${timeWindow === tw.seconds ? 'active' : ''}`}
            onClick={() => setTimeWindow(tw.seconds)}
          >
            {tw.label}
          </button>
        ))}
      </div>
      
      {/* Bands graph */}
      <div className="eeg-graph">
        <canvas ref={bandsCanvasRef} />
      </div>
      
      {/* Coherence graph (only show when neurofeedback is enabled) */}
      {neurofeedbackEnabled && (
        <div className="eeg-graph coherence-graph">
          <canvas ref={coherenceCanvasRef} />
        </div>
      )}
    </div>
  )
}
