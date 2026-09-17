/**
 * Election Awareness Platform - Main Application Logic
 * State management, Guided Journey, Language Switching, Accessibility, & Badges
 */

class ElectionApp {
  constructor() {
    this.currentLang = localStorage.getItem("election_lang") || "en";
    window.currentLang = this.currentLang;

    // Accessibility state
    this.fontSizeState = "normal"; // 'normal', 'large', 'xlarge'
    this.contrastState = "normal"; // 'normal', 'dark', 'yellow'

    // Guided journey state
    this.isGuidedMode = false;
    this.currentStep = 1;
    this.totalSteps = 6;

    // Badges state
    this.badges = JSON.parse(localStorage.getItem("election_badges") || "{}");

    // Checklist state
    this.checklist = JSON.parse(localStorage.getItem("election_checklist") || "{}");

    // Quiz state
    this.quizAnswers = { q1: null, q2: null, q3: null };

    this.init();
  }

  init() {
    this.bindDOM();
    this.applyLanguage(this.currentLang);
    this.initAccessibility();
    this.initChecklist();
    this.initEligibilityQuiz();
    this.initAccordion();
    this.initCertificate();
    this.restoreBadges();
    this.initScrollSpy();

    // Auto unlock Badge 1 upon first scroll / view of section 1
    this.unlockBadge("badge1");
  }

