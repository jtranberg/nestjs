const API_BASE = "http://localhost:3000";
const OBS_URL = `${API_BASE}/observability`;

async function loadObservability() {
  try {
    const res = await fetch(OBS_URL);
    const data = await res.json();

    document.getElementById("totalRequests").textContent = data.summary.total;
    document.getElementById("successRate").textContent =
      `${data.summary.successRate}%`;
    document.getElementById("avgLatency").textContent =
      `${data.summary.avgLatency} ms`;
    document.getElementById("failedRequests").textContent =
      data.summary.failed;

    const tbody = document.getElementById("eventsTableBody");
    tbody.innerHTML = "";

    if (!data.events.length) {
      tbody.innerHTML = `<tr><td colspan="5">No data yet.</td></tr>`;
      return;
    }

    data.events.forEach((event) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${new Date(event.timestamp).toLocaleTimeString()}</td>
        <td>${event.method}</td>
        <td>${event.path}</td>
        <td>${event.statusCode}</td>
        <td>${event.durationMs} ms</td>
      `;

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Failed to load observability data:", err);
  }
}

async function clearObservability() {
  try {
    await fetch(OBS_URL, { method: "DELETE" });
    loadObservability();
  } catch (err) {
    console.error("Failed to clear observability data:", err);
  }
}

document.getElementById("refreshBtn").addEventListener("click", loadObservability);
document.getElementById("clearBtn").addEventListener("click", clearObservability);

loadObservability();