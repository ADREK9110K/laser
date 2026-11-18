/**
 * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY
 * University of Technology - Iraq
 * Academic Laboratory Report Generator
 */

const ReportGenerator = {
  generateReportHTML(experiment, activeParams, calculatedResults, studentName = "Eng. Student", stage = "3rd Year Photonics") {
    const isAr = I18N.currentLang === 'ar';
    const dateStr = new Date().toLocaleDateString(isAr ? 'ar-IQ' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const expTitle = isAr && experiment.titleAr ? experiment.titleAr : experiment.title;

    let paramsRows = "";
    for (const [k, v] of Object.entries(activeParams)) {
      paramsRows += `
        <tr>
          <td style="padding: 6px 12px; border: 1px solid #cbd5e1; font-weight: 600;">${k}</td>
          <td style="padding: 6px 12px; border: 1px solid #cbd5e1; font-family: monospace;">${v}</td>
        </tr>
      `;
    }

    let resultsRows = "";
    if (calculatedResults) {
      for (const [k, v] of Object.entries(calculatedResults)) {
        if (typeof v === 'object' && v !== null) continue;
        resultsRows += `
          <tr>
            <td style="padding: 6px 12px; border: 1px solid #cbd5e1; font-weight: 600;">${k}</td>
            <td style="padding: 6px 12px; border: 1px solid #cbd5e1; font-family: monospace; color: #0284c7;">${v}</td>
          </tr>
        `;
      }
    }

    let equipmentList = "";
    if (experiment.equipment) {
      equipmentList = experiment.equipment.map(e => `<li>${e}</li>`).join('');
    }

    let equationsBlock = "";
    if (experiment.equations) {
      equationsBlock = experiment.equations.map(eq => `
        <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 10px 14px; margin-bottom: 8px;">
          <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${eq.label}</div>
          <div style="font-family: 'JetBrains Mono', monospace; color: #0369a1; font-size: 14px; margin: 4px 0;">${eq.latex}</div>
          <div style="font-size: 11px; color: #64748b;">${eq.desc}</div>
        </div>
      `).join('');
    }

    return `
      <div id="print-report-modal" class="report-document" style="font-family: 'Cairo', sans-serif; color: #0f172a; max-width: 820px; margin: 0 auto; padding: 35px; background: #ffffff; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        
        <!-- Header with University Crest -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 18px; margin-bottom: 25px;">
          <div>
            <div style="font-size: 18px; font-weight: 800; color: #0369a1;">${isAr ? "الجامعة التكنولوجية – بغداد" : "University of Technology – Iraq"}</div>
            <div style="font-size: 14px; font-weight: 600; color: #334155;">${isAr ? "قسم هندسة الليزر والالكترونيات البصرية" : "Department of Laser Science & Technology"}</div>
            <div style="font-size: 12px; color: #64748b;">${isAr ? "المختبر الافتراضي التفاعلي المتقدم" : "Advanced Virtual Interactive Optical Laboratory"}</div>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; background: #0284c7; color: #ffffff; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 13px;">
              EXP-${experiment.num}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 5px;">${dateStr}</div>
          </div>
        </div>

        <!-- Title Block -->
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">${expTitle}</h2>
          <div style="font-size: 13px; color: #0284c7; font-weight: 600;">${experiment.phenomenon || ""}</div>
        </div>

        <!-- Student Metadata Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f1f5f9; padding: 14px; border-radius: 6px; margin-bottom: 25px; font-size: 13px;">
          <div><strong>${isAr ? "اسم الطالب / الباحث:" : "Student Name:"}</strong> ${studentName}</div>
          <div><strong>${isAr ? "المرحلة الدراسية:" : "Academic Level:"}</strong> ${stage}</div>
          <div><strong>${isAr ? "التخصص:" : "Specialization:"}</strong> Laser & Optical Engineering</div>
          <div><strong>${isAr ? "الحالة التقييمية:" : "Assessment Status:"}</strong> Verified Simulation Data</div>
        </div>

        <!-- Section: Objective -->
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 14px; font-weight: 700; color: #0369a1; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
            ${isAr ? "١. الهدف العلمي من التجربة" : "1. Scientific Objective"}
          </h4>
          <p style="font-size: 13px; color: #334155; margin: 0;">${experiment.objective}</p>
        </div>

        <!-- Section: Theoretical Background -->
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 14px; font-weight: 700; color: #0369a1; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
            ${isAr ? "٢. الأساس النظري والقوانين الفيزيائية" : "2. Theoretical Principles"}
          </h4>
          <p style="font-size: 13px; color: #334155; margin: 0 0 10px 0;">${experiment.theory}</p>
          ${equationsBlock}
        </div>

        <!-- Section: Equipment -->
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 14px; font-weight: 700; color: #0369a1; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
            ${isAr ? "٣. الأجهزة والمكونات البصرية المستخدمة" : "3. Equipment & Optical Setup"}
          </h4>
          <ul style="font-size: 13px; color: #334155; margin: 0; padding-left: 20px;">
            ${equipmentList}
          </ul>
        </div>

        <!-- Section: Experimental Data & Dynamic Results -->
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 14px; font-weight: 700; color: #0369a1; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
            ${isAr ? "٤. المعاملات والنتائج المحسوبة" : "4. Parameters & Calculated Results"}
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
            <div>
              <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px;">${isAr ? "متغيرات الإدخال التجريبية" : "Input Parameters"}</div>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                ${paramsRows}
              </table>
            </div>
            <div>
              <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px;">${isAr ? "النتائج الفيزيائية المستخرجة" : "Calculated Outputs"}</div>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                ${resultsRows}
              </table>
            </div>
          </div>
        </div>

        <!-- Section: Discussion & Conclusion -->
        <div style="margin-bottom: 25px;">
          <h4 style="font-size: 14px; font-weight: 700; color: #0369a1; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
            ${isAr ? "٥. الاستنتاج العلمي ومصادر الخطأ التجريبي" : "5. Discussion & Error Analysis"}
          </h4>
          <p style="font-size: 13px; color: #334155; margin: 0;">
            ${isAr ? 
              "أظهرت نتائج المحاكاة تطابقاً تاماً مع النماذج التحليلية الفيزيائية النظرية. تشمل مصادر الخطأ الشائعة في المختبرات الفعلية: أخطاء محاذاة زوايا المرايا (Kinematic Mount Misalignment)، الضوضاء الحرارية في الكواشف، وحيود الحواف." :
              "The virtual simulation outputs closely correspond to theoretical analytical solutions. In a physical laboratory setting, primary sources of experimental error include microradian mirror mount misalignment, detector dark current thermal noise, and optical surface wave aberrations."}
          </p>
        </div>

        <!-- Signature Footer -->
        <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 12px; color: #64748b;">
          <div>${isAr ? "توقيع الطالب:" : "Student Signature:"} ___________________</div>
          <div>${isAr ? "اعتماد المشرف الأكاديمي:" : "Instructor Approval:"} ___________________</div>
        </div>

      </div>
    `;
  },

  openReportModal(experiment, activeParams, calculatedResults) {
    const reportHtml = this.generateReportHTML(experiment, activeParams, calculatedResults);
    
    let modal = document.getElementById('report-view-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'report-view-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog-large">
        <div class="modal-header">
          <div class="modal-title">${I18N.t('reportTitle')}</div>
          <button class="btn-close" onclick="document.getElementById('report-view-modal').style.display='none'">&times;</button>
        </div>
        <div class="modal-body">
          ${reportHtml}
        </div>
        <div class="modal-footer">
          <button class="btn-primary" onclick="window.print()">
            <span class="btn-icon">🖨️</span> ${I18N.t('btnPrintReport')}
          </button>
          <button class="btn-secondary" onclick="document.getElementById('report-view-modal').style.display='none'">
            Close
          </button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }
};

window.ReportGenerator = ReportGenerator;
