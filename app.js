/**
 * UniPredict Main Application Controller
 * Handles SPA Navigation, Form Submissions, Modals, Filters & Interactive State
 */

document.addEventListener("DOMContentLoaded", () => {
  UniPredictApp.init();
});

class UniPredictApp {
  static currentProfile = null;
  static currentPrediction = null;
  static selectedCompareIds = new Set();

  static plannerChecklist = [
    { id: "task-gpa", title: "Official University Transcripts & GPA Verification", done: true },
    { id: "task-gre", title: "Standardized Testing (GRE / SAT / GMAT Scores Submitted)", done: true },
    { id: "task-toefl", title: "English Language Proficiency (TOEFL iBT / IELTS Official Report)", done: false },
    { id: "task-sop", title: "Statement of Purpose (SOP) Tailored & Proofread", done: false },
    { id: "task-lor", title: "3 Academic & Professional Letters of Recommendation (LOR)", done: false },
    { id: "task-cv", title: "Technical Resume & Project Portfolio Github Links", done: true },
    { id: "task-finance", title: "Financial Proof of Funds & Bank Solvency Statement", done: false },
    { id: "task-submit", title: "Final Application Form Submission & Portal Fee Payment", done: false }
  ];

  static init() {
    this.initTheme();
    this.bindNavigation();
    this.bindFormListeners();
    this.bindHistoryEvents();
    this.populateTargetUniversityDropdown();
    this.loadDefaultProfile();
    this.renderDashboardOverview();
    this.renderHistoryTable();
    this.renderAnalyticsPage();
    this.initRangeSliders();
    this.initWhatIfWidget();
    this.initModalListeners();
    this.renderUniversityExplorer();
    this.initAnimations();
  }

