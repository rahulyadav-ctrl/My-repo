// Embedded copy of your CSV so the dashboard works without any server setup.
// Source: Expenses/Rahul Expenses - Sheet1.csv
const RAW_CSV = `
S. No,Date,Amount,To,Bank,Credit Card
1,1-Dec,299.51,Zomato,SBI,
2,1-Dec,38,Misc,SBI,
3,1-Dec,300,NA,SBI,
4,1-Dec,16000,Rent,HDFC,
5,1-Dec,1923,LIC,SBI,
6,1-Dec,5582,LIC,SBI,
7,2-Dec,150,NA,HDFC,
8,2-Dec,39,NA,HDFC,
9,3-Dec,77,Rapido,HDFC,
10,3-Dec,150,Zomato,HDFC,
11,4-Dec,168,Rapido,HDFC,
12,4-Dec,120,Rapido,HDFC,
13,4-Dec,86,Rapido,SBI,
14,5-Dec,195,Youtube,SBI,
15,5-Dec,164,Zomato,SBI,
16,5-Dec,77,Rapido,SBI,
17,5-Dec,103,Rapido,SBI,
18,6-Dec,222,Zomato,SBI,
19,6-Dec,80,Rapido,SBI,
20,7-Dec,105,Rapido,SBI,
21,7-Dec,278.63,Zomato,SBI,
22,7-Dec,446,Blinkit,SBI,
23,7-Dec,491,Zomato,SBI,
24,8-Dec,170,Rapido,SBI,
25,8-Dec,275.15,Zomato,SBI,
26,10-Dec,200,Rapido,SBI,
27,10-Dec,464.2,Zomato,SBI,
28,10-Dec,381.2,Zomato,HDFC,
29,10-Dec,500,Dinner,HDFC,
30,10-Dec,100,Rapido,HDFC,
31,10-Dec,176,Blinkit,HDFC,
32,11-Dec,200,Rapido,HDFC,
33,11-Dec,5000,Mutual Fund,SBI,
,12-Dec,75,Rapido,HDFC,
,12-Dec,1733,Stuff,HDFC,
,12-Dec,5539,LIC,SBI,
,13-Dec,239.35,Zomato,HDFC,
,13-Dec,262,Lunch,HDFC,
,14-Dec,90,Zomato,HDFC,
,14-Dec,50,Zomato,HDFC,
,14-Dec,40,Zomato,HDFC,
,14-Dec,207,Shampoo,HDFC,
,14-Dec,38,Zomato,HDFC,
,14-Dec,170,Haircut,HDFC,
,14-Dec,738,Credit Card Payment,SBI,
,14-Dec,550,Dinner,HDFC,
,14-Dec,610,Blinkit,HDFC,
,14-Dec,100,Rapido,HDFC,
,15-Dec,400,Rent Agreement,HDFC,
,15-Dec,25,Snacks,HDFC,
,15-Dec,275,Badminton,HDFC,
,16-Dec,4500,Option Loss,SBI,
,16-Dec,8500,Stocks Investment,SBI,
,16-Dec,77,Rapido,SBI,
,16-Dec,217,Rapido,SBI,
,16-Dec,299.51,Zomato,SBI,
,17-Dec,75,Rapido,SBI,
,18-Dec,177,Zomato,SBI,
,18-Dec,112,Snacks,SBI,
,18-Dec,42000,Mutual Fund,SBI,
,18-Dec,27200,Credit Card Payment,SBI,
,18-Dec,3618,Gold Investment,SBI,
`;

function parseCsv(raw) {
  const lines = raw.trim().split("\n");
  const header = lines[0].split(",");
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 5) continue;
    const row = {};
    header.forEach((h, idx) => {
      row[h.trim()] = (parts[idx] ?? "").trim();
    });
    const amount = parseFloat(row["Amount"]);
    if (Number.isNaN(amount)) continue;
    out.push({
      date: row["Date"],
      amount,
      to: row["To"],
      bank: row["Bank"],
      creditCard: row["Credit Card"]
    });
  }
  return out;
}

// Use bank statement data if available, otherwise fall back to CSV
let transactions = [];
if (typeof BANK_STATEMENTS_DATA !== 'undefined' && BANK_STATEMENTS_DATA.length > 0) {
  // Use bank statement data (more complete)
  transactions = BANK_STATEMENTS_DATA.map(tx => ({
    date: tx.date,
    amount: tx.amount,
    to: tx.to || 'NA',
    bank: tx.bank,
    narration: tx.narration || ''
  }));
} else {
  // Fallback to CSV
  transactions = parseCsv(RAW_CSV);
}

