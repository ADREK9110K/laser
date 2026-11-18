/**
 * LASER SCIENCE & TECHNOLOGY — VIRTUAL INTERACTIVE LABORATORY
 * University of Technology – Iraq | College of Laser Science and Technology
 *
 * Main Application Orchestrator & Controller
 * Controls WorkspaceCanvas + RayTracer + I18n + Experiments Catalog (100 Experiments)
 * Pure ES6 — No build step required. Opens directly via file://
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   GLOBAL DRAG & DROP / ACCORDION HELPERS
═══════════════════════════════════════════════════════════════════════════ */
function dragStart(e) {
  const card = e.currentTarget;
  e.dataTransfer.setData('optical-type', card.dataset.type);
  e.dataTransfer.setData('optical-subtype', card.dataset.subtype);
  e.dataTransfer.effectAllowed = 'copy';
}

function clickAdd(e) {
  const card = e.currentTarget;
  if (window.app) {
    window.app.addComponentToCenter(card.dataset.type, card.dataset.subtype);
  }
}

function toggleAccordion(headerEl) {
  const section = headerEl.closest('.accordion-section');
  const body = section.querySelector('.accordion-body');
  const isOpen = section.classList.contains('open');
  section.classList.toggle('open', !isOpen);
  body.style.display = isOpen ? 'none' : '';
}

/* ═══════════════════════════════════════════════════════════════════════════
   LAB APP CLASS
═══════════════════════════════════════════════════════════════════════════ */
class LabApp {
  constructor() {
    this.wc = null;               // WorkspaceCanvas instance
    this.bench3D = null;          // ThreeOpticalBench 3D instance
    this.mode = '2d';             // '2d' or '3d'
    this.activeExp = null;        // Current experiment object from EXPERIMENTS_DATABASE
    this.isFreeMode = false;      // true = sandbox, false = experiment loaded
    this.selectedComp = null;     // Currently selected optical component

    // Undo/redo history stack
    this.history = [[]];
    this.histIdx = 0;

    // Simulation & Display Settings
    this.settings = {
      showGrid: true,
      snapToGrid: false,
      gridSpacing: 25,
      maxRayDepth: 8,
      showFocalPoints: true,
      showNormalLines: false,
      showAngles: false,
      laserRayDensity: 4,
      isDarkMode: true,
    };

    // FPS counter internals
    this._fpsFrames = 0;
    this._fpsLast = performance.now();
    this._darkMode = true;
  }

  /* ───────── INITIALIZATION ───────── */
  init() {
    // 1. Setup i18n — default to Arabic
    OpticalI18n.setLang('ar');
    this._applyI18n();

    // 2. Initialize WorkspaceCanvas on #lab-canvas
    const canvasEl = document.getElementById('lab-canvas');
    this.wc = new WorkspaceCanvas(canvasEl, {
      settings: this.settings,
      onSelectComponent: (comp) => this._onSelectComp(comp),
      onUpdateComponent: (comp) => this._onUpdateComp(comp),
      onUndoSave: () => this._saveHistory(),
      onPointerCoords: ({ x, y }) => this._updateCoords(x, y),
    });

    // 3. Canvas Drag and Drop target
    const wrapper = document.getElementById('canvas-wrapper');
    wrapper.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    wrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      this.wc.handleDrop(e);
      this._toggleDropHint();
    });

    // 4. Populate experiments modal and quick-select dropdown
    this._populateModal();
    this._populateQuickSelect();

    // 5. Bind UI and Keyboard event listeners
    this._bindEvents();

    // 6. Apply settings values to settings tab UI
    this._syncSettingsUI();

    // 7. Start real-time FPS counter
    this._startFPS();

    // 8. Immediately load Experiment 001 ready-built and active!
    this.loadExperiment('exp_001');

    console.log('✅ Laser Science & Technology Virtual Laboratory Ready.');
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPERIMENT LOADING & RUNNING
  ═══════════════════════════════════════════════════════════════ */
  loadExperiment(expId) {
    if (typeof EXPERIMENTS_DATABASE === 'undefined') return;
    const exp = EXPERIMENTS_DATABASE.find(e => e.id === expId);
    if (!exp) return;

    this.activeExp = exp;
    this.isFreeMode = false;

    // Deep-clone components so the original database presets remain immutable
    const comps = JSON.parse(JSON.stringify(exp.components || []));
    this.wc.setComponents(comps);
    this.wc.selectedComponent = null;

    // Auto-fit and center the entire optical breadboard and beam paths
    if (typeof this.wc.fitToView === 'function') {
      // Delay slightly so canvas layout dimensions are computed
      setTimeout(() => this.wc.fitToView(90), 20);
    }

    this._saveHistory();

    // Sync header dropdown value
    const quickSel = document.getElementById('quick-select');
    if (quickSel) quickSel.value = exp.id;

    // Render the dedicated Scientific Law & Equations Box (مربع قانون التجربة)
    this._renderLawBox(exp);

    // Update status bar & inspector theory
    const lang = OpticalI18n.getLang();
    const title = (lang === 'ar' && exp.titleAr) ? exp.titleAr : exp.title;
    this._updateStatusExp(`EXP-${exp.num}`, title);
    this._showSelectionPanel(null);
    this._renderTheory(exp);
    this._renderQuiz(exp);
    this._updateStatusCounts();

    // Auto-switch inspector to Theory tab on experiment load
    this._switchTab('theory');

    if (this.mode === '3d' && this.bench3D) {
      setTimeout(() => this.bench3D.syncFrom2D(this.wc.components, this.wc.rays), 50);
    }

    // Close library modal if open
    const modal = document.getElementById('exp-modal');
    if (modal) modal.style.display = 'none';

    // Update drop hint visibility
    this._toggleDropHint();
  }

  enterFreeMode() {
    this.activeExp = null;
    this.isFreeMode = true;
    this.wc.setComponents([]);
    this.wc.selectedComponent = null;
    this._saveHistory();

    // Hide the Law HUD Box in Free Sandbox Mode
    const lawBox = document.getElementById('experiment-law-box');
    if (lawBox) lawBox.classList.add('free-mode');

    // Reset dropdown
    const quickSel = document.getElementById('quick-select');
    if (quickSel) quickSel.value = '';

    const lang = OpticalI18n.getLang();
    const freeText = OpticalI18n.t('statusFreeMode');
    this._updateStatusExp('FREE', freeText);
    this._showSelectionPanel(null);
    this._renderTheory(null);
    this._renderQuiz(null);
    this._updateStatusCounts();
    this._toggleDropHint();

    if (this.mode === '3d' && this.bench3D) {
      this.bench3D.syncFrom2D([], []);
    }
  }

  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;

    const btn2D = document.getElementById('btn-mode-2d');
    const btn3D = document.getElementById('btn-mode-3d');
    const canvas2D = document.getElementById('lab-canvas');
    const container3D = document.getElementById('lab-3d-container');

    if (btn2D) btn2D.classList.toggle('active', mode === '2d');
    if (btn3D) btn3D.classList.toggle('active', mode === '3d');

    if (mode === '3d') {
      if (canvas2D) canvas2D.style.display = 'none';
      if (container3D) container3D.style.display = 'block';

      if (!this.bench3D && typeof ThreeOpticalBench !== 'undefined') {
        this.bench3D = new ThreeOpticalBench('lab-3d-container');
      }

      if (this.bench3D) {
        this.bench3D.resize();
        this.bench3D.syncFrom2D(this.wc.components, this.wc.rays);
      }
    } else {
      if (container3D) container3D.style.display = 'none';
      if (canvas2D) canvas2D.style.display = 'block';
      if (this.wc) {
        this.wc.render();
      }
    }
  }

  nextExperiment() {
    if (!EXPERIMENTS_DATABASE || EXPERIMENTS_DATABASE.length === 0) return;
    let idx = 0;
    if (this.activeExp) {
      idx = EXPERIMENTS_DATABASE.findIndex(e => e.id === this.activeExp.id);
      idx = (idx + 1) % EXPERIMENTS_DATABASE.length;
    }
    this.loadExperiment(EXPERIMENTS_DATABASE[idx].id);
  }

  prevExperiment() {
    if (!EXPERIMENTS_DATABASE || EXPERIMENTS_DATABASE.length === 0) return;
    let idx = EXPERIMENTS_DATABASE.length - 1;
    if (this.activeExp) {
      idx = EXPERIMENTS_DATABASE.findIndex(e => e.id === this.activeExp.id);
      idx = (idx - 1 + EXPERIMENTS_DATABASE.length) % EXPERIMENTS_DATABASE.length;
    }
    this.loadExperiment(EXPERIMENTS_DATABASE[idx].id);
  }

  /* ═══════════════════════════════════════════════════════════════
     SCIENTIFIC LAW & GOVERNING EQUATIONS HUD BOX (مربع قانون التجربة)
  ═══════════════════════════════════════════════════════════════ */
  _renderLawBox(exp) {
    const box = document.getElementById('experiment-law-box');
    if (!box) return;

    if (!exp || this.isFreeMode) {
      box.classList.add('free-mode');
      return;
    }
    box.classList.remove('free-mode');

    const lang = OpticalI18n.getLang();
    const title = (lang === 'ar' && exp.titleAr) ? exp.titleAr : exp.title;
    const catLabel = this._getCategoryName(exp.category);

    // Meta & Title
    const tagEl = document.getElementById('law-tag');
    const catEl = document.getElementById('law-cat-badge');
    const titleEl = document.getElementById('law-box-title');
    if (tagEl) tagEl.textContent = `EXP-${exp.num}`;
    if (catEl) catEl.textContent = catLabel;
    if (titleEl) titleEl.textContent = title;

    // Equations
    const eqFormulaEl = document.getElementById('law-eq-formula');
    const eqLabelEl = document.getElementById('law-eq-label');
    const eqDescEl = document.getElementById('law-eq-desc');

    if (exp.equations && exp.equations.length > 0) {
      const eq0 = exp.equations[0];
      if (eqFormulaEl) eqFormulaEl.innerHTML = this.renderMathFormula(eq0.latex);
      if (eqLabelEl) eqLabelEl.textContent = eq0.label || '';
      if (eqDescEl) eqDescEl.textContent = eq0.desc || '';
    } else {
      if (eqFormulaEl) eqFormulaEl.innerHTML = '–';
      if (eqLabelEl) eqLabelEl.textContent = '';
      if (eqDescEl) eqDescEl.textContent = '';
    }

    // Objective & Phenomenon
    const objEl = document.getElementById('law-objective');
    const phenEl = document.getElementById('law-phenomenon');
    if (objEl) objEl.textContent = exp.objective || '–';
    if (phenEl) phenEl.textContent = exp.phenomenon || '–';

    // Navigation indicator counter (e.g. تجربة 1 من 100)
    const indEl = document.getElementById('law-nav-indicator');
    if (indEl) {
      const idx = EXPERIMENTS_DATABASE.findIndex(e => e.id === exp.id);
      const currentNum = idx >= 0 ? idx + 1 : parseInt(exp.num, 10);
      indEl.textContent = lang === 'ar'
        ? `تجربة ${currentNum} من ${EXPERIMENTS_DATABASE.length}`
        : `Exp ${currentNum} of ${EXPERIMENTS_DATABASE.length}`;
    }
  }

  _getCategoryName(cat) {
    const lang = OpticalI18n.getLang();
    const mapAr = {
      'fundamental': 'بصريات أساسية',
      'wave': 'بصريات موجية وتداخل',
      'polarization': 'استقطاب وبصريات EM',
      'laser_physics': 'فيزياء الليزر والرنانات',
      'advanced_laser': 'تكنولوجيا الليزر المتقدمة',
      'nonlinear': 'بصريات لاخطية',
      'spectroscopy': 'مطيافية وفوتونيات',
      'materials': 'تفاعل الليزر والمادة',
      'biomedical': 'تطبيقات طبية وحيوية',
    };
    const mapEn = {
      'fundamental': 'Fundamental Optics',
      'wave': 'Wave Optics & Interference',
      'polarization': 'Polarization & EM Optics',
      'laser_physics': 'Laser Physics & Cavities',
      'advanced_laser': 'Advanced Laser Tech',
      'nonlinear': 'Nonlinear Optics',
      'spectroscopy': 'Spectroscopy & Photonics',
      'materials': 'Laser-Matter Interaction',
      'biomedical': 'Biomedical Applications',
    };
    const map = lang === 'ar' ? mapAr : mapEn;
    return map[cat] || (lang === 'ar' ? 'بصريات عامة' : 'General Optics');
  }

  /* ═══════════════════════════════════════════════════════════════
     MATHEMATICAL FORMULA TYPOGRAPHY (LaTeX to Beautiful HTML)
  ═══════════════════════════════════════════════════════════════ */
  renderMathFormula(latex) {
    if (!latex) return '';
    let s = String(latex).trim();

    // Fractions: \frac{num}{den}
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<span class="math-frac"><span class="math-num">$1</span><span class="math-den">$2</span></span>');
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<span class="math-frac"><span class="math-num">$1</span><span class="math-den">$2</span></span>');

    // Square roots: \sqrt{...}
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, '<span class="math-sqrt">√<span class="math-radicand">$1</span></span>');

    // Text: \text{...}
    s = s.replace(/\\text\{([^{}]+)\}/g, '<span class="math-text">$1</span>');

    // Greek letters
    const greek = {
      '\\theta': 'θ', '\\lambda': 'λ', '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ',
      '\\delta': 'δ', '\\Delta': 'Δ', '\\epsilon': 'ε', '\\eta': 'η', '\\mu': 'μ',
      '\\nu': 'ν', '\\pi': 'π', '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ',
      '\\phi': 'φ', '\\omega': 'ω', '\\Omega': 'Ω',
    };
    for (const [cmd, char] of Object.entries(greek)) {
      s = s.split(cmd).join(char);
    }

    // Mathematical functions & symbols
    s = s.replace(/\\sin/g, 'sin');
    s = s.replace(/\\cos/g, 'cos');
    s = s.replace(/\\tan/g, 'tan');
    s = s.replace(/\\arcsin/g, 'arcsin');
    s = s.replace(/\\arccos/g, 'arccos');
    s = s.replace(/\\arctan/g, 'arctan');
    s = s.replace(/\\ln/g, 'ln');
    s = s.replace(/\\log/g, 'log');
    s = s.replace(/\\cdot/g, ' · ');
    s = s.replace(/\\times/g, ' × ');
    s = s.replace(/\\pm/g, ' ± ');
    s = s.replace(/\\approx/g, ' ≈ ');
    s = s.replace(/\\le/g, ' ≤ ');
    s = s.replace(/\\ge/g, ' ≥ ');
    s = s.replace(/\\neq/g, ' ≠ ');
    s = s.replace(/\\infty/g, '∞');
    s = s.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
    s = s.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
    s = s.replace(/\\quad/g, ' &nbsp;&nbsp; ');

    // Subscripts: _{abc} or _a
    s = s.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
    s = s.replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>');

    // Superscripts: ^{abc} or ^2
    s = s.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
    s = s.replace(/\^([a-zA-Z0-9])/g, '<sup>$1</sup>');

    // Clean any remaining backslashes
    s = s.replace(/\\/g, '');

    return s;
  }

  /* ═══════════════════════════════════════════════════════════════
     COMPONENT CREATION
  ═══════════════════════════════════════════════════════════════ */
  addComponentToCenter(type, subType) {
    const rect = document.getElementById('lab-canvas').getBoundingClientRect();
    const cx = (rect.width / 2 - this.wc.pan.x) / this.wc.zoom;
    const cy = (rect.height / 2 - this.wc.pan.y) / this.wc.zoom;

    const comp = this.wc.createComponent(type, subType, { x: cx, y: cy });
    this.wc.components.push(comp);
    this.wc.setComponents(this.wc.components);
    this._saveHistory();
    this._updateStatusCounts();
    this._toggleDropHint();
  }

  /* ═══════════════════════════════════════════════════════════════
     CALLBACKS FROM WORKSPACE CANVAS
  ═══════════════════════════════════════════════════════════════ */
  _onSelectComp(comp) {
    this.selectedComp = comp;
    this._showSelectionPanel(comp);
    if (comp) {
      this._switchTab('properties');
    }

    if (comp && comp.type === 'detector') {
      this._updateDetectorReadout(comp);
    } else {
      const readout = document.getElementById('detector-readout');
      if (readout) readout.style.display = 'none';
    }
  }

  _onUpdateComp(comp) {
    this._updateStatusCounts();
    if (comp && comp.type === 'detector') {
      this._updateDetectorReadout(comp);
    }
    if (this.selectedComp && this.selectedComp.id === comp.id) {
      this.selectedComp = comp;
      this._buildPropertiesPanel(comp);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     UNDO / REDO
  ═══════════════════════════════════════════════════════════════ */
  _saveHistory() {
    this.history = this.history.slice(0, this.histIdx + 1);
    this.history.push(JSON.parse(JSON.stringify(this.wc.components)));
    this.histIdx = this.history.length - 1;
    if (this.history.length > 60) {
      this.history.shift();
      this.histIdx--;
    }
  }

  undo() {
    if (this.histIdx <= 0) return;
    this.histIdx--;
    this._restoreHistory();
  }

  redo() {
    if (this.histIdx >= this.history.length - 1) return;
    this.histIdx++;
    this._restoreHistory();
  }

  _restoreHistory() {
    const comps = JSON.parse(JSON.stringify(this.history[this.histIdx]));
    this.wc.setComponents(comps);
    this._showSelectionPanel(null);
    this._updateStatusCounts();
    this._toggleDropHint();
  }

  /* ═══════════════════════════════════════════════════════════════
     PROPERTIES INSPECTOR
  ═══════════════════════════════════════════════════════════════ */
  _showSelectionPanel(comp) {
    const noSel = document.getElementById('no-selection-msg');
    const panel = document.getElementById('properties-panel');

    if (!comp) {
      if (noSel) noSel.style.display = '';
      if (panel) panel.style.display = 'none';
      return;
    }

    if (noSel) noSel.style.display = 'none';
    if (panel) panel.style.display = '';

    const nameEl = document.getElementById('prop-comp-name');
    if (nameEl) nameEl.textContent = comp.name || comp.type;

    this._buildPropertiesPanel(comp);
  }

  _buildPropertiesPanel(comp) {
    const fields = document.getElementById('prop-fields');
    if (!fields) return;
    fields.innerHTML = '';

    const t = (k) => OpticalI18n.t(k);
    const addField = (label, inputHtml) => {
      fields.insertAdjacentHTML('beforeend', `
        <div class="prop-row">
          <label class="prop-label">${label}</label>
          <div class="prop-ctrl">${inputHtml}</div>
        </div>`);
    };
    const addSlider = (label, id, min, max, step, val, unit) => {
      addField(label, `
        <div class="prop-slider-row">
          <input type="range" class="prop-slider" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" oninput="app._updateCompProp('${id}',+this.value);this.nextElementSibling.textContent=this.value+' ${unit || ''}'">
          <span class="prop-slider-val">${val}${unit ? ' ' + unit : ''}</span>
        </div>`);
    };
    const addSelect = (label, id, options, val) => {
      const opts = options.map(([v, lbl]) => `<option value="${v}"${v === val ? ' selected' : ''}>${lbl}</option>`).join('');
      addField(label, `<select class="prop-select" id="${id}" onchange="app._updateCompProp('${id}',this.value)">${opts}</select>`);
    };
    const addToggle = (label, id, val) => {
      addField(label, `<label class="prop-toggle"><input type="checkbox" id="${id}" ${val ? 'checked' : ''} onchange="app._updateCompProp('${id}',this.checked)"><span class="toggle-track"></span></label>`);
    };
    const addNumber = (label, id, val, step = 1) => {
      addField(label, `<input type="number" class="prop-number" id="${id}" value="${val}" step="${step}" oninput="app._updateCompProp('${id}',+this.value)">`);
    };

    // Position + Rotation
    addNumber(t('propPosX'), '_pos_x', Math.round(comp.position.x));
    addNumber(t('propPosY'), '_pos_y', Math.round(comp.position.y));
    addSlider(t('propRotation'), '_rotation', 0, 360, 1, Math.round(comp.rotation || 0), '°');

    if (comp.type === 'laser') {
      addSlider(t('propWavelength'), 'wavelength', 380, 780, 1, comp.wavelength || 632, 'nm');
      addSlider(t('propPower'), 'power', 0.1, 100, 0.1, comp.power || 5, 'mW');
      addSlider(t('propBeamWidth'), 'beamWidth', 2, 50, 1, comp.beamWidth || 14, 'px');
      addSlider(t('propBeamDiv'), 'beamDivergence', 0, 20, 0.1, comp.beamDivergence || 0, '°');
      addToggle(t('propIsOn'), 'isOn', comp.isOn !== false);

    } else if (comp.type === 'white_light') {
      addSlider(t('propPower'), 'power', 1, 100, 1, comp.power || 10, 'mW');
      addSlider(t('propBeamWidth'), 'beamWidth', 2, 50, 1, comp.beamWidth || 20, 'px');
      addToggle(t('propIsOn'), 'isOn', comp.isOn !== false);

    } else if (comp.type === 'mirror') {
      addSelect(t('propMirrorType'), 'mirrorType', [
        ['plane', t('toolPlaneMirror')],
        ['concave', t('toolConcaveMirror')],
        ['convex', t('toolConvexMirror')],
        ['partial', t('toolBeamSplitter')],
      ], comp.mirrorType || 'plane');
      addSlider(t('propReflectivity') + ' R', 'reflectivity', 0.05, 1.0, 0.01, comp.reflectivity ?? 0.99, '');
      addSlider('Width (px)', 'width', 20, 400, 5, comp.width || 120, 'px');
      if (comp.mirrorType === 'concave' || comp.mirrorType === 'convex') {
        addNumber(t('propFocalLength') + ' (px)', 'focalLength', comp.focalLength || 150);
      }

    } else if (comp.type === 'lens') {
      addSelect(t('propMirrorType'), 'lensType', [
        ['convex', t('toolConvexLens')],
        ['concave', t('toolConcaveLens')],
        ['plano-convex', t('toolPlanoConvex')],
        ['plano-concave', t('toolPlanoConcave')],
        ['cylindrical', t('toolCylindricalLens')],
      ], comp.lensType || 'convex');
      addNumber(t('propFocalLength') + ' (px)', 'focalLength', comp.focalLength || 200);
      addSlider(t('propDiameter'), 'diameter', 20, 300, 5, comp.diameter || 80, 'px');
      addSlider(t('propRefractiveIndex') + ' n', 'refractiveIndex', 1.3, 3.0, 0.01, comp.refractiveIndex || 1.5, '');

    } else if (comp.type === 'prism') {
      addSelect('Prism Type', 'prismType', [
        ['triangular', t('toolTriangularPrism')],
        ['rectangular', t('toolRectangularPrism')],
        ['pentagonal', t('toolPentagonalPrism')],
      ], comp.prismType || 'triangular');
      addSlider(t('propRefractiveIndex') + ' n', 'refractiveIndex', 1.3, 3.0, 0.01, comp.refractiveIndex || 1.5, '');
      addSlider(t('propPrismSize'), 'size', 30, 300, 5, comp.size || 100, 'px');

    } else if (comp.type === 'medium') {
      addSlider(t('propRefractiveIndex') + ' n', 'refractiveIndex', 1.0, 3.0, 0.01, comp.refractiveIndex || 1.5, '');
      addSlider(t('propAbsorption') + ' α', 'absorptionCoefficient', 0, 5, 0.01, comp.absorptionCoefficient || 0, '');
      addNumber('Width (px)', 'width', comp.width || 150);
      addNumber('Height (px)', 'height', comp.height || 100);

    } else if (comp.type === 'grating') {
      addSlider(t('propGratingDensity'), 'gratingDensity', 100, 3600, 10, comp.gratingDensity || 600, 'l/mm');
      addSlider('Width (px)', 'width', 20, 400, 5, comp.width || 120, 'px');

    } else if (comp.type === 'single_slit' || comp.type === 'aperture') {
      addSlider(t('propSlitWidth'), 'slitWidth', 0.1, 100, 0.1, comp.slitWidth || 10, 'µm');
      addSlider('Width (px)', 'width', 20, 400, 5, comp.width || 120, 'px');

    } else if (comp.type === 'double_slit') {
      addSlider(t('propSlitWidth'), 'slitWidth', 0.1, 100, 0.1, comp.slitWidth || 10, 'µm');
      addSlider(t('propSlitSpacing'), 'slitSpacing', 10, 500, 1, comp.slitSpacing || 50, 'µm');
      addSlider('Width (px)', 'width', 20, 400, 5, comp.width || 120, 'px');

    } else if (comp.type === 'detector' || comp.type === 'screen') {
      addSlider('Width (px)', 'width', 20, 400, 5, comp.width || 80, 'px');

    } else if (comp.type === 'fiber') {
      addSlider(t('propCoreIndex'), 'coreIndex', 1.40, 1.70, 0.01, comp.coreIndex || 1.50, '');
      addSlider(t('propCladdingIndex'), 'claddingIndex', 1.30, 1.55, 0.01, comp.claddingIndex || 1.45, '');
      addSlider(t('propFiberLength'), 'length', 100, 500, 10, comp.length || 240, 'px');
      addSlider(t('propCoreDiameter'), 'coreDiameter', 8, 40, 2, comp.coreDiameter || 20, 'px');

      const n1 = comp.coreIndex || 1.50;
      const n2 = comp.claddingIndex || 1.45;
      const na = Math.sqrt(Math.max(0, n1 * n1 - n2 * n2)).toFixed(3);
      const thetaAcc = (Math.asin(Math.min(1.0, na)) * 180 / Math.PI).toFixed(1);
      addField('Numerical Aperture (NA)', `<div style="font-family:var(--font-mono);color:#38bdf8;font-weight:bold;padding:5px 0;">NA = ${na} &nbsp; (θ_acc = ${thetaAcc}°)</div>`);

    } else if (comp.type === 'ruler') {
      addSlider('Length (px)', 'length', 50, 600, 10, comp.length || 200, 'px');

    } else if (comp.type === 'protractor') {
      addSlider('Radius (px)', 'radius', 40, 250, 5, comp.radius || 100, 'px');
    }
  }

  _updateCompProp(fieldId, val) {
    const comp = this.selectedComp;
    if (!comp) return;

    if (fieldId === '_pos_x') {
      comp.position = { ...comp.position, x: val };
    } else if (fieldId === '_pos_y') {
      comp.position = { ...comp.position, y: val };
    } else if (fieldId === '_rotation') {
      comp.rotation = val;
    } else {
      comp[fieldId] = val;
    }

    const idx = this.wc.components.findIndex(c => c.id === comp.id);
    if (idx >= 0) this.wc.components[idx] = comp;

    this.wc.setComponents([...this.wc.components]);
    this._saveHistory();
    this._updateStatusCounts();
  }

  /* ═══════════════════════════════════════════════════════════════
     THEORY TAB
  ═══════════════════════════════════════════════════════════════ */
  _renderTheory(exp) {
    const placeholder = document.getElementById('theory-placeholder');
    const panel = document.getElementById('theory-panel');

    if (!exp) {
      if (placeholder) placeholder.style.display = '';
      if (panel) panel.style.display = 'none';
      return;
    }

    if (placeholder) placeholder.style.display = 'none';
    if (panel) panel.style.display = '';

    const lang = OpticalI18n.getLang();
    const title = (lang === 'ar' && exp.titleAr) ? exp.titleAr : exp.title;
    const theory = exp.theory || '';
    const objective = exp.objective || '';

    let eqHtml = '';
    if (exp.equations && exp.equations.length > 0) {
      eqHtml = exp.equations.map(eq => `
        <div class="eq-box">
          <div class="eq-label">${eq.label || ''}</div>
          <div class="eq-formula">${this.renderMathFormula(eq.latex || '')}</div>
          <div class="eq-desc">${eq.desc || ''}</div>
        </div>`).join('');
    }

    let paramHtml = '';
    if (exp.defaultParams) {
      paramHtml = '<div class="theory-params">' +
        Object.entries(exp.defaultParams).map(([k, v]) =>
          `<div class="theory-param-row"><span class="param-key">${k}</span><span class="param-val">${v}</span></div>`
        ).join('') + '</div>';
    }

    panel.innerHTML = `
      <div class="theory-card">
        <div class="theory-exp-num">EXP-${exp.num}</div>
        <div class="theory-exp-title">${title}</div>
        <div class="theory-section-label">🎯 ${lang === 'ar' ? 'الهدف الفيزيائي' : 'Objective'}</div>
        <div class="theory-text">${objective}</div>
        <div class="theory-section-label">📖 ${lang === 'ar' ? 'النظرية العلمية' : 'Theory'}</div>
        <div class="theory-text">${theory}</div>
        ${eqHtml ? `<div class="theory-section-label">📐 ${lang === 'ar' ? 'المعادلات والقوانين' : 'Equations'}</div>${eqHtml}` : ''}
        ${paramHtml ? `<div class="theory-section-label">🔧 ${lang === 'ar' ? 'المعاملات الافتراضية' : 'Default Parameters'}</div>${paramHtml}` : ''}
      </div>`;
  }

  /* ═══════════════════════════════════════════════════════════════
     QUIZ TAB
  ═══════════════════════════════════════════════════════════════ */
  _renderQuiz(exp) {
    const placeholder = document.getElementById('quiz-placeholder');
    const panel = document.getElementById('quiz-panel');

    if (!exp || !exp.quiz || exp.quiz.length === 0) {
      if (placeholder) placeholder.style.display = '';
      if (panel) panel.style.display = 'none';
      return;
    }

    if (placeholder) placeholder.style.display = 'none';
    if (panel) panel.style.display = '';

    const lang = OpticalI18n.getLang();

    let html = `<div class="quiz-header">📝 ${lang === 'ar' ? 'اختبار تقييم التجربة' : 'Assessment Quiz'}: EXP-${exp.num}</div>`;
    exp.quiz.forEach((q, qi) => {
      const question = (lang === 'ar' && q.qAr) ? q.qAr : q.q;
      const opts = q.options.map((opt, oi) => `
        <button class="quiz-opt" data-qi="${qi}" data-oi="${oi}" onclick="app._checkAnswer(${qi},${oi})">${opt}</button>`
      ).join('');
      html += `
        <div class="quiz-block" id="quiz-block-${qi}">
          <div class="quiz-q">${qi + 1}. ${question}</div>
          <div class="quiz-opts">${opts}</div>
          <div class="quiz-feedback" id="quiz-fb-${qi}" style="display:none"></div>
        </div>`;
    });

    panel.innerHTML = html;
    this._quizData = exp.quiz;
  }

  _checkAnswer(qi, oi) {
    const q = this._quizData && this._quizData[qi];
    if (!q) return;
    const isCorrect = oi === q.correct;
    const fbEl = document.getElementById(`quiz-fb-${qi}`);
    const block = document.getElementById(`quiz-block-${qi}`);

    block.querySelectorAll('.quiz-opt').forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.correct) btn.classList.add('quiz-correct');
      else if (i === oi && !isCorrect) btn.classList.add('quiz-wrong');
    });

    if (fbEl) {
      fbEl.style.display = '';
      fbEl.className = 'quiz-feedback ' + (isCorrect ? 'quiz-fb-correct' : 'quiz-fb-wrong');
      fbEl.textContent = (isCorrect ? '✅ ' : '❌ ') + (q.explanation || '');
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     DETECTOR READOUT OVERLAY
  ═══════════════════════════════════════════════════════════════ */
  _updateDetectorReadout(comp) {
    const overlay = document.getElementById('detector-readout');
    const powerEl = document.getElementById('readout-power');
    if (!overlay || !powerEl) return;
    if (comp.detectedPower !== undefined) {
      overlay.style.display = '';
      powerEl.textContent = comp.detectedPower.toFixed(3) + ' mW';
    } else {
      overlay.style.display = 'none';
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPERIMENTS MODAL LIBRARY
  ═══════════════════════════════════════════════════════════════ */
  _populateModal(filter = '', search = '') {
    const grid = document.getElementById('modal-exp-grid');
    if (!grid || typeof EXPERIMENTS_DATABASE === 'undefined') return;

    const lang = OpticalI18n.getLang();
    let exps = EXPERIMENTS_DATABASE;

    if (filter) exps = exps.filter(e => e.category === filter);
    if (search) {
      const q = search.toLowerCase();
      exps = exps.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.titleAr || '').includes(q) ||
        e.num.includes(q) ||
        (e.equipment || []).some(eq => eq.toLowerCase().includes(q))
      );
    }

    grid.innerHTML = exps.map(exp => {
      const title = (lang === 'ar' && exp.titleAr) ? exp.titleAr : exp.title;
      const catClass = `cat-${exp.category || 'other'}`;
      const eqFormula = exp.equations && exp.equations[0] ? this.renderMathFormula(exp.equations[0].latex) : '';
      return `
        <div class="exp-card ${catClass}" onclick="app.loadExperiment('${exp.id}')">
          <div class="exp-card-num">EXP-${exp.num}</div>
          <div class="exp-card-title">${title}</div>
          ${eqFormula ? `<div style="font-family:var(--font-mono);font-size:11px;color:#38bdf8;padding:2px 0;">${eqFormula}</div>` : ''}
          <div class="exp-card-meta">
            <span class="exp-badge-level">${exp.level || ''}</span>
            <span class="exp-badge-diff">${exp.difficulty || ''}</span>
            <span class="exp-badge-time">⏱ ${exp.time || ''}</span>
          </div>
          <div class="exp-card-comps">🔧 ${(exp.components || []).length} ${lang === 'ar' ? 'عناصر جاهزة' : 'components'}</div>
        </div>`;
    }).join('') || `<div class="no-results">${lang === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching experiments found'}</div>`;
  }

  /* ═══════════════════════════════════════════════════════════════
     QUICK SELECT DROPDOWN
  ═══════════════════════════════════════════════════════════════ */
  _populateQuickSelect() {
    const sel = document.getElementById('quick-select');
    if (!sel || typeof EXPERIMENTS_DATABASE === 'undefined') return;
    const lang = OpticalI18n.getLang();

    // Preserve the placeholder
    while (sel.options.length > 1) sel.remove(1);

    EXPERIMENTS_DATABASE.forEach(exp => {
      const title = (lang === 'ar' && exp.titleAr) ? exp.titleAr : exp.title;
      const opt = document.createElement('option');
      opt.value = exp.id;
      opt.textContent = `EXP-${exp.num}: ${title}`;
      sel.appendChild(opt);
    });

    if (this.activeExp) {
      sel.value = this.activeExp.id;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     TAB SWITCHING
  ═══════════════════════════════════════════════════════════════ */
  _switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tabId}`));
  }

  /* ═══════════════════════════════════════════════════════════════
     STATUS BAR & COORDINATES
  ═══════════════════════════════════════════════════════════════ */
  _updateStatusExp(tag, name) {
    const tagEl = document.getElementById('status-exp-tag');
    const nameEl = document.getElementById('status-exp-name');
    if (tagEl) tagEl.textContent = tag;
    if (nameEl) nameEl.textContent = name;
  }

  _updateCoords(x, y) {
    const xEl = document.getElementById('status-x');
    const yEl = document.getElementById('status-y');
    if (xEl) xEl.textContent = Math.round(x);
    if (yEl) yEl.textContent = Math.round(y);
  }

  _updateStatusCounts() {
    const compEl = document.getElementById('status-comp-count');
    const rayEl = document.getElementById('status-ray-count');
    if (compEl) compEl.textContent = this.wc ? this.wc.components.length : 0;
    if (rayEl) rayEl.textContent = (this.wc && this.wc.rays) ? this.wc.rays.length : 0;
  }

  _toggleDropHint() {
    const hint = document.getElementById('drop-hint');
    if (hint) hint.style.display = (this.wc && this.wc.components.length === 0) ? '' : 'none';
  }

  /* ═══════════════════════════════════════════════════════════════
     SETTINGS UI SYNC
  ═══════════════════════════════════════════════════════════════ */
  _syncSettingsUI() {
    const s = this.settings;
    this._setCheck('set-grid', s.showGrid);
    this._setCheck('set-snap', s.snapToGrid);
    this._setRange('set-grid-spacing', 'set-grid-spacing-val', s.gridSpacing);
    this._setCheck('set-focal', s.showFocalPoints);
    this._setCheck('set-normals', s.showNormalLines);
    this._setCheck('set-angles', s.showAngles);
    this._setRange('set-ray-density', 'set-ray-density-val', s.laserRayDensity);
    this._setRange('set-ray-depth', 'set-ray-depth-val', s.maxRayDepth);
  }

  _setCheck(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = val;
  }

  _setRange(id, valId, val) {
    const el = document.getElementById(id);
    const valEl = document.getElementById(valId);
    if (el) el.value = val;
    if (valEl) valEl.textContent = val;
  }

  _applySettings() {
    this.settings.showGrid = document.getElementById('set-grid')?.checked ?? true;
    this.settings.snapToGrid = document.getElementById('set-snap')?.checked ?? false;
    this.settings.gridSpacing = +(document.getElementById('set-grid-spacing')?.value ?? 25);
    this.settings.showFocalPoints = document.getElementById('set-focal')?.checked ?? true;
    this.settings.showNormalLines = document.getElementById('set-normals')?.checked ?? false;
    this.settings.showAngles = document.getElementById('set-angles')?.checked ?? false;
    this.settings.laserRayDensity = +(document.getElementById('set-ray-density')?.value ?? 4);
    this.settings.maxRayDepth = +(document.getElementById('set-ray-depth')?.value ?? 8);
    this.wc.setSettings(this.settings);
  }

  /* ═══════════════════════════════════════════════════════════════
     I18N LOCALIZATION
  ═══════════════════════════════════════════════════════════════ */
  _applyI18n() {
    const t = OpticalI18n.t.bind(OpticalI18n);
    const lang = OpticalI18n.getLang();

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const key = el.getAttribute('data-i18n-attr');
      el.setAttribute('placeholder', t(key));
    });

    document.querySelectorAll('#modal-cat-filter option[data-i18n]').forEach(opt => {
      const key = opt.getAttribute('data-i18n');
      opt.textContent = t(key);
    });

    const langBtn = document.getElementById('btn-lang');
    if (langBtn) langBtn.textContent = lang === 'ar' ? 'English' : 'العربية';

    const qsPh = document.querySelector('#quick-select option[value=""]');
    if (qsPh) qsPh.textContent = t('quickSelectPlaceholder');
  }

  toggleLanguage() {
    const newLang = OpticalI18n.getLang() === 'ar' ? 'en' : 'ar';
    OpticalI18n.setLang(newLang);
    this._applyI18n();
    this._populateQuickSelect();
    this._populateModal(
      document.getElementById('modal-cat-filter')?.value || '',
      document.getElementById('modal-search')?.value || ''
    );
    if (this.activeExp) {
      this._renderLawBox(this.activeExp);
      this._renderTheory(this.activeExp);
      this._renderQuiz(this.activeExp);
      const title = (newLang === 'ar' && this.activeExp.titleAr) ? this.activeExp.titleAr : this.activeExp.title;
      this._updateStatusExp(`EXP-${this.activeExp.num}`, title);
    }
    if (this.selectedComp) {
      this._buildPropertiesPanel(this.selectedComp);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     THEME TOGGLE
  ═══════════════════════════════════════════════════════════════ */
  toggleTheme() {
    this._darkMode = !this._darkMode;
    document.body.classList.toggle('light-theme', !this._darkMode);
    this.settings.isDarkMode = this._darkMode;
    this.wc.setSettings(this.settings);
    const btn = document.getElementById('btn-theme');
    if (btn) btn.textContent = this._darkMode ? '🌙' : '☀️';
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT / SAVE / LOAD
  ═══════════════════════════════════════════════════════════════ */
  exportPNG() {
    const canvas = document.getElementById('lab-canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `LST-Lab-${this.activeExp ? this.activeExp.num : 'Free'}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  exportPDF() {
    const lang = OpticalI18n.getLang();
    const expTitle = this.activeExp
      ? ((lang === 'ar' && this.activeExp.titleAr) ? this.activeExp.titleAr : this.activeExp.title)
      : OpticalI18n.t('statusFreeMode');
    const expNum = this.activeExp ? `EXP-${this.activeExp.num}` : 'FREE';
    const canvas = document.getElementById('lab-canvas');
    const imgData = canvas ? canvas.toDataURL('image/png') : '';
    const theory = this.activeExp ? (this.activeExp.theory || '') : '';
    const eqs = this.activeExp && this.activeExp.equations
      ? this.activeExp.equations.map(e => `<p><strong>${e.label}:</strong> <code>${e.latex}</code> — ${e.desc}</p>`).join('')
      : '';

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head><meta charset="UTF-8"><title>${expNum}: ${expTitle}</title>
<style>
  body { font-family: 'Cairo', 'Segoe UI', sans-serif; margin: 40px; color: #111; }
  h1 { font-size: 22px; color: #1a237e; }
  h2 { font-size: 16px; color: #283593; margin-top: 20px; }
  img { max-width: 100%; border: 1px solid #ccc; border-radius: 4px; margin-top: 10px; }
  code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 14px; }
  .meta { color: #555; font-size: 13px; margin-bottom: 20px; }
  @media print { button { display: none; } }
</style></head><body>
<h1>🔬 ${expNum}: ${expTitle}</h1>
<div class="meta">الجامعة التكنولوجية – العراق | قسم علوم وتكنولوجيا الليزر | ${new Date().toLocaleDateString(lang === 'ar' ? 'ar-IQ' : 'en-US')}</div>
<h2>النظرية الفيزيائية / Scientific Theory</h2><p>${theory}</p>
${eqs ? `<h2>المعادلات الحاكمة / Equations</h2>${eqs}` : ''}
<h2>صورة المنظومة البصرية / Optical Setup</h2>
<img src="${imgData}" alt="Experiment">
<br><br><button onclick="window.print()">🖨 طباعة التقرير / Print Report</button>
</body></html>`);
    win.document.close();
  }

  saveJSON() {
    const data = {
      version: '2.0',
      experiment: this.activeExp ? this.activeExp.id : 'free',
      components: this.wc.components,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `LST-${this.activeExp ? this.activeExp.num : 'Free'}-${Date.now()}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
  }

  loadJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const comps = data.components || data;
        this.wc.setComponents(comps);
        if (typeof this.wc.fitToView === 'function') this.wc.fitToView(80);
        this._saveHistory();
        this._updateStatusCounts();
        this._toggleDropHint();
      } catch (err) {
        alert(OpticalI18n.getLang() === 'ar' ? 'خطأ في قراءة ملف JSON' : 'Invalid JSON file format');
      }
    };
    reader.readAsText(file);
  }

  clearCanvas() {
    this.wc.setComponents([]);
    this.wc.selectedComponent = null;
    this._saveHistory();
    this._showSelectionPanel(null);
    this._updateStatusCounts();
    this._toggleDropHint();
  }

  /* ═══════════════════════════════════════════════════════════════
     FPS COUNTER
  ═══════════════════════════════════════════════════════════════ */
  _startFPS() {
    const fpsEl = document.getElementById('status-fps');
    const tick = () => {
      this._fpsFrames++;
      const now = performance.now();
      const delta = now - this._fpsLast;
      if (delta >= 1000) {
        const fps = Math.round((this._fpsFrames * 1000) / delta);
        if (fpsEl) fpsEl.textContent = `${fps} FPS`;
        this._fpsFrames = 0;
        this._fpsLast = now;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ═══════════════════════════════════════════════════════════════
     EVENT LISTENERS BINDING
  ═══════════════════════════════════════════════════════════════ */
  _bindEvents() {
    // Header buttons
    document.getElementById('btn-experiments')?.addEventListener('click', () => {
      this._populateModal('', '');
      document.getElementById('exp-modal').style.display = 'flex';
    });

    document.getElementById('btn-free-lab')?.addEventListener('click', () => this.enterFreeMode());

    // Quick select dropdown
    document.getElementById('quick-select')?.addEventListener('change', (e) => {
      if (e.target.value) {
        this.loadExperiment(e.target.value);
      }
    });

    // Header Prev / Next experiment arrows
    document.getElementById('btn-head-prev')?.addEventListener('click', () => this.prevExperiment());
    document.getElementById('btn-head-next')?.addEventListener('click', () => this.nextExperiment());

    // Scientific Law Box buttons
    document.getElementById('btn-prev-exp')?.addEventListener('click', () => this.prevExperiment());
    document.getElementById('btn-next-exp')?.addEventListener('click', () => this.nextExperiment());
    document.getElementById('btn-fit-view')?.addEventListener('click', () => {
      if (this.wc && typeof this.wc.fitToView === 'function') this.wc.fitToView(80);
    });
    document.getElementById('btn-toggle-law')?.addEventListener('click', () => {
      const box = document.getElementById('experiment-law-box');
      if (box) {
        box.classList.toggle('collapsed');
        const btn = document.getElementById('btn-toggle-law');
        if (btn) btn.textContent = box.classList.contains('collapsed') ? '▴' : '▾';
      }
    });

    // Left Sidebar collapse pin button
    document.getElementById('btn-toggle-left')?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar-left');
      if (sidebar) {
        sidebar.classList.toggle('collapsed');
        const pin = document.getElementById('btn-toggle-left');
        if (pin) pin.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
        if (this.wc) setTimeout(() => this.wc.render(), 150);
      }
    });

    // Modal controls
    document.getElementById('modal-close')?.addEventListener('click', () => {
      document.getElementById('exp-modal').style.display = 'none';
    });
    document.getElementById('exp-modal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('exp-modal')) {
        document.getElementById('exp-modal').style.display = 'none';
      }
    });
    document.getElementById('modal-search')?.addEventListener('input', (e) => {
      this._populateModal(document.getElementById('modal-cat-filter').value, e.target.value);
    });
    document.getElementById('modal-cat-filter')?.addEventListener('change', (e) => {
      this._populateModal(e.target.value, document.getElementById('modal-search').value);
    });

    // Undo / Redo
    document.getElementById('btn-undo')?.addEventListener('click', () => this.undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => this.redo());

    // Clear
    document.getElementById('btn-clear')?.addEventListener('click', () => {
      const msg = OpticalI18n.getLang() === 'ar' ? 'هل تريد مسح جميع العناصر على الطاولة؟' : 'Clear all optical components?';
      if (confirm(msg)) this.clearCanvas();
    });

    // Save & Load
    document.getElementById('btn-save')?.addEventListener('click', () => this.saveJSON());
    document.getElementById('btn-load')?.addEventListener('click', () => document.getElementById('file-input').click());
    document.getElementById('file-input')?.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        this.loadJSON(e.target.files[0]);
        e.target.value = '';
      }
    });

    // Exports
    document.getElementById('btn-export-png')?.addEventListener('click', () => this.exportPNG());
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => this.exportPDF());

    // Theme & Language & Fullscreen
    document.getElementById('btn-theme')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('btn-lang')?.addEventListener('click', () => this.toggleLanguage());
    document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Inspector Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
    });

    // Component Duplicate & Delete
    document.getElementById('btn-duplicate')?.addEventListener('click', () => {
      if (!this.selectedComp) return;
      const dup = JSON.parse(JSON.stringify(this.selectedComp));
      dup.id = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      dup.position = { x: dup.position.x + 35, y: dup.position.y + 35 };
      this.wc.components.push(dup);
      this.wc.setComponents([...this.wc.components]);
      this._saveHistory();
      this._updateStatusCounts();
    });

    document.getElementById('btn-delete')?.addEventListener('click', () => {
      if (!this.selectedComp) return;
      this.wc.components = this.wc.components.filter(c => c.id !== this.selectedComp.id);
      this.wc.selectedComponent = null;
      this.wc.setComponents([...this.wc.components]);
      this._saveHistory();
      this._showSelectionPanel(null);
      this._updateStatusCounts();
      this._toggleDropHint();
    });

    // Settings
    ['set-grid', 'set-snap', 'set-focal', 'set-normals', 'set-angles'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => this._applySettings());
    });
    ['set-grid-spacing', 'set-ray-density', 'set-ray-depth'].forEach(id => {
      const el = document.getElementById(id);
      const valEl = document.getElementById(id + '-val');
      el?.addEventListener('input', () => {
        if (valEl) valEl.textContent = el.value;
        this._applySettings();
      });
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this.undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); this.redo(); }
      if (e.key === 'ArrowRight' && e.altKey) { e.preventDefault(); this.nextExperiment(); }
      if (e.key === 'ArrowLeft' && e.altKey) { e.preventDefault(); this.prevExperiment(); }
      if (e.key === 'f' && e.altKey) {
        e.preventDefault();
        if (this.wc && typeof this.wc.fitToView === 'function') this.wc.fitToView(80);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selectedComp) {
          this.wc.components = this.wc.components.filter(c => c.id !== this.selectedComp.id);
          this.selectedComp = null;
          this.wc.selectedComponent = null;
          this.wc.setComponents([...this.wc.components]);
          this._saveHistory();
          this._showSelectionPanel(null);
          this._updateStatusCounts();
          this._toggleDropHint();
        }
      }
    });

    // ── 2D / 3D Mode Toggle ─────────────────────────────────────────────────
    document.getElementById('btn-mode-2d')?.addEventListener('click', () => this.setMode('2d'));
    document.getElementById('btn-mode-3d')?.addEventListener('click', () => this.setMode('3d'));

    // ── 3D Camera View Controls (inside #lab-3d-container HUD) ──────────────
    document.getElementById('btn-3d-persp')?.addEventListener('click', () => {
      if (this.bench3D) this.bench3D.setCameraView('perspective');
    });
    document.getElementById('btn-3d-top')?.addEventListener('click', () => {
      if (this.bench3D) this.bench3D.setCameraView('top');
    });
    document.getElementById('btn-3d-reset')?.addEventListener('click', () => {
      if (this.bench3D) this.bench3D.setCameraView('perspective');
    });

    // Auto-resize canvas (and 3D bench) on window resizing
    window.addEventListener('resize', () => {
      if (this.wc) this.wc.render();
      if (this.bench3D && this.mode === '3d') this.bench3D.resize();
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   APPLICATION BOOTSTRAP
═══════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  window.app = new LabApp();
  window.app.init();
});
