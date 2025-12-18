// ============================================
// Auto-Hide UI Hook
// ============================================
// Manages UI visibility based on user activity (mouse/touch movement)

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseAutoHideOptions {
  /**
   * Time in ms before UI hides after last activity
   * @default 3000
   */
  hideDelay?: number
  
  /**
   * Whether auto-hide is enabled
   * @default true
   */
  enabled?: boolean
  
  /**
   * Whether the cursor is currently hovering over a persistent region
   * (e.g., EEG graph or control panel)
   * @default false
   */
  isHoveringPersistentRegion?: boolean
}

export function useAutoHide(options: UseAutoHideOptions = {}) {
  const { hideDelay = 3000, enabled = true, isHoveringPersistentRegion = false } = options
  
  const [isVisible, setIsVisible] = useState(true)
  const timeoutRef = useRef<number | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // Show UI and reset hide timer
  const showUI = useCallback(() => {
    if (!enabled) return
    
    lastActivityRef.current = Date.now()
    setIsVisible(true)
    
    // Clear existing timeout
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }
    
    // Set new timeout to hide (only if not hovering over persistent region)
    if (!isHoveringPersistentRegion) {
      timeoutRef.current = window.setTimeout(() => {
        setIsVisible(false)
      }, hideDelay)
    }
  }, [enabled, hideDelay, isHoveringPersistentRegion])

  // Handle activity (mouse move, touch, scroll)
  useEffect(() => {
    if (!enabled) {
      setIsVisible(true)
      return
    }

    const handleActivity = () => {
      showUI()
    }

    // Add event listeners for various activity types
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('touchstart', handleActivity)
    window.addEventListener('touchmove', handleActivity)
    window.addEventListener('scroll', handleActivity, true) // Capture phase for all scrolls
    
    // Show UI initially
    showUI()

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
      window.removeEventListener('touchmove', handleActivity)
      window.removeEventListener('scroll', handleActivity, true)
      
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, showUI])

  // Force show UI (can be called from ESC key or other triggers)
  const forceShow = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(true)
    
    // Reset timeout
    timeoutRef.current = window.setTimeout(() => {
      if (enabled) {
        setIsVisible(false)
      }
    }, hideDelay)
  }, [enabled, hideDelay])

  return {
    isVisible,
    showUI,
    forceShow
  }
}