  bindDOM() {
    // Language Switcher
    this.btnLangToggle = document.getElementById("btnLangToggle");
    if (this.btnLangToggle) {
      this.btnLangToggle.addEventListener("click", () => this.toggleLanguage());
    }

    // Guided Mode Triggers
    this.btnNewVoterTop = document.getElementById("btnNewVoterTop");
    this.btnHeroStart = document.getElementById("btnHeroStart");
    if (this.btnNewVoterTop) {
      this.btnNewVoterTop.addEventListener("click", () => this.startGuidedJourney(1));
    }
    if (this.btnHeroStart) {
      this.btnHeroStart.addEventListener("click", () => this.startGuidedJourney(1));
    }

    // Guided Dock Navigation Buttons
    this.dockContainer = document.getElementById("wizardDock");
    this.btnDockBack = document.getElementById("btnDockBack");
    this.btnDockNext = document.getElementById("btnDockNext");
    this.btnDockRepeat = document.getElementById("btnDockRepeat");
    this.btnDockExit = document.getElementById("btnDockExit");
    this.dockStepText = document.getElementById("dockStepText");

    if (this.btnDockBack) {
      this.btnDockBack.addEventListener("click", () => this.prevStep());
    }
    if (this.btnDockNext) {
      this.btnDockNext.addEventListener("click", () => this.nextStep());
    }
    if (this.btnDockRepeat) {
      this.btnDockRepeat.addEventListener("click", () => this.repeatCurrentStepAudio());
    }
    if (this.btnDockExit) {
      this.btnDockExit.addEventListener("click", () => this.exitGuidedMode());
    }

    // Journey Stepper Indicators
    this.stepIndicators = document.querySelectorAll(".step-indicator");
    this.stepIndicators.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const step = parseInt(btn.getAttribute("data-step"), 10);
        if (step) {
          this.goToStep(step);
        }
      });
    });

    // Practice button in hero
    const btnHeroPractice = document.getElementById("btnHeroPractice");
    if (btnHeroPractice) {
      btnHeroPractice.addEventListener("click", () => {
        this.goToStep(6);
      });
    }

    // Listen buttons across all sections
    const listenButtons = document.querySelectorAll(".btn-listen");
    listenButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const sectionId = btn.getAttribute("data-target-section");
        const speechKey = btn.getAttribute("data-speech-key");
        const dict = translations[this.currentLang] || translations.en;
        const textToSpeak = dict[speechKey] || "";
        const sectionEl = document.getElementById(sectionId);

        if (window.soundSystem) {
          window.soundSystem.speakText(textToSpeak, this.currentLang, btn, sectionEl);
        }
      });
    });
  }

  // ==========================================================================
  // Language Switching & Text Injection
  // ==========================================================================
  toggleLanguage() {
    this.currentLang = this.currentLang === "en" ? "kn" : "en";
    window.currentLang = this.currentLang;
    localStorage.setItem("election_lang", this.currentLang);

    // Play click sound
    if (window.soundSystem) {
      window.soundSystem.playClickTone();
      window.soundSystem.stopSpeech(); // Stop speech if speaking in other language
    }

    this.applyLanguage(this.currentLang);

    // Re-render EVM candidate labels
    if (window.evm) {
      window.evm.renderBallotRows();
    }
  }

  applyLanguage(lang) {
    const dict = translations[lang] || translations.en;

    // Update document language
    document.documentElement.lang = lang;

    // Update elements with data-i18n
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Update placeholders
    const placeholders = document.querySelectorAll("[data-i18n-placeholder]");
    placeholders.forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) {
        el.setAttribute("placeholder", dict[key]);
      }
    });

    // Update language button text
    if (this.btnLangToggle) {
      this.btnLangToggle.innerHTML = `🌐 ${dict.langName}`;
    }

    // Update guided dock counter text
    this.updateDockUI();

    // Re-evaluate eligibility banner text if quiz was answered
    this.evaluateEligibility();
  }

  // ==========================================================================
  // Accessibility Toolbar
  // ==========================================================================
  initAccessibility() {
    const btnContrast = document.getElementById("btnContrastToggle");
    const btnFontMinus = document.getElementById("btnFontDecrease");
    const btnFontNormal = document.getElementById("btnFontNormal");
    const btnFontPlus = document.getElementById("btnFontIncrease");
    const btnSound = document.getElementById("btnSoundToggle");

    if (btnContrast) {
      btnContrast.addEventListener("click", () => {
        if (this.contrastState === "normal") {
          document.body.classList.remove("theme-high-contrast-yellow");
          document.body.classList.add("theme-high-contrast-dark");
          this.contrastState = "dark";
          btnContrast.classList.add("active");
        } else if (this.contrastState === "dark") {
          document.body.classList.remove("theme-high-contrast-dark");
          document.body.classList.add("theme-high-contrast-yellow");
          this.contrastState = "yellow";
        } else {
          document.body.classList.remove("theme-high-contrast-dark", "theme-high-contrast-yellow");
          this.contrastState = "normal";
          btnContrast.classList.remove("active");
        }
      });
    }

    if (btnFontMinus) {
      btnFontMinus.addEventListener("click", () => {
        document.body.classList.remove("font-large", "font-xlarge");
        this.fontSizeState = "normal";
        this.updateFontBtnStates("minus");
      });
    }

    if (btnFontNormal) {
      btnFontNormal.addEventListener("click", () => {
        document.body.classList.remove("font-large", "font-xlarge");
        this.fontSizeState = "normal";
        this.updateFontBtnStates("normal");
      });
    }

    if (btnFontPlus) {
      btnFontPlus.addEventListener("click", () => {
        if (this.fontSizeState === "normal") {
          document.body.classList.add("font-large");
          this.fontSizeState = "large";
          this.updateFontBtnStates("plus");
        } else if (this.fontSizeState === "large") {
          document.body.classList.remove("font-large");
          document.body.classList.add("font-xlarge");
          this.fontSizeState = "xlarge";
          this.updateFontBtnStates("plus");
        }
      });
    }

    if (btnSound) {
      btnSound.addEventListener("click", () => {
        if (window.soundSystem) {
          const isSoundOn = window.soundSystem.toggleSoundFX();
          btnSound.classList.toggle("active", isSoundOn);
          btnSound.innerHTML = isSoundOn ? "🔊 Sound FX: ON" : "🔇 Sound FX: OFF";
        }
      });
    }
  }

  updateFontBtnStates(activeType) {
    const btnFontNormal = document.getElementById("btnFontNormal");
    const btnFontPlus = document.getElementById("btnFontIncrease");
    if (btnFontNormal) btnFontNormal.classList.toggle("active", activeType === "normal");
    if (btnFontPlus) btnFontPlus.classList.toggle("active", activeType === "plus");
  }

  // ==========================================================================
  // Guided Journey Stepper Navigation
  // ==========================================================================
  startGuidedJourney(stepNumber = 1) {
    this.isGuidedMode = true;
    if (this.dockContainer) {
      this.dockContainer.style.display = "flex";
    }
    this.goToStep(stepNumber);
  }

  exitGuidedMode() {
    this.isGuidedMode = false;
    if (this.dockContainer) {
      this.dockContainer.style.display = "none";
    }
    if (window.soundSystem) {
      window.soundSystem.stopSpeech();
    }
  }

  goToStep(step) {
    if (step < 1) step = 1;
    if (step > this.totalSteps) step = this.totalSteps;

    this.currentStep = step;

    // Scroll smoothly to the target section
    const targetSection = document.getElementById(`section-${step}`);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Auto-trigger narration in guided mode for ease of beginners
    if (this.isGuidedMode) {
      const listenBtn = targetSection ? targetSection.querySelector(".btn-listen") : null;
      if (listenBtn) {
        setTimeout(() => {
          const speechKey = listenBtn.getAttribute("data-speech-key");
          const dict = translations[this.currentLang] || translations.en;
          if (window.soundSystem) {
            window.soundSystem.speakText(dict[speechKey] || "", this.currentLang, listenBtn, targetSection);
          }
        }, 500);
      }
    }

    this.updateStepperProgress();
    this.updateDockUI();

    // Check unlocks
    if (step === 1) this.unlockBadge("badge1");
    if (step === 4) this.unlockBadge("badge4");
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.goToStep(this.currentStep + 1);
    } else {
      // Completed all steps! Jump to certificate
      const certSection = document.getElementById("section-7");
      if (certSection) {
        certSection.scrollIntoView({ behavior: "smooth" });
      }
      this.exitGuidedMode();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  repeatCurrentStepAudio() {
    const targetSection = document.getElementById(`section-${this.currentStep}`);
    if (targetSection) {
      const listenBtn = targetSection.querySelector(".btn-listen");
      if (listenBtn) {
        const speechKey = listenBtn.getAttribute("data-speech-key");
        const dict = translations[this.currentLang] || translations.en;
        if (window.soundSystem) {
          window.soundSystem.speakText(dict[speechKey] || "", this.currentLang, listenBtn, targetSection);
        }
      }
    }
  }

  updateStepperProgress() {
    this.stepIndicators.forEach((btn) => {
      const step = parseInt(btn.getAttribute("data-step"), 10);
      btn.classList.remove("active");
      if (step === this.currentStep) {
        btn.classList.add("active");
      }
      if (step < this.currentStep) {
        btn.classList.add("completed");
      }
    });

    const fillPercent = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
    const barFill = document.getElementById("stepperBarFill");
    if (barFill) {
      barFill.style.width = `${fillPercent}%`;
    }
  }

  updateDockUI() {
    const dict = translations[this.currentLang] || translations.en;
    if (this.dockStepText) {
      this.dockStepText.textContent = `${dict.dockStep} ${this.currentStep} ${dict.dockOf} ${this.totalSteps}`;
    }

    if (this.btnDockNext) {
      this.btnDockNext.textContent = this.currentStep === this.totalSteps ? dict.btnFinish : dict.btnNext;
    }

    if (this.btnDockBack) {
      this.btnDockBack.style.visibility = this.currentStep === 1 ? "hidden" : "visible";
    }
  }

  initScrollSpy() {
    window.addEventListener("scroll", () => {
      if (this.isGuidedMode) return; // In guided mode, user moves via wizard buttons
      const scrollPos = window.scrollY + 200;
      for (let i = 1; i <= this.totalSteps; i++) {
        const sec = document.getElementById(`section-${i}`);
        if (sec) {
          const top = sec.offsetTop;
          const height = sec.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            this.currentStep = i;
            this.updateStepperProgress();
            break;
          }
        }
      }
    });
  }

  // ==========================================================================
  // Interactive Eligibility Quiz
  // ==========================================================================
  initEligibilityQuiz() {
    const quizButtons = document.querySelectorAll(".quiz-btn");
    quizButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const question = btn.getAttribute("data-q"); // 'q1', 'q2', 'q3'
        const value = btn.getAttribute("data-val") === "yes";

        this.quizAnswers[question] = value;

        // Toggle selected styling
        const parent = btn.parentElement;
        parent.querySelectorAll(".quiz-btn").forEach(b => {
          b.classList.remove("selected-yes", "selected-no");
        });

        if (value) {
          btn.classList.add("selected-yes");
        } else {
          btn.classList.add("selected-no");
        }

        if (window.soundSystem) {
          window.soundSystem.playClickTone();
        }

        this.evaluateEligibility();
      });
    });
  }

  evaluateEligibility() {
    const { q1, q2, q3 } = this.quizAnswers;
    const banner = document.getElementById("eligibilityResultBanner");
    if (!banner) return;

    // Check if all 3 questions answered
    if (q1 === null || q2 === null || q3 === null) {
      banner.style.display = "none";
      return;
    }

    const dict = translations[this.currentLang] || translations.en;

    banner.classList.remove("success", "warning");

    if (q1 === true && q2 === true && q3 === true) {
      banner.className = "eligibility-result-banner success";
      banner.textContent = dict.quizSuccess;
      this.unlockBadge("badge2");
    } else if (q1 === true && q2 === true && q3 === false) {
      banner.className = "eligibility-result-banner warning";
      banner.textContent = dict.quizNeedReg;
      this.unlockBadge("badge2");
    } else {
      banner.className = "eligibility-result-banner warning";
      banner.textContent = dict.quizNotEligible;
    }
  }

  // ==========================================================================
  // Interactive Pre-Voting Checklist
  // ==========================================================================
  initChecklist() {
    const checkItems = document.querySelectorAll(".check-item");
    checkItems.forEach((item) => {
      const chkId = item.getAttribute("data-chk-id");

      // Restore checked state
      if (this.checklist[chkId]) {
        item.classList.add("completed");
        const box = item.querySelector(".check-box-visual");
        if (box) box.textContent = "✓";
      }

      item.addEventListener("click", () => {
        const isCompleted = item.classList.toggle("completed");
        this.checklist[chkId] = isCompleted;
        localStorage.setItem("election_checklist", JSON.stringify(this.checklist));

        const box = item.querySelector(".check-box-visual");
        if (box) {
          box.textContent = isCompleted ? "✓" : "";
        }

        if (window.soundSystem) {
          window.soundSystem.playClickTone();
        }

        // Check if all checked -> unlock Badge 3
        const allChecked = Array.from(checkItems).every(i => i.classList.contains("completed"));
        if (allChecked) {
          this.unlockBadge("badge3");
        }
      });
    });
  }

  // ==========================================================================
  // Micro-Achievements & Badges System
  // ==========================================================================
  unlockBadge(badgeKey) {
    if (this.badges[badgeKey]) return; // Already unlocked

    this.badges[badgeKey] = true;
    localStorage.setItem("election_badges", JSON.stringify(this.badges));

    const badgeEl = document.getElementById(badgeKey);
    if (badgeEl) {
      badgeEl.classList.add("unlocked");
      badgeEl.style.animation = "pulse 0.6s ease";
    }

    if (window.soundSystem) {
      window.soundSystem.playSuccessChime();
    }
  }

  restoreBadges() {
    for (let i = 1; i <= 5; i++) {
      const key = `badge${i}`;
      if (this.badges[key]) {
        const el = document.getElementById(key);
        if (el) el.classList.add("unlocked");
      }
    }
  }

  markPracticeDone() {
    this.unlockBadge("badge5");
  }

  // ==========================================================================
  // Interactive Certificate Generator
  // ==========================================================================
  initCertificate() {
    const certInput = document.getElementById("certVoterNameInput");
    const certDisplayName = document.getElementById("certDisplayName");
    const btnPrintCert = document.getElementById("btnPrintCert");

    if (certInput && certDisplayName) {
      certInput.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        certDisplayName.textContent = val || "Your Name Here";
      });
    }

    if (btnPrintCert) {
      btnPrintCert.addEventListener("click", () => {
        window.print();
      });
    }
  }

  // ==========================================================================
  // Accordion (FAQ & Myth Busters)
  // ==========================================================================
  initAccordion() {
    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach((item) => {
      const qBtn = item.querySelector(".faq-question");
      if (qBtn) {
        qBtn.addEventListener("click", () => {
          const isOpen = item.classList.contains("open");
          // Close others
          faqItems.forEach(i => i.classList.remove("open"));
          if (!isOpen) {
            item.classList.add("open");
          }
          if (window.soundSystem) {
            window.soundSystem.playClickTone();
          }
        });
      }
    });
  }
}

// Instantiate and initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new ElectionApp();
  if (typeof window.initEVM === "function") {
    window.initEVM();
  }
});