function formatCurrency(n) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function pct(part, total) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function classify(tx) {
  const to = tx.to;
  if (["Mutual Fund", "Stocks Investment", "Gold Investment", "Paytm Gold"].includes(to)) return "Investments";
  if (to === "LIC") return "Insurance";
  if (to === "Credit Card Payment") return "Debt";
  if (to === "Option Loss") return "Trading loss";
  if (["Rent", "Rent Agreement"].includes(to)) return "Rent & housing";
  if (["Zomato", "Dinner", "Lunch", "Snacks", "Blinkit"].includes(to)) return "Food & groceries";
  if (to === "Rapido") return "Transport";
  if (["Badminton", "Youtube", "Haircut", "Shampoo", "Stuff", "Misc"].includes(to)) return "Lifestyle";
  return "Other";
}

function aggregate() {
  const totals = {
    total: 0,
    byCategory: {},
    byBucket: {},
    byBank: {}
  };
  transactions.forEach((tx) => {
    totals.total += tx.amount;
    totals.byCategory[tx.to] = (totals.byCategory[tx.to] || 0) + tx.amount;
    const bucket = classify(tx);
    totals.byBucket[bucket] = (totals.byBucket[bucket] || 0) + tx.amount;
    if (tx.bank) {
      totals.byBank[tx.bank] = (totals.byBank[tx.bank] || 0) + tx.amount;
    }
  });
  return totals;
}

const totals = aggregate();

// DOM references
const kpiTotal = document.getElementById("kpi-total");
const kpiInvestments = document.getElementById("kpi-investments");
const kpiInvestmentsShare = document.getElementById("kpi-investments-share");
const kpiFixed = document.getElementById("kpi-fixed");
const kpiFixedShare = document.getElementById("kpi-fixed-share");
const kpiLifestyle = document.getElementById("kpi-lifestyle");
const kpiLifestyleShare = document.getElementById("kpi-lifestyle-share");
const kpiTransport = document.getElementById("kpi-transport");
const kpiTransportShare = document.getElementById("kpi-transport-share");

const cardInvestments = document.getElementById("card-investments");
const cardFixed = document.getElementById("card-fixed");
const cardLifestyle = document.getElementById("card-lifestyle");
const cardTransport = document.getElementById("card-transport");

const categoryChart = document.getElementById("category-chart");
const timelineChart = document.getElementById("timeline-chart");
const topTransactionsTbody = document.getElementById("top-transactions");
const bucketTableBody = document.getElementById("bucket-table");
const bankChart = document.getElementById("bank-chart");

const breakdownTitle = document.getElementById("breakdown-title");
const breakdownTotal = document.getElementById("breakdown-total");
const breakdownBody = document.getElementById("breakdown-body");
const detailSections = document.querySelectorAll(".details");

function renderKPIs() {
  const total = totals.total;
  const inv = (totals.byBucket["Investments"] || 0) + (totals.byBucket["Insurance"] || 0);
  const fixed = (totals.byBucket["Rent & housing"] || 0) + (totals.byBucket["Debt"] || 0);
  const lifestyle = (totals.byBucket["Food & groceries"] || 0) + (totals.byBucket["Lifestyle"] || 0);
  const transport = totals.byBucket["Transport"] || 0;

  kpiTotal.textContent = formatCurrency(total);
  kpiInvestments.textContent = formatCurrency(inv);
  kpiInvestmentsShare.textContent = `${pct(inv, total)} of spend`;
  kpiFixed.textContent = formatCurrency(fixed);
  kpiFixedShare.textContent = `${pct(fixed, total)} of spend`;
  kpiLifestyle.textContent = formatCurrency(lifestyle);
  kpiLifestyleShare.textContent = `${pct(lifestyle, total)} of spend`;
  kpiTransport.textContent = formatCurrency(transport);
  kpiTransportShare.textContent = `${pct(transport, total)} of spend`;
}

