/**
 * UniPredict History & Local Persistence Manager
 */

class HistoryManager {
  static STORAGE_KEY = "unipredict_history_v1";

  /**
   * Fetch all saved history items
   */
  static getHistory() {
    try {
      const data = localStorage.getItem(HistoryManager.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.length >= 59) return parsed;
      }
      const seed = HistoryManager.getSeedHistory();
      localStorage.setItem(HistoryManager.STORAGE_KEY, JSON.stringify(seed));
      return seed;
    } catch (e) {
      console.error("Failed to load history", e);
      return HistoryManager.getSeedHistory();
    }
  }

  /**
   * Save a new evaluation result to history
   */
  static savePrediction(predictionResult) {
    const history = HistoryManager.getHistory();
    const newItem = {
      id: "eval-" + Date.now(),
      timestamp: new Date().toISOString(),
      dateFormatted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      applicantName: predictionResult.profileSummary.applicantName,
      major: predictionResult.profileSummary.major,
      degree: predictionResult.profileSummary.degree,
      universityId: predictionResult.university.id,
      universityName: predictionResult.university.name,
      universityShort: predictionResult.university.shortName,
      probability: predictionResult.probability,
      classification: predictionResult.classification,
      status: "Evaluated", // Evaluated, Applied, Accepted, Rejected
      predictionResult: predictionResult
    };

    history.unshift(newItem); // add to top
    localStorage.setItem(HistoryManager.STORAGE_KEY, JSON.stringify(history));
    return newItem;
  }

  /**
   * Update status of an application item
   */
  static updateStatus(id, newStatus) {
    const history = HistoryManager.getHistory();
    const item = history.find(h => h.id === id);
    if (item) {
      item.status = newStatus;
      localStorage.setItem(HistoryManager.STORAGE_KEY, JSON.stringify(history));
    }
    return history;
  }

  /**
   * Delete an application item
   */
  static deleteItem(id) {
    let history = HistoryManager.getHistory();
    history = history.filter(h => h.id !== id);
    localStorage.setItem(HistoryManager.STORAGE_KEY, JSON.stringify(history));
    return history;
  }

  /**
   * Clear all history
   */
  static clearAll() {
    localStorage.removeItem(HistoryManager.STORAGE_KEY);
    return [];
  }

  /**
   * Generate CSV export string for history records
   */
  static exportToCSV() {
    const history = HistoryManager.getHistory();
    if (history.length === 0) return "";

    const headers = ["ID", "Date", "Applicant Name", "Degree", "Major", "University", "Probability (%)", "Classification", "Status"];
    const rows = history.map(h => [
      h.id,
      h.dateFormatted,
      `"${h.applicantName}"`,
      h.degree,
      `"${h.major}"`,
      `"${h.universityName}"`,
      h.probability,
      h.classification,
      h.status
    ]);

    return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  }

  /**
   * Generate 53 Brilliant Student Seed Records
   */
  static getSeedHistory() {
    const rawStudents = [
      { name: "Devanshi Shah", degree: "MS", major: "Artificial Intelligence", uniId: "mit-cs", gpa: 3.96, gre: 170, papers: 3, work: 24, status: "Accepted" },
      { name: "Aarav Patel", degree: "MS", major: "Computer Science", uniId: "cmu-cs", gpa: 3.82, gre: 167, papers: 2, work: 18, status: "Applied" },
      { name: "Harshil Mehta", degree: "MS", major: "Data Science", uniId: "stanford-eng", gpa: 3.94, gre: 169, papers: 3, work: 20, status: "Accepted" },
      { name: "Mansi Trivedi", degree: "PhD", major: "Computer Science", uniId: "ucb-cs", gpa: 3.91, gre: 168, papers: 4, work: 12, status: "Accepted" },
      { name: "Jayesh Desai", degree: "MS", major: "Computer Science", uniId: "columbia-cs", gpa: 3.88, gre: 167, papers: 2, work: 16, status: "Applied" },
      { name: "Hetvi Joshi", degree: "MS", major: "Software Engineering", uniId: "gatech-cs", gpa: 3.79, gre: 166, papers: 1, work: 24, status: "Accepted" },
      { name: "Kevin Parmar", degree: "MSc", major: "Artificial Intelligence", uniId: "oxford-cs", gpa: 3.95, gre: 169, papers: 3, work: 14, status: "Accepted" },
      { name: "Parth Dave", degree: "MPhil", major: "Computer Science", uniId: "cambridge-cs", gpa: 3.93, gre: 168, papers: 3, work: 12, status: "Accepted" },
      { name: "Aneri Sanghavi", degree: "MSc", major: "Robotics & AI", uniId: "eth-zurich", gpa: 3.87, gre: 168, papers: 2, work: 18, status: "Accepted" },
      { name: "Tanvi Bhatt", degree: "MSc", major: "Computing", uniId: "imperial-cs", gpa: 3.85, gre: 167, papers: 2, work: 15, status: "Applied" },
      { name: "Chirag Solanki", degree: "MS", major: "Cybersecurity", uniId: "uiuc-cs", gpa: 3.80, gre: 165, papers: 1, work: 22, status: "Accepted" },
      { name: "Rucha Vora", degree: "MS", major: "Computer Science", uniId: "umich-cs", gpa: 3.83, gre: 166, papers: 2, work: 20, status: "Accepted" },
      { name: "Nayan Chotai", degree: "MS", major: "Software Engineering", uniId: "uw-cs", gpa: 3.86, gre: 167, papers: 2, work: 18, status: "Accepted" },
      { name: "Shlok Thakar", degree: "MS", major: "Data Science", uniId: "nyu-tandon", gpa: 3.75, gre: 164, papers: 1, work: 16, status: "Accepted" },
      { name: "Priyanka Kothari", degree: "MS", major: "Computer Science", uniId: "neu-cs", gpa: 3.72, gre: 163, papers: 1, work: 30, status: "Accepted" },
      { name: "Vrajesh Patel", degree: "MS", major: "Computer Engineering", uniId: "tamu-eng", gpa: 3.68, gre: 162, papers: 1, work: 24, status: "Accepted" },
      { name: "Dhyey Shah", degree: "MS", major: "Artificial Intelligence", uniId: "cmu-cs", gpa: 3.90, gre: 169, papers: 3, work: 12, status: "Applied" },
      { name: "Krisha Mehta", degree: "MSc", major: "Informatics", uniId: "tum-cs", gpa: 3.76, gre: 165, papers: 1, work: 18, status: "Accepted" },
      { name: "Yashvi Trivedi", degree: "MSc", major: "Applied Computing", uniId: "utoronto-cs", gpa: 3.84, gre: 166, papers: 2, work: 14, status: "Accepted" },
      { name: "Tirthraj Desai", degree: "MTech", major: "Computer Science", uniId: "iisc-cs", gpa: 3.92, gre: 169, papers: 4, work: 10, status: "Accepted" },
      { name: "Maitri Joshi", degree: "MSc", major: "Business Analytics", uniId: "nus-cs", gpa: 3.89, gre: 167, papers: 2, work: 16, status: "Accepted" },
      { name: "Deep Parmar", degree: "MCIS", major: "Computer Science", uniId: "unimelb-cs", gpa: 3.70, gre: 163, papers: 1, work: 20, status: "Accepted" },
      { name: "Vivek Dave", degree: "MS", major: "Computer Science", uniId: "stanford-eng", gpa: 3.92, gre: 168, papers: 3, work: 15, status: "Applied" },
      { name: "Janki Sanghavi", degree: "MS", major: "Artificial Intelligence", uniId: "mit-cs", gpa: 3.88, gre: 168, papers: 2, work: 18, status: "Evaluated" },
      { name: "Dhairya Bhatt", degree: "MS", major: "Software Engineering", uniId: "ucb-cs", gpa: 3.81, gre: 166, papers: 2, work: 22, status: "Applied" },
      { name: "Kavit Solanki", degree: "MS", major: "Data Analytics", uniId: "gatech-cs", gpa: 3.82, gre: 165, papers: 1, work: 26, status: "Accepted" },
      { name: "Kinjal Vora", degree: "MSc", major: "Advanced CS", uniId: "oxford-cs", gpa: 3.96, gre: 170, papers: 3, work: 12, status: "Accepted" },
      { name: "Darshan Chotai", degree: "MS", major: "Computer Science", uniId: "uiuc-cs", gpa: 3.78, gre: 165, papers: 2, work: 16, status: "Applied" },
      { name: "Nidhi Thakar", degree: "MS", major: "Robotics", uniId: "cmu-cs", gpa: 3.93, gre: 169, papers: 3, work: 14, status: "Accepted" },
      { name: "Bhavya Patel", degree: "MS", major: "Cybersecurity", uniId: "columbia-cs", gpa: 3.86, gre: 167, papers: 2, work: 24, status: "Accepted" },
      { name: "Rutvi Shah", degree: "MS", major: "Human-Computer Interaction", uniId: "uw-cs", gpa: 3.84, gre: 166, papers: 2, work: 18, status: "Accepted" },
      { name: "Ronak Mehta", degree: "MSc", major: "Data Science", uniId: "eth-zurich", gpa: 3.88, gre: 167, papers: 2, work: 15, status: "Accepted" },
      { name: "Saloni Trivedi", degree: "MS", major: "Computer Science", uniId: "umich-cs", gpa: 3.77, gre: 164, papers: 1, work: 20, status: "Applied" },
      { name: "Umang Desai", degree: "MS", major: "Data Science", uniId: "nyu-tandon", gpa: 3.71, gre: 163, papers: 1, work: 18, status: "Accepted" },
      { name: "Janvi Joshi", degree: "MS", major: "Information Systems", uniId: "neu-cs", gpa: 3.69, gre: 162, papers: 1, work: 28, status: "Accepted" },
      { name: "Hardik Parmar", degree: "MS", major: "Computer Engineering", uniId: "tamu-eng", gpa: 3.66, gre: 161, papers: 1, work: 22, status: "Accepted" },
      { name: "Pooja Dave", degree: "MPhil", major: "Machine Learning", uniId: "cambridge-cs", gpa: 3.94, gre: 169, papers: 3, work: 10, status: "Applied" },
      { name: "Kushal Sanghavi", degree: "MSc", major: "Artificial Intelligence", uniId: "imperial-cs", gpa: 3.89, gre: 168, papers: 2, work: 16, status: "Accepted" },
      { name: "Foram Bhatt", degree: "MSc", major: "Computing", uniId: "nus-cs", gpa: 3.91, gre: 168, papers: 3, work: 12, status: "Accepted" },
      { name: "Meet Solanki", degree: "MSc", major: "Data Engineering", uniId: "tum-cs", gpa: 3.74, gre: 163, papers: 1, work: 16, status: "Accepted" },
      { name: "Swati Vora", degree: "MTech", major: "Computational Data Science", uniId: "iisc-cs", gpa: 3.90, gre: 168, papers: 3, work: 12, status: "Accepted" },
      { name: "Jay Chotai", degree: "MSc", major: "Computer Science", uniId: "utoronto-cs", gpa: 3.82, gre: 165, papers: 2, work: 18, status: "Applied" },
      { name: "Grishma Thakar", degree: "MS", major: "Software Engineering", uniId: "asu-cs", gpa: 3.65, gre: 160, papers: 1, work: 24, status: "Accepted" },
      { name: "Siddharth Patel", degree: "MS", major: "Machine Learning", uniId: "columbia-cs", gpa: 3.91, gre: 168, papers: 3, work: 14, status: "Accepted" },
      { name: "Mansi Shah", degree: "MS", major: "Artificial Intelligence", uniId: "stanford-eng", gpa: 3.89, gre: 167, papers: 2, work: 16, status: "Evaluated" },
      { name: "Varun Mehta", degree: "MS", major: "Cybersecurity", uniId: "gatech-cs", gpa: 3.76, gre: 164, papers: 1, work: 20, status: "Accepted" },
      { name: "Riddhi Trivedi", degree: "MS", major: "Computer Science", uniId: "ucb-cs", gpa: 3.87, gre: 167, papers: 2, work: 18, status: "Applied" },
      { name: "Aakash Desai", degree: "MS", major: "Computer Science", uniId: "cmu-cs", gpa: 3.95, gre: 170, papers: 4, work: 12, status: "Accepted" },
      { name: "Diya Joshi", degree: "MS", major: "Computer Science", uniId: "nyu-tandon", gpa: 3.78, gre: 164, papers: 1, work: 36, status: "Accepted" },
      { name: "Nirav Parmar", degree: "MSc", major: "Advanced Computer Science", uniId: "oxford-cs", gpa: 3.93, gre: 169, papers: 3, work: 14, status: "Accepted" },
      { name: "Khushi Dave", degree: "MS", major: "Electrical Engineering", uniId: "mit-cs", gpa: 3.90, gre: 168, papers: 2, work: 18, status: "Applied" },
      { name: "Rushabh Sanghavi", degree: "MS", major: "Data Science", uniId: "stanford-eng", gpa: 3.97, gre: 170, papers: 4, work: 20, status: "Accepted" },
      { name: "Brijesh Bhatt", degree: "MS", major: "Bioinformatics", uniId: "uiuc-cs", gpa: 3.80, gre: 165, papers: 2, work: 15, status: "Accepted" },

      // 6 Gujarati Student Rejected Records
      { name: "Fenil Solanki", degree: "MS", major: "Computer Science", uniId: "mit-cs", gpa: 3.25, gre: 152, papers: 0, work: 3, status: "Rejected" },
      { name: "Dhyani Vora", degree: "PhD", major: "Artificial Intelligence", uniId: "cmu-cs", gpa: 3.30, gre: 154, papers: 0, work: 6, status: "Rejected" },
      { name: "Parthiv Chotai", degree: "MS", major: "Data Science", uniId: "stanford-eng", gpa: 3.15, gre: 150, papers: 0, work: 0, status: "Rejected" },
      { name: "Forum Thakar", degree: "MSc", major: "Advanced Computer Science", uniId: "oxford-cs", gpa: 3.35, gre: 156, papers: 0, work: 4, status: "Rejected" },
      { name: "Romil Patel", degree: "MPhil", major: "Machine Learning", uniId: "cambridge-cs", gpa: 3.28, gre: 153, papers: 0, work: 2, status: "Rejected" },
      { name: "Jill Shah", degree: "MSc", major: "Robotics & AI", uniId: "eth-zurich", gpa: 3.32, gre: 155, papers: 0, work: 5, status: "Rejected" }
    ];

    const baseDates = [
      "Sep 12, 2026", "Sep 11, 2026", "Sep 10, 2026", "Sep 09, 2026", "Sep 08, 2026",
      "Sep 07, 2026", "Sep 06, 2026", "Sep 05, 2026", "Sep 04, 2026", "Sep 03, 2026",
      "Aug 30, 2026", "Aug 28, 2026", "Aug 25, 2026", "Aug 22, 2026", "Aug 20, 2026"
    ];

    return rawStudents.map((s, idx) => {
      const uni = (typeof UNIVERSITIES_DATA !== "undefined" && UNIVERSITIES_DATA.find(u => u.id === s.uniId)) || {
        id: s.uniId, name: "Top University", shortName: "Top Uni", region: "USA", worldRank: 10, acceptanceRate: 15, avgGpa: 3.8, minGpa: 3.5, avgGreQuant: 165, minGreQuant: 160, avgGreVerbal: 155, minGreVerbal: 150, minToefl: 100, researchWeight: 0.2, workExpWeight: 0.2, benchmarks: { gpa: 3.8, testScore: 90, research: 8, workExp: 7, leadership: 8, sopLor: 8.5 }
      };

      const profile = {
        applicantName: s.name,
        gpa: s.gpa,
        gpaScale: "4.0",
        testType: "GRE",
        greQuant: s.gre,
        greVerbal: 158,
        toeflScore: 108,
        researchPapers: s.papers,
        researchTier: "Tier1",
        workExpMonths: s.work,
        workRoleRelevance: "High",
        leadershipIndex: 8,
        extracurricularScore: 8,
        sopQuality: 8.5,
        lorStrength: 9.0,
        targetDegree: s.degree,
        targetMajor: s.major,
        targetUniversityId: s.uniId
      };

      const result = typeof PredictorEngine !== "undefined"
        ? PredictorEngine.predictAdmission(profile, uni)
        : {
          probability: 78.4,
          classification: "Target",
          classificationBadge: "badge-target",
          breakdown: { academicScore: 34, researchScore: 14, workScore: 11, ecLeadershipScore: 12, qualitativeScore: 8.5, totalScore: 79.5 },
          userRadar: { gpa: 9.5, testScore: 9.2, research: 8.0, workExp: 7.5, leadership: 8.0, sopLor: 8.5 },
          benchmarkRadar: { gpa: 9.6, testScore: 9.5, research: 8.5, workExp: 7.5, leadership: 8.0, sopLor: 9.0 },
          gapAnalysis: [],
          recommendations: ["Solid profile meeting or exceeding baseline requirements."],
          university: uni,
          profileSummary: { applicantName: s.name, degree: s.degree, major: s.major }
        };

      const dateStr = baseDates[idx % baseDates.length];

      return {
        id: `eval-53-${101 + idx}`,
        timestamp: new Date(Date.now() - (idx * 3600000 * 12)).toISOString(),
        dateFormatted: dateStr,
        applicantName: s.name,
        major: s.major,
        degree: s.degree,
        universityId: uni.id,
        universityName: uni.name,
        universityShort: uni.shortName,
        probability: result.probability,
        classification: result.classification,
        status: s.status,
        predictionResult: result
      };
    });
  }
}
