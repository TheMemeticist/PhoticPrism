# Photic Prism — v0 Prototype

**A lightweight, offline-friendly (PWA-capable) browser "dojo cockpit" for synchronized photic flicker + generated binaural beats + movable training video + webcam mirror + EEG biofeedback.**

> ⚠️ **SAFETY / MEDICAL DISCLAIMER (READ FIRST):** Photic Prism is experimental software and is not a medical device. It is not intended to diagnose, treat, cure, or prevent any disease, and it is not reviewed or cleared by any regulator. The app can generate flicker/flashing stimuli and audio stimulation that may trigger seizures or other adverse effects in susceptible individuals. If you have epilepsy, a seizure disorder, unexplained fainting/seizure history, or migraine with strong light sensitivity, **do not use**. Use in a well-lit room, start with low intensity, and keep a one-tap **STOP** control. Use at your own risk; stop immediately if symptoms occur.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Recommended: High refresh rate monitor (120Hz+) for smoother high-frequency stimulation.

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd PhotoPrism

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will start at `http://localhost:5173`.

### Build for Production
```bash
npm run build
npm run preview
```

---

## 🏗️ Architecture (For Contributors)

Photic Prism is built on **React**, **TypeScript**, and **Zustand**, but the core flicker engine runs **outside** the React render cycle for performance.

### 1. The Flicker Loop (`FlickerCanvas.tsx`)
React state updates are too slow and unpredictable for frame-perfect photic stimulation.
- **Mechanism**: We use a `requestAnimationFrame` recursion loop that holds references (`useRef`) to mutable state.
- **Timing Strategies**:
  - **Perfect Mode**: When Target Hz is an exact divisor of Monitor Hz (e.g., 10Hz on 60Hz screen), we count frames. `Frame % 6 < 3 ? ON : OFF`. This is 100% stable.
  - **Approximate Mode**: For arbitrary frequencies (e.g., 14Hz on 60Hz), we accumulate time delta. This allows flexibility but introduces micro-jitter (aliasing).
- **Architecture**: `AppStore` -> `useRef` (in Canvas) -> `renderPattern()` (stateless pure functions).

### 2. State Management (`src/store/appStore.ts`)
We use **Zustand** with `persist` middleware.
- **Settings**: Hz, Colors, Audio configs are persisted to `localStorage`.
- **Session**: Active session data (start time, history) is ephemeral.
- **Neurofeedback**: Incoming EEG data is normalized and stored in short circular buffers (`eegReadings`) for graph rendering and reactive modulation.

### 3. Audio Engine (`src/hooks/useAudioEngine.ts`)
Built on **Tone.js**.
- **Signal Path**: `Left Osc` + `Right Osc` -> `Panner` -> `Lowpass Filter` -> `Master Gain`.
- **Binaural Beats**: Created by detuning the right oscillator by the target beat frequency (e.g., Left 200Hz, Right 210Hz = 10Hz Alpha beat).
- **Noise Layer**: Pink/White/Brown noise generator for masking, with optional neurofeedback volume modulation.

### 4. Soundscape Engine (`src/hooks/useSoundscapeEngine.ts`)
Built on **Web Audio API** (native).
- **Stochastic Scheduling**: Poisson process for natural event timing (0.01-60 BPM density per class).
- **193 Sound Variants**: 7 classes (birds, mammals, water, weather, insects, foley, ambience) with AI-generated stereo clips.
- **Spatial Audio**: Pan LFO, distance mapping (gain + LPF + reverb), algorithmic reverb, and echo.
- **Neurofeedback Integration**: On-target sounds get closer/crisper (positive reinforcement) or harsher (negative reinforcement).
- **See**: `docs/SOUNDSCAPE_ENGINE.md` for complete documentation.

---

## 🔬 Visual Capabilities

The system implements two distinct classes of visual stimulation:

