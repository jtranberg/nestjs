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

    this.predictionSteps = 4;

    this.ensurePluginsRegistered();
  }

    init() {
    this.initVoltageChartToggle();
    this.initTempChartToggle();
    this.initBankChartToggle();

    this.updateVoltageIntelUI();
    this.updateTemperatureIntelUI();
    this.updateBankIntelUI();

    this.updateVoltageAssistant();
    this.updateTemperatureAssistant();
    this.updateBankAssistant();
  }

  ensurePluginsRegistered() {
    if (typeof Chart === "undefined") return;
    if (Chart.__energyOpsPluginsRegistered) return;

    const glowLinePlugin = {
      id: "glowLinePlugin",
      beforeDatasetDraw(chart, args, pluginOptions) {
        const dataset = chart.data.datasets?.[args.index];
        if (!dataset || chart.config.type !== "line") return;

        const { ctx } = chart;
        ctx.save();
        ctx.shadowColor =
          pluginOptions?.color || dataset.borderColor || "rgba(125, 211, 252, 0.65)";
        ctx.shadowBlur = pluginOptions?.blur ?? 16;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      },
      afterDatasetDraw(chart) {
        chart.ctx.restore();
      },
    };

    const barShadowPlugin = {
      id: "barShadowPlugin",
      beforeDatasetDraw(chart, args, pluginOptions) {
        if (chart.config.type !== "bar") return;

        const { ctx } = chart;
        ctx.save();
        ctx.shadowColor = pluginOptions?.color || "rgba(0, 0, 0, 0.28)";
        ctx.shadowBlur = pluginOptions?.blur ?? 14;
        ctx.shadowOffsetX = pluginOptions?.offsetX ?? 0;
        ctx.shadowOffsetY = pluginOptions?.offsetY ?? 8;
      },
      afterDatasetDraw(chart) {
        chart.ctx.restore();
      },
    };

    Chart.register(glowLinePlugin, barShadowPlugin);
    Chart.__energyOpsPluginsRegistered = true;
  }

  getChartThemeColors() {
    const isLight = this.themeManager?.getTheme?.() === "light";

    if (!this.themeManager) {
      return {
        text: "#f5f7ff",
        grid: "rgba(255, 255, 255, 0.10)",
        line: "#7dd3fc",
        fill: "rgba(125, 211, 252, 0.12)",
        point: "#ffffff",
        glow: "rgba(125, 211, 252, 0.65)",
        predictedLine: "rgba(226, 232, 240, 0.82)",
      };
    }

    const base = this.themeManager.getChartColors();

    return {
      ...base,
      point: isLight ? "#ffffff" : "#f8fafc",
      glow: isLight ? "rgba(37, 99, 235, 0.35)" : "rgba(125, 211, 252, 0.65)",
      predictedLine: isLight
        ? "rgba(71, 85, 105, 0.78)"
        : "rgba(226, 232, 240, 0.82)",
    };
  }

  getTemperatureThemeColors() {
    const isLight = this.themeManager?.getTheme?.() === "light";

    return {
      text: isLight ? "#1e293b" : "#f5f7ff",
      grid: isLight ? "rgba(30, 41, 59, 0.12)" : "rgba(255, 255, 255, 0.10)",
      line: isLight ? "#ea580c" : "#f59e0b",
      fill: isLight ? "rgba(234, 88, 12, 0.12)" : "rgba(245, 158, 11, 0.14)",
      point: "#ffffff",
      glow: isLight ? "rgba(234, 88, 12, 0.32)" : "rgba(245, 158, 11, 0.5)",
      predictedLine: isLight
        ? "rgba(120, 53, 15, 0.72)"
        : "rgba(254, 240, 138, 0.82)",
    };
  }

  getBankChartColors() {
    const isLight = this.themeManager?.getTheme?.() === "light";

    return {
      text: isLight ? "#1e293b" : "#f5f7ff",
      grid: isLight ? "rgba(30, 41, 59, 0.12)" : "rgba(255, 255, 255, 0.10)",
      bankA: isLight ? "rgba(37, 99, 235, 0.78)" : "rgba(125, 211, 252, 0.78)",
      bankB: isLight ? "rgba(34, 197, 94, 0.78)" : "rgba(179, 248, 211, 0.78)",
      borderA: isLight ? "#2563eb" : "#7dd3fc",
      borderB: isLight ? "#22c55e" : "#b3f8d3",
      shadow: isLight ? "rgba(15, 23, 42, 0.18)" : "rgba(0, 0, 0, 0.32)",
    };
  }

  createAreaGradient(ctx, canvas, topColor, midColor, bottomColor) {
    const h = canvas.height || 300;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(0.45, midColor);
    gradient.addColorStop(1, bottomColor);
    return gradient;
  }

  createBarGradient(ctx, canvas, highlightColor, midColor, baseColor) {
    const h = canvas.height || 300;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, highlightColor);
    gradient.addColorStop(0.16, midColor);
    gradient.addColorStop(1, baseColor);
    return gradient;
  }

  getSharedLineOptions(colors, yTitle, glowColor) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 700,
        easing: "easeOutQuart",
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        glowLinePlugin: {
          color: glowColor,
          blur: 16,
        },
        legend: {
          labels: {
            color: colors.text,
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          titleColor: "#f8fafc",
          bodyColor: "#e2e8f0",
          borderColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
          padding: 12,
          displayColors: true,
        },
      },
      scales: {
        x: {
          ticks: {
            color: colors.text,
            maxRotation: 0,
          },
          grid: {
            color: colors.grid,
            drawBorder: false,
          },
        },
        y: {
          ticks: {
            color: colors.text,
          },
          grid: {
            color: colors.grid,
            drawBorder: false,
          },
          title: {
            display: true,
            text: yTitle,
            color: colors.text,
          },
        },
      },
    };
  }

  parseTimeLabel(label) {
    if (!label || typeof label !== "string") return null;
    const [rawHour, rawMinute] = label.split(":");
    const hour = Number(rawHour);
    const minute = Number(rawMinute);

    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return { hour, minute };
  }

  formatTimeLabel(hour, minute) {
    const safeHour = ((hour % 24) + 24) % 24;
    const safeMinute = ((minute % 60) + 60) % 60;

    return `${String(safeHour).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")}`;
  }

  getFutureTimeLabelsFromHistory(history, steps = this.predictionSteps) {
    const labels = history.map((point) => point.time);
    const lastLabel = labels[labels.length - 1];
    const parsed = this.parseTimeLabel(lastLabel);

    if (!parsed) {
      return Array.from({ length: steps }, (_, i) => `+${i + 1}m`);
    }

    const futureLabels = [];
    let { hour, minute } = parsed;

    for (let i = 0; i < steps; i += 1) {
      minute += 1;

      if (minute >= 60) {
        minute = 0;
        hour += 1;
      }

      if (hour >= 24) {
        hour = 0;
      }

      futureLabels.push(this.formatTimeLabel(hour, minute));
    }

    return futureLabels;
  }

  calculatePrediction(values, smoothing = 0.85) {
    const cleanValues = values.map(Number).filter(Number.isFinite);

    if (cleanValues.length < 2) {
      const fallback = cleanValues[cleanValues.length - 1] ?? 0;
      return Array.from({ length: this.predictionSteps }, () => fallback);
    }

    const recentWindow = cleanValues.slice(-5);
    const deltas = [];

    for (let i = 1; i < recentWindow.length; i += 1) {
      deltas.push(recentWindow[i] - recentWindow[i - 1]);
    }

    const avgDelta =
      deltas.length > 0
        ? deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length
        : 0;

    const smoothedDelta = avgDelta * smoothing;
    const predictions = [];

    let current = cleanValues[cleanValues.length - 1];

    for (let i = 0; i < this.predictionSteps; i += 1) {
      current += smoothedDelta;
      predictions.push(Number(current.toFixed(2)));
    }

    return predictions;
  }

  getChartProjection(history, smoothing = 0.85) {
    const actualLabels = history.map((point) => point.time);
    const actualValues = history.map((point) => point.value);
    const futureLabels = this.getFutureTimeLabelsFromHistory(history, this.predictionSteps);
    const predictedValues = this.calculatePrediction(actualValues, smoothing);

    const labels = [...actualLabels, ...futureLabels];

    const actualDataset = [
      ...actualValues,
      ...Array.from({ length: this.predictionSteps }, () => null),
    ];

    const predictionDataset = [
      ...Array.from({ length: Math.max(actualValues.length - 1, 0) }, () => null),
      actualValues[actualValues.length - 1] ?? null,
      ...predictedValues,
    ];

    return {
      labels,
      actualDataset,
      predictionDataset,
      predictedValues,
    };
  }

  getVoltageChartProjection() {
    return this.getChartProjection(this.voltageHistory, 0.85);
  }

  getTemperatureChartProjection() {
    return this.getChartProjection(this.temperatureHistory, 0.82);
  }

  getVoltageForecastStatus() {
    const predicted = this.getVoltageChartProjection().predictedValues;

    if (!predicted.length || this.voltageHistory.length < 2) {
      return { label: "Insufficient Data", tone: "neutral", delta: 0 };
    }

    const current = Number(this.voltageHistory[this.voltageHistory.length - 1]?.value ?? 0);
    const next = Number(predicted[0] ?? current);
    const delta = Number((next - current).toFixed(2));

    if (delta > 0.05) return { label: "Rising", tone: "good", delta };
    if (delta < -0.05) return { label: "Falling", tone: "warn", delta };
    return { label: "Stable", tone: "neutral", delta };
  }

  getVoltageDeviationStatus(actualValue = null) {
    const currentActual =
      actualValue !== null
        ? Number(actualValue)
        : Number(this.voltageHistory[this.voltageHistory.length - 1]?.value ?? 0);

    if (this.voltageHistory.length < 3) {
      return { label: "Normal", tone: "neutral", deviation: 0 };
    }

    const historyWithoutLatest = this.voltageHistory.slice(0, -1);
    const priorValues = historyWithoutLatest.map((point) => Number(point.value)).filter(Number.isFinite);

    if (!priorValues.length) {
      return { label: "Normal", tone: "neutral", deviation: 0 };
    }

    const predicted = this.calculatePrediction(priorValues, 0.85);
    const expected = Number(predicted[0] ?? priorValues[priorValues.length - 1] ?? currentActual);
    const deviation = Number((currentActual - expected).toFixed(2));
    const absDeviation = Math.abs(deviation);

    if (absDeviation >= 0.35) return { label: "Alert", tone: "danger", deviation };
    if (absDeviation >= 0.18) return { label: "Watch", tone: "warn", deviation };
    return { label: "Normal", tone: "good", deviation };
  }

  getTemperatureForecastStatus() {
    const predicted = this.getTemperatureChartProjection().predictedValues;

    if (!predicted.length || this.temperatureHistory.length < 2) {
      return { label: "Insufficient Data", tone: "neutral", delta: 0 };
    }

    const current = Number(this.temperatureHistory[this.temperatureHistory.length - 1]?.value ?? 0);
    const next = Number(predicted[0] ?? current);
    const delta = Number((next - current).toFixed(2));

    if (delta > 0.08) return { label: "Rising", tone: "warn", delta };
    if (delta < -0.08) return { label: "Cooling", tone: "good", delta };
    return { label: "Stable", tone: "neutral", delta };
  }

  getTemperatureDeviationStatus(actualValue = null) {
    const currentActual =
      actualValue !== null
        ? Number(actualValue)
        : Number(this.temperatureHistory[this.temperatureHistory.length - 1]?.value ?? 0);

    if (this.temperatureHistory.length < 3) {
      return { label: "Normal", tone: "neutral", deviation: 0 };
    }

    const historyWithoutLatest = this.temperatureHistory.slice(0, -1);
    const priorValues = historyWithoutLatest.map((point) => Number(point.value)).filter(Number.isFinite);

    if (!priorValues.length) {
      return { label: "Normal", tone: "neutral", deviation: 0 };
    }

    const predicted = this.calculatePrediction(priorValues, 0.82);
    const expected = Number(predicted[0] ?? priorValues[priorValues.length - 1] ?? currentActual);
    const deviation = Number((currentActual - expected).toFixed(2));
    const absDeviation = Math.abs(deviation);

    if (absDeviation >= 0.45) return { label: "Alert", tone: "danger", deviation };
    if (absDeviation >= 0.22) return { label: "Watch", tone: "warn", deviation };
    return { label: "Normal", tone: "good", deviation };
  }

  updateVoltageIntelUI(actualValue = null) {
    const forecastEl = document.getElementById("forecastStatus");
    const deviationEl = document.getElementById("deviationStatus");

    const forecast = this.getVoltageForecastStatus();
    const deviation = this.getVoltageDeviationStatus(actualValue);

    if (forecastEl) {
      forecastEl.textContent = `Forecast: ${forecast.label} (${forecast.delta >= 0 ? "+" : ""}${forecast.delta.toFixed(2)}V)`;
      forecastEl.dataset.tone = forecast.tone;
    }

    if (deviationEl) {
      deviationEl.textContent = `Deviation: ${deviation.label} (${deviation.deviation >= 0 ? "+" : ""}${deviation.deviation.toFixed(2)}V)`;
      deviationEl.dataset.tone = deviation.tone;
    }
  }

  updateTemperatureIntelUI(actualValue = null) {
    const forecastEl = document.getElementById("tempForecastStatus");
    const deviationEl = document.getElementById("tempDeviationStatus");

    const forecast = this.getTemperatureForecastStatus();
    const deviation = this.getTemperatureDeviationStatus(actualValue);

    if (forecastEl) {
      forecastEl.textContent = `Thermal Forecast: ${forecast.label} (${forecast.delta >= 0 ? "+" : ""}${forecast.delta.toFixed(2)}°C)`;
      forecastEl.dataset.tone = forecast.tone;
    }

    if (deviationEl) {
      deviationEl.textContent = `Thermal Risk: ${deviation.label} (${deviation.deviation >= 0 ? "+" : ""}${deviation.deviation.toFixed(2)}°C)`;
      deviationEl.dataset.tone = deviation.tone;
    }
  }

  buildVoltageTrendChart() {
    const canvas = document.getElementById("voltageTrendChart");
    if (!canvas || typeof Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    const colors = this.getChartThemeColors();
    const isLight = this.themeManager?.getTheme?.() === "light";

    if (this.voltageTrendChart) {
      this.voltageTrendChart.destroy();
    }

    const gradientFill = this.createAreaGradient(
      ctx,
      canvas,
      isLight ? "rgba(37, 99, 235, 0.30)" : "rgba(125, 211, 252, 0.38)",
      isLight ? "rgba(37, 99, 235, 0.12)" : "rgba(125, 211, 252, 0.16)",
      "rgba(125, 211, 252, 0.02)"
    );

    const projection = this.getVoltageChartProjection();

    this.voltageTrendChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: projection.labels,
        datasets: [
          {
            label: "Total Voltage",
            data: projection.actualDataset,
            borderColor: colors.line,
            backgroundColor: gradientFill,
            borderWidth: 3,
            tension: 0.38,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: colors.line,
            pointBorderColor: colors.point,
            pointBorderWidth: 1.5,
            pointHoverBorderWidth: 2,
            pointHitRadius: 16,
            spanGaps: false,
          },
          {
            label: "Predicted Voltage",
            data: projection.predictionDataset,
            borderColor: colors.predictedLine,
            backgroundColor: "transparent",
            borderWidth: 2.25,
            borderDash: [8, 6],
            tension: 0.34,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHitRadius: 12,
            spanGaps: true,
          },
        ],
      },
      options: this.getSharedLineOptions(colors, "Voltage (V)", colors.glow),
    });

    this.updateVoltageIntelUI();
    this.updateVoltageAssistant();
  }

  buildTempTrendChart() {
    const canvas = document.getElementById("tempTrendChart");
    if (!canvas || typeof Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    const colors = this.getTemperatureThemeColors();
    const isLight = this.themeManager?.getTheme?.() === "light";

    if (this.tempTrendChart) {
      this.tempTrendChart.destroy();
    }

    const gradientFill = this.createAreaGradient(
      ctx,
      canvas,
      isLight ? "rgba(234, 88, 12, 0.28)" : "rgba(245, 158, 11, 0.36)",
      isLight ? "rgba(234, 88, 12, 0.12)" : "rgba(245, 158, 11, 0.15)",
      "rgba(245, 158, 11, 0.02)"
    );

    const projection = this.getTemperatureChartProjection();

    this.tempTrendChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: projection.labels,
        datasets: [
          {
            label: "Temperature",
            data: projection.actualDataset,
            borderColor: colors.line,
            backgroundColor: gradientFill,
            borderWidth: 3,
            tension: 0.38,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: colors.line,
            pointBorderColor: colors.point,
            pointBorderWidth: 1.5,
            pointHoverBorderWidth: 2,
            pointHitRadius: 16,
            spanGaps: false,
          },
          {
            label: "Predicted Temperature",
            data: projection.predictionDataset,
            borderColor: colors.predictedLine,
            backgroundColor: "transparent",
            borderWidth: 2.25,
            borderDash: [8, 6],
            tension: 0.34,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHitRadius: 12,
            spanGaps: true,
          },
        ],
      },
      options: this.getSharedLineOptions(colors, "Temperature (°C)", colors.glow),
    });

    this.updateTemperatureIntelUI();
        this.updateTemperatureAssistant();
  }

    getBankBalanceStatus() {
    const bankA = Number(this.bankTotals.bankA ?? 0);
    const bankB = Number(this.bankTotals.bankB ?? 0);
    const delta = Number((bankA - bankB).toFixed(2));
    const absDelta = Math.abs(delta);

    if (absDelta >= 0.5) {
      return {
        label: "Imbalanced",
        tone: "danger",
        delta,
      };
    }

    if (absDelta >= 0.2) {
      return {
        label: "Watch",
        tone: "warn",
        delta,
      };
    }

    return {
      label: "Healthy",
      tone: "good",
      delta,
    };
  }

  getBankLeaderStatus() {
    const bankA = Number(this.bankTotals.bankA ?? 0);
    const bankB = Number(this.bankTotals.bankB ?? 0);
    const delta = Number((bankA - bankB).toFixed(2));
    const absDelta = Math.abs(delta);

    if (absDelta < 0.05) {
      return {
        label: "Even",
        tone: "neutral",
      };
    }

    if (delta > 0) {
      return {
        label: "Bank A Leading",
        tone: "good",
      };
    }

    return {
      label: "Bank B Leading",
      tone: "good",
    };
  }

  updateBankIntelUI() {
    const balanceEl = document.getElementById("bankBalanceStatus");
    const leaderEl = document.getElementById("bankLeaderStatus");

    const balance = this.getBankBalanceStatus();
    const leader = this.getBankLeaderStatus();

    if (balanceEl) {
      balanceEl.textContent = `Balance: ${balance.label} (Δ ${Math.abs(balance.delta).toFixed(2)}V)`;
      balanceEl.dataset.tone = balance.tone;
    }

    if (leaderEl) {
      leaderEl.textContent = `Lead: ${leader.label}`;
      leaderEl.dataset.tone = leader.tone;
    }
  }

  buildBankComparisonChart() {
    const canvas = document.getElementById("bankComparisonChart");
    if (!canvas || typeof Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    const colors = this.getBankChartColors();
    const isLight = this.themeManager?.getTheme?.() === "light";

    if (this.bankComparisonChart) {
      this.bankComparisonChart.destroy();
    }

    const bankAGradient = this.createBarGradient(
      ctx,
      canvas,
      "rgba(255, 255, 255, 0.26)",
      colors.borderA,
      isLight ? "rgba(37, 99, 235, 0.75)" : "rgba(125, 211, 252, 0.70)"
    );

    const bankBGradient = this.createBarGradient(
      ctx,
      canvas,
      "rgba(255, 255, 255, 0.26)",
      colors.borderB,
      isLight ? "rgba(34, 197, 94, 0.75)" : "rgba(179, 248, 211, 0.70)"
    );

    this.bankComparisonChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Bank A", "Bank B"],
        datasets: [
          {
            label: "Bank Voltage",
            data: [this.bankTotals.bankA, this.bankTotals.bankB],
            backgroundColor: [bankAGradient, bankBGradient],
            borderColor: [colors.borderA, colors.borderB],
            borderWidth: 2,
            borderRadius: 14,
            borderSkipped: false,
            hoverBorderWidth: 2.5,
            barThickness: 54,
            maxBarThickness: 60,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 700,
          easing: "easeOutQuart",
        },
        plugins: {
          barShadowPlugin: {
            color: colors.shadow,
            blur: 16,
            offsetX: 0,
            offsetY: 8,
          },
          legend: {
            labels: {
              color: colors.text,
              usePointStyle: true,
              pointStyle: "rectRounded",
            },
          },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.92)",
            titleColor: "#f8fafc",
            bodyColor: "#e2e8f0",
            borderColor: "rgba(255,255,255,0.08)",
            borderWidth: 1,
            padding: 12,
          },
        },
        scales: {
          x: {
            ticks: {
              color: colors.text,
            },
            grid: {
              color: colors.grid,
              drawBorder: false,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: colors.text,
            },
            grid: {
              color: colors.grid,
              drawBorder: false,
            },
            title: {
              display: true,
              text: "Voltage (V)",
              color: colors.text,
            },
          },
        },
      },
    });
        this.updateBankIntelUI();
        this.updateBankAssistant();
  }

