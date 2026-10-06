/**
 * UniPredict Charts Manager
 * Handles Chart.js initialization, updates, and rendering with Theme Awareness
 */

class ChartsManager {
  static instances = {};

  /**
   * Helper to retrieve active theme colors for Chart.js
   */
  static getThemeColors() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return {
      text: isLight ? '#475569' : '#cbd5e1',
      subtext: isLight ? '#64748b' : '#94a3b8',
      grid: isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)',
      angleLine: isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.1)',
      doughnutBorder: isLight ? '#ffffff' : '#0f172a',
      barSecondary: isLight ? 'rgba(203, 213, 225, 0.9)' : 'rgba(51, 65, 85, 0.8)',
      tooltipBg: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
      tooltipText: isLight ? '#0f172a' : '#f8fafc',
      tooltipBorder: isLight ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.3)'
    };
  }

  /**
   * Render or Update the Profile Radar Chart
   */
  static renderRadarChart(canvasId, userMetrics, benchmarkMetrics, uniName = "Target University") {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (ChartsManager.instances[canvasId]) {
      ChartsManager.instances[canvasId].destroy();
    }

    const theme = this.getThemeColors();

    const labels = [
      "GPA Index",
      "Test Score",
      "Research Output",
      "Work Experience",
      "Leadership/EC",
      "SOP & LOR Quality"
    ];

    const userData = [
      userMetrics.gpa,
      userMetrics.testScore,
      userMetrics.research,
      userMetrics.workExp,
      userMetrics.leadership,
      userMetrics.sopLor
    ];

    const benchmarkData = [
      benchmarkMetrics.gpa,
      benchmarkMetrics.testScore,
      benchmarkMetrics.research,
      benchmarkMetrics.workExp,
      benchmarkMetrics.leadership,
      benchmarkMetrics.sopLor
    ];

    ChartsManager.instances[canvasId] = new Chart(ctx, {
      type: "radar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Your Profile Score",
            data: userData,
            backgroundColor: "rgba(99, 102, 241, 0.25)",
            borderColor: "#6366f1",
            pointBackgroundColor: "#6366f1",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "#6366f1",
            borderWidth: 2.5
          },
          {
            label: `${uniName} Admitted Avg`,
            data: benchmarkData,
            backgroundColor: "rgba(244, 63, 94, 0.15)",
            borderColor: "#f43f5e",
            pointBackgroundColor: "#f43f5e",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "#f43f5e",
            borderWidth: 2,
            borderDash: [4, 4]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: theme.angleLine },
            grid: { color: theme.grid },
            pointLabels: {
              color: theme.subtext,
              font: { family: "Outfit, sans-serif", size: 12, weight: 500 }
            },
            ticks: {
              color: theme.subtext,
              backdropColor: "transparent",
              min: 0,
              max: 10,
              stepSize: 2
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: theme.text,
              font: { family: "Outfit, sans-serif", size: 13 }
            }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            borderColor: theme.tooltipBorder,
            borderWidth: 1
          }
        }
      }
    });
  }

  /**
   * Render Acceptance Rate Trends Chart (Line Chart)
   */
  static renderAcceptanceTrendChart(canvasId, selectedUniversities) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (ChartsManager.instances[canvasId]) {
      ChartsManager.instances[canvasId].destroy();
    }

    const theme = this.getThemeColors();
    const years = [2021, 2022, 2023, 2024, 2025, 2026];
    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#8b5cf6"];

    const datasets = selectedUniversities.slice(0, 5).map((uni, idx) => {
      const dataPoints = uni.historicalAcceptance ? uni.historicalAcceptance.map(h => h.rate) : [uni.acceptanceRate];
      return {
        label: uni.shortName,
        data: dataPoints,
        borderColor: colors[idx % colors.length],
        backgroundColor: colors[idx % colors.length] + "22",
        fill: false,
        tension: 0.3,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 7
      };
    });

    ChartsManager.instances[canvasId] = new Chart(ctx, {
      type: "line",
      data: {
        labels: years,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: theme.grid },
            ticks: { color: theme.subtext }
          },
          y: {
            title: { display: true, text: "Acceptance Rate (%)", color: theme.subtext },
            grid: { color: theme.grid },
            ticks: { color: theme.subtext, callback: v => v + "%" }
          }
        },
        plugins: {
          legend: {
            position: "top",
            labels: { color: theme.text, font: { family: "Outfit, sans-serif" } }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            borderColor: theme.tooltipBorder,
            borderWidth: 1,
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.raw}%`
            }
          }
        }
      }
    });
  }

  /**
   * Render Doughnut Classification Breakdown Chart
   */
  static renderClassificationDoughnut(canvasId, safeCount, targetCount, reachCount) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (ChartsManager.instances[canvasId]) {
      ChartsManager.instances[canvasId].destroy();
    }

    const theme = this.getThemeColors();

    ChartsManager.instances[canvasId] = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Safe Fit (>75%)", "Target Fit (45-75%)", "Reach Fit (<45%)"],
        datasets: [
          {
            data: [safeCount, targetCount, reachCount],
            backgroundColor: ["#10b981", "#f59e0b", "#f43f5e"],
            borderColor: theme.doughnutBorder,
            borderWidth: 3,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: theme.text, font: { family: "Outfit, sans-serif", size: 12 } }
          },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            borderColor: theme.tooltipBorder,
            borderWidth: 1
          }
        }
      }
    });
  }

  /**
   * Render GPA vs GRE Benchmark Bar Chart
   */
  static renderBenchmarkBarChart(canvasId, universities) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (ChartsManager.instances[canvasId]) {
      ChartsManager.instances[canvasId].destroy();
    }

    const theme = this.getThemeColors();
    const labels = universities.slice(0, 8).map(u => u.shortName);
    const avgGpas = universities.slice(0, 8).map(u => u.avgGpa);
    const minGpas = universities.slice(0, 8).map(u => u.minGpa);

    ChartsManager.instances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Average Admitted GPA",
            data: avgGpas,
            backgroundColor: "rgba(99, 102, 241, 0.8)",
            borderRadius: 6
          },
          {
            label: "Minimum GPA Threshold",
            data: minGpas,
            backgroundColor: theme.barSecondary,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: theme.grid }, ticks: { color: theme.subtext } },
          y: {
            min: 2.5,
            max: 4.0,
            grid: { color: theme.grid },
            ticks: { color: theme.subtext }
          }
        },
        plugins: {
          legend: { labels: { color: theme.text } },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipText,
            borderColor: theme.tooltipBorder,
            borderWidth: 1
          }
        }
      }
    });
  }
}
