/* ============================================================
   QUICKTASK — APP CONTROLLER
   Router + event delegation + modal/wizard interactions.
   ============================================================ */

const root = document.getElementById("root");

// transient, non-persisted UI state (filters, wizard-in-progress)
const ui = {
  serviceQuery: "", serviceCategory: "all",
  tasksFilter: "all", ptasksFilter: "all",
  wizardServiceId: null, wizardAttachments: [], wizardPayMethod: "Coins",
};

// ---------------- toast ----------------
function toast(msg, type){
  let host = document.getElementById("qt-toast-host");
  const el = document.createElement("div");
  el.className = "qt-toast" + (type ? " " + type : "");
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .25s"; setTimeout(()=>el.remove(), 260); }, 2400);
}

// ---------------- modal ----------------
function openModal(html){
  closeModal();
  const wrap = document.createElement("div");
  wrap.className = "qt-modal-backdrop";
  wrap.id = "qt-modal-backdrop";
  wrap.innerHTML = html;
  wrap.addEventListener("click", (e) => { if(e.target === wrap) closeModal(); });
  document.body.appendChild(wrap);
}
function closeModal(){ const el = document.getElementById("qt-modal-backdrop"); if(el) el.remove(); }

// ---------------- router ----------------
function currentHash(){ return location.hash || "#/home"; }

function redirectHome(role){
  const home = role === "provider" ? "#/provider/overview" : role === "admin" ? "#/admin/dashboard" : "#/home";
  if(location.hash !== home) location.hash = home; else renderRoute();
}

function renderRoute(){
  if(!QT.state.session){
    root.innerHTML = renderLogin();
    return;
  }
  const { role, userId } = QT.state.session;
  const user = QT_DATA.users[userId];
  const hash = currentHash();

  if(role === "customer" && (hash.startsWith("#/provider") || hash.startsWith("#/admin"))) return redirectHome(role);
  if(role === "provider" && !hash.startsWith("#/provider")) return redirectHome(role);
  if(role === "admin" && !hash.startsWith("#/admin")) return redirectHome(role);

  let content = "";
  let matched = true;

  if(role === "customer"){
    if(hash === "#/home") content = viewHome(user);
    else if(hash === "#/services") content = viewServices(ui.serviceQuery, ui.serviceCategory);
    else if(hash.startsWith("#/services/")){
      const s = QT.getService(hash.split("/")[2]);
      content = s ? viewServiceDetail(s) : emptyState("search","Service not found","");
    }
    else if(hash.startsWith("#/request/")){
      const s = QT.getService(hash.split("/")[2]);
      if(s){ ui.wizardServiceId = s.id; ui.wizardAttachments = []; ui.wizardPayMethod = "Coins"; content = viewRequestWizard(s); }
      else content = emptyState("search","Service not found","");
    }
    else if(hash === "#/how-it-works") content = viewHowItWorks();
    else if(hash === "#/tasks") content = viewMyTasks(user, ui.tasksFilter);
    else if(hash.startsWith("#/tasks/")){
      const t = QT.getTask(hash.split("/")[2]);
      content = t ? viewTaskWorkspace(t, user, "customer") : emptyState("tasks","Task not found","");
    }
    else if(hash === "#/wallet") content = viewWallet(user);
    else if(hash === "#/messages") content = viewMessages(user, "customer");
    else if(hash === "#/profile") content = viewProfile(user, "customer");
    else matched = false;
  } else if(role === "provider"){
    if(hash === "#/provider/overview") content = viewProviderOverview(user);
    else if(hash === "#/provider/requests") content = viewProviderRequests(user);
    else if(hash === "#/provider/tasks") content = viewProviderTasks(user, ui.ptasksFilter);
    else if(hash.startsWith("#/provider/tasks/")){
      const t = QT.getTask(hash.split("/")[3]);
      content = t ? viewTaskWorkspace(t, user, "provider") : emptyState("tasks","Task not found","");
    }
    else if(hash === "#/provider/earnings") content = viewProviderEarnings(user);
    else if(hash === "#/provider/messages") content = viewMessages(user, "provider");
    else if(hash === "#/provider/profile") content = viewProfile(user, "provider");
    else matched = false;
  } else if(role === "admin"){
    if(hash === "#/admin/dashboard") content = viewAdminDashboard();
    else if(hash === "#/admin/users") content = viewAdminUsers();
    else if(hash === "#/admin/services") content = viewAdminServices();
    else if(hash === "#/admin/payments") content = viewAdminPayments();
    else matched = false;
  }

  if(!matched) return redirectHome(role);

  root.innerHTML = renderShell(role, hash, user, content);
  afterRender(hash, user, role);
}

