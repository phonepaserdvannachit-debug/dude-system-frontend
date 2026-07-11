// ===================================================
// DUDE PAYMENT SYSTEM — Mock data (mirrors your SQL)
// ===================================================

const DB = {
  person: [
    { id:1, name:'Michael',    AKA:'Vice Head of Pussy',  user_name:'john',  password:'2580', profile_pic:null, qr_code:null, is_admin:1 },
    { id:2, name:'A TAR',      AKA:'Gen Z Manager',       user_name:'tar',   password:'1234', profile_pic:null, qr_code:null, is_admin:0 },
    { id:3, name:'Lobster',    AKA:'Speech Manager',      user_name:'koung', password:'1234', profile_pic:null, qr_code:null, is_admin:0 },
    { id:4, name:'SomLock',    AKA:'Pussy Teacher',       user_name:'sun',   password:'1234', profile_pic:null, qr_code:null, is_admin:0 },
    { id:5, name:'Aiy SomHee', AKA:'Head of Pussy',       user_name:'top',   password:'1234', profile_pic:null, qr_code:null, is_admin:0 },
    { id:6, name:'Daddy',      AKA:'Khayee Hee',          user_name:'dan',   password:'3421', profile_pic:null, qr_code:null, is_admin:0 },
    { id:7, name:'NowImhurt',  AKA:'Siengda Founder',     user_name:'ko',    password:'1234', profile_pic:null, qr_code:null, is_admin:0 },
  ],
  type_of_bill: [
    { id:1, type_name:'DRINK' }, { id:2, type_name:'FOOD' }, { id:3, type_name:'OTHERS' }
  ],
  goods: [
    { id:1,  name:'Oishi',        price:15000,  category_id:1 },
    { id:2,  name:'Yen Yen',      price:15000,  category_id:1 },
    { id:3,  name:'ChanKeow',     price:15000,  category_id:1 },
    { id:4,  name:'Namduem 5l',   price:25000,  category_id:1 },
    { id:5,  name:'Namduem 1.5l', price:10000,  category_id:1 },
    { id:6,  name:'Kratom',       price:100000, category_id:2 },
    { id:7,  name:'Nam ya',       price:75000,  category_id:2 },
    { id:8,  name:'Bai',          price:25000,  category_id:2 },
    { id:9,  name:'S5000',        price:5000,   category_id:3 },
    { id:10, name:'S8000',        price:8000,   category_id:3 },
    { id:11, name:'S10000',       price:10000,  category_id:3 },
    { id:12, name:'S12000',       price:12000,  category_id:3 },
    { id:13, name:'S15000',       price:15000,  category_id:3 },
    { id:23, name:'Sumlee',       price:20000,  category_id:5 },
    { id:24, name:'Ice3',         price:3000,   category_id:5 },
    { id:25, name:'Ice5',         price:5000,   category_id:5 },
    { id:26, name:'Ice10',        price:10000,  category_id:5 },
    { id:27, name:'Tizzu8',       price:8000,   category_id:5 },
    { id:28, name:'Tizzu10',      price:10000,  category_id:5 },
    { id:29, name:'Tizzu12',      price:12000,  category_id:5 },
  ],
  bill: [
    { id:1, type_id:1, total_value:140000, paid_stt:0, keeper_id:1, date:'2026-09-10' },
    { id:2, type_id:2, total_value:140000, paid_stt:0, keeper_id:5, date:'2026-09-02' },
    { id:3, type_id:1, total_value:125000, paid_stt:1, keeper_id:2, date:'2026-09-01' },
    { id:4, type_id:3, total_value:40000,  paid_stt:0, keeper_id:6, date:'2026-08-27' },
  ],
  bill_detail: [
    { id:1, bill_id:1, goods_id:6,  goods_name:'Kratom',     cost:100000, buyer_id:1 },
    { id:2, bill_id:1, goods_id:1,  goods_name:'Oishi',      cost:15000,  buyer_id:2 },
    { id:3, bill_id:1, goods_id:25, goods_name:'Ice5',       cost:5000,   buyer_id:2 },
    { id:4, bill_id:1, goods_id:4,  goods_name:'Namduem 5l', cost:20000,  buyer_id:6 },
  ],
  share: [
    // bill 1 — 140000 / 5 = 28000
    { id:1, bill_id:1, payer_id:1, share_value:28000, cost:100000, net_value:72000,  paid_stt:1 },
    { id:2, bill_id:1, payer_id:2, share_value:28000, cost:20000,  net_value:-8000,  paid_stt:0 },
    { id:3, bill_id:1, payer_id:5, share_value:28000, cost:0,      net_value:-28000, paid_stt:0 },
    { id:4, bill_id:1, payer_id:3, share_value:28000, cost:0,      net_value:-28000, paid_stt:1 },
    { id:5, bill_id:1, payer_id:6, share_value:28000, cost:20000,  net_value:-8000,  paid_stt:1 },
    // bill 2 — 140000 / 4 = 35000
    { id:6,  bill_id:2, payer_id:5, share_value:35000, cost:75000, net_value:40000,  paid_stt:1 },
    { id:7,  bill_id:2, payer_id:1, share_value:35000, cost:0,     net_value:-35000, paid_stt:1 },
    { id:8,  bill_id:2, payer_id:2, share_value:35000, cost:0,     net_value:-35000, paid_stt:1 },
    { id:9,  bill_id:2, payer_id:6, share_value:35000, cost:0,     net_value:-35000, paid_stt:1 },
    // bill 3 — fully paid
    { id:10, bill_id:3, payer_id:2, share_value:62500, cost:125000, net_value:62500,  paid_stt:1 },
    { id:11, bill_id:3, payer_id:1, share_value:62500, cost:0,      net_value:-62500, paid_stt:1 },
    // bill 4
    { id:12, bill_id:4, payer_id:6, share_value:20000, cost:40000, net_value:20000,  paid_stt:1 },
    { id:13, bill_id:4, payer_id:3, share_value:20000, cost:0,     net_value:-20000, paid_stt:0 },
  ],
  slip: [],
  contract: [
    { id:1, sender_id:1, message:"Welcome to Contract — message here for anything admin related.", created_at:'2026-06-01T09:00:00' },
  ],
};

let CURRENT_USER_ID = null;

function personById(id){ return DB.person.find(p => p.id === id); }
function billTypeName(id){ return (DB.type_of_bill.find(t => t.id === id)||{}).type_name || '—'; }
function formatKip(n){ return Math.round(n).toLocaleString('en-US').replace(/,/g,'.'); }
function formatDateLong(ds){ return new Date(ds).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}); }
function formatDateShort(ds){ return new Date(ds).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }
function sharesForBill(id){ return DB.share.filter(s=>s.bill_id===id).map(s=>({...s,person:personById(s.payer_id)})); }
function detailsForBill(id){ return DB.bill_detail.filter(d=>d.bill_id===id).map(d=>({...d,buyer:personById(d.buyer_id)})); }
function billFullyPaid(id){ return sharesForBill(id).every(s=>s.paid_stt===1); }
function avatarInitials(name){ return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }