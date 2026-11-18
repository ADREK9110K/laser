/**
 * LASER SCIENCE & TECHNOLOGY - I18N LOCALIZATION ENGINE
 * Complete English and Arabic dictionaries with full RTL support.
 * University of Technology - Iraq | College of Laser Science and Technology
 */

(function (window) {
  'use strict';

  const TRANSLATIONS = {
    en: {
      platformTitle: "LASER SCIENCE & TECHNOLOGY",
      platformSubtitle: "VIRTUAL INTERACTIVE LABORATORY",
      collegeName: "University of Technology – Iraq | Department of Laser Science & Technology",
      
      // Navigation & Header
      btnExperiments: "🔬 Experiments (100)",
      btnFreeLab: "🧪 Free Sandbox Mode",
      quickSelectPlaceholder: "-- Select Experiment (001 - 100) --",
      btnUndo: "Undo",
      btnRedo: "Redo",
      btnClear: "Clear Table",
      btnSave: "Save JSON",
      btnLoad: "Load JSON",
      btnExportPNG: "Export PNG",
      btnExportPDF: "PDF Lab Report",
      btnTheme: "Theme",
      btnFullscreen: "Fullscreen",
      btnLanguage: "العربية",

      // Drawer Headers
      toolDrawerTitle: "OPTICAL COMPONENTS",
      categorySources: "Light Sources",
      categoryMirrors: "Mirrors & Splitters",
      categoryLenses: "Lenses",
      categoryPrisms: "Prisms & Geometry",
      categoryMedia: "Physical Media",
      categoryDiffraction: "Diffraction & Slits",
      categoryTools: "Measurement & Detectors",

      // Component Tool Names
      toolLaser: "Laser Source",
      toolLaserDesc: "Directional monochromatic coherent beam",
      toolLaserRed: "Red Laser (650nm)",
      toolLaserGreen: "Green Laser (532nm)",
      toolLaserViolet: "Violet Laser (405nm)",
      toolWhiteLight: "White Light Source",
      toolWhiteLightDesc: "Broad spectrum (400-700nm) continuous light",

      toolPlaneMirror: "Plane Mirror",
      toolPlaneMirrorDesc: "Flat mirror (100% specular reflection)",
      toolConcaveMirror: "Concave Mirror",
      toolConcaveMirrorDesc: "Spherical mirror converging light",
      toolConvexMirror: "Convex Mirror",
      toolConvexMirrorDesc: "Spherical mirror diverging light",
      toolBeamSplitter: "Beam Splitter",
      toolBeamSplitterDesc: "50/50 partial reflection & transmission",

      toolConvexLens: "Double Convex Lens",
      toolConvexLensDesc: "Converging lens with positive focal length",
      toolConcaveLens: "Double Concave Lens",
      toolConcaveLensDesc: "Diverging lens with negative focal length",
      toolPlanoConvex: "Plano-Convex Lens",
      toolPlanoConvexDesc: "Flat on one face, curved on opposite",
      toolPlanoConcave: "Plano-Concave Lens",
      toolPlanoConcaveDesc: "Flat on one face, curved inward",
      toolCylindricalLens: "Cylindrical Lens",
      toolCylindricalLensDesc: "One-dimensional line-focus lens",

      toolTriangularPrism: "Triangular Prism",
      toolTriangularPrismDesc: "Dispersive prism with Cauchy chromatic spread",
      toolRectangularPrism: "Rectangular Block",
      toolRectangularPrismDesc: "Solid optical dielectric block",
      toolPentagonalPrism: "Pentagonal Prism",
      toolPentagonalPrismDesc: "5-sided optical prism",

      toolRefractiveMedium: "Refractive Medium",
      toolRefractiveMediumDesc: "Dielectric medium with refractive index n",
      toolAbsorbingMedium: "Absorbing Medium",
      toolAbsorbingMediumDesc: "Medium with Beer-Lambert absorption α",

      toolFiber: "Optical Fiber Cable",
      toolFiberDesc: "Flexible dielectric waveguide guiding light via Total Internal Reflection",

      toolGrating: "Diffraction Grating",
      toolGratingDesc: "Periodic array producing diffraction orders",
      toolSingleSlit: "Single Slit Aperture",
      toolSingleSlitDesc: "Diffraction slit with adjustable width",
      toolDoubleSlit: "Double Slit (Young)",
      toolDoubleSlitDesc: "Two slits producing interference fringes",
      toolAperture: "Circular Pinhole",
      toolApertureDesc: "Pinhole aperture yielding Airy diffraction",

      toolDetector: "Silicon Photodiode",
      toolDetectorDesc: "Power meter measuring laser power in mW",
      toolScreen: "Observation Screen",
      toolScreenDesc: "Screen for observing beam patterns & spots",
      toolRuler: "Optical Metric Ruler",
      toolRulerDesc: "Millimeter & centimeter calibrated scale",
      toolProtractor: "Circular Protractor",
      toolProtractorDesc: "Angular scale (0° - 180°) with snap guide",

      // Inspector Tabs
      tabProperties: "Properties",
      tabTheory: "Theory & Equations",
      tabDetector: "Sensor Analytics",
      tabQuiz: "Assessment Quiz",
      tabSettings: "Settings",

      // Properties Labels
      propName: "Component Name",
      propPosX: "Position X (mm)",
      propPosY: "Position Y (mm)",
      propRotation: "Rotation (°)",
      propWavelength: "Wavelength (nm)",
      propPower: "Power (mW)",
      propBeamWidth: "Beam Width (px)",
      propBeamDiv: "Divergence (°)",
      propIsOn: "Emission Shutter",
      propMirrorType: "Mirror Profile",
      propReflectivity: "Reflectivity (R)",
      propFocalLength: "Focal Length (mm)",
      propDiameter: "Aperture Diameter (mm)",
      propThickness: "Thickness (mm)",
      propRefractiveIndex: "Refractive Index (n)",
      propGratingDensity: "Density (lines/mm)",
      propSlitWidth: "Slit Width (µm)",
      propSlitSpacing: "Slit Spacing (µm)",
      propAbsorption: "Absorption Coeff. α",
      propPrismSize: "Prism Size (mm)",
      propCoreIndex: "Core Index (n₁)",
      propCladdingIndex: "Cladding Index (n₂)",
      propFiberLength: "Cable Length (px)",
      propCoreDiameter: "Core Diameter (px)",
      btnDuplicate: "Duplicate Object",
      btnDelete: "Delete Object",

      // Modal & Selector
      modalExpTitle: "Laboratory Experiments Library (100 Experiments)",
      searchPlaceholder: "Search experiments by name, ID, or equipment...",
      catAll: "All Categories (001 - 100)",
      catFundamental: "1. Fundamental Optics (001-015)",
      catWave: "2. Wave Optics & Interference (016-030)",
      catPolarization: "3. Polarization & EM Optics (031-040)",
      catLaserPhysics: "4. Laser Physics & Cavities (041-055)",
      catAdvancedLaser: "5. Advanced Laser Technology (056-065)",
      catNonlinear: "6. Nonlinear Optics (066-075)",
      catSpectroscopy: "7. Spectroscopy & Photonics (076-085)",
      catMaterials: "8. Laser-Matter & Materials (086-093)",
      catBiomedical: "9. Biomedical Laser Applications (094-100)",
      btnLoadExp: "Load into Bench",

      // Status Bar
      statusCoords: "Coordinates",
      statusActiveExp: "Active Experiment",
      statusComponents: "Components",
      statusRays: "Rays Traced",
      statusFPS: "FPS",
      statusFreeMode: "Free Experiment (Sandbox)",

      // Additional keys for new UI
      dropHint: "Drag a component from the left panel, or click it to add to canvas",
      noSelectionMsg: "Click a component on the optical bench to view and edit its properties here",
      theoryPlaceholder: "Load an experiment to view the theory, equations, and objectives",
      quizPlaceholder: "Load an experiment to start the self-assessment quiz",
      settingsCanvas: "Canvas Settings",
      settingsRay: "Ray Tracing Settings",
      settingGrid: "Show Grid",
      settingSnap: "Snap to Grid",
      settingGridSpacing: "Grid Spacing",
      settingFocalPoints: "Show Focal Points",
      settingNormals: "Show Normal Lines",
      settingAngles: "Show Angle Labels",
      settingRayDensity: "Ray Density",
      settingMaxDepth: "Max Reflections",

      // Scientific Law Box
      lawTitle: "Scientific Law & Governing Equation",
      lawExpBadge: "Experiment Ready",
      lawPrev: "‹ Prev",
      lawNext: "Next ›",
      lawFormulaLabel: "Governing Mathematical Formula",
      lawVariablesLabel: "Physical Variables & Notation",
    },

    ar: {
      platformTitle: "علوم وتكنولوجيا الليزر",
      platformSubtitle: "المختبر الافتراضي التفاعلي المتقدم",
      collegeName: "الجامعة التكنولوجية – العراق | قسم علوم وتكنولوجيا الليزر",
      
      // Navigation & Header
      btnExperiments: "🔬 التجارب المخبرية (100)",
      btnFreeLab: "🧪 تجربة حرة (مختبر مفتوح)",
      quickSelectPlaceholder: "-- اختر التجربة (001 - 100) --",
      btnUndo: "تراجع",
      btnRedo: "إعادة",
      btnClear: "مسح الطاولة",
      btnSave: "حفظ كـ JSON",
      btnLoad: "فتح ملف",
      btnExportPNG: "تصدير صورة",
      btnExportPDF: "تقرير مخبري PDF",
      btnTheme: "المظهر",
      btnFullscreen: "ملء الشاشة",
      btnLanguage: "English",

      // Drawer Headers
      toolDrawerTitle: "العناصر البصرية والمصادر",
      categorySources: "مصادر الضوء والليزر",
      categoryMirrors: "المرايا ومجزئات الحزمة",
      categoryLenses: "العدسات البصرية",
      categoryPrisms: "المناشير والأشكال الهندسية",
      categoryMedia: "الأوساط المادية والكاسرة",
      categoryDiffraction: "الحيود والشقوق والمحزوزات",
      categoryTools: "أدوات القياس والكواشف",

      // Component Tool Names
      toolLaser: "مصدر ليزر متماسك",
      toolLaserDesc: "حزمة ليزرية متوازية وأحادية اللون",
      toolLaserRed: "ليزر أحمر (650 نانومتر)",
      toolLaserGreen: "ليزر أخضر (532 نانومتر)",
      toolLaserViolet: "ليزر بنفسجي (405 نانومتر)",
      toolWhiteLight: "مصدر ضوء أبيض",
      toolWhiteLightDesc: "طيف عريض مستمر (400 - 700 نانومتر)",

      toolPlaneMirror: "مرآة مستوية",
      toolPlaneMirrorDesc: "مرآة مستوية بانعكاس مثالي 100%",
      toolConcaveMirror: "مرآة مقعرة",
      toolConcaveMirrorDesc: "مرآة كروية مجمّعة للأشعة",
      toolConvexMirror: "مرآة محدبة",
      toolConvexMirrorDesc: "مرآة كروية مفرّقة للأشعة",
      toolBeamSplitter: "مجزئ حزمة ضوئية",
      toolBeamSplitterDesc: "مرآة شبه منفذة (انعكاس ونفاذ 50/50)",

      toolConvexLens: "عدسة محدبة الوجهين",
      toolConvexLensDesc: "عدسة مجمّعة ذات بعد بؤري موجب",
      toolConcaveLens: "عدسة مقعرة الوجهين",
      toolConcaveLensDesc: "عدسة مفرّقة ذات بعد بؤري سالب",
      toolPlanoConvex: "عدسة مستوية محدبة",
      toolPlanoConvexDesc: "وجه مستوٍ ووجه مقوس للخارج",
      toolPlanoConcave: "عدسة مستوية مقعرة",
      toolPlanoConcaveDesc: "وجه مستوٍ ووجه مقوس للداخل",
      toolCylindricalLens: "عدسة أسطوانية",
      toolCylindricalLensDesc: "عدسة تجمّع الضوء في خط بؤري واحد",

      toolTriangularPrism: "منشور ثلاثي متساوي الأضلاع",
      toolTriangularPrismDesc: "منشور زجاجي مشتت للطيف (كوشي)",
      toolRectangularPrism: "متوازي مستطيلات زجاجي",
      toolRectangularPrismDesc: "كتلة بصرية عازلة كاسرة",
      toolPentagonalPrism: "منشور خماسي",
      toolPentagonalPrismDesc: "منشور بصري خماسي الأوجه",

      toolRefractiveMedium: "وسط بصري كاسر",
      toolRefractiveMediumDesc: "وسط شفاف ذو معامل انكسار محدد n",
      toolAbsorbingMedium: "وسط ممتص للضوء",
      toolAbsorbingMediumDesc: "وسط يخضع لقانون بير-لامبرت للامتصاص",

      toolFiber: "الكيبل الضوئي (Fiber Optic)",
      toolFiberDesc: "دليل موجي عازل ينقل الضوء عبر الانعكاس الكلي الداخلي TIR",

      toolGrating: "محزوز حيود بصري",
      toolGratingDesc: "مصفوفة شقوق متقاربة تولد رتب الحيود",
      toolSingleSlit: "شق مفرد دقيق",
      toolSingleSlitDesc: "شق ضيق لدراسة حيود فرانهوفر",
      toolDoubleSlit: "شق مزدوج (تجربة يونغ)",
      toolDoubleSlitDesc: "شقان متوازيان لتوليد أهداب التداخل",
      toolAperture: "فتحة دائرية (ثقب إبرة)",
      toolApertureDesc: "فتحة دائرية لتوليد حلقات وقرص آيري",

      toolDetector: "كاشف ضوئي سيليكوني",
      toolDetectorDesc: "مقياس قدرة يقيس الطاقة الساقطة بالملي واط",
      toolScreen: "شاشة رصد واستقبال",
      toolScreenDesc: "شاشة بيضاء لعرض البقع وأهداب التداخل",
      toolRuler: "مسطرة بصرية مدرجة",
      toolRulerDesc: "مدرجة بالسنتيمتر والميليمتر للقياس المباشر",
      toolProtractor: "منقلة دائرية لقياس الزوايا",
      toolProtractorDesc: "مدرجة من 0° إلى 180° مع ميزة ربط الليزر",

      // Inspector Tabs
      tabProperties: "الخصائص",
      tabTheory: "النظرية والمعادلات",
      tabDetector: "بيانات الكاشف",
      tabQuiz: "الاختبار الذاتي",
      tabSettings: "الإعدادات",

      // Properties Labels
      propName: "اسم العنصر",
      propPosX: "الموضع س (ملم)",
      propPosY: "الموضع ص (ملم)",
      propRotation: "زاوية الدوران (°)",
      propWavelength: "الطول الموجي (نانومتر)",
      propPower: "القدرة (ملي واط)",
      propBeamWidth: "عرض الحزمة (بكسل)",
      propBeamDiv: "انفراج الحزمة (°)",
      propIsOn: "مفتاح تشغيل الليزر",
      propMirrorType: "نوع المرآة",
      propReflectivity: "معامل الانعكاس R",
      propFocalLength: "البعد البؤري (ملم)",
      propDiameter: "قطر العدسة (ملم)",
      propThickness: "سمك المركز (ملم)",
      propRefractiveIndex: "معامل الانكسار n",
      propGratingDensity: "كثافة المحزوز (خط/ملم)",
      propSlitWidth: "اتساع الشق (ميكرومتر)",
      propSlitSpacing: "المسافة بين الشقين",
      propAbsorption: "معامل الامتصاص α",
      propPrismSize: "حجم المنشور (ملم)",
      propCoreIndex: "معامل انكسار القلب (n₁)",
      propCladdingIndex: "معامل انكسار الغلاف (n₂)",
      propFiberLength: "طول الكيبل (بكسل)",
      propCoreDiameter: "قطر القلب (بكسل)",
      btnDuplicate: "نسخ العنصر",
      btnDelete: "حذف العنصر",

      // Modal & Selector
      modalExpTitle: "مكتبة التجارب العلمية (100 تجربة معتمدة)",
      searchPlaceholder: "ابحث بالاسم، الرقم، أو الأجهزة المستخدمة...",
      catAll: "جميع الفئات العلمية (001 - 100)",
      catFundamental: "1. البصريات الهندسية الأساسية (001-015)",
      catWave: "2. البصريات الموجية والتداخل (016-030)",
      catPolarization: "3. الاستقطاب والبصريات الكهرومغناطيسية (031-040)",
      catLaserPhysics: "4. فيزياء الليزر والرنانات البصرية (041-055)",
      catAdvancedLaser: "5. تكنولوجيا الليزر المتقدمة (056-065)",
      catNonlinear: "6. البصريات اللاخطية (066-075)",
      catSpectroscopy: "7. التحليل الطيفي والفوتونيات (076-085)",
      catMaterials: "8. التفاعل الليزري المادي والمواد (086-093)",
      catBiomedical: "9. التطبيقات الطبية والحيوية لليزر (094-100)",
      btnLoadExp: "تحميل في طاولة التجارب",

      // Status Bar
      statusCoords: "الإحداثيات",
      statusActiveExp: "التجربة الحالية",
      statusComponents: "عدد العناصر",
      statusRays: "الأشعة المحسوبة",
      statusFPS: "معدل الإطارات",
      statusFreeMode: "تجربة حرة (مختبر مفتوح)",

      // نصوص الواجهة الإضافية
      dropHint: "اسحب عنصراً من القائمة الجانبية أو اضغط عليه لإضافته إلى طاولة التجارب",
      noSelectionMsg: "اضغط على أي عنصر في طاولة التجارب لعرض وتعديل خصائصه هنا",
      theoryPlaceholder: "اختر تجربة لعرض نظريتها وقوانينها الرياضية وأهدافها التعليمية",
      quizPlaceholder: "اختر تجربة للبدء بالاختبار الذاتي والتقييم الفيزيائي",
      settingsCanvas: "إعدادات الطاولة البصرية",
      settingsRay: "إعدادات تتبع الأشعة الضوئية",
      settingGrid: "إظهار الشبكة المترية",
      settingSnap: "المحاذاة التلقائية للشبكة",
      settingGridSpacing: "تباعد الشبكة (ملم)",
      settingFocalPoints: "إظهار النقاط البؤرية",
      settingNormals: "إظهار الأعمدة المقامة",
      settingAngles: "إظهار قراءات الزوايا",
      settingRayDensity: "كثافة وتوازي الحزم",
      settingMaxDepth: "الحد الأقصى للانعكاسات",

      // مربع القانون الفيزيائي
      lawTitle: "القانون الفيزيائي للتجربة",
      lawExpBadge: "التجربة جاهزة للتشغيل",
      lawPrev: "‹ السابقة",
      lawNext: "التالية ›",
      lawFormulaLabel: "الصيغة الرياضية الأساسية",
      lawVariablesLabel: "دلالات الرموز والمتغيرات",
    }
  };

  let currentLang = 'ar'; // Default to Arabic as requested by user

  function getLang() {
    return currentLang;
  }

  function setLang(lang) {
    if (lang === 'ar' || lang === 'en') {
      currentLang = lang;
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.body.classList.toggle('rtl-layout', lang === 'ar');
    }
  }

  function t(key) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  }

  window.OpticalI18n = {
    TRANSLATIONS,
    getLang,
    setLang,
    t,
  };

})(typeof window !== 'undefined' ? window : this);