  /**
   * Theme Switcher Initialization & Handler
   */
  static initTheme() {
    const savedTheme = localStorage.getItem("unipredict_theme") || "dark";
    this.setTheme(savedTheme);

    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        this.setTheme(newTheme);
        if (typeof this.showToast === "function") {
          this.showToast(`Switched to ${newTheme === "dark" ? "Dark" : "Light"} Mode`, "info");
        }
      });
    }
  }

  static setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("unipredict_theme", theme);

    const themeIcon = document.getElementById("themeIcon");
    const themeLabel = document.getElementById("themeLabel");

    if (theme === "light") {
      if (themeIcon) themeIcon.className = "fa-solid fa-sun text-amber";
      if (themeLabel) themeLabel.innerText = "Light Mode";
    } else {
      if (themeIcon) themeIcon.className = "fa-solid fa-moon";
      if (themeLabel) themeLabel.innerText = "Dark Mode";
    }

    // Refresh charts if rendered
    if (typeof ChartsManager !== "undefined") {
      const activeView = document.querySelector(".view-panel.active");
      if (activeView) {
        const viewId = activeView.id.replace("view-", "");
        if (viewId === "overview") {
          this.renderDashboardOverview();
        } else if (viewId === "analytics") {
          this.renderAnalyticsPage();
        }
      }
    }
  }

  /**
   * SPA Navigation Handler
   */
  static bindNavigation() {
    const navLinks = document.querySelectorAll(".nav-item, [data-view-target]");
    navLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetView = link.getAttribute("data-view") || link.getAttribute("data-view-target");
        if (targetView) {
          UniPredictApp.switchView(targetView);
        }
      });
    });

    // Mobile sidebar toggle
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const sidebar = document.getElementById("sidebar");
    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("active");
      });
    }
  }

  static switchView(viewId) {
    // Hide all views
    document.querySelectorAll(".view-panel").forEach(panel => {
      panel.classList.remove("active");
    });

    // Deactivate all nav links
    document.querySelectorAll(".nav-item").forEach(nav => {
      nav.classList.remove("active");
    });

    // Activate target view
    const targetPanel = document.getElementById(`view-${viewId}`);
    if (targetPanel) {
      targetPanel.classList.add("active");
    }

    const activeNav = document.querySelector(`.nav-item[data-view="${viewId}"]`);
    if (activeNav) {
      activeNav.classList.add("active");
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Refresh views if entering specific panels
    if (viewId === "analytics") {
      this.renderAnalyticsPage();
    } else if (viewId === "overview") {
      this.renderDashboardOverview();
      this.updateWhatIfWidget();
    } else if (viewId === "explorer") {
      this.renderUniversityExplorer();
    }

    // Trigger animations for current view
    setTimeout(() => {
      this.animateCounters();
      this.animateProgressBars();
      this.initCardTiltEffect();
    }, 50);
  }

  /**
   * Dynamic Range Sliders Value Updates
   */
  static initRangeSliders() {
    const sliders = document.querySelectorAll("input[type='range']");
    sliders.forEach(slider => {
      const displayId = slider.getAttribute("data-display");
      if (displayId) {
        const displayElem = document.getElementById(displayId);
        if (displayElem) {
          displayElem.innerText = slider.value;
          slider.addEventListener("input", () => {
            displayElem.innerText = slider.value;
          });
        }
      }
    });

    // Toggle SAT vs GRE inputs
    const testTypeSelect = document.getElementById("testType");
    if (testTypeSelect) {
      testTypeSelect.addEventListener("change", () => {
        const greFields = document.getElementById("greFields");
        const satFields = document.getElementById("satFields");
        if (testTypeSelect.value === "GRE") {
          greFields.style.display = "grid";
          satFields.style.display = "none";
        } else if (testTypeSelect.value === "SAT") {
          greFields.style.display = "none";
          satFields.style.display = "block";
        } else {
          greFields.style.display = "none";
          satFields.style.display = "none";
        }
      });
    }
  }

  /**
   * Load Default Sample Profile
   */
  static loadDefaultProfile() {
    this.currentProfile = {
      applicantName: "Aarav Patel",
      email: "aarav.patel@example.com",
      gpa: 3.82,
      gpaScale: "4.0",
      testType: "GRE",
      greQuant: 167,
      greVerbal: 158,
      satScore: 1480,
      toeflScore: 108,
      ieltsScore: 7.5,
      researchPapers: 2,
      researchTier: "Tier1",
      workExpMonths: 18,
      workRoleRelevance: "High",
      leadershipIndex: 8,
      extracurricularScore: 8,
      sopQuality: 8.5,
      lorStrength: 9.0,
      targetDegree: "MS",
      targetMajor: "Computer Science",
      targetUniversityId: "cmu-cs"
    };

    this.populateTargetUniversityDropdown();
    this.populateForm(this.currentProfile);
  }

  /**
   * Form population
   */
  static populateForm(p) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal("applicantName", p.applicantName);
    setVal("gpa", p.gpa);
    setVal("gpaScale", p.gpaScale);
    setVal("testType", p.testType);
    setVal("greQuant", p.greQuant);
    setVal("greVerbal", p.greVerbal);
    setVal("satScore", p.satScore);
    setVal("toeflScore", p.toeflScore);
    setVal("researchPapers", p.researchPapers);
    setVal("researchTier", p.researchTier);
    setVal("workExpMonths", p.workExpMonths);
    setVal("workRoleRelevance", p.workRoleRelevance);
    setVal("leadershipIndex", p.leadershipIndex);
    setVal("extracurricularScore", p.extracurricularScore);
    setVal("sopQuality", p.sopQuality);
    setVal("lorStrength", p.lorStrength);
    setVal("targetDegree", p.targetDegree);
    setVal("targetMajor", p.targetMajor);
    setVal("targetUniversity", p.targetUniversityId);

    // Update range display labels
    ["leadershipIndex", "extracurricularScore", "sopQuality", "lorStrength"].forEach(id => {
      const el = document.getElementById(id);
      const display = document.getElementById(id + "Val");
      if (el && display) display.innerText = el.value;
    });
  }

  /**
   * Bind Profile Form Submit
   */
  static bindFormListeners() {
    const form = document.getElementById("applicantProfileForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        UniPredictApp.runPrediction();
      });
    }

    // Preset button loaders
    const presetBtnStellar = document.getElementById("presetStellar");
    const presetBtnAvg = document.getElementById("presetAverage");

    if (presetBtnStellar) {
      presetBtnStellar.addEventListener("click", () => {
        UniPredictApp.populateForm({
          applicantName: "Devanshi Shah",
          gpa: 3.96,
          gpaScale: "4.0",
          testType: "GRE",
          greQuant: 170,
          greVerbal: 162,
          toeflScore: 114,
          researchPapers: 3,
          researchTier: "Tier1",
          workExpMonths: 24,
          workRoleRelevance: "High",
          leadershipIndex: 9,
          extracurricularScore: 9,
          sopQuality: 9.5,
          lorStrength: 9.5,
          targetDegree: "MS",
          targetMajor: "Artificial Intelligence",
          targetUniversityId: "mit-cs"
        });
        UniPredictApp.showToast("Loaded Stellar Applicant Profile!");
      });
    }

    if (presetBtnAvg) {
      presetBtnAvg.addEventListener("click", () => {
        UniPredictApp.populateForm({
          applicantName: "Harshil Mehta",
          gpa: 3.35,
          gpaScale: "4.0",
          testType: "GRE",
          greQuant: 160,
          greVerbal: 152,
          toeflScore: 95,
          researchPapers: 0,
          researchTier: "Tier3",
          workExpMonths: 12,
          workRoleRelevance: "Medium",
          leadershipIndex: 6,
          extracurricularScore: 6,
          sopQuality: 7.0,
          lorStrength: 7.5,
          targetDegree: "MS",
          targetMajor: "Computer Science",
          targetUniversityId: "nyu-tandon"
        });
        UniPredictApp.showToast("Loaded Average Applicant Profile!");
      });
    }
  }

  /**
   * Run Admission Prediction Engine
   */
  static runPrediction() {
    // Read form values
    const profile = {
      applicantName: document.getElementById("applicantName").value || "Anonymous",
      gpa: document.getElementById("gpa").value || 3.5,
      gpaScale: document.getElementById("gpaScale").value,
      testType: document.getElementById("testType").value,
      greQuant: document.getElementById("greQuant").value || 160,
      greVerbal: document.getElementById("greVerbal").value || 152,
      satScore: document.getElementById("satScore").value || 1400,
      toeflScore: document.getElementById("toeflScore").value || 100,
      researchPapers: document.getElementById("researchPapers").value || 0,
      researchTier: document.getElementById("researchTier").value,
      workExpMonths: document.getElementById("workExpMonths").value || 0,
      workRoleRelevance: document.getElementById("workRoleRelevance").value,
      leadershipIndex: document.getElementById("leadershipIndex").value,
      extracurricularScore: document.getElementById("extracurricularScore").value,
      sopQuality: document.getElementById("sopQuality").value,
      lorStrength: document.getElementById("lorStrength").value,
      targetDegree: document.getElementById("targetDegree").value,
      targetMajor: document.getElementById("targetMajor").value,
      targetUniversityId: document.getElementById("targetUniversity").value
    };

    this.currentProfile = profile;

    // Find Target University
    const targetUni = UNIVERSITIES_DATA.find(u => u.id === profile.targetUniversityId) || UNIVERSITIES_DATA[0];

    // Predict
    const result = PredictorEngine.predictAdmission(profile, targetUni);
    this.currentPrediction = result;

    // Save prediction directly to history
    HistoryManager.savePrediction(result);
    this.renderHistoryTable();
    this.renderDashboardOverview();

    // Launch Diagnostic Modal
    this.openDiagnosticModal(result);

    this.showToast(`Evaluated admission probability for ${targetUni.shortName}: ${result.probability}% (${result.classification})`);
  }

  /**
   * Populate Target University Select Dropdown
   */
  static populateTargetUniversityDropdown() {
    const uniSelect = document.getElementById("targetUniversity");
    if (uniSelect && uniSelect.children.length <= 1 && typeof UNIVERSITIES_DATA !== "undefined") {
      uniSelect.innerHTML = UNIVERSITIES_DATA.map(u => `<option value="${u.id}">${u.name} (${u.shortName}) - ${u.region}</option>`).join("");
    }
  }

  /**
   * What-If Simulator Logic
   */
  static initWhatIfWidget() {
    const simSelect = document.getElementById("simUniSelect");
    if (simSelect && typeof UNIVERSITIES_DATA !== "undefined") {
      simSelect.innerHTML = UNIVERSITIES_DATA.map(u => `<option value="${u.id}">${u.name} (${u.shortName})</option>`).join("");

      const controls = ["simUniSelect", "simGpa", "simGre", "simPapers", "simWork"];
      controls.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener(id === "simUniSelect" ? "change" : "input", () => this.updateWhatIfWidget());
        }
      });

      const applyBtn = document.getElementById("simApplyToProfileBtn");
      if (applyBtn) {
        applyBtn.addEventListener("click", () => {
          const uniId = document.getElementById("simUniSelect").value;
          const gpa = document.getElementById("simGpa").value;
          const gre = document.getElementById("simGre").value;
          const papers = document.getElementById("simPapers").value;
          const work = document.getElementById("simWork").value;

          const elSet = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
          elSet("targetUniversity", uniId);
          elSet("gpa", gpa);
          elSet("greQuant", gre);
          elSet("researchPapers", papers);
          elSet("workExpMonths", work);

          this.switchView("profile");
          this.showToast("Loaded simulated metrics into applicant profile form!");
        });
      }

      this.updateWhatIfWidget();
    }
  }

  static updateWhatIfWidget() {
    const uniSelect = document.getElementById("simUniSelect");
    if (!uniSelect) return;

    const uniId = uniSelect.value || UNIVERSITIES_DATA[0].id;
    const targetUni = UNIVERSITIES_DATA.find(u => u.id === uniId) || UNIVERSITIES_DATA[0];

    const gpa = parseFloat(document.getElementById("simGpa").value);
    const greQuant = parseInt(document.getElementById("simGre").value);
    const papers = parseInt(document.getElementById("simPapers").value);
    const work = parseInt(document.getElementById("simWork").value);

    // Update labels
    document.getElementById("simUniName").innerText = targetUni.shortName;
    document.getElementById("simGpaVal").innerText = gpa.toFixed(2);
    document.getElementById("simGreVal").innerText = greQuant;
    document.getElementById("simPapersVal").innerText = papers;
    document.getElementById("simWorkVal").innerText = work;

    // Run temporary prediction
    const tempProfile = {
      applicantName: "Simulated Profile",
      gpa: gpa,
      gpaScale: "4.0",
      testType: "GRE",
      greQuant: greQuant,
      greVerbal: 155,
      toeflScore: 105,
      researchPapers: papers,
      researchTier: "Tier1",
      workExpMonths: work,
      workRoleRelevance: "High",
      leadershipIndex: 8,
      extracurricularScore: 8,
      sopQuality: 8.5,
      lorStrength: 8.5,
      targetDegree: "MS",
      targetMajor: "Computer Science",
      targetUniversityId: uniId
    };

    const res = PredictorEngine.predictAdmission(tempProfile, targetUni);

    const probDisplay = document.getElementById("simProbDisplay");
    const classDisplay = document.getElementById("simClassDisplay");
    const recDisplay = document.getElementById("simRecommendationText");

    if (probDisplay) probDisplay.innerText = res.probability.toFixed(1) + "%";
    if (classDisplay) {
      classDisplay.innerText = `${res.classification} Fit`;
      classDisplay.className = `badge ${res.classificationBadge}`;
    }
    if (recDisplay) {
      const firstRec = res.recommendations[0] || "Tweak sliders to observe real-time probability curve shifts.";
      recDisplay.innerHTML = `<i class="fa-solid fa-lightbulb text-amber"></i> ${firstRec}`;
    }
  }

  /**
   * Modal Handlers
   */
  static initModalListeners() {
    const closeDiagBtns = [document.getElementById("closeDiagModalBtn"), document.getElementById("closeDiagModalBtn2")];
    closeDiagBtns.forEach(btn => {
      if (btn) btn.addEventListener("click", () => {
        document.getElementById("diagnosticModal").style.display = "none";
      });
    });

    const closeCompBtns = [document.getElementById("closeCompareModalBtn"), document.getElementById("closeCompareModalBtn2")];
    closeCompBtns.forEach(btn => {
      if (btn) btn.addEventListener("click", () => {
        document.getElementById("compareModal").style.display = "none";
      });
    });

    const clearCompBtn = document.getElementById("clearCompareBtn");
    if (clearCompBtn) {
      clearCompBtn.addEventListener("click", () => {
        this.selectedCompareIds.clear();
        this.updateCompareBar();
        this.renderUniversityExplorer();
      });
    }

    const launchCompBtn = document.getElementById("launchCompareBtn");
    if (launchCompBtn) {
      launchCompBtn.addEventListener("click", () => {
        this.openComparisonModal();
      });
    }
  }

  static openDiagnosticModal(res) {
    const modal = document.getElementById("diagnosticModal");
    if (!modal) return;

    modal.style.display = "flex";

    document.getElementById("diagProbVal").innerText = res.probability.toFixed(1) + "%";

    const badge = document.getElementById("diagClassificationBadge");
    if (badge) {
      badge.innerText = `${res.classification} Fit`;
      badge.className = `badge ${res.classificationBadge}`;
    }

    document.getElementById("diagUniName").innerText = res.university.name;
    document.getElementById("diagProgramDetails").innerText = `${res.profileSummary.degree} in ${res.profileSummary.major}`;
    document.getElementById("diagUniRegion").innerText = res.university.region;
    document.getElementById("diagUniRank").innerText = res.university.worldRank;
    document.getElementById("diagUniAcceptance").innerText = res.university.acceptanceRate + "%";

    // Category progress bars
    const b = res.breakdown;
    const setBar = (valId, fillId, val, max) => {
      const vElem = document.getElementById(valId);
      const fElem = document.getElementById(fillId);
      if (vElem) vElem.innerText = `${val} / ${max}`;
      if (fElem) fElem.style.width = `${Math.min(100, (val / max) * 100)}%`;
    };

    setBar("barAcadVal", "barAcadFill", b.academicScore, 40);
    setBar("barResearchVal", "barResearchFill", b.researchScore, 20);
    setBar("barWorkVal", "barWorkFill", b.workScore, 15);
    setBar("barEcVal", "barEcFill", b.ecLeadershipScore, 15);
    setBar("barQualVal", "barQualFill", b.qualitativeScore, 10);

    // Render Lists
    const gapList = document.getElementById("diagGapList");
    if (gapList) {
      if (res.gapAnalysis.length === 0) {
        gapList.innerHTML = `<li><i class="fa-solid fa-circle-check text-safe"></i> No critical score deficits identified against ${res.university.shortName} baseline!</li>`;
      } else {
        gapList.innerHTML = res.gapAnalysis.map(g => `<li>${g}</li>`).join("");
      }
    }

    const recList = document.getElementById("diagRecList");
    if (recList) {
      recList.innerHTML = res.recommendations.map(r => `<li>${r}</li>`).join("");
    }

    // Render Radar Chart
    setTimeout(() => {
      ChartsManager.renderRadarChart("diagRadarCanvas", res.userRadar, res.benchmarkRadar, res.university.shortName);
    }, 100);
  }

  /**
   * Render Dashboard Overview View
   */
  static renderDashboardOverview() {
    const history = HistoryManager.getHistory();
    document.getElementById("statTotalApplications").innerText = history.length;

    const acceptedCount = history.filter(h => h.status === "Accepted").length;
    document.getElementById("statAcceptedCount").innerText = acceptedCount;

    const avgProb = history.length > 0
      ? (history.reduce((acc, h) => acc + h.probability, 0) / history.length).toFixed(1) + "%"
      : "72.4%";
    document.getElementById("statAverageProb").innerText = avgProb;

    // Recent activity list
    const activityContainer = document.getElementById("dashboardRecentActivity");
    if (activityContainer) {
      if (history.length === 0) {
        activityContainer.innerHTML = `<p class="text-muted">No evaluations saved yet.</p>`;
      } else {
        activityContainer.innerHTML = history.slice(0, 4).map(h => `
          <div class="activity-card" style="cursor: pointer;" onclick="UniPredictApp.viewHistoryDiagnostic('${h.id}')">
            <div class="activity-icon ${h.classification === 'Safe' ? 'icon-safe' : h.classification === 'Target' ? 'icon-target' : 'icon-reach'}">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div class="activity-details">
              <h4>${h.universityShort || h.universityName}</h4>
              <p>${h.degree} in ${h.major} &bull; ${h.dateFormatted}</p>
            </div>
            <div class="activity-badge">
              <span class="badge ${h.classification === 'Safe' ? 'badge-safe' : h.classification === 'Target' ? 'badge-target' : 'badge-reach'}">
                ${h.probability}%
              </span>
            </div>
          </div>
        `).join("");
      }
    }

    // Render Overview Acceptance Trend & Doughnut
    setTimeout(() => {
      ChartsManager.renderAcceptanceTrendChart("overviewTrendCanvas", UNIVERSITIES_DATA.slice(0, 5));
      const safe = history.filter(h => h.classification === "Safe").length || 3;
      const target = history.filter(h => h.classification === "Target").length || 4;
      const reach = history.filter(h => h.classification === "Reach").length || 2;
      ChartsManager.renderClassificationDoughnut("overviewDoughnutCanvas", safe, target, reach);
    }, 100);
  }

  /**
   * Render University Explorer
   */
  static renderUniversityExplorer() {
    const grid = document.getElementById("uniCardsGrid");
    if (!grid || typeof UNIVERSITIES_DATA === "undefined") return;

    const searchInput = document.getElementById("explorerSearch");
    const regionSelect = document.getElementById("explorerRegionFilter");
    const stateSelect = document.getElementById("explorerStateFilter");
    const tierSelect = document.getElementById("explorerTierFilter");

    const query = (searchInput ? searchInput.value : "").toLowerCase().trim();
    const region = regionSelect ? regionSelect.value : "ALL";
    const state = stateSelect ? stateSelect.value : "ALL";
    const tier = tierSelect ? tierSelect.value : "ALL";

    let filtered = UNIVERSITIES_DATA.filter(u => {
      const matchQuery = !query ||
        u.name.toLowerCase().includes(query) ||
        u.shortName.toLowerCase().includes(query) ||
        u.location.toLowerCase().includes(query) ||
        (u.state && u.state.toLowerCase().includes(query)) ||
        (u.region && u.region.toLowerCase().includes(query));
      const matchRegion = region === "ALL" || u.region === region;
      const matchState = state === "ALL" || u.state === state;
      const matchTier = tier === "ALL" || u.tier === tier;
      return matchQuery && matchRegion && matchState && matchTier;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="glass-card full-width-card py-4 text-center text-muted" style="grid-column: 1 / -1;"><i class="fa-solid fa-filter-circle-xmark fa-2x mb-2"></i><p>No universities found matching your state/region filters.</p></div>`;
      return;
    }

    grid.innerHTML = filtered.map(u => {
      const isChecked = this.selectedCompareIds.has(u.id);
      return `
        <div class="uni-card">
          <div>
            <div class="uni-card-header">
              <div class="uni-title-box">
                <h4>${u.name} (${u.shortName})</h4>
                <div class="uni-location" style="display: flex; gap: 6px; align-items: center; margin-top: 4px;">
                  <i class="fa-solid fa-location-dot"></i> ${u.location}
                  ${u.state ? `<span class="badge badge-tag" style="font-size: 10px; padding: 2px 6px;"><i class="fa-solid fa-map-pin"></i> ${u.state}</span>` : ''}
                </div>
              </div>
              <div class="uni-rank-badge">Rank #${u.worldRank}</div>
            </div>

            <p class="text-secondary" style="font-size: 12px; margin-bottom: 10px;">${u.description}</p>

            <div class="uni-stats-grid">
              <div class="uni-stat-item">
                <span class="uni-stat-label">Acceptance Rate</span>
                <span class="uni-stat-val text-accent">${u.acceptanceRate}%</span>
              </div>
              <div class="uni-stat-item">
                <span class="uni-stat-label">Avg GPA</span>
                <span class="uni-stat-val">${u.avgGpa} / 4.0</span>
              </div>
              <div class="uni-stat-item">
                <span class="uni-stat-label">Avg GRE Quant</span>
                <span class="uni-stat-val">${u.avgGreQuant}</span>
              </div>
              <div class="uni-stat-item">
                <span class="uni-stat-label">Annual Tuition</span>
                <span class="uni-stat-val">$${u.tuition.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="uni-card-footer">
            <label class="compare-checkbox-label">
              <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="UniPredictApp.toggleCompareSelect('${u.id}', this.checked)">
              <span>Compare</span>
            </label>
            <button class="btn btn-sm btn-primary" onclick="UniPredictApp.selectAndEvaluateUni('${u.id}')">
              <i class="fa-solid fa-bolt"></i> Evaluate
            </button>
          </div>
        </div>
      `;
    }).join("");

    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = "true";
      searchInput.addEventListener("input", () => this.renderUniversityExplorer());
    }
    if (regionSelect && !regionSelect.dataset.bound) {
      regionSelect.dataset.bound = "true";
      regionSelect.addEventListener("change", () => this.renderUniversityExplorer());
    }
    if (stateSelect && !stateSelect.dataset.bound) {
      stateSelect.dataset.bound = "true";
      stateSelect.addEventListener("change", () => this.renderUniversityExplorer());
    }
    if (tierSelect && !tierSelect.dataset.bound) {
      tierSelect.dataset.bound = "true";
      tierSelect.addEventListener("change", () => this.renderUniversityExplorer());
    }
  }

  static toggleCompareSelect(uniId, isChecked) {
    if (isChecked) {
      if (this.selectedCompareIds.size >= 4) {
        this.showToast("You can compare up to 4 universities simultaneously.", "warning");
        this.renderUniversityExplorer();
        return;
      }
      this.selectedCompareIds.add(uniId);
    } else {
      this.selectedCompareIds.delete(uniId);
    }
    this.updateCompareBar();
  }

  static updateCompareBar() {
    const bar = document.getElementById("compareBar");
    const text = document.getElementById("compareCountText");
    if (!bar || !text) return;

    const count = this.selectedCompareIds.size;
    if (count > 0) {
      bar.style.display = "flex";
      text.innerText = `${count} ${count === 1 ? 'university' : 'universities'} selected to compare`;
    } else {
      bar.style.display = "none";
    }
  }

  static selectAndEvaluateUni(uniId) {
    const select = document.getElementById("targetUniversity");
    if (select) select.value = uniId;
    this.switchView("profile");
  }

  static openComparisonModal() {
    if (this.selectedCompareIds.size === 0) return;

    const modal = document.getElementById("compareModal");
    if (!modal) return;

    const selectedUnis = UNIVERSITIES_DATA.filter(u => this.selectedCompareIds.has(u.id));
    const profile = this.currentProfile || {
      applicantName: "Standard Profile",
      gpa: 3.8, gpaScale: "4.0", testType: "GRE", greQuant: 165, greVerbal: 158,
      researchPapers: 2, researchTier: "Tier1", workExpMonths: 18, workRoleRelevance: "High",
      leadershipIndex: 8, extracurricularScore: 8, sopQuality: 8.5, lorStrength: 8.5,
      targetDegree: "MS", targetMajor: "Computer Science"
    };

    const tableHead = document.getElementById("compareTableHead");
    const tableBody = document.getElementById("compareTableBody");

    tableHead.innerHTML = `
      <tr>
        <th>Metric / Criteria</th>
        ${selectedUnis.map(u => `<th><strong>${u.shortName}</strong><br><span style="font-weight: normal; font-size: 11px;">${u.name}</span></th>`).join("")}
      </tr>
    `;

    const metrics = [
      { label: "World Rank", fn: u => `#${u.worldRank}` },
      { label: "Region & Location", fn: u => u.location },
      { label: "Acceptance Rate", fn: u => `<strong class="text-accent">${u.acceptanceRate}%</strong>` },
      { label: "Annual Tuition", fn: u => `$${u.tuition.toLocaleString()}` },
      { label: "Admitted Avg GPA", fn: u => `${u.avgGpa} / 4.0` },
      { label: "Admitted Avg GRE Quant", fn: u => `${u.avgGreQuant}` },
      { label: "Min TOEFL Requirement", fn: u => `${u.minToefl}` },
      { label: "Research Weighting", fn: u => `${(u.researchWeight * 100).toFixed(0)}%` },
      { label: "Work Exp Weighting", fn: u => `${(u.workExpWeight * 100).toFixed(0)}%` },
      {
        label: "Your Admission Odds",
        fn: u => {
          const res = PredictorEngine.predictAdmission(profile, u);
          return `<span class="badge ${res.classificationBadge}">${res.probability}% (${res.classification})</span>`;
        }
      }
    ];

    tableBody.innerHTML = metrics.map(m => `
      <tr>
        <td><strong>${m.label}</strong></td>
        ${selectedUnis.map(u => `<td>${m.fn(u)}</td>`).join("")}
      </tr>
    `).join("");

    modal.style.display = "flex";
  }

  /**
   * Render Application Planner
   */
  static renderApplicationPlanner() {
    const container = document.getElementById("checklistItemsContainer");
    if (!container) return;

    const saved = localStorage.getItem("unipredict_planner_v1");
    if (saved) {
      try { this.plannerChecklist = JSON.parse(saved); } catch (e) { }
    }

    container.innerHTML = this.plannerChecklist.map(item => `
      <div class="checklist-item ${item.done ? 'completed' : ''}" onclick="UniPredictApp.toggleChecklistItem('${item.id}')">
        <input type="checkbox" ${item.done ? 'checked' : ''} onclick="event.stopPropagation(); UniPredictApp.toggleChecklistItem('${item.id}')">
        <span class="checklist-text">${item.title}</span>
      </div>
    `).join("");

    const doneCount = this.plannerChecklist.filter(i => i.done).length;
    const totalCount = this.plannerChecklist.length;
    const pct = Math.round((doneCount / totalCount) * 100);

    const pctText = document.getElementById("plannerProgressPercent");
    const pctFill = document.getElementById("plannerProgressFill");

    if (pctText) pctText.innerText = `${pct}%`;
    if (pctFill) pctFill.style.width = `${pct}%`;

    const deadlinesContainer = document.getElementById("deadlinesListContainer");
    if (deadlinesContainer) {
      const deadlines = [
        { title: "Fall 2026 Priority / Fellowship Deadline", uni: "CMU, MIT, Stanford", date: "Dec 15, 2025", daysLeft: 92, urgent: true },
        { title: "Fall 2026 Regular MS / PhD Intake Deadline", uni: "Columbia, NYU, UC Berkeley", date: "Jan 15, 2026", daysLeft: 123, urgent: false },
        { title: "Spring 2027 Early Admissions Cutoff", uni: "USC, Georgia Tech", date: "Sep 01, 2026", daysLeft: 352, urgent: false },
        { title: "Financial Aid & TA/RA Application Portal", uni: "All Partnered Institutions", date: "Feb 01, 2026", daysLeft: 140, urgent: false }
      ];

      deadlinesContainer.innerHTML = deadlines.map(d => `
        <div class="deadline-card ${d.urgent ? 'urgent' : ''}">
          <div class="deadline-info">
            <h4>${d.title}</h4>
            <p>${d.uni} &bull; <strong>${d.date}</strong></p>
          </div>
          <div class="deadline-date-badge">
            <div class="deadline-days">${d.daysLeft} Days</div>
            <span class="badge ${d.urgent ? 'badge-reach' : 'badge-tag'}">${d.urgent ? 'Urgent Priority' : 'Upcoming'}</span>
          </div>
        </div>
      `).join("");
    }

    const resetBtn = document.getElementById("resetChecklistBtn");
    if (resetBtn && !resetBtn.dataset.bound) {
      resetBtn.dataset.bound = "true";
      resetBtn.addEventListener("click", () => {
        this.plannerChecklist.forEach(i => i.done = false);
        localStorage.setItem("unipredict_planner_v1", JSON.stringify(this.plannerChecklist));
        this.renderApplicationPlanner();
        this.showToast("Reset application milestone checklist.");
      });
    }
  }

  static toggleChecklistItem(id) {
    const item = this.plannerChecklist.find(i => i.id === id);
    if (item) {
      item.done = !item.done;
      localStorage.setItem("unipredict_planner_v1", JSON.stringify(this.plannerChecklist));
      this.renderApplicationPlanner();
    }
  }

  /**
   * Render Applicant History Table
   */
  static renderHistoryTable() {
    let history = HistoryManager.getHistory();
    const tbody = document.getElementById("historyTableBody");
    if (!tbody) return;

    const searchInput = document.getElementById("historySearchInput");
    const statusSelect = document.getElementById("historyStatusFilter");

    const query = (searchInput ? searchInput.value : "").toLowerCase().trim();
    const statusFilter = statusSelect ? statusSelect.value : "ALL";

    if (query || statusFilter !== "ALL") {
      history = history.filter(h => {
        const matchQuery = !query ||
          h.applicantName.toLowerCase().includes(query) ||
          (h.universityShort && h.universityShort.toLowerCase().includes(query)) ||
          (h.universityName && h.universityName.toLowerCase().includes(query)) ||
          (h.major && h.major.toLowerCase().includes(query)) ||
          (h.degree && h.degree.toLowerCase().includes(query));
        const matchStatus = statusFilter === "ALL" || h.status === statusFilter;
        return matchQuery && matchStatus;
      });
    }

    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = "true";
      searchInput.addEventListener("input", () => this.renderHistoryTable());
    }
    if (statusSelect && !statusSelect.dataset.bound) {
      statusSelect.dataset.bound = "true";
      statusSelect.addEventListener("change", () => this.renderHistoryTable());
    }

    if (history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No application records found matching your filter criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = history.map(h => `
      <tr>
        <td><strong>${h.dateFormatted}</strong></td>
        <td><strong>${h.applicantName}</strong></td>
        <td><strong>${h.universityShort}</strong></td>
        <td>${h.degree} in ${h.major}</td>
        <td><span class="badge ${h.classification === 'Safe' ? 'badge-safe' : h.classification === 'Target' ? 'badge-target' : 'badge-reach'}">${h.probability}%</span></td>
        <td>
          <span class="badge badge-tag">${h.classification}</span>
        </td>
        <td>
          <select class="status-select" onchange="UniPredictApp.updateHistoryStatus('${h.id}', this.value)">
            <option value="Evaluated" ${h.status === 'Evaluated' ? 'selected' : ''}>Evaluated</option>
            <option value="Applied" ${h.status === 'Applied' ? 'selected' : ''}>Applied</option>
            <option value="Accepted" ${h.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
            <option value="Rejected" ${h.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </td>
        <td>
          <button class="btn btn-sm btn-secondary" title="View Diagnostic Breakdown" onclick="UniPredictApp.viewHistoryDiagnostic('${h.id}')">
            <i class="fa-solid fa-chart-radar"></i>
          </button>
          <button class="btn btn-sm btn-danger" title="Delete Record" onclick="UniPredictApp.deleteHistoryItem('${h.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");
  }

  static viewHistoryDiagnostic(historyId) {
    const history = HistoryManager.getHistory();
    const item = history.find(h => h.id === historyId);
    if (item && item.predictionResult) {
      this.openDiagnosticModal(item.predictionResult);
    } else {
      this.showToast("Diagnostic breakdown for this entry is not available.", "warning");
    }
  }

  static bindHistoryEvents() {
    const exportBtn = document.getElementById("exportCsvBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const csv = HistoryManager.exportToCSV();
        if (!csv) {
          UniPredictApp.showToast("No history to export.", "warning");
          return;
        }
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `UniPredict_Application_History_${Date.now()}.csv`;
        a.click();
        UniPredictApp.showToast("Exported application history to CSV!");
      });
    }

    const printBtn = document.getElementById("printReportBtn");
    if (printBtn) {
      printBtn.addEventListener("click", () => {
        window.print();
      });
    }
  }

  static updateHistoryStatus(id, status) {
    HistoryManager.updateStatus(id, status);
    this.renderDashboardOverview();
    this.showToast(`Updated application status to ${status}`);
  }

  static deleteHistoryItem(id) {
    HistoryManager.deleteItem(id);
    this.renderHistoryTable();
    this.renderDashboardOverview();
    this.showToast("Deleted evaluation record.");
  }

  /**
   * Render Analytics Page Charts
   */
  static renderAnalyticsPage() {
    setTimeout(() => {
      ChartsManager.renderAcceptanceTrendChart("analyticsTrendCanvas", UNIVERSITIES_DATA);
      ChartsManager.renderBenchmarkBarChart("analyticsBenchmarkCanvas", UNIVERSITIES_DATA);
    }, 100);
  }

  /**
   * Toast Notification Helper
   */
  static showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i> ${message}`;

    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      document.body.appendChild(container);
    }

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /**
   * Professional Animations & Micro-Interactions System
   */
  static initAnimations() {
    this.initRippleEffects();
    this.initCardTiltEffect();
    this.animateCounters();
    this.animateProgressBars();
  }

  static animateCounters() {
    const counterElements = document.querySelectorAll("#statTotalApplications, #statSafeMatches, #statTargetMatches, #statReachMatches, .kpi-info h3");
    counterElements.forEach(el => {
      if (el.dataset.animating === "true") return;
      const text = el.innerText.trim();
      const numMatch = text.match(/^\d+/);
      if (numMatch) {
        const targetVal = parseInt(numMatch[0], 10);
        if (isNaN(targetVal)) return;
        const suffix = text.replace(/^\d+/, '');
        el.dataset.animating = "true";
        let startTime = null;
        const duration = 900;

        const updateCounter = (currentTime) => {
          if (!startTime) startTime = currentTime;
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out exponential curve
          const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const currentVal = Math.floor(easeProgress * targetVal);
          el.innerText = currentVal + suffix;
          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            el.innerText = targetVal + suffix;
            delete el.dataset.animating;
          }
        };
        requestAnimationFrame(updateCounter);
      }
    });
  }

  static initCardTiltEffect() {
    const cards = document.querySelectorAll(".kpi-card, .glass-card, .uni-card");
    cards.forEach(card => {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = "true";

      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const tiltX = ((y - centerY) / centerY) * 4;
        const tiltY = ((centerX - x) / centerX) * 4;

        card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-6px) scale(1.01)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  static initRippleEffects() {
    if (window._rippleListenerBound) return;
    window._rippleListenerBound = true;

    document.body.addEventListener("click", (e) => {
      const target = e.target.closest(".btn-header-eval, .btn-primary, .btn-action, .nav-item, .kpi-card, .btn-header-eval");
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const circle = document.createElement("span");
      const diameter = Math.max(rect.width, rect.height);
      const radius = diameter / 2;

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.classList.add("ripple-element");

      const existing = target.querySelector(".ripple-element");
      if (existing) existing.remove();

      target.appendChild(circle);
      setTimeout(() => circle.remove(), 650);
    });
  }

  static animateProgressBars() {
    const fills = document.querySelectorAll(".score-fill, .progress-fill");
    fills.forEach(fill => {
      const targetWidth = fill.style.width || fill.getAttribute("data-width");
      if (targetWidth && targetWidth !== "0%") {
        fill.style.width = "0%";
        setTimeout(() => {
          fill.style.width = targetWidth;
        }, 60);
      }
    });
  }
}
