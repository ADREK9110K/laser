# LASER SCIENCE & TECHNOLOGY – VIRTUAL INTERACTIVE LABORATORY
## A Complete Digital Laboratory for the College of Laser Science and Technology – University of Technology, Iraq
### المختبر الافتراضي التفاعلي المتقدم لعلوم وتكنولوجيا الليزر – الجامعة التكنولوجية، العراق

---

## 1. Project Overview

The **Laser Science & Technology Virtual Interactive Laboratory** is a comprehensive, university-grade scientific simulation platform designed and engineered specifically for the Department of Laser Science and Technology at the **University of Technology – Iraq** (الجامعة التكنولوجية - العراق).

It provides students, graduation-project candidates, Master's researchers, and PhD candidates with a digital laboratory environment where they can manipulate scientific optical equipment, trace laser beams, collect real-time experimental data, evaluate governing physical equations, and export official academic laboratory reports.

---

## 2. Platform Architecture

```
LASER SCIENCE & TECHNOLOGY/
├── index.html                 # Main platform single-page application entry point
├── start_lab.bat              # One-click Windows desktop launcher
├── README.md                  # Complete technical and scientific documentation
├── css/
│   ├── style.css              # Dark laboratory theme, typography, layout & components
│   └── responsive.css         # Mobile/tablet responsiveness & print stylesheet for reports
├── js/
│   ├── i18n/
│   │   └── translations.js    # Complete bilingual dictionary (English & Arabic with RTL)
│   ├── data/
│   │   ├── equipment-catalog.js  # 50+ optical instruments, lasers, detectors, mounts
│   │   └── experiments-catalog.js # Complete 100 experiments catalog (001 - 100)
│   ├── physics/
│   │   ├── optics-engine.js       # Snell's law, Fresnel, thin lens, prisms, fiber optics
│   │   ├── wave-optics.js         # Interference, diffraction, Fabry-Pérot, Michelson, Airy
│   │   ├── polarization-engine.js # Malus's Law, Brewster, Jones matrices, Stokes, Biot
│   │   ├── laser-engine.js        # Gaussian beam w(z), zR, resonators g1*g2, Q-switch, FEL
│   │   ├── advanced-physics.js    # SHG, phase matching, Beer-Lambert, ablation, OCT, PLD
│   │   └── safety-engine.js       # ANSI Z136.1 / IEC 60825: MPE, NOHD, OD, Classification
│   └── components/
│       ├── interactive-bench.js   # 2D/3D Optical breadboard with multi-path ray tracing
│       ├── graph-renderer.js      # Canvas scientific chart engine with cursor inspection & CSV
│       ├── quiz-system.js         # Stage 4 conceptual verification & progress tracking
│       └── report-generator.js    # Official University of Technology – Iraq lab report generator
```

---

## 3. The 100 Interactive Experiments Catalog

The laboratory encompasses all 100 experiments across 9 core scientific disciplines:

