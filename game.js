// Flip City — Builder Edition v7.1 (CLEAN)
// Activity Meter: "Collect Revenue" is earned (Activity fills over time; collect only when charged).
// Adds: Support email cityflipsupport@gmail.com in Help + footer.

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("game");
  if (!root) return console.error("❌ Missing <div id='game'></div> in index.html");

  const SUPPORT_EMAIL = "cityflipsupport@gmail.com";

  // -------------------- Styles --------------------
  const style = document.createElement("style");
  style.textContent = `
    :root { color-scheme: dark; }
    body{
      margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      color:#eaf0ff; min-height:100vh;
      background:
        radial-gradient(900px 450px at 35% 10%, rgba(94,203,255,.16), transparent 55%),
        radial-gradient(900px 450px at 70% 18%, rgba(186,94,255,.12), transparent 55%),
        linear-gradient(180deg, #060716, #0b1220 55%, #05060f);
    }
    a{ color: rgba(94,203,255,.95); text-decoration: none; }
    a:hover{ text-decoration: underline; }

    .wrap{ max-width: 1220px; margin: 0 auto; padding: 18px; }
    .top{ display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:flex-start; }
    h1{ margin:0; font-size: 20px; letter-spacing:.2px; }
    .sub{ opacity:.82; font-size: 13px; }

    .row{ display:flex; gap:12px; flex-wrap:wrap; align-items:stretch; }
    .grid2{ display:grid; gap: 12px; grid-template-columns: 1.05fr 1.95fr; align-items:start; }
    @media (max-width: 980px){ .grid2{ grid-template-columns: 1fr; } }

    .card{
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 18px;
      padding: 14px;
      box-shadow: 0 12px 35px rgba(0,0,0,.35);
      backdrop-filter: blur(6px);
    }
    .card h2{ margin:0 0 10px 0; font-size: 14px; opacity:.92; letter-spacing:.2px; }
    .hr{ height:1px; background: rgba(255,255,255,.10); border-radius:99px; margin: 12px 0; }

    .btn{
      appearance:none; border:0; cursor:pointer;
      background: rgba(255,255,255,.10);
      color:#eaf0ff;
      border:1px solid rgba(255,255,255,.16);
      border-radius: 14px;
      padding: 10px 12px;
      font-weight: 950;
      transition: transform .06s ease, background .15s ease, opacity .15s ease, box-shadow .15s ease;
      user-select:none;
      white-space: nowrap;
    }
    .btn:hover{ background: rgba(255,255,255,.14); }
    .btn:active{ transform: translateY(1px) scale(.99); }
    .btn.primary{ background: rgba(94,203,255,.18); border-color: rgba(94,203,255,.35); }
    .btn.danger{ background: rgba(255,94,94,.14); border-color: rgba(255,94,94,.35); }
    .btn.small{ padding: 8px 10px; border-radius: 12px; font-weight: 950; }
    .btn.ghost{ background: rgba(255,255,255,.06); }
    .btn[disabled]{ opacity:.55; cursor:not-allowed; }

    .pill{
      display:inline-flex; align-items:center; gap:8px;
      padding: 7px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,.08);
      border: 1px solid rgba(255,255,255,.14);
      font-size: 12px;
      opacity: .95;
    }

    .statsGrid{ display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; }
    .stat{ background: rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.10); border-radius: 14px; padding: 10px; }
    .k{ font-size: 12px; opacity:.78; }
    .v{ margin-top: 4px; font-size: 16px; font-weight: 1000; }
    .mono{ font-variant-numeric: tabular-nums; }

    .shop{ display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
    @media (max-width: 560px){ .shop{ grid-template-columns: 1fr; } }
    .shopItem{ background: rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius: 16px; padding: 12px; display:flex; flex-direction:column; gap: 8px; }
    .shopItem .t{ font-weight: 1000; }
    .shopItem .d{ font-size: 12px; opacity:.82; }
    .shopItem .b{ display:flex; justify-content:space-between; align-items:center; gap: 10px; }
    .shopItem .meta{ font-size: 12px; opacity:.86; }

    .buildBar{
      display:flex; gap: 8px; flex-wrap:wrap; align-items:center;
      background: rgba(255,255,255,.05);
      border:1px solid rgba(255,255,255,.10);
      border-radius: 16px;
      padding: 10px;
    }
    .tool{
      display:flex; gap: 10px; align-items:center;
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.06);
      cursor:pointer; user-select:none;
      transition: transform .06s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease;
      min-width: 190px;
    }
    .tool:hover{ background: rgba(255,255,255,.09); }
    .tool:active{ transform: translateY(1px) scale(.99); }
    .tool.sel{
      background: rgba(94,203,255,.15);
      border-color: rgba(94,203,255,.35);
      box-shadow: 0 0 0 3px rgba(94,203,255,.10);
    }
    .tool.suggest{
      border-color: rgba(255,206,94,.40);
      box-shadow: 0 0 0 3px rgba(255,206,94,.10);
    }
    .tool .icon{ font-size: 18px; }
    .tool .name{ font-weight: 1000; }
    .tool .info{ font-size: 12px; opacity: .82; }

    .sky{
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,.14);
      background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
      padding: 12px;
      overflow:hidden;
    }
    .skyline{ font-size: 30px; line-height: 1.1; letter-spacing: 2px; white-space: nowrap; overflow:hidden; text-overflow: ellipsis; }
    .hint{ font-size: 12px; opacity:.82; margin-top: 6px; }
    .hint b{ opacity: 1; }

    .meterWrap{
      margin-top: 10px;
      display:flex;
      align-items:center;
      gap: 10px;
      flex-wrap:wrap;
    }
    .meter{
      flex: 1 1 240px;
      height: 10px;
      border-radius: 999px;
      background: rgba(255,255,255,.08);
      border: 1px solid rgba(255,255,255,.12);
      overflow:hidden;
    }
    .meter > div{
      height: 100%;
      width: 0%;
      background: rgba(94,203,255,.45);
      box-shadow: 0 0 18px rgba(94,203,255,.25);
    }
    .meterLabel{ font-size: 12px; opacity:.86; }

    .board{
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.04);
      padding: 12px;
    }
    .grid{
      display:grid;
      grid-template-columns: repeat(10, minmax(0,1fr));
      gap: 8px;
    }
    @media (max-width: 820px){ .grid{ grid-template-columns: repeat(8, minmax(0,1fr)); } }
    @media (max-width: 520px){ .grid{ grid-template-columns: repeat(6, minmax(0,1fr)); } }

    .tile{
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.06);
      min-height: 62px;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      cursor:pointer; user-select:none;
      transition: transform .06s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease;
      position: relative;
      overflow:hidden;
    }
    .tile:hover{ background: rgba(255,255,255,.09); }
    .tile:active{ transform: translateY(1px) scale(.99); }

    .tile.bad{
      border-color: rgba(255,94,94,.45);
      box-shadow: 0 0 0 3px rgba(255,94,94,.10);
    }
    .tile.good{
      border-color: rgba(124,255,170,.35);
      box-shadow: 0 0 0 3px rgba(124,255,170,.08);
    }

    .tile.preview{
      border-color: rgba(94,203,255,.45);
      box-shadow: 0 0 0 3px rgba(94,203,255,.10);
    }
    .tile.preview::after{
      content:"";
      position:absolute; inset:-2px;
      background: radial-gradient(250px 140px at 50% 50%, rgba(94,203,255,.20), transparent 60%);
      opacity:.95;
      pointer-events:none;
    }

    .tile .e{ font-size: 22px; }
    .tile .s{ font-size: 10px; opacity:.80; margin-top: 2px; text-align:center; padding: 0 4px; }
    .tile .u{
      position:absolute; top:6px; right:6px;
      display:flex; gap: 4px;
      font-size: 12px;
      opacity:.95;
      filter: drop-shadow(0 8px 14px rgba(0,0,0,.35));
    }
    .tag{
      background: rgba(0,0,0,.35);
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 999px;
      padding: 1px 6px;
      line-height: 1.4;
    }

    .tile.flash::before{
      content:"";
      position:absolute; inset:-2px;
      background: radial-gradient(250px 140px at 50% 50%, rgba(94,203,255,.30), transparent 60%);
      opacity:.0;
      animation: flash .42s ease;
      pointer-events:none;
    }
    @keyframes flash { 0%{opacity:0} 25%{opacity:1} 100%{opacity:0} }

    .panelSmall{ font-size: 12px; opacity:.86; line-height: 1.35; }
    .footer{
      margin-top: 14px;
      font-size: 12px;
      opacity: .75;
      display:flex;
      gap: 10px;
      justify-content: space-between;
      flex-wrap: wrap;
      align-items: center;
    }

    .toast{
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: 16px;
      background: rgba(0,0,0,.65);
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 999px;
      padding: 10px 14px;
      font-size: 13px;
      opacity: 0;
      pointer-events: none;
      transition: opacity .2s ease, transform .2s ease;
      max-width: 92vw;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      z-index: 50;
    }
    .toast.show{ opacity: 1; transform: translateX(-50%) translateY(-4px); }

    /* Modal */
    .modalBackdrop{
      position: fixed; inset: 0;
      background: rgba(0,0,0,.55);
      display:flex; align-items:center; justify-content:center;
      padding: 18px;
      z-index: 100;
    }
    .modal{
      width: min(920px, 96vw);
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,.16);
      background:
        radial-gradient(900px 450px at 25% 0%, rgba(94,203,255,.18), transparent 55%),
        radial-gradient(900px 450px at 75% 10%, rgba(186,94,255,.14), transparent 55%),
        rgba(11,18,32,.95);
      box-shadow: 0 25px 70px rgba(0,0,0,.55);
      overflow:hidden;
    }
    .modalHeader{
      padding: 16px;
      border-bottom: 1px solid rgba(255,255,255,.10);
      display:flex; align-items:flex-start; justify-content:space-between; gap: 12px;
    }
    .modalHeader h3{ margin:0; font-size: 16px; letter-spacing:.2px; }
    .modalBody{ padding: 16px; }
    .modalGrid{
      display:grid; gap: 12px;
      grid-template-columns: 1.2fr .8fr;
    }
    @media (max-width: 860px){ .modalGrid{ grid-template-columns: 1fr; } }
    .step{
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 16px;
      padding: 12px;
    }
    .step .title{ font-weight: 1000; margin-bottom: 6px; }
    .step .text{ font-size: 12px; opacity:.88; line-height: 1.42; }
    .modalFooter{
      padding: 16px;
      border-top: 1px solid rgba(255,255,255,.10);
      display:flex; align-items:center; justify-content:space-between; gap: 10px;
      flex-wrap:wrap;
    }
  `;
  document.head.appendChild(style);

  // -------------------- Helpers --------------------
  const now = () => Date.now();
  const SAVE_KEY = "flipcity_builder_v71";
  const COLLECT_MIN = 10;        // percent
  const COLLECT_COOLDOWN = 800;  // ms

  const fmt = (n) => {
    if (!Number.isFinite(n)) return "∞";
    const abs = Math.abs(n);
    if (abs < 1000) return n.toFixed(0);
    const units = ["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","Dc"];
    let u = -1, v = abs;
    while (v >= 1000 && u < units.length - 1) { v /= 1000; u++; }
    const sign = n < 0 ? "-" : "";
    return `${sign}${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)}${units[u]}`;
  };

  const toast = (msg) => {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1400);
  };

  const safeParse = (s, fallback) => { try { return JSON.parse(s); } catch { return fallback; } };
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  // -------------------- World config --------------------
  const W = 10, H = 8;
  const MAX_LVL = 5;

  const EMPTY = "empty";
  const TYPES = {
    empty: { key:"empty", name:"Empty", icon:"⬜", cost:0, baseP:0, baseT:0, info:"Open land." },

    road:  { key:"road",  name:"Road",  icon:"🛣️", cost:10,  baseP:0,    baseT:0,    info:"Boosts Shops & Factories nearby." },
    power: { key:"power", name:"Power Plant", icon:"⚡", cost:120, baseP:0.4,  baseT:0,    info:"Provides POWER coverage." },
    water: { key:"water", name:"Water Tower", icon:"💧", cost:95,  baseP:0.25, baseT:0,    info:"Provides WATER coverage." },

    house: { key:"house", name:"House", icon:"🏠", cost:18,  baseP:0.55, baseT:0,    info:"Passive income. Likes Parks & Utilities." },
    shop:  { key:"shop",  name:"Shop",  icon:"🏪", cost:40,  baseP:0.10, baseT:0.55, info:"Generates Activity + revenue." },
    fact:  { key:"fact",  name:"Factory", icon:"🏭", cost:95, baseP:2.10, baseT:0.10, info:"Big passive. Likes Roads & Utilities; hates Parks." },

    park:  { key:"park",  name:"Park",  icon:"🌳", cost:22,  baseP:0,    baseT:0,    info:"Boosts nearby Houses & Shops." },
  };

  const BUILD_MENU = ["house","shop","fact","park","road","power","water","upgrade","repair","bulldoze"];

  const EVENTS = [
    { id:"festival", name:"City Festival 🎉", desc:"+50% Activity/Revenue for 40s", dur:40_000, actMult:1.5, passMult:1.0 },
    { id:"boom",     name:"Construction Boom 🏗️", desc:"+50% Passive for 40s", dur:40_000, actMult:1.0, passMult:1.5 },
    { id:"fire",     name:"Fire 🔥", desc:"A random building catches fire (repair it)", dur:0, fire:true }
  ];

  // -------------------- State --------------------
  const state = {
    cash: 65,
    totalEarned: 0,
    lastTickAt: now(),
    lastSaveAt: 0,

    board: Array.from({ length: W*H }, () => ({ type: EMPTY, lvl: 0, fire: false })),

    tool: "house",
    hoverIndex: null,

    up: { zoning: 0, efficiency: 0, commerce: 0, logistics: 0, parks: 0 },

    undo: [],
    missionIndex: 0,

    activity: 0,
    lastCollectAt: 0,

    event: { active: null, nextAt: now() + 35_000 },

    seenIntro: false
  };

  // -------------------- Missions --------------------
  const MISSIONS = [
    { id:"m1", title:"Lay foundations", desc:"Build 4 Houses.", check: s => countType("house") >= 4 },
    { id:"m2", title:"Green spaces", desc:"Build 2 Parks near Houses.", check: s => parksNearHouses() >= 2 },
    { id:"m3", title:"Turn on utilities", desc:"Build 1 Power Plant ⚡ and 1 Water Tower 💧.", check: s => countType("power")>=1 && countType("water")>=1 },
    { id:"m4", title:"Connect commerce", desc:"Build 2 Roads and 2 Shops.", check: s => countType("road")>=2 && countType("shop")>=2 },
    { id:"m5", title:"Industrial zone", desc:"Build 1 Factory 🏭 and keep it away from Parks.", check: s => countType("fact")>=1 && factoryParkConflicts() === 0 },
    { id:"m6", title:"Upgrade a building", desc:"Upgrade any building to Level 3.", check: s => maxLevelAny() >= 3 },
    { id:"m7", title:"City in motion", desc:"Reach $500 total earned.", check: s => s.totalEarned >= 500 },
  ];

  // -------------------- Upgrade effects --------------------
  const zoningMult = () => 1 + state.up.zoning * 0.08;
  const costMult = () => 1 - Math.min(0.45, state.up.efficiency * 0.05);
  const roadPower = () => 1 + state.up.logistics * 0.10;
  const parkPower = () => 1 + state.up.parks * 0.12;
  const shopMult = () => 1 + state.up.commerce * 0.12;

  const powerRadius = () => 3 + Math.floor(state.up.logistics / 4);
  const waterRadius = () => 3 + Math.floor(state.up.parks / 4);

  // -------------------- Geometry --------------------
  const idx = (x,y) => y*W + x;
  const xy = (i) => [i % W, Math.floor(i / W)];
  const inBounds = (x,y) => x>=0 && y>=0 && x<W && y<H;

  function neighbors4(x,y){
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const out = [];
    for (const [dx,dy] of dirs){
      const nx=x+dx, ny=y+dy;
      if (inBounds(nx,ny)) out.push([nx,ny]);
    }
    return out;
  }
  function neighbors8(x,y){
    const out = [];
    for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++){
      if (dx===0 && dy===0) continue;
      const nx=x+dx, ny=y+dy;
      if (inBounds(nx,ny)) out.push([nx,ny]);
    }
    return out;
  }
  function manhattan(a,b){
    const [ax,ay]=a, [bx,by]=b;
    return Math.abs(ax-bx)+Math.abs(ay-by);
  }

  // -------------------- Counters --------------------
  function countType(type){
    let c=0;
    for (const t of state.board) if (t.type===type) c++;
    return c;
  }
  function maxLevelAny(){
    let m=0;
    for (const t of state.board) if (t.type!==EMPTY) m=Math.max(m,t.lvl);
    return m;
  }
  function parksNearHouses(){
    let c=0;
    for (let i=0;i<state.board.length;i++){
      if (state.board[i].type!=="park") continue;
      const [x,y]=xy(i);
      const near = neighbors8(x,y).some(([nx,ny]) => state.board[idx(nx,ny)].type==="house");
      if (near) c++;
    }
    return c;
  }
  function factoryParkConflicts(){
    let c=0;
    for (let i=0;i<state.board.length;i++){
      if (state.board[i].type!=="fact") continue;
      const [x,y]=xy(i);
      const bad = neighbors8(x,y).some(([nx,ny]) => state.board[idx(nx,ny)].type==="park");
      if (bad) c++;
    }
    return c;
  }

  // -------------------- Costs --------------------
  function buildingCost(typeKey){
    const t = TYPES[typeKey];
    if (!t) return 0;
    return Math.ceil(t.cost * costMult());
  }
  function upgradeCost(tile){
    if (!tile || tile.type===EMPTY) return 0;
    const base = Math.max(10, buildingCost(tile.type));
    return Math.ceil((base * 0.55) * Math.pow(1.55, tile.lvl));
  }
  function repairCost(tile){
    if (!tile.fire) return 0;
    const base = Math.max(8, buildingCost(tile.type));
    return Math.ceil(base * 0.25 + tile.lvl * 6);
  }
  function bulldozeRefund(tile){
    if (!tile || tile.type===EMPTY) return 0;
    const base = buildingCost(tile.type);
    return Math.floor(base * (0.30 + tile.lvl * 0.04));
  }
  function cheapestBuildCost(){
    return Math.min(buildingCost("house"), buildingCost("park"), buildingCost("road"));
  }

  // -------------------- Utilities coverage --------------------
  function hasUtilityAt(x,y, utilType){
    const r = utilType==="power" ? powerRadius() : waterRadius();
    const here = [x,y];
    for (let i=0;i<state.board.length;i++){
      const t = state.board[i];
      if (t.type !== utilType) continue;
      const [ux,uy]=xy(i);
      if (manhattan(here, [ux,uy]) <= r) return true;
    }
    return false;
  }

  // -------------------- Yields --------------------
  function computeTileYield(x,y){
    const tile = state.board[idx(x,y)];
    if (!tile || tile.type===EMPTY) return { passive:0, tap:0, activity:0, mood:"", needs:"" };

    const meta = TYPES[tile.type];
    let passive = meta.baseP || 0;
    let tap = meta.baseT || 0;

    if (tile.fire){
      return { passive:0, tap:0, activity:0, mood:"🔥 On fire", needs:"Repair" };
    }

    const lvlMult = 1 + tile.lvl * 0.35;

    let parks=0, roads4=0, houses8=0;
    for (const [nx,ny] of neighbors8(x,y)){
      const nt = state.board[idx(nx,ny)].type;
      if (nt==="park") parks++;
      if (nt==="house") houses8++;
    }
    for (const [nx,ny] of neighbors4(x,y)){
      const nt = state.board[idx(nx,ny)].type;
      if (nt==="road") roads4++;
    }

    const needsPower = (tile.type==="house" || tile.type==="shop" || tile.type==="fact");
    const needsWater = (tile.type==="house" || tile.type==="fact");
    const hasPower = !needsPower || hasUtilityAt(x,y,"power");
    const hasWater = !needsWater || hasUtilityAt(x,y,"water");

    let utilityMult = 1;
    let needs = [];
    if (!hasPower){ utilityMult *= 0.55; needs.push("⚡"); }
    if (!hasWater){ utilityMult *= 0.65; needs.push("💧"); }

    const mood = [];
    if (tile.type==="house" || tile.type==="shop"){
      const pBonus = 1 + parks * 0.08 * parkPower();
      passive *= pBonus;
      tap *= pBonus;
      if (parks>0) mood.push("+Parks");
    }
    if (tile.type==="shop" || tile.type==="fact"){
      const rBonus = 1 + roads4 * 0.12 * roadPower();
      passive *= rBonus;
      tap *= rBonus;
      if (roads4>0) mood.push("+Roads");
    }
    if (tile.type==="shop"){
      const hBonus = 1 + houses8 * 0.03;
      tap *= hBonus;
      if (houses8>0) mood.push("+Houses");
      tap *= shopMult();
    }
    if (tile.type==="fact" && parks>0){
      const penaltyPerPark = Math.max(0.015, 0.055 - state.up.parks * 0.007);
      const pen = 1 - parks * penaltyPerPark;
      passive *= Math.max(0.55, pen);
      mood.push("-Parks");
    }

    passive *= lvlMult * utilityMult * zoningMult();
    tap *= lvlMult * utilityMult * zoningMult();

    // Activity generation (earned collect)
    let activity = 0;
    if (tile.type === "shop") activity = (0.55 + tap * 0.65);
    else if (tile.type === "road") activity = 0.06;
    else if (tile.type === "house") activity = 0.08;

    return { passive, tap, activity, mood: mood.join(" "), needs: needs.length ? `Needs ${needs.join("")}` : "" };
  }

  function currentEventMults(){
    if (!state.event.active) return { actMult:1, passMult:1 };
    return { actMult: state.event.active.actMult, passMult: state.event.active.passMult };
  }

  function totals(){
    let passive=0, tap=0, activityRate=0;
    for (let y=0;y<H;y++) for (let x=0;x<W;x++){
      const yld = computeTileYield(x,y);
      passive += yld.passive;
      tap += yld.tap;
      activityRate += yld.activity;
    }
    passive += 0.05; // tiny stipend so game never hard-locks

    const ev = currentEventMults();
    passive *= ev.passMult;
    activityRate *= ev.actMult;

    return { passive, tap, activityRate };
  }

  // -------------------- Skyline --------------------
  function skylineString(){
    const counts = { house:0, shop:0, fact:0, park:0, road:0, power:0, water:0 };
    let totalBuildings = 0;
    let levelSum = 0;

    for (const t of state.board){
      if (counts[t.type] !== undefined) counts[t.type]++;
      if (t.type !== EMPTY){
        if (t.type !== "road" && t.type !== "park") totalBuildings++;
        levelSum += t.lvl || 0;
      }
    }

    if (counts.house + counts.shop + counts.fact + counts.power + counts.water === 0) {
      return "⬜ ⬜ ⬜ 🏗️ ⬜ ⬜ ⬜";
    }

    const maturity = totalBuildings + Math.floor(levelSum / 3);
    const stage =
      maturity < 5  ? 0 :
      maturity < 10 ? 1 :
      maturity < 18 ? 2 :
      maturity < 28 ? 3 : 4;

    let skyline = [];
    const push = (icon, n) => { for (let i=0;i<n;i++) skyline.push(icon); };

    push("🏠", Math.min(6, counts.house));
    push("🏪", Math.min(4, counts.shop));
    push("🏭", Math.min(3, counts.fact));
    push("⚡", Math.min(2, counts.power));
    push("💧", Math.min(2, counts.water));
    push("🌳", Math.min(3, counts.park));

    if (stage >= 1) skyline = skyline.map(i => i === "🏠" ? "🏡" : i);
    if (stage >= 2) skyline = skyline.map(i => i === "🏡" ? "🏢" : i);
    if (stage >= 3) skyline = skyline.map(i => (i === "🏢" ? "🏙️" : (i === "🏪" ? "🏬" : i)));
    if (stage >= 4) { skyline = skyline.map(i => (i === "🏙️" ? "🌆" : i)); skyline.push("✨"); }

    while (skyline.length < 12) skyline.push("⬜");
    return skyline.slice(0, 12).join(" ");
  }

  // -------------------- Undo --------------------
  function pushUndo(){
    const snap = {
      cash: state.cash,
      totalEarned: state.totalEarned,
      board: state.board.map(t => ({ type:t.type, lvl:t.lvl, fire:!!t.fire })),
      missionIndex: state.missionIndex,
      eventActive: state.event.active ? { ...state.event.active } : null,
      tool: state.tool,
      activity: state.activity
    };
    state.undo.push(snap);
    if (state.undo.length > 30) state.undo.shift();
  }
  function doUndo(){
    const snap = state.undo.pop();
    if (!snap) return toast("Nothing to undo.");
    state.cash = snap.cash;
    state.totalEarned = snap.totalEarned;
    state.board = snap.board.map(t => ({ type:t.type, lvl:t.lvl, fire:!!t.fire }));
    state.missionIndex = snap.missionIndex;
    state.event.active = snap.eventActive;
    state.tool = BUILD_MENU.includes(snap.tool) ? snap.tool : "house";
    state.activity = clamp(Number(snap.activity ?? 0) || 0, 0, 100);
    toast("↩️ Undid last action");
    render();
    save();
  }

  // -------------------- Missions --------------------
  function nextMissionIfComplete(){
    let progressed = false;
    while (state.missionIndex < MISSIONS.length && MISSIONS[state.missionIndex].check(state)){
      state.missionIndex++;
      progressed = true;
    }
    if (progressed) toast("✅ Mission complete!");
  }

  // -------------------- Events --------------------
  function tickEvents(){
    if (state.event.active && now() >= state.event.active.endsAt){
      state.event.active = null;
      toast("⏱️ Event ended");
    }
    if (now() < state.event.nextAt) return;

    state.event.nextAt = now() + (35_000 + Math.random() * 40_000);

    const built = state.board.filter(t => t.type !== EMPTY).length;
    const chance = clamp(0.28 + built * 0.004, 0.28, 0.60);
    if (Math.random() > chance) return;

    const e = EVENTS[Math.floor(Math.random() * EVENTS.length)];

    if (e.fire){
      const candidates = [];
      for (let i=0;i<state.board.length;i++){
        const t = state.board[i];
        if (t.type===EMPTY) continue;
        if (t.type==="road" || t.type==="park" || t.type==="power" || t.type==="water") continue;
        if (t.fire) continue;
        candidates.push(i);
      }
      if (!candidates.length) return;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      state.board[pick].fire = true;
      toast("🔥 Fire! Select Repair and click the burning building.");
      render();
      return;
    }

    state.event.active = {
      id: e.id,
      name: e.name,
      desc: e.desc,
      actMult: e.actMult,
      passMult: e.passMult,
      endsAt: now() + e.dur
    };
    toast(`🎲 Event: ${e.name}`);
    render();
  }

  // -------------------- Guidance --------------------
  function guidance(){
    const cash = state.cash;
    const houses = countType("house");
    const shops = countType("shop");
    const roads = countType("road");
    const power = countType("power");
    const water = countType("water");
    const factories = countType("fact");
    const cheapest = cheapestBuildCost();
    const anyFire = state.board.some(t => t.fire);

    if (state.missionIndex < MISSIONS.length){
      const m = MISSIONS[state.missionIndex];
      const suggest =
        m.id === "m1" ? "house" :
        m.id === "m2" ? "park" :
        m.id === "m3" ? (power === 0 ? "power" : "water") :
        m.id === "m4" ? (roads < 2 ? "road" : "shop") :
        m.id === "m5" ? "fact" :
        m.id === "m6" ? "upgrade" : null;

      return { text: `🎯 <b>${m.title}</b> — ${m.desc}`, suggest };
    }

    if (anyFire) return { text: `🧯 <b>What to do next:</b> A building is on fire — switch to <b>Repair</b> and click it.`, suggest: "repair" };

    if (cash < cheapest){
      if (state.activity >= COLLECT_MIN) return { text: `💰 <b>What to do next:</b> You’ve earned revenue — click <b>Collect Revenue</b>.`, suggest: null };
      return { text: `⏳ <b>What to do next:</b> Wait a moment for <b>Passive</b> + <b>Activity</b> to accumulate. Build Shops to charge Activity faster.`, suggest: "shop" };
    }

    if (houses < 4) return { text: `🏠 <b>What to do next:</b> Build Houses first for passive income.`, suggest: "house" };
    if (countType("park") < 1) return { text: `🌳 <b>What to do next:</b> Place a Park near Houses for bonuses.`, suggest: "park" };

    if (power === 0) return { text: `⚡ <b>What to do next:</b> Build a Power Plant so buildings earn closer to full output.`, suggest: "power" };
    if (water === 0) return { text: `💧 <b>What to do next:</b> Build a Water Tower so Houses/Factories earn closer to full output.`, suggest: "water" };

    if (shops < 2) return { text: `🏪 <b>What to do next:</b> Build Shops — they charge <b>Activity</b> so you can collect revenue.`, suggest: "shop" };
    if (roads < shops) return { text: `🛣️ <b>What to do next:</b> Add Roads next to Shops/Factories for stronger commerce.`, suggest: "road" };

    if (factories < 1 && cash >= buildingCost("fact")) return { text: `🏭 <b>What to do next:</b> Add a Factory away from Parks for big passive income.`, suggest: "fact" };

    if (maxLevelAny() < 2) return { text: `⬆️ <b>What to do next:</b> Use Upgrade on your best buildings to scale faster.`, suggest: "upgrade" };

    if (state.activity < COLLECT_MIN) return { text: `📈 <b>What to do next:</b> Grow commerce (Shops + Roads) to charge Activity, then collect.`, suggest: "shop" };

    return { text: `✅ <b>What to do next:</b> Optimize placement, upgrade key tiles, and collect revenue when Activity is charged.`, suggest: null };
  }

  // -------------------- Actions --------------------
  function flashTile(i){
    const el = document.querySelector(`[data-i="${i}"]`);
    if (!el) return;
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  }

  function tryActionOn(x,y){
    const i = idx(x,y);
    const tile = state.board[i];
    const tool = state.tool;

    if (tool === "bulldoze"){
      if (tile.type===EMPTY) return toast("Nothing to bulldoze.");
      pushUndo();
      const refund = bulldozeRefund(tile);
      state.board[i] = { type: EMPTY, lvl: 0, fire: false };
      state.cash += refund;
      toast(`Bulldozed (+$${fmt(refund)})`);
      flashTile(i);
      nextMissionIfComplete();
      render(); save();
      return;
    }

    if (tool === "repair"){
      if (!tile.fire) return toast("That tile isn’t on fire.");
      const cost = repairCost(tile);
      if (state.cash < cost) return toast("Not enough cash to repair.");
      pushUndo();
      state.cash -= cost;
      tile.fire = false;
      toast(`Repaired (-$${fmt(cost)})`);
      flashTile(i);
      nextMissionIfComplete();
      render(); save();
      return;
    }

    if (tool === "upgrade"){
      if (tile.type===EMPTY) return toast("Build something first.");
      if (tile.fire) return toast("Repair it first.");
      if (tile.lvl >= MAX_LVL) return toast("Max level reached.");
      const cost = upgradeCost(tile);
      if (state.cash < cost) return toast("Not enough cash to upgrade.");
      pushUndo();
      state.cash -= cost;
      tile.lvl += 1;
      toast(`Upgraded to Lv ${tile.lvl}`);
      flashTile(i);
      nextMissionIfComplete();
      render(); save();
      return;
    }

    const meta = TYPES[tool];
    if (!meta) return;

    if (tile.type !== EMPTY) return toast("Tile occupied. Use Bulldoze or Upgrade/Repair.");
    const cost = buildingCost(tool);
    if (state.cash < cost) return toast(`Not enough cash. Need $${fmt(cost)}.`);

    pushUndo();
    state.cash -= cost;
    state.board[i] = { type: tool, lvl: 0, fire: false };

    toast(tool === "shop" ? "Built: 🏪 Shop (Activity will fill faster)" : `Built: ${meta.icon} ${meta.name}`);
    flashTile(i);
    nextMissionIfComplete();
    render(); save();
  }

  // -------------------- Activity / Revenue --------------------
  function activityPerSecond(){
    const t = totals();
    return clamp(0.10 + t.activityRate * 0.60, 0, 18);
  }

  function collectRevenue(){
    const t = totals();
    const act = clamp(state.activity, 0, 100);

    if (now() - state.lastCollectAt < COLLECT_COOLDOWN) return;
    if (act < COLLECT_MIN) return toast("Not enough Activity yet.");

    const capacity = (1 + t.tap);
    const payout = capacity * (act / 100) * 12;

    pushUndo();
    state.cash += payout;
    state.totalEarned += payout;

    state.activity = 0;
    state.lastCollectAt = now();

    toast(`Collected revenue: +$${fmt(payout)}`);
    nextMissionIfComplete();
    render();
    save();
  }

  // -------------------- Tick --------------------
  function tick(){
    const tNow = now();
    const dt = (tNow - state.lastTickAt) / 1000;
    state.lastTickAt = tNow;

    const t = totals();
    const gain = t.passive * dt;
    if (gain > 0){
      state.cash += gain;
      state.totalEarned += gain;
    }

    state.activity = clamp(state.activity + activityPerSecond() * dt, 0, 100);
    tickEvents();

    if (tNow - state.lastSaveAt > 10_000) save();
  }

  // -------------------- Upgrades --------------------
  function costUpgrade(key){
    const lvl = state.up[key];
    const base = { zoning: 140, efficiency: 160, commerce: 150, logistics: 170, parks: 145 }[key] || 150;
    const growth = { zoning: 1.22, efficiency: 1.24, commerce: 1.23, logistics: 1.25, parks: 1.23 }[key] || 1.23;
    return Math.ceil(base * Math.pow(growth, lvl) * (1 + lvl * 0.02));
  }

  function buyUpgrade(key){
    const c = costUpgrade(key);
    if (state.cash < c) return toast("Not enough cash.");
    pushUndo();
    state.cash -= c;
    state.up[key] += 1;
    toast("Upgrade purchased!");
    nextMissionIfComplete();
    render();
    save();
  }

  // -------------------- Save / Load --------------------
  function exportSave(){
    const data = {
      v: 71,
      cash: state.cash,
      totalEarned: state.totalEarned,
      board: state.board,
      tool: state.tool,
      up: state.up,
      missionIndex: state.missionIndex,
      event: state.event,
      seenIntro: state.seenIntro,
      activity: state.activity
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  }

  function importSave(code){
    const json = decodeURIComponent(escape(atob(code.trim())));
    const data = safeParse(json, null);
    if (!data || (data.v !== 71 && data.v !== 7)) throw new Error("Bad save");

    state.cash = Number(data.cash ?? 0) || 0;
    state.totalEarned = Number(data.totalEarned ?? 0) || 0;

    if (Array.isArray(data.board) && data.board.length === W*H){
      state.board = data.board.map(t => ({
        type: TYPES[t.type]?.key ? t.type : EMPTY,
        lvl: clamp(Number(t.lvl ?? 0) || 0, 0, MAX_LVL),
        fire: !!t.fire
      }));
    }

    state.tool = BUILD_MENU.includes(data.tool) ? data.tool : "house";

    state.up = {
      zoning: Math.max(0, Math.floor(Number(data.up?.zoning ?? 0) || 0)),
      efficiency: Math.max(0, Math.floor(Number(data.up?.efficiency ?? 0) || 0)),
      commerce: Math.max(0, Math.floor(Number(data.up?.commerce ?? 0) || 0)),
      logistics: Math.max(0, Math.floor(Number(data.up?.logistics ?? 0) || 0)),
      parks: Math.max(0, Math.floor(Number(data.up?.parks ?? 0) || 0)),
    };

    state.missionIndex = clamp(Number(data.missionIndex ?? 0) || 0, 0, MISSIONS.length);
    state.event = data.event && typeof data.event === "object"
      ? { active: data.event.active ?? null, nextAt: Number(data.event.nextAt ?? (now()+35_000)) || (now()+35_000) }
      : { active: null, nextAt: now()+35_000 };

    state.seenIntro = !!data.seenIntro;
    state.activity = clamp(Number(data.activity ?? 0) || 0, 0, 100);

    state.lastTickAt = now();
  }

  function save(){
    localStorage.setItem(SAVE_KEY, exportSave());
    state.lastSaveAt = now();
  }
  function load(){
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try { importSave(raw); } catch (e) { console.warn("Save load failed", e); }
  }

  // -------------------- UI helpers --------------------
  function toolCard(key, suggestKey){
    const sel = state.tool === key;
    const suggest = suggestKey === key;

    if (key === "upgrade"){
      return `
        <div class="tool ${sel ? "sel" : ""} ${suggest ? "suggest" : ""}" data-tool="upgrade">
          <div class="icon">⬆️</div>
          <div>
            <div class="name">Upgrade</div>
            <div class="info">Increase a building to Lv ${MAX_LVL}.</div>
          </div>
        </div>
      `;
    }
    if (key === "repair"){
      return `
        <div class="tool ${sel ? "sel" : ""} ${suggest ? "suggest" : ""}" data-tool="repair">
          <div class="icon">🧯</div>
          <div>
            <div class="name">Repair</div>
            <div class="info">Fix 🔥 fires so buildings work again.</div>
          </div>
        </div>
      `;
    }
    if (key === "bulldoze"){
      return `
        <div class="tool ${sel ? "sel" : ""} ${suggest ? "suggest" : ""}" data-tool="bulldoze">
          <div class="icon">🧹</div>
          <div>
            <div class="name">Bulldoze</div>
            <div class="info">Clear a tile (refund varies by level).</div>
          </div>
        </div>
      `;
    }

    const t = TYPES[key];
    const cost = buildingCost(key);
    const afford = state.cash >= cost;
    return `
      <div class="tool ${sel ? "sel" : ""} ${suggest ? "suggest" : ""}" data-tool="${key}">
        <div class="icon">${t.icon}</div>
        <div>
          <div class="name">${t.name} <span class="mono" style="opacity:.75;">$${fmt(cost)}</span></div>
          <div class="info">${t.info}${afford ? "" : " · (Wait/collect for cash)"}</div>
        </div>
      </div>
    `;
  }

  function shopItem(title, desc, meta, cost, id, primary=false){
    const can = state.cash >= cost;
    return `
      <div class="shopItem">
        <div class="t">${title}</div>
        <div class="d">${desc}</div>
        <div class="b">
          <div>
            <div class="meta">${meta}</div>
            <div class="meta">Cost: <b>$${fmt(cost)}</b></div>
          </div>
          <button class="btn ${primary && can ? "primary" : ""}" id="${id}">Buy</button>
        </div>
      </div>
    `;
  }

  function introModalHtml(){
    if (state.seenIntro) return "";
    return `
      <div class="modalBackdrop">
        <div class="modal">
          <div class="modalHeader">
            <div>
              <h3>Welcome to Flip City — Builder Edition</h3>
              <div class="sub">Revenue is earned via the <b>Activity</b> meter — build commerce to charge it, then collect.</div>
            </div>
            <button class="btn small ghost" id="btnCloseIntro">Close</button>
          </div>

          <div class="modalBody">
            <div class="modalGrid">
              <div class="step">
                <div class="title">Core loop</div>
                <div class="text">
                  Build <b>Houses 🏠</b> (passive) + <b>Parks 🌳</b> (bonus) →
                  add <b>Utilities ⚡💧</b> →
                  build <b>Shops 🏪</b> + <b>Roads 🛣️</b> to charge <b>Activity</b> →
                  <b>Collect Revenue</b> when charged →
                  place <b>Factories 🏭</b> for big passive →
                  <b>Upgrade ⬆️</b> to scale.
                </div>
              </div>
              <div class="step">
                <div class="title">Activity meter</div>
                <div class="text">
                  Activity fills automatically based on your city’s commerce (mostly Shops).<br>
                  You can only collect revenue when Activity has charge (so it’s not a spam button).
                </div>
              </div>

              <div class="step">
                <div class="title">Support</div>
                <div class="text">
                  Questions or bugs? Email:
                  <br><b><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></b>
                </div>
              </div>

              <div class="step">
                <div class="title">Disasters/events</div>
                <div class="text">
                  Fires 🔥 shut buildings down until repaired. Use the <b>Repair</b> tool.
                  Events can boost Activity/Revenue or Passive.
                </div>
              </div>
            </div>
          </div>

          <div class="modalFooter">
            <span class="sub">Tip: only the hovered tile shows a placement preview icon.</span>
            <button class="btn primary" id="btnStart">Start Building</button>
          </div>
        </div>
      </div>
    `;
  }

  // -------------------- Render --------------------
  function render(){
    const t = totals();
    const ev = state.event.active
      ? `${state.event.active.name} (ends in ${Math.max(0, Math.ceil((state.event.active.endsAt - now())/1000))}s)`
      : "No active event";

    const g = guidance();
    const suggestKey = g.suggest;

    const actPct = clamp(state.activity, 0, 100);
    const canCollect = actPct >= COLLECT_MIN;
    const est = (1 + t.tap) * (actPct / 100) * 12;

    root.innerHTML = `
      <div class="wrap">
        <div class="top">
          <div>
            <h1>Flip City</h1>
            <div class="sub">Builder flow: Missions → Utilities → Commerce → Collect Revenue → Industry → Upgrades → Events.</div>
          </div>
          <div class="row">
            <button class="btn small" id="btnHelp">Help</button>
            <button class="btn small" id="btnUndo" ${state.undo.length ? "" : "disabled"}>Undo</button>
            <button class="btn small" id="btnExport">Export</button>
            <button class="btn small" id="btnImport">Import</button>
            <button class="btn small danger" id="btnReset">Reset</button>
          </div>
        </div>

        <div class="row" style="margin-top:12px;">
          <div class="card sky" style="flex:1 1 720px;">
            <h2>Skyline Preview</h2>
            <div class="skyline">${skylineString()}</div>

            <div class="hint">${g.text}</div>

            <div class="meterWrap">
              <div class="meter" title="Activity fills over time (mostly from Shops). Collect Revenue when charged.">
                <div style="width:${actPct.toFixed(1)}%;"></div>
              </div>
              <div class="meterLabel">
                Activity: <b class="mono">${actPct.toFixed(0)}%</b>
                ${canCollect ? ` · Est. payout: <b class="mono">$${fmt(est)}</b>` : ` · Need <b>${COLLECT_MIN}%</b> to collect`}
              </div>
            </div>

            <div class="row" style="margin-top:10px;">
              <span class="pill">Cash: <b class="mono">$${fmt(state.cash)}</b></span>
              <span class="pill">Passive/sec: <b class="mono">$${fmt(t.passive)}</b></span>
              <span class="pill">Commerce (cap): <b class="mono">$${fmt(1 + t.tap)}</b></span>
              <span class="pill">Event: <b>${ev}</b></span>
              <span class="pill">⚡ radius: <b>${powerRadius()}</b> · 💧 radius: <b>${waterRadius()}</b></span>
            </div>
          </div>
        </div>

        <div class="grid2" style="margin-top:12px;">
          <div class="card">
            <h2>Stats</h2>
            <div class="statsGrid">
              <div class="stat"><div class="k">Cash</div><div class="v mono">$${fmt(state.cash)}</div></div>
              <div class="stat"><div class="k">Total Earned</div><div class="v mono">$${fmt(state.totalEarned)}</div></div>
              <div class="stat"><div class="k">Passive / sec</div><div class="v mono">$${fmt(t.passive)}</div></div>
              <div class="stat"><div class="k">Activity Fill / sec</div><div class="v mono">${activityPerSecond().toFixed(2)}%</div></div>
            </div>

            <div class="hr"></div>

            <button class="btn primary" id="btnCollect" ${canCollect ? "" : "disabled"}>
              Collect Revenue (${actPct.toFixed(0)}%)
            </button>

            <div class="panelSmall" style="margin-top:10px;">
              <b>Earn the collect:</b> Activity fills automatically (mostly from <b>Shops</b>).
              Build <b>Shops + Roads</b> to charge faster, then collect a payout.
            </div>

            <div class="hr"></div>

            <h2>Build Tools</h2>
            <div class="buildBar">
              ${BUILD_MENU.map(k => toolCard(k, suggestKey)).join("")}
            </div>
            <div class="panelSmall" style="margin-top:10px;">
              Selected: <b>${state.tool}</b>
              ${TYPES[state.tool] ? ` · Cost: <b>$${fmt(buildingCost(state.tool))}</b>` : ""}
            </div>

            <div class="hr"></div>

            <h2>Missions</h2>
            <div class="panelSmall">
              ${state.missionIndex < MISSIONS.length
                ? `<b>${MISSIONS[state.missionIndex].title}</b><br>${MISSIONS[state.missionIndex].desc}`
                : `<b>All missions complete!</b><br>Keep optimizing adjacency + levels + utilities + revenue cycles.`}
            </div>

            <div class="footer">
              <span>Support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></span>
              <span>Flip City v7.1</span>
            </div>
          </div>

          <div class="card">
            <h2>City Grid</h2>
            <div class="panelSmall">Hover to preview (only hovered tile). Click to act. 🔥 buildings need Repair.</div>
            <div class="board">
              <div class="grid" id="grid"></div>
            </div>

            <div class="hr"></div>

            <h2>Upgrades (5)</h2>
            <div class="shop">
              ${shopItem(
                "Zoning Policy",
                "All buildings earn more.",
                `Level ${state.up.zoning} · ${(zoningMult()).toFixed(2)}× output`,
                costUpgrade("zoning"),
                "up_zoning",
                true
              )}
              ${shopItem(
                "Construction Efficiency",
                "Build/upgrade costs less.",
                `Level ${state.up.efficiency} · ${Math.round((1-costMult())*100)}% discount`,
                costUpgrade("efficiency"),
                "up_efficiency"
              )}
              ${shopItem(
                "Commerce Boost",
                "Shops earn more commerce capacity (revenue).",
                `Level ${state.up.commerce} · ${(shopMult()).toFixed(2)}× shop power`,
                costUpgrade("commerce"),
                "up_commerce"
              )}
              ${shopItem(
                "Logistics Network",
                "Road adjacency stronger + ⚡ radius grows slowly.",
                `Level ${state.up.logistics} · ${(roadPower()).toFixed(2)}× road effects`,
                costUpgrade("logistics"),
                "up_logistics"
              )}
              ${shopItem(
                "Parks Department",
                "Park adjacency stronger + 💧 radius grows slowly.",
                `Level ${state.up.parks} · ${(parkPower()).toFixed(2)}× park effects`,
                costUpgrade("parks"),
                "up_parks"
              )}
            </div>
          </div>
        </div>

        <div id="toast" class="toast"></div>
        ${introModalHtml()}
      </div>
    `;

    // Tool select
    document.querySelectorAll("[data-tool]").forEach(el => {
      el.addEventListener("click", () => {
        state.tool = el.getAttribute("data-tool");
        render();
      });
    });

    // Buttons
    const btnCollect = document.getElementById("btnCollect");
    if (btnCollect) btnCollect.onclick = collectRevenue;

    document.getElementById("btnHelp").onclick = () => { state.seenIntro = false; render(); };
    document.getElementById("btnUndo").onclick = doUndo;

    document.getElementById("up_zoning").onclick = () => buyUpgrade("zoning");
    document.getElementById("up_efficiency").onclick = () => buyUpgrade("efficiency");
    document.getElementById("up_commerce").onclick = () => buyUpgrade("commerce");
    document.getElementById("up_logistics").onclick = () => buyUpgrade("logistics");
    document.getElementById("up_parks").onclick = () => buyUpgrade("parks");

    document.getElementById("btnExport").onclick = () => {
      const code = exportSave();
      navigator.clipboard?.writeText(code).catch(() => {});
      prompt("Copy your save code:", code);
    };

    document.getElementById("btnImport").onclick = () => {
      const code = prompt("Paste your save code:");
      if (!code) return;
      try { importSave(code); save(); toast("✅ Save imported"); render(); }
      catch { toast("❌ Import failed (wrong version?)"); }
    };

    document.getElementById("btnReset").onclick = () => {
      const ok = confirm("Reset everything? (Export first if you want a backup.)");
      if (!ok) return;
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    };

    // Intro modal
    const startBtn = document.getElementById("btnStart");
    const closeBtn = document.getElementById("btnCloseIntro");
    if (startBtn) startBtn.onclick = () => { state.seenIntro = true; save(); render(); };
    if (closeBtn) closeBtn.onclick = () => { state.seenIntro = true; save(); render(); };

    // Grid render
    const grid = document.getElementById("grid");
    const tool = state.tool;

    for (let i=0;i<state.board.length;i++){
      const tile = state.board[i];
      const [x,y] = xy(i);
      const yld = computeTileYield(x,y);

      let cls = "tile";
      const tags = [];

      if (tile.fire) tags.push(`<span class="tag">🔥</span>`);
      if (tile.type !== EMPTY) tags.push(`<span class="tag">Lv ${tile.lvl}</span>`);

      if (yld.needs) {
        if (yld.needs.includes("⚡")) tags.push(`<span class="tag">⚡</span>`);
        if (yld.needs.includes("💧")) tags.push(`<span class="tag">💧</span>`);
      }

      if (state.hoverIndex === i) cls += " preview";

      const isOccupied = tile.type !== EMPTY;
      let canAct = true;
      if (tool === "bulldoze") canAct = isOccupied;
      else if (tool === "repair") canAct = !!tile.fire;
      else if (tool === "upgrade") canAct = isOccupied && !tile.fire && tile.lvl < MAX_LVL;
      else canAct = !isOccupied && state.cash >= buildingCost(tool);

      cls += canAct ? " good" : " bad";

      // hover-only preview icon
      let icon = TYPES[tile.type]?.icon || "⬜";
      if (tile.type === EMPTY && state.hoverIndex === i && TYPES[tool]) icon = TYPES[tool].icon;

      const sub = tile.type === EMPTY ? "" : (yld.mood || yld.needs || "");

      const div = document.createElement("div");
      div.className = cls;
      div.setAttribute("data-i", String(i));
      div.title =
        tile.type === EMPTY
          ? (TYPES[tool] ? `Empty land • Place ${TYPES[tool].name} cost $${fmt(buildingCost(tool))}` : "Empty land")
          : `${TYPES[tile.type].name} (Lv ${tile.lvl}) • Passive: $${fmt(yld.passive)}/sec • Commerce: $${fmt(yld.tap)} ${yld.needs ? "• "+yld.needs : ""}`;

      div.innerHTML = `
        <div class="u">${tags.join("")}</div>
        <div class="e">${icon}</div>
        <div class="s">${sub}</div>
      `;

      div.addEventListener("mouseenter", () => { state.hoverIndex = i; render(); });
      div.addEventListener("mouseleave", () => { state.hoverIndex = null; render(); });
      div.addEventListener("click", () => tryActionOn(x,y));

      grid.appendChild(div);
    }
  }

  // -------------------- Boot --------------------
  function fastForwardMissions(){
    while (state.missionIndex < MISSIONS.length && MISSIONS[state.missionIndex].check(state)) state.missionIndex++;
  }

  load();
  fastForwardMissions();
  render();

  setInterval(() => { tick(); render(); }, 400);
  window.addEventListener("beforeunload", () => save());
});