### 1. Clinical Patterns (SSVEP & Driving)
Designed for maximum signal-to-noise ratio in EEG response ("Photic Driving").
- **Full Field**: Global luminance flicker (classic strobe).
- **Checkerboard**: Pattern-reversal standard (black/white invert). High contrast, robust VEP.
- **Grating (Sine/Square)**: Tunable spatial frequency and orientation.
- **Gabor Patch**: Gaussian-windowed grating (focal stimulation).
- **Concentric Rings**: Radial checkerboard pattern.
- **Motion Radial**: Expanding/Contracting rings (gentler than flicker).
- **Motion Rotation**: Rotating radial spokes.
- **Sparse**: QR-code-like random noise (reduces visual fatigue).

### 2. Generative Patterns (Entrainment & Meditation)
Designed for aesthetic engagement, relaxation, and "soft" entrainment via alpha-resonant geometry.
- **Sri Yantra**: Traditional sacred geometry, parametrically drawn.
- **Flower of Life**: Overlapping hexagonal circle lattice.
- **Julia Set**: Real-time fractal rendering (GL-style pixel manipulation).
- **Sacred Spiral**: Golden-ratio based logarithmic spirals.
- **Mandala**: Parametric rotating symmetry that "breathes" with time.

**Control Knobs:**
- **Contrast**: Modulation depth.
- **Spatial Frequency**: Detail density.
- **Complexity**: Fractal recursion depth / Geometric density.
- **Modulation**: Link brightness or complexity to real-time neurofeedback.

---

## 🧠 EEG & Neurofeedback Status

**Current Status: Frontend Implemented / Backend Required**

The frontend contains a full logic layer for:
- **LSL (Lab Streaming Layer)** connectivity state management.
- **Band Power Visualization**: Real-time graphing of Alpha, Beta, Theta, Delta, Gamma.
- **Modulation Logic**: Mapping `Alpha Power -> Fractal Complexity` or `Coherence -> Audio Volume`.

**⚠️ Missing Component**:
The frontend expects a REST API at `http://localhost:5000/api` to bridge the LSL stream (from `muselsl` or OpenBCI) to the browser. **This Python backend server is currently NOT included in this repository.**

To use EEG features today, you would need to implement a simple Python Flask/FastAPI server that:
1.  Connects to an LSL stream (`pylsl`).
2.  Windows and FFTs the data.
3.  Exposes `/api/normalized-bands` endpoints for the frontend to poll.

---

## 📚 Technical Rationale

### Why Geometry Matters?
While pure frequency (Hz) determines the *rate* of entrainment, geometry determines the *strength* (SNR) and *comfort*.
- **Fractals (D ~1.3)**: Research suggests natural fractal patterns require less cognitive load to process, promoting Alpha states (relaxation).
- **Checkerboards**: Create the strongest VEP (Visual Evoked Potential) response in the visual cortex due to hard edge contrast.
- **Motion**: For users sensitive to hard flicker, periodic motion (expansion/rotation) can induce SSVEP with reduced subjective strain.

### Why "Dojo Cockpit"?
The app includes a "Dojo Window" (YouTube embed + Webcam Mirror).
- **Concept**: Training often involves mimicking a reference (Video) while monitoring form (Mirror).
- **Integration**: By overlaying this bio-feedback and photic environment on top of the training context, we create a unified "Sensory Gym" for experimental practice design.

---

## 🛠️ Roadmap & Constraints

### Constraints
- **Refresh Rate Dependency**: 60Hz monitors cannot produce clean 40Hz flicker (aliasing). 120Hz/144Hz monitors are highly recommended for Gamma training.
- **Browser Timing**: `requestAnimationFrame` pauses when the tab is hidden (by design). Audio continues, but flicker stops.
- **Web Bluetooth**: Direct browser-to-Muse connection is unstable on many OS stacks; the architecture assumes an LSL bridge (hence the missing backend requirement).

### Future Capabilities
- [ ] **WebGPU**: Porting fractal patterns to Shaders for 4k 60fps performance (currently CPU canvas).
- [ ] **Microphone Input**: Audio-reactive visuals (for external music).
- [ ] **Schedule Editor**: UI for creating/ordering the Markdown schedules directly.

## 🙏 Acknowledgments
- **Tone.js** for the audio graph.
- **MuseLSL** for the protocol inspiration.
- **React-RND** for the window management.
