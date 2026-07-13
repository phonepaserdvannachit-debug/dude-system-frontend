// ===================================================
// DUDE PAYMENT SYSTEM - Production Frontend Controller
// ===================================================

const CONFIG = {
  apiPrefix: "/api/v1",
  tokenKey: "dude_access_token",
  userKey: "dude_current_user",
  apiBaseKey: "dude_api_base_url",
  defaultApiBase: "https://dudesystem-production.up.railway.app/",
};

const CATALOG = {
  people: [
    { id: 1, name: "Michael", aka: "Vice Head", user_name: "john", profile_pic: null, qr_code: null, is_admin: true, is_active: true },
    { id: 2, name: "A TAR", aka: "Gen Z Manager", user_name: "tar", profile_pic: null, qr_code: null, is_admin: false, is_active: true },
    { id: 3, name: "Lobster", aka: "Speech Manager", user_name: "koung", profile_pic: null, qr_code: null, is_admin: false, is_active: true },
    { id: 4, name: "SomLock", aka: "Teacher", user_name: "sun", profile_pic: null, qr_code: null, is_admin: false, is_active: true },
    { id: 5, name: "Aiy SomHee", aka: "Head", user_name: "top", profile_pic: null, qr_code: null, is_admin: false, is_active: true },
    { id: 6, name: "Daddy", aka: "Member", user_name: "dan", profile_pic: null, qr_code: null, is_admin: false, is_active: true },
    { id: 7, name: "NowImhurt", aka: "Founder", user_name: "ko", profile_pic: null, qr_code: null, is_admin: false, is_active: true },
    { id: 8, name: "Vick", aka: "Member", user_name: "vick", profile_pic: null, qr_code: null, is_admin: false, is_active: true },
  ],
  types: [
    { id: 1, type_name: "DRINK" },
    { id: 2, type_name: "FOOD" },
    { id: 3, type_name: "OTHERS" },
  ],
  goods: [
    { id: 1, name: "Oishi", price: 15000, category_id: 1 },
    { id: 2, name: "Yen Yen", price: 15000, category_id: 1 },
    { id: 3, name: "ChanKeow", price: 15000, category_id: 1 },
    { id: 4, name: "Namduem 5l", price: 25000, category_id: 1 },
    { id: 5, name: "Namduem 1.5l", price: 10000, category_id: 1 },
    { id: 6, name: "Kratom", price: 100000, category_id: 2 },
    { id: 7, name: "Nam ya", price: 75000, category_id: 2 },
    { id: 8, name: "Bai", price: 25000, category_id: 2 },
    { id: 9, name: "S5000", price: 5000, category_id: 3 },
    { id: 10, name: "S8000", price: 8000, category_id: 3 },
    { id: 11, name: "S10000", price: 10000, category_id: 3 },
    { id: 12, name: "S12000", price: 12000, category_id: 3 },
    { id: 13, name: "S15000", price: 15000, category_id: 3 },
    { id: 23, name: "Sumlee", price: 20000, category_id: 5 },
    { id: 24, name: "Ice3", price: 3000, category_id: 5 },
    { id: 25, name: "Ice5", price: 5000, category_id: 5 },
    { id: 26, name: "Ice10", price: 10000, category_id: 5 },
    { id: 27, name: "Tizzu8", price: 8000, category_id: 5 },
    { id: 28, name: "Tizzu10", price: 10000, category_id: 5 },
    { id: 29, name: "Tizzu12", price: 12000, category_id: 5 },
  ],
};

const DB = {
  person: [...CATALOG.people],
  type_of_bill: [...CATALOG.types],
  goods: [...CATALOG.goods],
  bill: [],
  bill_detail: [],
  share: [],
  slip: [],
  contract: [],
};

let CURRENT_USER_ID = null;
let CURRENT_USER = null;
let currentFilter = "all";
let updateFilter = "all";
let isTableView = false;
let currentDetailBillId = null;
let createGoodsRows = [];
let editGoodsRows = [];
let editingBillId = null;
let billDetailCache = new Map();
let appIsBooted = false;
let currentTheme = localStorage.getItem("dude_theme") || "light";
let currentAccent = localStorage.getItem("dude_accent") || "#0D6B8C";

function getApiBase(){
  return (localStorage.getItem(CONFIG.apiBaseKey) || CONFIG.defaultApiBase).replace(/\/+$/, "");
}

