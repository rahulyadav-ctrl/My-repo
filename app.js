// Mock data
const datasets = [
  { id: "ds-cyclone-1", name: "Cyclone-Urban-01", workspaceId: "ws-cyclone" },
  { id: "ds-cyclone-2", name: "Cyclone-Highway-02", workspaceId: "ws-cyclone" },
  { id: "ds-cyclone-3", name: "Cyclone-Night-03", workspaceId: "ws-cyclone" }
];

const rateCards = [
  {
    id: "rc-ws",
    scope: "workspace",
    scopeId: "ws-cyclone",
    name: "Cyclone Default",
    lines: [
      { dimension: "frame", modality: "multi", unit: "per_frame", rate: 0.20 },
      { dimension: "label", modality: "3d", unit: "per_label", rate: 0.35 },
      { dimension: "label", modality: "2d", unit: "per_label", rate: 0.18 },
      { dimension: "segmentation", modality: "2d", unit: "per_instance", rate: 0.30 },
      { dimension: "attribute", modality: "multi", unit: "per_attr", rate: 0.08 },
      { dimension: "scene", modality: "multi", unit: "per_scene", rate: 1.50 }
    ]
  },
  {
    id: "rc-ds-2",
    scope: "dataset",
    scopeId: "ds-cyclone-2",
    name: "Highway Override",
    lines: [
      { dimension: "frame", modality: "multi", unit: "per_frame", rate: 0.24 },
      { dimension: "label", modality: "3d", unit: "per_label", rate: 0.40 },
      { dimension: "attribute", modality: "multi", unit: "per_attr", rate: 0.10 }
    ]
  }
];

const submissions = [
  { id: "sub-1", datasetId: "ds-cyclone-1", date: "2024-11-03", frames: 1200, labels2d: 4800, labels3d: 1200, attrs: 9600, seg: 400 },
  { id: "sub-2", datasetId: "ds-cyclone-2", date: "2024-11-05", frames: 2200, labels2d: 6000, labels3d: 2100, attrs: 12800, seg: 800 },
  { id: "sub-3", datasetId: "ds-cyclone-3", date: "2024-11-07", frames: 900, labels2d: 2600, labels3d: 900, attrs: 6200, seg: 380 },
  { id: "sub-4", datasetId: "ds-cyclone-2", date: "2024-11-14", frames: 1800, labels2d: 5200, labels3d: 1800, attrs: 8800, seg: 600 },
  { id: "sub-5", datasetId: "ds-cyclone-1", date: "2024-11-21", frames: 1600, labels2d: 5000, labels3d: 1500, attrs: 8200, seg: 450 }
];

let dateStart = "2024-11-01";
let dateEnd = "2024-11-30";

// Helpers
const fmtCurrency = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNumber = (n) => n.toLocaleString("en-US");

const withinRange = (dateStr) => {
  if (!dateStart || !dateEnd) return true;
  return dateStr >= dateStart && dateStr <= dateEnd;
};

function filteredSubmissions() {
  return submissions.filter((s) => withinRange(s.date));
}

function getRateCardForDataset(datasetId) {
  const dsCard = rateCards.find((r) => r.scope === "dataset" && r.scopeId === datasetId);
  if (dsCard) return dsCard;
  return rateCards.find((r) => r.scope === "workspace" && r.scopeId === "ws-cyclone");
}

function computeSubmissionRevenue(sub) {
  const card = getRateCardForDataset(sub.datasetId);
  const rateFor = (dimension, modality, unit) =>
    card.lines.find((l) => l.dimension === dimension && l.modality === modality && l.unit === unit)?.rate ?? 0;

  const frameRate = rateFor("frame", "multi", "per_frame");
  const label2dRate = rateFor("label", "2d", "per_label");
  const label3dRate = rateFor("label", "3d", "per_label");
  const attrRate = rateFor("attribute", "multi", "per_attr");
  const segRate = rateFor("segmentation", "2d", "per_instance");

  const frames = sub.frames * frameRate;
  const labels2d = sub.labels2d * label2dRate;
  const labels3d = sub.labels3d * label3dRate;
  const attrs = sub.attrs * attrRate;
  const seg = sub.seg * segRate;
  const total = frames + labels2d + labels3d + attrs + seg;
  return { total, frames, labels2d, labels3d, attrs, seg, cardName: card.name };
}

