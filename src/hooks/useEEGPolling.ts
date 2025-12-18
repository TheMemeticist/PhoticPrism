// ============================================
// EEG Polling Hook
// ============================================
// Manages continuous EEG data polling in the background

import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'

export function useEEGPolling() {
  const eeg = useAppStore((s) => s.eeg)
  const addEEGReading = useAppStore((s) => s.addEEGReading)
  const pollingRef = useRef<number | null>(null)

  useEffect(() => {
    // Start polling if streaming is enabled
    if (eeg.streaming && eeg.connected && eeg.calibrated) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }

      const pollingInterval = 1000 // 1 second default

      pollingRef.current = window.setInterval(async () => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/normalized-bands?window=5&method=zscore`
          )

          if (!response.ok) {
            console.warn('Failed to get EEG bands:', response.statusText)
            return
          }

          const data = await response.json()

          // Add to readings history
          addEEGReading({
            timestamp: Date.now(),
            alpha: data.normalized.alpha,
            beta: data.normalized.beta,
            delta: data.normalized.delta,
            gamma: data.normalized.gamma,
            theta: data.normalized.theta
          })
        } catch (err) {
          console.warn('EEG polling error:', err)
        }
      }, pollingInterval)

      console.log(`🧠 EEG polling started (${pollingInterval}ms interval)`)
    } else {
      // Stop polling if streaming is disabled
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
        console.log('🧠 EEG polling stopped')
      }
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [eeg.streaming, eeg.connected, eeg.calibrated, addEEGReading])
}
