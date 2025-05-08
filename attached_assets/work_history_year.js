document.addEventListener("DOMContentLoaded", () => {
    loadYearSummary(selectedYear);
  });
  
  // 🔹 Utility Formatters
  const formatMoney = (val) =>
    `$${Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  
  const formatNumber = (val, digits = 1) =>
    Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  
  const clearTabs = () => {
    document.querySelectorAll(".tab-content-area").forEach((el) => (el.style.display = "none"));
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  };
  
  // 🔹 Switch Tabs on Click
  function setupTabs() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        clearTabs();
        btn.classList.add("active");
        document.getElementById(target).style.display = "block";
      });
    });
  
    // Default to first tab
    const first = document.querySelector(".tab-btn");
    if (first) first.click();
  }
  
  function loadYearSummary(year) {
    fetch(`/api/workhistory/summary/year/${year}`)
      .then((res) => res.json())
      .then((data) => {
        renderSummaryCards(data.summary);
        renderQuarterlyTable(data.quarterly_summary);
        // Store global averages for NCR once when loading the page
        window.ncrAverages = data.ncr_averages;  
        // Load tabbed sections
        renderOverrunTab(data.top_overruns);
        renderNCRTab(data.ncr_summary);
        renderWorkcenterTab(data.workcenter_summary);
        renderRepeatTab(data.repeat_ncr_failures);
        renderJobAdjustTab(data); // full object with all adjustment fields

  
        setupTabs(); // Setup interactive tab controls
      });
  }
  
  // 🔹 Summary Cards Renderer
  function renderSummaryCards(s) {
    const html = `
      ${generateCard("Planned Hours", formatNumber(s.total_planned_hours))}
      ${generateCard("Actual Hours", formatNumber(s.total_actual_hours))}
      ${generateCard("Overrun Hours", formatNumber(s.total_overrun_hours), "text-danger")}
      ${generateCard("Ghost Hours", formatNumber(s.ghost_hours), "text-muted", "*Planned time with no recorded work")}
      ${generateCard("NCR Hours", formatNumber(s.total_ncr_hours), "text-warning")}
      ${generateCard("Planned Cost", formatMoney(s.total_planned_cost))}
      ${generateCard("Actual Cost", formatMoney(s.total_actual_cost), "text-danger")}
      ${generateCard("Opportunity Cost", formatMoney(s.opportunity_cost_dollars), "text-danger")}
      ${generateCard("Suggested Buffer", `${s.recommended_buffer_percent.toFixed(1)}%`, "text-primary")}
      ${generateCard("Total Jobs", formatNumber(s.total_jobs, 0))}
      ${generateCard("Total Operations", formatNumber(s.total_operations, 0))}
      ${generateCard("Unique Parts", formatNumber(s.total_unique_parts, 0))}
    `;
    document.getElementById("yearSummaryCards").innerHTML = html;
  }
 
 
  // 🔹 Quarterly Table Renderer
  function renderQuarterlyTable(rows) {
    const html = rows
      .map(
        (r) => `
      <tr>
        <td>${r.quarter}</td>
        <td>${formatNumber(r.planned_hours)}</td>
        <td>${formatNumber(r.actual_hours)}</td>
        <td>${formatNumber(r.overrun_hours)}</td>
        <td class="text-danger">${formatMoney(r.overrun_cost)}</td>
        <td>${formatNumber(r.total_jobs, 0)}</td>
      </tr>`
      )
      .join("");
  
    document.getElementById("quarterlyTable").innerHTML = `
      <thead>
        <tr>
          <th>Quarter</th><th>Planned</th><th>Actual</th><th>Overrun</th><th>Cost</th><th>Jobs</th>
        </tr>
      </thead>
      <tbody>${html}</tbody>
    `;
  }
  
  // 🔸 Metric Card Generator
  function generateCard(label, value, color = "", tooltip = "") {
    return `
      <div class="col-md-3 mb-3">
        <div class="card shadow-sm">
          <div class="card-body">
            <div class="card-label d-flex justify-content-between align-items-center">
              ${label}
              ${tooltip ? `<span class="ms-2 text-muted" title="${tooltip}">❔</span>` : ""}
            </div>
            <div class="card-value fw-bold ${color}">${value}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  