// DOM
const kpiRevenue = document.getElementById("kpi-revenue");
const kpiFrames = document.getElementById("kpi-frames");
const kpiLabels = document.getElementById("kpi-labels");
const kpiAttrs = document.getElementById("kpi-attrs");
const kpiDatasets = document.getElementById("kpi-datasets");
const submissionsBody = document.getElementById("submissions-body");
const rateCardsDiv = document.getElementById("rate-cards");
const trendChart = document.getElementById("trend-chart");
const invoicesDiv = document.getElementById("invoices");
const rangeSelect = document.getElementById("range-select");
const addRateCardBtn = document.getElementById("add-rate-card");
const generateInvoiceBtn = document.getElementById("generate-invoice");
const toast = document.getElementById("toast");
const modal = document.getElementById("modal");
const modalClose = document.getElementById("modal-close");
const rcScope = document.getElementById("rc-scope");
const rcDataset = document.getElementById("rc-dataset");
const datasetSelectRow = document.getElementById("dataset-select-row");
const rcRows = document.getElementById("rc-rows");
const addRowBtn = document.getElementById("add-row");
const rateCardForm = document.getElementById("rate-card-form");
const dateStartInput = document.getElementById("date-start");
const dateEndInput = document.getElementById("date-end");

function renderKPIs() {
  const subs = filteredSubmissions();
  const revs = subs.map((s) => computeSubmissionRevenue(s).total);
  const totalRev = revs.reduce((a, b) => a + b, 0);
  const totalFrames = subs.reduce((sum, s) => sum + s.frames, 0);
  const totalLabels = subs.reduce((sum, s) => sum + s.labels2d + s.labels3d, 0);
  const totalAttrs = subs.reduce((sum, s) => sum + s.attrs, 0);
  kpiRevenue.textContent = fmtCurrency(totalRev);
  kpiFrames.textContent = fmtNumber(totalFrames);
  kpiLabels.textContent = fmtNumber(totalLabels);
  kpiAttrs.textContent = fmtNumber(totalAttrs);
  kpiDatasets.textContent = new Set(subs.map((s) => s.datasetId)).size;
  document.getElementById("period-label").textContent = `${dateStart || "—"} - ${dateEnd || "—"}`;
}

function renderSubmissions() {
  submissionsBody.innerHTML = "";
  filteredSubmissions().forEach((s) => {
    const { total } = computeSubmissionRevenue(s);
    const tr = document.createElement("tr");
    const ds = datasets.find((d) => d.id === s.datasetId);
    tr.innerHTML = `
      <td>${s.date}</td>
      <td>${ds?.name || s.datasetId}</td>
      <td>${fmtNumber(s.frames)}</td>
      <td>${fmtNumber(s.labels2d + s.labels3d)}</td>
      <td>${fmtNumber(s.attrs)}</td>
      <td>${fmtCurrency(total)}</td>
    `;
    submissionsBody.appendChild(tr);
  });
}

function renderRateCards() {
  rateCardsDiv.innerHTML = "";
  rateCards.forEach((rc) => {
    const div = document.createElement("div");
    const scopeLabel = rc.scope === "workspace" ? "Workspace" : "Dataset override";
    const scopeName =
      rc.scope === "workspace"
        ? "Cyclone"
        : datasets.find((d) => d.id === rc.scopeId)?.name || rc.scopeId;
    div.className = "rate-card";
    const lines = rc.lines
      .map(
        (l) =>
          `<tr><td>${l.dimension}</td><td>${l.modality}</td><td>${l.unit}</td><td>${fmtCurrency(
            l.rate
          )}</td></tr>`
      )
      .join("");
    div.innerHTML = `
      <div class="tag">${scopeLabel}: ${scopeName}</div>
      <table>
        <thead><tr><th>Dimension</th><th>Modality</th><th>Unit</th><th>Rate</th></tr></thead>
        <tbody>${lines}</tbody>
      </table>
    `;
    rateCardsDiv.appendChild(div);
  });
}