function apiUrl(path){
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${CONFIG.apiPrefix}${cleanPath}`;
}

function authToken(){
  return localStorage.getItem(CONFIG.tokenKey);
}

function authHeaders(extra = {}){
  const headers = { ...extra };
  const token = authToken();
  if(token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function apiRequest(path, options = {}){
  const headers = authHeaders(options.headers || {});
  let body = options.body;
  if(body && !(body instanceof FormData)){
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
    body,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text();

  if(response.status === 401){
    clearSession();
    goTo("login");
    throw new Error("Session expired. Please log in again.");
  }

  if(!response.ok){
    const detail = payload && typeof payload === "object" ? payload.detail : payload;
    throw new Error(Array.isArray(detail) ? detail.map(item => item.msg || item.detail).join(", ") : detail || `Request failed (${response.status})`);
  }

  return payload;
}

function normalizeApiPath(path){
  if(!path) return "";
  if(/^https?:\/\//i.test(path)) return path;
  return `${getApiBase()}${path}`;
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function showToast(msg, dur = 2600){
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add("hidden"), dur);
}

function showLoading(targetId, text = "Loading..."){
  const el = document.getElementById(targetId);
  if(el) el.innerHTML = `<div class="state-box">${escapeHtml(text)}</div>`;
}

function showEmpty(text){
  return `<div class="state-box">${escapeHtml(text)}</div>`;
}

function setButtonBusy(button, busy, text){
  if(!button) return;
  if(busy){
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = text || "Working...";
  }else{
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
  }
}

function saveSession(token, user){
  localStorage.setItem(CONFIG.tokenKey, token);
  localStorage.setItem(CONFIG.userKey, JSON.stringify(user));
  CURRENT_USER = user;
  CURRENT_USER_ID = user.id;
  upsertPerson(user);
}

function clearSession(){
  localStorage.removeItem(CONFIG.tokenKey);
  localStorage.removeItem(CONFIG.userKey);
  CURRENT_USER = null;
  CURRENT_USER_ID = null;
  billDetailCache.clear();
}

function restoreCachedUser(){
  const raw = localStorage.getItem(CONFIG.userKey);
  if(!raw) return null;
  try{
    const user = JSON.parse(raw);
    CURRENT_USER = user;
    CURRENT_USER_ID = user.id;
    upsertPerson(user);
    return user;
  }catch{
    return null;
  }
}

async function boot(){
  if(appIsBooted) return;
  appIsBooted = true;
  restoreCachedUser();
  applyTheme(currentTheme, currentAccent);

  if(authToken()){
    try{
      const user = await apiRequest("/auth/me");
      saveSession(authToken(), user);
      await loadAppData();
      updateHomeHeader();
      goTo("home");
      return;
    }catch(err){
      showToast(err.message || "Please log in again");
    }
  }

  goTo("login");
}

function updateHomeHeader(){
  const user = CURRENT_USER || personById(CURRENT_USER_ID);
  document.getElementById("home-username").textContent = user ? `${user.name}${user.aka ? ` - ${user.aka}` : ""}` : "-";
  document.getElementById("home-date").textContent = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function doLogin(){
  const btn = document.querySelector(".btn-confirm");
  const username = document.getElementById("login-user").value.trim();
  const password = document.getElementById("login-pass").value.trim();
  if(!username || !password){
    showToast("Enter username and PIN");
    return;
  }

  setButtonBusy(btn, true, "Signing in...");
  try{
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: { username, password },
    });
    saveSession(response.access_token, response.user);
    await loadAppData();
    updateHomeHeader();
    showToast("Signed in");
    goTo("home");
  }catch(err){
    showToast(err.message || "Login failed");
  }finally{
    setButtonBusy(btn, false);
  }
}

function logout(){
  clearSession();
  document.getElementById("login-pass").value = "";
  goTo("login");
}

async function loadAppData(){
  await Promise.allSettled([loadCatalogs(), loadBills()]);
}

async function loadCatalogs(){
  const optionalRoutes = [
    ["/people", "person"],
    ["/persons", "person"],
    ["/goods", "goods"],
    ["/types", "type_of_bill"],
    ["/type-of-bills", "type_of_bill"],
  ];

  for(const [route, key] of optionalRoutes){
    try{
      const data = await apiRequest(route);
      if(Array.isArray(data) && data.length){
        DB[key] = data.map(item => key === "person" ? normalizePerson(item) : item);
      }
    }catch{
      // These catalog routes are optional in the current backend.
    }
  }

  if(!DB.person.length) DB.person = [...CATALOG.people];
  if(!DB.goods.length) DB.goods = [...CATALOG.goods];
  if(!DB.type_of_bill.length) DB.type_of_bill = [...CATALOG.types];
}

async function loadBills(){
  showLoading("home-card-view", "Loading bills...");
  const bills = await apiRequest("/bills");
  DB.bill = bills.map(normalizeBillListItem);
  DB.bill_detail = [];
  DB.share = [];
  billDetailCache.clear();

  const detailPromises = DB.bill.map(bill => apiRequest(`/bills/${bill.id}`).then(detail => normalizeBillDetail(detail)).catch(() => null));
  const details = await Promise.all(detailPromises);
  details.filter(Boolean).forEach(storeBillDetail);
}

function normalizePerson(person){
  return {
    id: Number(person.id),
    name: person.name || `User ${person.id}`,
    aka: person.aka || person.AKA || "",
    user_name: person.user_name || "",
    profile_pic: person.profile_pic || null,
    qr_code: person.qr_code || null,
    is_admin: Boolean(person.is_admin),
    is_active: person.is_active !== false,
  };
}

function normalizeBillListItem(item){
  return {
    id: Number(item.bill_id || item.id),
    type_id: item.type_id ?? null,
    total_value: Number(item.total_value || 0),
    paid_stt: item.paid_status ? 1 : 0,
    paid_status: Boolean(item.paid_status),
    keeper_id: item.keeper_id ?? null,
    keeper_name: item.keeper_name || null,
    date: item.bill_date || item.date,
    bill_date: item.bill_date || item.date,
    sharer_count: Number(item.sharer_count || 0),
  };
}

function normalizeBillDetail(detail){
  return {
    bill: {
      id: Number(detail.bill_id),
      type_id: detail.type_id ?? null,
      total_value: Number(detail.total_value || 0),
      paid_stt: detail.paid_status ? 1 : 0,
      paid_status: Boolean(detail.paid_status),
      keeper_id: detail.keeper_id ?? null,
      keeper_name: detail.keeper_name || null,
      date: detail.bill_date,
      bill_date: detail.bill_date,
      bookkeeper_auto: Boolean(detail.bookkeeper_auto),
      sharer_count: detail.shares?.length || 0,
    },
    details: (detail.items || []).map(item => ({
      id: Number(item.id),
      bill_id: Number(detail.bill_id),
      goods_id: item.goods_id ?? null,
      goods_name: item.goods_name,
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unit_price || 0),
      line_total: Number(item.line_total || 0),
      cost: Number(item.line_total || 0),
      buyer_id: Number(item.buyer_id),
      buyer_name: item.buyer_name || null,
      reason: item.reason || null,
    })),
    shares: (detail.shares || []).map(share => ({
      id: Number(share.id),
      bill_id: Number(detail.bill_id),
      payer_id: Number(share.person_id),
      person_id: Number(share.person_id),
      person_name: share.person_name || null,
      share_value: Number(share.share_value || 0),
      cost: Number(share.cost || 0),
      net_value: Number(share.net_value || 0),
      status: share.status,
      paid_stt: share.paid_status ? 1 : 0,
      paid_status: Boolean(share.paid_status),
    })),
  };
}

function storeBillDetail(detail){
  billDetailCache.set(detail.bill.id, detail);

  const billIndex = DB.bill.findIndex(bill => bill.id === detail.bill.id);
  if(billIndex >= 0) DB.bill[billIndex] = { ...DB.bill[billIndex], ...detail.bill };
  else DB.bill.push(detail.bill);

  DB.bill_detail = DB.bill_detail.filter(item => item.bill_id !== detail.bill.id).concat(detail.details);
  DB.share = DB.share.filter(item => item.bill_id !== detail.bill.id).concat(detail.shares);

  if(detail.bill.keeper_id && detail.bill.keeper_name){
    upsertPerson({ id: detail.bill.keeper_id, name: detail.bill.keeper_name });
  }
  detail.details.forEach(item => {
    if(item.buyer_id && item.buyer_name) upsertPerson({ id: item.buyer_id, name: item.buyer_name });
  });
  detail.shares.forEach(share => {
    if(share.payer_id && share.person_name) upsertPerson({ id: share.payer_id, name: share.person_name });
  });
}

function upsertPerson(raw){
  const existing = DB.person.find(item => Number(item.id) === Number(raw.id));
  const person = normalizePerson({
    ...existing,
    ...raw,
    id: Number(raw.id),
    profile_pic: raw.profile_pic !== undefined ? raw.profile_pic : existing?.profile_pic,
    qr_code: raw.qr_code !== undefined ? raw.qr_code : existing?.qr_code,
  });
  const idx = DB.person.findIndex(item => item.id === person.id);
  if(idx >= 0) DB.person[idx] = { ...DB.person[idx], ...person };
  else DB.person.push(person);
}

async function ensureBillDetail(billId){
  if(billDetailCache.has(billId)) return billDetailCache.get(billId);
  const detail = normalizeBillDetail(await apiRequest(`/bills/${billId}`));
  storeBillDetail(detail);
  return detail;
}

function goTo(view){
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(`view-${view}`).classList.add("active");
  closeMenu();

  if(view === "home") renderHome();
  if(view === "update") renderUpdateTable();
  if(view === "user") renderUserList();
  if(view === "contract") renderChat();
  if(view === "setting") renderSetting();
  if(view === "create"){
    createGoodsRows = [{ goods_id: "", name: "", quantity: 1, unit_price: "", buyer_id: "" }];
    renderCreateForm();
  }
}

function openMenu(){ document.getElementById("menu-overlay").classList.remove("hidden"); document.getElementById("menu-drawer").classList.add("open"); }
function closeMenu(){ document.getElementById("menu-overlay").classList.add("hidden"); document.getElementById("menu-drawer").classList.remove("open"); }

function toggleView(){
  isTableView = !isTableView;
  document.getElementById("home-card-view").classList.toggle("hidden", isTableView);
  document.getElementById("home-table-view").classList.toggle("hidden", !isTableView);
  renderHome();
}

function toggleMoreFilter(){ document.getElementById("more-filter").classList.toggle("hidden"); }
function setFilter(filter){
  currentFilter = filter;
  document.querySelectorAll("#more-filter .chip").forEach(chip => chip.classList.toggle("active", chip.dataset.f === filter));
  renderHome();
}

function toggleCalendar(){
  const existing = document.getElementById("calendar-popover");
  if(existing){ existing.remove(); return; }
  const pop = document.createElement("div");
  pop.id = "calendar-popover";
  pop.className = "calendar-popover";
  const dates = [...new Set(DB.bill.map(bill => bill.date))].filter(Boolean).sort().reverse();
  pop.innerHTML = `<div class="cal-title">Jump to date</div>`
    + dates.map(date => `<button class="cal-date-btn" onclick="jumpToDate('${date}')">${formatDateLong(date)}</button>`).join("")
    + `<button class="cal-date-btn cal-clear" onclick="jumpToDate('')">Show all</button>`;
  document.getElementById("view-home").appendChild(pop);
}

function jumpToDate(date){
  document.getElementById("search-input").value = date;
  document.getElementById("calendar-popover")?.remove();
  renderHome();
}

function getFilteredBills(){
  const query = (document.getElementById("search-input")?.value || "").toLowerCase();
  return DB.bill.filter(bill => {
    const keeper = personById(bill.keeper_id);
    const keeperName = bill.keeper_name || keeper?.name || "";
    const matchesSearch = !query
      || String(bill.date || "").includes(query)
      || keeperName.toLowerCase().includes(query)
      || formatDateLong(bill.date).toLowerCase().includes(query);
    if(!matchesSearch) return false;

    const fullyPaid = billFullyPaid(bill.id);
    const myShare = sharesForBill(bill.id).find(share => share.payer_id === CURRENT_USER_ID);
    if(currentFilter === "paid") return myShare ? myShare.paid_stt === 1 : fullyPaid;
    if(currentFilter === "unpaid") return myShare ? myShare.paid_stt === 0 : !fullyPaid;
    if(currentFilter === "mine") return bill.keeper_id === CURRENT_USER_ID;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderHome(){
  if(!CURRENT_USER_ID) return;
  updateHomeHeader();
  const bills = getFilteredBills();

  document.getElementById("home-card-view").innerHTML = bills.map(bill => {
    const keeper = personById(bill.keeper_id);
    const shares = sharesForBill(bill.id);
    const myShare = shares.find(share => share.payer_id === CURRENT_USER_ID);
    const unpaid = Boolean(myShare && myShare.paid_stt === 0 && myShare.net_value < 0);
    const keeperName = bill.keeper_name || keeper?.name || "Unknown";

    return `<div class="bill-card">
      <div class="bill-card-head">
        <span class="date">${formatDateLong(bill.date)}</span>
        <button class="detail-btn" onclick="openDetail(${bill.id})" title="Bill detail">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="bill-row"><span class="label">Book Keeper:</span><span class="keeper-pill">${escapeHtml(keeperName)}</span></div>
      <div class="bill-row"><span class="label">Fund:</span><span>${formatKip(bill.total_value)} Kip</span></div>
      <div class="bill-row"><span class="label">Sharer:</span><span>${shares.length || bill.sharer_count || 0} Sharer</span></div>
      <div class="bill-foot">
        <div class="status-pill ${unpaid ? "unpaid" : "paid"}">
          <span class="stt">${unpaid ? "Unpaid" : "Paid"}</span>
          <span class="amt">${formatKip(Math.abs(myShare?.net_value || 0))} Kip</span>
        </div>
        <button class="pay-btn ${unpaid ? "unpaid" : "paid"}" onclick="${unpaid ? `goPay(${bill.id})` : `goSlip(${bill.id})`}">${unpaid ? "Pay" : "Paid"}</button>
      </div>
    </div>`;
  }).join("") || showEmpty("No bills found");

  document.getElementById("home-table-view").innerHTML = `<table>
    <thead><tr><th>Date</th><th>Value (Kip)</th><th>Status</th></tr></thead>
    <tbody>${bills.map(bill => {
      const myShare = sharesForBill(bill.id).find(share => share.payer_id === CURRENT_USER_ID);
      const unpaid = Boolean(myShare && myShare.paid_stt === 0 && myShare.net_value < 0);
      return `<tr>
        <td onclick="openDetail(${bill.id})">${formatDateShort(bill.date)}</td>
        <td onclick="openDetail(${bill.id})">${formatKip(Math.abs(myShare?.net_value || 0))}</td>
        <td onclick="${unpaid ? `goPay(${bill.id})` : `goSlip(${bill.id})`}"><span class="status-tag ${unpaid ? "unpaid" : "paid"}">${unpaid ? "Unpaid" : "PAID"}</span></td>
      </tr>`;
    }).join("")}</tbody>
  </table>`;
}

async function openDetail(billId){
  currentDetailBillId = billId;
  showLoading("detail-body", "Loading bill detail...");
  goTo("detail");

  try{
    const detail = await ensureBillDetail(billId);
    const bill = detail.bill;
    const shares = sharesForBill(billId);
    const items = detailsForBill(billId);
    const myShare = shares.find(share => share.payer_id === CURRENT_USER_ID);
    const unpaid = Boolean(myShare && myShare.paid_stt === 0 && myShare.net_value < 0);
    const shareValue = shares[0]?.share_value || 0;

    document.getElementById("detail-body").innerHTML = `
      <div class="detail-card">
        <div class="detail-date">${formatDateLong(bill.date)}</div>
        <div class="detail-keeper">Book Keeper: <b>${escapeHtml(bill.keeper_name || personById(bill.keeper_id)?.name || "Unknown")}</b></div>
        <div class="detail-sharers">Sharer: ${shares.map(share => escapeHtml(share.person?.name || share.person_name || "Unknown")).join(", ")}</div>
        <table class="goods-table">
          <thead><tr><th>Goods</th><th>Value</th><th>Buyer</th></tr></thead>
          <tbody>${items.map(item => `<tr><td>${escapeHtml(item.goods_name || "-")}</td><td>${formatKip(item.line_total || item.cost)}</td><td>${escapeHtml(item.buyer?.name || item.buyer_name || "-")}</td></tr>`).join("")}</tbody>
        </table>
        <div class="goods-total"><span>Total</span><span>${formatKip(bill.total_value)} Kip</span></div>
      </div>
      <div class="split-grid">
        <div class="sharer-status-list">
          <div class="title">All Sharers</div>
          ${shares.map(share => {
            const netAbs = formatKip(Math.abs(share.net_value || 0));
            const statusText = share.paid_stt ? "Paid" : "Unpaid";
            return `<div class="sharer-status-row enhanced">
              <div class="sharer-main">
                <span class="sharer-name">${escapeHtml(share.person?.name || share.person_name || "Unknown")}</span>
                <span class="sharer-net ${share.net_value < 0 ? "owes" : "receives"}">${share.net_value < 0 ? "Pay" : "Net"}: ${netAbs} Kip</span>
              </div>
              <div class="sharer-actions">
                <span class="tag ${share.paid_stt ? "paid" : "unpaid"}">${statusText}</span>
                <button class="info-dot" onclick="showShareInfo(${billId}, ${share.id})" title="Payment info">i</button>
              </div>
            </div>`;
          }).join("")}
        </div>
        <div class="my-summary">
          <div class="row"><span>Your Cost</span><b>${formatKip(myShare?.cost || 0)}</b></div>
          <div class="row"><span>Share/Unit</span><b>${formatKip(shareValue)}</b></div>
          <div class="row"><span>Status</span><span class="status-line ${unpaid ? "unpaid" : "paid"}">${unpaid ? "Unpaid" : "Paid"}</span></div>
          <div class="my-pay-box">
            <div class="lbl">Your payment value</div>
            <div class="amt">${formatKip(Math.abs(myShare?.net_value || 0))} Kip</div>
          </div>
        </div>
      </div>
      <button class="detail-cta ${unpaid ? "unpaid" : "paid"}" onclick="${unpaid ? `goPay(${billId})` : `goSlip(${billId})`}">
        ${unpaid ? "Pay now ->" : "View your slip"}
      </button>`;
  }catch(err){
    document.getElementById("detail-body").innerHTML = showEmpty(err.message || "Could not load bill detail");
  }
}

async function showShareInfo(billId, shareId){
  await ensureBillDetail(billId);
  const share = sharesForBill(billId).find(item => Number(item.id) === Number(shareId));
  if(!share) return;

  let content = "";
  if(share.paid_stt){
    try{
      const slip = await apiRequest(`/slips/shares/${share.id}`);
      const slipUrl = slip?.storage_url ? normalizeApiPath(slip.storage_url) : "";
      content = slipUrl
        ? (String(slip.file_type || "").includes("pdf")
          ? `<a class="slip-link" href="${slipUrl}" target="_blank" rel="noreferrer">Open PDF slip</a>`
          : `<img class="share-popup-slip" src="${slipUrl}" alt="Payment slip">`)
        : `<div class="share-popup-number">Paid</div>`;
    }catch(err){
      content = `<div class="share-popup-number">Paid<br><small>No slip found</small></div>`;
    }
  }else{
    content = `<div class="share-popup-number"><small>Need to pay</small>${formatKip(Math.abs(share.net_value || 0))} Kip</div>`;
  }

  const overlay = document.createElement("div");
  overlay.className = `share-popup-overlay ${share.paid_stt ? "paid" : "unpaid"}`;
  overlay.onclick = () => overlay.remove();
  overlay.innerHTML = `<div class="share-popup-card" onclick="event.stopPropagation()">${content}</div>`;
  document.querySelector(".phone").appendChild(overlay);
}

async function goPay(billId){
  currentDetailBillId = billId;
  showLoading("pay-body", "Preparing payment...");
  goTo("pay");

  try{
    await ensureBillDetail(billId);
    const bill = DB.bill.find(item => item.id === billId);
    const keeper = personById(bill.keeper_id);
    const myShare = sharesForBill(billId).find(share => share.payer_id === CURRENT_USER_ID);
    if(!myShare) throw new Error("No share found for this user");

    const hasQrImage = Boolean(keeper?.qr_code);
    const qrImage = hasQrImage ? `<img class="qr-img" src="${normalizeApiPath(keeper.qr_code)}" alt="QR code">` : fallbackQrSvg();
    document.getElementById("pay-body").innerHTML = `
      <div class="qr-box ${hasQrImage ? "qr-card-box" : ""}">${qrImage}</div>
      <div>
        <div class="pay-amount">${formatKip(Math.abs(myShare.net_value || 0))} Kip</div>
        <div class="pay-to">Scan to pay ${escapeHtml(keeper?.name || bill.keeper_name || "book keeper")}</div>
      </div>
      <label class="upload-zone">
        <input type="file" accept="image/png,image/jpg,image/jpeg" onchange="handleSlipUpload(${billId}, this.files[0])">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Upload slip to confirm payment
      </label>`;
  }catch(err){
    document.getElementById("pay-body").innerHTML = showEmpty(err.message || "Could not prepare payment");
  }
}

async function handleSlipUpload(billId, file){
  if(!file) return;
  const maxSlipSize = 50 * 1024 * 1024;
  const allowedSlipTypes = ["image/png", "image/jpg", "image/jpeg"];
  if(file.size > maxSlipSize){
    showToast("Slip file must be 50MB or smaller");
    return;
  }
  if(!allowedSlipTypes.includes(file.type)){
    showToast("Please upload PNG, JPG, or JPEG slip image");
    return;
  }
  const myShare = sharesForBill(billId).find(share => share.payer_id === CURRENT_USER_ID);
  if(!myShare){
    showToast("No share found for this bill");
    return;
  }

  const form = new FormData();
  form.append("file", file);

  try{
    showToast("Uploading slip...");
    const response = await apiRequest(`/slips/shares/${myShare.id}`, {
      method: "POST",
      body: form,
    });
    DB.slip = DB.slip.filter(slip => slip.share_id !== myShare.id).concat(response);
    await refreshBill(billId);
    showToast("Slip uploaded. Payment confirmed.");
    setTimeout(() => openDetail(billId), 700);
  }catch(err){
    showToast(err.message || "Slip upload failed");
  }
}

async function goSlip(billId){
  currentDetailBillId = billId;
  showLoading("slip-body", "Loading slip...");
  goTo("slip");

  try{
    await ensureBillDetail(billId);
    const myShare = sharesForBill(billId).find(share => share.payer_id === CURRENT_USER_ID);
    if(!myShare) throw new Error("No share found for this user");

    let slip = DB.slip.find(item => item.share_id === myShare.id);
    if(!slip){
      try{
        slip = await apiRequest(`/slips/shares/${myShare.id}`);
        DB.slip.push(slip);
      }catch(err){
        if(myShare.paid_stt){
          slip = null;
        }else{
          throw err;
        }
      }
    }

    const slipUrl = slip?.storage_url ? normalizeApiPath(slip.storage_url) : "";
    const preview = slipUrl
      ? (String(slip.file_type || "").includes("pdf")
        ? `<a class="slip-link" href="${slipUrl}" target="_blank" rel="noreferrer">Open PDF slip</a>`
        : `<img class="slip-preview" src="${slipUrl}" alt="Payment slip">`)
      : `<div class="slip-placeholder">Payment is confirmed. No slip file was returned.</div>`;

    document.getElementById("slip-body").innerHTML = `
      <span class="confirm-badge">Payment confirmed</span>
      <div style="text-align:center;color:var(--ink-soft);font-size:13px">Your payment slip</div>
      ${preview}`;
  }catch(err){
    document.getElementById("slip-body").innerHTML = showEmpty(err.message || "Could not load slip");
  }
}

async function refreshBill(billId){
  const detail = normalizeBillDetail(await apiRequest(`/bills/${billId}`));
  storeBillDetail(detail);
  renderHome();
}

function dayOptions(selected){ return Array.from({ length: 31 }, (_, i) => i + 1).map(day => `<option value="${day}" ${day === selected ? "selected" : ""}>${day}</option>`).join(""); }
function monthOptions(selected){
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((month, i) => `<option value="${i}" ${i === selected ? "selected" : ""}>${month}</option>`).join("");
}
function yearOptions(selected){ return Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => `<option value="${year}" ${year === selected ? "selected" : ""}>${year}</option>`).join(""); }

function dateRowHTML(id, day, month, year, hint){
  return `<div class="date-row-wrap">
    <div class="date-row-label">
      <span>${hint}</span>
      <button onclick="openDatePicker('${id}')" title="Pick date">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>
    <input type="date" id="${id}-native" style="display:none" onchange="syncDatePicker('${id}')">
    <div class="date-row-inputs">
      <select id="${id}-day" title="Day">${dayOptions(day)}</select>
      <select id="${id}-month" title="Month">${monthOptions(month)}</select>
      <select id="${id}-year" title="Year">${yearOptions(year)}</select>
    </div>
  </div>`;
}

function openDatePicker(id){
  const input = document.getElementById(`${id}-native`);
  input.style.display = "block";
  input.showPicker ? input.showPicker() : input.click();
}

function syncDatePicker(id){
  const value = document.getElementById(`${id}-native`).value;
  if(!value) return;
  const date = new Date(`${value}T00:00:00`);
  document.getElementById(`${id}-day`).value = date.getDate();
  document.getElementById(`${id}-month`).value = date.getMonth();
  document.getElementById(`${id}-year`).value = date.getFullYear();
  document.getElementById(`${id}-native`).style.display = "none";
}

function getDateFromRow(prefix){
  const day = String(document.getElementById(`${prefix}-day`).value).padStart(2, "0");
  const month = String(Number(document.getElementById(`${prefix}-month`).value) + 1).padStart(2, "0");
  const year = document.getElementById(`${prefix}-year`).value;
  return `${year}-${month}-${day}`;
}

function renderCreateForm(){
  const now = new Date();
  document.getElementById("create-form-body").innerHTML =
    dateRowHTML("cf", now.getDate(), now.getMonth(), now.getFullYear(), "Date")
    + `<div class="form-group">
        <label class="field-label">Type of Bill</label>
        <select class="form-select" id="cf-type" onchange="renderGoodsRows('create')">
          <option value="">Choose type</option>
          ${DB.type_of_bill.map(type => `<option value="${type.id}">${formatTypeName(type.type_name)}</option>`).join("")}
        </select>
      </div>
      <div id="cf-goods-wrap"></div>
      <div class="form-group">
        <label class="field-label">Select Sharers</label>
        <div class="select-user-card">
          ${DB.person.filter(person => person.is_active !== false).map(person => `
            <div class="user-check-row">
              <span>${escapeHtml(person.name)}${person.aka ? ` - ${escapeHtml(person.aka)}` : ""}</span>
              <input type="checkbox" class="cf-user-check" value="${person.id}" ${person.id === CURRENT_USER_ID ? "checked" : ""} onchange="updateKeeperOptions('create')">
            </div>`).join("")}
        </div>
      </div>
      <div class="form-group">
        <label class="field-label">Book Keeper</label>
        <div class="keeper-row">
          <select class="form-select" id="cf-keeper" disabled>
            <option>Auto - highest spender</option>
          </select>
          <label class="toggle" title="Toggle auto/manual">
            <input type="checkbox" id="cf-keeper-auto" checked onchange="toggleKeeperAuto('create')">
            <span class="slider"></span>
          </label>
        </div>
        <p class="auto-hint" id="cf-keeper-hint">ON = auto-selects highest spender | OFF = pick manually</p>
      </div>
      <button class="btn-submit" onclick="submitCreate()">Create Bill</button>`;
  renderGoodsRows("create");
}

function renderGoodsRows(mode){
  const prefix = mode === "create" ? "cf" : "ef";
  const rows = mode === "create" ? createGoodsRows : editGoodsRows;
  const wrap = document.getElementById(`${prefix}-goods-wrap`);
  if(!wrap) return;

  wrap.innerHTML = rows.map((row, index) => `
    <div class="goods-card">
      ${rows.length > 1 ? `<button class="remove-goods" onclick="removeGoodsRow('${mode}', ${index})">x</button>` : ""}
      <div class="goods-card-row">
        <select onchange="onGoodsSelect('${mode}', ${index}, this.value)" style="flex:1.4">
          <option value="">Select saved goods</option>
          ${DB.goods.map(goods => `<option value="${goods.id}" ${Number(row.goods_id) === Number(goods.id) ? "selected" : ""}>${escapeHtml(goods.name)}</option>`).join("")}
        </select>
        <input type="text" placeholder="Or custom goods" value="${escapeHtml(row.name || "")}" oninput="updateGoodsField('${mode}', ${index}, 'name', this.value)" style="flex:1.3">
      </div>
      <div class="goods-card-row">
        <input type="number" min="1" step="1" placeholder="Qty" value="${row.quantity || 1}" oninput="updateGoodsField('${mode}', ${index}, 'quantity', this.value)">
        <input type="number" min="0" step="1000" placeholder="Unit price" value="${row.unit_price || ""}" oninput="updateGoodsField('${mode}', ${index}, 'unit_price', this.value)">
      </div>
      <div class="form-group" style="margin-top:0">
        <select onchange="updateGoodsField('${mode}', ${index}, 'buyer_id', this.value)" style="width:100%;padding:9px 10px;border-radius:var(--radius-sm);border:1.5px solid var(--line);font-family:var(--font-body);font-size:13px;outline:none;appearance:none">
          <option value="">Buyer - who paid?</option>
          ${DB.person.filter(person => person.is_active !== false).map(person => `<option value="${person.id}" ${Number(row.buyer_id) === Number(person.id) ? "selected" : ""}>${escapeHtml(person.name)}</option>`).join("")}
        </select>
      </div>
    </div>`).join("")
    + `<button class="add-goods-btn" onclick="addGoodsRow('${mode}')">+ Add another item</button>`;
}

function onGoodsSelect(mode, index, goodsId){
  const rows = mode === "create" ? createGoodsRows : editGoodsRows;
  const goods = DB.goods.find(item => Number(item.id) === Number(goodsId));
  rows[index].goods_id = goodsId || "";
  rows[index].name = goods?.name || rows[index].name || "";
  rows[index].unit_price = goods?.price || rows[index].unit_price || "";
  renderGoodsRows(mode);
}

function updateGoodsField(mode, index, field, value){
  const rows = mode === "create" ? createGoodsRows : editGoodsRows;
  rows[index][field] = value;
  if(field === "buyer_id" || field === "unit_price") updateKeeperOptions(mode);
}

function addGoodsRow(mode){
  (mode === "create" ? createGoodsRows : editGoodsRows).push({ goods_id: "", name: "", quantity: 1, unit_price: "", buyer_id: "" });
  renderGoodsRows(mode);
}

function removeGoodsRow(mode, index){
  (mode === "create" ? createGoodsRows : editGoodsRows).splice(index, 1);
  renderGoodsRows(mode);
}

function updateKeeperOptions(mode){
  const prefix = mode === "create" ? "cf" : "ef";
  const auto = document.getElementById(`${prefix}-keeper-auto`)?.checked;
  if(auto) return;
  const selectedIds = Array.from(document.querySelectorAll(`.${prefix}-user-check:checked`)).map(input => Number(input.value));
  const keeper = document.getElementById(`${prefix}-keeper`);
  if(!keeper) return;
  keeper.innerHTML = selectedIds.length
    ? selectedIds.map(id => `<option value="${id}">${escapeHtml(personById(id)?.name || `User ${id}`)}</option>`).join("")
    : `<option>Select sharers first</option>`;
}

function toggleKeeperAuto(mode){
  const prefix = mode === "create" ? "cf" : "ef";
  const auto = document.getElementById(`${prefix}-keeper-auto`).checked;
  const keeper = document.getElementById(`${prefix}-keeper`);
  const hint = document.getElementById(`${prefix}-keeper-hint`);
  keeper.disabled = auto;
  if(auto) keeper.innerHTML = `<option>Auto - highest spender</option>`;
  else updateKeeperOptions(mode);
  hint.textContent = auto ? "ON = auto-selects highest spender | OFF = pick manually" : "OFF = manual mode - pick book keeper from the list";
}

async function submitCreate(){
  const typeId = document.getElementById("cf-type").value || null;
  const sharerIds = Array.from(document.querySelectorAll(".cf-user-check:checked")).map(input => Number(input.value));
  const items = createGoodsRows.map(row => ({
    goods_id: row.goods_id ? Number(row.goods_id) : null,
    goods_name: (row.name || DB.goods.find(goods => Number(goods.id) === Number(row.goods_id))?.name || "").trim(),
    quantity: Number(row.quantity || 1),
    unit_price: Number(row.unit_price || 0),
    buyer_id: Number(row.buyer_id),
    reason: null,
  }));

  if(!typeId){ showToast("Please pick a type of bill"); return; }
  if(!sharerIds.length){ showToast("Select at least one sharer"); return; }
  if(items.some(item => !item.goods_name || !item.buyer_id || item.quantity <= 0 || item.unit_price < 0)){
    showToast("Complete all item names, prices, quantities, and buyers");
    return;
  }

  const buyerIds = items.map(item => item.buyer_id);
  const missingBuyers = buyerIds.filter(id => !sharerIds.includes(id));
  if(missingBuyers.length){
    showToast("Every buyer must also be selected as a sharer");
    return;
  }

  const auto = document.getElementById("cf-keeper-auto").checked;
  const payload = {
    type_id: Number(typeId),
    bill_date: getDateFromRow("cf"),
    auto_bookkeeper: auto,
    manual_keeper_id: auto ? null : Number(document.getElementById("cf-keeper").value || 0) || null,
    sharer_ids: sharerIds,
    items,
  };

  const btn = document.querySelector("#view-create .btn-submit");
  setButtonBusy(btn, true, "Creating...");
  try{
    const response = await apiRequest("/bills", { method: "POST", body: payload });
    showToast("Bill created");
    await refreshBill(response.bill_id);
    setTimeout(() => openDetail(response.bill_id), 500);
  }catch(err){
    showToast(err.message || "Failed to create bill");
  }finally{
    setButtonBusy(btn, false);
  }
}

function toggleUpdateMore(){ document.getElementById("update-more-filter").classList.toggle("hidden"); }
function setUpdateFilter(filter){
  updateFilter = filter;
  document.querySelectorAll("#update-more-filter .chip").forEach(chip => chip.classList.toggle("active", chip.dataset.uf === filter));
  renderUpdateTable();
}

function toggleUpdateCalendar(){
  const existing = document.getElementById("update-cal-popover");
  if(existing){ existing.remove(); return; }
  const pop = document.createElement("div");
  pop.id = "update-cal-popover";
  pop.className = "calendar-popover";
  pop.style.top = "110px";
  const dates = [...new Set(DB.bill.map(bill => bill.date))].filter(Boolean).sort().reverse();
  pop.innerHTML = `<div class="cal-title">Filter by date</div>`
    + dates.map(date => `<button class="cal-date-btn" onclick="jumpToUpdateDate('${date}')">${formatDateLong(date)}</button>`).join("")
    + `<button class="cal-date-btn cal-clear" onclick="jumpToUpdateDate('')">Show all</button>`;
  document.getElementById("view-update").appendChild(pop);
}

function jumpToUpdateDate(date){
  document.getElementById("update-search").value = date;
  document.getElementById("update-cal-popover")?.remove();
  renderUpdateTable();
}

function renderUpdateTable(){
  const query = (document.getElementById("update-search")?.value || "").toLowerCase();
  const typeFilter = document.getElementById("update-type-filter")?.value || "";
  const bills = DB.bill.filter(bill => {
    const keeperName = bill.keeper_name || personById(bill.keeper_id)?.name || "";
    const matchesSearch = !query || String(bill.date).includes(query) || keeperName.toLowerCase().includes(query) || formatDateLong(bill.date).toLowerCase().includes(query);
    const matchesType = !typeFilter || billTypeName(bill.type_id) === typeFilter;
    const fullyPaid = billFullyPaid(bill.id);
    if(updateFilter === "paid" && !fullyPaid) return false;
    if(updateFilter === "unpaid" && fullyPaid) return false;
    if(updateFilter === "mine" && bill.keeper_id !== CURRENT_USER_ID) return false;
    return matchesSearch && matchesType;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  document.getElementById("update-table-wrap").innerHTML = `<table>
    <thead><tr><th>Date</th><th>Value (Kip)</th><th>Status</th></tr></thead>
    <tbody>${bills.map(bill => {
      const fullyPaid = billFullyPaid(bill.id);
      return `<tr onclick="openEdit(${bill.id})" style="cursor:pointer">
        <td>${formatDateShort(bill.date)}</td>
        <td>${formatKip(bill.total_value)}</td>
        <td><span class="status-tag ${fullyPaid ? "paid" : "unpaid"}">${fullyPaid ? "PAID" : "Unpaid"}</span></td>
      </tr>`;
    }).join("")}</tbody>
  </table>`;
}

async function openEdit(billId){
  editingBillId = billId;
  showLoading("edit-form-body", "Loading bill for editing...");
  goTo("edit");

  try{
    const detail = await ensureBillDetail(billId);
    const bill = detail.bill;
    const shares = sharesForBill(billId);
    const items = detailsForBill(billId);
    editGoodsRows = items.map(item => ({
      goods_id: item.goods_id || "",
      name: item.goods_name || "",
      quantity: item.quantity || 1,
      unit_price: item.unit_price || item.line_total || "",
      buyer_id: item.buyer_id || "",
    }));
    if(!editGoodsRows.length){
      editGoodsRows = [{ goods_id: "", name: "", quantity: 1, unit_price: "", buyer_id: "" }];
    }

    const d = new Date(`${bill.date}T00:00:00`);
    document.getElementById("edit-form-body").innerHTML =
      `<div class="prefill-card">
        <b>${formatKip(bill.total_value)} Kip</b>
        ${shares.map(share => escapeHtml(share.person?.name || share.person_name || "Unknown")).join(", ")}
      </div>`
      + dateRowHTML("ef", d.getDate(), d.getMonth(), d.getFullYear(), "Date")
      + `<div class="form-group">
          <label class="field-label">Type of Bill</label>
          <select class="form-select" id="ef-type" onchange="renderGoodsRows('edit')">
            <option value="">Choose type</option>
            ${DB.type_of_bill.map(type => `<option value="${type.id}" ${Number(type.id) === Number(bill.type_id) ? "selected" : ""}>${formatTypeName(type.type_name)}</option>`).join("")}
          </select>
        </div>
        <div id="ef-goods-wrap"></div>
        <div class="form-group">
          <label class="field-label">Select Sharers</label>
          <div class="select-user-card">
            ${DB.person.filter(person => person.is_active !== false).map(person => `
              <div class="user-check-row">
                <span>${escapeHtml(person.name)}${person.aka ? ` - ${escapeHtml(person.aka)}` : ""}</span>
                <input type="checkbox" class="ef-user-check" value="${person.id}" ${shares.some(share => Number(share.payer_id) === Number(person.id)) ? "checked" : ""} onchange="updateKeeperOptions('edit')">
              </div>`).join("")}
          </div>
        </div>
        <div class="form-group">
          <label class="field-label">Book Keeper</label>
          <div class="keeper-row">
            <select class="form-select" id="ef-keeper" ${bill.bookkeeper_auto ? "disabled" : ""}></select>
            <label class="toggle" title="Toggle auto/manual">
              <input type="checkbox" id="ef-keeper-auto" ${bill.bookkeeper_auto ? "checked" : ""} onchange="toggleKeeperAuto('edit')">
              <span class="slider"></span>
            </label>
          </div>
          <p class="auto-hint" id="ef-keeper-hint">${bill.bookkeeper_auto ? "ON = auto-selects highest spender | OFF = pick manually" : "OFF = manual mode - pick book keeper from the list"}</p>
        </div>
        <button class="btn-submit" onclick="submitEdit()">Update Bill</button>`;

    renderGoodsRows("edit");
    if(bill.bookkeeper_auto){
      document.getElementById("ef-keeper").innerHTML = `<option>Auto - highest spender</option>`;
    }else{
      updateKeeperOptions("edit");
      document.getElementById("ef-keeper").value = bill.keeper_id || "";
    }
  }catch(err){
    document.getElementById("edit-form-body").innerHTML = showEmpty(err.message || "Could not load bill for editing");
  }
}

async function submitEdit(){
  if(!editingBillId){
    showToast("No bill selected");
    return;
  }

  const typeId = document.getElementById("ef-type").value || null;
  const sharerIds = Array.from(document.querySelectorAll(".ef-user-check:checked")).map(input => Number(input.value));
  const items = editGoodsRows.map(row => ({
    goods_id: row.goods_id ? Number(row.goods_id) : null,
    goods_name: (row.name || DB.goods.find(goods => Number(goods.id) === Number(row.goods_id))?.name || "").trim(),
    quantity: Number(row.quantity || 1),
    unit_price: Number(row.unit_price || 0),
    buyer_id: Number(row.buyer_id),
    reason: null,
  }));

  if(!typeId){ showToast("Please pick a type of bill"); return; }
  if(!sharerIds.length){ showToast("Select at least one sharer"); return; }
  if(items.some(item => !item.goods_name || !item.buyer_id || item.quantity <= 0 || item.unit_price < 0)){
    showToast("Complete all item names, prices, quantities, and buyers");
    return;
  }

  const missingBuyers = items.map(item => item.buyer_id).filter(id => !sharerIds.includes(id));
  if(missingBuyers.length){
    showToast("Every buyer must also be selected as a sharer");
    return;
  }

  const auto = document.getElementById("ef-keeper-auto").checked;
  const payload = {
    type_id: Number(typeId),
    bill_date: getDateFromRow("ef"),
    auto_bookkeeper: auto,
    manual_keeper_id: auto ? null : Number(document.getElementById("ef-keeper").value || 0) || null,
    sharer_ids: sharerIds,
    items,
  };

  const btn = document.querySelector("#view-edit .btn-submit");
  setButtonBusy(btn, true, "Updating...");
  try{
    const response = await apiRequest(`/bills/${editingBillId}`, { method: "PUT", body: payload });
    storeBillDetail(normalizeBillDetail(response));
    showToast("Bill updated");
    setTimeout(() => openDetail(editingBillId), 500);
  }catch(err){
    showToast(err.message || "Failed to update bill");
  }finally{
    setButtonBusy(btn, false);
  }
}

function renderUserList(){
  const people = [...DB.person].sort((a, b) => a.name.localeCompare(b.name));
  document.getElementById("user-list").innerHTML = people.map(person => {
    const unpaidShares = DB.share.filter(share => share.payer_id === person.id && share.paid_stt === 0 && share.net_value < 0);
    const total = unpaidShares.reduce((sum, share) => sum + Math.abs(share.net_value), 0);
    const initials = avatarInitials(person.name);
    const avatar = person.profile_pic ? `<img src="${normalizeApiPath(person.profile_pic)}" alt="${escapeHtml(person.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : "";
    return `<div class="user-row">
      <div class="user-avatar">${avatar}<span>${initials}</span></div>
      <div class="user-info">
        <div class="name">${escapeHtml(person.name)}</div>
        <div class="aka">${escapeHtml(person.aka || person.user_name || "")}</div>
      </div>
      <div class="user-owe ${unpaidShares.length ? "has" : "zero"}">
        ${unpaidShares.length
          ? `<div class="amt">${formatKip(total)} Kip</div><div class="lbl">${unpaidShares.length} unpaid bill${unpaidShares.length > 1 ? "s" : ""}</div>`
          : `<div class="amt">All clear</div>`}
      </div>
    </div>`;
  }).join("") || showEmpty("No users found");
}

