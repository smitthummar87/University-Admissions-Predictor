/**
 * UniPredict Admission Prediction Engine
 * Advanced multi-factor scoring model
 */

class PredictorEngine {
  /**
   * Main calculation function
   * @param {Object} profile - User profile inputs
   * @param {Object} university - Target university data
   */
  static predictAdmission(profile, university) {
    // 1. Normalize GPA to 4.0 scale if necessary
    let normalizedGpa = parseFloat(profile.gpa);
    if (profile.gpaScale === "10.0") {
      normalizedGpa = (normalizedGpa / 10.0) * 4.0;
    } else if (profile.gpaScale === "100%") {
      normalizedGpa = (normalizedGpa / 100.0) * 4.0;
    }

    // 2. Academic Score Computation (Max 40)
    // GPA component (24 pts)
    const gpaRatio = normalizedGpa / university.avgGpa;
    let gpaScore = Math.min(26, gpaRatio * 24);
    if (normalizedGpa < university.minGpa) {
      gpaScore -= 4; // Penalty for missing hard baseline
    }

    // Test Score component (16 pts)
    let testScore = 12; // default average
    if (profile.testType === "GRE") {
      const quantRatio = (parseInt(profile.greQuant) || 155) / university.avgGreQuant;
      const verbalRatio = (parseInt(profile.greVerbal) || 150) / university.avgGreVerbal;
      testScore = Math.min(16, (quantRatio * 10) + (verbalRatio * 6));
      if (parseInt(profile.greQuant) < university.minGreQuant) testScore -= 2.5;
    } else if (profile.testType === "SAT") {
      const satRatio = (parseInt(profile.satScore) || 1350) / university.avgSat;
      testScore = Math.min(16, satRatio * 16);
      if (parseInt(profile.satScore) < university.minSat) testScore -= 2.5;
    }
    
    // TOEFL/IELTS English Proficiency Check
    let englishBonus = 0;
    const toeflVal = parseFloat(profile.toeflScore) || (parseFloat(profile.ieltsScore) * 15 + 2.5);
    if (toeflVal < university.minToefl) {
      englishBonus -= 3.0;
    }

    const academicTotal = Math.max(0, Math.min(40, gpaScore + testScore + englishBonus));

    // 3. Research Score Computation (Max 20)
    const paperCount = parseInt(profile.researchPapers) || 0;
    let tierMultiplier = 1.0;
    if (profile.researchTier === "Tier1") tierMultiplier = 1.8; // Nature/IEEE/ACM
    else if (profile.researchTier === "Tier2") tierMultiplier = 1.2;
    else tierMultiplier = 0.8;

    let rawResearch = Math.min(10, paperCount * 2.5 * tierMultiplier);
    // Weight heavily for research-intensive universities (like CMU, MIT, Stanford, Oxford)
    let researchTotal = rawResearch * (1 + (university.researchWeight * 1.5));
    researchTotal = Math.min(20, researchTotal);

    // 4. Work & Internship Score (Max 15)
    const workMonths = parseInt(profile.workExpMonths) || 0;
    let roleMultiplier = 1.0;
    if (profile.workRoleRelevance === "High") roleMultiplier = 1.4;
    else if (profile.workRoleRelevance === "Medium") roleMultiplier = 1.0;
    else roleMultiplier = 0.6;

    let rawWork = Math.min(10, (workMonths / 24) * 6 * roleMultiplier);
    let workTotal = rawWork * (1 + (university.workExpWeight * 1.2));
    workTotal = Math.min(15, workTotal);

    // 5. Leadership & Extracurriculars Score (Max 15)
    const leadershipVal = parseFloat(profile.leadershipIndex) || 5;
    const ecVal = parseFloat(profile.extracurricularScore) || 5;
    const ecLeadershipTotal = Math.min(15, (leadershipVal * 0.8) + (ecVal * 0.7));

    // 6. SOP & LOR Qualitative Score (Max 10)
    const sopVal = parseFloat(profile.sopQuality) || 7;
    const lorVal = parseFloat(profile.lorStrength) || 7;
    const qualitativeTotal = Math.min(10, (sopVal * 0.5) + (lorVal * 0.5));

    // Total Profile Strength Score (0 to 100)
    const totalRawScore = academicTotal + researchTotal + workTotal + ecLeadershipTotal + qualitativeTotal;

    // 7. University Selectivity Adjuster & Sigmoid Probability Mapping
    // Base threshold depends on university tier & acceptance rate
    let baselineThreshold = 75;
    if (university.acceptanceRate < 10) baselineThreshold = 88;
    else if (university.acceptanceRate < 20) baselineThreshold = 81;
    else if (university.acceptanceRate < 35) baselineThreshold = 72;
    else baselineThreshold = 62;

    const delta = totalRawScore - baselineThreshold;
    
    // Logistic sigmoid transformation for realistic smooth curve
    let probability = 1 / (1 + Math.exp(-0.12 * delta));
    
    // Scale probability according to university acceptance rate bounds
    let adjustedProb = probability * 100;
    
    // Cap according to acceptance rate physics
    if (university.acceptanceRate < 10) {
      adjustedProb = Math.min(88, Math.max(4, adjustedProb * 0.9));
    } else if (university.acceptanceRate < 25) {
      adjustedProb = Math.min(94, Math.max(8, adjustedProb));
    } else {
      adjustedProb = Math.min(98, Math.max(15, adjustedProb * 1.05));
    }

    adjustedProb = parseFloat(adjustedProb.toFixed(1));

    // 8. Classification
    let classification = "Target";
    let classificationBadge = "badge-target";
    if (adjustedProb >= 75) {
      classification = "Safe";
      classificationBadge = "badge-safe";
    } else if (adjustedProb < 45) {
      classification = "Reach";
      classificationBadge = "badge-reach";
    }

    // 9. Radar Chart Metric Normalization (Scale 1 to 10)
    const userRadar = {
      gpa: parseFloat(Math.min(10, (normalizedGpa / 4.0) * 10).toFixed(1)),
      testScore: parseFloat(Math.min(10, (testScore / 16) * 10).toFixed(1)),
      research: parseFloat(Math.min(10, (researchTotal / 20) * 10).toFixed(1)),
      workExp: parseFloat(Math.min(10, (workTotal / 15) * 10).toFixed(1)),
      leadership: parseFloat(leadershipVal.toFixed(1)),
      sopLor: parseFloat((qualitativeTotal).toFixed(1))
    };

    const benchmarkRadar = {
      gpa: parseFloat(((university.benchmarks.gpa / 4.0) * 10).toFixed(1)),
      testScore: parseFloat((university.benchmarks.testScore / 10).toFixed(1)),
      research: university.benchmarks.research,
      workExp: university.benchmarks.workExp,
      leadership: university.benchmarks.leadership,
      sopLor: university.benchmarks.sopLor
    };

    // 10. Gap Analysis & Profile Enhancement Recommendations
    const gapAnalysis = [];
    const recommendations = [];

    if (userRadar.gpa < benchmarkRadar.gpa) {
      const gpaDiff = (benchmarkRadar.gpa - userRadar.gpa).toFixed(1);
      gapAnalysis.push(`GPA is ${gpaDiff} points below the admitted student average.`);
      recommendations.push(`A higher GPA or exceptional final-year academic performance will boost target probability by +8-12%.`);
    }

    if (userRadar.testScore < benchmarkRadar.testScore) {
      gapAnalysis.push(`Standardized Test Score is below the average admitted score for ${university.shortName}.`);
      recommendations.push(`Target raising your GRE Quant score above ${university.avgGreQuant} to significantly strengthen your technical index.`);
    }

    if (userRadar.research < benchmarkRadar.research && university.researchWeight > 0.20) {
      gapAnalysis.push(`${university.shortName} places high weight (${(university.researchWeight*100)}%) on research publications.`);
      recommendations.push(`Publishing 1 additional research paper in IEEE/ACM tier conference will add +15% to your research score.`);
    }

    if (userRadar.workExp < benchmarkRadar.workExp) {
      gapAnalysis.push(`Work experience is lower than average admitted student profile (${benchmarkRadar.workExp}/10).`);
      recommendations.push(`Highlight key technical projects, internships, or open-source contributions in your SOP.`);
    }

    if (recommendations.length === 0) {
      recommendations.push(`Your profile meets or exceeds admitted benchmark metrics for ${university.shortName}! Focus on polishing SOP and securing strong LORs.`);
    }

    return {
      probability: adjustedProb,
      classification: classification,
      classificationBadge: classificationBadge,
      breakdown: {
        academicScore: parseFloat(academicTotal.toFixed(1)),
        researchScore: parseFloat(researchTotal.toFixed(1)),
        workScore: parseFloat(workTotal.toFixed(1)),
        ecLeadershipScore: parseFloat(ecLeadershipTotal.toFixed(1)),
        qualitativeScore: parseFloat(qualitativeTotal.toFixed(1)),
        totalScore: parseFloat(totalRawScore.toFixed(1))
      },
      userRadar: userRadar,
      benchmarkRadar: benchmarkRadar,
      gapAnalysis: gapAnalysis,
      recommendations: recommendations,
      university: university,
      profileSummary: {
        applicantName: profile.applicantName || "Anonymous Applicant",
        degree: profile.targetDegree || "MS",
        major: profile.targetMajor || "Computer Science",
        gpa: normalizedGpa.toFixed(2),
        gre: profile.testType === "GRE" ? `${profile.greQuant}Q / ${profile.greVerbal}V` : "N/A",
        sat: profile.testType === "SAT" ? profile.satScore : "N/A"
      }
    };
  }

  /**
   * Batch evaluate all universities for a user profile
   */
  static evaluateAllUniversities(profile, universitiesList) {
    return universitiesList.map(uni => {
      const result = PredictorEngine.predictAdmission(profile, uni);
      return {
        university: uni,
        prediction: result
      };
    });
  }
}
