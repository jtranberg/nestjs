import { ThemeManager } from "./theme.js";
import { ChartManager } from "./chart-manager.js";
import { renderSensorFleet } from "./cards.js";

let points = 0;
let streak = 0;

let themeManager = null;
let chartManager = null;

const OBSERVABILITY_URL = "/observability";
const ROLE_STORAGE_KEY = "energy-dashboard-role";
const DEFAULT_ROLE = "client";
const MODULE_STORAGE_KEY = "energy-dashboard-module";

const ROLE_ROUTES = {
  client: "./index.html",
  technician: "./technician-dashboard.html",
  admin: "./admin-dashboard.html",
};

/* =========================
   DEMO ALERT
========================= */
function initDemoAlert() {
  const alertEl = document.getElementById("demoIntroAlert");
  const dismissBtn = document.getElementById("dismissDemoAlert");
  const messageEl = document.getElementById("demoAlertMessage");

  if (!alertEl || !dismissBtn || !messageEl) return;

  const role = getRoleFromPath();

  const messages = {
    client:
      "<strong>Client View:</strong> This dashboard presents high-level battery telemetry, health trends, alerts, module selection, and system mood feedback for a simplified operational experience.",
    technician:
      "<strong>Technician View:</strong> This dashboard adds module diagnostics, maintenance-focused metrics, sensor fleet visibility, and bank comparison for field operations.",
    admin:
      "<strong>Admin View:</strong> This dashboard includes platform observability, system oversight, role-based architecture, and broader operational visibility.",
  };

  messageEl.innerHTML = messages[role] || messages.client;

  dismissBtn.addEventListener("click", () => {
    alertEl.classList.add("hidden");
  });
}

/* =========================
   ROLE VIEW
========================= */
function formatRoleLabel(role = DEFAULT_ROLE) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function setCurrentRole(role) {
  localStorage.setItem(ROLE_STORAGE_KEY, role);
}

function getRoleFromPath() {
  const path = window.location.pathname;

  if (path.includes("technician-dashboard.html")) return "technician";
  if (path.includes("admin-dashboard.html")) return "admin";
  return "client";
}

function updateRoleDisplay(role) {
  const activeRoleDisplay = document.getElementById("activeRoleDisplay");
  const roleSelect = document.getElementById("roleSelect");

  if (activeRoleDisplay) {
    activeRoleDisplay.textContent = formatRoleLabel(role);
  }

  if (roleSelect) {
    roleSelect.value = role;
  }

  document.body.classList.remove(
    "role-client",
    "role-technician",
    "role-admin"
  );
  document.body.classList.add(`role-${role}`);
}

function goToRolePage(role) {
  const nextRoute = ROLE_ROUTES[role] || ROLE_ROUTES.client;
  window.location.href = nextRoute;
}

function initRoleSwitcher() {
  const roleSelect = document.getElementById("roleSelect");
  const pageRole = getRoleFromPath();

  setCurrentRole(pageRole);
  updateRoleDisplay(pageRole);

  if (!roleSelect) return;

  roleSelect.addEventListener("change", (event) => {
    const target = event.target;
    const nextRole =
      target && "value" in target ? target.value : DEFAULT_ROLE;

    setCurrentRole(nextRole);
    goToRolePage(nextRole);
  });
}

/* =========================
   MODULE SELECTOR
========================= */
function setCurrentModule(moduleId) {
  localStorage.setItem(MODULE_STORAGE_KEY, moduleId);
}

function getCurrentModule() {
  return localStorage.getItem(MODULE_STORAGE_KEY) || "all";
}

function populateModuleSelect(modules = []) {
  const select = document.getElementById("moduleSelect");
  if (!select) return;

  const current = getCurrentModule();

  select.innerHTML = `<option value="all">All Modules</option>`;

  modules.forEach((module, index) => {
    const id = module.id || module.moduleId || `module-${index + 1}`;
    const option = document.createElement("option");
    option.value = id;
    option.textContent = id;
    select.appendChild(option);
  });

  const availableIds = [
    "all",
    ...modules.map(
      (module, index) => module.id || module.moduleId || `module-${index + 1}`
    ),
  ];

  select.value = availableIds.includes(current) ? current : "all";
}