function renderTrend() {
  trendChart.innerHTML = "";
  const weeks = rangeSelect.value === "12w" ? 12 : 4;
  const grouped = {};
  filteredSubmissions().forEach((s) => {
    const { total } = computeSubmissionRevenue(s);
    const week = getWeek(s.date);
    grouped[week] = (grouped[week] || 0) + total;
  });
  const entries = Object.entries(grouped)
    .map(([w, v]) => ({ week: Number(w), value: v }))
    .sort((a, b) => a.week - b.week)
    .slice(-weeks);

  const max = Math.max(...entries.map((e) => e.value), 1);
  entries.forEach((e) => {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "80px 1fr 80px";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    const barWidth = (e.value / max) * 100;
    row.innerHTML = `
      <span class="muted">W${e.week}</span>
      <div class="bar" style="width:${barWidth}%;"></div>
      <span>${fmtCurrency(e.value)}</span>
    `;
    trendChart.appendChild(row);
  });
}

function renderInvoices() {
  invoicesDiv.innerHTML = "";
  const subs = filteredSubmissions();
  const monthTotal = subs.reduce((sum, s) => sum + computeSubmissionRevenue(s).total, 0);
  const frames = subs.reduce((sum, s) => sum + s.frames, 0);
  const labels = subs.reduce((sum, s) => sum + s.labels2d + s.labels3d, 0);
  const attrs = subs.reduce((sum, s) => sum + s.attrs, 0);
  const datasetsCount = new Set(subs.map((s) => s.datasetId)).size;
  const invoice = document.createElement("div");
  invoice.className = "card";
  invoice.innerHTML = `
    <div class="panel-head">
      <div>
        <p class="eyebrow">Invoice draft</p>
        <h3>November · Cyclone</h3>
      </div>
      <span class="tag">Status: Draft</span>
    </div>
    <p class="muted">Totals: ${fmtCurrency(monthTotal)}</p>
    <p class="muted">Datasets: ${datasetsCount} · Frames: ${fmtNumber(frames)} · Labels: ${fmtNumber(
    labels
  )} · Attributes: ${fmtNumber(attrs)}</p>
    <div class="actions" style="margin-top:10px;">
      <button class="pill ghost" onclick="sendInvoice()">Send invoice</button>
      <button class="pill" onclick="notify('Download generated')">Download PDF</button>
    </div>
  `;
  invoicesDiv.appendChild(invoice);
}

function getWeek(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const diff = (d - start) / 86400000;
  return Math.ceil((diff + start.getUTCDay() + 1) / 7);
}

function notify(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 1600);
}

// Modal & form
function openModal() {
  modal.classList.remove("hidden");
  rcRows.innerHTML = "";
  addRow();
}

function closeModal() {
  modal.classList.add("hidden");
}

function addRow() {
  const row = document.createElement("div");
  row.className = "row-grid";
  row.innerHTML = `
    <select class="rc-dimension">
      <option value="frame">Frame</option>
      <option value="label">Label</option>
      <option value="segmentation">Segmentation</option>
      <option value="scene">Scene</option>
      <option value="attribute">Attribute</option>
    </select>
    <select class="rc-modality">
      <option value="2d">2D</option>
      <option value="3d">3D</option>
      <option value="both">2D + 3D</option>
      <option value="lidar">LiDAR</option>
      <option value="radar">Radar</option>
      <option value="multi">Multi</option>
    </select>
    <select class="rc-unit">
      <option value="per_frame">Per frame</option>
      <option value="per_label">Per label</option>
      <option value="per_instance">Per instance</option>
      <option value="per_scene">Per scene</option>
      <option value="per_attr">Per attribute</option>
    </select>
    <select class="rc-label-kind hidden">
      <option value="bbox">BBox</option>
      <option value="line">Line</option>
      <option value="keypoint">Keypoint</option>
      <option value="segmentation">Segmentation</option>
    </select>
    <input class="rc-rate" type="number" step="0.01" min="0" placeholder="0.00" />
  `;
  rcRows.appendChild(row);
  bindRow(row);
}

