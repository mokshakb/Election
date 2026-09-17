/**
 * Election Awareness Platform - EVM & VVPAT Simulator Logic
 * Safe, educational, non-partisan interactive voting simulation
 */

class EVMSimulator {
  constructor() {
    this.candidates = [
      { sl: 1, nameKey: "c1Name", partyKey: "c1Party", symbol: "📖", color: "#3b82f6" },
      { sl: 2, nameKey: "c2Name", partyKey: "c2Party", symbol: "💡", color: "#f59e0b" },
      { sl: 3, nameKey: "c3Name", partyKey: "c3Party", symbol: "🌳", color: "#10b981" },
      { sl: 4, nameKey: "c4Name", partyKey: "c4Party", symbol: "🚲", color: "#8b5cf6" },
      { sl: 5, nameKey: "c5Name", partyKey: "c5Party", symbol: "🌅", color: "#f97316" },
      { sl: 6, nameKey: "c6Name", partyKey: "c6Party", symbol: "❌", color: "#ef4444" }
    ];

    this.isVotingInProgress = false;
    this.hasVoted = false;
    this.countdownTimer = null;
    this.totalPracticeVotes = parseInt(localStorage.getItem("totalPracticeVotes") || "0", 10);

    this.initElements();
  }

  initElements() {
    this.ballotContainer = document.getElementById("evmBallotRows");
    this.statusLed = document.getElementById("cuStatusLed");
    this.statusText = document.getElementById("cuStatusText");
    this.vvpatWindow = document.getElementById("vvpatWindow");
    this.vvpatSlip = document.getElementById("vvpatSlip");
    this.slipSerial = document.getElementById("slipSerial");
    this.slipSymbol = document.getElementById("slipSymbol");
    this.slipName = document.getElementById("slipName");
    this.vvpatTimer = document.getElementById("vvpatTimer");
    this.vvpatStatus = document.getElementById("vvpatStatus");
    this.btnReset = document.getElementById("btnResetEVM");
    this.votesCountDisplay = document.getElementById("votesCountDisplay");

    if (this.btnReset) {
      this.btnReset.addEventListener("click", () => this.resetSimulation());
    }

    this.updateVotesCounter();
    this.renderBallotRows();
  }

  renderBallotRows() {
    if (!this.ballotContainer) return;
    const currentLang = window.currentLang || "en";
    const dict = translations[currentLang] || translations.en;

    this.ballotContainer.innerHTML = "";

    this.candidates.forEach((cand) => {
      const row = document.createElement("div");
      row.className = "ballot-row";
      row.setAttribute("data-sl", cand.sl);

      const name = dict[cand.nameKey];
      const party = dict[cand.partyKey];

      row.innerHTML = `
        <div class="ballot-sl-no">${cand.sl}</div>
        <div class="candidate-meta">
          <span class="candidate-name">${name}</span>
          <span class="candidate-party">${party}</span>
        </div>
        <div class="candidate-symbol-box" title="Candidate Symbol" aria-label="Symbol: ${cand.symbol}">
          ${cand.symbol}
        </div>
        <div class="ballot-led-col">
          <div class="ballot-led" id="led-cand-${cand.sl}" aria-hidden="true"></div>
        </div>
        <div class="ballot-button-col">
          <button type="button" 
                  class="btn-vote-blue" 
                  id="btn-cand-${cand.sl}" 
                  aria-label="Vote for candidate ${cand.sl}: ${name}"
                  title="Cast Vote">
            ●
          </button>
        </div>
      `;

      const voteBtn = row.querySelector(".btn-vote-blue");
      voteBtn.addEventListener("click", () => this.castVote(cand));

      this.ballotContainer.appendChild(row);
    });
  }

  castVote(candidate) {
    if (this.isVotingInProgress || this.hasVoted) return;

    this.isVotingInProgress = true;
    const currentLang = window.currentLang || "en";
    const dict = translations[currentLang] || translations.en;

    // 1. Play tactile button click
    if (window.soundSystem) {
      window.soundSystem.playClickTone();
    }

    // 2. Turn on red LED next to chosen candidate
    const activeLed = document.getElementById(`led-cand-${candidate.sl}`);
    if (activeLed) {
      activeLed.classList.add("active");
    }

    // 3. Disable all blue vote buttons
    const allBtns = this.ballotContainer.querySelectorAll(".btn-vote-blue");
    allBtns.forEach(btn => btn.disabled = true);

    // 4. Update Control Unit indicator to BUSY
    if (this.statusLed) {
      this.statusLed.classList.add("busy");
    }
    if (this.statusText) {
      this.statusText.textContent = dict.cuBusyText || "RECORDING VOTE...";
    }

    // 5. Play authentic EVM long buzzer beep (~2.5s)
    if (window.soundSystem) {
      window.soundSystem.playEVMBuzzer(2.5);
    }

    // 6. Populate and illuminate VVPAT window with slip
    this.showVVPATSlip(candidate, dict);

    // 7. Increment vote count
    this.totalPracticeVotes++;
    localStorage.setItem("totalPracticeVotes", this.totalPracticeVotes.toString());
    this.updateVotesCounter();

    // 8. Unlock Badge 5 ("Certified Voter")
    if (window.app && typeof window.app.unlockBadge === "function") {
      window.app.unlockBadge("badge5");
      // Pre-fill user certificate
      window.app.markPracticeDone();
    }
  }