//assistant
updateVoltageAssistant() {
  const el = document.getElementById("voltageAssistant");
  if (!el) return;

  const forecast = this.getVoltageForecastStatus();
  const deviation = this.getVoltageDeviationStatus();

  let message = "Voltage stable.";

  if (forecast.label === "Falling") {
    message = "Voltage trend falling. Monitor system load.";
  }

  if (forecast.label === "Rising") {
    message = "Voltage trend rising slightly. System stable.";
  }

  if (deviation.label === "Alert") {
    message = "Voltage deviation detected. Investigate module health.";
  }

  el.textContent = `Assistant: ${message}`;
}

updateTemperatureAssistant() {
  const el = document.getElementById("tempAssistant");
  if (!el) return;

  const forecast = this.getTemperatureForecastStatus();
  const deviation = this.getTemperatureDeviationStatus();

  let message = "Temperature stable.";

  if (forecast.label === "Rising") {
    message = "Thermal trend rising. Watch cooling efficiency.";
  }

  if (forecast.label === "Cooling") {
    message = "Thermal trend improving.";
  }

  if (deviation.label === "Alert") {
    message = "Unexpected thermal spike detected.";
  }

  el.textContent = `Assistant: ${message}`;
}


updateBankAssistant() {
  const el = document.getElementById("bankAssistant");
  if (!el) return;

  const balance = this.getBankBalanceStatus();
  const leader = this.getBankLeaderStatus();

  let message = "Bank balance healthy.";

  if (balance.label === "Watch") {
    message = "Small bank voltage spread detected. Continue monitoring.";
  }

  if (balance.label === "Imbalanced") {
    message = "Bank imbalance detected. Inspect load distribution and module health.";
  }

  if (leader.label === "Bank A Leading") {
    message += " Bank A is currently higher.";
  }

  if (leader.label === "Bank B Leading") {
    message += " Bank B is currently higher.";
  }

  if (leader.label === "Even" && balance.label === "Healthy") {
    message = "Banks are balanced and operating normally.";
  }

  el.textContent = `Assistant: ${message}`;
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

    this.updateVoltageIntelUI(newValue);
    this.updateVoltageAssistant();

    if (this.voltageTrendChart) {
      const projection = this.getVoltageChartProjection();

      this.voltageTrendChart.data.labels = projection.labels;
      this.voltageTrendChart.data.datasets[0].data = projection.actualDataset;
      this.voltageTrendChart.data.datasets[1].data = projection.predictionDataset;
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

    this.updateTemperatureIntelUI(newValue);
    this.updateTemperatureAssistant();

    if (this.tempTrendChart) {
      const projection = this.getTemperatureChartProjection();

      this.tempTrendChart.data.labels = projection.labels;
      this.tempTrendChart.data.datasets[0].data = projection.actualDataset;
      this.tempTrendChart.data.datasets[1].data = projection.predictionDataset;
      this.tempTrendChart.update();
    }
  }

    updateBankComparison(bankA, bankB) {
    this.bankTotals.bankA = Number(bankA ?? 0);
    this.bankTotals.bankB = Number(bankB ?? 0);

    this.updateBankIntelUI();
    this.updateBankAssistant();

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

    this.updateVoltageIntelUI();
    this.updateTemperatureIntelUI();
    this.updateBankIntelUI();

    this.updateVoltageAssistant();
    this.updateTemperatureAssistant();
    this.updateBankAssistant();
  }
}