### Category 1: Fundamental Optics (001–015)
- **001**: Law of Reflection ($\theta_i = \theta_r$)
- **002**: Law of Refraction (Snell's Law $n_1 \sin\theta_1 = n_2 \sin\theta_2$)
- **003**: Total Internal Reflection (TIR & Evanescent Wave)
- **004**: Critical Angle Measurement ($\theta_c = \arcsin(n_2/n_1)$)
- **005**: Plane Mirror Imaging ($d_i = -d_o, M = +1$)
- **006**: Concave Mirror Imaging ($1/f = 1/d_o + 1/d_i$)
- **007**: Convex Mirror Imaging
- **008**: Thin Lens Equation & Conjugates ($1/f = 1/d_o + 1/d_i, M = -d_i/d_o$)
- **009**: Convex Lens Imaging & Spherical Aberration
- **010**: Concave Lens Divergence & Virtual Focus
- **011**: Optical Prism Dispersion & Cauchy Model ($n(\lambda) = A + B/\lambda^2$)
- **012**: Refractive Index Measurement by Apparent Depth
- **013**: Numerical Aperture of Optical Systems ($\text{NA} = \sqrt{n_{core}^2 - n_{clad}^2}$)
- **014**: Optical Fiber Light Guidance (TIR Ray Bounces)
- **015**: Fiber Macro & Micro-Bending Loss ($\text{Loss(dB)} = 10\log_{10}(P_{in}/P_{out})$)

### Category 2: Wave Optics and Interference (016–030)
- **016**: Young's Double-Slit Experiment ($\Delta y = \lambda L / d$)
- **017**: Single-Slit Fraunhofer Diffraction ($I(\theta) = I_0 \text{sinc}^2(\pi a \sin\theta/\lambda)$)
- **018**: Multiple-Slit Diffraction ($N$-Slits $[\sin(N\gamma)/\sin\gamma]^2$)
- **019**: Diffraction Grating ($d\sin\theta = m\lambda, \mathcal{R} = mN$)
- **020**: Fresnel Near-Field Diffraction & Poisson-Arago Spot ($N_F = a^2/(\lambda z)$)
- **021**: Fraunhofer Far-Field Diffraction & Airy Disk ($\theta = 1.22 \lambda / D$)
- **022**: Michelson Interferometer Metrology ($\Delta d = N(\lambda/2)$)
- **023**: Mach-Zehnder Interferometer & Gas Refractometry ($\Delta n = N\lambda / L_{cell}$)
- **024**: Fabry-Pérot Interferometer & Cavity Finesse ($\mathcal{F} = \pi\sqrt{R}/(1-R)$)
- **025**: Newton's Rings & Radius of Curvature ($r_m = \sqrt{m\lambda R}$)
- **026**: Thin Film Interference & Anti-Reflection Coating ($d = \lambda_0/(4n)$)
- **027**: Wedge-Shaped Film Interference ($t_{wire} = \lambda L / (2\beta)$)
- **028**: Optical Coherence & Fringe Visibility ($V = (I_{max}-I_{min})/(I_{max}+I_{min})$)
- **029**: Spatial Coherence & Van Cittert-Zernike Theorem ($d_c = 1.22 \lambda R / D_{source}$)
- **030**: Temporal Coherence & Spectral Linewidth ($L_c = \lambda_0^2 / \Delta\lambda$)

### Category 3: Polarization and Electromagnetic Optics (031–040)
- **031**: Linear Polarization & Extinction Ratio
- **032**: Malus's Law ($I(\theta) = I_0 \cos^2\theta$)
- **033**: Brewster's Angle ($\tan\theta_B = n_2/n_1, R_p = 0$)
- **034**: Circular Polarization & Quarter-Wave Retardation ($\mathbf{J} = \frac{1}{\sqrt{2}}\begin{pmatrix}1 \\ \pm i\end{pmatrix}$)
- **035**: Elliptical Polarization & Stokes Parameters ($S_0, S_1, S_2, S_3$)
- **036**: Quarter-Wave Plate ($\lambda/4$) Characterization
- **037**: Half-Wave Plate ($\lambda/2$) & Polarization Rotation ($\theta_{out} = 2\theta_{plate}$)
- **038**: Optical Activity & Biot's Law in Chiral Media ($\alpha = [\alpha]\cdot c \cdot l$)
- **039**: Optical Birefringence in Calcite ($n_o$ and $n_e(\theta)$ double refraction)
- **040**: Polarization Interferometry & Photoelastic Stress Analysis

### Category 4: Laser Physics and Laser Systems (041–055)
- **041**: Spontaneous Emission & Radiative Lifetime ($N_2(t) = N_2(0)e^{-t/\tau}$)
- **042**: Stimulated Emission & Coherent Amplification ($I(z) = I(0)e^{\gamma z}$)
- **043**: Absorption & Emission Balance in Atomic Systems
- **044**: Population Inversion & Rate Equation Dynamics ($\Delta N = N_2 - N_1 > 0$)
- **045**: Einstein Coefficients $A$ and $B$ Relationship ($A_{21} = \frac{8\pi h\nu^3}{c^3}B_{21}$)
- **046**: Three-Level Laser System (Ruby Laser Model $N_2 > N_{total}/2$)
- **047**: Four-Level Laser System (Nd:YAG Model)
- **048**: Optical Pumping & Slope Efficiency ($P_{out} = \eta_{slope}(P_{pump} - P_{th})$)
- **049**: Laser Threshold Condition ($\gamma_{th} = \alpha_s + \frac{1}{2L}\ln(1/(R_1 R_2))$)
- **050**: Optical Resonator Stability ($0 \le g_1 g_2 \le 1$)
- **051**: Gaussian Beam Propagation ($w(z) = w_0\sqrt{1 + (z/z_R)^2}, z_R = \pi w_0^2/\lambda$)
- **052**: Beam Divergence & $M^2$ Beam Quality Factor ($\theta = M^2 \lambda / (\pi w_0)$)
- **053**: Transverse Resonator Modes ($\text{TEM}_{00}, \text{TEM}_{01}, \text{TEM}_{10}, \text{TEM}_{11}$)
- **054**: Q-Switching & Giant Pulse Generation ($P_{peak} \approx \Delta N h\nu / (2\tau_c) \ln(1/R)$)
- **055**: Mode Locking & Ultrafast Pulses ($\Delta t \cdot \Delta\nu \ge 0.441$)

### Category 5: Advanced Laser Technology (056–065)
- **056**: Nd:YAG Laser Operation (1064 nm / 532 nm SHG)
- **057**: He-Ne Laser Construction & Gas Discharge Resonant Energy Transfer
- **058**: $\text{CO}_2$ Laser Molecular Vibrational Transitions (10.6 $\mu$m)
- **059**: Excimer Laser Operation (UV 193/248 nm ArF / KrF)
- **060**: Semiconductor Laser Diode Characteristics ($P$-$I$ and $V$-$I$)
- **061**: Fiber Laser Architecture & Cladding Pumping
- **062**: Ti:Sapphire Ultrafast Laser & Kerr-Lens Mode Locking (KLM)
- **063**: Free Electron Laser (FEL) Principle ($\lambda_r = \frac{\lambda_u}{2\gamma^2}(1 + K^2/2)$)
- **064**: Femtosecond Pulse Generation & Dispersion Compensation
- **065**: Chirped Pulse Amplification (CPA)

### Category 6: Nonlinear Optics (066–075)
- **066**: Second Harmonic Generation (SHG) & Phase Matching ($\eta \propto \text{sinc}^2(\Delta k L/2)$)
- **067**: Third Harmonic Generation (THG 1064 $\to$ 355 nm)
- **068**: Sum Frequency Generation (SFG: $\omega_3 = \omega_1 + \omega_2$)
- **069**: Difference Frequency Generation (DFG: $\omega_3 = \omega_1 - \omega_2$)
- **070**: Optical Parametric Amplification (OPA)
- **071**: Optical Parametric Oscillation (OPO)
- **072**: Optical Kerr Effect ($n(I) = n_0 + n_2 I$)
- **073**: Self-Phase Modulation (SPM) & Spectral Broadening
- **074**: Four-Wave Mixing (FWM) in Photonic Fibers
- **075**: Self-Focusing & Optical Filamentation ($P_{cr} = 3.77 \lambda^2 / (8\pi n_0 n_2)$)

### Category 7: Spectroscopy and Photonics (076–085)
- **076**: Absorption Spectroscopy & Beer-Lambert Law ($A = \epsilon \cdot c \cdot L$)
- **077**: Atomic Emission Spectroscopy & Balmer Series
- **078**: Fluorescence Spectroscopy & Stokes Shift
- **079**: Raman Spectroscopy & Vibrational Fingerprinting
- **080**: Fourier Transform Infrared Spectroscopy (FTIR)
- **081**: UV-Visible Spectroscopy & Optical Bandgap (Tauc Plot)
- **082**: Laser-Induced Breakdown Spectroscopy (LIBS) & Boltzmann Plot
- **083**: Optical Fiber Communication & Eye Diagram
- **084**: Wavelength Division Multiplexing (WDM)
- **085**: Fiber Bragg Grating (FBG) Strain & Temperature Sensing ($\lambda_B = 2 n_{eff} \Lambda$)

### Category 8: Laser-Matter Interaction and Material Processing (086–093)
- **086**: Laser Ablation & Fluence Threshold ($d = \delta_{eff} \ln(F / F_{th})$)
- **087**: Laser-Induced Plasma Formation & Dynamics
- **088**: Laser-Material Heating & Thermal Diffusion ($L_{th} = 2\sqrt{D t}$)
- **089**: Laser Welding: Conduction vs Keyhole Mode
- **090**: Laser Cutting & Assist Gas Dynamics
- **091**: Laser Surface Modification & Shock Peening
- **092**: Pulsed Laser Deposition (PLD) Thin-Film Synthesis
- **093**: Pulsed Laser Deposition in Liquid (PLD in Liquid / LAL)

### Category 9: Biomedical Laser Applications (094–100)
- **094**: Laser-Tissue Interaction & Penetration Depth ($\delta = 1/\sqrt{3\mu_a(\mu_a + \mu_s')}$)
- **095**: Photothermal Effect & Arrhenius Coagulation Integral
- **096**: Photochemical Laser Interaction (Photodynamic Therapy - PDT)
- **097**: Laser Ablation of Biological Tissue (Er:YAG 2.94 $\mu$m vs $\text{CO}_2$)
- **098**: Fractional Laser Skin Resurfacing (Microscopic Treatment Zones MTZ)
- **099**: Ophthalmic Q-Switched Nd:YAG Laser Simulation (Capsulotomy)
- **100**: Optical Coherence Tomography (OCT) ($\Delta z = \frac{2\ln 2}{\pi}\frac{\lambda_0^2}{\Delta\lambda}$)

---

## 4. Key Interactive Capabilities

1. **Bilingual Support (English & Arabic RTL)**: Switch between English and Arabic instantaneously without reloading or resetting experiment states.
2. **Interactive Optical Breadboard**: Drag components, rotate kinematic mounts, and observe live multi-bounce laser ray-tracing with reflection, refraction, and 50:50 beam splitting.
3. **Dynamic Equation Panel**: Shows formulas with live parameter value substitution and SI unit validation.
4. **Interactive Scientific Graphing**: Canvas chart with gridlines, multiple dataset comparisons, hover cursor crosshairs, and one-click CSV export.
5. **4-Stage Learning Cycle**:
   - Stage 1: Learn & Principles
   - Stage 2: Observe Phenomenon
   - Stage 3: Experiment & Tune Parameters
   - Stage 4: Analyze & Assessment Quiz
6. **Laser Safety Center**: Full ANSI Z136.1 and IEC 60825 calculations for MPE, NOHD, and eyewear Optical Density (OD) with Class 1 to Class 4 hazard classification.
7. **Laboratory Report Generator**: Formats official lab reports bearing the header of the University of Technology – Iraq with verified simulation tables, discussion prompts, and print/PDF support.

---

## 5. Deployment Instructions

### Local Desktop Launch
- Double-click `start_lab.bat` or open `index.html` directly in any web browser (Chrome, Edge, Firefox, Safari). No external dependencies, Node.js installation, or Python server is required for end students.

### University Web Server Hosting
To deploy under the official university domain (e.g. `uotechnology.edu.iq/laser-laboratory/`):
1. Copy the entire folder contents to the target web server directory (Apache, Nginx, IIS, etc.).
2. Ensure MIME types for `.js`, `.css`, and `.html` are properly served.
3. The platform uses pure relative paths and zero paid API dependencies, allowing full offline and intranet operation.