  showVVPATSlip(candidate, dict) {
    if (!this.vvpatWindow || !this.vvpatSlip) return;

    // Fill details into paper slip
    if (this.slipSerial) this.slipSerial.textContent = candidate.sl;
    if (this.slipSymbol) this.slipSymbol.textContent = candidate.symbol;
    if (this.slipName) this.slipName.textContent = dict[candidate.nameKey];

    // Light up window
    this.vvpatWindow.classList.add("illuminated");
    this.vvpatSlip.style.display = "flex";
    this.vvpatSlip.classList.remove("dropping");

    // Start 7-second countdown display
    let secondsLeft = 7;
    if (this.vvpatTimer) {
      this.vvpatTimer.textContent = `⏱️ ${(dict.vvpatTimerText || "Viewing Slip: 7s").replace("7", secondsLeft.toString())}`;
    }
    if (this.vvpatStatus) {
      this.vvpatStatus.textContent = dict.vvpatIdleMsg;
    }

    clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      secondsLeft--;
      if (this.vvpatTimer) {
        this.vvpatTimer.textContent = `⏱️ ${(dict.vvpatTimerText || "Viewing Slip: 7s").replace("7", secondsLeft.toString())}`;
      }

      if (secondsLeft <= 0) {
        clearInterval(this.countdownTimer);
        this.dropVVPATSlip(dict);
      }
    }, 1000);
  }

  dropVVPATSlip(dict) {
    if (!this.vvpatSlip) return;

    // Animate slip dropping into bottom compartment
    this.vvpatSlip.classList.add("dropping");

    setTimeout(() => {
      this.vvpatSlip.style.display = "none";
      if (this.vvpatWindow) {
        this.vvpatWindow.classList.remove("illuminated");
      }

      if (this.vvpatTimer) {
        this.vvpatTimer.textContent = "✅ " + (dict.vvpatSlipCutMsg || "Vote recorded safely!");
      }
      if (this.vvpatStatus) {
        this.vvpatStatus.textContent = dict.vvpatSlipCutMsg;
      }

      // Finish vote state
      this.hasVoted = true;
      this.isVotingInProgress = false;

      // Play success chime
      if (window.soundSystem) {
        window.soundSystem.playSuccessChime();
      }
    }, 800);
  }

  resetSimulation() {
    clearInterval(this.countdownTimer);
    this.isVotingInProgress = false;
    this.hasVoted = false;

    const currentLang = window.currentLang || "en";
    const dict = translations[currentLang] || translations.en;

    // Reset LEDs and buttons
    if (this.ballotContainer) {
      const allLeds = this.ballotContainer.querySelectorAll(".ballot-led");
      allLeds.forEach(led => led.classList.remove("active"));

      const allBtns = this.ballotContainer.querySelectorAll(".btn-vote-blue");
      allBtns.forEach(btn => btn.disabled = false);
    }

    // Reset CU status
    if (this.statusLed) {
      this.statusLed.classList.remove("busy");
    }
    if (this.statusText) {
      this.statusText.textContent = dict.cuReadyText || "STATUS: READY TO VOTE";
    }

    // Reset VVPAT
    if (this.vvpatSlip) {
      this.vvpatSlip.style.display = "none";
      this.vvpatSlip.classList.remove("dropping");
    }
    if (this.vvpatWindow) {
      this.vvpatWindow.classList.remove("illuminated");
    }
    if (this.vvpatTimer) {
      this.vvpatTimer.textContent = "⏱️ " + (dict.vvpatTimerText || "Viewing Slip: 7s");
    }
    if (this.vvpatStatus) {
      this.vvpatStatus.textContent = dict.vvpatIdleMsg;
    }
  }

  updateVotesCounter() {
    if (this.votesCountDisplay) {
      this.votesCountDisplay.textContent = this.totalPracticeVotes.toString();
    }
  }
}

// Global EVM simulator instance
window.initEVM = function() {
  window.evm = new EVMSimulator();
};
