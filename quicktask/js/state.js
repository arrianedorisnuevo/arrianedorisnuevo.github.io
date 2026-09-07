/* ============================================================
   QUICKTASK — STATE & BUSINESS LOGIC
   ------------------------------------------------------------
   In a real deployment this file's job would be split between
   a client-side store and a server: anything marked
   "// SERVER-SIDE IN PRODUCTION" below is logic that must be
   re-checked by an API before it's trusted, even though this
   demo runs it in the browser so it works on GitHub Pages.
   ============================================================ */

const QT_STORAGE_KEY = "quicktask_demo_v1";

const QT = {
  state: null,

  // ---------------- persistence ----------------
  load(){
    let raw = null;
    try{ raw = localStorage.getItem(QT_STORAGE_KEY); }catch(e){ /* storage unavailable */ }
    if(raw){
      try{ this.state = JSON.parse(raw); return; }catch(e){ /* fall through to fresh state */ }
    }
    this.state = this.freshState();
    this.save();
  },
  save(){
    try{ localStorage.setItem(QT_STORAGE_KEY, JSON.stringify(this.state)); }catch(e){ /* ignore quota errors in demo */ }
  },
  reset(){
    try{ localStorage.removeItem(QT_STORAGE_KEY); }catch(e){}
    this.state = this.freshState();
    this.save();
  },
  freshState(){
    return {
      session: null, // { role, userId }
      tasks: JSON.parse(JSON.stringify(QT_DATA.tasks)),
      services: JSON.parse(JSON.stringify(QT_DATA.services)),
      messages: JSON.parse(JSON.stringify(QT_DATA.messages)),
      walletTransactions: JSON.parse(JSON.stringify(QT_DATA.walletTransactions)),
      payments: JSON.parse(JSON.stringify(QT_DATA.payments)),
      wallets: {
        "user-alex": { coins: QT_DATA.users["user-alex"].wallet.coins },
        "user-jamie": { coins: QT_DATA.users["user-jamie"].wallet.coins },
      },
      providerWallets: {
        "prov-sofia": { availableUSD: QT_DATA.users["prov-sofia"].wallet.availableUSD, pendingUSD: QT_DATA.users["prov-sofia"].wallet.pendingUSD },
      },
      profiles: {
        "user-alex": { notifications: { ...QT_DATA.users["user-alex"].notifications }, preferredCurrency: QT_DATA.users["user-alex"].preferredCurrency },
        "user-jamie": { notifications: { ...QT_DATA.users["user-jamie"].notifications }, preferredCurrency: QT_DATA.users["user-jamie"].preferredCurrency },
      },
      seq: 1100,
    };
  },

  // ---------------- session ----------------
  login(role, userId){
    this.state.session = { role, userId };
    this.save();
  },
  logout(){
    this.state.session = null;
    this.save();
  },
  currentUser(){
    if(!this.state.session) return null;
    return QT_DATA.users[this.state.session.userId];
  },

  // ---------------- lookups ----------------
  getService(id){ return this.state.services.find(s => s.id === id); },
  getProvider(id){ return QT_DATA.providers.find(p => p.id === id); },
  getCategory(id){ return QT_DATA.categories.find(c => c.id === id); },
  getTask(id){ return this.state.tasks.find(t => t.id === id); },
  tasksForCustomer(userId){ return this.state.tasks.filter(t => t.customerId === userId).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)); },
  tasksForProvider(providerId){ return this.state.tasks.filter(t => t.providerId === providerId).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)); },
  reviewsForProvider(providerId){
    return this.state.tasks.filter(t => t.providerId === providerId && t.review).map(t => ({ ...t.review, serviceId: t.serviceId, taskId: t.id }));
  },
  reviewsForService(serviceId){
    return this.state.tasks.filter(t => t.serviceId === serviceId && t.review).map(t => ({ ...t.review, taskId: t.id, customerId: t.customerId }));
  },

  // ---------------- scheduling: the 48-hour rule ----------------
  minLeadMs(){ return QT_DATA.config.minLeadHours * 60 * 60 * 1000; },
  minScheduleDate(serverNow){
    return new Date((serverNow || Date.now()) + this.minLeadMs());
  },
  // Re-checked at payment time to simulate a server call — the frontend
  // datetime-local `min` attribute is only a UX convenience, never the
  // source of truth. SERVER-SIDE IN PRODUCTION: this exact check would
  // run again in the API using the request's arrival time, not the
  // client's clock, to prevent a stale form from slipping through.
  validateSchedule(dateInputValue, serverNow){
    const now = serverNow || Date.now();
    if(!dateInputValue) return { valid:false, message:"Choose a date and time for this service." };
    const chosen = new Date(dateInputValue).getTime();
    if(isNaN(chosen)) return { valid:false, message:"That date doesn't look valid." };
    const min = now + this.minLeadMs();
    if(chosen < min){
      return { valid:false, message:`This service requires at least ${QT_DATA.config.minLeadHours} hours' advance notice. Please select a later time.` };
    }
    return { valid:true };
  },

  // ---------------- money / coins ----------------
  usd(cents){ return (cents/100).toLocaleString("en-US", { style:"currency", currency:"USD" }); },
  coinsToUSDCents(coins){ return Math.round((coins / QT_DATA.config.coinsPerUSD) * 100); },
  usdCentsToCoins(cents){ return Math.round((cents/100) * QT_DATA.config.coinsPerUSD); },
  formatCoins(coins){ return coins.toLocaleString("en-US") + " Coins"; },
  providerCut(priceCents){ return Math.round(priceCents * (1 - QT_DATA.config.platformCommissionPct/100)); },
  platformFee(priceCents){ return priceCents - this.providerCut(priceCents); },

  // ---------------- ids ----------------
  nextId(prefix){ this.state.seq += 1; return `${prefix}-${this.state.seq}`; },

  // ---------------- task lifecycle ----------------
  // Simulates: charge payment method -> create task -> route to provider.
  // Returns a Promise so callers can show a processing state, the way a
  // real payment provider round-trip would behave.
  createAndPayTask({ serviceId, customerId, form, scheduledFor, paymentMethod }){
    const service = this.getService(serviceId);
    return new Promise((resolve) => {
      setTimeout(() => {
        // SERVER-SIDE IN PRODUCTION: re-validate schedule + payment auth here.
        const check = this.validateSchedule(scheduledFor);
        if(!check.valid){ resolve({ ok:false, message: check.message }); return; }

        const id = this.nextId("T");
        const nowIso = new Date().toISOString();
        const deadline = new Date(new Date(scheduledFor).getTime() + this.minLeadMs()).toISOString();
        const task = {
          id, customerId, providerId: service.providerId, serviceId,
          title: form.title, description: form.description, instructions: form.instructions || "",
          deadline, scheduledFor, status: "Pending Provider Acceptance",
          price: service.startingPrice, paymentMethod,
          createdAt: nowIso,
          history: [
            { status:"Requested", at: nowIso },
            { status:"Paid", at: nowIso },
          ],
          files: form.attachments || [],
        };
        this.state.tasks.unshift(task);
        this.state.messages[id] = [];

        // deduct / record payment
        if(paymentMethod === "Coins"){
          this.state.wallets[customerId].coins -= this.usdCentsToCoins(service.startingPrice);
          this.recordWalletTx(customerId, -this.usdCentsToCoins(service.startingPrice), `Payment for ${task.title}`);
        }
        this.state.payments.unshift({
          id: this.nextId("PAY"), taskId:id,
          customer: QT_DATA.users[customerId].name,
          provider: this.getProvider(service.providerId).name,
          amount: service.startingPrice,
          currency: paymentMethod === "Coins" ? "Coins" : (paymentMethod === "PayPal" ? "USD" : paymentMethod),
          method: paymentMethod, status:"Paid", at: nowIso,
        });

        this.save();
        resolve({ ok:true, task });
      }, 1400);
    });
  },
  recordWalletTx(userId, coinsDelta, note){
    if(!this.state.walletTransactions[userId]) this.state.walletTransactions[userId] = [];
    this.state.walletTransactions[userId].unshift({ id: this.nextId("WT"), type: coinsDelta >= 0 ? "credit" : "spend", amount: coinsDelta, note, at: new Date().toISOString() });
  },
  buyCoins(userId, usdCents){
    const coins = this.usdCentsToCoins(usdCents);
    this.state.wallets[userId].coins += coins;
    this.recordWalletTx(userId, coins, `Bought ${coins.toLocaleString()} Coins`);
    this.save();
    return coins;
  },
  updateTaskStatus(taskId, status, extra){
    const task = this.getTask(taskId);
    if(!task) return;
    task.status = status;
    task.history.push({ status, at: new Date().toISOString() });
    if(extra) Object.assign(task, extra);
    if(status === "Cancelled" || status === "Declined"){
      // refund coins if applicable
      if(task.paymentMethod === "Coins"){
        const coins = this.usdCentsToCoins(task.price);
        this.state.wallets[task.customerId].coins += coins;
        this.recordWalletTx(task.customerId, coins, `Refund for ${status.toLowerCase()} ${task.id}`);
      }
    }
    if(status === "Completed"){
      const providerWallet = this.state.providerWallets[task.providerId];
      if(providerWallet){
        providerWallet.pendingUSD += this.providerCut(task.price);
      }
    }
    this.save();
  },
  addMessage(taskId, fromId, text){
    if(!this.state.messages[taskId]) this.state.messages[taskId] = [];
    this.state.messages[taskId].push({ from: fromId, text, at: new Date().toISOString(), read: false });
    this.save();
  },
  markThreadRead(taskId, viewerId){
    const thread = this.state.messages[taskId];
    if(!thread) return;
    thread.forEach(m => { if(m.from !== viewerId) m.read = true; });
    this.save();
  },
  addReview(taskId, review){
    const task = this.getTask(taskId);
    if(!task) return;
    task.review = { ...review, at: new Date().toISOString() };
    this.save();
  },

  // ---------------- admin: service management ----------------
  updateService(id, patch){
    const s = this.getService(id);
    if(s) Object.assign(s, patch);
    this.save();
  },
};