function bindRow(row) {
  const dimension = row.querySelector(".rc-dimension");
  const unit = row.querySelector(".rc-unit");
  const labelKind = row.querySelector(".rc-label-kind");
  const toggleLabelKind = () => {
    const isLabel = dimension.value === "label" || unit.value === "per_label";
    labelKind.classList.toggle("hidden", !isLabel);
  };
  dimension.addEventListener("change", toggleLabelKind);
  unit.addEventListener("change", toggleLabelKind);
  toggleLabelKind();
}

function submitRateCard(e) {
  e.preventDefault();
  const scope = rcScope.value;
  const datasetId = rcDataset.value || null;
  const lines = Array.from(rcRows.children).map((row) => ({
    dimension: row.querySelector(".rc-dimension").value,
    modality: row.querySelector(".rc-modality").value,
    unit: row.querySelector(".rc-unit").value,
    labelKind: row.querySelector(".rc-label-kind").classList.contains("hidden")
      ? null
      : row.querySelector(".rc-label-kind").value,
    rate: Number(row.querySelector(".rc-rate").value || 0)
  }));
  const targetScope = scope === "workspace" && datasetId !== "all" ? "dataset" : scope;
  const targetScopeId = targetScope === "workspace" ? "ws-cyclone" : datasetId;
  const newCard = {
    id: `rc-${Date.now()}`,
    scope: targetScope,
    scopeId: targetScopeId,
    name:
      targetScope === "workspace"
        ? "Workspace custom"
        : `Dataset override: ${datasetId}`,
    lines
  };
  rateCards.push(newCard);
  renderRateCards();
  closeModal();
  notify("Rate card saved");
}

// Populate dataset select
function populateDatasetSelect() {
  const options = [`<option value="all">All datasets (workspace default)</option>`].concat(
    datasets.map((d) => `<option value="${d.id}">${d.name}</option>`)
  );
  rcDataset.innerHTML = options.join("");
}

function sendInvoice() {
  const input = window.prompt("Enter recipient emails (comma separated)", "ops@company.com,billing@company.com");
  if (!input) return;
  notify(`Invoice sent to: ${input}`);
}

function setDateRangeDefaults() {
  const dates = submissions.map((s) => s.date).sort();
  dateStart = dates[0];
  dateEnd = dates[dates.length - 1];
  dateStartInput.value = dateStart;
  dateEndInput.value = dateEnd;
}

// Bindings
rangeSelect.addEventListener("change", renderTrend);
addRateCardBtn.addEventListener("click", openModal);
generateInvoiceBtn.addEventListener("click", () => notify("Invoice generated"));
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
addRowBtn.addEventListener("click", addRow);
rcScope.addEventListener("change", () => {
  // Keep dataset selector visible for workspace and dataset; default option covers workspace-wide.
});
rateCardForm.addEventListener("submit", submitRateCard);
dateStartInput.addEventListener("change", () => {
  dateStart = dateStartInput.value;
  renderAll();
});
dateEndInput.addEventListener("change", () => {
  dateEnd = dateEndInput.value;
  renderAll();
});

function renderAll() {
  renderKPIs();
  renderSubmissions();
  renderRateCards();
  renderTrend();
  renderInvoices();
}

// Init
populateDatasetSelect();
setDateRangeDefaults();
renderAll();