function renderChat(){
  const box = document.getElementById("chat-messages");
  box.innerHTML = showEmpty("Loading messages...");
  loadContracts().catch(err => {
    box.innerHTML = showEmpty(err.message || "Could not load messages");
  });
}

async function loadContracts(){
  const messages = await apiRequest("/contracts");
  DB.contract = messages.map(message => ({
    id: Number(message.id),
    sender_id: Number(message.sender_id),
    sender_name: message.sender_name || null,
    message: message.message,
    is_read: Boolean(message.is_read),
    created_at: message.created_at,
  }));

  const box = document.getElementById("chat-messages");
  box.innerHTML = DB.contract.map(message => {
    const isMe = message.sender_id === CURRENT_USER_ID;
    const sender = personById(message.sender_id);
    const when = message.created_at ? new Date(message.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
    return `<div class="msg ${isMe ? "me" : "them"}">${escapeHtml(message.message)}<div class="meta">${isMe ? "You" : escapeHtml(message.sender_name || sender?.name || "Unknown")} ${when ? `- ${when}` : ""}</div></div>`;
  }).join("") || showEmpty("No messages yet");
  box.scrollTop = box.scrollHeight;
}

async function sendMessage(){
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if(!text) return;

  try{
    input.disabled = true;
    await apiRequest("/contracts", { method: "POST", body: { message: text } });
    input.value = "";
    await loadContracts();
  }catch(err){
    showToast(err.message || "Could not send message");
  }finally{
    input.disabled = false;
    input.focus();
  }
}

function renderSetting(){
  const user = CURRENT_USER || personById(CURRENT_USER_ID) || {};
  const profilePreview = user.profile_pic ? `<img class="setting-preview" src="${normalizeApiPath(user.profile_pic)}" alt="Profile photo">` : `<div class="setting-preview empty">${avatarInitials(user.name || "User")}</div>`;
  const qrPreview = user.qr_code ? `<img class="setting-preview qr" src="${normalizeApiPath(user.qr_code)}" alt="QR code">` : `<div class="setting-preview empty">QR</div>`;

  document.getElementById("setting-body").innerHTML = `
    <div class="setting-section-label">Account</div>
    <div class="setting-group">
      <div class="setting-row" onclick="editDisplayName()"><span>Display name - <b>${escapeHtml(user.name || "")}</b></span><span class="arrow">Edit</span></div>
      <div class="setting-row"><span>Login username</span><span class="arrow">${escapeHtml(user.user_name || "")}</span></div>
      <div class="setting-row" onclick="revealPin()"><span>4-digit PIN</span><span class="arrow" id="pin-mask">****</span></div>
      <div class="setting-row" onclick="changePin()"><span>Change PIN</span><span class="arrow">Edit</span></div>
      <div class="setting-row"><span>Role</span><span class="arrow">${user.is_admin ? "Admin" : "Member"}</span></div>
    </div>
    <div class="setting-section-label">Images</div>
    <div class="setting-group setting-upload-group">
      <div class="setting-upload-row">
        ${profilePreview}
        <label class="upload-mini-btn">
          <input type="file" accept="image/png,image/jpeg,image/webp" onchange="uploadAccountImage('profile', this)">
          Profile photo
        </label>
      </div>
      <div class="setting-upload-row">
        ${qrPreview}
        <label class="upload-mini-btn">
          <input type="file" accept="image/png,image/jpeg,image/webp" onchange="uploadAccountImage('qr', this)">
          My QR code
        </label>
      </div>
    </div>
    <div class="setting-section-label">Appearance</div>
    <div class="setting-group setting-api">
      <div class="setting-row"><span>Dark theme</span><label class="toggle"><input type="checkbox" ${currentTheme === "dark" ? "checked" : ""} onchange="toggleTheme(this)"><span class="slider"></span></label></div>
      <label class="field-label">Common color</label>
      <div class="color-row">
        ${["#0D6B8C", "#1F8A5B", "#7A4CC9", "#C94C4C", "#C9A84C"].map(color => `<button class="color-swatch" style="background:${color}" onclick="setAccentColor('${color}')" title="${color}"></button>`).join("")}
      </div>
    </div>
    <div class="setting-section-label">Backend</div>
    <div class="setting-group setting-api">
      <label class="field-label" for="setting-api-base">Railway API URL</label>
      <input id="setting-api-base" class="form-input" value="${escapeHtml(getApiBase())}" placeholder="https://your-backend.up.railway.app">
      <button class="btn-submit" onclick="saveApiBase()">Save API URL</button>
    </div>
    <div class="setting-section-label">App</div>
    <div class="setting-group">
      <div class="setting-row"><span>Currency</span><span class="arrow">Kip</span></div>
    </div>
    <div class="setting-section-label">Danger zone</div>
    <div class="setting-group">
      <div class="setting-row danger-text" onclick="logout()"><span>Log out</span><span class="arrow">></span></div>
    </div>`;
}

async function editDisplayName(){
  const current = CURRENT_USER?.name || "";
  const name = window.prompt("New display name", current);
  if(name === null) return;
  const clean = name.trim();
  if(!clean){ showToast("Name cannot be empty"); return; }

  try{
    const user = await apiRequest("/auth/me", { method: "PATCH", body: { name: clean } });
    saveSession(authToken(), user);
    showToast("Display name updated");
    renderSetting();
    renderUserList();
  }catch(err){
    showToast(err.message || "Could not update name");
  }
}

async function revealPin(){
  const pin = window.prompt("Type current 4-digit PIN to reveal");
  if(pin === null) return;
  try{
    const result = await apiRequest("/auth/me/pin/verify", { method: "POST", body: { password: pin } });
    document.getElementById("pin-mask").textContent = result.verified ? pin : "Wrong PIN";
    if(!result.verified) showToast("Current PIN is incorrect");
  }catch(err){
    showToast(err.message || "Could not verify PIN");
  }
}

async function changePin(){
  const current = window.prompt("Current 4-digit PIN");
  if(current === null) return;
  const next = window.prompt("New 4-digit PIN");
  if(next === null) return;
  if(!/^\d{4}$/.test(current) || !/^\d{4}$/.test(next)){
    showToast("PIN must be exactly 4 digits");
    return;
  }

  try{
    await apiRequest("/auth/me/pin", { method: "PATCH", body: { current_password: current, new_password: next } });
    showToast("PIN changed");
  }catch(err){
    showToast(err.message || "Could not change PIN");
  }
}

async function uploadAccountImage(kind, input){
  const file = input.files?.[0];
  if(!file) return;

  const form = new FormData();
  form.append("file", file);
  const route = kind === "qr" ? "/upload/qr" : "/upload/profile";

  try{
    showToast("Uploading image...");
    const response = await apiRequest(route, { method: "POST", body: form });
    if(kind === "qr") CURRENT_USER.qr_code = response.qr_code;
    else CURRENT_USER.profile_pic = response.profile_pic;
    saveSession(authToken(), CURRENT_USER);
    showToast("Image uploaded");
    renderSetting();
  }catch(err){
    showToast(err.message || "Image upload failed");
  }finally{
    input.value = "";
  }
}

function saveApiBase(){
  const value = document.getElementById("setting-api-base").value.trim().replace(/\/+$/, "");
  localStorage.setItem(CONFIG.apiBaseKey, value);
  showToast("API URL saved. Please log in again.");
  logout();
}

function openApiPrompt(){
  const current = getApiBase();
  const value = window.prompt("Railway backend URL", current || "https://your-backend.up.railway.app");
  if(value === null) return;
  localStorage.setItem(CONFIG.apiBaseKey, value.trim().replace(/\/+$/, ""));
  showToast("Backend URL saved");
}

function setAccentColor(color){
  currentAccent = color;
  localStorage.setItem("dude_accent", color);
  applyTheme(currentTheme, currentAccent);
}

function applyTheme(theme, accent){
  document.body.classList.toggle("theme-dark", theme === "dark");
  document.documentElement.style.setProperty("--sky-deep", accent);
  document.documentElement.style.setProperty("--sky-mid", accent);
}

function toggleTheme(el){
  currentTheme = el.checked ? "dark" : "light";
  localStorage.setItem("dude_theme", currentTheme);
  applyTheme(currentTheme, currentAccent);
}

function personById(id){ return DB.person.find(person => Number(person.id) === Number(id)); }
function billTypeName(id){ return (DB.type_of_bill.find(type => Number(type.id) === Number(id)) || {}).type_name || ""; }
function formatTypeName(name){ return String(name || "").charAt(0) + String(name || "").slice(1).toLowerCase(); }
function formatKip(value){ return Math.round(Number(value || 0)).toLocaleString("en-US").replace(/,/g, "."); }
function formatDateLong(dateString){
  if(!dateString) return "-";
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function formatDateShort(dateString){
  if(!dateString) return "-";
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function sharesForBill(id){ return DB.share.filter(share => Number(share.bill_id) === Number(id)).map(share => ({ ...share, person: personById(share.payer_id) })); }
function detailsForBill(id){ return DB.bill_detail.filter(detail => Number(detail.bill_id) === Number(id)).map(detail => ({ ...detail, buyer: personById(detail.buyer_id) })); }
function billFullyPaid(id){
  const shares = sharesForBill(id);
  if(!shares.length) return Boolean(DB.bill.find(bill => bill.id === id)?.paid_status);
  return shares.every(share => share.paid_stt === 1);
}
function avatarInitials(name){ return String(name || "?").split(" ").filter(Boolean).map(word => word[0]).join("").slice(0, 2).toUpperCase(); }

function fallbackQrSvg(){
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="white"/>
    <rect x="10" y="10" width="30" height="30" fill="none" stroke="#0F2333" stroke-width="4"/>
    <rect x="15" y="15" width="20" height="20" fill="#0F2333"/>
    <rect x="60" y="10" width="30" height="30" fill="none" stroke="#0F2333" stroke-width="4"/>
    <rect x="65" y="15" width="20" height="20" fill="#0F2333"/>
    <rect x="10" y="60" width="30" height="30" fill="none" stroke="#0F2333" stroke-width="4"/>
    <rect x="15" y="65" width="20" height="20" fill="#0F2333"/>
    <rect x="50" y="50" width="8" height="8" fill="#0F2333"/>
    <rect x="62" y="50" width="8" height="8" fill="#0F2333"/>
    <rect x="74" y="50" width="8" height="8" fill="#0F2333"/>
    <rect x="50" y="62" width="8" height="8" fill="#0F2333"/>
    <rect x="62" y="62" width="8" height="8" fill="#0F2333"/>
    <rect x="74" y="74" width="8" height="8" fill="#0F2333"/>
    <rect x="50" y="74" width="8" height="8" fill="#0F2333"/>
  </svg>`;
}

document.addEventListener("DOMContentLoaded", boot);

