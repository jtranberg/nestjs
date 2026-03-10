export class ChartManager {
  constructor(themeManager) {
    this.themeManager = themeManager;

    this.voltageTrendChart = null;
    this.tempTrendChart = null;
    this.bankComparisonChart = null;

    this.voltageHistory = [
      { time: "10:00", value: 48.2 },
      { time: "10:01", value: 48.4 },
      { time: "10:02", value: 48.1 },
      { time: "10:03", value: 48.5 },
      { time: "10:04", value: 48.3 },
      { time: "10:05", value: 48.6 },
      { time: "10:06", value: 48.4 },
    ];

    this.temperatureHistory = [
      { time: "10:00", value: 24.1 },
      { time: "10:01", value: 24.3 },
      { time: "10:02", value: 24.6 },
      { time: "10:03", value: 24.4 },
      { time: "10:04", value: 24.8 },
      { time: "10:05", value: 25.0 },
      { time: "10:06", value: 24.9 },
    ];

    this.bankTotals = {
      bankA: 0,
      bankB: 0,
    };
  }

  init() {
    this.initVoltageChartToggle();
    this.initTempChartToggle();
    this.initBankChartToggle();
  }

  getChartThemeColors() {
    if (!this.themeManager) {
      return {
        text: "#f5f7ff",
        grid: "rgba(255, 255, 255, 0.10)",
        line: "#7dd3fc",
        fill: "rgba(125, 211, 252, 0.12)",
      };
    }

    return this.themeManager.getChartColors();
  }

  getTemperatureThemeColors() {
    const isLight = this.themeManager?.getTheme?.() === "light";

    return {
      text: isLight ? "#1e293b" : "#f5f7ff",
      grid: isLight ? "rgba(30, 41, 59, 0.12)" : "rgba(255, 255, 255, 0.10)",
      line: isLight ? "#ea580c" : "#f59e0b",
      fill: isLight ? "rgba(234, 88, 12, 0.12)" : "rgba(245, 158, 11, 0.14)",
    };
  }

  getBankChartColors() {
    const isLight = this.themeManager?.getTheme?.() === "light";

    return {
      text: isLight ? "#1e293b" : "#f5f7ff",
      grid: isLight ? "rgba(30, 41, 59, 0.12)" : "rgba(255, 255, 255, 0.10)",
      bankA: isLight ? "rgba(37, 99, 235, 0.75)" : "rgba(125, 211, 252, 0.75)",
      bankB: isLight ? "rgba(34, 197, 94, 0.75)" : "rgba(179, 248, 211, 0.75)",
      borderA: isLight ? "#2563eb" : "#7dd3fc",
      borderB: isLight ? "#22c55e" : "#b3f8d3",
    };
  }

  buildVoltageTrendChart() {
    const canvas = document.getElementById("voltageTrendChart");
    if (!canvas || typeof Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    const colors = this.getChartThemeColors();

    if (this.voltageTrendChart) {
      this.voltageTrendChart.destroy();
    }

    this.voltageTrendChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: this.voltageHistory.map((point) => point.time),
        datasets: [
          {
            label: "Total Voltage",
            data: this.voltageHistory.map((point) => point.value),
            borderColor: colors.line,
            backgroundColor: colors.fill,
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: colors.text },
          },
        },
        scales: {
          x: {
            ticks: { color: colors.text },
            grid: { color: colors.grid },
          },
          y: {
            ticks: { color: colors.text },
            grid: { color: colors.grid },
            title: {
              display: true,
              text: "Voltage (V)",
              color: colors.text,
            },
          },
        },
      },
    });
  }

  buildTempTrendChart() {
    const canvas = document.getElementById("tempTrendChart");
    if (!canvas || typeof Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    const colors = this.getTemperatureThemeColors();

    if (this.tempTrendChart) {
      this.tempTrendChart.destroy();
    }

    this.tempTrendChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: this.temperatureHistory.map((point) => point.time),
        datasets: [
          {
            label: "Temperature",
            data: this.temperatureHistory.map((point) => point.value),
            borderColor: colors.line,
            backgroundColor: colors.fill,
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: colors.text },
          },
        },
        scales: {
          x: {
            ticks: { color: colors.text },
            grid: { color: colors.grid },
          },
          y: {
            ticks: { color: colors.text },
            grid: { color: colors.grid },
            title: {
              display: true,
              text: "Temperature (°C)",
              color: colors.text,
            },
          },
        },
      },
    });
  }

  buildBankComparisonChart() {
    const canvas = document.getElementById("bankComparisonChart");
    if (!canvas || typeof Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    const colors = this.getBankChartColors();

    if (this.bankComparisonChart) {
      this.bankComparisonChart.destroy();
    }

    this.bankComparisonChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Bank A", "Bank B"],
        datasets: [
          {
            label: "Bank Voltage",
            data: [this.bankTotals.bankA, this.bankTotals.bankB],
            backgroundColor: [colors.bankA, colors.bankB],
            borderColor: [colors.borderA, colors.borderB],
            borderWidth: 2,
            borderRadius: 12,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: colors.text },
          },
        },
        scales: {
          x: {
            ticks: { color: colors.text },
            grid: { color: colors.grid },
          },
          y: {
            beginAtZero: true,
            ticks: { color: colors.text },
            grid: { color: colors.grid },
            title: {
              display: true,
              text: "Voltage (V)",
              color: colors.text,
            },
          },
        },
      },
    });
  }

  initVoltageChartToggle() {
    const toggleBtn = document.getElementById("toggleVoltageChart");
    const chartWrap = document.getElementById("voltageChartWrap");

    if (!toggleBtn || !chartWrap) return;

    chartWrap.classList.add("collapsed");
    toggleBtn.textContent = "▶ Show Chart";

    toggleBtn.addEventListener("click", () => {
      const isCollapsed = chartWrap.classList.contains("collapsed");

      if (isCollapsed) {
        chartWrap.classList.remove("collapsed");
        toggleBtn.textContent = "▼ Hide Chart";

        setTimeout(() => {
          if (!this.voltageTrendChart) this.buildVoltageTrendChart();
          else this.voltageTrendChart.resize();
        }, 50);
      } else {
        chartWrap.classList.add("collapsed");
        toggleBtn.textContent = "▶ Show Chart";
      }
    });
  }

  initTempChartToggle() {
    const toggleBtn = document.getElementById("toggleTempChart");
    const chartWrap = document.getElementById("tempChartWrap");

    if (!toggleBtn || !chartWrap) return;

    chartWrap.classList.add("collapsed");
    toggleBtn.textContent = "▶ Show Chart";

    toggleBtn.addEventListener("click", () => {
      const isCollapsed = chartWrap.classList.contains("collapsed");

      if (isCollapsed) {
        chartWrap.classList.remove("collapsed");
        toggleBtn.textContent = "▼ Hide Chart";

        setTimeout(() => {
          if (!this.tempTrendChart) this.buildTempTrendChart();
          else this.tempTrendChart.resize();
        }, 50);
      } else {
        chartWrap.classList.add("collapsed");
        toggleBtn.textContent = "▶ Show Chart";
      }
    });
  }

  initBankChartToggle() {
    const toggleBtn = document.getElementById("toggleBankChart");
    const chartWrap = document.getElementById("bankChartWrap");

    if (!toggleBtn || !chartWrap) return;

    chartWrap.classList.add("collapsed");
    toggleBtn.textContent = "▶ Show Chart";

    toggleBtn.addEventListener("click", () => {
      const isCollapsed = chartWrap.classList.contains("collapsed");

      if (isCollapsed) {
        chartWrap.classList.remove("collapsed");
        toggleBtn.textContent = "▼ Hide Chart";

        setTimeout(() => {
          if (!this.bankComparisonChart) this.buildBankComparisonChart();
          else this.bankComparisonChart.resize();
        }, 50);
      } else {
        chartWrap.classList.add("collapsed");
        toggleBtn.textContent = "▶ Show Chart";
      }
    });
  }

  updateVoltageTrend(newValue) {
    const now = new Date();
    const label = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    this.voltageHistory.push({ time: label, value: newValue });

    if (this.voltageHistory.length > 20) {
      this.voltageHistory.shift();
    }

    if (this.voltageTrendChart) {
      this.voltageTrendChart.data.labels = this.voltageHistory.map((point) => point.time);
      this.voltageTrendChart.data.datasets[0].data = this.voltageHistory.map((point) => point.value);
      this.voltageTrendChart.update();
    }
  }

  updateTemperatureTrend(newValue) {
    const now = new Date();
    const label = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    this.temperatureHistory.push({ time: label, value: newValue });

    if (this.temperatureHistory.length > 20) {
      this.temperatureHistory.shift();
    }

    if (this.tempTrendChart) {
      this.tempTrendChart.data.labels = this.temperatureHistory.map((point) => point.time);
      this.tempTrendChart.data.datasets[0].data = this.temperatureHistory.map((point) => point.value);
      this.tempTrendChart.update();
    }
  }

  updateBankComparison(bankA, bankB) {
    this.bankTotals.bankA = Number(bankA ?? 0);
    this.bankTotals.bankB = Number(bankB ?? 0);

    if (this.bankComparisonChart) {
      this.bankComparisonChart.data.datasets[0].data = [
        this.bankTotals.bankA,
        this.bankTotals.bankB,
      ];
      this.bankComparisonChart.update();
    }
  }

  redrawForTheme() {
    if (this.voltageTrendChart) this.buildVoltageTrendChart();
    if (this.tempTrendChart) this.buildTempTrendChart();
    if (this.bankComparisonChart) this.buildBankComparisonChart();
  }
}