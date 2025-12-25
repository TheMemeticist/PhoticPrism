# Soundscape Engine Documentation

## Overview

The Photic Prism soundscape engine is a professional-grade procedural audio system that generates realistic environmental soundscapes using stochastic event modeling, Web Audio API scheduling, and neurofeedback integration.

## Architecture

### Core Components

1. **SoundAssetLoader** (`src/utils/soundAssetLoader.ts`)
   - Manifest-driven asset management
   - Automatic buffer caching and preloading
   - Weighted random variant selection
   - Cooldown tracking to prevent repetition

2. **SoundscapeScheduler** (`src/utils/soundscapeScheduler.ts`)
   - Poisson process event generation
   - AudioContext-based lookahead scheduling (100ms window, 25ms tick rate)
   - Per-class stochastic timing with exponential inter-arrival distribution
   - Formula: `Δt = -ln(U) / λ` where `λ = BPM / 60`

3. **SoundFXProcessor** (`src/utils/soundFXProcessor.ts`)
   - Complete Web Audio FX chain per sound:
     - Gain (with jitter)
     - Stereo panning (with LFO oscillation)
     - Low-pass filter (distance illusion)
     - Reverb send (algorithmic multi-delay reverb)
     - Echo send (delay + feedback)
   - Neurofeedback modulation of pan, gain, filter, and reverb
   - Distance mapping: On-target = closer/crisper, Off-target = farther/duller

4. **useSoundscapeEngine** (`src/hooks/useSoundscapeEngine.ts`)
   - React hook orchestrating all components
   - Automatic initialization and cleanup
   - Lazy loading: only loads assets for enabled classes
   - Pause/resume handling

## Sound Library

**193 total variants** across 7 classes:

| Class | Count | Default BPM | Reinforcement Mode |
|-------|-------|-------------|-------------------|
| Ambience | 10 | 0.5 | Neutral |
| Birds | 49 | 2.0 | Positive |
| Foley | 34 | 3.0 | Neutral |
| Insects | 10 | 1.0 | Neutral |
| Mammals | 40 | 0.3 | Positive |
| Water | 20 | 1.5 | Neutral |
| Weather | 30 | 1.0 | Negative |

### Sound Manifest

Located at `/sounds/sounds.manifest.json`, auto-generated from existing audio files.

Each variant includes:
- **baseGain**: Base volume (0-1)
- **gainJitter**: Random volume variation (±)
- **pitchJitter**: Playback rate range [min, max]
- **panPolicy**: `center | random | biased-left | biased-right`
- **reverbSend**: Dry/wet mix for reverb (0-1)
- **cooldown**: Minimum seconds before variant can repeat

## Usage

### Programmatic Control

```typescript
import { useAppStore } from './store/appStore'

// Enable soundscape
useAppStore.getState().setSoundscape({ enabled: true })

// Set master volume (0-100)
useAppStore.getState().setSoundscape({ masterVolume: 75 })

// Enable a sound class
useAppStore.getState().setSoundscapeClass('birds', { enabled: true })

// Adjust BPM (0.01-60 events/minute)
useAppStore.getState().setSoundscapeClass('birds', { bpm: 5 })

// Set reinforcement mode
useAppStore.getState().setSoundscapeClass('birds', { 
  reinforcementMode: 'positive' // 'positive' | 'negative' | 'neutral'
})

// Configure gaps (seconds)
useAppStore.getState().setSoundscapeClass('birds', { 
  minGap: 3,  // Minimum time between events
  maxGap: 60  // Maximum time between events
})
```

### Neurofeedback Integration

```typescript
// Enable NF-driven spatial modulation
useAppStore.getState().setSoundscape({
  neurofeedbackPolicy: {
    enabled: true,
    spatialBias: true,        // Pan oscillation based on coherence
    distanceMapping: true,     // Distance illusion based on coherence
    positiveClasses: ['birds', 'mammals'],  // Get closer on-target
    negativeClasses: ['weather'],           // Get harsher on-target
    lfoFrequency: 0.1,        // Pan oscillation rate (Hz)
    lfoBias: 0.5              // NF influence on pan center
  }
})
```

## Reinforcement Modes

### Positive Reinforcement
- On-target (high coherence) → Sound gets **closer, crisper, dryer**
- Off-target (low coherence) → Sound gets **farther, duller, wetter**
- Use for pleasant/reward sounds (birds, mammals)

### Negative Reinforcement  
- On-target → Sound gets **farther, duller, wetter** (aversive)
- Off-target → Sound gets **closer, crisper** (relief)
- Use for unpleasant/punishment sounds (harsh weather)

