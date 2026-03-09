let points = 0;
let streak = 0;

/* =========================
   STATUS + TAB HELPERS
========================= */
function updateTabStatus(alerts = 0, modules = []) {
  const hasCritical = Array.isArray(modules)
    ? modules.some((module) => module.status === 'critical')
    : false;

  if (hasCritical) {
    document.title = '🚨 Energy Ops Dashboard';
  } else if (alerts > 0) {
    document.title = '⚠️ Energy Ops Dashboard';
  } else {
    document.title = '⚡ Energy Ops Dashboard';
  }
}

function getBleIndicatorClass(status) {
  if (status === 'ready') return 'indicator-ready';
  if (status === 'pairing') return 'indicator-pairing';
  return 'indicator-offline';
}

function getInternetIndicatorClass(status) {
  if (status === 'online') return 'indicator-online';
  if (status === 'degraded') return 'indicator-degraded';
  return 'indicator-offline';
}

function updateConnectionBadges(bleStatus = 'offline', internetStatus = 'offline') {
  const bleBadge = document.getElementById('bleBadge');
  const internetBadge = document.getElementById('internetBadge');

  if (!bleBadge || !internetBadge) return;

  bleBadge.innerHTML = `
    <span class="indicator-dot ${getBleIndicatorClass(bleStatus)}"></span>
    <span>BLE: ${String(bleStatus).toUpperCase()}</span>
  `;

  internetBadge.innerHTML = `
    <span class="indicator-dot ${getInternetIndicatorClass(internetStatus)}"></span>
    <span>Internet: ${String(internetStatus).toUpperCase()}</span>
  `;
}

/* =========================
   ACHIEVEMENTS
========================= */
function badgeMarkup(score = 0, alerts = 0, modules = [], bleStatus = 'offline', internetStatus = 'offline') {
  const criticalCount = Array.isArray(modules)
    ? modules.filter((module) => module.status === 'critical').length
    : 0;

  const badges = [];

  if (score >= 90) badges.push({ text: '🏆 Grid Guardian', type: 'good' });
  if (alerts <= 1) badges.push({ text: '🛡 Low Alert Load', type: 'good' });
  if (criticalCount >= 1) badges.push({ text: '🚨 Critical Module Watch', type: 'bad' });
  if (score >= 70 && score < 90) badges.push({ text: '⚡ Stable Operator', type: 'warn' });

  if (bleStatus === 'ready') badges.push({ text: '📶 BLE Ready', type: 'good' });
  if (bleStatus === 'pairing') badges.push({ text: '🔄 BLE Pairing', type: 'warn' });

  if (internetStatus === 'online') badges.push({ text: '🌐 Cloud Online', type: 'good' });
  if (internetStatus === 'degraded') badges.push({ text: '🟠 Internet Degraded', type: 'warn' });
  if (internetStatus === 'offline') badges.push({ text: '🔴 Cloud Offline', type: 'bad' });

  return badges.map((badge) => `
    <div class="badge ${badge.type}">${badge.text}</div>
  `).join('');
}

/* =========================
   SENSOR VALUE STYLING
========================= */
function tempClass(value) {
  if (value >= 38) return 'temp-bad';
  if (value >= 32) return 'temp-warn';
  return 'temp-good';
}

function voltageClass(value) {
  if (value < 3.45 || value > 4.15) return 'voltage-bad';
  if (value < 3.58 || value > 4.05) return 'voltage-warn';
  return 'voltage-good';
}

function statusClass(status) {
  if (status === 'critical' || status === 'offline') return 'status-critical';
  if (status === 'warning' || status === 'pairing' || status === 'degraded') return 'status-warning';
  return 'status-healthy';
}

/* =========================
   CARD RENDER HELPERS
========================= */
function cardShell(title, subtitle, body, status = 'healthy') {
  return `
    <div class="sensor-card">
      <div class="sensor-top">
        <div>
          <div class="sensor-title">${title}</div>
          <div class="sensor-location">${subtitle}</div>
        </div>
        <div class="status-pill ${statusClass(status)}">${status}</div>
      </div>
      ${body}
    </div>
  `;
}

function statBox(label, value) {
  return `
    <div class="stat-box">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
    </div>
  `;
}

function temperatureCard(module) {
  const temps = Array.isArray(module.temperatures) ? module.temperatures : [];
  const tempStats = temps.map((value, index) =>
    statBox(`T${index + 1}`, `<span class="${tempClass(value)}">${value}°C</span>`)
  ).join('');

  return cardShell(
    'Temperature Cluster',
    `${module.name ?? 'Battery Module'} · 5 thermal probes`,
    `<div class="sensor-stats">${tempStats}</div>
     <div class="updated">Updated: ${module.updatedAt ? new Date(module.updatedAt).toLocaleTimeString() : '--'}</div>`,
    module.status ?? 'healthy'
  );
}