function renderCategoryChart() {
  categoryChart.innerHTML = "";
  const entries = Object.entries(totals.byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  if (!entries.length) return;
  const max = Math.max(...entries.map((e) => e.value));
  entries.forEach((e) => {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "140px 1fr 80px";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    const width = (e.value / max) * 100;
    row.innerHTML = `
      <span class="muted">${e.name}</span>
      <div class="bar" style="width:${width}%;"></div>
      <span>${formatCurrency(e.value)}</span>
    `;
    categoryChart.appendChild(row);
  });
}

function renderTimeline() {
  timelineChart.innerHTML = "";
  const byDate = {};
  transactions.forEach((tx) => {
    byDate[tx.date] = (byDate[tx.date] || 0) + tx.amount;
  });
  const entries = Object.entries(byDate)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => {
      const [da] = a.date.split("-");
      const [db] = b.date.split("-");
      return parseInt(da, 10) - parseInt(db, 10);
    });
  if (!entries.length) return;
  const max = Math.max(...entries.map((e) => e.value));
  entries.forEach((e) => {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "80px 1fr 80px";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    const width = (e.value / max) * 100;
    row.innerHTML = `
      <span class="muted">${e.date}</span>
      <div class="bar" style="width:${width}%;"></div>
      <span>${formatCurrency(e.value)}</span>
    `;
    timelineChart.appendChild(row);
  });
}

function renderBankChart() {
  bankChart.innerHTML = "";
  const entries = Object.entries(totals.byBank)
    .map(([bank, value]) => ({ bank, value }))
    .sort((a, b) => b.value - a.value);
  if (!entries.length) return;
  const max = Math.max(...entries.map((e) => e.value));
  entries.forEach((e) => {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "80px 1fr 80px";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    const width = (e.value / max) * 100;
    row.innerHTML = `
      <span class="muted">${e.bank}</span>
      <div class="bar" style="width:${width}%;"></div>
      <span>${formatCurrency(e.value)}</span>
    `;
    bankChart.appendChild(row);
  });
}

function renderTopTransactions() {
  const sorted = [...transactions].sort((a, b) => b.amount - a.amount).slice(0, 10);
  topTransactionsTbody.innerHTML = "";
  sorted.forEach((tx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${tx.date}</td>
      <td>${tx.to}</td>
      <td>${formatCurrency(tx.amount)}</td>
      <td>${classify(tx)}</td>
    `;
    topTransactionsTbody.appendChild(tr);
  });
}

function renderBucketTable() {
  bucketTableBody.innerHTML = "";
  const total = totals.total;
  const entries = Object.entries(totals.byBucket)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  entries.forEach((e) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.name}</td>
      <td>${formatCurrency(e.value)}</td>
      <td>${pct(e.value, total)}</td>
    `;
    bucketTableBody.appendChild(tr);
  });
}

function renderAll() {
  renderKPIs();
  renderCategoryChart();
  renderBankChart();
  renderTimeline();
  renderTopTransactions();
  renderBucketTable();
}

renderAll();

// Drill-down interactions
function clearActiveCards() {
  [cardInvestments, cardFixed, cardLifestyle, cardTransport].forEach((el) => {
    if (el) el.classList.remove("active");
  });
}

function showBreakdown(label, buckets) {
  clearActiveCards();
  if (label === "Investments") cardInvestments.classList.add("active");
  if (label === "Living & fixed") cardFixed.classList.add("active");
  if (label === "Food & lifestyle") cardLifestyle.classList.add("active");
  if (label === "Transport") cardTransport.classList.add("active");

  const filtered = transactions.filter((tx) => buckets.includes(classify(tx)));
  breakdownTitle.textContent = `${label} breakdown`;
  const total = filtered.reduce((sum, tx) => sum + tx.amount, 0);
  breakdownTotal.textContent = `${filtered.length} transactions · ${formatCurrency(total)}`;
  breakdownBody.innerHTML = "";
  filtered
    .sort((a, b) => b.amount - a.amount)
    .forEach((tx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${tx.date}</td>
        <td>${tx.to}</td>
        <td>${formatCurrency(tx.amount)}</td>
        <td>${classify(tx)}</td>
      `;
      breakdownBody.appendChild(tr);
    });
  // Reveal detail sections on first click
  detailSections.forEach((section) => section.classList.remove("hidden"));
  // Scroll into view so you always see the details after clicking
  breakdownTitle.scrollIntoView({ behavior: "smooth", block: "start" });
}

if (cardInvestments) {
  cardInvestments.addEventListener("click", () =>
    showBreakdown("Investments", ["Investments", "Insurance"])
  );
}

if (cardFixed) {
  cardFixed.addEventListener("click", () =>
    showBreakdown("Living & fixed", ["Rent & housing", "Debt"])
  );
}

if (cardLifestyle) {
  cardLifestyle.addEventListener("click", () =>
    showBreakdown("Food & lifestyle", ["Food & groceries", "Lifestyle"])
  );
}

if (cardTransport) {
  cardTransport.addEventListener("click", () =>
    showBreakdown("Transport", ["Transport"])
  );
}


