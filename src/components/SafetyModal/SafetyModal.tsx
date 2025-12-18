// ============================================
// Safety Modal Component
// ============================================
// First-load modal requiring user acknowledgment
// before photic flicker can be enabled.

import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import './SafetyModal.css'

export function SafetyModal() {
  const [checked, setChecked] = useState(false)
  const safety = useAppStore((s) => s.safety)
  const setSafety = useAppStore((s) => s.setSafety)

  // Don't render if already acknowledged
  if (safety.acknowledged) {
    return null
  }

  const handleAcknowledge = () => {
    if (checked) {
      setSafety({
        acknowledged: true,
        acknowledgedAt: Date.now()
      })
    }
  }

  return (
    <div className="safety-modal-overlay">
      <div className="safety-modal" role="dialog" aria-modal="true" aria-labelledby="safety-title">
        <div className="safety-modal-header">
          <span className="safety-icon">⚠️</span>
          <h1 id="safety-title">Important Safety Information</h1>
        </div>

        <div className="safety-modal-content">
          <div className="safety-warning-box">
            <h2>⚡ Photosensitivity Warning</h2>
            <p>
              Photic Prism generates <strong>flashing lights</strong> that may cause 
              seizures in people with <strong>photosensitive epilepsy</strong>.
            </p>
          </div>

          <div className="safety-section">
            <h3>Do NOT use this application if you:</h3>
            <ul>
              <li>Have epilepsy or a seizure disorder</li>
              <li>Have a history of unexplained fainting or seizures</li>
              <li>Have migraines with strong light sensitivity</li>
              <li>Are sensitive to flashing or flickering lights</li>
            </ul>
          </div>

          <div className="safety-section">
            <h3>If you choose to continue:</h3>
            <ul>
              <li>Use in a <strong>well-lit room</strong></li>
              <li>Start with <strong>low intensity settings</strong></li>
              <li>Keep the <strong>STOP button accessible</strong> at all times</li>
              <li>Press <strong>ESC</strong> to immediately stop all flicker</li>
              <li>Stop immediately if you feel discomfort, dizziness, or unusual sensations</li>
            </ul>
          </div>

          <div className="safety-section">
            <h3>Sensitive Frequency Ranges:</h3>
            <p>
              The range of <strong>10-25 Hz</strong> is most commonly associated with 
              photosensitive seizure risk. Higher frequencies (40+ Hz) are generally 
              considered safer, but individual sensitivity varies.
            </p>
          </div>

          <div className="safety-disclaimer">
            <p>
              <strong>Disclaimer:</strong> Photic Prism is not a medical device and makes 
              no diagnostic or treatment claims. Use at your own risk. Consult a healthcare 
              professional if you have concerns about photosensitivity.
            </p>
          </div>
        </div>

        <div className="safety-modal-footer">
          <label className="safety-checkbox-label">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="safety-checkbox"
            />
            <span>
              I have read and understand the safety warnings above. I confirm that I do 
              not have photosensitive epilepsy or related conditions, and I accept full 
              responsibility for my use of this application.
            </span>
          </label>

          <button
            className="btn btn-primary safety-continue-btn"
            disabled={!checked}
            onClick={handleAcknowledge}
          >
            Continue to Photic Prism
          </button>
        </div>
      </div>
    </div>
  )
}
