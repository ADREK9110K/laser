/**
 * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY
 * University of Technology - Iraq
 * Interactive Quiz & Assessment System (Educational Stage 4)
 */

class QuizSystem {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentExp = null;
    this.userAnswers = {};
  }

  loadQuiz(experiment) {
    this.currentExp = experiment;
    this.userAnswers = {};
    this.render();
  }

  render() {
    if (!this.container) return;
    if (!this.currentExp || !this.currentExp.quiz || this.currentExp.quiz.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <p>${I18N.t('navResearch')}: Complete the simulation and measurements first to unlock the analytical assessment.</p>
        </div>
      `;
      return;
    }

    const lang = I18N.currentLang;
    const isAr = lang === 'ar';
    const questions = this.currentExp.quiz;

    let html = `
      <div class="quiz-wrapper">
        <div class="quiz-header">
          <h4>${isAr ? "اختبار التحقق العلمي والمفاهيم" : "Scientific Verification & Conceptual Quiz"}</h4>
          <span class="quiz-count">${questions.length} ${isAr ? "سؤال" : "Questions"}</span>
        </div>
    `;

    questions.forEach((q, qIndex) => {
      const qText = isAr && q.qAr ? q.qAr : q.q;
      const answered = this.userAnswers[qIndex] !== undefined;
      const userChoice = this.userAnswers[qIndex];
      const isCorrect = userChoice === q.correct;

      html += `
        <div class="quiz-item ${answered ? (isCorrect ? 'correct' : 'incorrect') : ''}" data-index="${qIndex}">
          <div class="quiz-question">
            <span class="q-num">Q${qIndex + 1}.</span>
            <span class="q-text">${qText}</span>
          </div>
          <div class="quiz-options">
      `;

      q.options.forEach((opt, optIndex) => {
        let optClass = "quiz-opt-btn";
        if (answered) {
          if (optIndex === q.correct) optClass += " opt-correct";
          else if (optIndex === userChoice) optClass += " opt-wrong";
        }

        html += `
          <button class="${optClass}" onclick="window.quizSystem.submitAnswer(${qIndex}, ${optIndex})" ${answered ? 'disabled' : ''}>
            <span class="opt-indicator">${String.fromCharCode(65 + optIndex)}</span>
            <span class="opt-label">${opt}</span>
          </button>
        `;
      });

      html += `</div>`;

      if (answered) {
        html += `
          <div class="quiz-explanation ${isCorrect ? 'exp-correct' : 'exp-wrong'}">
            <strong>${isCorrect ? (isAr ? "✓ إجابة صحيحة!" : "✓ Correct Answer!") : (isAr ? "✗ إجابة غير دقيقة" : "✗ Incorrect")}</strong>
            <p>${q.explanation}</p>
          </div>
        `;
      }

      html += `</div>`;
    });

    html += `</div>`;
    this.container.innerHTML = html;
  }

  submitAnswer(qIndex, optIndex) {
    this.userAnswers[qIndex] = optIndex;
    
    // Save completion progress to localStorage
    if (this.currentExp) {
      try {
        const completed = JSON.parse(localStorage.getItem('completed_experiments') || '{}');
        completed[this.currentExp.id] = true;
        localStorage.setItem('completed_experiments', JSON.stringify(completed));
        window.dispatchEvent(new CustomEvent('experimentCompleted', { detail: { id: this.currentExp.id } }));
      } catch (e) {
        console.error(e);
      }
    }

    this.render();
  }
}

window.QuizSystem = QuizSystem;
