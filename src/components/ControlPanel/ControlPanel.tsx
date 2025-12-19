// ============================================
// Control Panel Component
// ============================================
// Main control interface for flicker, audio, and app settings.

import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { getHzSensitivityWarning } from '../../utils/refreshRateUtils'
import { COMMON_REFRESH_RATES, SAFE_HZ_PRESETS } from '../../types'
import { RoutineViewer } from '../RoutineViewer/RoutineViewer'
import { calculateAutoCarrier } from '../../utils/audioUtils'
import './ControlPanel.css'

export function ControlPanel() {
  const [activeTab, setActiveTab] = useState<'flicker' | 'audio' | 'pattern' | 'display' | 'schedule' | 'eeg'>('flicker')
  
  return (
    <div className="control-panel">
      <div className="control-panel-header">
        <h2>Photic Prism</h2>
        <div className="control-tabs">
          <button 
            className={`tab ${activeTab === 'flicker' ? 'active' : ''}`}
            onClick={() => setActiveTab('flicker')}
          >
            Flicker
          </button>
          <button 
            className={`tab ${activeTab === 'pattern' ? 'active' : ''}`}
            onClick={() => setActiveTab('pattern')}
          >
            🎨 Pattern
          </button>
          <button 
            className={`tab ${activeTab === 'audio' ? 'active' : ''}`}
            onClick={() => setActiveTab('audio')}
          >
            Audio
          </button>
          <button 
            className={`tab ${activeTab === 'display' ? 'active' : ''}`}
            onClick={() => setActiveTab('display')}
          >
            Display
          </button>
          <button 
            className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            Schedule
          </button>
          <button 
            className={`tab ${activeTab === 'eeg' ? 'active' : ''}`}
            onClick={() => setActiveTab('eeg')}
          >
            🧠 EEG
          </button>
        </div>
      </div>

      <div className="control-panel-content">
        {activeTab === 'flicker' && <FlickerControls />}
        {activeTab === 'pattern' && <PatternControls />}
        {activeTab === 'audio' && <AudioControls />}
        {activeTab === 'display' && <DisplayControls />}
        {activeTab === 'schedule' && <ScheduleControls />}
        {activeTab === 'eeg' && <EEGControls />}
      </div>
    </div>
  )
}

