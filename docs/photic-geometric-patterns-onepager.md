# Geometric Visual Patterns for Photic Flicker (SSVEP/Entrainment) — One‑Pager

This project uses **photic stimulation** (screen-based luminance/contrast modulation) to drive measurable EEG responses. The core phenomenon is the **steady‑state visually evoked potential (SSVEP)**: the brain produces an oscillatory response at the **stimulation frequency** (and harmonics). Spatial geometry doesn’t usually “set” the target frequency—**temporal modulation does**—but geometry can strongly influence **response strength (SNR)**, **comfort/fatigue**, and which **visual pathways** are emphasized.

**Best mental model:**  
**Frequency = “what” you tag** (8–12 Hz alpha, 40 Hz gamma, etc.)  
**Geometry = “how strongly and how comfortably” you can tag it** (contrast edges, spatial frequency, area, motion vs flicker).

---

## Pattern options and when to use them

### 1) Full‑field luminance flicker (baseline)
**What it is:** entire screen (or large region) toggles luminance (on/off) at frequency *f*.  
**Why used:** simplest, high-energy drive; good for early prototyping and “is the pipeline working?” checks.  
**Best for:** quick calibration; low frequencies where perceived flicker is acceptable.  
**Tradeoffs:** can be harsh/fatiguing; higher risk for sensitive users.  
**Refs:** Norcia et al. review of steady‑state paradigms ([JOV/PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4581566/)).

---