function initModuleSwitcher() {
  const select = document.getElementById("moduleSelect");
  if (!select) return;

  select.addEventListener("change", (event) => {
    const target = event.target;
    const value = target && "value" in target ? target.value : "all";

    setCurrentModule(value);
    loadDashboard();
  });
}

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
  } else if (
    alerts > 0 ||
    internetStatus === "degraded" ||
    bleStatus === "pairing"
  ) {
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
   OBSERVABILITY
========================= */
async function loadObservability() {
  try {
    const res = await fetch(OBSERVABILITY_URL);

    if (!res.ok) {
      throw new Error(`Observability request failed: ${res.status}`);
    }

    const data = await res.json();
    renderObservability(data);
  } catch (error) {
    console.error("Failed to load observability data:", error);

    const totalEl = document.getElementById("obsTotalRequests");
    const successEl = document.getElementById("obsSuccessRate");
    const latencyEl = document.getElementById("obsAvgLatency");
    const failedEl = document.getElementById("obsFailedRequests");
    const tbody = document.getElementById("observabilityTableBody");

    if (totalEl) totalEl.textContent = "--";
    if (successEl) successEl.textContent = "--";
    if (latencyEl) latencyEl.textContent = "--";
    if (failedEl) failedEl.textContent = "--";

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="obs-empty">Failed to load observability data.</td>
        </tr>
      `;
    }
  }
}

function renderObservability(data) {
  const totalEl = document.getElementById("obsTotalRequests");
  const successEl = document.getElementById("obsSuccessRate");
  const latencyEl = document.getElementById("obsAvgLatency");
  const failedEl = document.getElementById("obsFailedRequests");
  const tbody = document.getElementById("observabilityTableBody");

  if (totalEl) totalEl.textContent = String(data.summary?.total ?? 0);
  if (successEl) successEl.textContent = `${data.summary?.successRate ?? 0}%`;
  if (latencyEl) latencyEl.textContent = `${data.summary?.avgLatency ?? 0} ms`;
  if (failedEl) failedEl.textContent = String(data.summary?.failed ?? 0);

  if (!tbody) return;

  tbody.innerHTML = "";

  const events = Array.isArray(data.events) ? data.events.slice(0, 12) : [];

  if (events.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="obs-empty">No API observations yet.</td>
      </tr>
    `;
    return;
  }

  events.forEach((event) => {
    const row = document.createElement("tr");

    const statusClass =
      event.statusCode >= 200 && event.statusCode < 400
        ? "obs-status-ok"
        : "obs-status-fail";

    row.innerHTML = `
      <td>${new Date(event.timestamp).toLocaleTimeString()}</td>
      <td>${event.method}</td>
      <td class="obs-path">${event.path}</td>
      <td class="${statusClass}">${event.statusCode}</td>
      <td>${event.durationMs} ms</td>
    `;

    tbody.appendChild(row);
  });
}

function initObservability() {
  const tbody = document.getElementById("observabilityTableBody");
  const refreshBtn = document.getElementById("refreshObservabilityBtn");

  if (!tbody && !refreshBtn) return;

  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadObservability);
  }

  loadObservability();
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

    populateModuleSelect(modules);

    const selectedModule = getCurrentModule();

    const filteredModules =
      selectedModule === "all"
        ? modules
        : modules.filter((module, index) => {
            const id = module.id || module.moduleId || `module-${index + 1}`;
            return id === selectedModule;
          });

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

    updateTabStatus(alerts, filteredModules);
    updateConnectionBadges(bleStatus, internetStatus);

    applySystemMood({
      score,
      alerts,
      modules: filteredModules,
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
        filteredModules,
        bleStatus,
        internetStatus
      );
    }

    if (sensorGrid) {
      sensorGrid.innerHTML = renderSensorFleet(filteredModules);
    }

    const firstModule =
      Array.isArray(filteredModules) && filteredModules.length > 0
        ? filteredModules[0]
        : null;

    if (firstModule) {
      if (firstModule.totalAvailableVoltage != null) {
        chartManager?.updateVoltageTrend(
          Number(firstModule.totalAvailableVoltage)
        );
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
  initRoleSwitcher();
  initModuleSwitcher();
  initDemoAlert();

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

  initObservability();
  loadDashboard();

  setInterval(loadDashboard, 5000);

  if (
    document.getElementById("observabilityTableBody") ||
    document.getElementById("refreshObservabilityBtn")
  ) {
    setInterval(loadObservability, 5000);
  }
});