// ============================================
// Flicker Controls Sub-component
// ============================================
function FlickerControls() {
  const flickerEnabled = useAppStore((s) => s.flickerEnabled)
  const flickerHz = useAppStore((s) => s.flickerHz)
  const flickerMode = useAppStore((s) => s.flickerMode)
  const snapToValid = useAppStore((s) => s.snapToValid)
  const colors = useAppStore((s) => s.colors)
  const validFrequencies = useAppStore((s) => s.validFrequencies)
  const safetyAcknowledged = useAppStore((s) => s.safety.acknowledged)
  
  const setFlickerEnabled = useAppStore((s) => s.setFlickerEnabled)
  const setFlickerHz = useAppStore((s) => s.setFlickerHz)
  const setFlickerMode = useAppStore((s) => s.setFlickerMode)
  const setColors = useAppStore((s) => s.setColors)

  const warning = getHzSensitivityWarning(flickerHz)

  return (
    <div className="control-section">
      {/* Master Enable */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Flicker</label>
          <button
            className={`toggle ${flickerEnabled ? 'active' : ''}`}
            onClick={() => setFlickerEnabled(!flickerEnabled)}
            disabled={!safetyAcknowledged}
            aria-pressed={flickerEnabled}
          >
            <span className="sr-only">{flickerEnabled ? 'Disable' : 'Enable'} flicker</span>
          </button>
        </div>
        {!safetyAcknowledged && (
          <p className="control-note">Complete safety acknowledgment first</p>
        )}
      </div>

      {/* Hz Selector with Snap Toggle */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Frequency</label>
          <div className="hz-input-group">
            <input
              type="number"
              className="form-input hz-numeric-input"
              min={0.1}
              max={100}
              step={0.1}
              value={flickerHz.toFixed(1)}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                if (!isNaN(val) && val >= 0.1 && val <= 100) {
                  if (snapToValid) {
                    const closest = validFrequencies.reduce((prev, curr) => 
                      Math.abs(curr.hz - val) < Math.abs(prev.hz - val) ? curr : prev
                    )
                    setFlickerHz(closest.hz)
                  } else {
                    useAppStore.setState({ flickerHz: val })
                  }
                }
              }}
            />
            <span className="hz-unit">Hz</span>
          </div>
        </div>
        
        <input
          type="range"
          className="slider"
          min={0.1}
          max={100}
          step={0.1}
          value={flickerHz}
          onChange={(e) => {
            const val = parseFloat(e.target.value)
            if (snapToValid) {
              const closest = validFrequencies.reduce((prev, curr) => 
                Math.abs(curr.hz - val) < Math.abs(prev.hz - val) ? curr : prev
              )
              setFlickerHz(closest.hz)
            } else {
              useAppStore.setState({ flickerHz: val })
            }
          }}
        />
        
        <div className="control-row" style={{ marginTop: '8px' }}>
          <label className="form-label">
            {snapToValid ? '✓ Perfect Hz (frame-locked)' : '≈ Approximate (time-based)'}
          </label>
          <button
            className={`toggle ${snapToValid ? 'active' : ''}`}
            onClick={() => useAppStore.setState({ snapToValid: !snapToValid })}
            aria-pressed={snapToValid}
          >
            <span className="sr-only">Toggle snap to valid</span>
          </button>
        </div>
        
        {warning.warning && (
          <div className={`alert alert-${warning.level === 'high' ? 'danger' : 'warning'}`}>
            {warning.warning}
          </div>
        )}
      </div>

      {/* Quick Presets */}
      <div className="control-group">
        <label className="form-label">Presets</label>
        <div className="preset-buttons">
          {SAFE_HZ_PRESETS.map(preset => {
            const available = validFrequencies.some(f => Math.abs(f.hz - preset) < 0.5)
            return (
              <button
                key={preset}
                className={`btn btn-secondary preset-btn ${Math.abs(flickerHz - preset) < 0.5 ? 'active' : ''}`}
                onClick={() => setFlickerHz(preset)}
                disabled={!available}
              >
                {preset} Hz
              </button>
            )
          })}
        </div>
      </div>

      {/* Flicker Mode */}
      <div className="control-group">
        <label className="form-label">Mode</label>
        <div className="mode-buttons">
          <button
            className={`btn btn-secondary ${flickerMode === 'fullscreen' ? 'active' : ''}`}
            onClick={() => setFlickerMode('fullscreen')}
          >
            Fullscreen
          </button>
          <button
            className={`btn btn-secondary ${flickerMode === 'reduced' ? 'active' : ''}`}
            onClick={() => setFlickerMode('reduced')}
          >
            Reduced
          </button>
          <button
            className={`btn btn-secondary ${flickerMode === 'border' ? 'active' : ''}`}
            onClick={() => setFlickerMode('border')}
          >
            Border
          </button>
        </div>
      </div>

      {/* Colors */}
      <div className="control-group">
        <label className="form-label">ON Color</label>
        <div className="color-row">
          <input
            type="color"
            value={colors.onColor}
            onChange={(e) => setColors({ onColor: e.target.value })}
            className="color-picker"
          />
          <input
            type="text"
            value={colors.onColor}
            onChange={(e) => setColors({ onColor: e.target.value })}
            className="form-input color-input"
          />
        </div>
      </div>

      <div className="control-group">
        <label className="form-label">OFF Color</label>
        <div className="color-row">
          <input
            type="color"
            value={colors.offColor}
            onChange={(e) => setColors({ offColor: e.target.value })}
            className="color-picker"
          />
          <input
            type="text"
            value={colors.offColor}
            onChange={(e) => setColors({ offColor: e.target.value })}
            className="form-input color-input"
          />
        </div>
      </div>

      {/* Brightness */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Brightness</label>
          <span className="control-value">{colors.brightness}%</span>
        </div>
        <input
          type="range"
          className="slider"
          min={10}
          max={100}
          value={colors.brightness}
          onChange={(e) => setColors({ brightness: parseInt(e.target.value, 10) })}
        />
      </div>
    </div>
  )
}

// ============================================
// Pattern Controls Sub-component
// ============================================
function PatternControls() {
  const patternMode = useAppStore((s) => s.patternMode)
  const setPatternMode = useAppStore((s) => s.setPatternMode)

  return (
    <div className="control-section">
      {/* Pattern Mode Switcher */}
      <div className="control-group">
        <label className="form-label">Mode</label>
        <div className="mode-buttons">
          <button
            className={`btn btn-secondary ${patternMode === 'clinical' ? 'active' : ''}`}
            onClick={() => setPatternMode('clinical')}
          >
            🔬 Clinical
          </button>
          <button
            className={`btn btn-secondary ${patternMode === 'generative' ? 'active' : ''}`}
            onClick={() => setPatternMode('generative')}
          >
            🌀 Generative
          </button>
        </div>
        <p className="control-note">
          {patternMode === 'clinical' 
            ? 'Science-based SSVEP patterns for neurofeedback research'
            : 'Sacred geometry & fractals for meditation and deep states'
          }
        </p>
      </div>

      {/* Render appropriate controls based on mode */}
      {patternMode === 'clinical' ? <ClinicalPatternControls /> : <GenerativePatternControls />}
    </div>
  )
}

// ============================================
// Clinical Pattern Controls Sub-component
// ============================================
function ClinicalPatternControls() {
  const patternType = useAppStore((s) => s.patternType)
  const patternConfig = useAppStore((s) => s.patternConfig)
  const setPatternType = useAppStore((s) => s.setPatternType)
  const setPatternConfig = useAppStore((s) => s.setPatternConfig)

  const patternInfo: Record<string, { name: string; description: string; science: string }> = {
    fullfield: {
      name: 'Full-Field Flicker',
      description: 'Simple luminance modulation',
      science: 'Baseline SSVEP stimulation - highest energy, good for calibration'
    },
    checkerboard: {
      name: 'Checkerboard (Clinical)',
      description: 'Pattern-reversal checkerboard',
      science: 'ISCEV standard - robust VEP responses, widely used in clinical settings'
    },
    grating: {
      name: 'Sine/Square Gratings',
      description: 'Oriented gratings with tunable spatial frequency',
      science: 'Research-friendly - precise spatial frequency control'
    },
    gabor: {
      name: 'Gabor Patches',
      description: 'Windowed grating (Gaussian envelope)',
      science: 'Localized stimulation - reduces glare while maintaining SSVEP'
    },
    concentric: {
      name: 'Concentric Rings',
      description: 'Radial ring patterns',
      science: 'Often more comfortable than checkerboards for long sessions'
    },
    'motion-radial': {
      name: 'Radial Motion',
      description: 'Expanding/contracting patterns',
      science: 'SSMVEP mode - reduced perceived flicker, motion pathway stimulation'
    },
    'motion-rotation': {
      name: 'Rotation Motion',
      description: 'Rotating radial pattern',
      science: 'SSMVEP mode - smooth motion-based entrainment'
    },
    sparse: {
      name: 'Sparse (QR-like)',
      description: 'QR-code style blocks',
      science: 'Fatigue reduction - maintains tagging with less visual load'
    },
    fractal: {
      name: 'Fractal Background',
      description: 'Complexity-controlled patterns',
      science: 'State bias - EEG alpha/beta modulation, aesthetic layer'
    }
  }

  const info = patternInfo[patternType]

  return (
    <>
      {/* Pattern Type Selector */}
      <div className="control-group">
        <label className="form-label">Pattern Type</label>
        <select
          className="form-select"
          value={patternType}
          onChange={(e) => setPatternType(e.target.value as any)}
        >
          <option value="fullfield">Full-Field Flicker</option>
          <option value="checkerboard">Checkerboard (Clinical Standard)</option>
          <option value="grating">Sine/Square Gratings</option>
          <option value="gabor">Gabor Patches</option>
          <option value="concentric">Concentric Rings</option>
          <option value="motion-radial">Radial Motion (SSMVEP)</option>
          <option value="motion-rotation">Rotation Motion (SSMVEP)</option>
          <option value="sparse">Sparse QR-like Pattern</option>
          <option value="fractal">Fractal Background</option>
        </select>
        
        {info && (
          <div style={{ 
            marginTop: '12px', 
            padding: '12px', 
            backgroundColor: 'var(--bg-elevated)', 
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{info.name}</div>
            <div style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>{info.description}</div>
            <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
              📚 {info.science}
            </div>
          </div>
        )}
      </div>

      {/* Checkerboard Parameters */}
      {patternType === 'checkerboard' && (
        <div className="control-group">
          <div className="control-row">
            <label className="form-label">Check Size</label>
            <span className="control-value">{patternConfig.checkSize}px</span>
          </div>
          <input
            type="range"
            className="slider"
            min={16}
            max={128}
            step={8}
            value={patternConfig.checkSize}
            onChange={(e) => setPatternConfig({ checkSize: parseInt(e.target.value) })}
          />
          <p className="control-note">ISCEV standard: ~32px (0.8° at typical viewing distance)</p>
        </div>
      )}

      {/* Grating/Gabor Parameters */}
      {(patternType === 'grating' || patternType === 'gabor') && (
        <>
          <div className="control-group">
            <div className="control-row">
              <label className="form-label">Spatial Frequency</label>
              <span className="control-value">{patternConfig.spatialFrequency.toFixed(2)}</span>
            </div>
            <input
              type="range"
              className="slider"
              min={0.1}
              max={2.0}
              step={0.05}
              value={patternConfig.spatialFrequency}
              onChange={(e) => setPatternConfig({ spatialFrequency: parseFloat(e.target.value) })}
            />
            <p className="control-note">Cycles per degree (lower = wider stripes)</p>
          </div>

          <div className="control-group">
            <div className="control-row">
              <label className="form-label">Orientation</label>
              <span className="control-value">{patternConfig.orientation}°</span>
            </div>
            <input
              type="range"
              className="slider"
              min={0}
              max={180}
              step={15}
              value={patternConfig.orientation}
              onChange={(e) => setPatternConfig({ orientation: parseInt(e.target.value) })}
            />
          </div>

          <div className="control-group">
            <label className="form-label">Waveform</label>
            <select
              className="form-select"
              value={patternConfig.gratingWaveform}
              onChange={(e) => setPatternConfig({ gratingWaveform: e.target.value as any })}
            >
              <option value="sine">Sine (smooth gradients)</option>
              <option value="square">Square (sharp edges)</option>
            </select>
          </div>

          {patternType === 'gabor' && (
            <div className="control-group">
              <div className="control-row">
                <label className="form-label">Gaussian Window Size</label>
                <span className="control-value">{patternConfig.gaborSigma}px</span>
              </div>
              <input
                type="range"
                className="slider"
                min={20}
                max={200}
                step={10}
                value={patternConfig.gaborSigma}
                onChange={(e) => setPatternConfig({ gaborSigma: parseInt(e.target.value) })}
              />
            </div>
          )}
        </>
      )}

      {/* Concentric Rings Parameters */}
      {patternType === 'concentric' && (
        <>
          <div className="control-group">
            <div className="control-row">
              <label className="form-label">Ring Count</label>
              <span className="control-value">{patternConfig.ringCount}</span>
            </div>
            <input
              type="range"
              className="slider"
              min={4}
              max={20}
              step={1}
              value={patternConfig.ringCount}
              onChange={(e) => setPatternConfig({ ringCount: parseInt(e.target.value) })}
            />
          </div>

          <div className="control-group">
            <div className="control-row">
              <label className="form-label">Ring Width</label>
              <span className="control-value">{patternConfig.ringWidth}px</span>
            </div>
            <input
              type="range"
              className="slider"
              min={20}
              max={120}
              step={10}
              value={patternConfig.ringWidth}
              onChange={(e) => setPatternConfig({ ringWidth: parseInt(e.target.value) })}
            />
          </div>
        </>
      )}

      {/* Motion Parameters */}
      {(patternType === 'motion-radial' || patternType === 'motion-rotation') && (
        <>
          <div className="control-group">
            <div className="control-row">
              <label className="form-label">Motion Speed</label>
              <span className="control-value">{patternConfig.motionSpeed}</span>
            </div>
            <input
              type="range"
              className="slider"
              min={20}
              max={200}
              step={10}
              value={patternConfig.motionSpeed}
              onChange={(e) => setPatternConfig({ motionSpeed: parseInt(e.target.value) })}
            />
            <p className="control-note">Higher = faster motion</p>
          </div>

          {patternType === 'motion-radial' && (
            <div className="control-group">
              <div className="control-row">
                <label className="form-label">Motion Amplitude</label>
                <span className="control-value">{patternConfig.motionAmplitude}px</span>
              </div>
              <input
                type="range"
                className="slider"
                min={20}
                max={100}
                step={10}
                value={patternConfig.motionAmplitude}
                onChange={(e) => setPatternConfig({ motionAmplitude: parseInt(e.target.value) })}
              />
            </div>
          )}
        </>
      )}

      {/* Sparse Pattern Parameters */}
      {patternType === 'sparse' && (
        <>
          <div className="control-group">
            <div className="control-row">
              <label className="form-label">Sparsity</label>
              <span className="control-value">{patternConfig.sparsity}%</span>
            </div>
            <input
              type="range"
              className="slider"
              min={10}
              max={60}
              step={5}
              value={patternConfig.sparsity}
              onChange={(e) => setPatternConfig({ sparsity: parseInt(e.target.value) })}
            />
            <p className="control-note">Lower = fewer blocks, more comfortable</p>
          </div>

          <div className="control-group">
            <div className="control-row">
              <label className="form-label">Block Size</label>
              <span className="control-value">{patternConfig.blockSize}px</span>
            </div>
            <input
              type="range"
              className="slider"
              min={12}
              max={48}
              step={4}
              value={patternConfig.blockSize}
              onChange={(e) => setPatternConfig({ blockSize: parseInt(e.target.value) })}
            />
          </div>
        </>
      )}

      {/* Fractal Parameters */}
      {patternType === 'fractal' && (
        <>
          <div className="control-group">
            <div className="control-row">
              <label className="form-label">Fractal Dimension</label>
              <span className="control-value">{patternConfig.fractalDimension.toFixed(1)}</span>
            </div>
            <input
              type="range"
              className="slider"
              min={1.0}
              max={2.5}
              step={0.1}
              value={patternConfig.fractalDimension}
              onChange={(e) => setPatternConfig({ fractalDimension: parseFloat(e.target.value) })}
            />
            <p className="control-note">Controls complexity/detail level</p>
          </div>

          <div className="control-group">
            <div className="control-row">
              <label className="form-label">Scale/Zoom</label>
              <span className="control-value">{patternConfig.fractalScale.toFixed(1)}</span>
            </div>
            <input
              type="range"
              className="slider"
              min={0.5}
              max={2.0}
              step={0.1}
              value={patternConfig.fractalScale}
              onChange={(e) => setPatternConfig({ fractalScale: parseFloat(e.target.value) })}
            />
          </div>

          <div className="control-group">
            <div className="control-row">
              <label className="form-label">Octaves (Detail Layers)</label>
              <span className="control-value">{patternConfig.fractalOctaves}</span>
            </div>
            <input
              type="range"
              className="slider"
              min={1}
              max={8}
              step={1}
              value={patternConfig.fractalOctaves}
              onChange={(e) => setPatternConfig({ fractalOctaves: parseInt(e.target.value) })}
            />
          </div>
        </>
      )}

      {/* Universal Contrast Control */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Contrast</label>
          <span className="control-value">{patternConfig.contrast}%</span>
        </div>
        <input
          type="range"
          className="slider"
          min={20}
          max={100}
          step={5}
          value={patternConfig.contrast}
          onChange={(e) => setPatternConfig({ contrast: parseInt(e.target.value) })}
        />
        <p className="control-note">Lower contrast may be more comfortable for sensitive users</p>
      </div>
    </>
  )
}

// ============================================
// Generative Pattern Controls Sub-component
// ============================================
function GenerativePatternControls() {
  const generativePatternType = useAppStore((s) => s.generativePatternType)
  const generativeConfig = useAppStore((s) => s.generativeConfig)
  const setGenerativePatternType = useAppStore((s) => s.setGenerativePatternType)
  const setGenerativeConfig = useAppStore((s) => s.setGenerativeConfig)
  const neurofeedbackEnabled = useAppStore((s) => s.neurofeedback.enabled)

  const patternInfo: Record<string, { name: string; description: string; benefits: string }> = {
    'sri-yantra': {
      name: 'Sri Yantra',
      description: 'Sacred interlocking triangles',
      benefits: '✨ Proven to induce alpha waves and rapid meditative states (Kulaichev, 1987)'
    },
    'flower-of-life': {
      name: 'Flower of Life',
      description: 'Overlapping circles in hexagonal pattern',
      benefits: '☮️ Symbolizes unity and harmony - traditional meditation focal point'
    },
    'mandala-parametric': {
      name: 'Rotating Mandala',
      description: 'Dynamic symmetric mandala with breathing',
      benefits: '🎯 Encourages sustained inward focus and quiets mental chatter'
    },
    'julia-set': {
      name: 'Julia Set Fractal',
      description: 'Mathematical fractal with infinite detail',
      benefits: '🧠 Fractal dimension ~1.3 promotes alpha activity (fluent processing)'
    },
    'sacred-spiral': {
      name: 'Golden Spiral',
      description: 'Fibonacci spiral following golden ratio',
      benefits: '🌀 Natural harmony - found throughout nature and sacred architecture'
    }
  }

  const info = patternInfo[generativePatternType] || patternInfo['flower-of-life']

  return (
    <>
      {/* Pattern Type Selector */}
      <div className="control-group">
        <label className="form-label">Pattern Type</label>
        <select
          className="form-select"
          value={generativePatternType}
          onChange={(e) => setGenerativePatternType(e.target.value as any)}
        >
          <option value="sri-yantra">Sri Yantra (Sacred Geometry)</option>
          <option value="flower-of-life">Flower of Life</option>
          <option value="mandala-parametric">Rotating Mandala</option>
          <option value="julia-set">Julia Set Fractal</option>
          <option value="sacred-spiral">Golden Spiral</option>
        </select>
        
        {info && (
          <div style={{ 
            marginTop: '12px', 
            padding: '12px', 
            backgroundColor: 'var(--bg-elevated)', 
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{info.name}</div>
            <div style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>{info.description}</div>
            <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
              {info.benefits}
            </div>
          </div>
        )}
      </div>

      {/* Base Parameters */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Complexity</label>
          <span className="control-value">{generativeConfig.complexity}%</span>
        </div>
        <input
          type="range"
          className="slider"
          min={10}
          max={100}
          step={5}
          value={generativeConfig.complexity}
          onChange={(e) => setGenerativeConfig({ complexity: parseInt(e.target.value) })}
        />
        <p className="control-note">Detail level and intricacy of the pattern</p>
      </div>

      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Evolution Speed</label>
          <span className="control-value">{generativeConfig.evolutionSpeed}%</span>
        </div>
        <input
          type="range"
          className="slider"
          min={0}
          max={100}
          step={5}
          value={generativeConfig.evolutionSpeed}
          onChange={(e) => setGenerativeConfig({ evolutionSpeed: parseInt(e.target.value) })}
        />
        <p className="control-note">How fast the pattern evolves and morphs</p>
      </div>

      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Scale</label>
          <span className="control-value">{generativeConfig.scale.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          className="slider"
          min={0.5}
          max={2.0}
          step={0.1}
          value={generativeConfig.scale}
          onChange={(e) => setGenerativeConfig({ scale: parseFloat(e.target.value) })}
        />
      </div>

      {/* Visual Style */}
      <div className="control-group">
        <label className="form-label">Color Palette</label>
        <select
          className="form-select"
          value={generativeConfig.colorPalette}
          onChange={(e) => setGenerativeConfig({ colorPalette: e.target.value as any })}
        >
          <option value="chakra">Chakra (7 energy centers)</option>
          <option value="rainbow">Rainbow</option>
          <option value="monochrome">Monochrome</option>
          <option value="earth">Earth Tones</option>
          <option value="ocean">Ocean Blues</option>
          <option value="fire">Fire Reds/Oranges</option>
        </select>
      </div>

      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Line Thickness</label>
          <span className="control-value">{generativeConfig.lineThickness}px</span>
        </div>
        <input
          type="range"
          className="slider"
          min={1}
          max={10}
          step={1}
          value={generativeConfig.lineThickness}
          onChange={(e) => setGenerativeConfig({ lineThickness: parseInt(e.target.value) })}
        />
      </div>

      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Glow Intensity</label>
          <span className="control-value">{generativeConfig.glowIntensity}%</span>
        </div>
        <input
          type="range"
          className="slider"
          min={0}
          max={100}
          step={5}
          value={generativeConfig.glowIntensity}
          onChange={(e) => setGenerativeConfig({ glowIntensity: parseInt(e.target.value) })}
        />
      </div>

      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Inner Glow Effect</label>
          <button
            className={`toggle ${generativeConfig.innerGlow ? 'active' : ''}`}
            onClick={() => setGenerativeConfig({ innerGlow: !generativeConfig.innerGlow })}
            aria-pressed={generativeConfig.innerGlow}
          >
            <span className="sr-only">{generativeConfig.innerGlow ? 'Disable' : 'Enable'} inner glow</span>
          </button>
        </div>
      </div>

      {/* Animation */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Breathing Rate</label>
          <span className="control-value">{generativeConfig.breathingRate.toFixed(1)} Hz</span>
        </div>
        <input
          type="range"
          className="slider"
          min={0}
          max={2.0}
          step={0.1}
          value={generativeConfig.breathingRate}
          onChange={(e) => setGenerativeConfig({ breathingRate: parseFloat(e.target.value) })}
        />
        <p className="control-note">Pattern pulsation/breathing frequency (0 = static)</p>
      </div>

      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Rotation Speed</label>
          <span className="control-value">{generativeConfig.rotationSpeed}°/s</span>
        </div>
        <input
          type="range"
          className="slider"
          min={-100}
          max={100}
          step={5}
          value={generativeConfig.rotationSpeed}
          onChange={(e) => setGenerativeConfig({ rotationSpeed: parseInt(e.target.value) })}
        />
        <p className="control-note">Negative = counter-clockwise, 0 = no rotation</p>
      </div>

      {/* Pattern-Specific Parameters */}
      {generativePatternType === 'julia-set' && (
        <>
          <div className="control-group">
            <div className="control-row">
              <label className="form-label">Max Iterations</label>
              <span className="control-value">{generativeConfig.maxIterations}</span>
            </div>
            <input
              type="range"
              className="slider"
              min={20}
              max={200}
              step={10}
              value={generativeConfig.maxIterations}
              onChange={(e) => setGenerativeConfig({ maxIterations: parseInt(e.target.value) })}
            />
            <p className="control-note">Higher = more detail (slower rendering)</p>
          </div>
        </>
      )}

      {(generativePatternType === 'sri-yantra' || generativePatternType === 'flower-of-life' || generativePatternType === 'mandala-parametric') && (
        <>
          <div className="control-group">
            <div className="control-row">
              <label className="form-label">Geometry Detail</label>
              <span className="control-value">{generativeConfig.geometryDetail}</span>
            </div>
            <input
              type="range"
              className="slider"
              min={3}
              max={24}
              step={1}
              value={generativeConfig.geometryDetail}
              onChange={(e) => setGenerativeConfig({ geometryDetail: parseInt(e.target.value) })}
            />
            <p className="control-note">Number of elements in the pattern</p>
          </div>
        </>
      )}

      {generativePatternType === 'mandala-parametric' && (
        <div className="control-group">
          <div className="control-row">
            <label className="form-label">Symmetry Order</label>
            <span className="control-value">{generativeConfig.symmetryOrder}-fold</span>
          </div>
          <input
            type="range"
            className="slider"
            min={3}
            max={12}
            step={1}
            value={generativeConfig.symmetryOrder}
            onChange={(e) => setGenerativeConfig({ symmetryOrder: parseInt(e.target.value) })}
          />
          <p className="control-note">Rotational symmetry (3=triangle, 4=square, 6=hexagon, etc.)</p>
        </div>
      )}

      {/* Neurofeedback Integration */}
      {neurofeedbackEnabled && (
        <div className="control-group" style={{ borderTop: '1px solid var(--bg-elevated)', paddingTop: '16px', marginTop: '16px' }}>
          <label className="form-label">🧠 Neurofeedback Modulation</label>
          <p className="control-note" style={{ marginBottom: '12px' }}>
            Pattern responds to real-time brainwave data
          </p>

          <div style={{ marginTop: '8px' }}>
            <div className="control-row">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Alpha Influence (Complexity)</label>
              <span className="control-value">{generativeConfig.alphaInfluence}%</span>
            </div>
            <input
              type="range"
              className="slider"
              min={0}
              max={100}
              step={5}
              value={generativeConfig.alphaInfluence}
              onChange={(e) => setGenerativeConfig({ alphaInfluence: parseInt(e.target.value) })}
            />
          </div>

          <div style={{ marginTop: '8px' }}>
            <div className="control-row">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Theta Influence (Depth/Flow)</label>
              <span className="control-value">{generativeConfig.thetaInfluence}%</span>
            </div>
            <input
              type="range"
              className="slider"
              min={0}
              max={100}
              step={5}
              value={generativeConfig.thetaInfluence}
              onChange={(e) => setGenerativeConfig({ thetaInfluence: parseInt(e.target.value) })}
            />
          </div>

          <div style={{ marginTop: '8px' }}>
            <div className="control-row">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Beta Influence (Speed)</label>
              <span className="control-value">{generativeConfig.betaInfluence}%</span>
            </div>
            <input
              type="range"
              className="slider"
              min={0}
              max={100}
              step={5}
              value={generativeConfig.betaInfluence}
              onChange={(e) => setGenerativeConfig({ betaInfluence: parseInt(e.target.value) })}
            />
          </div>

          <div style={{ marginTop: '8px' }}>
            <div className="control-row">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Gamma Influence (Detail)</label>
              <span className="control-value">{generativeConfig.gammaInfluence}%</span>
            </div>
            <input
              type="range"
              className="slider"
              min={0}
              max={100}
              step={5}
              value={generativeConfig.gammaInfluence}
              onChange={(e) => setGenerativeConfig({ gammaInfluence: parseInt(e.target.value) })}
            />
          </div>

          <div style={{ marginTop: '8px' }}>
            <div className="control-row">
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Coherence Breathing Sync</label>
              <span className="control-value">{generativeConfig.coherenceResponse}%</span>
            </div>
            <input
              type="range"
              className="slider"
              min={0}
              max={100}
              step={5}
              value={generativeConfig.coherenceResponse}
              onChange={(e) => setGenerativeConfig({ coherenceResponse: parseInt(e.target.value) })}
            />
            <p className="control-note" style={{ marginTop: '4px' }}>
              Pattern breathing syncs with your coherence score
            </p>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================
// Audio Controls Sub-component
// ============================================
function AudioControls() {
  const audio = useAppStore((s) => s.audio)
  const flickerHz = useAppStore((s) => s.flickerHz)
  const setAudio = useAppStore((s) => s.setAudio)

  const handleBeatFreqChange = (value: number) => {
    setAudio({ beatFreq: value, lockedToFlicker: false })
  }

  const handleLockToggle = () => {
    if (!audio.lockedToFlicker) {
      setAudio({ lockedToFlicker: true, beatFreq: flickerHz })
    } else {
      setAudio({ lockedToFlicker: false })
    }
  }

  return (
    <div className="control-section">
      {/* Master Enable */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Audio</label>
          <button
            className={`toggle ${audio.enabled ? 'active' : ''}`}
            onClick={() => setAudio({ enabled: !audio.enabled })}
            aria-pressed={audio.enabled}
          >
            <span className="sr-only">{audio.enabled ? 'Disable' : 'Enable'} audio</span>
          </button>
        </div>
        <p className="control-note">Click to start audio (browser autoplay policy)</p>
      </div>

      {/* Volume */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Volume</label>
          <span className="control-value">{audio.volume}%</span>
        </div>
        <input
          type="range"
          className="slider"
          min={0}
          max={100}
          value={audio.volume}
          onChange={(e) => setAudio({ volume: parseInt(e.target.value, 10) })}
        />
      </div>

      {/* Carrier Mode Toggle */}
      <div className="control-group">
        <label className="form-label">Carrier Mode</label>
        <div className="mode-buttons">
          <button
            className={`btn btn-secondary ${audio.carrierMode === 'manual' ? 'active' : ''}`}
            onClick={() => setAudio({ carrierMode: 'manual' })}
          >
            Manual
          </button>
          <button
            className={`btn btn-secondary ${audio.carrierMode === 'auto' ? 'active' : ''}`}
            onClick={() => setAudio({ carrierMode: 'auto' })}
          >
            Auto
          </button>
        </div>
        <p className="control-note">
          Auto mode calculates optimal carrier frequency based on target Hz (research-aligned)
        </p>
      </div>

      {/* Carrier Frequency */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Carrier Frequency</label>
          <span className="control-value">
            {audio.carrierMode === 'auto' 
              ? `${Math.round(calculateAutoCarrier(audio.lockedToFlicker ? flickerHz : audio.beatFreq))} Hz (Auto)`
              : `${audio.carrierFreq} Hz`
            }
          </span>
        </div>
        <input
          type="range"
          className="slider"
          min={100}
          max={800}
          step={10}
          value={audio.carrierFreq}
          onChange={(e) => setAudio({ carrierFreq: parseInt(e.target.value, 10) })}
          disabled={audio.carrierMode === 'auto'}
        />
        {audio.carrierMode === 'auto' && (
          <p className="control-note">
            Carrier is automatically calculated. Switch to Manual to override.
          </p>
        )}
      </div>

      {/* Beat Frequency */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Beat Frequency</label>
          <span className="control-value">
            {audio.beatFreq} Hz
            {audio.lockedToFlicker && ' 🔒'}
          </span>
        </div>
        <input
          type="range"
          className="slider"
          min={1}
          max={60}
          step={0.5}
          value={audio.beatFreq}
          onChange={(e) => handleBeatFreqChange(parseFloat(e.target.value))}
          disabled={audio.lockedToFlicker}
        />
        <button
          className={`btn btn-secondary ${audio.lockedToFlicker ? 'active' : ''}`}
          onClick={handleLockToggle}
        >
          {audio.lockedToFlicker ? '🔒 Locked to Flicker' : '🔓 Lock to Flicker Hz'}
        </button>
      </div>

      {/* Waveform */}
      <div className="control-group">
        <label className="form-label">Waveform</label>
        <select
          className="form-select"
          value={audio.waveform}
          onChange={(e) => setAudio({ waveform: e.target.value as any })}
        >
          <option value="sine">Sine (smooth)</option>
          <option value="triangle">Triangle (mellow)</option>
          <option value="square">Square (harsh)</option>
          <option value="sawtooth">Sawtooth (buzzy)</option>
        </select>
      </div>

      {/* Ambient */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Ambient Noise</label>
          <button
            className={`toggle ${audio.ambientEnabled ? 'active' : ''}`}
            onClick={() => setAudio({ ambientEnabled: !audio.ambientEnabled })}
            aria-pressed={audio.ambientEnabled}
          >
            <span className="sr-only">{audio.ambientEnabled ? 'Disable' : 'Enable'} ambient</span>
          </button>
        </div>
        {audio.ambientEnabled && (
          <>
            <select
              className="form-select"
              value={audio.ambientType}
              onChange={(e) => setAudio({ ambientType: e.target.value as any })}
            >
              <option value="pink">Pink Noise</option>
              <option value="white">White Noise</option>
              <option value="brown">Brown Noise</option>
            </select>
            <div className="control-row" style={{ marginTop: '8px' }}>
              <label className="form-label">Ambient Volume</label>
              <span className="control-value">{audio.ambientVolume}%</span>
            </div>
            <input
              type="range"
              className="slider"
              min={0}
              max={100}
              value={audio.ambientVolume}
              onChange={(e) => setAudio({ ambientVolume: parseInt(e.target.value, 10) })}
            />
          </>
        )}
      </div>

      {/* Visual Noise */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Visual Noise (Performance)</label>
          <button
            className={`toggle ${audio.visualNoiseEnabled ? 'active' : ''}`}
            onClick={() => setAudio({ visualNoiseEnabled: !audio.visualNoiseEnabled })}
            aria-pressed={audio.visualNoiseEnabled}
          >
            <span className="sr-only">{audio.visualNoiseEnabled ? 'Disable' : 'Enable'} visual noise</span>
          </button>
        </div>
        {audio.visualNoiseEnabled && (
          <>
            <div className="control-row" style={{ marginTop: '8px' }}>
              <label className="form-label">Noise Level</label>
              <span className="control-value">
                {audio.visualNoiseLockedToAudio ? `${audio.ambientVolume}% 🔒` : `${audio.visualNoise}%`}
              </span>
            </div>
            <input
              type="range"
              className="slider"
              min={0}
              max={100}
              value={audio.visualNoiseLockedToAudio ? audio.ambientVolume : audio.visualNoise}
              onChange={(e) => setAudio({ 
                visualNoise: parseInt(e.target.value, 10),
                visualNoiseLockedToAudio: false 
              })}
              disabled={audio.visualNoiseLockedToAudio}
            />
            <button
              className={`btn btn-secondary ${audio.visualNoiseLockedToAudio ? 'active' : ''}`}
              onClick={() => setAudio({ visualNoiseLockedToAudio: !audio.visualNoiseLockedToAudio })}
            >
              {audio.visualNoiseLockedToAudio ? '🔒 Locked to Audio Noise' : '🔓 Unlock from Audio'}
            </button>
            <p className="control-note">
              Adds a static overlay on both ON and OFF frames. Lock to audio noise to sync visual/audio noise levels.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================
// Display Controls Sub-component
// ============================================
function DisplayControls() {
  const refreshRate = useAppStore((s) => s.refreshRate)
  const dojoWindow = useAppStore((s) => s.dojoWindow)
  const setRefreshRate = useAppStore((s) => s.setRefreshRate)
  const setDojoWindow = useAppStore((s) => s.setDojoWindow)

  const [youtubeInput, setYoutubeInput] = useState(dojoWindow.youtubeUrl)

  const handleLoadVideo = () => {
    setDojoWindow({ youtubeUrl: youtubeInput, visible: true })
  }

  return (
    <div className="control-section">
      {/* Refresh Rate */}
      <div className="control-group">
        <label className="form-label">Screen Refresh Rate</label>
        <select
          className="form-select"
          value={refreshRate}
          onChange={(e) => setRefreshRate(parseInt(e.target.value, 10))}
        >
          {COMMON_REFRESH_RATES.map(rate => (
            <option key={rate.hz} value={rate.hz}>
              {rate.label}
            </option>
          ))}
        </select>
        <p className="control-note">
          Select your display's refresh rate for accurate Hz snapping
        </p>
      </div>

      {/* Dojo Window */}
      <div className="control-group">
        <label className="form-label">Dojo Window</label>
        <div className="control-row">
          <button
            className={`toggle ${dojoWindow.visible ? 'active' : ''}`}
            onClick={() => setDojoWindow({ visible: !dojoWindow.visible })}
            aria-pressed={dojoWindow.visible}
          >
            <span className="sr-only">{dojoWindow.visible ? 'Hide' : 'Show'} dojo window</span>
          </button>
          <span>{dojoWindow.visible ? 'Visible' : 'Hidden'}</span>
        </div>
      </div>

      {/* YouTube URL */}
      <div className="control-group">
        <label className="form-label">YouTube Video</label>
        <input
          type="text"
          className="form-input"
          value={youtubeInput}
          onChange={(e) => setYoutubeInput(e.target.value)}
          placeholder="Paste YouTube URL..."
        />
        <button
          className="btn btn-primary"
          onClick={handleLoadVideo}
          style={{ marginTop: '8px' }}
        >
          Load Video
        </button>
      </div>

      {/* Webcam */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Webcam Mirror</label>
          <button
            className={`toggle ${dojoWindow.webcamEnabled ? 'active' : ''}`}
            onClick={() => setDojoWindow({ webcamEnabled: !dojoWindow.webcamEnabled })}
            aria-pressed={dojoWindow.webcamEnabled}
          >
            <span className="sr-only">{dojoWindow.webcamEnabled ? 'Disable' : 'Enable'} webcam</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Schedule Controls Sub-component
// ============================================
function ScheduleControls() {
  const schedule = useAppStore((s) => s.schedule)
  const loadSchedule = useAppStore((s) => s.loadSchedule)
  const setRandomMode = useAppStore((s) => s.setRandomMode)
  const randomizeSchedule = useAppStore((s) => s.randomizeSchedule)
  const setTrainerMode = useAppStore((s) => s.setTrainerMode)

  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const text = await file.text()
      loadSchedule(text)
    }
  }

  const handleExport = () => {
    const session = useAppStore.getState().exportSession()
    if (session) {
      const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `photic-prism-session-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="control-section">
      {/* Load Schedule */}
      <div className="control-group">
        <label className="form-label">Load Schedule</label>
        <input
          type="file"
          accept=".md,.txt"
          onChange={handleFileLoad}
          className="form-input"
        />
      </div>

      {/* Current Day */}
      <div className="control-group">
        <label className="form-label">Today: {schedule.currentDay}</label>
        {schedule.parsedSchedule.length > 0 && (
          <p className="control-note">
            {schedule.parsedSchedule.length} days loaded, {schedule.todayRoutine.length} activities today
          </p>
        )}
      </div>

      {/* Trainer Mode Toggle */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Trainer Mode</label>
          <button
            className={`toggle ${schedule.trainerMode ? 'active' : ''}`}
            onClick={() => setTrainerMode(!schedule.trainerMode)}
            aria-pressed={schedule.trainerMode}
            disabled={schedule.todayRoutine.length === 0}
          >
            <span className="sr-only">{schedule.trainerMode ? 'Disable' : 'Enable'} trainer mode</span>
          </button>
        </div>
        <p className="control-note">
          Auto-carousel through today's routine with automatic Hz/color transitions
        </p>
      </div>

      {/* Randomizer Mode */}
      <div className="control-group">
        <label className="form-label">Randomizer Mode</label>
        <div className="mode-buttons">
          <button
            className={`btn btn-secondary ${schedule.randomMode === 'blocked' ? 'active' : ''}`}
            onClick={() => setRandomMode('blocked')}
          >
            Blocked
          </button>
          <button
            className={`btn btn-secondary ${schedule.randomMode === 'random' ? 'active' : ''}`}
            onClick={() => setRandomMode('random')}
          >
            Random
          </button>
          <button
            className={`btn btn-secondary ${schedule.randomMode === 'progressive' ? 'active' : ''}`}
            onClick={() => setRandomMode('progressive')}
          >
            Progressive
          </button>
        </div>
        <button
          className="btn btn-primary"
          onClick={randomizeSchedule}
          style={{ marginTop: '8px' }}
          disabled={schedule.parsedSchedule.length === 0}
        >
          Generate Today's Plan
        </button>
      </div>

      {/* Export */}
      <div className="control-group">
        <label className="form-label">Session Export</label>
        <button className="btn btn-secondary" onClick={handleExport}>
          Export Session JSON
        </button>
      </div>

      {/* Routine Viewer - shows generated or current routine */}
      <RoutineViewer />
    </div>
  )
}

// ============================================
// EEG Controls Sub-component
// ============================================
function EEGControls() {
  const { eegReadings, setEEGGraphVisible, eegGraphVisible } = useAppStore()
  const eeg = useAppStore((s) => s.eeg)
  const setEEG = useAppStore((s) => s.setEEG)
  const neurofeedback = useAppStore((s) => s.neurofeedback)
  const neurofeedbackState = useAppStore((s) => s.neurofeedbackState)
  const setNeurofeedback = useAppStore((s) => s.setNeurofeedback)
  
  const [calibrationDuration, setCalibrationDuration] = useState(30)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      setError(null)
      
      const response = await fetch('http://localhost:5000/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'lsl' })
      })
      
      if (!response.ok) {
        throw new Error(`Connection failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      setEEG({ connected: true, device: data.device || 'Muse' })
      console.log('🧠 EEG Connected:', data.device)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed'
      setError(message)
      console.error('EEG connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    setEEG({ connected: false, device: null, calibrated: false, streaming: false })
    console.log('🧠 EEG Disconnected')
  }

  const handleCalibrate = async () => {
    try {
      setIsCalibrating(true)
      setError(null)
      
      const response = await fetch('http://localhost:5000/api/calibrate-baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: calibrationDuration })
      })
      
      if (!response.ok) {
        throw new Error(`Calibration failed: ${response.statusText}`)
      }
      
      console.log(`🧠 EEG Calibrating for ${calibrationDuration}s...`)
      
      // Wait for calibration duration
      await new Promise(resolve => setTimeout(resolve, calibrationDuration * 1000))
      
      setEEG({ calibrated: true })
      console.log(`🧠 EEG Calibrated`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Calibration failed'
      setError(message)
      setEEG({ calibrated: false })
      console.error('EEG calibration error:', err)
    } finally {
      setIsCalibrating(false)
    }
  }

  const handleStartStreaming = () => {
    setEEG({ streaming: true })
    setEEGGraphVisible(true) // Auto-show graph when streaming starts
    console.log('🧠 Started EEG streaming')
  }

  const handleStopStreaming = () => {
    setEEG({ streaming: false })
    console.log('🧠 Stopped EEG streaming')
  }

  const handleClearData = () => {
    useAppStore.setState({ eegReadings: [] })
    console.log('🧠 Cleared EEG data history')
  }

  return (
    <div className="control-section">
      {/* Connection Status */}
      <div className="control-group">
        <label className="form-label">Connection</label>
        <div className="control-row">
          <span className={eeg.connected ? 'status-connected' : 'status-disconnected'}>
            {eeg.connected ? `✓ Connected (${eeg.device})` : '✗ Disconnected'}
          </span>
        </div>
        
        {!eeg.connected ? (
          <button
            className="btn btn-primary"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect to Muse'}
          </button>
        ) : (
          <button
            className="btn btn-secondary"
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
        )}
        
        <p className="control-note">
          Make sure your Muse headset is paired and the EEG server is running at localhost:5000
        </p>
      </div>

      {/* Calibration */}
      <div className="control-group">
        <label className="form-label">Baseline Calibration</label>
        <div className="control-row">
          <span className={eeg.calibrated ? 'status-connected' : 'status-disconnected'}>
            {eeg.calibrated ? '✓ Calibrated' : '✗ Not Calibrated'}
          </span>
        </div>
        
        <div className="control-row" style={{ marginTop: '8px' }}>
          <label className="form-label">Duration (seconds)</label>
          <input
            type="number"
            className="form-input"
            min={10}
            max={120}
            value={calibrationDuration}
            onChange={(e) => setCalibrationDuration(parseInt(e.target.value, 10))}
            disabled={!eeg.connected || isCalibrating}
          />
        </div>
        
        <button
          className="btn btn-primary"
          onClick={handleCalibrate}
          disabled={!eeg.connected || isCalibrating}
          style={{ marginTop: '8px' }}
        >
          {isCalibrating ? `Calibrating... (${calibrationDuration}s)` : 'Start Calibration'}
        </button>
        
        <p className="control-note">
          Sit still with eyes closed during calibration
        </p>
      </div>

      {/* Streaming */}
      <div className="control-group">
        <label className="form-label">Real-Time Streaming</label>
        <div className="control-row">
          <button
            className={`toggle ${eeg.streaming ? 'active' : ''}`}
            onClick={eeg.streaming ? handleStopStreaming : handleStartStreaming}
            disabled={!eeg.connected || !eeg.calibrated}
            aria-pressed={eeg.streaming}
          >
            <span className="sr-only">{eeg.streaming ? 'Stop' : 'Start'} streaming</span>
          </button>
          <span>{eeg.streaming ? 'Streaming' : 'Stopped'}</span>
        </div>
        
        <p className="control-note" style={{ marginTop: '8px' }}>
          Streams normalized brainwave data to the graph
        </p>
      </div>

      {/* Graph Visibility */}
      <div className="control-group">
        <div className="control-row">
          <label className="form-label">Show Graph</label>
          <button
            className={`toggle ${eegGraphVisible ? 'active' : ''}`}
            onClick={() => setEEGGraphVisible(!eegGraphVisible)}
            aria-pressed={eegGraphVisible}
          >
            <span className="sr-only">{eegGraphVisible ? 'Hide' : 'Show'} graph</span>
          </button>
        </div>
        <p className="control-note">
          Graph appears in upper-left corner, fades on inactivity
        </p>
      </div>

      {/* Data Management */}
      <div className="control-group">
        <label className="form-label">Data</label>
        <div className="control-row">
          <span>{eegReadings.length} readings stored</span>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleClearData}
          disabled={eegReadings.length === 0}
        >
          Clear History
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="control-group">
          <div className="alert alert-danger">
            {error}
          </div>
        </div>
      )}

      {/* Current Values */}
      {eegReadings.length > 0 && (
        <div className="control-group">
          <label className="form-label">Latest Values (z-score)</label>
          <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {(() => {
              const latest = eegReadings[eegReadings.length - 1]
              return (
                <>
                  <div>Alpha: {latest.alpha.toFixed(3)}</div>
                  <div>Beta: {latest.beta.toFixed(3)}</div>
                  <div>Delta: {latest.delta.toFixed(3)}</div>
                  <div>Gamma: {latest.gamma.toFixed(3)}</div>
                  <div>Theta: {latest.theta.toFixed(3)}</div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Neurofeedback Section */}
      <div className="control-group" style={{ borderTop: '1px solid var(--bg-elevated)', paddingTop: '16px', marginTop: '16px' }}>
        <label className="form-label">🧠 Neurofeedback Training</label>
        <div className="control-row">
          <button
            className={`toggle ${neurofeedback.enabled ? 'active' : ''}`}
            onClick={() => setNeurofeedback({ enabled: !neurofeedback.enabled })}
            disabled={!eeg.streaming}
            aria-pressed={neurofeedback.enabled}
          >
            <span className="sr-only">{neurofeedback.enabled ? 'Disable' : 'Enable'} neurofeedback</span>
          </button>
          <span>{neurofeedback.enabled ? 'Active' : 'Inactive'}</span>
        </div>
        <p className="control-note">
          Automatically modulates brightness & volume based on target brainwave performance
        </p>
      </div>

      {neurofeedback.enabled && (
        <>
          {/* Coherence Score Display */}
          <div className="control-group">
            <label className="form-label">Coherence Score</label>
            <div style={{ 
              fontFamily: 'monospace', 
              fontSize: '20px', 
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '12px',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              color: neurofeedbackState.coherenceScore > 0 ? '#22c55e' : '#ef4444'
            }}>
              {neurofeedbackState.coherenceScore.toFixed(2)}
            </div>
            <p className="control-note">
              Target: {neurofeedbackState.targetBand.toUpperCase()} | 
              Positive = Good performance, Negative = Need improvement
            </p>
          </div>

          {/* Target Band Selection */}
          <div className="control-group">
            <label className="form-label">Target Brainwave Band</label>
            <select
              className="form-select"
              value={neurofeedback.targetBand}
              onChange={(e) => setNeurofeedback({ targetBand: e.target.value as any })}
            >
              <option value="auto">Auto (from flicker Hz)</option>
              <option value="delta">Delta (0.5-4 Hz) - Deep sleep</option>
              <option value="theta">Theta (4-8 Hz) - Meditation</option>
              <option value="alpha">Alpha (8-13 Hz) - Relaxation</option>
              <option value="beta">Beta (13-30 Hz) - Focus</option>
              <option value="gamma">Gamma (30+ Hz) - Peak awareness</option>
            </select>
          </div>

          {/* Sensitivity */}
          <div className="control-group">
            <div className="control-row">
              <label className="form-label">Sensitivity</label>
              <span className="control-value">{neurofeedback.sensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              className="slider"
              min={0.5}
              max={2.0}
              step={0.1}
              value={neurofeedback.sensitivity}
              onChange={(e) => setNeurofeedback({ sensitivity: parseFloat(e.target.value) })}
            />
            <p className="control-note">
              Higher = more responsive to brain changes
            </p>
          </div>

          {/* Smoothing */}
          <div className="control-group">
            <div className="control-row">
              <label className="form-label">Smoothing</label>
              <span className="control-value">{Math.round(neurofeedback.smoothing * 100)}%</span>
            </div>
            <input
              type="range"
              className="slider"
              min={0.1}
              max={0.9}
              step={0.05}
              value={neurofeedback.smoothing}
              onChange={(e) => setNeurofeedback({ smoothing: parseFloat(e.target.value) })}
            />
            <p className="control-note">
              Higher = smoother changes, more stable
            </p>
          </div>

          {/* Modulation Depths */}
          <div className="control-group">
            <label className="form-label">Modulation Depths</label>
            
            <div style={{ marginTop: '8px' }}>
              <div className="control-row">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Brightness</label>
                <span className="control-value">±{neurofeedback.modulationDepth.brightness}%</span>
              </div>
              <input
                type="range"
                className="slider"
                min={0}
                max={50}
                step={5}
                value={neurofeedback.modulationDepth.brightness}
                onChange={(e) => setNeurofeedback({ 
                  modulationDepth: { ...neurofeedback.modulationDepth, brightness: parseInt(e.target.value) }
                })}
              />
            </div>

            <div style={{ marginTop: '8px' }}>
              <div className="control-row">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Beat Volume</label>
                <span className="control-value">±{neurofeedback.modulationDepth.beatVolume}%</span>
              </div>
              <input
                type="range"
                className="slider"
                min={0}
                max={50}
                step={5}
                value={neurofeedback.modulationDepth.beatVolume}
                onChange={(e) => setNeurofeedback({ 
                  modulationDepth: { ...neurofeedback.modulationDepth, beatVolume: parseInt(e.target.value) }
                })}
              />
            </div>

            <div style={{ marginTop: '8px' }}>
              <div className="control-row">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Noise Volume (inverse)</label>
                <span className="control-value">±{neurofeedback.modulationDepth.noiseVolume}%</span>
              </div>
              <input
                type="range"
                className="slider"
                min={0}
                max={50}
                step={5}
                value={neurofeedback.modulationDepth.noiseVolume}
                onChange={(e) => setNeurofeedback({ 
                  modulationDepth: { ...neurofeedback.modulationDepth, noiseVolume: parseInt(e.target.value) }
                })}
              />
            </div>
            
            <p className="control-note" style={{ marginTop: '8px' }}>
              How much brightness/volume changes based on performance
            </p>
          </div>

          {/* Current Modulation Values */}
          <div className="control-group">
            <label className="form-label">Current Output</label>
            <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              <div>Brightness: {neurofeedbackState.brightnessModulation.toFixed(0)}%</div>
              <div>Beat Volume: {neurofeedbackState.beatVolumeModulation.toFixed(0)}%</div>
              <div>Noise Volume: {neurofeedbackState.noiseVolumeModulation.toFixed(0)}%</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
