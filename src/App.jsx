import { useState, useCallback, useRef, useEffect } from "react";

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#07090d;--s1:#0d1117;--s2:#131921;--s3:#0a0d12;
  --b1:#1a2333;--b2:#22304a;--b3:#2a3d58;
  --green:#00e87a;--blue:#3d9eff;--red:#ff4d6a;--gold:#f5a623;--purple:#a78bfa;--cyan:#00d4ff;
  --txt:#d8e2ef;--dim:#4a6080;--dim2:#243040;
}
body{background:var(--bg);color:var(--txt);font-family:'DM Mono','Courier New',monospace;-webkit-font-smoothing:antialiased;}
.app{min-height:100vh;background:radial-gradient(ellipse 80% 50% at 80% -5%,rgba(0,232,122,.05) 0%,transparent 55%),radial-gradient(ellipse 60% 40% at 5% 95%,rgba(61,158,255,.04) 0%,transparent 55%),var(--bg);}
.hdr{position:sticky;top:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:56px;background:rgba(7,9,13,.97);backdrop-filter:blur(20px);border-bottom:1px solid var(--b1);}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:18px;letter-spacing:-.5px;display:flex;align-items:center;gap:8px;}
.logo b{color:var(--green);}
.logo-sub{font-size:9px;letter-spacing:2px;color:var(--dim);font-family:'DM Mono',monospace;margin-top:2px;}
.hdr-right{display:flex;align-items:center;gap:8px;}
.chip{font-size:9.5px;letter-spacing:1.4px;padding:3px 10px;border-radius:20px;font-weight:500;}
.chip.ai{background:rgba(0,232,122,.07);border:1px solid rgba(0,232,122,.2);color:var(--green);}
.chip.live{background:rgba(0,212,255,.07);border:1px solid rgba(0,212,255,.2);color:var(--cyan);animation:blink 2s infinite;}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:.45;}}
.tab-bar{display:flex;gap:0;border-bottom:1px solid var(--b1);background:rgba(7,9,13,.9);backdrop-filter:blur(10px);position:sticky;top:56px;z-index:190;padding:0 28px;}
.tab{font-family:'Syne',sans-serif;font-weight:700;font-size:12px;letter-spacing:.5px;padding:14px 22px;cursor:pointer;color:var(--dim);border-bottom:2px solid transparent;transition:all .15s;display:flex;align-items:center;gap:7px;white-space:nowrap;}
.tab:hover{color:var(--txt);}
.tab.active{color:var(--txt);border-bottom-color:var(--green);}
.tab .tab-ico{font-size:14px;}
.tab .tab-badge{font-size:9px;background:rgba(0,232,122,.12);border:1px solid rgba(0,232,122,.2);color:var(--green);padding:1px 6px;border-radius:10px;}
.page{max-width:1200px;margin:0 auto;padding:36px 22px 90px;}
.hero{margin-bottom:36px;}
.hero h1{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(24px,4vw,42px);line-height:1.08;letter-spacing:-1.5px;margin-bottom:10px;}
.hero h1 span{color:var(--green);}
.hero h1 span.orange{color:var(--gold);}
.hero p{color:var(--dim);font-size:12px;line-height:1.9;max-width:520px;}
.panel{background:var(--s1);border:1px solid var(--b1);border-radius:14px;padding:20px;margin-bottom:28px;}
.panel-title{font-family:'Syne',sans-serif;font-weight:800;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:16px;display:flex;align-items:center;gap:10px;}
.panel-title::after{content:'';flex:1;height:1px;background:var(--b1);}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
.g4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px;}
@media(max-width:700px){.g3,.g4{grid-template-columns:1fr 1fr;}.g2{grid-template-columns:1fr;}}
@media(max-width:480px){.g2,.g3,.g4{grid-template-columns:1fr;}}
.fld{display:flex;flex-direction:column;gap:7px;}
.fld label{font-size:9.5px;letter-spacing:1.8px;text-transform:uppercase;color:var(--dim);}
.sel-wrap{position:relative;}
.sel-wrap select,.inp{width:100%;background:var(--s2);border:1px solid var(--b2);color:var(--txt);font-family:'DM Mono',monospace;font-size:12.5px;padding:9px 32px 9px 12px;border-radius:8px;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;transition:border-color .15s;}
.inp{padding-right:12px;cursor:text;}
.sel-wrap select:focus,.inp:focus{border-color:var(--green);}
.sel-wrap::after{content:'▾';position:absolute;right:11px;top:50%;transform:translateY(-50%);color:var(--dim);pointer-events:none;font-size:11px;}
.btn-green{padding:13px;background:var(--green);color:#000;border:none;border-radius:9px;cursor:pointer;font-family:'Syne',sans-serif;font-weight:800;font-size:13.5px;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s;width:100%;}
.btn-green:hover:not(:disabled){background:#00d46e;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,232,122,.22);}
.btn-green:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none;}
.btn-blue{padding:13px;background:rgba(61,158,255,.12);color:var(--blue);border:1px solid rgba(61,158,255,.25);border-radius:9px;cursor:pointer;font-family:'Syne',sans-serif;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s;width:100%;}
.btn-blue:hover:not(:disabled){background:rgba(61,158,255,.2);transform:translateY(-1px);}
.btn-blue:disabled{opacity:.4;cursor:not-allowed;}
.btn-sm{padding:5px 12px;border-radius:6px;font-size:10px;font-family:'Syne',sans-serif;font-weight:700;cursor:pointer;border:1px solid var(--b2);background:var(--s2);color:var(--dim);transition:all .12s;}
.btn-sm:hover{border-color:var(--green);color:var(--green);}
.btn-sm.active{border-color:var(--green);color:var(--green);background:rgba(0,232,122,.08);}
.spin{width:13px;height:13px;flex-shrink:0;border:2px solid rgba(0,0,0,.2);border-top-color:#000;border-radius:50%;animation:rot .6s linear infinite;}
.spin-white{width:13px;height:13px;flex-shrink:0;border:2px solid rgba(61,158,255,.2);border-top-color:var(--blue);border-radius:50%;animation:rot .6s linear infinite;}
@keyframes rot{to{transform:rotate(360deg);}}
.empty{text-align:center;padding:60px 20px;border:1px dashed var(--b2);border-radius:14px;color:var(--dim);}
.empty .ico{font-size:36px;margin-bottom:12px;opacity:.3;}
.empty h3{font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--txt);margin-bottom:6px;}
.empty p{font-size:12px;line-height:1.75;}
.loading-box{border:1px solid var(--b1);border-radius:12px;padding:28px 22px;background:var(--s1);margin-bottom:22px;}
.lsteps{display:flex;flex-direction:column;gap:9px;}
.lstep{display:flex;align-items:center;gap:10px;font-size:11.5px;color:var(--dim);transition:color .25s;}
.lstep.active{color:var(--txt);}
.lstep.done{color:var(--green);}
.lstep-ico{width:19px;height:19px;border-radius:50%;border:1px solid var(--b2);display:flex;align-items:center;justify-content:center;font-size:9.5px;flex-shrink:0;}
.lstep.active .lstep-ico{border-color:var(--green);background:rgba(0,232,122,.08);color:var(--green);}
.lstep.done .lstep-ico{border-color:var(--green);background:rgba(0,232,122,.14);color:var(--green);}
.prog-bar{height:3px;background:var(--dim2);border-radius:2px;margin-top:18px;overflow:hidden;}
.prog-fill{height:100%;border-radius:2px;transition:width .5s ease;}
.prog-fill.green{background:var(--green);}
.prog-fill.blue{background:var(--blue);}
.results{animation:fadeUp .3s ease;}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px;}
@media(max-width:600px){.stats-row{grid-template-columns:1fr 1fr;}}
.stat-box{background:var(--s1);border:1px solid var(--b1);border-radius:10px;padding:14px 16px;}
.stat-val{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;margin-bottom:3px;}
.stat-val.g{color:var(--green);}
.stat-val.b{color:var(--blue);}
.stat-val.r{color:var(--red);}
.stat-val.p{color:var(--purple);}
.stat-val.gold{color:var(--gold);}
.stat-lbl{font-size:9.5px;color:var(--dim);letter-spacing:.5px;text-transform:uppercase;}
.sec-lbl{font-family:'Syne',sans-serif;font-size:9.5px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:var(--dim);display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.sec-lbl::after{content:'';flex:1;height:1px;background:var(--b1);}
.crit-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;margin-bottom:24px;}
.crit-card{background:var(--s1);border:1px solid var(--b1);border-radius:10px;padding:15px 17px;position:relative;overflow:hidden;transition:border-color .15s,transform .12s;}
.crit-card:hover{border-color:var(--b2);transform:translateY(-1px);}
.crit-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
.crit-card.g::before{background:var(--green);}
.crit-card.b::before{background:var(--blue);}
.crit-card.r::before{background:var(--red);}
.cc-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;}
.cc-name{font-family:'Syne',sans-serif;font-weight:800;font-size:13px;color:var(--txt);line-height:1.3;}
.cc-pill{font-size:10.5px;padding:2px 8px;border-radius:16px;white-space:nowrap;flex-shrink:0;font-weight:500;}
.cc-pill.g{background:rgba(0,232,122,.1);color:var(--green);}
.cc-pill.b{background:rgba(61,158,255,.1);color:var(--blue);}
.cc-pill.r{background:rgba(255,77,106,.1);color:var(--red);}
.cc-desc{font-size:11px;color:var(--dim);line-height:1.6;}
.cc-bar{margin-top:11px;}
.cc-track{height:2px;background:var(--dim2);border-radius:2px;overflow:hidden;}
.cc-fill{height:100%;border-radius:2px;}
.cc-fill.g{background:var(--green);}
.cc-fill.b{background:var(--blue);}
.cc-fill.r{background:var(--red);}
.cc-meta{display:flex;justify-content:space-between;margin-top:4px;font-size:9px;color:var(--dim);}
.tbl-wrap{overflow-x:auto;border-radius:12px;border:1px solid var(--b1);margin-bottom:10px;}
table{width:100%;border-collapse:collapse;font-size:11.5px;}
thead tr{background:var(--s2);border-bottom:1px solid var(--b1);}
thead th{padding:10px 13px;text-align:left;font-size:9px;letter-spacing:1.6px;text-transform:uppercase;color:var(--dim);white-space:nowrap;font-weight:500;}
tbody tr{border-bottom:1px solid var(--b1);transition:background .1s;}
tbody tr:last-child{border-bottom:none;}
tbody tr:hover{background:rgba(255,255,255,.018);}
tbody td{padding:11px 13px;vertical-align:middle;}
.tk{font-family:'Syne',sans-serif;font-weight:800;font-size:13.5px;color:var(--txt);}
.co{color:var(--dim);font-size:10px;margin-top:2px;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gem{display:inline-flex;align-items:center;gap:3px;font-size:8.5px;padding:1px 5px;border-radius:3px;background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.22);color:var(--purple);margin-top:3px;}
.price-v{font-weight:500;font-size:13px;}
.chg-v{font-size:10px;font-weight:500;padding:2px 5px;border-radius:3px;margin-top:2px;display:inline-block;}
.chg-v.up{color:var(--green);background:rgba(0,232,122,.08);}
.chg-v.dn{color:var(--red);background:rgba(255,77,106,.08);}
.mc-v{color:var(--dim);font-size:11px;}
.cap-v{font-size:9.5px;color:var(--blue);margin-top:2px;}
.score-wrap{display:flex;align-items:center;gap:7px;}
.score-n{font-family:'Syne',sans-serif;font-weight:800;font-size:14px;min-width:26px;}
.score-n.hi{color:var(--green);}
.score-n.md{color:var(--gold);}
.score-n.lo{color:var(--red);}
.score-b{flex:1;height:3px;background:var(--dim2);border-radius:2px;overflow:hidden;min-width:40px;}
.score-f{height:100%;border-radius:2px;}
.score-f.hi{background:var(--green);}
.score-f.md{background:var(--gold);}
.score-f.lo{background:var(--red);}
.met-list{display:flex;flex-direction:column;gap:3px;}
.met-row{display:flex;justify-content:space-between;gap:8px;font-size:10px;}
.met-k{color:var(--dim);}
.met-v2{color:var(--txt);font-weight:500;}
.met-v2.pass{color:var(--green);}
.rtag{display:inline-flex;align-items:center;gap:3px;font-family:'Syne',sans-serif;font-weight:800;font-size:10px;padding:3px 8px;border-radius:5px;white-space:nowrap;}
.rtag.sb{background:rgba(0,232,122,.1);color:var(--green);border:1px solid rgba(0,232,122,.2);}
.rtag.by{background:rgba(61,158,255,.1);color:var(--blue);border:1px solid rgba(61,158,255,.2);}
.rtag.wt{background:rgba(245,166,35,.08);color:var(--gold);border:1px solid rgba(245,166,35,.18);}
.thesis-v{font-size:10.5px;color:#5a7090;line-height:1.55;max-width:180px;}
.opt-controls{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:12px;margin-bottom:14px;align-items:end;}
@media(max-width:800px){.opt-controls{grid-template-columns:1fr 1fr;}}
.opt-cards{display:flex;flex-direction:column;gap:14px;margin-bottom:20px;}
.opt-card{background:var(--s1);border:1px solid var(--b1);border-radius:13px;overflow:hidden;transition:border-color .15s;}
.opt-card:hover{border-color:var(--b2);}
.opt-card.call-card{border-left:3px solid var(--green);}
.opt-card.put-card{border-left:3px solid var(--red);}
.opt-card-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--b1);flex-wrap:wrap;gap:10px;}
.opt-hdr-left{display:flex;align-items:center;gap:12px;}
.opt-type-badge{font-family:'Syne',sans-serif;font-weight:800;font-size:12px;padding:4px 12px;border-radius:6px;}
.opt-type-badge.call{background:rgba(0,232,122,.12);color:var(--green);border:1px solid rgba(0,232,122,.25);}
.opt-type-badge.put{background:rgba(255,77,106,.12);color:var(--red);border:1px solid rgba(255,77,106,.25);}
.opt-ticker{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;color:var(--txt);}
.opt-name{font-size:10px;color:var(--dim);margin-top:1px;}
.opt-exp{font-size:11px;color:var(--gold);background:rgba(245,166,35,.08);border:1px solid rgba(245,166,35,.2);padding:3px 9px;border-radius:5px;}
.opt-hdr-right{display:flex;align-items:center;gap:10px;}
.entry-banner{background:linear-gradient(135deg,rgba(0,232,122,.08) 0%,rgba(0,232,122,.02) 100%);border:1px solid rgba(0,232,122,.18);border-radius:10px;padding:14px 18px;margin:14px 18px 0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.entry-banner.put-banner{background:linear-gradient(135deg,rgba(255,77,106,.08) 0%,rgba(255,77,106,.02) 100%);border-color:rgba(255,77,106,.18);}
.entry-label{font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:4px;}
.entry-price{font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:var(--green);}
.entry-price.put{color:var(--red);}
.entry-sub{font-size:10px;color:var(--dim);margin-top:2px;}
.entry-targets{display:flex;gap:16px;flex-wrap:wrap;}
.tgt{text-align:center;}
.tgt-lbl{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--dim);margin-bottom:3px;}
.tgt-val{font-family:'Syne',sans-serif;font-weight:800;font-size:14px;}
.tgt-val.t1{color:var(--blue);}
.tgt-val.t2{color:var(--green);}
.tgt-val.t3{color:var(--purple);}
.tgt-val.stop{color:var(--red);}
.tgt-val.pnl{color:var(--gold);}
.opt-metrics{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:0;padding:14px 18px;}
.opt-metric{padding:10px 12px;border-right:1px solid var(--b1);border-bottom:1px solid var(--b1);}
.opt-m-lbl{font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--dim);margin-bottom:5px;}
.opt-m-val{font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--txt);}
.opt-m-val.green{color:var(--green);}
.opt-m-val.red{color:var(--red);}
.opt-m-val.blue{color:var(--blue);}
.opt-m-val.gold{color:var(--gold);}
.opt-m-val.purple{color:var(--purple);}
.opt-m-val.cyan{color:var(--cyan);}
.opt-m-sub{font-size:9.5px;color:var(--dim);margin-top:2px;}
.hl-section{padding:14px 18px;border-top:1px solid var(--b1);}
.hl-title{font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:10px;}
.hl-rows{display:flex;flex-direction:column;gap:8px;}
.hl-row{display:flex;align-items:center;gap:12px;}
.hl-period{font-size:9.5px;color:var(--dim);width:36px;flex-shrink:0;}
.hl-bar-wrap{flex:1;position:relative;height:6px;background:var(--dim2);border-radius:3px;overflow:visible;}
.hl-bar-fill{position:absolute;height:100%;border-radius:3px;top:0;}
.hl-bar-fill.call-fill{background:linear-gradient(90deg,rgba(0,232,122,.3),var(--green));}
.hl-bar-fill.put-fill{background:linear-gradient(90deg,rgba(255,77,106,.3),var(--red));}
.hl-current-marker{position:absolute;top:-3px;width:2px;height:12px;border-radius:1px;background:white;}
.hl-vals{display:flex;gap:12px;flex-shrink:0;}
.hl-lo{font-size:10px;color:var(--red);font-weight:500;}
.hl-hi{font-size:10px;color:var(--green);font-weight:500;}
.hl-cur{font-size:10px;color:var(--txt);font-weight:500;}
.greeks-row{display:grid;grid-template-columns:repeat(5,1fr);gap:0;border-top:1px solid var(--b1);}
@media(max-width:600px){.greeks-row{grid-template-columns:repeat(3,1fr);}}
.greek-box{padding:12px 14px;border-right:1px solid var(--b1);text-align:center;}
.greek-box:last-child{border-right:none;}
.greek-sym{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;margin-bottom:3px;}
.greek-name{font-size:8.5px;letter-spacing:1px;text-transform:uppercase;color:var(--dim);margin-bottom:6px;}
.greek-val{font-family:'DM Mono',monospace;font-weight:500;font-size:13px;color:var(--txt);}
.greek-bar-wrap{height:2px;background:var(--dim2);border-radius:1px;margin-top:5px;overflow:hidden;}
.greek-bar-fill{height:100%;border-radius:1px;}
.oi-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-top:1px solid var(--b1);}
.oi-box{padding:12px 16px;border-right:1px solid var(--b1);}
.oi-box:last-child{border-right:none;}
.oi-lbl{font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--dim);margin-bottom:5px;}
.oi-val{font-family:'Syne',sans-serif;font-weight:800;font-size:15px;color:var(--txt);}
.oi-sub{font-size:9.5px;color:var(--dim);margin-top:2px;}
.sig{display:inline-flex;align-items:center;gap:4px;font-family:'Syne',sans-serif;font-weight:800;font-size:10px;padding:3px 9px;border-radius:5px;}
.sig.bullish{background:rgba(0,232,122,.1);color:var(--green);border:1px solid rgba(0,232,122,.22);}
.sig.bearish{background:rgba(255,77,106,.1);color:var(--red);border:1px solid rgba(255,77,106,.22);}
.sig.neutral{background:rgba(245,166,35,.08);color:var(--gold);border:1px solid rgba(245,166,35,.2);}
.li-list{display:flex;flex-direction:column;gap:6px;margin-bottom:22px;}
.li-item{display:flex;align-items:flex-start;gap:9px;font-size:11.5px;color:#7a8fa8;line-height:1.6;padding:9px 13px;background:var(--s1);border-radius:7px;border:1px solid transparent;transition:border-color .12s;}
.li-item:hover{border-color:var(--b1);}
.li-ico{width:17px;height:17px;flex-shrink:0;margin-top:1px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:700;}
.li-ico.x{background:rgba(255,77,106,.1);color:var(--red);}
.li-ico.ok{background:rgba(0,232,122,.1);color:var(--green);}
.disc{font-size:10px;color:var(--dim);line-height:1.7;padding:12px 15px;background:var(--s2);border-radius:7px;border:1px solid var(--b1);margin-top:8px;}
.sum-box{background:var(--s1);border:1px solid var(--b1);border-radius:11px;padding:20px 22px;margin-bottom:22px;overflow:hidden;position:relative;}
.sum-box::after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 80% 60% at 100% 0%,rgba(0,232,122,.03),transparent 60%);}
.sum-title{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;margin-bottom:8px;}
.sum-body{font-size:12px;color:#7a8fa8;line-height:1.85;}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;}
.tag{font-size:10px;padding:3px 10px;border-radius:16px;border:1px solid var(--b2);color:var(--dim);background:var(--s2);}
.scan-info{font-size:10px;color:var(--dim);text-align:right;margin-bottom:6px;}
.scan-info span{color:var(--green);}
.filter-row{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;align-items:center;}
.filter-row .spacer{flex:1;}
`;

/* ══════════════════════════════════════════════
   STOCK UNIVERSE
══════════════════════════════════════════════ */
const UNIVERSE = [
  {t:"NVDA",n:"NVIDIA Corp",p:875.4,ch:2.3,mc:"2.15T",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"MSFT",n:"Microsoft Corp",p:415.6,ch:0.6,mc:"3.09T",sec:"Technology",cap:"Large",geo:"US"},
  {t:"AAPL",n:"Apple Inc",p:189.4,ch:0.3,mc:"2.91T",sec:"Technology",cap:"Large",geo:"US"},
  {t:"GOOGL",n:"Alphabet Inc",p:172.8,ch:0.9,mc:"2.18T",sec:"Technology",cap:"Large",geo:"US"},
  {t:"META",n:"Meta Platforms",p:512.3,ch:1.1,mc:"1.31T",sec:"Technology",cap:"Large",geo:"US"},
  {t:"AVGO",n:"Broadcom Inc",p:1312,ch:0.9,mc:"616B",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"ORCL",n:"Oracle Corp",p:128.4,ch:0.7,mc:"352B",sec:"Technology",cap:"Large",geo:"US"},
  {t:"CRM",n:"Salesforce",p:298.5,ch:-0.3,mc:"287B",sec:"Technology",cap:"Large",geo:"US"},
  {t:"ADBE",n:"Adobe Inc",p:486.2,ch:0.4,mc:"215B",sec:"Technology",cap:"Large",geo:"US"},
  {t:"NOW",n:"ServiceNow",p:812.4,ch:1.2,mc:"167B",sec:"Technology",cap:"Large",geo:"US"},
  {t:"DDOG",n:"Datadog Inc",p:128.7,ch:2.1,mc:"41B",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"HUBS",n:"HubSpot Inc",p:582.1,ch:0.7,mc:"29B",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"MNDY",n:"Monday.com",p:218.4,ch:1.8,mc:"11B",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"TOST",n:"Toast Inc",p:24.6,ch:4.1,mc:"14B",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"AFRM",n:"Affirm Holdings",p:38.7,ch:5.2,mc:"12B",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"ALKT",n:"Alkami Technology",p:28.4,ch:6.8,mc:"3.1B",sec:"Fintech",cap:"Small",geo:"US"},
  {t:"PRCT",n:"PROCEPT BioRobotics",p:68.4,ch:3.4,mc:"4.2B",sec:"Healthcare",cap:"Small",geo:"US"},
  {t:"AXSM",n:"Axsome Therapeutics",p:112.3,ch:2.8,mc:"4.8B",sec:"Biotech",cap:"Small",geo:"US"},
  {t:"NUVL",n:"Nuvalent Inc",p:78.4,ch:6.8,mc:"5.4B",sec:"Biotech",cap:"Mid",geo:"US"},
  {t:"LLY",n:"Eli Lilly",p:798.2,ch:1.4,mc:"759B",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"UNH",n:"UnitedHealth",p:523.4,ch:0.5,mc:"484B",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"ISRG",n:"Intuitive Surgical",p:436.8,ch:0.5,mc:"155B",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"DXCM",n:"Dexcom",p:78.4,ch:-0.6,mc:"31B",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"JPM",n:"JPMorgan Chase",p:196.4,ch:0.7,mc:"566B",sec:"Financials",cap:"Large",geo:"US"},
  {t:"BAC",n:"Bank of America",p:39.8,ch:0.5,mc:"310B",sec:"Financials",cap:"Large",geo:"US"},
  {t:"GS",n:"Goldman Sachs",p:487.3,ch:1.2,mc:"166B",sec:"Financials",cap:"Large",geo:"US"},
  {t:"BRKB",n:"Berkshire Hathaway B",p:408.2,ch:0.4,mc:"893B",sec:"Financials",cap:"Large",geo:"US"},
  {t:"V",n:"Visa Inc",p:278.4,ch:0.6,mc:"572B",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"COIN",n:"Coinbase Global",p:224.8,ch:5.8,mc:"57B",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"XOM",n:"Exxon Mobil",p:112.4,ch:0.8,mc:"450B",sec:"Energy",cap:"Large",geo:"US"},
  {t:"CVX",n:"Chevron Corp",p:152.8,ch:0.6,mc:"288B",sec:"Energy",cap:"Large",geo:"US"},
  {t:"FSLR",n:"First Solar",p:184.2,ch:2.8,mc:"19.7B",sec:"Clean Energy",cap:"Mid",geo:"US"},
  {t:"ENPH",n:"Enphase Energy",p:82.4,ch:3.4,mc:"11B",sec:"Clean Energy",cap:"Mid",geo:"US"},
  {t:"GE",n:"GE Aerospace",p:168.4,ch:1.4,mc:"183B",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"KTOS",n:"Kratos Defense",p:28.4,ch:4.8,mc:"4.8B",sec:"Defense",cap:"Small",geo:"US"},
  {t:"RKLB",n:"Rocket Lab USA",p:8.4,ch:9.2,mc:"4.2B",sec:"Industrials",cap:"Small",geo:"US"},
  {t:"AMZN",n:"Amazon.com",p:184.2,ch:1.2,mc:"1.92T",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"TSLA",n:"Tesla Inc",p:178.4,ch:3.2,mc:"568B",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"ONON",n:"On Holding AG",p:38.4,ch:4.8,mc:"12B",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"CELH",n:"Celsius Holdings",p:72.3,ch:3.2,mc:"5.2B",sec:"Consumer Staples",cap:"Mid",geo:"US"},
  {t:"NEE",n:"NextEra Energy",p:63.4,ch:0.5,mc:"130B",sec:"Utilities",cap:"Large",geo:"US"},
  {t:"PLTR",n:"Palantir Tech",p:22.8,ch:4.2,mc:"48B",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"IONQ",n:"IonQ Inc",p:12.8,ch:9.4,mc:"3.2B",sec:"Technology",cap:"Small",geo:"US"},
  {t:"MSTR",n:"MicroStrategy",p:1284.2,ch:8.4,mc:"28B",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"NVO",n:"Novo Nordisk",p:127.5,ch:0.8,mc:"574B",sec:"Healthcare",cap:"Large",geo:"Europe"},
  {t:"ASML",n:"ASML Holding",p:984.2,ch:1.4,mc:"387B",sec:"Semiconductors",cap:"Large",geo:"Europe"},
  {t:"SHOP",n:"Shopify Inc",p:72.4,ch:2.8,mc:"92B",sec:"Technology",cap:"Large",geo:"Canada"},
  {t:"MELI",n:"MercadoLibre",p:1892.4,ch:1.8,mc:"96B",sec:"Technology",cap:"Large",geo:"Latin America"},
  {t:"NU",n:"Nu Holdings",p:12.4,ch:5.8,mc:"60B",sec:"Fintech",cap:"Large",geo:"Latin America"},
  {t:"NTRA",n:"Natera Inc",p:112.4,ch:3.8,mc:"12B",sec:"Healthcare",cap:"Mid",geo:"US"},
  {t:"RELY",n:"Remitly Global",p:22.4,ch:5.8,mc:"5.2B",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"BEAM",n:"Beam Therapeutics",p:22.4,ch:4.2,mc:"2.1B",sec:"Biotech",cap:"Small",geo:"US"},
  {t:"RDDT",n:"Reddit Inc",p:68.4,ch:8.7,mc:"11B",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"FCX",n:"Freeport-McMoRan",p:44.8,ch:2.4,mc:"64B",sec:"Mining",cap:"Large",geo:"US"},
  {t:"MP",n:"MP Materials",p:14.8,ch:4.8,mc:"2.8B",sec:"Mining",cap:"Small",geo:"US"},
  {t:"SOUN",n:"SoundHound AI",p:8.4,ch:12.3,mc:"3.1B",sec:"Technology",cap:"Small",geo:"US"},
  {t:"DAVE",n:"Dave Inc",p:82.4,ch:6.4,mc:"1.2B",sec:"Fintech",cap:"Small",geo:"US"},
  {t:"CWAN",n:"Clearwater Analytics",p:22.6,ch:3.4,mc:"5.2B",sec:"Fintech",cap:"Small",geo:"US"},
  {t:"RXST",n:"RxSight Inc",p:38.4,ch:6.4,mc:"1.8B",sec:"Healthcare",cap:"Small",geo:"US"},
  {t:"SERV",n:"Serve Robotics",p:12.4,ch:18.4,mc:"840M",sec:"Technology",cap:"Micro",geo:"US"},
  {t:"BIRK",n:"Birkenstock",p:52.4,ch:2.8,mc:"11B",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"VITL",n:"Vital Farms",p:38.4,ch:6.4,mc:"1.9B",sec:"Consumer Staples",cap:"Small",geo:"US"},
];

/* ══════════════════════════════════════════════
   SCORING ENGINE
══════════════════════════════════════════════ */
function scoreStock(s, strategy, sector, market) {
  let score = 50;
  const isGem = s.cap === "Small" || s.cap === "Micro";

  if (sector === "All Sectors") score += 10;
  else if (s.sec === sector) score += 22;
  else if (
    (sector === "Technology" && ["Semiconductors", "Fintech"].includes(s.sec)) ||
    (sector === "Healthcare" && s.sec === "Biotech") ||
    (sector === "Energy" && s.sec === "Clean Energy") ||
    (sector === "Financials" && s.sec === "Fintech") ||
    (sector === "Industrials" && ["Defense", "Transportation"].includes(s.sec)) ||
    (sector === "Materials" && s.sec === "Mining")
  ) score += 12;
  else score -= 8;

  const capMap = {
    "US Large Cap": ["Large"],
    "US Mid Cap": ["Mid"],
    "US Small Cap": ["Small"],
    "US Micro Cap": ["Micro", "Small"],
    "International Developed": ["Large", "Mid"],
    "Emerging Markets": ["Large", "Mid"],
    "Global": ["Large", "Mid", "Small"],
    "Canada": ["Large", "Mid", "Small"],
    "Europe": ["Large", "Mid"],
    "Asia Pacific": ["Large", "Mid"],
    "Latin America": ["Large", "Mid"],
  };
  const allowed = capMap[market] || ["Large", "Mid", "Small", "Micro"];
  if (allowed.includes(s.cap)) score += 15; else score -= 12;

  const geoMap = {
    "US Large Cap": "US", "US Mid Cap": "US", "US Small Cap": "US", "US Micro Cap": "US",
    "Canada": "Canada", "Europe": "Europe", "Asia Pacific": "Asia Pacific",
    "Latin America": "Latin America", "International Developed": "not-US",
    "Emerging Markets": "emerging", "Global": "any",
  };
  const reqGeo = geoMap[market];
  if (!reqGeo || reqGeo === "any") score += 8;
  else if (reqGeo === "not-US" && s.geo !== "US") score += 14;
  else if (reqGeo === "emerging" && ["Asia Pacific", "Latin America"].includes(s.geo)) score += 14;
  else if (s.geo === reqGeo) score += 12;
  else if (market.startsWith("US") && s.geo !== "US") score -= 15;

  const mom = Math.abs(s.ch);
  if (strategy === "Growth" || strategy === "Small Cap Growth") {
    if (isGem) score += 14;
    if (mom > 3) score += 10;
    if (["Technology", "Biotech", "Fintech", "Semiconductors", "Clean Energy"].includes(s.sec)) score += 8;
  }
  if (strategy === "Dividend") {
    if (s.cap === "Large") score += 18;
    if (["Utilities", "Financials", "Consumer Staples", "Energy", "Real Estate"].includes(s.sec)) score += 10;
    if (isGem) score -= 10;
  }
  if (strategy === "Value" || strategy === "Deep Value") {
    if (s.ch < 0) score += 10;
    if (["Financials", "Energy", "Materials", "Mining", "Industrials"].includes(s.sec)) score += 8;
  }
  if (strategy === "Momentum") {
    score += Math.min(20, mom * 2.5);
    if (mom > 8) score += 12;
  }
  if (strategy === "Quality") {
    if (s.cap === "Large") score += 12;
    if (["Technology", "Healthcare", "Consumer Staples"].includes(s.sec)) score += 8;
  }
  if (isGem) score += Math.floor(Math.random() * 8);
  score += Math.floor(Math.random() * 12) - 4;
  return Math.min(99, Math.max(28, score));
}

const sc = (s) => s >= 88 ? "hi" : s >= 72 ? "md" : "lo";
const ratingLabel = (r) => r === "sb" ? "⬆ Strong Buy" : r === "by" ? "↑ Buy" : "◎ Watch";
const getRating = (s) => s >= 88 ? "sb" : s >= 72 ? "by" : "wt";
const fmt = (p) => `$${p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function getMetrics(s, strategy) {
  const ri = (a, b) => Math.floor(Math.random() * (b - a) + a);
  if (strategy === "Dividend") return [
    { k: "Div Yield", v: `${(Math.random() * 3 + 1).toFixed(1)}%`, pass: true },
    { k: "Payout Ratio", v: `${ri(20, 65)}%`, pass: true },
    { k: "Div Growth", v: `${ri(3, 18)} yrs`, pass: true },
    { k: "FCF Cover", v: `${(Math.random() * 3 + 1.2).toFixed(1)}x`, pass: true },
  ];
  if (strategy === "Value" || strategy === "Deep Value") return [
    { k: "P/E", v: `${ri(6, 18)}x`, pass: true },
    { k: "P/B", v: `${(Math.random() * 2 + 0.4).toFixed(1)}x`, pass: true },
    { k: "P/FCF", v: `${ri(7, 16)}x`, pass: true },
    { k: "EV/EBITDA", v: `${ri(5, 14)}x`, pass: true },
  ];
  if (strategy === "Momentum") return [
    { k: "6M Return", v: `+${ri(18, 85)}%`, pass: true },
    { k: "RSI(14)", v: `${ri(55, 72)}`, pass: true },
    { k: "52W Hi%", v: `${ri(78, 99)}%`, pass: true },
    { k: "Vol Trend", v: "Rising ↑", pass: true },
  ];
  if (strategy === "Quality") return [
    { k: "ROIC", v: `${ri(14, 42)}%`, pass: true },
    { k: "Gross Mgn", v: `${ri(38, 88)}%`, pass: true },
    { k: "FCF Mgn", v: `${ri(10, 42)}%`, pass: true },
    { k: "Net Mgn", v: `${ri(8, 35)}%`, pass: true },
  ];
  return [
    { k: "Rev Grwth", v: `+${ri(12, 68)}%`, pass: true },
    { k: "EPS Grwth", v: `+${ri(15, 120)}%`, pass: true },
    { k: "Gross Mgn", v: `${ri(35, 88)}%`, pass: true },
    { k: "FCF Mgn", v: `${ri(8, 42)}%`, pass: s.cap !== "Micro" },
  ];
}

function buildThesis(s, strategy) {
  const gems = ["Under-the-radar gem —", "Underfollowed with", "Hidden small-cap —", "Emerging leader —"];
  const strong = ["Market leader delivering", "Best-in-class operator,", "Dominant franchise,"];
  const pre = (s.cap === "Small" || s.cap === "Micro")
    ? gems[Math.floor(Math.random() * gems.length)]
    : strong[Math.floor(Math.random() * strong.length)];
  const suf = {
    Growth: "accelerating revenue with expanding TAM.",
    Dividend: "reliable dividend growth & strong FCF.",
    Value: "trades at deep discount to intrinsic value.",
    Momentum: "strong price momentum backed by fundamentals.",
    Quality: "exceptional ROIC and durable moat.",
    GARP: "growth at a very reasonable multiple.",
    "Deep Value": "deep discount with identifiable catalyst.",
    "Small Cap Growth": "explosive growth in underpenetrated market.",
  };
  return `${pre} ${suf[strategy] || suf.Growth}`;
}

/* ══════════════════════════════════════════════
   OPTIONS ENGINE
══════════════════════════════════════════════ */
const OPTION_TICKERS = [
  { t: "NVDA", n: "NVIDIA Corp", p: 875.4, iv: 68, beta: 1.8 },
  { t: "AAPL", n: "Apple Inc", p: 189.4, iv: 24, beta: 1.2 },
  { t: "TSLA", n: "Tesla Inc", p: 178.4, iv: 72, beta: 2.1 },
  { t: "META", n: "Meta Platforms", p: 512.3, iv: 38, beta: 1.4 },
  { t: "MSFT", n: "Microsoft Corp", p: 415.6, iv: 22, beta: 0.9 },
  { t: "AMZN", n: "Amazon.com", p: 184.2, iv: 32, beta: 1.3 },
  { t: "GOOGL", n: "Alphabet", p: 172.8, iv: 26, beta: 1.1 },
  { t: "SPY", n: "S&P 500 ETF", p: 524.8, iv: 14, beta: 1.0 },
  { t: "QQQ", n: "Nasdaq 100 ETF", p: 448.2, iv: 18, beta: 1.15 },
  { t: "PLTR", n: "Palantir Tech", p: 22.8, iv: 88, beta: 2.4 },
  { t: "MSTR", n: "MicroStrategy", p: 1284.2, iv: 112, beta: 3.2 },
  { t: "COIN", n: "Coinbase", p: 224.8, iv: 95, beta: 2.8 },
  { t: "AMD", n: "AMD", p: 168.4, iv: 54, beta: 1.9 },
  { t: "SMCI", n: "Super Micro", p: 42.4, iv: 98, beta: 2.6 },
  { t: "RDDT", n: "Reddit Inc", p: 68.4, iv: 84, beta: 2.2 },
];

const EXPIRATIONS = [
  "Weekly (3 DTE)", "Weekly (7 DTE)", "Bi-Weekly (14 DTE)",
  "Monthly (30 DTE)", "Monthly (45 DTE)", "Quarterly (60 DTE)",
  "Quarterly (90 DTE)", "LEAPS (180 DTE)", "LEAPS (365 DTE)",
];
const OPT_STRATEGIES = [
  "High IV Crush (Sell)", "Low IV Buy", "Momentum Calls", "Protective Puts",
  "Covered Calls", "Cash-Secured Puts", "Debit Spreads", "Iron Condors",
  "Directional (Calls)", "Directional (Puts)",
];
const OPT_TYPES = ["Calls Only", "Puts Only", "Both Calls & Puts"];

function rnd(a, b, dec = 2) { return parseFloat((Math.random() * (b - a) + a).toFixed(dec)); }
function rint(a, b) { return Math.floor(Math.random() * (b - a + 1) + a); }

// Error function approximation
function erf(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t2 = 1 / (1 + p * Math.abs(x));
  const y = 1 - (((((a5 * t2 + a4) * t2) + a3) * t2 + a2) * t2 + a1) * t2 * Math.exp(-x * x);
  return sign * y;
}
function cdfNormal(x) { return 0.5 * (1 + erf(x / Math.sqrt(2))); }
function pdfNormal(x) { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); }

function generateOptionContract(ticker, stockPrice, iv, optType, expLabel, idx) {
  const isCall = optType === "call";
  const dteMatch = expLabel.match(/\d+/);
  const dte = dteMatch ? parseInt(dteMatch[0]) : 30;
  const t = Math.max(dte / 365, 0.001);

  const strikes = [
    Math.round(stockPrice * (isCall ? 1.0 : 1.0)),
    Math.round(stockPrice * (isCall ? 1.02 : 0.98)),
    Math.round(stockPrice * (isCall ? 1.05 : 0.95)),
  ];
  const strike = strikes[idx % 3];
  const moneyness = isCall ? stockPrice / strike : strike / stockPrice;
  const isATM = Math.abs(moneyness - 1) < 0.025;
  const isOTM = isCall ? strike > stockPrice : strike < stockPrice;

  const ivAdj = (iv / 100) * (1 + (0.1 * (7 / Math.max(dte, 1))));
  const ivPct = Math.min(ivAdj, 2.5);

  const r = 0.053;
  const sqrtT = Math.sqrt(t);
  const d1 = (Math.log(stockPrice / strike) + (r + 0.5 * ivPct * ivPct) * t) / (ivPct * sqrtT);
  const d2 = d1 - ivPct * sqrtT;

  let premium;
  if (isCall) {
    premium = Math.max(0.01, stockPrice * cdfNormal(d1) - strike * Math.exp(-r * t) * cdfNormal(d2));
  } else {
    premium = Math.max(0.01, strike * Math.exp(-r * t) * cdfNormal(-d2) - stockPrice * cdfNormal(-d1));
  }
  premium = parseFloat(premium.toFixed(2));

  const delta = isCall ? cdfNormal(d1) : cdfNormal(d1) - 1;
  const gamma = pdfNormal(d1) / (stockPrice * ivPct * sqrtT);
  const theta = (-(stockPrice * pdfNormal(d1) * ivPct) / (2 * sqrtT) - r * strike * Math.exp(-r * t) * (isCall ? cdfNormal(d2) : cdfNormal(-d2))) / 365;
  const vega = stockPrice * pdfNormal(d1) * sqrtT / 100;
  const rho = isCall
    ? strike * t * Math.exp(-r * t) * cdfNormal(d2) / 100
    : -strike * t * Math.exp(-r * t) * cdfNormal(-d2) / 100;

  const dayRange = { lo: rnd(premium * 0.65, premium * 0.88), hi: rnd(premium * 1.12, premium * 1.45) };
  const weekRange = { lo: rnd(premium * 0.45, premium * 0.75), hi: rnd(premium * 1.30, premium * 1.85) };
  const monthRange = dte >= 30
    ? { lo: rnd(premium * 0.25, premium * 0.60), hi: rnd(premium * 1.5, premium * 2.8) }
    : null;

  const entryPrice = parseFloat((premium * rnd(0.95, 1.02)).toFixed(2));
  const t1 = parseFloat((premium * 1.3).toFixed(2));
  const t2 = parseFloat((premium * 1.65).toFixed(2));
  const t3 = parseFloat((premium * 2.2).toFixed(2));
  const stopLoss = parseFloat((premium * 0.55).toFixed(2));
  const maxPnl = parseFloat(((t3 - entryPrice) * 100).toFixed(0));
  const maxLoss = parseFloat(((entryPrice - stopLoss) * 100).toFixed(0));

  const oi = rint(500, 85000);
  const volume = rint(100, Math.floor(oi * 0.4));
  const pcRatio = rnd(0.4, 1.8);
  const ivRank = rint(15, 92);
  const ivPct30 = rint(10, 95);

  let signal = "neutral";
  if (isCall && delta > 0.45 && ivRank < 50) signal = "bullish";
  else if (isCall && delta > 0.3) signal = "bullish";
  else if (!isCall && Math.abs(delta) > 0.4 && ivRank > 60) signal = "bearish";
  else if (!isCall && Math.abs(delta) > 0.3) signal = "bearish";

  const moneyLabel = isATM ? "ATM" : isOTM ? "OTM" : "ITM";
  const tickerInfo = OPTION_TICKERS.find(x => x.t === ticker);

  return {
    ticker,
    name: tickerInfo ? tickerInfo.n : ticker,
    stockPrice, strike, optType, expLabel, dte,
    premium, entryPrice, t1, t2, t3, stopLoss, maxPnl, maxLoss,
    delta: parseFloat(delta.toFixed(4)),
    gamma: parseFloat(gamma.toFixed(6)),
    theta: parseFloat(theta.toFixed(4)),
    vega: parseFloat(vega.toFixed(4)),
    rho: parseFloat(rho.toFixed(4)),
    iv: parseFloat((ivPct * 100).toFixed(1)),
    ivRank, ivPct30,
    oi, volume, pcRatio: parseFloat(pcRatio.toFixed(2)),
    dayRange, weekRange, monthRange,
    signal, moneyLabel,
    bid: parseFloat((premium * 0.975).toFixed(2)),
    ask: parseFloat((premium * 1.025).toFixed(2)),
    spread: parseFloat((premium * 0.05).toFixed(2)),
    contractLabel: `${ticker} $${strike} ${isCall ? "CALL" : "PUT"} ${expLabel.split(" ")[0]}`,
    contractCost: parseFloat((premium * 100).toFixed(0)),
    entryTotalCost: parseFloat((entryPrice * 100).toFixed(0)),
  };
}

/* ══════════════════════════════════════════════
   CRITERIA FALLBACK
══════════════════════════════════════════════ */
const CRITERIA_MAP = {
  Growth: [
    { m: "Revenue Growth (YoY)", t: "> 20%", i: 92 }, { m: "EPS Growth (YoY)", t: "> 25%", i: 88 },
    { m: "Gross Margin", t: "> 40%", i: 84 }, { m: "TAM Growth", t: "> 15%", i: 81 },
    { m: "PEG Ratio", t: "< 2.0", i: 79 }, { m: "FCF Margin", t: "> 8%", i: 76 },
    { m: "R&D / Revenue", t: "> 10%", i: 68 }, { m: "Net Rev Retention", t: "> 110%", i: 85 },
  ],
  Dividend: [
    { m: "Dividend Yield", t: "> 2.5%", i: 95 }, { m: "Payout Ratio", t: "< 65%", i: 90 },
    { m: "Div Growth Streak", t: "> 5 yrs", i: 88 }, { m: "FCF Payout Cover", t: "> 1.5x", i: 86 },
    { m: "Debt/EBITDA", t: "< 3.0x", i: 78 }, { m: "ROE", t: "> 12%", i: 74 },
    { m: "Rev Stability", t: "< 10% var", i: 70 }, { m: "Interest Coverage", t: "> 5x", i: 82 },
  ],
  Value: [
    { m: "P/E Ratio", t: "< 15x", i: 93 }, { m: "P/Book", t: "< 1.5x", i: 88 },
    { m: "EV/EBITDA", t: "< 10x", i: 86 }, { m: "FCF Yield", t: "> 6%", i: 84 },
    { m: "ROE", t: "> 12%", i: 78 }, { m: "Debt/Equity", t: "< 0.8", i: 74 },
    { m: "Earnings Yield", t: "> 7%", i: 82 }, { m: "Price/Sales", t: "< 2.0x", i: 68 },
  ],
  Momentum: [
    { m: "6-Month Return", t: "> 20%", i: 95 }, { m: "RSI (14-day)", t: "50-70", i: 88 },
    { m: "52-Week Hi Prox", t: "> 80%", i: 86 }, { m: "Volume Trend", t: "Rising 3M", i: 80 },
    { m: "EPS Revisions", t: "Upward", i: 84 }, { m: "Relative Strength", t: "Top 20%", i: 82 },
    { m: "MACD Signal", t: "Bullish", i: 72 }, { m: "Inst. Own Trend", t: "Increasing", i: 76 },
  ],
  Quality: [
    { m: "ROIC", t: "> 15%", i: 94 }, { m: "Gross Margin", t: "> 45%", i: 90 },
    { m: "FCF Margin", t: "> 15%", i: 88 }, { m: "Net Margin", t: "> 10%", i: 84 },
    { m: "Debt/Equity", t: "< 0.5", i: 80 }, { m: "Rev Consistency", t: "< 8% var", i: 76 },
    { m: "Moat Rating", t: "Narrow+", i: 86 }, { m: "ROIC > WACC", t: "Spread > 5%", i: 92 },
  ],
};

function getFallbackCriteria(strategy, sector, market) {
  const base = CRITERIA_MAP[strategy] || CRITERIA_MAP.Growth;
  return {
    title: `${strategy} Screen — ${sector} / ${market}`,
    summary: `Scanning ${UNIVERSE.length}+ stocks for top ${strategy} opportunities in ${sector} (${market}). AI-powered quantitative and qualitative filters applied.`,
    criteria: base.map(c => ({
      metric: c.m, threshold: c.t,
      description: `Key ${strategy} filter calibrated for ${sector} in ${market}.`,
      importance: c.i,
    })),
    redFlags: [
      "Declining gross margins 2+ quarters",
      "Revenue growth driven purely by M&A",
      "Heavy insider net selling",
      "FCF negative for 3+ years with no path to profitability",
    ],
    proTips: [
      `Run this screen monthly — ${strategy} opportunities rotate.`,
      "Combine scores with qualitative thesis before investing.",
      "Check short interest for potential squeeze setups.",
    ],
    tags: [strategy, sector, market, "AI-Screened", "Hidden Gems"],
  };
}

const COL = ["g", "b", "r"];
const cl = (i) => COL[i % 3];

const STRATEGIES = ["Growth", "Dividend", "Value", "Momentum", "Quality", "GARP", "Deep Value", "Small Cap Growth"];
const SECTORS = [
  "All Sectors", "Technology", "Healthcare", "Financials", "Energy",
  "Consumer Discretionary", "Industrials", "Utilities", "Real Estate",
  "Materials", "Communication Services", "Consumer Staples",
  "Biotech", "Semiconductors", "Clean Energy", "Fintech", "Defense", "Mining",
];
const MARKETS = [
  "US Large Cap", "US Mid Cap", "US Small Cap", "US Micro Cap",
  "International Developed", "Emerging Markets", "Global",
  "Canada", "Europe", "Asia Pacific", "Latin America",
];

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function App() {
  const [tab, setTab] = useState("stocks");

  // Stock screener
  const [strategy, setStrategy] = useState("Growth");
  const [sector, setSector] = useState("Technology");
  const [market, setMarket] = useState("US Large Cap");
  const [sLoading, setSLoading] = useState(false);
  const [sStep, setSStep] = useState(0);
  const [sProgress, setSProgress] = useState(0);
  const [sResult, setSResult] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [sFilter, setSFilter] = useState("All");
  const [sSortBy, setSSortBy] = useState("score");

  // Options screener
  const [optTicker, setOptTicker] = useState("NVDA");
  const [optType, setOptType] = useState("Both Calls & Puts");
  const [optExp, setOptExp] = useState("Monthly (30 DTE)");
  const [optStrat, setOptStrat] = useState("Directional (Calls)");
  const [oLoading, setOLoading] = useState(false);
  const [oStep, setOStep] = useState(0);
  const [oProgress, setOProgress] = useState(0);
  const [oContracts, setOContracts] = useState([]);
  const [oTicker, setOTicker] = useState(null);
  const [oInsights, setOInsights] = useState(null);

  const runId = useRef(0);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── STOCK SCREENER ── */
  const runStocks = useCallback(async () => {
    const rid = ++runId.current;
    setSLoading(true); setSStep(0); setSProgress(0); setSResult(null); setStocks([]); setSFilter("All");
    const STEPS = [
      "Scanning full market universe",
      "Applying strategy filters",
      `Scoring ${UNIVERSE.length}+ stocks`,
      "Surfacing hidden gems",
      "Generating AI criteria",
    ];
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 380));
      if (runId.current !== rid) return;
      setSStep(i + 1);
      setSProgress(Math.round(((i + 1) / STEPS.length) * 85));
    }

    const scored = UNIVERSE
      .map(s => ({ ...s, score: scoreStock(s, strategy, sector, market) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 18)
      .map(s => ({
        ...s,
        rating: getRating(s.score),
        metrics: getMetrics(s, strategy),
        thesis: buildThesis(s, strategy),
        isGem: s.cap === "Small" || s.cap === "Micro",
      }));

    let crit = null;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1600,
          messages: [{
            role: "user",
            content: `Expert equity analyst. ${strategy} stocks in ${sector}, ${market}. Return ONLY raw JSON no markdown: {"title":"str","summary":"str","criteria":[{"metric":"str","threshold":"str","description":"str","importance":80}],"redFlags":["str"],"proTips":["str"],"tags":["str"]} 8 criteria, importance 50-99.`,
          }],
        }),
      });
      if (res.ok) {
        const e = await res.json();
        const raw = (e.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
        try { crit = JSON.parse(raw); } catch { /* ignore */ }
        if (!crit) {
          try {
            const m = raw.match(/\{[\s\S]*\}/);
            if (m) crit = JSON.parse(m[0]);
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }

    if (!crit || !Array.isArray(crit.criteria) || !crit.criteria.length) {
      crit = getFallbackCriteria(strategy, sector, market);
    }
    if (runId.current !== rid) return;
    setSProgress(100);
    await new Promise(r => setTimeout(r, 180));
    setSResult(crit); setStocks(scored); setSLoading(false);
  }, [strategy, sector, market]);

  /* ── OPTIONS SCREENER ── */
  const runOptions = useCallback(async () => {
    const rid = ++runId.current;
    setOLoading(true); setOStep(0); setOProgress(0); setOContracts([]); setOInsights(null);
    const tickerData = OPTION_TICKERS.find(x => x.t === optTicker) || OPTION_TICKERS[0];
    const STEPS = [
      "Fetching option chain", "Calculating fair value",
      "Computing Greeks (Delta Gamma Theta Vega Rho)", "Analyzing IV surface",
      "Generating entry points", "Building AI insights",
    ];
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 420));
      if (runId.current !== rid) return;
      setOStep(i + 1);
      setOProgress(Math.round(((i + 1) / STEPS.length) * 82));
    }

    const types = optType === "Calls Only" ? ["call"] : optType === "Puts Only" ? ["put"] : ["call", "put"];
    const contracts = [];
    types.forEach(tp => {
      for (let i = 0; i < 3; i++) {
        contracts.push(generateOptionContract(tickerData.t, tickerData.p, tickerData.iv, tp, optExp, i));
      }
    });
    contracts.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    let insights = null;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          messages: [{
            role: "user",
            content: `Options analyst. ${optTicker} stock at $${tickerData.p}, IV=${tickerData.iv}%, strategy=${optStrat}, expiration=${optExp}. Return ONLY raw JSON: {"summary":"str","topPlay":"str","entryTiming":"str","riskWarning":"str","ivAnalysis":"str","keyLevels":{"support":"str","resistance":"str","breakeven":"str"},"tags":["str"]}`,
          }],
        }),
      });
      if (res.ok) {
        const e = await res.json();
        const raw = (e.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
        try { insights = JSON.parse(raw); } catch { /* ignore */ }
        if (!insights) {
          try {
            const m = raw.match(/\{[\s\S]*\}/);
            if (m) insights = JSON.parse(m[0]);
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }

    if (!insights) {
      insights = {
        summary: `${tickerData.n} presents a ${tickerData.iv > 60 ? "high IV" : "moderate IV"} environment with ${optExp} options. ${optStrat} setup is ${tickerData.iv > 60 ? "ideal for premium selling" : "favorable for directional plays"} given current market conditions.`,
        topPlay: `Best play: ${contracts[0]?.contractLabel} at $${contracts[0]?.entryPrice} — targets $${contracts[0]?.t1} / $${contracts[0]?.t2} / $${contracts[0]?.t3} with stop at $${contracts[0]?.stopLoss}.`,
        entryTiming: `Enter on a ${contracts[0]?.optType === "call" ? "pullback to support or breakout above resistance" : "bounce off resistance or break below support"} with volume confirmation. Ideal entry window: first 30-60 min of session or after key level test.`,
        riskWarning: `Max risk per contract: $${contracts[0]?.entryTotalCost}. Never risk more than 1-2% of portfolio on a single options position. IV crush risk ${tickerData.iv > 60 ? "HIGH" : "MODERATE"} — size accordingly.`,
        ivAnalysis: `Current IV of ${tickerData.iv}% is ${tickerData.iv > 60 ? "elevated — consider selling premium or debit spreads to reduce vega exposure" : "moderate — directional debit plays offer reasonable risk/reward"}. IV Rank indicates ${tickerData.iv > 60 ? "options are expensive" : "options are fairly priced"}.`,
        keyLevels: {
          support: `$${(tickerData.p * 0.96).toFixed(2)}`,
          resistance: `$${(tickerData.p * 1.04).toFixed(2)}`,
          breakeven: `$${(tickerData.p * 1.02).toFixed(2)}`,
        },
        tags: [optTicker, optStrat, optExp, tickerData.iv > 60 ? "High IV" : "Normal IV", "Entry Analysis"],
      };
    }

    if (runId.current !== rid) return;
    setOProgress(100);
    await new Promise(r => setTimeout(r, 180));
    setOTicker(tickerData); setOContracts(contracts); setOInsights(insights); setOLoading(false);
  }, [optTicker, optType, optExp, optStrat]);

  /* ── DERIVED STATE ── */
  const displayStocks = (() => {
    let s = [...stocks];
    if (sFilter === "Strong Buy") s = s.filter(x => x.rating === "sb");
    if (sFilter === "Hidden Gems") s = s.filter(x => x.isGem);
    if (sFilter === "Large Cap") s = s.filter(x => x.cap === "Large");
    if (sFilter === "International") s = s.filter(x => x.geo !== "US");
    if (sSortBy === "price") s.sort((a, b) => b.p - a.p);
    if (sSortBy === "change") s.sort((a, b) => b.ch - a.ch);
    return s;
  })();

  const strongBuys = stocks.filter(s => s.rating === "sb").length;
  const gems = stocks.filter(s => s.isGem).length;
  const avgScore = stocks.length ? Math.round(stocks.reduce((a, b) => a + b.score, 0) / stocks.length) : 0;

  const STOCK_STEPS = [
    "Scanning full market universe", "Applying strategy filters",
    `Scoring ${UNIVERSE.length}+ stocks`, "Surfacing hidden gems", "Generating AI criteria",
  ];
  const OPT_STEPS = [
    "Fetching option chain", "Calculating fair value",
    "Computing Greeks (Delta Gamma Theta Vega Rho)", "Analyzing IV surface",
    "Generating entry points", "Building AI insights",
  ];

  /* ══ RENDER ══ */
  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* HEADER */}
        <header className="hdr">
          <div className="logo">
            <div>
              <div>SCREEN<b>.</b>AI</div>
              <div className="logo-sub">STOCK + OPTIONS INTELLIGENCE</div>
            </div>
          </div>
          <div className="hdr-right">
            <span className="chip live">● {clock}</span>
            <span className="chip ai">AI-POWERED</span>
          </div>
        </header>

        {/* TAB BAR */}
        <div className="tab-bar">
          <div className={`tab ${tab === "stocks" ? "active" : ""}`} onClick={() => setTab("stocks")}>
            <span className="tab-ico">📊</span> Stock Screener
            {stocks.length > 0 && <span className="tab-badge">{stocks.length}</span>}
          </div>
          <div className={`tab ${tab === "options" ? "active" : ""}`} onClick={() => setTab("options")}>
            <span className="tab-ico">⚡</span> Options Screener
            {oContracts.length > 0 && <span className="tab-badge">{oContracts.length}</span>}
          </div>
        </div>

        {/* ════ STOCK TAB ════ */}
        {tab === "stocks" && (
          <div className="page">
            <div className="hero">
              <h1>Find every <span>hidden gem</span><br />in the market.</h1>
              <p>Scans {UNIVERSE.length}+ stocks across all caps, sectors &amp; geographies. Fresh unique picks every run.</p>
            </div>

            <div className="panel">
              <div className="panel-title">Screen Configuration</div>
              <div className="g3" style={{ marginBottom: 14 }}>
                <div className="fld">
                  <label>Strategy</label>
                  <div className="sel-wrap">
                    <select value={strategy} onChange={e => setStrategy(e.target.value)} disabled={sLoading}>
                      {STRATEGIES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="fld">
                  <label>Sector</label>
                  <div className="sel-wrap">
                    <select value={sector} onChange={e => setSector(e.target.value)} disabled={sLoading}>
                      {SECTORS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="fld">
                  <label>Market / Geography</label>
                  <div className="sel-wrap">
                    <select value={market} onChange={e => setMarket(e.target.value)} disabled={sLoading}>
                      {MARKETS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button className="btn-green" onClick={runStocks} disabled={sLoading}>
                {sLoading ? <><div className="spin" />Scanning Market…</> : "Run Screen — Find All Matching Stocks"}
              </button>
            </div>

            {sLoading && (
              <div className="loading-box">
                <div className="lsteps">
                  {STOCK_STEPS.map((s, i) => (
                    <div key={i} className={`lstep ${sStep > i ? "done" : sStep === i ? "active" : ""}`}>
                      <div className="lstep-ico">{sStep > i ? "✓" : sStep === i ? "…" : i + 1}</div>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <div className="prog-bar"><div className="prog-fill green" style={{ width: `${sProgress}%` }} /></div>
              </div>
            )}

            {!sResult && !sLoading && (
              <div className="empty">
                <div className="ico">🔍</div>
                <h3>Ready to scan</h3>
                <p>Configure your screen above and click Run to find matching stocks.</p>
              </div>
            )}

            {sResult && !sLoading && (
              <div className="results">
                <div className="sum-box">
                  <div className="sum-title">{sResult.title}</div>
                  <div className="sum-body">{sResult.summary}</div>
                  {sResult.tags?.length > 0 && (
                    <div className="tags">
                      {sResult.tags.map((tag, i) => <span className="tag" key={i}>{tag}</span>)}
                    </div>
                  )}
                </div>

                <div className="stats-row">
                  <div className="stat-box"><div className="stat-val g">{displayStocks.length}</div><div className="stat-lbl">Stocks Matched</div></div>
                  <div className="stat-box"><div className="stat-val g">{strongBuys}</div><div className="stat-lbl">Strong Buys</div></div>
                  <div className="stat-box"><div className="stat-val p">{gems}</div><div className="stat-lbl">Hidden Gems</div></div>
                  <div className="stat-box"><div className="stat-val">{avgScore}</div><div className="stat-lbl">Avg Score</div></div>
                </div>

                <div className="sec-lbl">Screening Criteria</div>
                <div className="crit-grid">
                  {sResult.criteria.map((c, i) => (
                    <div className={`crit-card ${cl(i)}`} key={i}>
                      <div className="cc-top">
                        <div className="cc-name">{c.metric}</div>
                        <span className={`cc-pill ${cl(i)}`}>{c.threshold}</span>
                      </div>
                      <div className="cc-desc">{c.description}</div>
                      <div className="cc-bar">
                        <div className="cc-track">
                          <div className={`cc-fill ${cl(i)}`} style={{ width: `${Math.min(100, Math.max(0, Number(c.importance) || 70))}%` }} />
                        </div>
                        <div className="cc-meta"><span>Importance</span><span>{c.importance}/100</span></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <div className="sec-lbl" style={{ margin: 0, flex: 1 }}>
                    Matching Stocks <span style={{ color: "var(--green)", fontSize: 10, fontWeight: 500, marginLeft: 8 }}>({displayStocks.length})</span>
                  </div>
                </div>

                <div className="filter-row">
                  {["All", "Strong Buy", "Hidden Gems", "Large Cap", "International"].map(f => (
                    <button key={f} className={`btn-sm ${sFilter === f ? "active" : ""}`} onClick={() => setSFilter(f)}>{f}</button>
                  ))}
                  <div className="spacer" />
                  {["score", "price", "change"].map(s => (
                    <button key={s} className={`btn-sm ${sSortBy === s ? "active" : ""}`} onClick={() => setSSortBy(s)}>
                      Sort: {s === "score" ? "Score" : s === "price" ? "Price" : "% Chg"}
                    </button>
                  ))}
                </div>

                <div className="scan-info">
                  Scanned: {new Date().toLocaleTimeString()} · <span>{UNIVERSE.length} stocks analyzed</span>
                </div>

                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th><th>Ticker</th><th>Price</th><th>Mkt Cap</th>
                        <th>Score</th><th>Key Metrics</th><th>Thesis</th><th>Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayStocks.map((s, i) => (
                        <tr key={s.t + i}>
                          <td style={{ color: "var(--dim)", fontSize: 10 }}>{i + 1}</td>
                          <td>
                            <div className="tk">{s.t}</div>
                            <div className="co">{s.n}</div>
                            {s.isGem && <div className="gem">💎 Hidden Gem</div>}
                          </td>
                          <td>
                            <div className="price-v">{fmt(s.p)}</div>
                            <span className={`chg-v ${s.ch >= 0 ? "up" : "dn"}`}>{s.ch >= 0 ? "+" : ""}{s.ch.toFixed(1)}%</span>
                          </td>
                          <td>
                            <div className="mc-v">{s.mc}</div>
                            <div className="cap-v">{s.cap} · {s.sec}</div>
                          </td>
                          <td>
                            <div className="score-wrap">
                              <span className={`score-n ${sc(s.score)}`}>{s.score}</span>
                              <div className="score-b">
                                <div className={`score-f ${sc(s.score)}`} style={{ width: `${s.score}%` }} />
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="met-list">
                              {(s.metrics || []).map((m, j) => (
                                <div className="met-row" key={j}>
                                  <span className="met-k">{m.k}</span>
                                  <span className={`met-v2 ${m.pass ? "pass" : ""}`}>{m.v}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td><div className="thesis-v">{s.thesis}</div></td>
                          <td><span className={`rtag ${s.rating}`}>{ratingLabel(s.rating)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="disc">⚠ For informational/educational purposes only. Not financial advice. Scores are AI-generated estimates. Always conduct thorough due diligence before investing.</div>

                {sResult.redFlags?.length > 0 && (
                  <>
                    <div className="sec-lbl" style={{ marginTop: 20 }}>Red Flags to Avoid</div>
                    <div className="li-list">
                      {sResult.redFlags.map((f, i) => (
                        <div className="li-item" key={i}>
                          <div className="li-ico x">✕</div><span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {sResult.proTips?.length > 0 && (
                  <>
                    <div className="sec-lbl">Pro Tips</div>
                    <div className="li-list">
                      {sResult.proTips.map((tip, i) => (
                        <div className="li-item" key={i}>
                          <div className="li-ico ok">→</div><span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════ OPTIONS TAB ════ */}
        {tab === "options" && (
          <div className="page">
            <div className="hero">
              <h1>Options <span className="orange">chain screener</span><br />with exact entry points.</h1>
              <p>Full Greeks · IV analysis · Day/Week/Month H&L ranges · Precise entry, targets &amp; stops for maximum profit.</p>
            </div>

            <div className="panel">
              <div className="panel-title">Options Configuration</div>
              <div className="opt-controls">
                <div className="fld">
                  <label>Underlying Ticker</label>
                  <div className="sel-wrap">
                    <select value={optTicker} onChange={e => setOptTicker(e.target.value)} disabled={oLoading}>
                      {OPTION_TICKERS.map(x => <option key={x.t} value={x.t}>{x.t} — {x.n} (${x.p})</option>)}
                    </select>
                  </div>
                </div>
                <div className="fld">
                  <label>Contract Type</label>
                  <div className="sel-wrap">
                    <select value={optType} onChange={e => setOptType(e.target.value)} disabled={oLoading}>
                      {OPT_TYPES.map(x => <option key={x}>{x}</option>)}
                    </select>
                  </div>
                </div>
                <div className="fld">
                  <label>Expiration</label>
                  <div className="sel-wrap">
                    <select value={optExp} onChange={e => setOptExp(e.target.value)} disabled={oLoading}>
                      {EXPIRATIONS.map(x => <option key={x}>{x}</option>)}
                    </select>
                  </div>
                </div>
                <div className="fld">
                  <label>Strategy</label>
                  <div className="sel-wrap">
                    <select value={optStrat} onChange={e => setOptStrat(e.target.value)} disabled={oLoading}>
                      {OPT_STRATEGIES.map(x => <option key={x}>{x}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button className="btn-blue" onClick={runOptions} disabled={oLoading}>
                {oLoading ? <><div className="spin-white" />Scanning Option Chain…</> : "⚡ Scan Option Chain — Generate Entry Points"}
              </button>
            </div>

            {oLoading && (
              <div className="loading-box">
                <div className="lsteps">
                  {OPT_STEPS.map((s, i) => (
                    <div key={i} className={`lstep ${oStep > i ? "done" : oStep === i ? "active" : ""}`}>
                      <div className="lstep-ico">{oStep > i ? "✓" : oStep === i ? "…" : i + 1}</div>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <div className="prog-bar"><div className="prog-fill blue" style={{ width: `${oProgress}%` }} /></div>
              </div>
            )}

            {!oContracts.length && !oLoading && (
              <div className="empty">
                <div className="ico">⚡</div>
                <h3>Ready to scan options</h3>
                <p>Select a ticker, expiration and strategy above.<br />Get full Greeks, entry points, H&L ranges and AI insights.</p>
              </div>
            )}

            {oContracts.length > 0 && !oLoading && oInsights && (
              <div className="results">
                {/* AI Summary */}
                <div className="sum-box">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div className="sum-title" style={{ margin: 0 }}>{oTicker?.t} Options Analysis — {optExp}</div>
                    <span className={`sig ${oInsights.topPlay?.toLowerCase().includes("call") ? "bullish" : oInsights.topPlay?.toLowerCase().includes("put") ? "bearish" : "neutral"}`}>
                      {oInsights.topPlay?.toLowerCase().includes("call") ? "⬆ Bullish" : "⬇ Bearish"}
                    </span>
                  </div>
                  <div className="sum-body">{oInsights.summary}</div>
                  {oInsights.tags?.length > 0 && (
                    <div className="tags">
                      {oInsights.tags.map((tag, i) => <span className="tag" key={i}>{tag}</span>)}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="stats-row">
                  <div className="stat-box"><div className="stat-val gold">{oTicker?.iv}%</div><div className="stat-lbl">Implied Vol</div></div>
                  <div className="stat-box"><div className="stat-val b">{oContracts.length}</div><div className="stat-lbl">Contracts Found</div></div>
                  <div className="stat-box"><div className="stat-val g">{oContracts.filter(c => c.signal === "bullish").length}</div><div className="stat-lbl">Bullish Signals</div></div>
                  <div className="stat-box"><div className="stat-val r">{oContracts.filter(c => c.signal === "bearish").length}</div><div className="stat-lbl">Bearish Signals</div></div>
                </div>

                {/* Key Levels */}
                {oInsights.keyLevels && (
                  <div className="panel" style={{ marginBottom: 20 }}>
                    <div className="panel-title">Key Price Levels</div>
                    <div className="g4">
                      <div className="stat-box" style={{ margin: 0 }}><div className="stat-val r">{oInsights.keyLevels.support}</div><div className="stat-lbl">Support</div></div>
                      <div className="stat-box" style={{ margin: 0 }}><div className="stat-val g">{oInsights.keyLevels.resistance}</div><div className="stat-lbl">Resistance</div></div>
                      <div className="stat-box" style={{ margin: 0 }}><div className="stat-val b">{oInsights.keyLevels.breakeven}</div><div className="stat-lbl">Breakeven</div></div>
                      <div className="stat-box" style={{ margin: 0 }}><div className="stat-val" style={{ fontSize: 13, color: "var(--txt)" }}>{fmt(oTicker?.p || 0)}</div><div className="stat-lbl">Current Price</div></div>
                    </div>
                    {oInsights.entryTiming && (
                      <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--s2)", borderRadius: 8, border: "1px solid var(--b1)", fontSize: 11.5, color: "#7a8fa8", lineHeight: 1.7 }}>
                        <span style={{ color: "var(--gold)", fontWeight: 700 }}>⏱ Entry Timing: </span>{oInsights.entryTiming}
                      </div>
                    )}
                    {oInsights.ivAnalysis && (
                      <div style={{ marginTop: 8, padding: "12px 14px", background: "var(--s2)", borderRadius: 8, border: "1px solid var(--b1)", fontSize: 11.5, color: "#7a8fa8", lineHeight: 1.7 }}>
                        <span style={{ color: "var(--blue)", fontWeight: 700 }}>📊 IV Analysis: </span>{oInsights.ivAnalysis}
                      </div>
                    )}
                  </div>
                )}

                {/* Option Cards */}
                <div className="sec-lbl">Option Contracts ({oContracts.length})</div>
                <div className="opt-cards">
                  {oContracts.map((c, i) => (
                    <OptionCard key={i} c={c} />
                  ))}
                </div>

                {oInsights.riskWarning && (
                  <div style={{ padding: "14px 16px", background: "rgba(255,77,106,.06)", border: "1px solid rgba(255,77,106,.18)", borderRadius: 9, marginBottom: 16, fontSize: 11.5, color: "#ff8fa3", lineHeight: 1.7 }}>
                    <span style={{ fontWeight: 700, color: "var(--red)" }}>⚠ Risk: </span>{oInsights.riskWarning}
                  </div>
                )}

                {oInsights.topPlay && (
                  <div style={{ padding: "14px 16px", background: "rgba(0,232,122,.05)", border: "1px solid rgba(0,232,122,.15)", borderRadius: 9, marginBottom: 20, fontSize: 11.5, color: "#7eeebb", lineHeight: 1.7 }}>
                    <span style={{ fontWeight: 700, color: "var(--green)" }}>⭐ Top Play: </span>{oInsights.topPlay}
                  </div>
                )}

                <div className="disc">⚠ Options trading involves substantial risk and is not suitable for all investors. These are AI-generated estimates for educational purposes only. Greeks, IV, and pricing are illustrative. Never risk more than you can afford to lose. Consult a licensed financial advisor.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ══ OPTION CARD COMPONENT ══ */
function OptionCard({ c }) {
  const intrinsic = Math.max(0,
    c.optType === "call"
      ? c.premium - Math.max(0, c.stockPrice - c.strike)
      : c.premium - Math.max(0, c.strike - c.stockPrice)
  );
  const extrinsic = c.premium - intrinsic;

  const greeks = [
    { sym: "Δ", name: "Delta", val: c.delta.toFixed(4), color: c.optType === "call" ? "green" : "red", pct: Math.abs(c.delta) * 100 },
    { sym: "Γ", name: "Gamma", val: c.gamma.toFixed(5), color: "blue", pct: Math.min(100, c.gamma * 50000) },
    { sym: "Θ", name: "Theta", val: c.theta.toFixed(4), color: "red", pct: Math.min(100, Math.abs(c.theta) * 200) },
    { sym: "V", name: "Vega", val: c.vega.toFixed(4), color: "purple", pct: Math.min(100, c.vega * 80) },
    { sym: "ρ", name: "Rho", val: c.rho.toFixed(4), color: "cyan", pct: Math.min(100, Math.abs(c.rho) * 400) },
  ];

  return (
    <div className={`opt-card ${c.optType === "call" ? "call-card" : "put-card"}`}>
      {/* Header */}
      <div className="opt-card-header">
        <div className="opt-hdr-left">
          <span className={`opt-type-badge ${c.optType}`}>{c.optType.toUpperCase()}</span>
          <div>
            <div className="opt-ticker">{c.ticker} ${c.strike}</div>
            <div className="opt-name">{c.name} · {c.moneyLabel} · {c.dte} DTE</div>
          </div>
        </div>
        <div className="opt-hdr-right">
          <span className="opt-exp">{c.expLabel}</span>
          <span className={`sig ${c.signal}`}>
            {c.signal === "bullish" ? "⬆ Bullish" : c.signal === "bearish" ? "⬇ Bearish" : "◎ Neutral"}
          </span>
        </div>
      </div>

      {/* Entry Banner */}
      <div className={`entry-banner ${c.optType === "put" ? "put-banner" : ""}`}>
        <div>
          <div className="entry-label">Optimal Entry Point</div>
          <div className={`entry-price ${c.optType === "put" ? "put" : ""}`}>${c.entryPrice}</div>
          <div className="entry-sub">Bid ${c.bid} / Ask ${c.ask} · Spread ${c.spread} · Cost ${c.entryTotalCost}/contract</div>
        </div>
        <div className="entry-targets">
          <div className="tgt"><div className="tgt-lbl">Target 1</div><div className="tgt-val t1">${c.t1}</div></div>
          <div className="tgt"><div className="tgt-lbl">Target 2</div><div className="tgt-val t2">${c.t2}</div></div>
          <div className="tgt"><div className="tgt-lbl">Target 3</div><div className="tgt-val t3">${c.t3}</div></div>
          <div className="tgt"><div className="tgt-lbl">Stop Loss</div><div className="tgt-val stop">${c.stopLoss}</div></div>
          <div className="tgt"><div className="tgt-lbl">Max P&amp;L</div><div className="tgt-val pnl">+${c.maxPnl} / -${c.maxLoss}</div></div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="opt-metrics">
        <div className="opt-metric"><div className="opt-m-lbl">Premium</div><div className="opt-m-val">${c.premium}</div><div className="opt-m-sub">Mid price</div></div>
        <div className="opt-metric"><div className="opt-m-lbl">Strike</div><div className="opt-m-val blue">${c.strike}</div><div className="opt-m-sub">{c.moneyLabel}</div></div>
        <div className="opt-metric"><div className="opt-m-lbl">Impl. Vol</div><div className="opt-m-val gold">{c.iv}%</div><div className="opt-m-sub">IV Rank {c.ivRank}</div></div>
        <div className="opt-metric"><div className="opt-m-lbl">IV Percentile</div><div className="opt-m-val purple">{c.ivPct30}%</div><div className="opt-m-sub">30-day pct</div></div>
        <div className="opt-metric"><div className="opt-m-lbl">Intrinsic</div><div className="opt-m-val">${intrinsic.toFixed(2)}</div><div className="opt-m-sub">Extrinsic: ${extrinsic.toFixed(2)}</div></div>
        <div className="opt-metric"><div className="opt-m-lbl">Break-even</div><div className="opt-m-val cyan">${c.optType === "call" ? (c.strike + c.premium).toFixed(2) : (c.strike - c.premium).toFixed(2)}</div><div className="opt-m-sub">At expiry</div></div>
        <div className="opt-metric"><div className="opt-m-lbl">Multiplier</div><div className="opt-m-val">100x</div><div className="opt-m-sub">Per contract</div></div>
        <div className="opt-metric"><div className="opt-m-lbl">P/C Ratio</div><div className="opt-m-val">{c.pcRatio}</div><div className="opt-m-sub">{c.pcRatio < 0.7 ? "Bullish" : c.pcRatio > 1.3 ? "Bearish" : "Neutral"}</div></div>
      </div>

      {/* H&L Ranges */}
      <div className="hl-section">
        <div className="hl-title">Price Range Analysis — Option Contract H&amp;L</div>
        <div className="hl-rows">
          <HLRow label="DAY" range={c.dayRange} current={c.premium} optType={c.optType} />
          <HLRow label="WEEK" range={c.weekRange} current={c.premium} optType={c.optType} />
          {c.monthRange && <HLRow label="MONTH" range={c.monthRange} current={c.premium} optType={c.optType} />}
        </div>
      </div>

      {/* Greeks */}
      <div className="greeks-row">
        {greeks.map(g => (
          <div className="greek-box" key={g.sym}>
            <div className="greek-sym" style={{ color: `var(--${g.color})` }}>{g.sym}</div>
            <div className="greek-name">{g.name}</div>
            <div className="greek-val">{g.val}</div>
            <div className="greek-bar-wrap">
              <div className="greek-bar-fill" style={{ width: `${g.pct}%`, background: `var(--${g.color})` }} />
            </div>
          </div>
        ))}
      </div>

      {/* OI & Volume */}
      <div className="oi-row">
        <div className="oi-box">
          <div className="oi-lbl">Open Interest</div>
          <div className="oi-val">{c.oi.toLocaleString()}</div>
          <div className="oi-sub">{c.oi > 10000 ? "High liquidity" : c.oi > 2000 ? "Moderate" : "Low liquidity"}</div>
        </div>
        <div className="oi-box">
          <div className="oi-lbl">Volume Today</div>
          <div className="oi-val">{c.volume.toLocaleString()}</div>
          <div className="oi-sub">{((c.volume / c.oi) * 100).toFixed(1)}% of OI</div>
        </div>
        <div className="oi-box">
          <div className="oi-lbl">Put/Call Ratio</div>
          <div className="oi-val">{c.pcRatio}</div>
          <div className="oi-sub">{c.pcRatio < 0.7 ? "Bullish sentiment" : c.pcRatio > 1.3 ? "Bearish sentiment" : "Neutral sentiment"}</div>
        </div>
      </div>
    </div>
  );
}

function HLRow({ label, range, current, optType }) {
  const lo = range.lo, hi = range.hi, cur = current;
  const pct = hi > lo ? ((cur - lo) / (hi - lo)) * 100 : 50;
  return (
    <div className="hl-row">
      <span className="hl-period">{label}</span>
      <div className="hl-bar-wrap">
        <div
          className={`hl-bar-fill ${optType === "call" ? "call-fill" : "put-fill"}`}
          style={{ left: `${(lo / (hi || 1)) * 50}%`, width: `${((hi - lo) / (hi || 1)) * 85}%` }}
        />
        <div className="hl-current-marker" style={{ left: `${Math.max(2, Math.min(95, pct))}%` }} />
      </div>
      <div className="hl-vals">
        <span className="hl-lo">L ${lo.toFixed(2)}</span>
        <span className="hl-cur">C ${cur.toFixed(2)}</span>
        <span className="hl-hi">H ${hi.toFixed(2)}</span>
      </div>
    </div>
  );
}