// ---------------- post-render hooks ----------------
function afterRender(hash, user, role){
  if(hash.startsWith("#/request/")){
    const scheduleInput = document.getElementById("f-schedule");
    if(scheduleInput){
      const hint = document.getElementById("schedule-hint");
      const check = () => {
        const v = QT.validateSchedule(scheduleInput.value);
        hint.textContent = v.valid ? "Meets the 48-hour notice requirement." : v.message;
        hint.classList.toggle("warn", !v.valid);
      };
      scheduleInput.addEventListener("input", check);
      check();
    }
  }
  if(hash.startsWith("#/tasks/") || hash.startsWith("#/provider/tasks/")){
    const scroll = document.getElementById("chat-scroll");
    if(scroll) scroll.scrollTop = scroll.scrollHeight;
  }
  const searchForm = document.querySelector('[data-role="global-search"]');
  if(searchForm){
    const input = searchForm.querySelector("input");
    if(input) input.value = ui.serviceQuery;
  }
}

// ---------------- wizard step control ----------------
function goToStep(step){
  document.querySelectorAll("[data-step]").forEach(el => { el.style.display = String(el.dataset.step) === String(step) ? "" : "none"; });
  document.querySelectorAll("[data-dot]").forEach(el => {
    const n = Number(el.dataset.dot);
    el.classList.toggle("active", n === step);
    el.classList.toggle("done", n < step);
  });
}

function buildReviewBody(service){
  const title = document.getElementById("f-title").value || "(untitled task)";
  const desc = document.getElementById("f-desc").value || "—";
  const schedule = document.getElementById("f-schedule").value;
  const link = document.getElementById("f-link").value;
  const notes = document.getElementById("f-notes").value;
  const rows = [
    ["Service", service.name],
    ["Title", title],
    ["Description", desc],
    ["Scheduled for", schedule ? fmtDateTime(new Date(schedule).toISOString()) : "—"],
    ["Reference link", link || "—"],
    ["Notes", notes || "—"],
    ["Attachments", ui.wizardAttachments.length ? ui.wizardAttachments.join(", ") : "None"],
  ];
  return rows.map(([k,v]) => `<div class="review-line"><span class="k">${esc(k)}</span><span>${esc(v)}</span></div>`).join("");
}

