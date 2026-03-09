let points = 0;
let streak = 0;

function updateTabStatus(alerts, sensors) {
  const criticalCount = sensors.filter((s) => s.status === 'critical').length;

  if (criticalCount > 0) {
    document.title = "🚨 Energy Ops Dashboard";
  } else if (alerts > 0) {
    document.title = "⚠️ Energy Ops Dashboard";
  } else {
    document.title = "⚡ Energy Ops Dashboard";
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

function updateConnectionBadges(bleStatus, internetStatus) {
  const bleBadge = document.getElementById('bleBadge');
  const internetBadge = document.getElementById('internetBadge');

  bleBadge.innerHTML = `
    <span class="indicator-dot ${getBleIndicatorClass(bleStatus)}"></span>
    <span>BLE: ${bleStatus.toUpperCase()}</span>
  `;

  internetBadge.innerHTML = `
    <span class="indicator-dot ${getInternetIndicatorClass(internetStatus)}"></span>
    <span>Internet: ${internetStatus.toUpperCase()}</span>
  `;
}

function badgeMarkup(score, alerts, sensors, bleStatus, internetStatus) {
  const healthyCount = sensors.filter((s) => s.status === 'healthy').length;
  const criticalCount = sensors.filter((s) => s.status === 'critical').length;

  const badges = [];

  if (score >= 90) badges.push({ text: '🏆 Grid Guardian', type: 'good' });
  if (healthyCount >= 3) badges.push({ text: '✅ All Systems Strong', type: 'good' });
  if (alerts <= 1) badges.push({ text: '🛡 Low Alert Load', type: 'good' });
  if (criticalCount >= 1) badges.push({ text: '🚨 Critical Watch', type: 'bad' });
  if (score >= 70 && score < 90) badges.push({ text: '⚡ Stable Operator', type: 'warn' });

  if (bleStatus === 'ready') badges.push({ text: '📶 BLE Ready', type: 'good' });
  if (bleStatus === 'pairing') badges.push({ text: '🔄 BLE Pairing', type: 'warn' });
  if (internetStatus === 'online') badges.push({ text: '🌐 Cloud Online', type: 'good' });
  if (internetStatus === 'degraded') badges.push({ text: '🟠 Internet Degraded', type: 'warn' });
  if (internetStatus === 'offline') badges.push({ text: '🔴 Cloud Offline', type: 'bad' });

  return badges
    .map((b) => `<div class="badge ${b.type}">${b.text}</div>`)
    .join('');
}

function sensorMarkup(sensor) {
  return `
    <div class="sensor-card">
      <div class="sensor-top">
        <div>
          <div class="sensor-title">${sensor.name}</div>
          <div class="sensor-location">${sensor.location}</div>
        </div>
        <div class="status-pill status-${sensor.status}">${sensor.status}</div>
      </div>

      <div class="sensor-stats">
        <div class="stat-box">
          <div class="stat-label">Temperature</div>
          <div class="stat-value">${sensor.temperature}°C</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Voltage</div>
          <div class="stat-value">${sensor.voltage}V</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">State of Charge</div>
          <div class="stat-value">${sensor.soc}%</div>
        </div>
      </div>

      <div class="updated">
        Updated: ${new Date(sensor.updatedAt).toLocaleTimeString()}
      </div>
    </div>
  `;
}

async function loadDashboard() {
  try {
    const res = await fetch('/api/sensors');
    const data = await res.json();

    document.getElementById('scoreValue').textContent = `${data.score}%`;
    document.getElementById('alertsValue').textContent = data.alerts;
    document.getElementById('scoreBar').style.width = `${data.score}%`;

    updateTabStatus(data.alerts, data.sensors);
    updateConnectionBadges(data.bleStatus, data.internetStatus);

    if (data.score >= 80) {
      points += 25;
      streak += 1;
    } else {
      points += 5;
      streak = 0;
    }

    document.getElementById('pointsValue').textContent = points;
    document.getElementById('streakValue').textContent = streak;

    document.getElementById('badges').innerHTML =
      badgeMarkup(
        data.score,
        data.alerts,
        data.sensors,
        data.bleStatus,
        data.internetStatus
      );

    document.getElementById('sensorGrid').innerHTML =
      data.sensors.map(sensorMarkup).join('');
  } catch (err) {
    console.error('Dashboard load failed:', err);
  }
}

loadDashboard();
setInterval(loadDashboard, 5000);