### Neutral
- No neurofeedback modulation
- Constant distance and processing

## Distance Illusion Parameters

When `neurofeedbackPolicy.distanceMapping` is enabled:

```
distance ∈ [0, 1] where 0 = close, 1 = far

Gain attenuation:  gain *= (1 - distance * 0.7)
LPF cutoff:        20000Hz - (distance * 18000Hz)  // 2kHz to 20kHz
Reverb wet:        distance * 0.6                    // 0 to 60%
```

## Technical Details

### Scheduling Precision

- **Lookahead**: 100ms into the future
- **Tick rate**: 25ms (40 Hz check rate)
- **Timing source**: `AudioContext.currentTime` (sample-accurate)
- **Jitter**: <1ms typical, immune to UI thread jank

### Performance

- **Memory usage**: ~2-5 MB per loaded class (depends on variant count)
- **CPU**: Negligible (event-driven, not continuous DSP)
- **Active sounds**: Typically 3-10 concurrent (auto-cleanup on end)

### BPM vs Sample Overlap

At 60 BPM with 5-second samples:
- Event rate: 1 event/second
- Sample duration: 5 seconds
- Result: 5 overlapping instances in steady state

This is **intentional** - creates natural density and texture.

## File Generation

To regenerate the manifest after adding new sounds:

```bash
node scripts/generateSoundManifest.cjs
```

This scans `src/assets/sounds/` and reads metadata from `*_meta.json` files.

## Future Enhancements

### UI Integration
- [ ] Add "Soundscape" popup panel to ControlPanel
- [ ] Per-class enable/disable toggles
- [ ] BPM sliders (0.01-60 with log scale)
- [ ] Reinforcement mode selectors
- [ ] Master volume control
- [ ] Active sound count indicator
- [ ] Cache stats display

### Advanced Features
- [ ] Impulse Response reverb (ConvolverNode with IR files)
- [ ] Spatial panning with PannerNode (3D audio)
- [ ] Time-of-day adaptive BPM (dawn chorus, night sounds)
- [ ] Weather-reactive class activation
- [ ] MIDI controller integration for live tweaking
- [ ] Session recording (export soundscape state timeline)

## Troubleshooting

### "Soundscape not playing"
1. Check `soundscape.enabled` is true
2. Check at least one class is enabled
3. Check not paused (`pause.isPaused` is false)
4. Open console for initialization errors

### "Sounds repeating too quickly"
- Increase `minGap` for the class
- Reduce `bpm`
- Check `cooldown` values in manifest

### "No variety in sounds"
- Each variant has a `weight` - check manifest
- Cooldown system prevents immediate repeats
- Ensure multiple variants exist for the class

### "High memory usage"
- Only enabled classes are loaded
- Cache clears on unmount
- Check `assetLoader.getCacheStats()` for size

## API Reference

### Store Actions

```typescript
setSoundscape(config: Partial<SoundscapeConfig>): void
setSoundscapeClass(soundClass: SoundClass, config: Partial<SoundClassConfig>): void
```

### Hook Return Value

```typescript
{
  isInitialized: boolean
  preloadClass: (soundClass: SoundClass) => Promise<void>
  setClassBPM: (soundClass: SoundClass, bpm: number) => void
  toggleClass: (soundClass: SoundClass) => void
  updateNFPolicy: (policy: Partial<NeurofeedbackSoundPolicy>) => void
  getStats: () => { 
    activeSounds: number
    cacheStats: { cached: number, total: number, sizeEstimate: string }
  }
}
```

## Examples

### Basic Birdsong Atmosphere
```typescript
useAppStore.getState().setSoundscape({ enabled: true, masterVolume: 40 })
useAppStore.getState().setSoundscapeClass('birds', { enabled: true, bpm: 3 })
```

### Intense Storm (Negative Reinforcement)
```typescript
useAppStore.getState().setSoundscapeClass('weather', { 
  enabled: true, 
  bpm: 8, 
  reinforcementMode: 'negative' 
})
useAppStore.getState().setSoundscape({ 
  neurofeedbackPolicy: { enabled: true, negativeClasses: ['weather'] }
})
```

### Calm Forest Walk
```typescript
const classes = ['birds', 'foley', 'insects', 'water']
classes.forEach(c => {
  useAppStore.getState().setSoundscapeClass(c as any, { enabled: true })
})
```

---

**Built with ❤️ for immersive neurofeedback training.**