// ---------------- global event delegation ----------------
document.addEventListener("click", (e) => {
  const navEl = e.target.closest("[data-nav]");
  if(navEl){ location.hash = navEl.dataset.nav; return; }

  const actionEl = e.target.closest("[data-action]");
  const payMethodEl = e.target.closest(".pay-method");
  const ratingStars = e.target.closest("#rating-stars");
  const modalClose = e.target.closest(".qt-modal-close");

  if(modalClose){ closeModal(); return; }

  if(ratingStars){
    const rect = ratingStars.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const val = Math.max(1, Math.min(5, Math.ceil(pct * 5)));
    ratingStars.dataset.value = val;
    ratingStars.textContent = "★".repeat(val) + "☆".repeat(5-val);
    return;
  }

  if(payMethodEl){
    document.querySelectorAll(".pay-method").forEach(el => el.classList.remove("selected"));
    payMethodEl.classList.add("selected");
    ui.wizardPayMethod = payMethodEl.dataset.pay;
    document.getElementById("crypto-asset-row").style.display = ui.wizardPayMethod === "Crypto" ? "" : "none";
    const service = QT.getService(ui.wizardServiceId);
    const coinsWarn = document.getElementById("coins-warning");
    const insufficient = ui.wizardPayMethod === "Coins" && QT.state.wallets[QT.currentUser().id].coins < QT.usdCentsToCoins(service.startingPrice);
    coinsWarn.style.display = insufficient ? "" : "none";
    return;
  }

  if(!actionEl) return;
  const a = actionEl.dataset;

  switch(a.action){
    case "demo-login": {
      let userId = a.user;
      if(a.role === "customer") userId = document.getElementById("customer-select").value;
      QT.login(a.role, userId);
      location.hash = a.role === "provider" ? "#/provider/overview" : a.role === "admin" ? "#/admin/dashboard" : "#/home";
      renderRoute();
      toast(`Signed in as ${QT_DATA.users[userId].name}`, "success");
      break;
    }
    case "logout": {
      QT.logout();
      location.hash = "#/home";
      renderRoute();
      break;
    }
    case "filter-cat": {
      ui.serviceCategory = a.cat;
      renderRoute();
      break;
    }
    case "tasks-filter": { ui.tasksFilter = a.f; renderRoute(); break; }
    case "ptasks-filter": { ui.ptasksFilter = a.f; renderRoute(); break; }
    case "mock-attach": {
      const names = ["brief.pdf","reference-sheet.xlsx","notes.docx","screenshot.png","source-data.csv"];
      const name = names[Math.floor(Math.random()*names.length)];
      ui.wizardAttachments.push(name);
      renderAttachChips();
      break;
    }
    case "wizard-next": {
      const to = Number(a.to);
      const service = QT.getService(ui.wizardServiceId);
      if(to === 2){
        const title = document.getElementById("f-title").value.trim();
        const desc = document.getElementById("f-desc").value.trim();
        const scheduleVal = document.getElementById("f-schedule").value;
        if(!title || !desc){ toast("Add a title and description to continue.", "error"); return; }
        const check = QT.validateSchedule(scheduleVal);
        if(!check.valid){ toast(check.message, "error"); return; }
        document.getElementById("review-body").innerHTML = buildReviewBody(service);
      }
      goToStep(to);
      break;
    }
    case "wizard-back": { goToStep(Number(a.to)); break; }
    case "submit-payment": {
      const service = QT.getService(a.service);
      const user = QT.currentUser();
      if(ui.wizardPayMethod === "Coins" && QT.state.wallets[user.id].coins < QT.usdCentsToCoins(service.startingPrice)){
        toast("Not enough Coins for this task.", "error");
        return;
      }
      const form = {
        title: document.getElementById("f-title").value.trim(),
        description: document.getElementById("f-desc").value.trim(),
        instructions: document.getElementById("f-instr").value.trim(),
        attachments: ui.wizardAttachments.slice(),
      };
      const scheduledFor = new Date(document.getElementById("f-schedule").value).toISOString();
      let method = ui.wizardPayMethod;
      if(method === "Crypto") method = document.getElementById("crypto-asset").value;
      goToStep("processing");
      QT.createAndPayTask({ serviceId: service.id, customerId: user.id, form, scheduledFor, paymentMethod: method }).then(res => {
        if(!res.ok){ toast(res.message, "error"); goToStep(1); return; }
        goToStep("success");
        document.getElementById("view-task-link").href = "#/tasks/" + res.task.id;
        toast("Payment successful — request sent to the provider.", "success");
      });
      break;
    }
    case "open-buy-coins": {
      openModal(`<div class="qt-modal">
        <div class="qt-modal-head"><h3>Buy Coins</h3><button class="qt-modal-close">✕</button></div>
        <div class="qt-modal-body">
          <div style="display:flex;flex-direction:column;gap:10px;">
            <button class="btn btn-quiet btn-block" data-action="buy-coins" data-amount="1000">$10 → 1,000 Coins</button>
            <button class="btn btn-quiet btn-block" data-action="buy-coins" data-amount="2500">$25 → 2,500 Coins</button>
            <button class="btn btn-quiet btn-block" data-action="buy-coins" data-amount="5000">$50 → 5,000 Coins</button>
          </div>
          <p style="font-size:11.5px;color:var(--text-faint);margin-top:14px;">Demo payment environment — no real charge occurs.</p>
        </div></div>`);
      break;
    }
    case "buy-coins": {
      const user = QT.currentUser();
      const coins = QT.buyCoins(user.id, Number(a.amount));
      closeModal();
      toast(`Added ${coins.toLocaleString()} Coins.`, "success");
      renderRoute();
      break;
    }
    case "send-msg": {
      const input = document.getElementById("chat-input");
      const text = input.value.trim();
      if(!text) return;
      QT.addMessage(a.task, QT.currentUser().id, text);
      input.value = "";
      renderRoute();
      break;
    }
    case "cancel-task": {
      QT.updateTaskStatus(a.task, "Cancelled", { cancelReason: "Cancelled by customer." });
      toast("Task cancelled.", "success");
      renderRoute();
      break;
    }
    case "provider-accept": { QT.updateTaskStatus(a.task, "Accepted"); toast("Request accepted.", "success"); renderRoute(); break; }
    case "provider-decline": { QT.updateTaskStatus(a.task, "Declined", { cancelReason: "Declined by provider." }); toast("Request declined.", "success"); renderRoute(); break; }
    case "provider-start": { QT.updateTaskStatus(a.task, "In Progress"); toast("Marked in progress.", "success"); renderRoute(); break; }
    case "provider-submit": { QT.updateTaskStatus(a.task, "Submitted"); toast("Submitted to customer.", "success"); renderRoute(); break; }
    case "request-clarification": {
      QT.addMessage(a.task, QT.getTask(a.task).providerId, "Could you clarify a few details before I get started?");
      toast("Clarification requested.", "success");
      renderRoute();
      break;
    }
    case "submit-review": {
      const rating = Number(document.getElementById("rating-stars").dataset.value || 5);
      const text = document.getElementById("review-text").value.trim() || "Great work, thank you!";
      QT.addReview(a.task, { rating, text });
      toast("Review submitted.", "success");
      renderRoute();
      break;
    }
    case "toggle-notif": {
      const user = QT.currentUser();
      const prof = QT.state.profiles[user.id];
      prof.notifications[a.kind] = !prof.notifications[a.kind];
      QT.save();
      renderRoute();
      break;
    }
    case "reset-demo": {
      QT.reset();
      location.hash = "#/home";
      renderRoute();
      toast("Demo data reset.", "success");
      break;
    }
    case "withdraw": {
      const user = QT.currentUser();
      const wallet = QT.state.providerWallets[user.id];
      if(wallet.availableUSD <= 0){ toast("Nothing available to withdraw.", "error"); return; }
      wallet.availableUSD = 0;
      QT.save();
      toast("Withdrawal requested — arrives in 2–3 business days (demo).", "success");
      renderRoute();
      break;
    }
    case "admin-new-service": { openModal(adminServiceModal(null)); break; }
    case "admin-edit-service": { openModal(adminServiceModal(QT.getService(a.service))); break; }
    case "admin-save-service": {
      const id = a.service;
      const name = document.getElementById("m-name").value.trim();
      const category = document.getElementById("m-category").value;
      const price = Math.round(Number(document.getElementById("m-price").value) * 100);
      const t1 = Number(document.getElementById("m-t1").value);
      const t2 = Number(document.getElementById("m-t2").value);
      const active = document.getElementById("m-active").checked;
      const featured = document.getElementById("m-featured").checked;
      if(!name || !price){ toast("Add a name and price.", "error"); return; }
      if(id){
        QT.updateService(id, { name, category, startingPrice: price, turnaround:[t1,t2], active, featured });
      } else {
        QT.state.services.push({
          id: QT.nextId("svc").toLowerCase(), category, name,
          shortDesc: "New service — description pending.",
          description: "New service — description pending.",
          whatsIncluded: [], requirements: [], startingPrice: price, turnaround:[t1,t2],
          providerId: QT_DATA.providers[0].id, rating: 5.0, reviewCount: 0, active, featured,
        });
        QT.save();
      }
      closeModal();
      toast("Service saved.", "success");
      renderRoute();
      break;
    }
    case "admin-delete-service": {
      QT.state.services = QT.state.services.filter(s => s.id !== a.service);
      QT.save();
      closeModal();
      toast("Service removed.", "success");
      renderRoute();
      break;
    }
  }
});

