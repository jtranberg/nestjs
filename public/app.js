import { ThemeManager } from "./theme.js";
import { ChartManager } from "./chart-manager.js";
import { renderSensorFleet } from "./cards.js";

let points = 0;
let streak = 0;

let themeManager = null;
let chartManager = null;

/* =========================
   SYSTEM CLOCK
========================= */
function startSystemClock() {
  const clockEl = document.getElementById("systemClock");
  if (!clockEl) return;

  function updateClock() {
    const now = new Date();

    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    clockEl.textContent = time;
  }

  updateClock();
  setInterval(updateClock, 1000);
}

/* =========================
   SYSTEM MOOD
========================= */
function applySystemMood({
  score = 0,
  alerts = 0,
  modules = [],
  bleStatus = "offline",
  internetStatus = "offline",
}) {
  const body = document.body;
  if (!body) return;

  body.classList.remove(
    "mood-healthy",
    "mood-warning",
    "mood-critical",
    "mood-offline",
    "mood-excellent"
  );

  const hasCritical = Array.isArray(modules)
    ? modules.some((module) => module.status === "critical")
    : false;

  const hasWarning = Array.isArray(modules)
    ? modules.some((module) => module.status === "warning")
    : false;

  const isOffline = bleStatus === "offline" || internetStatus === "offline";

  let mood = "mood-healthy";

  if (hasCritical) {
    mood = "mood-critical";
  } else if (hasWarning) {
    mood = "mood-warning";
  } else if (alerts > 0 || internetStatus === "degraded" || bleStatus === "pairing") {
    mood = "mood-warning";
  } else if (isOffline) {
    mood = "mood-offline";
  } else if (score >= 90 && alerts === 0) {
    mood = "mood-excellent";
  }

  body.classList.add(mood);
}

/* =========================
   STATUS + TAB HELPERS
========================= */
function updateTabStatus(alerts = 0, modules = []) {
  const hasCritical = Array.isArray(modules)
    ? modules.some((module) => module.status === "critical")
    : false;

  if (hasCritical) {
    document.title = "🚨 Energy Ops Dashboard";
  } else if (alerts > 0) {
    document.title = "⚠️ Energy Ops Dashboard";
  } else {
    document.title = "⚡ Energy Ops Dashboard";
  }
}

function getBleIndicatorClass(status) {
  if (status === "ready") return "indicator-ready";
  if (status === "pairing") return "indicator-pairing";
  return "indicator-offline";
}

function getInternetIndicatorClass(status) {
  if (status === "online") return "indicator-online";
  if (status === "degraded") return "indicator-degraded";
  return "indicator-offline";
}

function updateConnectionBadges(
  bleStatus = "offline",
  internetStatus = "offline"
) {
  const bleBadge = document.getElementById("bleBadge");
  const internetBadge = document.getElementById("internetBadge");

  if (!bleBadge || !internetBadge) return;

  bleBadge.innerHTML = `
    <span class="indicator-dot ${getBleIndicatorClass(bleStatus)}"></span>
    <span>BLE: ${String(bleStatus).toUpperCase()}</span>
  `;

  internetBadge.innerHTML = `
    <span class="indicator-dot ${getInternetIndicatorClass(
      internetStatus
    )}"></span>
    <span>Internet: ${String(internetStatus).toUpperCase()}</span>
  `;
}

/* =========================
   ACHIEVEMENTS
========================= */
function badgeMarkup(
  score = 0,
  alerts = 0,
  modules = [],
  bleStatus = "offline",
  internetStatus = "offline"
) {
  const criticalCount = Array.isArray(modules)
    ? modules.filter((module) => module.status === "critical").length
    : 0;

  const badges = [];

  if (score >= 90) badges.push({ text: "🏆 Grid Guardian", type: "good" });
  if (alerts <= 1) badges.push({ text: "🛡 Low Alert Load", type: "good" });
  if (criticalCount >= 1) {
    badges.push({ text: "🚨 Critical Module Watch", type: "bad" });
  }
  if (score >= 70 && score < 90) {
    badges.push({ text: "⚡ Stable Operator", type: "warn" });
  }

  if (bleStatus === "ready") {
    badges.push({ text: "📶 BLE Ready", type: "good" });
  }
  if (bleStatus === "pairing") {
    badges.push({ text: "🔄 BLE Pairing", type: "warn" });
  }

  if (internetStatus === "online") {
    badges.push({ text: "🌐 Cloud Online", type: "good" });
  }
  if (internetStatus === "degraded") {
    badges.push({ text: "🟠 Internet Degraded", type: "warn" });
  }
  if (internetStatus === "offline") {
    badges.push({ text: "🔴 Cloud Offline", type: "bad" });
  }

  return badges
    .map((badge) => `<div class="badge ${badge.type}">${badge.text}</div>`)
    .join("");
}