### 2) Pattern‑reversal checkerboards (clinical “workhorse”)
**What it is:** a checkerboard that **reverses contrast** (black↔white) at frequency *f* (often with stable mean luminance).  
**Why used:** produces robust pattern‑driven responses; standard in clinical VEPs; spatial tuning via check size.  
**Best for:** strong, reliable evoked responses; comparisons across sessions/users; “standardized” settings.  
**Good knobs:** check size (spatial frequency), contrast, stimulus field size, reversal waveform.  
**Refs:** ISCEV VEP Standard (pattern‑reversal checkerboards, check sizes) ([PDF](https://iscev.org/standards/pdfs/ISCEV-VEP-Standard-2016.pdf)); SSVEP paradigms overview ([Norcia/PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4581566/)).

---

### 3) Gratings + Gabor patches (tunable, research-friendly)
**What it is:** sinusoidal or square-wave gratings; **Gabor** = grating windowed by a Gaussian (localized patch).  
**Why used:** clean control over **orientation**, **spatial frequency**, and **stimulus size**; can be more comfortable than full-field flicker.  
**Best for:** experiments that need fine control; reducing glare while keeping strong SSVEP.  
**Good knobs:** spatial frequency (cycles/deg), orientation, contrast, size/eccentricity, phase.  
**Refs:** steady‑state stimulation paradigms and stimulus design principles ([Norcia/PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4581566/)).

---

### 4) Concentric rings / radial checkerboards (often “friendlier”)
**What it is:** ring-shaped or radial checkerboards that flicker or reverse at frequency *f*.  
**Why used:** strong edge content but with different spatial distribution; sometimes reported as less aversive.  
**Best for:** longer sessions; when users report discomfort with classic checkerboards.  
**Refs:** ring-shaped checkerboard SSMVEP work (colored equal-luminance rings) ([PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0169642)).

---

### 5) Motion-based steady-state stimuli (SSMVEP / “less flickery” mode)
**What it is:** periodic **motion** (e.g., expansion/contraction, rotation, oscillation) at frequency *f* instead of large luminance flicker.  
**Why used:** aims to preserve a steady-state EEG tag with **reduced perceived flicker**, potentially improving comfort.  
**Best for:** users sensitive to flicker; sessions where fatigue is the limiting factor.  
**Implementation note:** display **refresh rate** and motion rendering quality can materially affect response strength.  
**Refs:** SSMVEP paradigms and examples ([PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0169642)); refresh-rate effects on motion VEPs ([Frontiers in Neuroscience](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2021.757679/full)).

---

### 6) “User-friendly” / sparse / QR‑code-like textures (fatigue reduction)
**What it is:** stimuli that preserve strong frequency tagging but alter spatial structure to reduce strain (e.g., QR‑like blocks).  
**Why used:** some SSVEP‑BCI work reports **reduced visual fatigue** while maintaining usability/accuracy.  
**Best for:** multi-minute runs; BCI-like multi-target interfaces; user comfort as a top constraint.  
**Refs:** QR-code stimulus pattern + fatigue discussion ([PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC8877481/)); overview of stimulus properties incl. QR-like patterns and fatigue notes ([MDPI 2024](https://www.mdpi.com/2414-4088/8/2/6)).

---

### 7) Fractal / complexity‑controlled backgrounds (state bias, not strict entrainment)
**What it is:** fractal imagery or complexity-controlled patterns displayed as a background layer (optionally combined with flicker in a region).  
**Why used:** not “frequency locking” per se, but some studies report systematic EEG differences when viewing specific fractal dimensions/complexities.  
**Best for:** aesthetic/comfort layers; “relaxing” visual context; exploratory modes.  
**Refs:** EEG response to viewing fractal patterns (alpha/beta effects reported) ([PubMed](https://pubmed.ncbi.nlm.nih.gov/19065853/)); complexity and alpha/beta associations ([NeuroImage](https://www.sciencedirect.com/science/article/pii/S1053811921003694)).

---

## Frequency targets: what’s realistic to expect
- **SSVEP / frequency tagging**: strongest, most direct mechanism—oscillatory EEG response at *f* and harmonics.  
  Ref: foundational review ([Norcia/PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4581566/)).
- **40 Hz “gamma flicker”**: widely studied as a way to evoke/entrain 40 Hz activity (often discussed under “GENUS”).  
  Refs: original gamma entrainment pathology paper (mouse) ([PubMed](https://pubmed.ncbi.nlm.nih.gov/27929004/)); 40 Hz multisensory stimulation paper ([Cell 2019](https://www.cell.com/cell/fulltext/S0092-8674%2819%2930163-1)); review of gamma sensory stimulation ([Frontiers 2022](https://www.frontiersin.org/journals/aging-neuroscience/articles/10.3389/fnagi.2022.1095081/full)).

**Important:** in most practical EEG setups, geometry mainly impacts **amplitude/SNR** and **tolerability**, not the fundamental entrainment frequency itself.

---

## Practical implementation knobs (high impact)
- **Temporal:** frequency (Hz), waveform (square/sine), duty cycle, phase offsets, amplitude/contrast.  
  Duty cycle can matter for comfort and evoked responses ([IET paper](https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/joe.2016.0314)).
- **Spatial:** stimulus area (deg²), spatial frequency (check size / cycles-per-degree), orientation, eccentricity (central vs peripheral).
- **Display constraints:** ensure the stimulus is synchronized to refresh (avoid jitter/aliasing); consider high refresh-rate modes especially for motion paradigms ([Frontiers 2022](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2021.757679/full)).

---

## Safety / risk controls (must-have)
Even if your app is intended for controlled photic stimulation, flashing content can trigger seizures or migraine in susceptible users.

- Follow WCAG’s flash guidance for general UI safety, and add **clear warnings + opt-in** for “stimulation modes.”  
  Ref: WCAG “Three flashes or below threshold” explanation ([W3C Understanding SC 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)).

**Recommended safeguards:** session time limits, gradual ramp-up/down, intensity caps, “comfort mode” (motion or sparse patterns), immediate stop hotkey.

---

## Suggested default pattern stack (pragmatic)
1) **Checkerboard pattern reversal** for calibration & strongest SSVEP.  
2) **Grating/Gabor** as a “tunable + softer” alternative.  
3) **Ring/radial** for comfort-focused sessions.  
4) **Motion mode** for flicker-sensitive users.  
5) Optional **fractal background** layer for aesthetics/exploration.