// 🔸 Utility to create metric headers for tab sections
function renderTabMetrics(containerId, metrics) {
    const html = metrics.map(m =>
      `<div class="col-md-3 mb-2">
        <div class="card card-metric shadow-sm">
          <div class="card-body py-2">
            <div class="card-label">${m.label}</div>
            <div class="card-value ${m.class || ""}">${m.value}</div>
          </div>
        </div>
      </div>`
    ).join("");
    document.getElementById(containerId).innerHTML = `<div class="row">${html}</div>`;
  }
  
  // 🔹 1. Top Overruns Tab
  function renderOverrunTab(rows) {
    const container = document.getElementById("topOverrunSection");
    const table = document.getElementById("topOverrunTable");
  
    if (!rows.length) return container.classList.add("d-none");
  
    const totalCost = rows.reduce((sum, r) => sum + r.overrun_cost, 0);
    const totalHours = rows.reduce((sum, r) => sum + r.overrun_hours, 0);
  
    renderTabMetrics("topOverrunMetrics", [
      { label: "Total Overrun Cost", value: formatMoney(totalCost), class: "text-danger" },
      { label: "Total Overrun Hours", value: formatNumber(totalHours), class: "text-danger" },
      { label: "Affected Operations", value: formatNumber(rows.length, 0) }
    ]);
  
    table.innerHTML = `
      <thead><tr>
        <th>Job</th><th>Part</th><th>Work Center</th><th>Task</th>
        <th>Planned</th><th>Actual</th><th>Overrun</th><th>Cost</th>
      </tr></thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.job_number}</td><td>${r.part_name}</td><td>${r.work_center}</td>
            <td>${r.task_description}</td><td>${formatNumber(r.planned_hours)}</td>
            <td>${formatNumber(r.actual_hours)}</td><td>${formatNumber(r.overrun_hours)}</td>
            <td class="text-danger">${formatMoney(r.overrun_cost)}</td>
          </tr>`).join("")}
      </tbody>
    `;
  }
  
  // 🔹 2. NCR Summary Tab
  function renderNCRTab(rows) {
    const filtered = rows.filter(r => r.total_ncr_cost > 0);
    const container = document.getElementById("ncrSection");
    const table = document.getElementById("ncrTable");
  
    if (!filtered.length) return container.classList.add("d-none");
  
    const totalCost = filtered.reduce((sum, r) => sum + r.total_ncr_cost, 0);
    const totalHours = filtered.reduce((sum, r) => sum + r.total_ncr_hours, 0);
    const totalParts = filtered.length;
    const totalOccurrences = filtered.reduce((sum, r) => sum + r.ncr_occurrences, 0);
    
    // 💡 Pull all-time averages from global data object
    const avgCost = window.ncrAverages?.avg_ncr_cost_per_year || 0;
    const avgParts = window.ncrAverages?.avg_parts_with_ncr_per_year || 0;
  
    // 🎯 Metric Cards
    renderTabMetrics("ncrMetrics", [
      { label: "Total NCR Cost", value: formatMoney(totalCost), class: "text-warning" },
      { label: "Total NCR Hours", value: formatNumber(totalHours), class: "text-warning" },
      { label: "Affected Parts", value: formatNumber(totalParts, 0) },
      { label: "Avg Cost / Part", value: formatMoney(totalCost / totalParts), class: "text-muted" },
      { label: "Avg Occurrences / Part", value: formatNumber(totalOccurrences / totalParts, 1), class: "text-muted" },
      { label: "📊 Avg Yearly NCR Cost (All Time)", value: formatMoney(avgCost), class: "text-info" },
      { label: "📦 Avg NCR Parts/Year", value: formatNumber(avgParts, 0), class: "text-info" }
    ]);
  
    // 🔍 Filter Input
    const filterInput = `
      <input type="text" id="ncrFilterInput" class="form-control form-control-sm mb-2" placeholder="🔍 Filter parts...">
    `;
  
    // 📄 Table Rows
    const bodyRows = filtered.map((r, i) => `
      <tr data-index="${i}" class="ncr-part-row" style="cursor:pointer;">
        <td>${r.part_name}</td>
        <td>${formatNumber(r.total_ncr_hours)}</td>
        <td class="text-warning">${formatMoney(r.total_ncr_cost)}</td>
        <td>${formatNumber(r.ncr_occurrences, 0)}</td>
      </tr>
      <tr class="ncr-detail-row d-none" id="ncr-detail-${i}">
        <td colspan="4" class="bg-light-subtle text-dark small">
          <div class="spinner-border spinner-border-sm text-secondary" role="status"></div> Loading...
        </td>
      </tr>
    `).join("");
  
    table.innerHTML = `
      <thead><tr><th>Part</th><th>NCR Hours</th><th>Cost</th><th>Occurrences</th></tr></thead>
      <tbody>${bodyRows}</tbody>
    `;
  
    // Insert Filter Input
    table.insertAdjacentHTML("beforebegin", filterInput);
  
    // 🔎 Filter Logic
    document.getElementById("ncrFilterInput").addEventListener("input", function () {
      const val = this.value.toLowerCase();
      const rows = table.querySelectorAll(".ncr-part-row");
      rows.forEach(row => {
        const txt = row.children[0].innerText.toLowerCase();
        row.style.display = txt.includes(val) ? "" : "none";
      });
    });
  
    // 🔽 Click to Expand Row (Filtered by Part)
    document.querySelectorAll(".ncr-part-row").forEach(row => {
      row.addEventListener("click", async () => {
        const index = row.getAttribute("data-index");
        const detailRow = document.getElementById(`ncr-detail-${index}`);
  
        if (!detailRow.classList.contains("d-none")) {
          detailRow.classList.add("d-none");
          return;
        }
  
        document.querySelectorAll(".ncr-detail-row").forEach(r => r.classList.add("d-none"));
        detailRow.classList.remove("d-none");
  
        const partName = row.children[0].innerText;
        const res = await fetch(`/api/workhistory/ncr/details?year=${selectedYear}&part=${encodeURIComponent(partName)}`);
        const { job_data: jobs, all_time_averages } = await res.json();

  

  
        const jobListHTML = jobs.length
          ? `
            <table class="table table-sm table-bordered table-light mb-0">
              <thead class="small text-muted">
                <tr><th>Job #</th><th>Work Order</th><th>NCR Hours</th></tr>
              </thead>
              <tbody>
                ${jobs.map(j => `
                  <tr>
                    <td>${j.job_number}</td>
                    <td>${j.work_order_number}</td>
                    <td>${formatNumber(j.ncr_hours)}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
          `
          : `<div class="text-muted">No NCR records found for this part.</div>`;
  
        detailRow.children[0].innerHTML = jobListHTML;
      });
    });
  }
  
  
  
  // 🔹 3. Work Center Summary Tab
  function renderWorkcenterTab(rows) {
    const container = document.getElementById("workcenterSection");
    const table = document.getElementById("workcenterTable");
  
    if (!rows.length) return container.classList.add("d-none");
  
    const totalCost = rows.reduce((sum, r) => sum + r.overrun_cost, 0);
    const totalCenters = rows.length;
  
    renderTabMetrics("workcenterMetrics", [
      { label: "Work Centers", value: formatNumber(totalCenters, 0) },
      { label: "Total Overrun Cost", value: formatMoney(totalCost), class: "text-danger" }
    ]);
  
    table.innerHTML = `
      <thead><tr>
        <th>Work Center</th><th>Planned</th><th>Actual</th><th>Overrun</th><th>Cost</th>
      </tr></thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.work_center}</td>
            <td>${formatNumber(r.planned_hours)}</td>
            <td>${formatNumber(r.actual_hours)}</td>
            <td>${formatNumber(r.overrun_hours)}</td>
            <td class="text-danger">${formatMoney(r.overrun_cost)}</td>
          </tr>`).join("")}
      </tbody>
    `;
  }
  
  // 🔹 4. Repeat NCR Failures Tab
  function renderRepeatTab(rows) {
    const container = document.getElementById("repeatSection");
    const table = document.getElementById("repeatTable");
  
    if (!rows.length) return container.classList.add("d-none");
  
    const totalRepeats = rows.length;
  
    renderTabMetrics("repeatMetrics", [
      { label: "Repeat NCR Parts", value: formatNumber(totalRepeats, 0) }
    ]);
  
    table.innerHTML = `
      <thead><tr><th>Part</th><th>Repeat NCR Hours</th><th>NCR Jobs</th></tr></thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.part_name}</td>
            <td>${formatNumber(r.repeat_ncr_hours)}</td>
            <td>${formatNumber(r.total_ncr_jobs, 0)}</td>
          </tr>`).join("")}
      </tbody>
    `;
  }
  
  // 🔹 5. Job-Level Adjustment Tab
  function renderJobAdjustTab(data) {
    console.log("📦 Rendering Adjustments Tab...");
    const { job_adjustments = [], part_overruns = [], part_task_details = [] } = data;
  
    const container = document.getElementById("adjustSection");
    const partTable = document.getElementById("adjustPartTable");
    const jobSection = document.getElementById("adjustJobSection");
    const jobToggleBtn = document.getElementById("toggleJobBreakdown");
  
    if (!job_adjustments.length && !part_overruns.length) {
      container.classList.add("d-none");
      return;
    }
  
    // 📊 Metric Cards
    const totalJobs = job_adjustments.length;
    const totalPlanned = job_adjustments.reduce((sum, r) => sum + r.total_planned, 0);
    const totalActual = job_adjustments.reduce((sum, r) => sum + r.total_actual, 0);
    const totalNeeded = job_adjustments.reduce((sum, r) => sum + r.needed_increase, 0);
    const percent = totalPlanned ? (totalNeeded / totalPlanned) * 100 : 0;
  
    renderTabMetrics("adjustMetrics", [
      { label: "Adjusted Jobs", value: formatNumber(totalJobs, 0) },
      { label: "Total Planned (Jobs)", value: formatNumber(totalPlanned), class: "text-muted" },
      { label: "Total Actual (Jobs)", value: formatNumber(totalActual), class: "text-muted" },
      { label: "Recommended Increase", value: formatNumber(totalNeeded), class: "text-primary" },
      { label: "Suggested Increase %", value: `${percent.toFixed(1)}%`, class: "text-warning" },
      { label: "Avg Increase / Job", value: formatNumber(totalNeeded / totalJobs), class: "text-info" }
    ]);
  
    // 📦 Job Breakdown (Collapsed by Default)
    const jobCards = job_adjustments.map(j => {
      const pct = j.total_planned ? (j.needed_increase / j.total_planned) * 100 : 0;
      const barColor = pct >= 20 ? "danger" : pct >= 10 ? "warning" : "info";
      return `
        <div class="col-md-4 col-lg-4 mb-3">
          <div class="border rounded px-3 py-2 shadow-sm small bg-light-subtle text-dark">
            <div class="fw-bold mb-1">${j.job_number}</div>
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted">Planned: ${formatNumber(j.total_planned)}</span>
              <span class="text-muted">Actual: ${formatNumber(j.total_actual)}</span>
            </div>
            <div class="progress mb-1" style="height: 6px;">
              <div class="progress-bar bg-${barColor}" style="width: ${pct.toFixed(1)}%;"></div>
            </div>
            <div class="text-end text-${barColor}"><small>${pct.toFixed(1)}% Overrun</small></div>
          </div>
        </div>
      `;
    }).join("");
  
    jobSection.innerHTML = `
      <div class="mb-3 d-flex justify-content-between align-items-center">
        <h6 class="fw-bold mb-0">📘 Job-Level Adjustment Breakdown</h6>
        <button class="btn btn-sm btn-outline-primary" id="toggleJobBreakdown">Show Breakdown</button>
      </div>
      <div id="jobBreakdownGrid" class="row d-none">${jobCards}</div>
    `;
  
    // 🧩 Expand/collapse
    setTimeout(() => {
      const toggle = document.getElementById("toggleJobBreakdown");
      const grid = document.getElementById("jobBreakdownGrid");
      toggle.addEventListener("click", () => {
        const isVisible = !grid.classList.contains("d-none");
        grid.classList.toggle("d-none");
        toggle.innerText = isVisible ? "Show Breakdown" : "Hide Breakdown";
      });
    }, 100);
  
    // 📊 Part Table
    partTable.innerHTML = `
      <thead><tr><th>Part</th><th>Planned</th><th>Actual</th><th>Overrun %</th></tr></thead>
      <tbody>
        ${part_overruns.map((p, i) => `
          <tr class="adjust-part-row" data-index="${i}" style="cursor:pointer;">
            <td>${p.part_name}</td>
            <td>${formatNumber(p.total_planned)}</td>
            <td>${formatNumber(p.total_actual)}</td>
            <td class="text-warning">${(p.suggested_percent_increase || 0).toFixed(1)}%</td>
          </tr>
          <tr class="adjust-detail-row d-none" id="adjust-detail-${i}">
            <td colspan="4" class="bg-light text-dark small px-3 py-2">
              <div class="spinner-border spinner-border-sm text-secondary" role="status"></div> Loading tasks...
            </td>
          </tr>
        `).join("")}
      </tbody>
    `;
  
    // Expand Part → Task
    document.querySelectorAll(".adjust-part-row").forEach(row => {
      row.addEventListener("click", () => {
        const i = row.getAttribute("data-index");
        const detailRow = document.getElementById(`adjust-detail-${i}`);
        if (!detailRow) return;
  
        if (!detailRow.classList.contains("d-none")) {
          detailRow.classList.add("d-none");
          return;
        }
  
        document.querySelectorAll(".adjust-detail-row").forEach(r => r.classList.add("d-none"));
        detailRow.classList.remove("d-none");
  
        const partName = row.children[0].innerText;
        const tasks = part_task_details.filter(t => t.part_name === partName);
  
        const taskBreakdown = tasks.length
          ? `
            <table class="table table-sm table-bordered table-light mb-0">
              <thead class="small text-muted">
                <tr><th>Task</th><th>Planned</th><th>Actual</th><th>Overrun %</th></tr>
              </thead>
              <tbody>
                ${tasks.map(t => `
                  <tr>
                    <td>${t.task_description}</td>
                    <td>${formatNumber(t.total_planned)}</td>
                    <td>${formatNumber(t.total_actual)}</td>
                    <td class="text-danger">${(t.suggested_percent_increase || 0).toFixed(1)}%</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `
          : `<div class="text-muted small">No overrun task data available for this part.</div>`;
  
        detailRow.children[0].innerHTML = taskBreakdown;
      });
    });
  }
  
  
  
  
  
  
  
  buildCharts(data);  
//Charts
function buildCharts(data) {
    // 📊 Bar Chart – Quarterly Planned vs Actual Hours
    const ctxQuarter = document.getElementById("chartQuarterlyHours").getContext("2d");
    new Chart(ctxQuarter, {
      type: "bar",
      data: {
        labels: data.quarterly_summary.map(q => q.quarter),
        datasets: [
          {
            label: "Planned Hours",
            data: data.quarterly_summary.map(q => q.planned_hours),
            backgroundColor: "#0d6efd",
          },
          {
            label: "Actual Hours",
            data: data.quarterly_summary.map(q => q.actual_hours),
            backgroundColor: "#dc3545",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "📅 Planned vs Actual Hours by Quarter",
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${formatNumber(ctx.raw)} hrs`,
            },
          },
        },
      },
    });
  
    // 💸 Overrun Cost Chart
    const ctxOverrun = document.getElementById("chartOverrunCost").getContext("2d");
    new Chart(ctxOverrun, {
      type: "bar",
      data: {
        labels: data.quarterly_summary.map(q => q.quarter),
        datasets: [{
          label: "Overrun Cost ($)",
          data: data.quarterly_summary.map(q => q.overrun_cost),
          backgroundColor: "rgba(220,53,69,0.6)",
          borderColor: "rgba(220,53,69,1)",
          borderWidth: 1
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "🔥 Overrun Cost by Quarter"
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `Overrun: ${formatMoney(ctx.raw)}`
            }
          }
        }
      }
    });
  }
  