document.addEventListener("submit", (e) => {
  const form = e.target.closest('[data-role="global-search"]');
  if(form){
    e.preventDefault();
    ui.serviceQuery = form.querySelector("input").value.trim();
    ui.serviceCategory = "all";
    location.hash = "#/services";
    renderRoute();
  }
});

document.addEventListener("change", (e) => {
  if(e.target.id === "pref-currency"){
    const user = QT.currentUser();
    QT.state.profiles[user.id].preferredCurrency = e.target.value;
    QT.save();
    toast("Preference saved.", "success");
  }
});

function renderAttachChips(){
  const host = document.getElementById("attach-list");
  if(!host) return;
  host.innerHTML = ui.wizardAttachments.map((f,i)=>`<span class="file-chip">${qtIcon('paperclip',13)} ${esc(f)}</span>`).join("");
}

function adminServiceModal(service){
  const cats = QT_DATA.categories;
  return `<div class="qt-modal">
    <div class="qt-modal-head"><h3>${service?"Edit service":"New service"}</h3><button class="qt-modal-close">✕</button></div>
    <div class="qt-modal-body">
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="field"><label>Name</label><input id="m-name" value="${service?esc(service.name):""}"></div>
        <div class="field"><label>Category</label><select id="m-category">${cats.map(c=>`<option value="${c.id}" ${service&&service.category===c.id?'selected':''}>${esc(c.name)}</option>`).join("")}</select></div>
        <div class="form-grid">
          <div class="field"><label>Starting price (USD)</label><input id="m-price" type="number" step="0.01" value="${service?(service.startingPrice/100).toFixed(2):"25.00"}"></div>
          <div class="field"><label>Turnaround (hours)</label>
            <div style="display:flex;gap:8px;">
              <input id="m-t1" type="number" value="${service?service.turnaround[0]:24}">
              <input id="m-t2" type="number" value="${service?service.turnaround[1]:48}">
            </div>
          </div>
        </div>
        <div class="profile-row"><span class="k">Active</span><input id="m-active" type="checkbox" ${!service||service.active!==false?'checked':''} style="width:auto;"></div>
        <div class="profile-row"><span class="k">Featured</span><input id="m-featured" type="checkbox" ${service&&service.featured?'checked':''} style="width:auto;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:20px;">
        ${service?`<button class="btn btn-danger" data-action="admin-delete-service" data-service="${service.id}">Delete</button>`:'<span></span>'}
        <button class="btn btn-primary" data-action="admin-save-service" data-service="${service?service.id:''}">Save service</button>
      </div>
    </div>
  </div>`;
}

// ---------------- init ----------------
window.addEventListener("hashchange", renderRoute);
window.addEventListener("DOMContentLoaded", () => {
  QT.load();
  renderRoute();
});
