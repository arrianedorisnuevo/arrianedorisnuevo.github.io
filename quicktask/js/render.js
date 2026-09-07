/* ============================================================
   QUICKTASK — VIEW RENDERING
   Pure functions: (state/data) -> HTML string.
   ============================================================ */

// ---------------- utilities ----------------
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function fmtDate(iso){ return new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }); }
function fmtDateTime(iso){ return new Date(iso).toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }); }
function fmtTime(iso){ return new Date(iso).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" }); }
function toLocalDatetimeInputValue(ms){
  const d = new Date(ms - new Date().getTimezoneOffset()*60000);
  return d.toISOString().slice(0,16);
}

const STATUS_CLASS = {
  "Draft":"neutral","Awaiting Payment":"amber","Paid":"blue","Pending Provider Acceptance":"amber",
  "Accepted":"blue","In Progress":"blue","Submitted":"amber","Completed":"mint","Cancelled":"neutral",
  "Declined":"coral","Payment Failed":"coral","Refunded":"neutral","Disputed":"coral",
};
function statusPill(status){ return `<span class="pill pill-${STATUS_CLASS[status]||'neutral'}">${esc(status)}</span>`; }

function avatar(initials, size){
  size = size||34;
  return `<span class="avatar-circle" style="width:${size}px;height:${size}px;">${esc(initials)}</span>`;
}
function statCard(label, value, sub){
  return `<div class="card stat-card"><div class="label">${esc(label)}</div><div class="value">${value}</div>${sub?`<div class="delta">${sub}</div>`:""}</div>`;
}
function emptyState(icon, title, body){
  return `<div class="empty-state">${qtIcon(icon,30)}<h3>${esc(title)}</h3><p>${esc(body)}</p></div>`;
}

// task groupings, shared across customer/provider views
const TG = {
  upcoming: t => ["Paid","Pending Provider Acceptance","Accepted"].includes(t.status),
  active: t => ["In Progress","Submitted"].includes(t.status),
  completed: t => t.status === "Completed",
  closed: t => ["Cancelled","Declined","Payment Failed","Refunded","Disputed"].includes(t.status),
};

// ---------------- shell (sidebar + topbar + bottom nav) ----------------
const NAV = {
  customer: [
    { href:"#/home", label:"Home", icon:"home" },
    { href:"#/services", label:"Services", icon:"services" },
    { href:"#/how-it-works", label:"How It Works", icon:"info" },
    { href:"#/tasks", label:"My Tasks", icon:"tasks" },
    { href:"#/wallet", label:"Wallet", icon:"wallet" },
    { href:"#/messages", label:"Messages", icon:"messages" },
    { href:"#/profile", label:"Profile", icon:"profile" },
  ],
  provider: [
    { href:"#/provider/overview", label:"Overview", icon:"dashboard" },
    { href:"#/provider/requests", label:"Requests", icon:"requests" },
    { href:"#/provider/tasks", label:"Tasks", icon:"tasks" },
    { href:"#/provider/earnings", label:"Earnings", icon:"earnings" },
    { href:"#/provider/messages", label:"Messages", icon:"messages" },
    { href:"#/provider/profile", label:"Profile", icon:"profile" },
  ],
  admin: [
    { href:"#/admin/dashboard", label:"Dashboard", icon:"dashboard" },
    { href:"#/admin/users", label:"Users", icon:"users" },
    { href:"#/admin/services", label:"Services", icon:"services" },
    { href:"#/admin/payments", label:"Payments", icon:"payments" },
  ],
};
const BOTTOM_NAV = {
  customer: ["#/home","#/services","#/tasks","#/wallet","#/messages"],
  provider: ["#/provider/overview","#/provider/requests","#/provider/tasks","#/provider/earnings","#/provider/messages"],
  admin: ["#/admin/dashboard","#/admin/users","#/admin/services","#/admin/payments"],
};

function activeSection(hash){
  // collapse detail routes (e.g. #/services/svc-x, #/tasks/T-1) onto their list parent
  if(/^#\/services\/.+/.test(hash)) return "#/services";
  if(/^#\/tasks\/.+/.test(hash)) return "#/tasks";
  if(/^#\/request\/.+/.test(hash)) return "#/services";
  return hash;
}

function renderShell(role, hash, user, contentHtml){
  const items = NAV[role];
  const active = activeSection(hash);
  const navLinks = items.map(it => `<a href="${it.href}" class="${active===it.href?'active':''}"><span class="ic">${qtIcon(it.icon)}</span>${esc(it.label)}</a>`).join("");
  const bottomLinks = BOTTOM_NAV[role].map(href => {
    const it = items.find(i=>i.href===href);
    return `<a href="${it.href}" class="${active===it.href?'active':''}">${qtIcon(it.icon,19)}<span>${esc(it.label)}</span></a>`;
  }).join("");

  let walletChip = "";
  if(role === "customer"){
    const coins = QT.state.wallets[user.id].coins;
    walletChip = `<a href="#/wallet" class="wallet-chip">${qtIcon('coin',15)} <b>${coins.toLocaleString()}</b> Coins</a>`;
  } else if(role === "provider"){
    const w = QT.state.providerWallets[user.id];
    walletChip = `<a href="#/provider/earnings" class="wallet-chip">${qtIcon('earnings',15)} <b>${QT.usd(w.availableUSD)}</b> available</a>`;
  } else {
    walletChip = `<span class="wallet-chip">${qtIcon('dashboard',15)} Admin session</span>`;
  }

  const searchBox = role === "customer" ? `
    <form class="search" data-role="global-search">
      <span class="ic">${qtIcon('search',15)}</span>
      <input type="search" name="q" placeholder="Search services…" autocomplete="off">
    </form>` : `<div class="topbar-spacer"></div>`;

  return `
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="brand"><span class="mark">QT</span> QuickTask</div>
      <div class="side-role-badge mono">${esc(role)} demo</div>
      <nav class="side-nav">${navLinks}</nav>
      <div class="side-foot">
        <a href="#/profile" data-role="whoami">${avatar(user.avatar,26)}&nbsp; ${esc(user.name)}</a>
        <a href="#" data-action="logout">${qtIcon('logout',16)} Exit demo</a>
      </div>
    </aside>
    <div class="app-main-col">
      <header class="app-topbar">
        ${searchBox}
        ${role!=='customer' ? '' : '<div class="topbar-spacer"></div>'}
        ${walletChip}
        <div class="avatar-menu">${avatar(user.avatar)}</div>
      </header>
      <main class="app-main"><div class="container">${contentHtml}</div></main>
    </div>
  </div>
  <nav class="bottom-nav">${bottomLinks}</nav>
  `;
}

function renderLogin(){
  return `
  <div class="login-screen">
    <div class="login-card">
      <div class="mark-lg">QT</div>
      <h1>Explore QuickTask</h1>
      <p class="sub">This is a portfolio prototype — pick a role to explore the product. No account needed, nothing you do here is real.</p>
      <div class="role-grid">
        <div class="role-card">
          <div class="ico">${qtIcon('home',18)}</div>
          <h3>Customer</h3>
          <p>Browse services, request a task, schedule it, and pay with a mock wallet.</p>
          <select id="customer-select">
            <option value="user-alex">Alex Morgan</option>
            <option value="user-jamie">Jamie Carter</option>
          </select>
          <button class="btn btn-primary btn-block" data-action="demo-login" data-role="customer">Enter as customer</button>
        </div>
        <div class="role-card">
          <div class="ico">${qtIcon('requests',18)}</div>
          <h3>Service Provider</h3>
          <p>Accept requests, move tasks through to completion, and track earnings.</p>
          <select disabled><option>Sofia Reyes</option></select>
          <button class="btn btn-primary btn-block" data-action="demo-login" data-role="provider" data-user="prov-sofia">Enter as provider</button>
        </div>
        <div class="role-card">
          <div class="ico">${qtIcon('dashboard',18)}</div>
          <h3>Admin</h3>
          <p>See platform-wide users, services, payments, and metrics.</p>
          <select disabled><option>Admin</option></select>
          <button class="btn btn-primary btn-block" data-action="demo-login" data-role="admin" data-user="user-admin">Enter as admin</button>
        </div>
      </div>
      <div class="login-foot"><a href="index.html">← Back to the case study</a></div>
    </div>
  </div>`;
}

// ================= CUSTOMER VIEWS =================

function viewHome(user){
  const tasks = QT.tasksForCustomer(user.id);
  const upcoming = tasks.filter(TG.upcoming);
  const active = tasks.filter(TG.active);
  const completed = tasks.filter(TG.completed);
  const recent = tasks.slice(0,4);
  return `
    <div class="page-head">
      <div><h1>Welcome back, ${esc(user.name.split(' ')[0])}</h1><div class="sub">Here's where things stand.</div></div>
      <a class="btn btn-primary" href="#/services">Request a service →</a>
    </div>
    <div class="stat-grid">
      ${statCard("Active tasks", active.length)}
      ${statCard("Upcoming", upcoming.length)}
      ${statCard("Completed", completed.length)}
      ${statCard("Coin balance", QT.state.wallets[user.id].coins.toLocaleString())}
    </div>
    <div class="block">
      <div class="block-head"><h2>Recent activity</h2><a href="#/tasks">View all →</a></div>
      <div class="card">
        ${recent.length ? recent.map(t=>taskRow(t, QT.getService(t.serviceId))).join("") : emptyState('tasks','Nothing here yet','Once you request a service, it will show up here.')}
      </div>
    </div>
    <div class="block">
      <div class="block-head"><h2>Popular services</h2><a href="#/services">Browse all →</a></div>
      <div class="service-grid">
        ${QT.state.services.slice(0,3).map(serviceCard).join("")}
      </div>
    </div>
  `;
}

function taskRow(t, service){
  return `<div class="task-row" data-nav="#/tasks/${t.id}">
    <div class="ttl"><h4>${esc(t.title)}</h4><div class="meta">${esc(service?service.name:'')} · ${fmtDate(t.scheduledFor)}</div></div>
    ${statusPill(t.status)}
    <div class="price">${QT.usd(t.price)}</div>
  </div>`;
}

function serviceCard(s){
  return `<div class="card service-card" data-nav="#/services/${s.id}">
    <div class="cat-tag">${esc(QT.getCategory(s.category).name)}</div>
    <h3>${esc(s.name)}</h3>
    <div class="desc">${esc(s.shortDesc)}</div>
    <div class="foot">
      <span class="price">from ${QT.usd(s.startingPrice)}</span>
      <span class="rating">★ ${s.rating}</span>
    </div>
  </div>`;
}

function viewServices(query, category){
  const cats = QT_DATA.categories;
  let list = QT.state.services.filter(s => s.active !== false);
  if(category && category !== "all") list = list.filter(s => s.category === category);
  if(query) {
    const q = query.toLowerCase();
    list = list.filter(s => s.name.toLowerCase().includes(q) || s.shortDesc.toLowerCase().includes(q));
  }
  return `
    <div class="page-head"><div><h1>Services</h1><div class="sub">Pick a service, describe the task, and schedule it at least 48 hours out.</div></div></div>
    <div class="chip-row">
      <span class="chip ${!category||category==='all'?'active':''}" data-action="filter-cat" data-cat="all">All</span>
      ${cats.map(c=>`<span class="chip ${category===c.id?'active':''}" data-action="filter-cat" data-cat="${c.id}">${esc(c.name)}</span>`).join("")}
    </div>
    <div class="service-grid">
      ${list.length ? list.map(serviceCard).join("") : emptyState('search','No matching services','Try a different category or search term.')}
    </div>
  `;
}

function viewServiceDetail(service){
  const provider = QT.getProvider(service.providerId);
  const reviews = QT.reviewsForService(service.id);
  const now = Date.now();
  const slots = [];
  for(let i=0;i<6;i++){
    const t = now + (i*16*60*60*1000);
    slots.push({ t, ok: t >= now + QT.minLeadMs() });
  }
  return `
    <a href="#/services" class="btn-ghost btn btn-sm" style="margin-bottom:16px;">← Back to services</a>
    <div class="detail-grid">
      <div class="detail-main">
        <div class="card">
          <div class="cat-tag" style="margin-bottom:8px;">${esc(QT.getCategory(service.category).name)}</div>
          <h1>${esc(service.name)}</h1>
          <p style="color:var(--text-dim);margin:10px 0 18px;">${esc(service.description)}</p>
          <h4 style="font-size:13.5px;margin-bottom:6px;">What's included</h4>
          <ul class="included-list">${service.whatsIncluded.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>
          <h4 style="font-size:13.5px;margin:16px 0 6px;">What we'll need from you</h4>
          <ul class="req-list">${service.requirements.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>
          <div class="notice-48" style="margin-top:18px;">${qtIcon('clock',16)}<span>Services must be scheduled at least <b style="color:var(--text)">48 hours</b> in advance. Available slots below reflect that.</span></div>
          <div class="slots" style="margin-top:12px;">
            ${slots.map(s=>`<span class="slot-chip ${s.ok?'available':'disabled'}">${new Date(s.t).toLocaleString('en-US',{weekday:'short',hour:'numeric',minute:'2-digit'})}</span>`).join("")}
          </div>
        </div>
        <div class="card" style="padding:22px;">
          <h4 style="font-size:14.5px;margin-bottom:12px;">Reviews (${reviews.length})</h4>
          ${reviews.length ? reviews.map(r=>`
            <div class="review-item">
              <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
              <p style="font-size:13.5px;color:var(--text-dim);">${esc(r.text)}</p>
            </div>`).join("") : `<p style="font-size:13px;color:var(--text-faint);">No reviews yet.</p>`}
        </div>
      </div>
      <div class="sticky-card card">
        <div style="font-size:22px;font-weight:800;margin-bottom:2px;">${QT.usd(service.startingPrice)}</div>
        <div style="font-size:12.5px;color:var(--text-faint);margin-bottom:18px;">Turnaround: ${service.turnaround[0]}–${service.turnaround[1]} hrs after acceptance</div>
        <a class="btn btn-primary btn-block" href="#/request/${service.id}">Request service</a>
        <div class="provider-block" style="margin-top:20px;">
          ${avatar(provider.avatar,44)}
          <div>
            <div style="font-weight:600;font-size:14px;">${esc(provider.name)}</div>
            <div style="font-size:12px;color:var(--text-faint);">${esc(provider.title)}</div>
          </div>
        </div>
        <div style="font-size:13px;color:var(--text-dim);display:flex;flex-direction:column;gap:8px;">
          <div>★ ${provider.rating} (${provider.reviewCount} reviews)</div>
          <div>${provider.completedTasks} tasks completed</div>
          <div>Responds ${provider.responseTime.toLowerCase()}</div>
        </div>
      </div>
    </div>
  `;
}

function viewRequestWizard(service){
  const provider = QT.getProvider(service.providerId);
  const minDt = toLocalDatetimeInputValue(Date.now() + QT.minLeadMs());
  const coins = QT.state.wallets[QT.currentUser().id] ? QT.state.wallets[QT.currentUser().id].coins : 0;
  const priceCoins = QT.usdCentsToCoins(service.startingPrice);
  return `
    <a href="#/services/${service.id}" class="btn-ghost btn btn-sm" style="margin-bottom:16px;">← Back to service</a>
    <div class="card" style="padding:26px;max-width:680px;margin:0 auto;">
      <div class="wizard-steps">
        <div class="dot active" data-dot="1"></div><div class="dot" data-dot="2"></div><div class="dot" data-dot="3"></div>
      </div>

      <div data-step="1">
        <h2 style="font-size:19px;margin-bottom:4px;">Describe the task</h2>
        <p style="font-size:13px;color:var(--text-faint);margin-bottom:20px;">for ${esc(service.name)} · ${esc(provider.name)}</p>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="field"><label>Task title</label><input id="f-title" placeholder="e.g. Enter Q3 invoices into Sheets"></div>
          <div class="field"><label>Description &amp; desired result</label><textarea id="f-desc" placeholder="What needs to happen, and what does 'done' look like?"></textarea></div>
          <div class="field"><label>Instructions for the provider (optional)</label><textarea id="f-instr" placeholder="Anything specific they should know or avoid"></textarea></div>
          <div class="form-grid">
            <div class="field">
              <label>Preferred date &amp; time</label>
              <input type="datetime-local" id="f-schedule" min="${minDt}" value="${minDt}">
              <span class="hint warn" id="schedule-hint">Requires at least 48 hours' notice.</span>
            </div>
            <div class="field"><label>Reference link (optional)</label><input id="f-link" placeholder="https://…"></div>
          </div>
          <div class="field">
            <label>Attachments</label>
            <div id="attach-list" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;"></div>
            <button class="btn btn-quiet btn-sm" type="button" data-action="mock-attach">${qtIcon('paperclip',14)} Attach a file</button>
          </div>
          <div class="field"><label>Additional notes (optional)</label><textarea id="f-notes" placeholder="Anything else to flag"></textarea></div>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:22px;">
          <button class="btn btn-primary" data-action="wizard-next" data-to="2">Continue →</button>
        </div>
      </div>

      <div data-step="2" style="display:none;">
        <h2 style="font-size:19px;margin-bottom:18px;">Review your request</h2>
        <div id="review-body"></div>
        <div class="total-line"><span>Total due now</span><span>${QT.usd(service.startingPrice)}</span></div>
        <div style="display:flex;justify-content:space-between;margin-top:22px;">
          <button class="btn btn-ghost" data-action="wizard-back" data-to="1">← Back</button>
          <button class="btn btn-primary" data-action="wizard-next" data-to="3">Continue to payment →</button>
        </div>
      </div>

      <div data-step="3" style="display:none;">
        <h2 style="font-size:19px;margin-bottom:18px;">Select a payment method</h2>
        <div class="pay-methods" id="pay-methods">
          <div class="pay-method selected" data-pay="Coins"><span class="ic">${qtIcon('coin',18)}</span> Coins <span style="margin-left:auto;color:var(--text-faint);font-size:12px;">${coins.toLocaleString()} avail.</span></div>
          <div class="pay-method" data-pay="PayPal"><span class="ic">${qtIcon('paypal',18)}</span> PayPal</div>
          <div class="pay-method" data-pay="USD"><span class="ic">${qtIcon('card',18)}</span> Card (USD)</div>
          <div class="pay-method" data-pay="Crypto"><span class="ic">${qtIcon('crypto',18)}</span> Crypto</div>
        </div>
        <div id="crypto-asset-row" style="display:none;margin-top:12px;">
          <select id="crypto-asset">${QT_DATA.config.cryptoAssets.map(a=>`<option>${a}</option>`).join("")}</select>
        </div>
        <div id="coins-warning" style="display:none;margin-top:10px;" class="hint warn">Not enough Coins for this task — buy more in Wallet, or choose another method.</div>
        <div class="total-line"><span>Total</span><span>${QT.usd(service.startingPrice)} <span style="color:var(--text-faint);font-weight:400;font-size:12.5px;">(${priceCoins.toLocaleString()} Coins)</span></span></div>
        <div style="display:flex;justify-content:space-between;margin-top:22px;">
          <button class="btn btn-ghost" data-action="wizard-back" data-to="2">← Back</button>
          <button class="btn btn-primary" data-action="submit-payment" data-service="${service.id}">Pay ${QT.usd(service.startingPrice)}</button>
        </div>
        <p style="font-size:11.5px;color:var(--text-faint);margin-top:14px;">Demo payment environment — no real charge occurs. In production, PayPal and each crypto asset would be handled by a swappable payment-provider module behind this same interface.</p>
      </div>

      <div data-step="processing" style="display:none;">
        <div class="processing-box"><div class="spinner"></div><p style="color:var(--text-dim);">Processing payment…</p></div>
      </div>

      <div data-step="success" style="display:none;">
        <div class="success-box">
          <div class="check">✓</div>
          <h2 style="font-size:19px;margin-bottom:6px;">Request confirmed</h2>
          <p style="color:var(--text-dim);font-size:14px;margin-bottom:22px;">Paid and sent to ${esc(provider.name)} for acceptance.</p>
          <div style="display:flex;gap:10px;justify-content:center;">
            <a class="btn btn-ghost" href="#/services">Browse more</a>
            <a class="btn btn-primary" id="view-task-link" href="#/tasks">View task →</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function viewMyTasks(user, filter){
  filter = filter || "all";
  let tasks = QT.tasksForCustomer(user.id);
  const tabs = [["all","All"],["upcoming","Upcoming"],["active","Active"],["completed","Completed"],["closed","Cancelled"]];
  if(filter!=="all") tasks = tasks.filter(t => filter==="upcoming"?TG.upcoming(t): filter==="active"?TG.active(t): filter==="completed"?TG.completed(t): TG.closed(t));
  return `
    <div class="page-head"><div><h1>My Tasks</h1><div class="sub">Everything you've requested, in one place.</div></div></div>
    <div class="filter-tabs">${tabs.map(([k,l])=>`<button class="${filter===k?'active':''}" data-action="tasks-filter" data-f="${k}">${l}</button>`).join("")}</div>
    <div class="card">${tasks.length ? tasks.map(t=>taskRow(t, QT.getService(t.serviceId))).join("") : emptyState('tasks','No tasks here', 'Nothing matches this filter yet.')}</div>
  `;
}

function timelineHtml(task){
  const steps = ["Requested","Paid","Accepted","In Progress","Submitted","Completed"];
  const doneStatuses = task.history.map(h=>h.status);
  const histMap = {}; task.history.forEach(h=>histMap[h.status]=h.at);
  if(task.status==="Cancelled" || task.status==="Declined"){
    return `<div class="timeline">${task.history.map(h=>`<div class="tl-item done"><div class="dot"></div><div><div class="t">${esc(h.status)}</div><div class="d">${fmtDateTime(h.at)}</div></div></div>`).join("")}</div>`;
  }
  return `<div class="timeline">${steps.map(s=>{
    const done = doneStatuses.includes(s);
    return `<div class="tl-item ${done?'done':''}"><div class="dot"></div><div><div class="t">${s}</div>${done?`<div class="d">${fmtDateTime(histMap[s])}</div>`:`<div class="d">Pending</div>`}</div></div>`;
  }).join("")}</div>`;
}

function chatHtml(taskId, viewerId){
  const msgs = QT.state.messages[taskId] || [];
  if(!msgs.length) return `<div class="chat-scroll" id="chat-scroll">${emptyState('messages','No messages yet','Say hello — messages are tied to this task.')}</div>`;
  return `<div class="chat-scroll" id="chat-scroll">${msgs.map(m=>`
    <div class="msg ${m.from===viewerId?'mine':'theirs'}">${esc(m.text)}<span class="time">${fmtDateTime(m.at)}</span></div>
  `).join("")}</div>`;
}

function reviewCategoryRow(label, key){
  return `<div class="field" style="flex-direction:row;align-items:center;justify-content:space-between;">
    <label style="margin:0;">${label}</label>
    <span data-stars="${key}" style="cursor:pointer;color:var(--amber);letter-spacing:2px;">☆☆☆☆☆</span>
  </div>`;
}

function viewTaskWorkspace(task, viewer, role){
  const service = QT.getService(task.serviceId);
  const provider = QT.getProvider(task.providerId);
  const customer = QT_DATA.users[task.customerId];
  const otherPartyId = role === "customer" ? task.providerId : task.customerId;
  const canCancel = role==="customer" && ["Pending Provider Acceptance","Accepted"].includes(task.status);
  const providerActions = role==="provider" ? providerTaskActions(task) : "";
  const needsReview = role==="customer" && task.status==="Completed" && !task.review;
  QT.markThreadRead(task.id, viewer.id);
  return `
    <a href="#/${role==='provider'?'provider/tasks':'tasks'}" class="btn-ghost btn btn-sm" style="margin-bottom:16px;">← Back to tasks</a>
    <div class="tw-header">
      <div>
        <div class="mono" style="font-size:11.5px;color:var(--text-faint);margin-bottom:4px;">${task.id}</div>
        <h1 style="font-size:20px;">${esc(task.title)}</h1>
        <div class="sub" style="margin-top:4px;">${esc(service.name)} · scheduled ${fmtDateTime(task.scheduledFor)}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">${statusPill(task.status)}<span class="pill pill-mint">Paid</span></div>
    </div>
    <div class="tw-grid">
      <div>
        <div class="card" style="padding:20px;margin-bottom:18px;">
          <h4 style="font-size:13.5px;margin-bottom:8px;">Instructions</h4>
          <p style="font-size:14px;color:var(--text-dim);margin-bottom:14px;">${esc(task.description)}</p>
          ${task.instructions?`<p style="font-size:13.5px;color:var(--text-faint);">${esc(task.instructions)}</p>`:""}
          ${task.files && task.files.length ? `<div style="margin-top:14px;">${task.files.map(f=>`<span class="file-chip">${qtIcon('paperclip',13)} ${esc(f)}</span>`).join("")}</div>`:""}
          <div class="profile-row" style="margin-top:14px;"><span class="k">Customer</span><span>${esc(customer.name)}</span></div>
          <div class="profile-row"><span class="k">Provider</span><span>${esc(provider.name)}</span></div>
          <div class="profile-row"><span class="k">Deadline</span><span>${fmtDateTime(task.deadline)}</span></div>
          <div class="profile-row"><span class="k">Price</span><span>${QT.usd(task.price)} · paid via ${esc(task.paymentMethod)}</span></div>
          ${task.cancelReason?`<div class="profile-row"><span class="k">Note</span><span>${esc(task.cancelReason)}</span></div>`:""}
        </div>
        <div class="card" style="padding:20px;margin-bottom:18px;">
          <h4 style="font-size:13.5px;margin-bottom:14px;">Activity timeline</h4>
          ${timelineHtml(task)}
        </div>
        ${providerActions}
        ${canCancel ? `<button class="btn btn-danger btn-block" data-action="cancel-task" data-task="${task.id}">Cancel task</button>` : ""}
        ${needsReview ? reviewFormHtml(task) : ""}
        ${task.review ? `<div class="card" style="padding:20px;"><h4 style="font-size:13.5px;margin-bottom:8px;">Your review</h4><div class="stars" style="color:var(--amber);">${'★'.repeat(task.review.rating)}${'☆'.repeat(5-task.review.rating)}</div><p style="font-size:13.5px;color:var(--text-dim);margin-top:8px;">${esc(task.review.text)}</p></div>` : ""}
      </div>
      <div class="card" style="padding:18px;">
        <h4 style="font-size:13.5px;margin-bottom:12px;">Messages</h4>
        <div class="chat-box">
          ${chatHtml(task.id, viewer.id)}
          <div class="chat-input">
            <input id="chat-input" placeholder="Write a message…">
            <button class="btn btn-primary btn-sm" data-action="send-msg" data-task="${task.id}" data-other="${otherPartyId}">Send</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function providerTaskActions(task){
  if(task.status==="Pending Provider Acceptance"){
    return `<div class="card" style="padding:18px;margin-bottom:18px;display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-primary" data-action="provider-accept" data-task="${task.id}">Accept</button>
      <button class="btn btn-danger" data-action="provider-decline" data-task="${task.id}">Decline</button>
      <button class="btn btn-ghost" data-action="request-clarification" data-task="${task.id}">Ask for clarification</button>
    </div>`;
  }
  if(task.status==="Accepted"){
    return `<div class="card" style="padding:18px;margin-bottom:18px;"><button class="btn btn-primary btn-block" data-action="provider-start" data-task="${task.id}">Mark as in progress</button></div>`;
  }
  if(task.status==="In Progress"){
    return `<div class="card" style="padding:18px;margin-bottom:18px;"><button class="btn btn-primary btn-block" data-action="provider-submit" data-task="${task.id}">Submit completed work</button></div>`;
  }
  if(task.status==="Submitted"){
    return `<div class="card" style="padding:18px;margin-bottom:18px;color:var(--text-faint);font-size:13.5px;">Waiting on the customer to confirm completion.</div>`;
  }
  return "";
}

function reviewFormHtml(task){
  return `<div class="card" style="padding:20px;">
    <h4 style="font-size:13.5px;margin-bottom:12px;">Leave a review</h4>
    <div class="field" style="margin-bottom:10px;">
      <label>Overall rating</label>
      <span id="rating-stars" data-value="5" style="cursor:pointer;color:var(--amber);font-size:20px;letter-spacing:3px;">★★★★★</span>
    </div>
    <textarea id="review-text" placeholder="How did it go?" style="margin-bottom:12px;"></textarea>
    <button class="btn btn-primary btn-block" data-action="submit-review" data-task="${task.id}">Submit review</button>
  </div>`;
}

function viewWallet(user){
  const wallet = QT.state.wallets[user.id];
  const usd = QT.coinsToUSDCents(wallet.coins);
  const txs = QT.state.walletTransactions[user.id] || [];
  return `
    <div class="page-head"><div><h1>Wallet</h1><div class="sub">Buy Coins to pay for services instantly.</div></div></div>
    <div class="card balance-hero">
      <div>
        <div class="sub">Coin balance</div>
        <div class="big">${wallet.coins.toLocaleString()} <span style="font-size:16px;color:var(--text-faint);font-weight:500;">Coins</span></div>
        <div class="sub">≈ ${QT.usd(usd)} · $10 = 1,000 Coins</div>
      </div>
      <button class="btn btn-primary" data-action="open-buy-coins">Buy Coins</button>
    </div>
    <div class="block">
      <div class="block-head"><h2>Transaction history</h2></div>
      <div class="card" style="padding:6px 18px;">
        ${txs.length ? txs.map(t=>`
          <div class="tx-row"><span>${esc(t.note)}<br><span style="color:var(--text-faint);font-size:11.5px;">${fmtDateTime(t.at)}</span></span><span class="amt ${t.amount>=0?'pos':'neg'}">${t.amount>=0?'+':''}${t.amount.toLocaleString()}</span></div>
        `).join("") : emptyState('wallet','No transactions yet','Coin purchases and payments will show up here.')}
      </div>
    </div>
  `;
}

function viewMessages(user, role){
  const tasks = role==="provider" ? QT.tasksForProvider(user.id) : QT.tasksForCustomer(user.id);
  const rows = tasks.map(t=>{
    const thread = QT.state.messages[t.id]||[];
    const last = thread[thread.length-1];
    const otherId = role==="provider" ? t.customerId : t.providerId;
    const other = QT_DATA.users[otherId] || QT.getProvider(otherId);
    const unread = thread.some(m=>m.from!==user.id && !m.read);
    return `<div class="conv-row" data-nav="#/${role==='provider'?'provider/tasks':'tasks'}/${t.id}">
      ${avatar(other.avatar,40)}
      <div class="body">
        <div class="t1"><span>${esc(other.name)} · ${esc(t.title)}</span>${unread?'<span class="unread-dot"></span>':''}</div>
        <div class="t2">${last ? esc(last.text) : 'No messages yet'}</div>
      </div>
    </div>`;
  }).join("");
  return `
    <div class="page-head"><div><h1>Messages</h1><div class="sub">Every conversation is tied to a task.</div></div></div>
    <div class="card">${rows || emptyState('messages','No conversations yet','Request a service to start a conversation with a provider.')}</div>
  `;
}

function viewProfile(user, role){
  const profile = QT.state.profiles[user.id];
  return `
    <div class="page-head"><div><h1>Profile</h1></div></div>
    <div class="card" style="padding:22px;max-width:560px;">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">${avatar(user.avatar,54)}<div><div style="font-weight:700;font-size:16px;">${esc(user.name)}</div><div style="color:var(--text-faint);font-size:13px;">${esc(user.email)}</div></div></div>
      ${role==="customer" ? `
      <div class="profile-row"><span class="k">Preferred currency</span>
        <select id="pref-currency" style="width:auto;">
          <option ${profile.preferredCurrency==='USD'?'selected':''}>USD</option>
          <option ${profile.preferredCurrency==='Coins'?'selected':''}>Coins</option>
        </select>
      </div>
      <div class="profile-row"><span class="k">Email notifications</span><span class="toggle ${profile.notifications.email?'on':''}" data-action="toggle-notif" data-kind="email"></span></div>
      <div class="profile-row"><span class="k">SMS notifications</span><span class="toggle ${profile.notifications.sms?'on':''}" data-action="toggle-notif" data-kind="sms"></span></div>
      ` : `<div class="profile-row"><span class="k">Role</span><span style="text-transform:capitalize;">${esc(role)}</span></div>`}
      <div class="profile-row"><span class="k">Security</span><span style="color:var(--text-faint);font-size:13px;">Password &amp; 2FA (demo only)</span></div>
    </div>
    <button class="btn btn-ghost" data-action="reset-demo" style="margin-top:18px;">${qtIcon('reset',15)} Reset demo data</button>
  `;
}

function viewHowItWorks(){
  return `
    <div class="page-head"><div><h1>How It Works</h1><div class="sub">The whole flow, start to finish.</div></div></div>
    <div class="flow-steps card" style="padding:22px;">
      <div class="flow-step"><span class="num">01</span><h4>Find a service</h4><p>Browse by category, or search directly for what you need done.</p></div>
      <div class="flow-step"><span class="num">02</span><h4>Describe the task</h4><p>Tell the provider exactly what "done" looks like.</p></div>
      <div class="flow-step"><span class="num">03</span><h4>Schedule it</h4><p>Choose a time at least 48 hours out — this keeps quality high.</p></div>
      <div class="flow-step"><span class="num">04</span><h4>Pay upfront</h4><p>PayPal, Coins, crypto, or card — the request confirms once it clears.</p></div>
      <div class="flow-step"><span class="num">05</span><h4>Get it done</h4><p>Track progress and message your provider in one workspace.</p></div>
    </div>
    <div class="block" style="margin-top:26px;">
      <div class="block-head"><h2>Why 48 hours?</h2></div>
      <div class="card" style="padding:20px;font-size:14px;color:var(--text-dim);">Every service on QuickTask requires at least 48 hours' notice. It gives providers enough runway to do careful work instead of rushed work, and it's enforced at both the moment you pick a time and again right before payment is confirmed.</div>
    </div>
    <div class="block">
      <div class="block-head"><h2>Payment methods</h2></div>
      <div class="feature-grid">
        <div class="feature-card"><div class="ico">${qtIcon('paypal',16)}</div><h4>PayPal</h4><p>Pay directly from your PayPal balance or linked card.</p></div>
        <div class="feature-card"><div class="ico">${qtIcon('coin',16)}</div><h4>Coins</h4><p>QuickTask's internal credit — $10 buys 1,000 Coins.</p></div>
        <div class="feature-card"><div class="ico">${qtIcon('crypto',16)}</div><h4>Crypto</h4><p>USDC, USDT, BTC, or ETH via a modular payment layer.</p></div>
        <div class="feature-card"><div class="ico">${qtIcon('card',16)}</div><h4>Card (USD)</h4><p>Standard card checkout, accounted for in USD.</p></div>
      </div>
    </div>
  `;
}

// ================= PROVIDER VIEWS =================

function viewProviderOverview(providerUser){
  const provider = QT.getProvider(providerUser.id);
  const tasks = QT.tasksForProvider(providerUser.id);
  const pending = tasks.filter(t=>t.status==="Pending Provider Acceptance");
  const upcoming = tasks.filter(t=>t.status==="Accepted");
  const active = tasks.filter(t=>TG.active(t));
  const completed = tasks.filter(TG.completed);
  const wallet = QT.state.providerWallets[providerUser.id];
  return `
    <div class="page-head"><div><h1>Welcome back, ${esc(provider.name.split(' ')[0])}</h1><div class="sub">★ ${provider.rating} · ${provider.completedTasks} tasks completed all-time</div></div></div>
    <div class="stat-grid">
      ${statCard("Pending requests", pending.length)}
      ${statCard("Upcoming", upcoming.length)}
      ${statCard("Active", active.length)}
      ${statCard("Available balance", QT.usd(wallet.availableUSD))}
    </div>
    <div class="block">
      <div class="block-head"><h2>Needs your attention</h2><a href="#/provider/requests">View all →</a></div>
      <div class="card">${pending.length ? pending.map(t=>taskRow(t, QT.getService(t.serviceId))).join("") : emptyState('requests','All caught up','No pending requests right now.')}</div>
    </div>
    <div class="block">
      <div class="block-head"><h2>Recently completed</h2></div>
      <div class="card">${completed.length ? completed.slice(0,3).map(t=>taskRow(t, QT.getService(t.serviceId))).join("") : emptyState('tasks','Nothing completed yet','')}</div>
    </div>
  `;
}

function viewProviderRequests(providerUser){
  const tasks = QT.tasksForProvider(providerUser.id).filter(t=>t.status==="Pending Provider Acceptance");
  return `
    <div class="page-head"><div><h1>Requests</h1><div class="sub">Accept, decline, or ask for clarification before it's scheduled.</div></div></div>
    <div class="card">${tasks.length ? tasks.map(t=>taskRow(t, QT.getService(t.serviceId))).join("") : emptyState('requests','No pending requests','New requests will show up here as they come in.')}</div>
  `;
}

function viewProviderTasks(providerUser, filter){
  filter = filter || "all";
  let tasks = QT.tasksForProvider(providerUser.id).filter(t=>t.status!=="Pending Provider Acceptance");
  const tabs = [["all","All"],["active","Active"],["completed","Completed"],["closed","Cancelled"]];
  if(filter!=="all") tasks = tasks.filter(t => filter==="active"?TG.active(t)||t.status==="Accepted": filter==="completed"?TG.completed(t): TG.closed(t));
  return `
    <div class="page-head"><div><h1>Tasks</h1></div></div>
    <div class="filter-tabs">${tabs.map(([k,l])=>`<button class="${filter===k?'active':''}" data-action="ptasks-filter" data-f="${k}">${l}</button>`).join("")}</div>
    <div class="card">${tasks.length ? tasks.map(t=>taskRow(t, QT.getService(t.serviceId))).join("") : emptyState('tasks','No tasks here','')}</div>
  `;
}

function viewProviderEarnings(providerUser){
  const wallet = QT.state.providerWallets[providerUser.id];
  const tasks = QT.tasksForProvider(providerUser.id).filter(TG.completed);
  const total = tasks.reduce((sum,t)=>sum+QT.providerCut(t.price),0);
  return `
    <div class="page-head"><div><h1>Earnings</h1></div></div>
    <div class="stat-grid">
      ${statCard("Total earned", QT.usd(total))}
      ${statCard("Pending", QT.usd(wallet.pendingUSD))}
      ${statCard("Available", QT.usd(wallet.availableUSD))}
      ${statCard("Platform fee", QT_DATA.config.platformCommissionPct+"%", "per completed task")}
    </div>
    <button class="btn btn-primary" data-action="withdraw" style="margin-bottom:22px;">Withdraw available balance</button>
    <div class="block">
      <div class="block-head"><h2>Completed payouts</h2></div>
      <div class="card" style="padding:6px 18px;">
        ${tasks.length ? tasks.map(t=>`<div class="tx-row"><span>${esc(t.title)}<br><span style="color:var(--text-faint);font-size:11.5px;">${fmtDate(t.createdAt)}</span></span><span class="amt pos">+${QT.usd(QT.providerCut(t.price))}</span></div>`).join("") : emptyState('earnings','No payouts yet','')}
      </div>
    </div>
  `;
}

// ================= ADMIN VIEWS =================

function viewAdminDashboard(){
  const tasks = QT.state.tasks;
  const customers = Object.values(QT_DATA.users).filter(u=>u.role==="customer").length;
  const providersCount = QT_DATA.providers.length;
  const completed = tasks.filter(TG.completed);
  const revenue = QT.state.payments.filter(p=>p.status==="Paid").reduce((s,p)=> s + (p.currency==="Coins" ? QT.coinsToUSDCents(p.amount) : p.amount), 0);
  const fees = completed.reduce((s,t)=>s+QT.platformFee(t.price),0);
  const pendingPayments = QT.state.payments.filter(p=>p.status==="Pending").length;
  const refunds = QT.state.payments.filter(p=>p.status==="Refunded").length;
  const disputes = tasks.filter(t=>t.status==="Disputed").length;

  const byCat = {};
  QT_DATA.categories.forEach(c=>byCat[c.id]=0);
  tasks.forEach(t=>{ const s=QT.getService(t.serviceId); if(s) byCat[s.category]++; });
  const maxCat = Math.max(1,...Object.values(byCat));

  return `
    <div class="page-head"><div><h1>Admin Dashboard</h1><div class="sub">Platform-wide metrics.</div></div></div>
    <div class="stat-grid">
      ${statCard("Total users", customers+providersCount)}
      ${statCard("Customers", customers)}
      ${statCard("Providers", providersCount)}
      ${statCard("Tasks", tasks.length)}
      ${statCard("Completed", completed.length)}
      ${statCard("Revenue", QT.usd(revenue))}
      ${statCard("Platform fees", QT.usd(fees))}
      ${statCard("Pending payments", pendingPayments)}
      ${statCard("Refunds", refunds)}
      ${statCard("Disputes", disputes)}
    </div>
    <div class="block">
      <div class="block-head"><h2>Tasks by category</h2></div>
      <div class="card" style="padding:20px 24px;">
        <div class="bar-chart">
          ${QT_DATA.categories.map(c=>`<div class="bar-col"><div class="bar" style="height:${Math.max(6,(byCat[c.id]/maxCat)*120)}px;"></div><div class="lbl">${esc(c.name.split(' ')[0])}</div></div>`).join("")}
        </div>
      </div>
    </div>
  `;
}

function viewAdminUsers(){
  const customers = Object.values(QT_DATA.users).filter(u=>u.role==="customer");
  const providers = QT_DATA.providers;
  return `
    <div class="page-head"><div><h1>Users</h1></div></div>
    <div class="block"><div class="block-head"><h2>Customers</h2></div>
    <div class="card" style="overflow-x:auto;"><table class="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Tasks</th></tr></thead><tbody>
      ${customers.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.email)}</td><td>${QT.tasksForCustomer(c.id).length}</td></tr>`).join("")}
    </tbody></table></div></div>
    <div class="block"><div class="block-head"><h2>Providers</h2></div>
    <div class="card" style="overflow-x:auto;"><table class="admin-table"><thead><tr><th>Name</th><th>Specialty</th><th>Rating</th><th>Completed</th></tr></thead><tbody>
      ${providers.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.title)}</td><td>★ ${p.rating}</td><td>${p.completedTasks}</td></tr>`).join("")}
    </tbody></table></div></div>
  `;
}

function viewAdminServices(){
  const services = QT.state.services;
  return `
    <div class="page-head">
      <div><h1>Services</h1><div class="sub">Create, edit, feature, or disable services.</div></div>
      <button class="btn btn-primary" data-action="admin-new-service">+ New service</button>
    </div>
    <div class="card" style="overflow-x:auto;"><table class="admin-table"><thead><tr><th>Service</th><th>Category</th><th>Price</th><th>Turnaround</th><th>Status</th><th></th></tr></thead><tbody>
      ${services.map(s=>`<tr>
        <td>${esc(s.name)} ${s.featured?'<span class="pill pill-amber">Featured</span>':''}</td>
        <td>${esc(QT.getCategory(s.category).name)}</td>
        <td>${QT.usd(s.startingPrice)}</td>
        <td>${s.turnaround[0]}–${s.turnaround[1]}h</td>
        <td>${s.active===false?'<span class="pill pill-neutral">Disabled</span>':'<span class="pill pill-mint">Active</span>'}</td>
        <td style="white-space:nowrap;"><button class="btn btn-quiet btn-sm" data-action="admin-edit-service" data-service="${s.id}">Edit</button></td>
      </tr>`).join("")}
    </tbody></table></div>
  `;
}

function viewAdminPayments(){
  const payments = QT.state.payments;
  return `
    <div class="page-head"><div><h1>Payments</h1></div></div>
    <div class="card" style="overflow-x:auto;"><table class="admin-table"><thead><tr><th>Transaction</th><th>Customer</th><th>Provider</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead><tbody>
      ${payments.map(p=>`<tr>
        <td class="mono">${p.id}</td><td>${esc(p.customer)}</td><td>${esc(p.provider)}</td>
        <td>${p.currency==='Coins' ? p.amount.toLocaleString()+' Coins' : QT.usd(p.amount)}</td>
        <td>${esc(p.method)}</td><td>${statusPill(p.status==='Paid'?'Completed':p.status)}</td><td>${fmtDate(p.at)}</td>
      </tr>`).join("")}
    </tbody></table></div>
  `;
}
