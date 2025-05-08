document.addEventListener("DOMContentLoaded", () => {
    loadSummaryMetrics();
    loadYearlySummary();
    loadCustomerProfitability();
    loadPartPerformance();
    loadWorkcenterTrends();
    setupMetricClickHandlers();
});

// 💲 Utility to format currency consistently
const formatMoney = (value) =>
    `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// 🔢 Format numbers with commas
const formatNumber = (value, digits = 1) =>
    Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });

// 🔹 Load and display summary metrics
function loadSummaryMetrics() {
    fetch("/api/workhistory/summary/full")
        .then(res => res.json())
        .then(data => {
            const s = data.summary;
            // 💡 Derived values
            const overrunPercent = s.total_planned_hours > 0
                ? ((s.total_overrun_hours / s.total_planned_hours) * 100).toFixed(1) + "%"
                : "N/A";

            const avgCostPerHour = s.total_actual_hours > 0
                ? formatMoney(s.total_actual_cost / s.total_actual_hours)
                : "N/A";

            const overrunCost = s.total_actual_cost - s.total_planned_cost > 0
                ? formatMoney(s.total_actual_cost - s.total_planned_cost)
                : "$0";

            const avgJobSize = s.total_jobs > 0
                ? formatNumber(s.total_planned_hours / s.total_jobs)
                : "N/A";

            // 🔹 Metric Cards (top overview)
            const cardHTML = `
            <div class="col-md-3 mb-3">
                <div class="card shadow-sm clickable-metric" data-metric="planned_hours">
                <div class="card-body">
                    <div class="card-label">Planned Hours</div>
                    <div class="card-value">${formatNumber(s.total_planned_hours)}</div>
                </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card shadow-sm clickable-metric" data-metric="planned_cost">
                <div class="card-body">
                    <div class="card-label">Planned Cost</div>
                    <div class="card-value text-secondary">${formatMoney(s.total_planned_cost)}</div>
                </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card shadow-sm clickable-metric" data-metric="actual_hours">
                <div class="card-body">
                    <div class="card-label">Actual Hours</div>
                    <div class="card-value">${formatNumber(s.total_actual_hours)}</div>
                </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card shadow-sm clickable-metric" data-metric="actual_cost">
                <div class="card-body">
                    <div class="card-label">Actual Cost</div>
                    <div class="card-value text-danger">${formatMoney(s.total_actual_cost)}</div>
                </div>
                </div>
            </div>

            <div class="col-md-3 mb-3">
                <div class="card shadow-sm clickable-metric" data-metric="total_operations">
                <div class="card-body">
                    <div class="card-label">Total Operations</div>
                    <div class="card-value">${Number(s.total_operations).toLocaleString()}</div>
                </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card shadow-sm clickable-metric" data-metric="total_jobs">
                <div class="card-body">
                    <div class="card-label">Total Jobs</div>
                    <div class="card-value">${Number(s.total_jobs).toLocaleString()}</div>
                </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card shadow-sm clickable-metric" data-metric="total_customers">
                <div class="card-body">
                    <div class="card-label">Total Customers</div>
                    <div class="card-value">${Number(s.total_customers).toLocaleString()}</div>
                </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card shadow-sm clickable-metric" data-metric="ncr_hours">
                <div class="card-body">
                    <div class="card-label">NCR Hours</div>
                    <div class="card-value text-warning">${formatNumber(s.total_ncr_hours)}</div>
                </div>
                </div>
            </div>

            <div class="col-md-12 mb-3">
                <div class="card bg-light shadow-sm clickable-metric" data-metric="overrun_hours">
                <div class="card-body">
                    <div class="card-label">All-Time Overrun Hours</div>
                    <div class="card-value text-danger">${formatNumber(s.total_overrun_hours)}</div>
                </div>
                </div>
            </div>

            <div class="col-md-3 mb-3">
                <div class="card shadow-sm clickable-metric" data-metric="overrun_percent">
                <div class="card-body">
                    <div class="card-label">Overrun %</div>
                    <div class="card-value text-danger">${overrunPercent}</div>
                </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card shadow-sm clickable-metric" data-metric="avg_cost_per_hour">
                <div class="card-body">
                    <div class="card-label">Avg Cost / Hour</div>
                    <div class="card-value text-secondary">${avgCostPerHour}</div>
                </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card shadow-sm clickable-metric" data-metric="overrun_cost">
                <div class="card-body">
                    <div class="card-label">Overrun Cost</div>
                    <div class="card-value text-danger">${overrunCost}</div>
                </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card shadow-sm clickable-metric" data-metric="avg_job_size">
                <div class="card-body">
                    <div class="card-label">Avg Job Size (hrs)</div>
                    <div class="card-value">${avgJobSize}</div>
                </div>
                </div>
            </div>
            `;

            const metricContainer = document.getElementById("metricCards");
            if (metricContainer) {
                metricContainer.innerHTML = cardHTML;
                // 🚀 Add click listeners to each card
                document.querySelectorAll(".clickable-metric").forEach(card => {
                    card.addEventListener("click", () => {
                        const metric = card.getAttribute("data-metric");
                        if (metric) window.location.href = `/workhistory/metric/${metric}`;
                    });
                });
            }
            // 🔹 Yearly Breakdown Table
            const yt = data.yearly_breakdown || [];
            const yTable = document.getElementById("yearlyTable");
            if (yTable) {
                yTable.innerHTML = `
                    <thead><tr>
                        <th>Year</th><th>Planned</th><th>Actual</th><th>Overrun</th>
                        <th>NCR</th><th>Jobs</th><th>Ops</th><th>Customers</th>
                    </tr></thead>
                    <tbody>
                        ${yt.map(r => `
                            <tr class="clickable-row" data-year="${r.year}">
                                <td>${r.year}</td>
                                <td>${formatNumber(r.planned_hours)}</td>
                                <td>${formatNumber(r.actual_hours)}</td>
                                <td class="text-danger">${formatNumber(r.overrun_hours)}</td>
                                <td class="text-warning">${formatNumber(r.ncr_hours)}</td>
                                <td>${Number(r.job_count).toLocaleString()}</td>
                                <td>${Number(r.operation_count).toLocaleString()}</td>
                                <td>${Number(r.customer_count).toLocaleString()}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                `;

                // Enable row click to navigate by year
                document.querySelectorAll("#yearlyTable .clickable-row").forEach(row => {
                    row.addEventListener("click", () => {
                        const year = row.getAttribute("data-year");
                        if (year) window.location.href = `/workhistory/year/${year}`;
                    });
                });
            }

            // 🔹 Work Center Breakdown Table
            const wc = data.workcenter_breakdown || [];
            const wcTable = document.getElementById("workcenterTable");
            if (wcTable) {
                wcTable.innerHTML = `
                    <thead><tr>
                        <th>Work Center</th>
                        <th>Planned</th>
                        <th>Actual</th>
                        <th>Overrun</th>
                    </tr></thead>
                    <tbody>
                        ${wc.map(r => `
                            <tr>
                                <td>${r.work_center}</td>
                                <td>${formatNumber(r.total_planned_hours)}</td>
                                <td>${formatNumber(r.total_actual_hours)}</td>
                                <td class="text-danger">${formatNumber(r.overrun_hours)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                `;
            }
        })
        .catch(err => {
            console.error("❌ Error loading summary metrics:", err);
            alert("Failed to load work history summary. Please check the console for details.");
        });
}







// charts
// 🔹 Load Total Part Count + Labor Cost Summary
function loadYearlySummary() {
    fetch("/api/workhistory/summary/yearly")
        .then(res => res.json())
        .then(data => {
            const totalParts = data.reduce((sum, row) => sum + Number(row.unique_parts || 0), 0);
            const totalCost = data.reduce((sum, row) => sum + Number(row.actual_cost || 0), 0);

            const cardHTML = `
                <div class="col-md-6 mb-3">
                    <div class="card shadow">
                        <div class="card-body">
                            <h5>Total Parts Worked On</h5>
                            <p class="h3 text-success">${totalParts.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="card shadow">
                        <div class="card-body">
                            <h5>Total Cost (Labor)</h5>
                            <p class="h3 text-danger">${formatMoney(totalCost)}</p>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById("summaryCards").innerHTML = cardHTML;

            const ctx = document.getElementById("yearlyTrendChart").getContext("2d");
            new Chart(ctx, {
                type: "bar",
                data: {
                    labels: data.map(r => r.year),
                    datasets: [
                        {
                            label: "Actual Cost ($)",
                            data: data.map(r => r.actual_cost),
                            backgroundColor: "#dc3545"
                        },
                        {
                            label: "Planned Hours",
                            data: data.map(r => r.planned_hours),
                            backgroundColor: "#0d6efd"
                        },
                        {
                            label: "Actual Hours",
                            data: data.map(r => r.actual_hours),
                            backgroundColor: "#198754"
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: { display: true, text: "📅 Yearly Labor Cost & Hours" },
                        tooltip: {
                            callbacks: {
                                label: function (ctx) {
                                    const value = ctx.raw;
                                    return ctx.dataset.label.includes("Cost")
                                        ? formatMoney(value)
                                        : formatNumber(value);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function (value) {
                                    return this.getLabelForValue(value).toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        });
}

// 🔹 Load Customer Profitability Chart
function loadCustomerProfitability() {
    fetch("/api/workhistory/summary/customers")
        .then(res => res.json())
        .then(data => {
            const sorted = data.sort((a, b) => b.profit_loss - a.profit_loss).slice(0, 10);
            const ctx = document.getElementById("customerProfitChart").getContext("2d");
            new Chart(ctx, {
                type: "bar",
                data: {
                    labels: sorted.map(r => r.customer_name),
                    datasets: [
                        {
                            label: "Profit / Loss",
                            data: sorted.map(r => r.profit_loss),
                            backgroundColor: sorted.map(r => r.profit_loss >= 0 ? "green" : "red")
                        }
                    ]
                },
                options: {
                    indexAxis: "y",
                    plugins: {
                        title: { display: true, text: "🏆 Customer Profitability (Top 10)" },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.dataset.label}: ${formatMoney(ctx.raw)}`
                            }
                        }
                    }
                }
            });
        });
}

// 🔹 Load Top Performing Parts
function loadPartPerformance() {
    fetch("/api/workhistory/summary/parts")
        .then(res => res.json())
        .then(data => {
            const top = data.slice(0, 10);
            const ctx = document.getElementById("partPerformanceChart").getContext("2d");
            new Chart(ctx, {
                type: "bar",
                data: {
                    labels: top.map(r => r.part_name),
                    datasets: [{
                        label: "ROI (Planned - Actual) × Rate",
                        data: top.map(r => r.roi),
                        backgroundColor: top.map(r => r.roi >= 0 ? "#0d6efd" : "#dc3545")
                    }]
                },
                options: {
                    indexAxis: "y",
                    plugins: {
                        title: { display: true, text: "⚙️ Part Performance (Top 10 by Hours)" },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.dataset.label}: ${formatMoney(ctx.raw)}`
                            }
                        }
                    }
                }
            });
        });
}

// 🔹 Load Work Center Trends
function loadWorkcenterTrends() {
    fetch("/api/workhistory/summary/workcenters")
        .then(res => res.json())
        .then(data => {
            const ctx = document.getElementById("workcenterTrendChart").getContext("2d");
            new Chart(ctx, {
                type: "bar",
                data: {
                    labels: data.map(r => r.work_center),
                    datasets: [
                        {
                            label: "Actual Hours",
                            data: data.map(r => r.actual_hours),
                            backgroundColor: "#198754"
                        },
                        {
                            label: "Overrun Cost",
                            data: data.map(r => r.overrun_cost),
                            backgroundColor: "#dc3545"
                        }
                    ]
                },
                options: {
                    plugins: {
                        title: { display: true, text: "🏭 Work Center Load & Overruns" },
                        tooltip: {
                            callbacks: {
                                label: ctx => ctx.dataset.label.includes("Cost")
                                    ? `${ctx.dataset.label}: ${formatMoney(ctx.raw)}`
                                    : `${ctx.dataset.label}: ${formatNumber(ctx.raw)}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function (value) {
                                    return value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        });
}
