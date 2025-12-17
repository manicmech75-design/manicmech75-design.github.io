/* ===========================
   City Flip – Sunset+ Edition
   FULL game.js
   =========================== */

(() => {
  "use strict";

  /* -------------------------
     CONFIG
  ------------------------- */
  const VERSION = "1.1.0-sunset-plus";
  const SAVE_KEY = "cityflip_save_v1_1";
  const SETTINGS_KEY = "cityflip_settings_v1_1";
  const FIRST_TUTORIAL_KEY = "cityflip_tutorial_seen_v1_1";

  const OFFLINE_CAP_SECONDS = 8 * 60 * 60; // 8 hours
  const TICK_MS = 250;
  const AUTOSAVE_MS = 10_000;
  const GRID_COUNT = 12;

  /* -------------------------
     TILE DEFINITIONS
  ------------------------- */
  const TILES = [
    { id:"lot",      name:"Empty Lot",        baseCost: 10,     baseIncome: 0.15,  tapBase: 0.6 },
    { id:"cafe",     name:"Sunset Café",      baseCost: 40,     baseIncome: 0.55,  tapBase: 1.2 },
    { id:"arcade",   name:"Neon Arcade",      baseCost: 120,    baseIncome: 1.6,   tapBase: 2.2 },
    { id:"studio",   name:"Skyline Studio",   baseCost: 320,    baseIncome: 4.0,   tapBase: 3.6 },
    { id:"market",   name:"Golden Market",    baseCost: 850,    baseIncome: 9.5,   tapBase: 5.5 },
    { id:"tower",    name:"Sunset Tower",     baseCost: 2200,   baseIncome: 22,    tapBase: 9.0 },
    { id:"hotel",    name:"Aurora Hotel",     baseCost: 5600,   baseIncome: 52,    tapBase: 14.0 },
    { id:"hub",      name:"Transit Hub",      baseCost: 14000,  baseIncome: 125,   tapBase: 22.0 },
    { id:"district", name:"Highrise District",baseCost: 36000,  baseIncome: 320,   tapBase: 35.0 },
    { id:"port",     name:"Sunset Port",      baseCost: 90000,  baseIncome: 780,   tapBase: 55.0 },
    { id:"center",   name:"City Center",      baseCost: 220000, baseIncome: 1850,  tapBase: 85.0 },
    { id:"metro",    name:"Metro Megaplex",   baseCost: 520000, baseIncome: 4200,  tapBase: 125.0 }
  ];

  const $ = (id) => document.getElementById(id);
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

  const fmt = (n)=>{
    if(!isFinite(n)) return "∞";
    if(Math.abs(n)<1000) return `$${n.toFixed(0)}`;
    const u=["K","M","B","T","Qa","Qi"];
    let i=-1,v=Math.abs(n);
    while(v>=1000&&i<u.length-1){v/=1000;i++;}
    return `${n<0?"-":""}$${v.toFixed(v<10?2:v<100?1:0)}${u[i]}`;
  };

  /* -------------------------
     DEFAULT STATE
  ------------------------- */
  const defaultSettings = {
    sound:true,
    music:true,
    haptics:false,
    showTutorialOnStartup:true,
    performanceMode:false
  };

  const defaultSave = () => ({
    v: VERSION,
    cash: 0,
    tapMultLvl: 0,
    cityMultLvl: 0,
    autoLvl: 0,
    tiles: Array.from({length:GRID_COUNT},(_,i)=>({
      idx:i, def:TILES[i].id, owned:false, lvl:0
    })),
    lastTs: Date.now(),
    pendingOffline: 0,
    daily:{ lastClaimDate:"", streak:0, pending:0 }
  });

  const state = {
    save: defaultSave(),
    settings:{...defaultSettings},
    audio:{ ctx:null, fx:null, music:null, unlocked:false }
  };

  /* -------------------------
     AUDIO (iOS SAFE)
  ------------------------- */
  function unlockAudio(){
    if(state.audio.unlocked) return;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      const ctx=new AC();
      const fx=ctx.createGain();
      const music=ctx.createGain();
      fx.connect(ctx.destination);
      music.connect(ctx.destination);
      ctx.resume();
      state.audio={ctx,fx,music,unlocked:true};
      if(state.settings.music) startMusic();
    }catch{}
  }

  function playTone(freq=440,dur=0.05,g=0.06){
    if(!state.settings.sound||!state.audio.unlocked) return;
    const o=state.audio.ctx.createOscillator();
    const gain=state.audio.ctx.createGain();
    o.frequency.value=freq;
    gain.gain.value=g;
    o.connect(gain);
    gain.connect(state.audio.fx);
    o.start();
    o.stop(state.audio.ctx.currentTime+dur);
  }

  function startMusic(){
    if(!state.settings.music||!state.audio.unlocked) return;
    const ctx=state.audio.ctx;
    const o=ctx.createOscillator();
    const g=ctx.createGain();
    o.type="sine";
    o.frequency.value=220;
    g.gain.value=0.05;
    o.connect(g);
    g.connect(state.audio.music);
    o.start();
    state.audio._music=o;
  }

  function stopMusic(){
    try{ state.audio._music?.stop(); }catch{}
  }

  /* -------------------------
     ECONOMY
  ------------------------- */
  const tapMult=()=>1+state.save.tapMultLvl*0.25;
  const cityMult=()=>1+state.save.cityMultLvl*0.3;

  function tileDef(t){return TILES.find(x=>x.id===t.def);}
  function buyCost(t){return tileDef(t).baseCost*(1+t.idx*0.06);}
  function upCost(t){return tileDef(t).baseCost*0.8*Math.pow(1.55,t.lvl);}
  function tileIPS(t){
    if(!t.owned) return 0;
    return tileDef(t).baseIncome*(1+t.lvl*0.35)*cityMult();
  }
  function tileTap(t){
    const base=tileDef(t).tapBase;
    return base*(t.owned?(1+t.lvl*0.22):0.45)*tapMult();
  }

  const totalIPS=()=>state.save.tiles.reduce((s,t)=>s+tileIPS(t),0);
  const avgTap=()=>state.save.tiles.reduce((s,t)=>s+tileTap(t),0)/GRID_COUNT;

  /* -------------------------
     SAVE / LOAD
  ------------------------- */
  function loadGame(){
    try{
      const s=JSON.parse(localStorage.getItem(SAVE_KEY));
      if(s) state.save={...defaultSave(),...s};
    }catch{}
  }
  function saveGame(){
    state.save.lastTs=Date.now();
    localStorage.setItem(SAVE_KEY,JSON.stringify(state.save));
  }

  /* -------------------------
     OFFLINE
  ------------------------- */
  function calcOffline(){
    const now=Date.now();
    const dt=Math.min((now-state.save.lastTs)/1000,OFFLINE_CAP_SECONDS);
    const earned=dt*totalIPS();
    if(earned>1) state.save.pendingOffline+=earned;
    state.save.lastTs=now;
  }

  /* -------------------------
     UI
  ------------------------- */
  function toast(msg){
    const t=$("toast");
    t.textContent=msg;
    t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"),1800);
  }

  function updateHUD(){
    $("cashText").textContent=fmt(state.save.cash);
    $("ipsText").textContent=fmt(totalIPS());
    $("tapText").textContent=fmt(avgTap());
  }

  function renderGrid(){
    const g=$("tileGrid");
    g.innerHTML="";
    state.save.tiles.forEach(t=>{
      const el=document.createElement("div");
      el.className="tile "+(t.owned?"tileOwned":"tileLocked");
      el.innerHTML=`
        <div class="tileName">${tileDef(t).name}</div>
        <div class="tiny">Tap ${fmt(tileTap(t))}</div>
        <div class="tiny">IPS ${fmt(tileIPS(t))}</div>
        <button>${t.owned?"Upgrade":"Buy"}</button>
      `;
      el.onclick=()=>{
        unlockAudio();
        state.save.cash+=tileTap(t);
        playTone(t.owned?660:520);
        updateHUD();
      };
      el.querySelector("button").onclick=(e)=>{
        e.stopPropagation();
        unlockAudio();
        if(!t.owned){
          const c=buyCost(t);
          if(state.save.cash<c) return toast("Not enough cash");
          state.save.cash-=c;
          t.owned=true;
          playTone(880);
        }else{
          const c=upCost(t);
          if(state.save.cash<c) return toast("Not enough cash");
          state.save.cash-=c;
          t.lvl++;
          playTone(980);
        }
        renderGrid(); updateHUD(); saveGame();
      };
      g.appendChild(el);
    });
  }

  /* -------------------------
     MAIN LOOP
  ------------------------- */
  function loop(){
    state.save.cash+=totalIPS()*TICK_MS/1000;
    updateHUD();
    setTimeout(loop,TICK_MS);
  }

  /* -------------------------
     INIT
  ------------------------- */
  function init(){
    loadGame();
    calcOffline();
    renderGrid();
    updateHUD();
    loop();
    setInterval(saveGame,AUTOSAVE_MS);
    window.addEventListener("pointerdown",unlockAudio,{once:true});
  }

  document.readyState==="loading"
    ? document.addEventListener("DOMContentLoaded",init)
    : init();
})();