function voltageCard(module, startIndex, endIndex, title) {
  const voltages = Array.isArray(module.voltages) ? module.voltages.slice(startIndex, endIndex) : [];
  const voltageStats = voltages.map((value, idx) =>
    statBox(`V${startIndex + idx + 1}`, `<span class="${voltageClass(value)}">${value}V</span>`)
  ).join('');

  return cardShell(
    title,
    `${module.name ?? 'Battery Module'} · cell monitor group`,
    `<div class="sensor-stats">${voltageStats}</div>
     <div class="updated">Updated: ${module.updatedAt ? new Date(module.updatedAt).toLocaleTimeString() : '--'}</div>`,
    module.status ?? 'healthy'
  );
}

function gasCard(module) {
  return cardShell(
    'Gas + CO₂',
    `${module.name ?? 'Battery Module'} · enclosure air monitoring`,
    `<div class="sensor-stats">
      ${statBox('Gas', `${module.gasPpm ?? '--'} ppm`)}
      ${statBox('CO₂', `${module.co2Ppm ?? '--'} ppm`)}
    </div>
    <div class="updated">Updated: ${module.updatedAt ? new Date(module.updatedAt).toLocaleTimeString() : '--'}</div>`,
    module.status ?? 'healthy'
  );
}

function motionCard(module) {
  return cardShell(
    'Motion + Laser',
    `${module.name ?? 'Battery Module'} · structural monitoring`,
    `<div class="sensor-stats">
      ${statBox('Laser', `${module.laserMm ?? '--'} mm`)}
      ${statBox('Vibration', `${module.vibrationG ?? '--'} g`)}
    </div>
    <div class="updated">Updated: ${module.updatedAt ? new Date(module.updatedAt).toLocaleTimeString() : '--'}</div>`,
    module.status ?? 'healthy'
  );
}

function statusCard(module) {
  return cardShell(
    'Module Status',
    `Module ID: ${module.id ?? '--'} · Zone: ${module.location ?? '--'}`,
    `<div class="sensor-stats">
      ${statBox('Health', String(module.status ?? '--').toUpperCase())}
      ${statBox('BLE', String(module.bleStatus ?? '--').toUpperCase())}
      ${statBox('Cloud', String(module.internetStatus ?? '--').toUpperCase())}
    </div>
    <div class="updated">Updated: ${module.updatedAt ? new Date(module.updatedAt).toLocaleTimeString() : '--'}</div>`,
    module.status ?? 'healthy'
  );
}

function renderSensorFleet(modules = []) {
  if (!Array.isArray(modules) || modules.length === 0) {
    return `
      <div class="sensor-card">
        <div class="sensor-top">
          <div>
            <div class="sensor-title">No Sensor Data</div>
            <div class="sensor-location">Waiting for telemetry payload...</div>
          </div>
          <div class="status-pill status-warning">waiting</div>
        </div>
        <div class="updated">Check API response and connectivity.</div>
      </div>
    `;
  }

  return modules.map((module) => [
    temperatureCard(module),
    voltageCard(module, 0, 5, 'Voltage Bank A'),
    voltageCard(module, 5, 10, 'Voltage Bank B'),
    gasCard(module),
    motionCard(module),
    statusCard(module),
  ].join('')).join('');
}

/* =========================
   DASHBOARD LOAD
========================= */
async function loadDashboard() {
  try {
    const res = await fetch('/api/sensors');
    const data = await res.json();

    const score = data.score ?? 0;
    const alerts = data.alerts ?? 0;
    const bleStatus = data.bleStatus ?? 'offline';
    const internetStatus = data.internetStatus ?? 'offline';
    const modules = Array.isArray(data.modules) ? data.modules : [];

    document.getElementById('scoreValue').textContent = `${score}%`;
    document.getElementById('alertsValue').textContent = alerts;
    document.getElementById('scoreBar').style.width = `${score}%`;

    updateTabStatus(alerts, modules);
    updateConnectionBadges(bleStatus, internetStatus);

    if (score >= 80) {
      points += 25;
      streak += 1;
    } else {
      points += 5;
      streak = 0;
    }

    document.getElementById('pointsValue').textContent = points;
    document.getElementById('streakValue').textContent = streak;

    document.getElementById('badges').innerHTML = badgeMarkup(
      score,
      alerts,
      modules,
      bleStatus,
      internetStatus
    );

    const sensorGrid = document.getElementById('sensorGrid');
    if (sensorGrid) {
      sensorGrid.innerHTML = renderSensorFleet(modules);
    }
  } catch (err) {
    console.error('Dashboard load failed:', err);

    document.getElementById('badges').innerHTML = `
      <div class="badge bad">⚠️ Telemetry Unavailable</div>
    `;

    const sensorGrid = document.getElementById('sensorGrid');
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

loadDashboard();
setInterval(loadDashboard, 5000);