// ============================================
// Performance Monitoring Utility
// ============================================
// Tracks frame timing, dropped frames, and rendering performance

export interface PerformanceMetrics {
  fps: number
  averageFrameTime: number
  droppedFrames: number
  p95FrameTime: number // 95th percentile
  lastUpdate: number
}

class PerformanceMonitor {
  private frameTimes: number[] = []
  private droppedFrames = 0
  private lastFrameTime = 0
  private frameCount = 0
  private maxSamples = 120 // Keep last 2 seconds at 60fps
  
  recordFrame(timestamp: number, targetFrameTime: number): void {
    if (this.lastFrameTime > 0) {
      const frameTime = timestamp - this.lastFrameTime
      this.frameTimes.push(frameTime)
      
      // Track dropped frames (>50% over target)
      if (frameTime > targetFrameTime * 1.5) {
        this.droppedFrames++
      }
      
      // Keep buffer size manageable
      if (this.frameTimes.length > this.maxSamples) {
        this.frameTimes.shift()
      }
    }
    
    this.lastFrameTime = timestamp
    this.frameCount++
  }
  
  getMetrics(): PerformanceMetrics {
    if (this.frameTimes.length === 0) {
      return {
        fps: 0,
        averageFrameTime: 0,
        droppedFrames: 0,
        p95FrameTime: 0,
        lastUpdate: performance.now()
      }
    }
    
    const sum = this.frameTimes.reduce((a, b) => a + b, 0)
    const avg = sum / this.frameTimes.length
    const fps = 1000 / avg
    
    // Calculate 95th percentile
    const sorted = [...this.frameTimes].sort((a, b) => a - b)
    const p95Index = Math.floor(sorted.length * 0.95)
    const p95 = sorted[p95Index] || avg
    
    return {
      fps: Math.round(fps * 10) / 10,
      averageFrameTime: Math.round(avg * 100) / 100,
      droppedFrames: this.droppedFrames,
      p95FrameTime: Math.round(p95 * 100) / 100,
      lastUpdate: performance.now()
    }
  }
  
  reset(): void {
    this.frameTimes = []
    this.droppedFrames = 0
    this.lastFrameTime = 0
    this.frameCount = 0
  }
  
  getDroppedFrameRate(): number {
    return this.frameCount > 0 ? (this.droppedFrames / this.frameCount) * 100 : 0
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor()

// Dev mode logging
export function logPerformanceMetrics(metrics: PerformanceMetrics): void {
  if (import.meta.env.DEV) {
    const droppedRate = perfMonitor.getDroppedFrameRate()
    console.log(`[PERF] FPS: ${metrics.fps} | Avg: ${metrics.averageFrameTime}ms | P95: ${metrics.p95FrameTime}ms | Dropped: ${metrics.droppedFrames} (${droppedRate.toFixed(1)}%)`)
  }
}