/* =========================
   DASHBOARD LOAD
========================= */
async function loadDashboard() {
  try {
    const res = await fetch("/api/sensors");
    const data = await res.json();

    const score = data.score ?? 0;
    const alerts = data.alerts ?? 0;
    const bleStatus = data.bleStatus ?? "offline";
    const internetStatus = data.internetStatus ?? "offline";
    const modules = Array.isArray(data.modules) ? data.modules : [];

    const scoreValue = document.getElementById("scoreValue");
    const alertsValue = document.getElementById("alertsValue");
    const scoreBar = document.getElementById("scoreBar");
    const pointsValue = document.getElementById("pointsValue");
    const streakValue = document.getElementById("streakValue");
    const badgesEl = document.getElementById("badges");
    const sensorGrid = document.getElementById("sensorGrid");

    if (scoreValue) scoreValue.textContent = `${score}%`;
    if (alertsValue) alertsValue.textContent = String(alerts);
    if (scoreBar) scoreBar.style.width = `${score}%`;

    updateTabStatus(alerts, modules);
    updateConnectionBadges(bleStatus, internetStatus);

    applySystemMood({
      score,
      alerts,
      modules,
      bleStatus,
      internetStatus,
    });

    if (score >= 80) {
      points += 25;
      streak += 1;
    } else {
      points += 5;
      streak = 0;
    }

    if (pointsValue) pointsValue.textContent = String(points);
    if (streakValue) streakValue.textContent = String(streak);

    if (badgesEl) {
      badgesEl.innerHTML = badgeMarkup(
        score,
        alerts,
        modules,
        bleStatus,
        internetStatus
      );
    }

    if (sensorGrid) {
      sensorGrid.innerHTML = renderSensorFleet(modules);
    }

    const firstModule = Array.isArray(modules) && modules.length > 0 ? modules[0] : null;

    if (firstModule) {
      if (firstModule.totalAvailableVoltage != null) {
        chartManager?.updateVoltageTrend(Number(firstModule.totalAvailableVoltage));
      }

      const firstTemp = Array.isArray(firstModule.temperatures)
        ? firstModule.temperatures[0]
        : null;

      if (firstTemp != null) {
        chartManager?.updateTemperatureTrend(Number(firstTemp));
      }

      chartManager?.updateBankComparison(
        Number(firstModule.bankATotalVoltage ?? 0),
        Number(firstModule.bankBTotalVoltage ?? 0)
      );
    }
  } catch (err) {
    console.error("Dashboard load failed:", err);

    const badgesEl = document.getElementById("badges");
    const sensorGrid = document.getElementById("sensorGrid");

    applySystemMood({
      score: 0,
      alerts: 99,
      modules: [],
      bleStatus: "offline",
      internetStatus: "offline",
    });

    if (badgesEl) {
      badgesEl.innerHTML = `
        <div class="badge bad">⚠️ Telemetry Unavailable</div>
      `;
    }

    if (sensorGrid) {
      sensorGrid.innerHTML = `
        <div class="sensor-card">
          <div class="sensor-top">
            <div>
              <div class="sensor-title">Telemetry Unavailable</div>
              <div class="sensor-location">Unable to load module data</div>
            </div>
            <div class="status-pill status-critical">offline</div>
          </div>
          <div class="updated">Check API response and connectivity.</div>
        </div>
      `;
    }
  }
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  startSystemClock();

  themeManager = new ThemeManager({
    buttonId: "themeToggle",
    storageKey: "energy-dashboard-theme",
    defaultTheme: "dark",
    onThemeChange: () => {
      chartManager?.redrawForTheme();
    },
  });

  chartManager = new ChartManager(themeManager);

  themeManager.init();
  chartManager.init();

  loadDashboard();
  setInterval(loadDashboard, 5000);
});