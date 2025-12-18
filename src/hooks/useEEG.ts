// ============================================
// EEG API Hook - Muse Headset Integration
// ============================================
// Connects to local EEG server for real-time brainwave data

import { useState, useCallback, useRef, useEffect } from 'react'

export interface EEGBandData {
  alpha: number
  beta: number
  delta: number
  gamma: number
  theta: number
}

export interface EEGReading {
  timestamp: string
  normalized: EEGBandData
  raw_powers: EEGBandData
  baseline?: EEGBandData
  baseline_std?: EEGBandData
  has_baseline: boolean
  method: string
  window_seconds: number
}

export interface EEGState {
  connected: boolean
  calibrated: boolean
  device: string | null
  isCalibrating: boolean
  lastReading: EEGReading | null
  error: string | null
}

const API_BASE = 'http://localhost:5000/api'

export function useEEG() {
  const [state, setState] = useState<EEGState>({
    connected: false,
    calibrated: false,
    device: null,
    isCalibrating: false,
    lastReading: null,
    error: null
  })

  const pollingRef = useRef<number | null>(null)

  // Connect to EEG device
  const connect = useCallback(async (method: 'lsl' | 'simulated' = 'lsl') => {
    try {
      setState(prev => ({ ...prev, error: null }))
      const response = await fetch(`${API_BASE}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method })
      })
      
      if (!response.ok) {
        throw new Error(`Connection failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      setState(prev => ({
        ...prev,
        connected: true,
        device: data.device || 'Unknown',
        error: null
      }))
      
      console.log('🧠 EEG Connected:', data.device)
      return data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed'
      setState(prev => ({ ...prev, error: message, connected: false }))
      console.error('EEG connection error:', error)
      throw error
    }
  }, [])

  // Disconnect
  const disconnect = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setState({
      connected: false,
      calibrated: false,
      device: null,
      isCalibrating: false,
      lastReading: null,
      error: null
    })
    console.log('🧠 EEG Disconnected')
  }, [])

  // Calibrate baseline
  const calibrate = useCallback(async (duration: number = 30) => {
    try {
      setState(prev => ({ ...prev, isCalibrating: true, error: null }))
      
      const response = await fetch(`${API_BASE}/calibrate-baseline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration })
      })
      
      if (!response.ok) {
        throw new Error(`Calibration failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Wait for calibration duration
      await new Promise(resolve => setTimeout(resolve, duration * 1000))
      
      setState(prev => ({
        ...prev,
        calibrated: true,
        isCalibrating: false,
        error: null
      }))
      
      console.log(`🧠 EEG Calibrated (${duration}s baseline)`)
      return data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Calibration failed'
      setState(prev => ({ 
        ...prev, 
        error: message, 
        isCalibrating: false,
        calibrated: false
      }))
      console.error('EEG calibration error:', error)
      throw error
    }
  }, [])

  // Get normalized bands
  const getNormalizedBands = useCallback(async (
    window: number = 5,
    method: 'zscore' | 'percentile' = 'zscore'
  ): Promise<EEGReading> => {
    try {
      const response = await fetch(
        `${API_BASE}/normalized-bands?window=${window}&method=${method}`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to get bands: ${response.statusText}`)
      }
      
      const data: EEGReading = await response.json()
      setState(prev => ({ ...prev, lastReading: data, error: null }))
      return data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get bands'
      setState(prev => ({ ...prev, error: message }))
      console.error('EEG get bands error:', error)
      throw error
    }
  }, [])

  // Start polling for real-time data
  const startPolling = useCallback((intervalMs: number = 1000) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
    
    pollingRef.current = window.setInterval(() => {
      getNormalizedBands().catch(err => {
        console.warn('Polling error:', err)
      })
    }, intervalMs)
    
    console.log(`🧠 Started EEG polling (${intervalMs}ms interval)`)
  }, [getNormalizedBands])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
      console.log('🧠 Stopped EEG polling')
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  return {
    ...state,
    connect,
    disconnect,
    calibrate,
    getNormalizedBands,
    startPolling,
    stopPolling
  }
}
