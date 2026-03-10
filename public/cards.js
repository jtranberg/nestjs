function tempClass(value) {
  if (value >= 38) return "temp-bad";
  if (value >= 32) return "temp-warn";
  return "temp-good";
}

function voltageClass(value) {
  if (value < 11.4 || value > 12.8) return "voltage-bad";
  if (value < 11.7 || value > 12.5) return "voltage-warn";
  return "voltage-good";
}

function statusClass(status) {
  if (status === "critical" || status === "offline") return "status-critical";
  if (
    status === "warning" ||
    status === "pairing" ||
    status === "degraded"
  ) {
    return "status-warning";
  }
  return "status-healthy";
}

function cardShell(title, subtitle, body, status = "healthy") {
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

  const tempStats = temps
    .map((value, index) =>
      statBox(`T${index + 1}`, `<span class="${tempClass(value)}">${value}°C</span>`)
    )
    .join("");

  return cardShell(
    "Temperature Cluster",
    `${module.name ?? "Battery Module"} · 5 thermal probes`,
    `<div class="sensor-stats">${tempStats}</div>
     <div class="updated">Updated: ${
       module.updatedAt
         ? new Date(module.updatedAt).toLocaleTimeString()
         : "--"
     }</div>`,
    module.status ?? "healthy"
  );
}

function voltageCard(
  module,
  startIndex,
  endIndex,
  title,
  bankTotalLabel,
  bankTotalValue
) {
  const voltages = Array.isArray(module.voltages)
    ? module.voltages.slice(startIndex, endIndex)
    : [];

  const voltageStats = voltages
    .map((value, idx) =>
      statBox(
        `V${startIndex + idx + 1}`,
        `<span class="${voltageClass(value)}">${value}V</span>`
      )
    )
    .join("");

  return cardShell(
    title,
    `${module.name ?? "Battery Module"} · 12V submodule bank`,
    `<div class="sensor-stats">${voltageStats}</div>
     <div class="sensor-stats" style="margin-top: 12px;">
       ${statBox(
         bankTotalLabel,
         `<span class="voltage-good">${
           bankTotalValue != null ? Number(bankTotalValue).toFixed(2) : "--"
         }V</span>`
       )}
     </div>
     <div class="updated">Updated: ${
       module.updatedAt
         ? new Date(module.updatedAt).toLocaleTimeString()
         : "--"
     }</div>`,
    module.status ?? "healthy"
  );
}

function gasCard(module) {
  return cardShell(
    "Gas + CO₂",
    `${module.name ?? "Battery Module"} · enclosure air monitoring`,
    `<div class="sensor-stats">
      ${statBox("Gas", `${module.gasPpm ?? "--"} ppm`)}
      ${statBox("CO₂", `${module.co2Ppm ?? "--"} ppm`)}
    </div>
    <div class="updated">Updated: ${
      module.updatedAt ? new Date(module.updatedAt).toLocaleTimeString() : "--"
    }</div>`,
    module.status ?? "healthy"
  );
}

function motionCard(module) {
  return cardShell(
    "Motion + Laser",
    `${module.name ?? "Battery Module"} · structural monitoring`,
    `<div class="sensor-stats">
      ${statBox("Laser", `${module.laserMm ?? "--"} mm`)}
      ${statBox("Vibration", `${module.vibrationG ?? "--"} g`)}
    </div>
    <div class="updated">Updated: ${
      module.updatedAt ? new Date(module.updatedAt).toLocaleTimeString() : "--"
    }</div>`,
    module.status ?? "healthy"
  );
}

function statusCard(module) {
  return cardShell(
    "Module Status",
    `Module ID: ${module.id ?? "--"} · Zone: ${module.location ?? "--"}`,
    `<div class="sensor-stats">
      ${statBox("Health", String(module.status ?? "--").toUpperCase())}
      ${statBox("BLE", String(module.bleStatus ?? "--").toUpperCase())}
      ${statBox("Cloud", String(module.internetStatus ?? "--").toUpperCase())}
    </div>

    <div class="sensor-stats" style="margin-top: 12px;">
      ${statBox(
        "Bank A Total",
        `${module.bankATotalVoltage != null ? Number(module.bankATotalVoltage).toFixed(2) : "--"}V`
      )}
      ${statBox(
        "Bank B Total",
        `${module.bankBTotalVoltage != null ? Number(module.bankBTotalVoltage).toFixed(2) : "--"}V`
      )}
    </div>

    <div class="total-voltage-highlight">
      <div class="total-voltage-label">Total Available Voltage</div>
      <div class="total-voltage-value">${
        module.totalAvailableVoltage != null
          ? Number(module.totalAvailableVoltage).toFixed(2)
          : "--"
      }V</div>
    </div>

    <div class="updated">Updated: ${
      module.updatedAt ? new Date(module.updatedAt).toLocaleTimeString() : "--"
    }</div>`,
    module.status ?? "healthy"
  );
}

export function renderSensorFleet(modules = []) {
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

  return modules
    .map((module) =>
      [
        temperatureCard(module),
        voltageCard(
          module,
          0,
          5,
          "Voltage Bank A",
          "Bank A Total",
          module.bankATotalVoltage
        ),
        voltageCard(
          module,
          5,
          10,
          "Voltage Bank B",
          "Bank B Total",
          module.bankBTotalVoltage
        ),
        gasCard(module),
        motionCard(module),
        statusCard(module),
      ].join("")
    )
    .join("");
}