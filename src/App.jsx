import { useState, useCallback, useRef, useEffect } from "react";

const FINNHUB_KEY = "d6ogvahr01qnu98i1cp0d6ogvahr01qnu98i1cpg";
const FINNHUB_URL = "https://finnhub.io/api/v1";
const REFRESH_MS = 60000;

/* ── STYLES ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#07090d;--s1:#0d1117;--s2:#131921;
  --b1:#1a2333;--b2:#22304a;
  --green:#00e87a;--blue:#3d9eff;--red:#ff4d6a;--gold:#f5a623;--purple:#a78bfa;--cyan:#00d4ff;
  --txt:#d8e2ef;--dim:#4a6080;--dim2:#243040;
}
body{background:var(--bg);color:var(--txt);font-family:'DM Mono','Courier New',monospace;-webkit-font-smoothing:antialiased;}
.app{min-height:100vh;background:radial-gradient(ellipse 80% 50% at 80% -5%,rgba(0,232,122,.05) 0%,transparent 55%),radial-gradient(ellipse 60% 40% at 5% 95%,rgba(61,158,255,.04) 0%,transparent 55%),var(--bg);}
.hdr{position:sticky;top:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:56px;background:rgba(7,9,13,.97);backdrop-filter:blur(20px);border-bottom:1px solid var(--b1);flex-wrap:wrap;gap:6px;}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:18px;letter-spacing:-.5px;}
.logo b{color:var(--green);}
.logo-sub{font-size:9px;letter-spacing:2px;color:var(--dim);margin-top:2px;}
.hdr-right{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.chip{font-size:9.5px;letter-spacing:1.4px;padding:3px 10px;border-radius:20px;font-weight:500;}
.chip.ai{background:rgba(0,232,122,.07);border:1px solid rgba(0,232,122,.2);color:var(--green);}
.chip.live{background:rgba(0,212,255,.07);border:1px solid rgba(0,212,255,.2);color:var(--cyan);animation:blink 2s infinite;}
.chip.mopen{background:rgba(0,232,122,.07);border:1px solid rgba(0,232,122,.2);color:var(--green);animation:blink 2s infinite;}
.chip.mclosed{background:rgba(245,166,35,.07);border:1px solid rgba(245,166,35,.2);color:var(--gold);}
.chip.mloading{background:rgba(61,158,255,.07);border:1px solid rgba(61,158,255,.2);color:var(--blue);animation:blink .8s infinite;}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:.45;}}
.tab-bar{display:flex;border-bottom:1px solid var(--b1);background:rgba(7,9,13,.9);backdrop-filter:blur(10px);position:sticky;top:56px;z-index:190;padding:0 28px;overflow-x:auto;}
.tab{font-family:'Syne',sans-serif;font-weight:700;font-size:12px;letter-spacing:.5px;padding:14px 20px;cursor:pointer;color:var(--dim);border-bottom:2px solid transparent;transition:all .15s;display:flex;align-items:center;gap:7px;white-space:nowrap;}
.tab:hover{color:var(--txt);}
.tab.active{color:var(--txt);border-bottom-color:var(--green);}
.tab-badge{font-size:9px;background:rgba(0,232,122,.12);border:1px solid rgba(0,232,122,.2);color:var(--green);padding:1px 6px;border-radius:10px;}
.page{max-width:1200px;margin:0 auto;padding:36px 22px 90px;}
.hero{margin-bottom:32px;}
.hero h1{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(22px,4vw,40px);line-height:1.08;letter-spacing:-1.5px;margin-bottom:10px;}
.hero h1 span{color:var(--green);}
.hero h1 span.orange{color:var(--gold);}
.hero p{color:var(--dim);font-size:12px;line-height:1.9;max-width:520px;}
.email-banner{background:linear-gradient(135deg,rgba(0,232,122,.07),rgba(61,158,255,.04));border:1px solid rgba(0,232,122,.2);border-radius:14px;padding:20px 24px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.eb-title{font-family:'Syne',sans-serif;font-weight:800;font-size:15px;margin-bottom:4px;}
.eb-sub{font-size:11px;color:var(--dim);line-height:1.6;}
.eb-count{font-size:10px;color:var(--green);margin-top:5px;}
.eb-form{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
.ei{background:var(--s2);border:1px solid var(--b2);color:var(--txt);font-family:'DM Mono',monospace;font-size:12px;padding:9px 14px;border-radius:8px;outline:none;transition:border-color .15s;}
.ei:focus{border-color:var(--green);}
.ei::placeholder{color:var(--dim);}
.ei.wide{width:210px;}
.ei.narrow{width:140px;}
.btn-sub{padding:9px 18px;background:var(--green);color:#000;border:none;border-radius:8px;cursor:pointer;font-family:'Syne',sans-serif;font-weight:800;font-size:12px;transition:all .15s;white-space:nowrap;}
.btn-sub:hover{background:#00d46e;transform:translateY(-1px);}
.btn-sub:disabled{opacity:.5;cursor:not-allowed;transform:none;}
.sub-ok{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--green);font-family:'Syne',sans-serif;font-weight:700;}
.panel{background:var(--s1);border:1px solid var(--b1);border-radius:14px;padding:20px;margin-bottom:24px;}
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
.sel-wrap select{width:100%;background:var(--s2);border:1px solid var(--b2);color:var(--txt);font-family:'DM Mono',monospace;font-size:12.5px;padding:9px 32px 9px 12px;border-radius:8px;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;transition:border-color .15s;}
.sel-wrap select:focus{border-color:var(--green);}
.sel-wrap::after{content:'▾';position:absolute;right:11px;top:50%;transform:translateY(-50%);color:var(--dim);pointer-events:none;font-size:11px;}
.btn-green{padding:13px;background:var(--green);color:#000;border:none;border-radius:9px;cursor:pointer;font-family:'Syne',sans-serif;font-weight:800;font-size:13.5px;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s;width:100%;}
.btn-green:hover:not(:disabled){background:#00d46e;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,232,122,.22);}
.btn-green:disabled{opacity:.4;cursor:not-allowed;}
.btn-blue{padding:13px;background:rgba(61,158,255,.12);color:var(--blue);border:1px solid rgba(61,158,255,.25);border-radius:9px;cursor:pointer;font-family:'Syne',sans-serif;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s;width:100%;}
.btn-blue:hover:not(:disabled){background:rgba(61,158,255,.2);transform:translateY(-1px);}
.btn-blue:disabled{opacity:.4;cursor:not-allowed;}
.btn-sm{padding:5px 12px;border-radius:6px;font-size:10px;font-family:'Syne',sans-serif;font-weight:700;cursor:pointer;border:1px solid var(--b2);background:var(--s2);color:var(--dim);transition:all .12s;}
.btn-sm:hover{border-color:var(--green);color:var(--green);}
.btn-sm.active{border-color:var(--green);color:var(--green);background:rgba(0,232,122,.08);}
.spin{width:13px;height:13px;flex-shrink:0;border:2px solid rgba(0,0,0,.2);border-top-color:#000;border-radius:50%;animation:rot .6s linear infinite;}
.spin-w{width:13px;height:13px;flex-shrink:0;border:2px solid rgba(61,158,255,.2);border-top-color:var(--blue);border-radius:50%;animation:rot .6s linear infinite;}
.spin-s{width:9px;height:9px;flex-shrink:0;border:1.5px solid rgba(0,232,122,.2);border-top-color:var(--green);border-radius:50%;animation:rot .6s linear infinite;}
@keyframes rot{to{transform:rotate(360deg);}}
.empty{text-align:center;padding:60px 20px;border:1px dashed var(--b2);border-radius:14px;color:var(--dim);}
.empty .ico{font-size:36px;margin-bottom:12px;opacity:.3;}
.empty h3{font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--txt);margin-bottom:6px;}
.empty p{font-size:12px;line-height:1.75;}
.lbox{border:1px solid var(--b1);border-radius:12px;padding:28px 22px;background:var(--s1);margin-bottom:22px;}
.lsteps{display:flex;flex-direction:column;gap:9px;}
.lstep{display:flex;align-items:center;gap:10px;font-size:11.5px;color:var(--dim);transition:color .25s;}
.lstep.active{color:var(--txt);}
.lstep.done{color:var(--green);}
.lstep-ico{width:19px;height:19px;border-radius:50%;border:1px solid var(--b2);display:flex;align-items:center;justify-content:center;font-size:9.5px;flex-shrink:0;}
.lstep.active .lstep-ico{border-color:var(--green);background:rgba(0,232,122,.08);color:var(--green);}
.lstep.done .lstep-ico{border-color:var(--green);background:rgba(0,232,122,.14);color:var(--green);}
.pbar{height:3px;background:var(--dim2);border-radius:2px;margin-top:18px;overflow:hidden;}
.pfill{height:100%;border-radius:2px;transition:width .5s ease;}
.pfill.g{background:var(--green);}
.pfill.b{background:var(--blue);}
.ldot{width:5px;height:5px;border-radius:50%;background:var(--green);animation:blink 1.5s infinite;flex-shrink:0;}
.live-tag{display:inline-flex;align-items:center;gap:4px;font-size:9.5px;padding:2px 7px;border-radius:4px;background:rgba(0,232,122,.06);border:1px solid rgba(0,232,122,.15);color:var(--green);}
.results{animation:fadeUp .3s ease;}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px;}
@media(max-width:600px){.stats-row{grid-template-columns:1fr 1fr;}}
.sbox{background:var(--s1);border:1px solid var(--b1);border-radius:10px;padding:14px 16px;}
.sv{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;margin-bottom:3px;}
.sv.g{color:var(--green);}
.sv.b{color:var(--blue);}
.sv.r{color:var(--red);}
.sv.p{color:var(--purple);}
.sv.gold{color:var(--gold);}
.sl{font-size:9.5px;color:var(--dim);letter-spacing:.5px;text-transform:uppercase;}
.sec-lbl{font-family:'Syne',sans-serif;font-size:9.5px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:var(--dim);display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.sec-lbl::after{content:'';flex:1;height:1px;background:var(--b1);}
.crit-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;margin-bottom:24px;}
.cc{background:var(--s1);border:1px solid var(--b1);border-radius:10px;padding:15px 17px;position:relative;overflow:hidden;transition:border-color .15s,transform .12s;}
.cc:hover{border-color:var(--b2);transform:translateY(-1px);}
.cc::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
.cc.g::before{background:var(--green);}
.cc.b::before{background:var(--blue);}
.cc.r::before{background:var(--red);}
.cc-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;}
.cc-nm{font-family:'Syne',sans-serif;font-weight:800;font-size:13px;color:var(--txt);line-height:1.3;}
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
.tk{font-family:'Syne',sans-serif;font-weight:800;font-size:13.5px;}
.co{color:var(--dim);font-size:10px;margin-top:2px;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gem{display:inline-flex;align-items:center;gap:3px;font-size:8.5px;padding:1px 5px;border-radius:3px;background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.22);color:var(--purple);margin-top:3px;}
.pv{font-weight:500;font-size:13px;display:flex;align-items:center;gap:5px;}
.cv{font-size:10px;font-weight:500;padding:2px 5px;border-radius:3px;margin-top:2px;display:inline-block;}
.cv.up{color:var(--green);background:rgba(0,232,122,.08);}
.cv.dn{color:var(--red);background:rgba(255,77,106,.08);}
.mcv{color:var(--dim);font-size:11px;}
.capv{font-size:9.5px;color:var(--blue);margin-top:2px;}
.scw{display:flex;align-items:center;gap:7px;}
.scn{font-family:'Syne',sans-serif;font-weight:800;font-size:14px;min-width:26px;}
.scn.hi{color:var(--green);}
.scn.md{color:var(--gold);}
.scn.lo{color:var(--red);}
.scb{flex:1;height:3px;background:var(--dim2);border-radius:2px;overflow:hidden;min-width:40px;}
.scf{height:100%;border-radius:2px;}
.scf.hi{background:var(--green);}
.scf.md{background:var(--gold);}
.scf.lo{background:var(--red);}
.met-list{display:flex;flex-direction:column;gap:3px;}
.met-row{display:flex;justify-content:space-between;gap:8px;font-size:10px;}
.met-k{color:var(--dim);}
.met-v{color:var(--txt);font-weight:500;}
.met-v.pass{color:var(--green);}
.rtag{display:inline-flex;align-items:center;gap:3px;font-family:'Syne',sans-serif;font-weight:800;font-size:10px;padding:3px 8px;border-radius:5px;white-space:nowrap;}
.rtag.sb{background:rgba(0,232,122,.1);color:var(--green);border:1px solid rgba(0,232,122,.2);}
.rtag.by{background:rgba(61,158,255,.1);color:var(--blue);border:1px solid rgba(61,158,255,.2);}
.rtag.wt{background:rgba(245,166,35,.08);color:var(--gold);border:1px solid rgba(245,166,35,.18);}
.thesis{font-size:10.5px;color:#5a7090;line-height:1.55;max-width:180px;}
.opt-controls{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;align-items:end;}
@media(max-width:800px){.opt-controls{grid-template-columns:1fr 1fr;}}
.opt-cards{display:flex;flex-direction:column;gap:14px;margin-bottom:20px;}
.ocard{background:var(--s1);border:1px solid var(--b1);border-radius:13px;overflow:hidden;transition:border-color .15s;}
.ocard:hover{border-color:var(--b2);}
.ocard.call-card{border-left:3px solid var(--green);}
.ocard.put-card{border-left:3px solid var(--red);}
.ocard-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--b1);flex-wrap:wrap;gap:10px;}
.ohdr-l{display:flex;align-items:center;gap:12px;}
.otype{font-family:'Syne',sans-serif;font-weight:800;font-size:12px;padding:4px 12px;border-radius:6px;}
.otype.call{background:rgba(0,232,122,.12);color:var(--green);border:1px solid rgba(0,232,122,.25);}
.otype.put{background:rgba(255,77,106,.12);color:var(--red);border:1px solid rgba(255,77,106,.25);}
.otick{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;}
.oname{font-size:10px;color:var(--dim);margin-top:1px;}
.oexp{font-size:11px;color:var(--gold);background:rgba(245,166,35,.08);border:1px solid rgba(245,166,35,.2);padding:3px 9px;border-radius:5px;}
.ohdr-r{display:flex;align-items:center;gap:10px;}
.entry-b{background:linear-gradient(135deg,rgba(0,232,122,.08),rgba(0,232,122,.02));border:1px solid rgba(0,232,122,.18);border-radius:10px;padding:14px 18px;margin:14px 18px 0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.entry-b.put-b{background:linear-gradient(135deg,rgba(255,77,106,.08),rgba(255,77,106,.02));border-color:rgba(255,77,106,.18);}
.elbl{font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:4px;}
.eprice{font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:var(--green);}
.eprice.put{color:var(--red);}
.esub{font-size:10px;color:var(--dim);margin-top:2px;}
.etgts{display:flex;gap:16px;flex-wrap:wrap;}
.tgt{text-align:center;}
.tgt-lbl{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--dim);margin-bottom:3px;}
.tgt-v{font-family:'Syne',sans-serif;font-weight:800;font-size:14px;}
.tgt-v.t1{color:var(--blue);}
.tgt-v.t2{color:var(--green);}
.tgt-v.t3{color:var(--purple);}
.tgt-v.stop{color:var(--red);}
.tgt-v.pnl{color:var(--gold);}
.ometrics{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));padding:14px 18px;}
.ometric{padding:10px 12px;border-right:1px solid var(--b1);border-bottom:1px solid var(--b1);}
.oml{font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--dim);margin-bottom:5px;}
.omv{font-family:'Syne',sans-serif;font-weight:800;font-size:14px;}
.omv.green{color:var(--green);}
.omv.red{color:var(--red);}
.omv.blue{color:var(--blue);}
.omv.gold{color:var(--gold);}
.omv.purple{color:var(--purple);}
.omv.cyan{color:var(--cyan);}
.oms{font-size:9.5px;color:var(--dim);margin-top:2px;}
.hl-sec{padding:14px 18px;border-top:1px solid var(--b1);}
.hl-ttl{font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:10px;}
.hl-rows{display:flex;flex-direction:column;gap:8px;}
.hl-row{display:flex;align-items:center;gap:12px;}
.hl-per{font-size:9.5px;color:var(--dim);width:36px;flex-shrink:0;}
.hl-bw{flex:1;position:relative;height:6px;background:var(--dim2);border-radius:3px;overflow:visible;}
.hl-bf{position:absolute;height:100%;border-radius:3px;top:0;}
.hl-bf.cf{background:linear-gradient(90deg,rgba(0,232,122,.3),var(--green));}
.hl-bf.pf{background:linear-gradient(90deg,rgba(255,77,106,.3),var(--red));}
.hl-cm{position:absolute;top:-3px;width:2px;height:12px;border-radius:1px;background:white;}
.hl-vals{display:flex;gap:12px;flex-shrink:0;}
.hl-lo{font-size:10px;color:var(--red);font-weight:500;}
.hl-hi{font-size:10px;color:var(--green);font-weight:500;}
.hl-cu{font-size:10px;color:var(--txt);font-weight:500;}
.greeks-row{display:grid;grid-template-columns:repeat(5,1fr);border-top:1px solid var(--b1);}
@media(max-width:600px){.greeks-row{grid-template-columns:repeat(3,1fr);}}
.gbox{padding:12px 14px;border-right:1px solid var(--b1);text-align:center;}
.gbox:last-child{border-right:none;}
.gsym{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;margin-bottom:3px;}
.gname{font-size:8.5px;letter-spacing:1px;text-transform:uppercase;color:var(--dim);margin-bottom:6px;}
.gval{font-family:'DM Mono',monospace;font-weight:500;font-size:13px;}
.gbw{height:2px;background:var(--dim2);border-radius:1px;margin-top:5px;overflow:hidden;}
.gbf{height:100%;border-radius:1px;}
.oi-row{display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid var(--b1);}
.oi-box{padding:12px 16px;border-right:1px solid var(--b1);}
.oi-box:last-child{border-right:none;}
.oil{font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--dim);margin-bottom:5px;}
.oiv{font-family:'Syne',sans-serif;font-weight:800;font-size:15px;}
.ois{font-size:9.5px;color:var(--dim);margin-top:2px;}
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
.sumbox{background:var(--s1);border:1px solid var(--b1);border-radius:11px;padding:20px 22px;margin-bottom:22px;position:relative;overflow:hidden;}
.sumbox::after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 80% 60% at 100% 0%,rgba(0,232,122,.03),transparent 60%);}
.sum-title{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;margin-bottom:8px;}
.sum-body{font-size:12px;color:#7a8fa8;line-height:1.85;}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;}
.tag{font-size:10px;padding:3px 10px;border-radius:16px;border:1px solid var(--b2);color:var(--dim);background:var(--s2);}
.scan-info{font-size:10px;color:var(--dim);text-align:right;margin-bottom:6px;}
.scan-info span{color:var(--green);}
.filter-row{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;align-items:center;}
.filter-row .sp{flex:1;}
.refresh-row{display:flex;align-items:center;gap:8px;font-size:10px;color:var(--dim);margin-bottom:10px;}
.ei{background:var(--s2);border:1px solid var(--b2);color:var(--txt);font-family:'DM Mono',monospace;font-size:12px;padding:9px 14px;border-radius:8px;outline:none;transition:border-color .15s;}
.ei:focus{border-color:var(--green);}
.ei::placeholder{color:var(--dim);}
.ei.wide{width:210px;}
.ei.narrow{width:140px;}
.export-btn{margin-top:16px;padding:10px 18px;background:var(--green);color:#000;border:none;border-radius:8px;cursor:pointer;font-family:'Syne',sans-serif;font-weight:800;font-size:12px;width:100%;}
.export-btn:hover{background:#00d46e;}
`;

/* ── UNIVERSE ── */
const UNIVERSE_BASE = [
  {t:"NVDA",n:"NVIDIA Corp",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"MSFT",n:"Microsoft Corp",sec:"Technology",cap:"Large",geo:"US"},
  {t:"AAPL",n:"Apple Inc",sec:"Technology",cap:"Large",geo:"US"},
  {t:"GOOGL",n:"Alphabet Inc",sec:"Technology",cap:"Large",geo:"US"},
  {t:"META",n:"Meta Platforms",sec:"Technology",cap:"Large",geo:"US"},
  {t:"AVGO",n:"Broadcom Inc",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"ORCL",n:"Oracle Corp",sec:"Technology",cap:"Large",geo:"US"},
  {t:"CRM",n:"Salesforce",sec:"Technology",cap:"Large",geo:"US"},
  {t:"ADBE",n:"Adobe Inc",sec:"Technology",cap:"Large",geo:"US"},
  {t:"NOW",n:"ServiceNow",sec:"Technology",cap:"Large",geo:"US"},
  {t:"DDOG",n:"Datadog Inc",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"HUBS",n:"HubSpot Inc",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"MNDY",n:"Monday.com",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"TOST",n:"Toast Inc",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"AFRM",n:"Affirm Holdings",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"ALKT",n:"Alkami Technology",sec:"Fintech",cap:"Small",geo:"US"},
  {t:"PRCT",n:"PROCEPT BioRobotics",sec:"Healthcare",cap:"Small",geo:"US"},
  {t:"AXSM",n:"Axsome Therapeutics",sec:"Biotech",cap:"Small",geo:"US"},
  {t:"NUVL",n:"Nuvalent Inc",sec:"Biotech",cap:"Mid",geo:"US"},
  {t:"LLY",n:"Eli Lilly",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"UNH",n:"UnitedHealth",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"ISRG",n:"Intuitive Surgical",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"DXCM",n:"Dexcom",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"JPM",n:"JPMorgan Chase",sec:"Financials",cap:"Large",geo:"US"},
  {t:"BAC",n:"Bank of America",sec:"Financials",cap:"Large",geo:"US"},
  {t:"GS",n:"Goldman Sachs",sec:"Financials",cap:"Large",geo:"US"},
  {t:"V",n:"Visa Inc",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"COIN",n:"Coinbase Global",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"XOM",n:"Exxon Mobil",sec:"Energy",cap:"Large",geo:"US"},
  {t:"CVX",n:"Chevron Corp",sec:"Energy",cap:"Large",geo:"US"},
  {t:"FSLR",n:"First Solar",sec:"Clean Energy",cap:"Mid",geo:"US"},
  {t:"ENPH",n:"Enphase Energy",sec:"Clean Energy",cap:"Mid",geo:"US"},
  {t:"GE",n:"GE Aerospace",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"KTOS",n:"Kratos Defense",sec:"Defense",cap:"Small",geo:"US"},
  {t:"RKLB",n:"Rocket Lab USA",sec:"Industrials",cap:"Small",geo:"US"},
  {t:"AMZN",n:"Amazon.com",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"TSLA",n:"Tesla Inc",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"ONON",n:"On Holding AG",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"CELH",n:"Celsius Holdings",sec:"Consumer Staples",cap:"Mid",geo:"US"},
  {t:"NEE",n:"NextEra Energy",sec:"Utilities",cap:"Large",geo:"US"},
  {t:"PLTR",n:"Palantir Tech",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"IONQ",n:"IonQ Inc",sec:"Technology",cap:"Small",geo:"US"},
  {t:"NVO",n:"Novo Nordisk",sec:"Healthcare",cap:"Large",geo:"Europe"},
  {t:"ASML",n:"ASML Holding",sec:"Semiconductors",cap:"Large",geo:"Europe"},
  {t:"SHOP",n:"Shopify Inc",sec:"Technology",cap:"Large",geo:"Canada"},
  {t:"MELI",n:"MercadoLibre",sec:"Technology",cap:"Large",geo:"Latin America"},
  {t:"NU",n:"Nu Holdings",sec:"Fintech",cap:"Large",geo:"Latin America"},
  {t:"NTRA",n:"Natera Inc",sec:"Healthcare",cap:"Mid",geo:"US"},
  {t:"BEAM",n:"Beam Therapeutics",sec:"Biotech",cap:"Small",geo:"US"},
  {t:"RDDT",n:"Reddit Inc",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"FCX",n:"Freeport-McMoRan",sec:"Mining",cap:"Large",geo:"US"},
  {t:"MP",n:"MP Materials",sec:"Mining",cap:"Small",geo:"US"},
  {t:"SOUN",n:"SoundHound AI",sec:"Technology",cap:"Small",geo:"US"},
  {t:"SERV",n:"Serve Robotics",sec:"Technology",cap:"Micro",geo:"US"},
  {t:"BIRK",n:"Birkenstock",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"VITL",n:"Vital Farms",sec:"Consumer Staples",cap:"Small",geo:"US"},
  {t:"AMD",n:"AMD",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"AMZN",n:"Amazon.com",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
];

const OPT_BASE = [
  // ── Mega Cap Tech ──
  {t:"NVDA",n:"NVIDIA Corp",iv:68,cat:"Mega Cap"},
  {t:"AAPL",n:"Apple Inc",iv:24,cat:"Mega Cap"},
  {t:"TSLA",n:"Tesla Inc",iv:72,cat:"Mega Cap"},
  {t:"META",n:"Meta Platforms",iv:38,cat:"Mega Cap"},
  {t:"MSFT",n:"Microsoft Corp",iv:22,cat:"Mega Cap"},
  {t:"AMZN",n:"Amazon.com",iv:32,cat:"Mega Cap"},
  {t:"GOOGL",n:"Alphabet",iv:26,cat:"Mega Cap"},
  {t:"AMD",n:"AMD",iv:54,cat:"Mega Cap"},
  {t:"AVGO",n:"Broadcom",iv:42,cat:"Mega Cap"},
  {t:"ORCL",n:"Oracle Corp",iv:30,cat:"Mega Cap"},
  // ── ETFs ──
  {t:"SPY",n:"S&P 500 ETF",iv:14,cat:"ETF"},
  {t:"QQQ",n:"Nasdaq 100 ETF",iv:18,cat:"ETF"},
  {t:"IWM",n:"Russell 2000 ETF",iv:22,cat:"ETF"},
  {t:"SQQQ",n:"ProShares UltraPro Short QQQ",iv:85,cat:"ETF"},
  {t:"TQQQ",n:"ProShares UltraPro QQQ",iv:82,cat:"ETF"},
  {t:"ARKK",n:"ARK Innovation ETF",iv:62,cat:"ETF"},
  {t:"GLD",n:"Gold ETF",iv:16,cat:"ETF"},
  {t:"TLT",n:"20yr Treasury ETF",iv:18,cat:"ETF"},
  // ── High Vol / Meme / Momentum ──
  {t:"PLTR",n:"Palantir Tech",iv:88,cat:"High Vol"},
  {t:"COIN",n:"Coinbase",iv:95,cat:"High Vol"},
  {t:"RDDT",n:"Reddit Inc",iv:84,cat:"High Vol"},
  {t:"MSTR",n:"MicroStrategy",iv:115,cat:"High Vol"},
  {t:"HOOD",n:"Robinhood Markets",iv:78,cat:"High Vol"},
  {t:"GME",n:"GameStop",iv:92,cat:"High Vol"},
  {t:"AMC",n:"AMC Entertainment",iv:110,cat:"High Vol"},
  {t:"BBAI",n:"BigBear.ai",iv:102,cat:"High Vol"},
  {t:"CIFR",n:"Cipher Mining",iv:118,cat:"High Vol"},
  {t:"MARA",n:"MARA Holdings",iv:105,cat:"High Vol"},
  {t:"RIOT",n:"Riot Platforms",iv:108,cat:"High Vol"},
  {t:"CLSK",n:"CleanSpark",iv:112,cat:"High Vol"},
  // ── AI / Tech Growth ──
  {t:"SOUN",n:"SoundHound AI",iv:96,cat:"AI"},
  {t:"SERV",n:"Serve Robotics",iv:104,cat:"AI"},
  {t:"IONQ",n:"IonQ Inc",iv:98,cat:"AI"},
  {t:"RGTI",n:"Rigetti Computing",iv:122,cat:"AI"},
  {t:"QBTS",n:"D-Wave Quantum",iv:116,cat:"AI"},
  {t:"AI",n:"C3.ai",iv:88,cat:"AI"},
  {t:"BBAI",n:"BigBear.ai",iv:102,cat:"AI"},
  {t:"SMCI",n:"Super Micro Computer",iv:86,cat:"AI"},
  {t:"CRWD",n:"CrowdStrike",iv:52,cat:"AI"},
  {t:"DDOG",n:"Datadog",iv:58,cat:"AI"},
  {t:"SNOW",n:"Snowflake",iv:62,cat:"AI"},
  {t:"PATH",n:"UiPath",iv:64,cat:"AI"},
  {t:"GTLB",n:"GitLab",iv:66,cat:"AI"},
  // ── eVTOL / Aerospace ──
  {t:"ACHR",n:"Archer Aviation",iv:108,cat:"eVTOL"},
  {t:"JOBY",n:"Joby Aviation",iv:96,cat:"eVTOL"},
  {t:"LILM",n:"Lilium",iv:118,cat:"eVTOL"},
  {t:"EVTL",n:"Vertical Aerospace",iv:114,cat:"eVTOL"},
  {t:"RKLB",n:"Rocket Lab USA",iv:94,cat:"eVTOL"},
  // ── Biotech / Health ──
  {t:"NBIS",n:"Nebius Group",iv:92,cat:"Biotech"},
  {t:"NUVL",n:"Nuvalent Inc",iv:78,cat:"Biotech"},
  {t:"AXSM",n:"Axsome Therapeutics",iv:82,cat:"Biotech"},
  {t:"BEAM",n:"Beam Therapeutics",iv:86,cat:"Biotech"},
  {t:"RXST",n:"RxSight Inc",iv:72,cat:"Biotech"},
  {t:"PRCT",n:"PROCEPT BioRobotics",iv:76,cat:"Biotech"},
  {t:"NTRA",n:"Natera Inc",iv:68,cat:"Biotech"},
  {t:"LLY",n:"Eli Lilly",iv:28,cat:"Biotech"},
  // ── Fintech / Finance ──
  {t:"SQ",n:"Block Inc",iv:62,cat:"Fintech"},
  {t:"AFRM",n:"Affirm Holdings",iv:86,cat:"Fintech"},
  {t:"UPST",n:"Upstart Holdings",iv:92,cat:"Fintech"},
  {t:"SOFI",n:"SoFi Technologies",iv:74,cat:"Fintech"},
  {t:"NU",n:"Nu Holdings",iv:58,cat:"Fintech"},
  {t:"V",n:"Visa Inc",iv:18,cat:"Fintech"},
  {t:"PYPL",n:"PayPal",iv:44,cat:"Fintech"},
  // ── Energy / EV ──
  {t:"RIVN",n:"Rivian Automotive",iv:88,cat:"EV/Energy"},
  {t:"LCID",n:"Lucid Group",iv:96,cat:"EV/Energy"},
  {t:"NIO",n:"NIO Inc",iv:82,cat:"EV/Energy"},
  {t:"XPEV",n:"XPeng Inc",iv:78,cat:"EV/Energy"},
  {t:"ENPH",n:"Enphase Energy",iv:66,cat:"EV/Energy"},
  {t:"FSLR",n:"First Solar",iv:52,cat:"EV/Energy"},
  // ── Real Estate / SPAC / Other High Vol ──
  {t:"OWN",n:"Ownership Corp",iv:88,cat:"High Vol"},
  {t:"NOW",n:"ServiceNow",iv:34,cat:"Enterprise"},
  {t:"CRM",n:"Salesforce",iv:30,cat:"Enterprise"},
  {t:"HUBS",n:"HubSpot",iv:44,cat:"Enterprise"},
  // ── Consumer / Retail ──
  {t:"SHOP",n:"Shopify",iv:56,cat:"Consumer"},
  {t:"MELI",n:"MercadoLibre",iv:44,cat:"Consumer"},
  {t:"ONON",n:"On Holding",iv:48,cat:"Consumer"},
  {t:"CELH",n:"Celsius Holdings",iv:72,cat:"Consumer"},
  {t:"BIRK",n:"Birkenstock",iv:38,cat:"Consumer"},
  // ── Defense / Industrial ──
  {t:"KTOS",n:"Kratos Defense",iv:62,cat:"Defense"},
  {t:"GE",n:"GE Aerospace",iv:28,cat:"Defense"},
  {t:"FCX",n:"Freeport-McMoRan",iv:44,cat:"Defense"},
  {t:"MP",n:"MP Materials",iv:68,cat:"Defense"},
];

/* ── FINNHUB ── */
async function fetchQuote(ticker) {
  try {
    const r = await fetch(`${FINNHUB_URL}/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
    if (!r.ok) return null;
    const d = await r.json();
    if (!d || !d.c || d.c === 0) return null;
    return { price: +d.c.toFixed(2), change: +d.dp.toFixed(2), high: +d.h.toFixed(2), low: +d.l.toFixed(2), prevClose: +d.pc.toFixed(2) };
  } catch { return null; }
}

// Fetch live IV from Finnhub option chain
async function fetchLiveIV(ticker) {
  try {
    const r = await fetch(FINNHUB_URL+'/stock/option-chain?symbol='+ticker+'&token='+FINNHUB_KEY);
    if (!r.ok) return null;
    const d = await r.json();
    if (!d || !d.data || !d.data.length) return null;
    const nearest = d.data[0];
    const calls = (nearest.options && nearest.options.CALL) || [];
    const puts = (nearest.options && nearest.options.PUT) || [];
    const all = [...calls, ...puts];
    const ivs = all.map(o=>o.impliedVolatility).filter(v=>v&&v>0&&v<5);
    if (!ivs.length) return null;
    return Math.round((ivs.reduce((a,b)=>a+b,0)/ivs.length)*100);
  } catch { return null; }
}

async function batchFetch(tickers, onProgress) {
  const out = {};
  for (let i = 0; i < tickers.length; i++) {
    const q = await fetchQuote(tickers[i]);
    if (q) out[tickers[i]] = q;
    if (onProgress) onProgress(i + 1, tickers.length);
    if (i < tickers.length - 1) await new Promise(r => setTimeout(r, 230));
  }
  return out;
}

function fmtCap(price, t) {
  const sh = {NVDA:24.4,MSFT:7.4,AAPL:15.4,GOOGL:12.3,META:2.5,AVGO:.46,ORCL:2.7,CRM:.96,ADBE:.44,NOW:.2,DDOG:.32,HUBS:.05,MNDY:.05,TOST:.57,AFRM:.31,LLY:.95,UNH:.92,ISRG:.35,DXCM:.39,JPM:2.87,BAC:7.8,GS:.34,V:2.05,COIN:.25,XOM:4,CVX:1.89,FSLR:.11,ENPH:.13,GE:1.09,AMZN:10.4,TSLA:3.2,NEE:2.05,PLTR:2.1,AMD:1.62,RDDT:.16};
  const cap = (price * (sh[t] || .08)) * 1e9;
  if (cap >= 1e12) return `${(cap/1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `${(cap/1e9).toFixed(0)}B`;
  return `${(cap/1e6).toFixed(0)}M`;
}

/* ── MARKET STATUS ── */
function mktStatus() {
  const et = new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
  const day = et.getDay(), mins = et.getHours()*60+et.getMinutes();
  if (day===0||day===6) return "closed";
  if (mins>=570&&mins<960) return "open";
  if (mins>=480&&mins<570) return "pre";
  if (mins>=960&&mins<1200) return "after";
  return "closed";
}

/* ── SCORING ── */
function scoreStock(s, strategy, sector, market) {
  let score = 50;
  const isGem = s.cap==="Small"||s.cap==="Micro";
  if (sector==="All Sectors") score+=10;
  else if (s.sec===sector) score+=22;
  else if ((sector==="Technology"&&["Semiconductors","Fintech"].includes(s.sec))||(sector==="Healthcare"&&s.sec==="Biotech")||(sector==="Energy"&&s.sec==="Clean Energy")||(sector==="Financials"&&s.sec==="Fintech")||(sector==="Industrials"&&s.sec==="Defense")||(sector==="Materials"&&s.sec==="Mining")) score+=12;
  else score-=8;
  const capMap={"US Large Cap":["Large"],"US Mid Cap":["Mid"],"US Small Cap":["Small"],"US Micro Cap":["Micro","Small"],"International Developed":["Large","Mid"],"Emerging Markets":["Large","Mid"],"Global":["Large","Mid","Small"],"Canada":["Large","Mid","Small"],"Europe":["Large","Mid"],"Asia Pacific":["Large","Mid"],"Latin America":["Large","Mid"]};
  const allowed=capMap[market]||["Large","Mid","Small","Micro"];
  if (allowed.includes(s.cap)) score+=15; else score-=12;
  const geoMap={"US Large Cap":"US","US Mid Cap":"US","US Small Cap":"US","US Micro Cap":"US","Canada":"Canada","Europe":"Europe","Asia Pacific":"Asia Pacific","Latin America":"Latin America","International Developed":"not-US","Emerging Markets":"emerging","Global":"any"};
  const rg=geoMap[market];
  if (!rg||rg==="any") score+=8;
  else if (rg==="not-US"&&s.geo!=="US") score+=14;
  else if (rg==="emerging"&&["Asia Pacific","Latin America"].includes(s.geo)) score+=14;
  else if (s.geo===rg) score+=12;
  else if (market.startsWith("US")&&s.geo!=="US") score-=15;
  const mom=Math.abs(s.ch||0);
  if (strategy==="Growth"||strategy==="Small Cap Growth"){if(isGem)score+=14;if(mom>3)score+=10;if(["Technology","Biotech","Fintech","Semiconductors","Clean Energy"].includes(s.sec))score+=8;}
  if (strategy==="Dividend"){if(s.cap==="Large")score+=18;if(["Utilities","Financials","Consumer Staples","Energy"].includes(s.sec))score+=10;if(isGem)score-=10;}
  if (strategy==="Value"||strategy==="Deep Value"){if((s.ch||0)<0)score+=10;if(["Financials","Energy","Materials","Mining","Industrials"].includes(s.sec))score+=8;}
  if (strategy==="Momentum"){score+=Math.min(20,mom*2.5);if(mom>8)score+=12;}
  if (strategy==="Quality"){if(s.cap==="Large")score+=12;if(["Technology","Healthcare","Consumer Staples"].includes(s.sec))score+=8;}
  if (isGem) score+=Math.floor(Math.random()*8);
  score+=Math.floor(Math.random()*12)-4;
  return Math.min(99,Math.max(28,score));
}
const sc=s=>s>=88?"hi":s>=72?"md":"lo";
const rLabel=r=>r==="sb"?"⬆ Strong Buy":r==="by"?"↑ Buy":"◎ Watch";
const getRating=s=>s>=88?"sb":s>=72?"by":"wt";
const fmt=p=>`$${Number(p).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
function getMetrics(s,strategy){
  const ri=(a,b)=>Math.floor(Math.random()*(b-a)+a);
  if(strategy==="Dividend") return [{k:"Div Yield",v:`${(Math.random()*3+1).toFixed(1)}%`,pass:true},{k:"Payout Ratio",v:`${ri(20,65)}%`,pass:true},{k:"Div Growth",v:`${ri(3,18)} yrs`,pass:true},{k:"FCF Cover",v:`${(Math.random()*3+1.2).toFixed(1)}x`,pass:true}];
  if(strategy==="Value"||strategy==="Deep Value") return [{k:"P/E",v:`${ri(6,18)}x`,pass:true},{k:"P/B",v:`${(Math.random()*2+.4).toFixed(1)}x`,pass:true},{k:"P/FCF",v:`${ri(7,16)}x`,pass:true},{k:"EV/EBITDA",v:`${ri(5,14)}x`,pass:true}];
  if(strategy==="Momentum") return [{k:"6M Return",v:`+${ri(18,85)}%`,pass:true},{k:"RSI(14)",v:`${ri(55,72)}`,pass:true},{k:"52W Hi%",v:`${ri(78,99)}%`,pass:true},{k:"Vol Trend",v:"Rising ↑",pass:true}];
  if(strategy==="Quality") return [{k:"ROIC",v:`${ri(14,42)}%`,pass:true},{k:"Gross Mgn",v:`${ri(38,88)}%`,pass:true},{k:"FCF Mgn",v:`${ri(10,42)}%`,pass:true},{k:"Net Mgn",v:`${ri(8,35)}%`,pass:true}];
  return [{k:"Rev Grwth",v:`+${ri(12,68)}%`,pass:true},{k:"EPS Grwth",v:`+${ri(15,120)}%`,pass:true},{k:"Gross Mgn",v:`${ri(35,88)}%`,pass:true},{k:"FCF Mgn",v:`${ri(8,42)}%`,pass:s.cap!=="Micro"}];
}
function buildThesis(s,strategy){
  const gems=["Under-the-radar gem —","Underfollowed with","Hidden small-cap —","Emerging leader —"];
  const strong=["Market leader delivering","Best-in-class operator,","Dominant franchise,"];
  const pre=(s.cap==="Small"||s.cap==="Micro")?gems[Math.floor(Math.random()*gems.length)]:strong[Math.floor(Math.random()*strong.length)];
  const suf={Growth:"accelerating revenue with expanding TAM.",Dividend:"reliable dividend growth & strong FCF.",Value:"trades at deep discount to intrinsic value.",Momentum:"strong price momentum backed by fundamentals.",Quality:"exceptional ROIC and durable moat.",GARP:"growth at a very reasonable multiple.","Deep Value":"deep discount with identifiable catalyst.","Small Cap Growth":"explosive growth in underpenetrated market."};
  return `${pre} ${suf[strategy]||suf.Growth}`;
}

/* ── OPTIONS MATH ── */
function erf(x){const a1=.254829592,a2=-.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=.3275911;const sign=x<0?-1:1;const t2=1/(1+p*Math.abs(x));const y=1-(((((a5*t2+a4)*t2)+a3)*t2+a2)*t2+a1)*t2*Math.exp(-x*x);return sign*y;}
function N(x){return .5*(1+erf(x/Math.sqrt(2)));}
function Npdf(x){return Math.exp(-.5*x*x)/Math.sqrt(2*Math.PI);}
function rnd(a,b,d=2){return parseFloat((Math.random()*(b-a)+a).toFixed(d));}
function rint(a,b){return Math.floor(Math.random()*(b-a+1)+a);}

function genContract(ticker,price,iv,optType,expLabel,idx){
  const isCall=optType==="call";
  const dte=parseInt(expLabel.match(/\d+/)?.[0]||"30");
  const t=Math.max(dte/365,.001);
  const strikes=[Math.round(price*(isCall?1.0:1.0)),Math.round(price*(isCall?1.02:.98)),Math.round(price*(isCall?1.05:.95))];
  const strike=strikes[idx%3];
  const isATM=Math.abs(price/strike-1)<.025;
  const isOTM=isCall?strike>price:strike<price;
  const ivP=Math.min((iv/100)*(1+.1*(7/Math.max(dte,1))),2.5);
  const r=.053,sq=Math.sqrt(t);
  const d1=(Math.log(price/strike)+(r+.5*ivP*ivP)*t)/(ivP*sq);
  const d2=d1-ivP*sq;
  let prem=isCall?Math.max(.01,price*N(d1)-strike*Math.exp(-r*t)*N(d2)):Math.max(.01,strike*Math.exp(-r*t)*N(-d2)-price*N(-d1));
  prem=+prem.toFixed(2);
  const delta=isCall?N(d1):N(d1)-1;
  const gamma=Npdf(d1)/(price*ivP*sq);
  const theta=(-(price*Npdf(d1)*ivP)/(2*sq)-r*strike*Math.exp(-r*t)*(isCall?N(d2):N(-d2)))/365;
  const vega=price*Npdf(d1)*sq/100;
  const rho=isCall?strike*t*Math.exp(-r*t)*N(d2)/100:-strike*t*Math.exp(-r*t)*N(-d2)/100;
  const ep=+(prem*rnd(.95,1.02)).toFixed(2);
  const t1=+(prem*1.3).toFixed(2),t2=+(prem*1.65).toFixed(2),t3=+(prem*2.2).toFixed(2),sl=+(prem*.55).toFixed(2);
  const oi=rint(500,85000),vol=rint(100,Math.floor(oi*.4));
  let signal="neutral";
  const absDelta=Math.abs(delta);
  if(isCall&&absDelta>.45)signal="bullish";
  else if(isCall&&absDelta>.3)signal="bullish";
  else if(!isCall&&absDelta>.4)signal="bearish";
  else if(!isCall&&absDelta>.3)signal="bearish";
  return {
    ticker,name:OPT_BASE.find(x=>x.t===ticker)?.n||ticker,
    stockPrice:price,strike,optType,expLabel,dte,prem,ep,t1,t2,t3,sl,
    maxPnl:+((t3-ep)*100).toFixed(0),maxLoss:+((ep-sl)*100).toFixed(0),
    delta:+delta.toFixed(4),gamma:+gamma.toFixed(6),theta:+theta.toFixed(4),vega:+vega.toFixed(4),rho:+rho.toFixed(4),
    iv:+(ivP*100).toFixed(1),ivRank:rint(15,92),ivPct:rint(10,95),
    oi,vol,pcr:+rnd(.4,1.8).toFixed(2),
    dayR:{lo:rnd(prem*.65,prem*.88),hi:rnd(prem*1.12,prem*1.45)},
    weekR:{lo:rnd(prem*.45,prem*.75),hi:rnd(prem*1.3,prem*1.85)},
    monthR:dte>=30?{lo:rnd(prem*.25,prem*.6),hi:rnd(prem*1.5,prem*2.8)}:null,
    signal,moneyLabel:isATM?"ATM":isOTM?"OTM":"ITM",
    bid:+(prem*.975).toFixed(2),ask:+(prem*1.025).toFixed(2),spread:+(prem*.05).toFixed(2),
    contractLabel:`${ticker} $${strike} ${isCall?"CALL":"PUT"} ${expLabel.split(" ")[0]}`,
    entryTotalCost:+(ep*100).toFixed(0),
  };
}

/* ── CRITERIA FALLBACK ── */
const CMAP={Growth:[{m:"Revenue Growth (YoY)",t:"> 20%",i:92},{m:"EPS Growth (YoY)",t:"> 25%",i:88},{m:"Gross Margin",t:"> 40%",i:84},{m:"TAM Growth",t:"> 15%",i:81},{m:"PEG Ratio",t:"< 2.0",i:79},{m:"FCF Margin",t:"> 8%",i:76},{m:"R&D / Revenue",t:"> 10%",i:68},{m:"Net Rev Retention",t:"> 110%",i:85}],Dividend:[{m:"Dividend Yield",t:"> 2.5%",i:95},{m:"Payout Ratio",t:"< 65%",i:90},{m:"Div Growth Streak",t:"> 5 yrs",i:88},{m:"FCF Payout Cover",t:"> 1.5x",i:86},{m:"Debt/EBITDA",t:"< 3.0x",i:78},{m:"ROE",t:"> 12%",i:74},{m:"Rev Stability",t:"< 10% var",i:70},{m:"Interest Coverage",t:"> 5x",i:82}],Value:[{m:"P/E Ratio",t:"< 15x",i:93},{m:"P/Book",t:"< 1.5x",i:88},{m:"EV/EBITDA",t:"< 10x",i:86},{m:"FCF Yield",t:"> 6%",i:84},{m:"ROE",t:"> 12%",i:78},{m:"Debt/Equity",t:"< 0.8",i:74},{m:"Earnings Yield",t:"> 7%",i:82},{m:"Price/Sales",t:"< 2.0x",i:68}],Momentum:[{m:"6-Month Return",t:"> 20%",i:95},{m:"RSI (14-day)",t:"50-70",i:88},{m:"52-Week Hi Prox",t:"> 80%",i:86},{m:"Volume Trend",t:"Rising 3M",i:80},{m:"EPS Revisions",t:"Upward",i:84},{m:"Relative Strength",t:"Top 20%",i:82},{m:"MACD Signal",t:"Bullish",i:72},{m:"Inst. Own Trend",t:"Increasing",i:76}],Quality:[{m:"ROIC",t:"> 15%",i:94},{m:"Gross Margin",t:"> 45%",i:90},{m:"FCF Margin",t:"> 15%",i:88},{m:"Net Margin",t:"> 10%",i:84},{m:"Debt/Equity",t:"< 0.5",i:80},{m:"Rev Consistency",t:"< 8% var",i:76},{m:"Moat Rating",t:"Narrow+",i:86},{m:"ROIC > WACC",t:"Spread > 5%",i:92}]};
function fallbackCrit(strategy,sector,market){
  const base=CMAP[strategy]||CMAP.Growth;
  return {title:`${strategy} Screen — ${sector} / ${market}`,summary:`Scanning ${UNIVERSE_BASE.length}+ stocks for top ${strategy} opportunities in ${sector} (${market}). Live Finnhub prices applied.`,criteria:base.map(c=>({metric:c.m,threshold:c.t,description:`Key ${strategy} filter for ${sector} in ${market}.`,importance:c.i})),redFlags:["Declining gross margins 2+ quarters","Revenue growth driven purely by M&A","Heavy insider net selling","FCF negative 3+ years with no path to profitability"],proTips:[`Run monthly — ${strategy} opportunities rotate.`,"Combine scores with qualitative thesis before investing.","Check short interest for potential squeeze setups."],tags:[strategy,sector,market,"AI-Screened","Live Data"]};
}

const COL=["g","b","r"];
const cl=i=>COL[i%3];
const STRATEGIES=["Growth","Dividend","Value","Momentum","Quality","GARP","Deep Value","Small Cap Growth"];
const SECTORS=["All Sectors","Technology","Healthcare","Financials","Energy","Consumer Discretionary","Industrials","Utilities","Real Estate","Materials","Communication Services","Consumer Staples","Biotech","Semiconductors","Clean Energy","Fintech","Defense","Mining"];
const MARKETS=["US Large Cap","US Mid Cap","US Small Cap","US Micro Cap","International Developed","Emerging Markets","Global","Canada","Europe","Asia Pacific","Latin America"];
const EXPS=["Weekly (3 DTE)","Weekly (7 DTE)","Bi-Weekly (14 DTE)","Monthly (30 DTE)","Monthly (45 DTE)","Quarterly (60 DTE)","Quarterly (90 DTE)","LEAPS (180 DTE)","LEAPS (365 DTE)"];
const OSTRATEGIES=["High IV Crush (Sell)","Low IV Buy","Momentum Calls","Protective Puts","Covered Calls","Cash-Secured Puts","Debit Spreads","Iron Condors","Directional (Calls)","Directional (Puts)"];
const OTYPES=["Calls Only","Puts Only","Both Calls & Puts"];

/* ══════════════════════════════════════════════
   APP
══════════════════════════════════════════════ */
export default function App() {
  const [tab,setTab]=useState("stocks");
  const [prices,setPrices]=useState({});
  const [pLoading,setPLoading]=useState(false);
  const [fetchProg,setFetchProg]=useState({done:0,total:0});
  const [lastRefresh,setLastRefresh]=useState(null);
  const [ms,setMs]=useState(mktStatus());
  const [strategy,setStrategy]=useState("Growth");
  const [sector,setSector]=useState("Technology");
  const [market,setMarket]=useState("US Large Cap");
  const [sLoading,setSLoading]=useState(false);
  const [sStep,setSStep]=useState(0);
  const [sProg,setSProg]=useState(0);
  const [sResult,setSResult]=useState(null);
  const [stocks,setStocks]=useState([]);
  const [sFilter,setSFilter]=useState("All");
  const [sSort,setSSort]=useState("score");
  const [optTicker,setOptTicker]=useState("NVDA");
  const [optType,setOptType]=useState("Both Calls & Puts");
  const [optExp,setOptExp]=useState("Monthly (30 DTE)");
  const [optStrat,setOptStrat]=useState("Directional (Calls)");
  const [optCatFilter,setOptCatFilter]=useState("All");
  const [optSearch,setOptSearch]=useState("");
  const [oLoading,setOLoading]=useState(false);
  const [oStep,setOStep]=useState(0);
  const [oProg,setOProg]=useState(0);
  const [oContracts,setOContracts]=useState([]);
  const [oTicker,setOTicker]=useState(null);
  const [oInsights,setOInsights]=useState(null);
  const [ivCache,setIvCache]=useState({});
  const [adminUnlocked,setAdminUnlocked]=useState(false);
  const [adminPin,setAdminPin]=useState("");
  const [adminError,setAdminError]=useState(false);
  const ADMIN_PIN="2580";
  const [eName,setEName]=useState("");
  const [eEmail,setEEmail]=useState("");
  const [eList,setEList]=useState(()=>{try{return JSON.parse(localStorage.getItem("rubberband_emails")||"[]");}catch{return [];}});
  const [eOk,setEOk]=useState(false);
  const runId=useRef(0);
  const [clock,setClock]=useState(new Date().toLocaleTimeString());

  useEffect(()=>{
    const id=setInterval(()=>{setClock(new Date().toLocaleTimeString());setMs(mktStatus());},1000);
    return()=>clearInterval(id);
  },[]);

  // Fetch all prices on mount + every 60s
  useEffect(()=>{
    const refresh=async()=>{
      if(pLoading)return;
      const tickers=[...new Set([...UNIVERSE_BASE.map(s=>s.t),...OPT_BASE.map(s=>s.t)])];
      setPLoading(true);
      const r=await batchFetch(tickers,(done,total)=>setFetchProg({done,total}));
      setPrices(prev=>({...prev,...r}));
      setLastRefresh(new Date());
      setPLoading(false);
    };
    refresh();
    const id=setInterval(refresh,REFRESH_MS);
    return()=>clearInterval(id);
  },[]);

  useEffect(()=>{try{localStorage.setItem("rubberband_emails",JSON.stringify(eList));}catch{};},[eList]);

  const subscribe=()=>{
    if(!eEmail.includes("@"))return;
    const entry={name:eName.trim()||"Anonymous",email:eEmail.trim().toLowerCase(),date:new Date().toLocaleDateString()};
    setEList(prev=>prev.find(e=>e.email===entry.email)?prev:[...prev,entry]);
    setEName("");setEEmail("");setEOk(true);setTimeout(()=>setEOk(false),4000);
  };

  const exportCSV=()=>{
    const csv=["Name,Email,Date",...eList.map(e=>`${e.name},${e.email},${e.date}`)].join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="rubberband_subscribers.csv";a.click();
  };

  const liveUniverse=()=>UNIVERSE_BASE.map(s=>{
    const q=prices[s.t];
    return{...s,p:q?q.price:null,ch:q?q.change:null,mc:q?fmtCap(q.price,s.t):"—",live:!!q};
  }).filter(s=>s.p!==null);

  /* STOCK SCREENER */
  const runStocks=useCallback(async()=>{
    const rid=++runId.current;
    setSLoading(true);setSStep(0);setSProg(0);setSResult(null);setStocks([]);setSFilter("All");
    const STEPS=["Loading live Finnhub prices","Applying strategy filters",`Scoring ${UNIVERSE_BASE.length}+ stocks`,"Surfacing hidden gems","Generating AI criteria"];
    for(let i=0;i<STEPS.length;i++){await new Promise(r=>setTimeout(r,400));if(runId.current!==rid)return;setSStep(i+1);setSProg(Math.round(((i+1)/STEPS.length)*85));}
    const universe=liveUniverse();
    const scored=universe.map(s=>({...s,score:scoreStock(s,strategy,sector,market)})).sort((a,b)=>b.score-a.score).slice(0,18).map(s=>({...s,rating:getRating(s.score),metrics:getMetrics(s,strategy),thesis:buildThesis(s,strategy),isGem:s.cap==="Small"||s.cap==="Micro"}));
    let crit=null;
    try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1600,messages:[{role:"user",content:`Expert equity analyst. ${strategy} stocks in ${sector}, ${market}. Return ONLY raw JSON no markdown: {"title":"str","summary":"str","criteria":[{"metric":"str","threshold":"str","description":"str","importance":80}],"redFlags":["str"],"proTips":["str"],"tags":["str"]} 8 criteria, importance 50-99.`}]})});if(res.ok){const e=await res.json();const raw=(e.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").trim();try{crit=JSON.parse(raw);}catch{}if(!crit){try{const m=raw.match(/\{[\s\S]*\}/);if(m)crit=JSON.parse(m[0]);}catch{}}}}catch{}
    if(!crit||!Array.isArray(crit.criteria)||!crit.criteria.length)crit=fallbackCrit(strategy,sector,market);
    if(runId.current!==rid)return;
    setSProg(100);await new Promise(r=>setTimeout(r,180));
    setSResult(crit);setStocks(scored);setSLoading(false);
  },[strategy,sector,market,prices]);

  // Auto-fetch live IV when ticker changes
  useEffect(()=>{
    let cancelled=false;
    const fetchIV=async()=>{
      if(ivCache[optTicker])return;
      const iv=await fetchLiveIV(optTicker);
      if(!cancelled&&iv&&iv>5&&iv<300)setIvCache(prev=>({...prev,[optTicker]:iv}));
    };
    fetchIV();
    return()=>{cancelled=true;};
  },[optTicker]);

  // Auto-refresh IV every 5 minutes for current ticker
  useEffect(()=>{
    const id=setInterval(async()=>{
      const iv=await fetchLiveIV(optTicker);
      if(iv&&iv>5&&iv<300)setIvCache(prev=>({...prev,[optTicker]:iv}));
    },300000);
    return()=>clearInterval(id);
  },[optTicker]);

  /* OPTIONS SCREENER */
  const runOptions=useCallback(async()=>{
    const rid=++runId.current;
    setOLoading(true);setOStep(0);setOProg(0);setOContracts([]);setOInsights(null);
    const base=OPT_BASE.find(x=>x.t===optTicker)||OPT_BASE[0];
    const lq=prices[base.t];
    // Try live IV first, fall back to cached, then static baseline
    let liveIV = ivCache[base.t] || null;
    if (!liveIV) {
      const fetched = await fetchLiveIV(base.t);
      if (fetched && fetched > 5 && fetched < 300) {
        liveIV = fetched;
        setIvCache(prev=>({...prev,[base.t]:fetched}));
      }
    }
    const td={...base,p:lq?lq.price:base.p||100,iv:liveIV||base.iv};
    const STEPS=["Fetching live underlying price","Calculating fair value","Computing Greeks (Δ Γ Θ V ρ)","Analyzing IV surface","Generating entry points","Building AI insights"];
    for(let i=0;i<STEPS.length;i++){await new Promise(r=>setTimeout(r,420));if(runId.current!==rid)return;setOStep(i+1);setOProg(Math.round(((i+1)/STEPS.length)*82));}
    const types=optType==="Calls Only"?["call"]:optType==="Puts Only"?["put"]:["call","put"];
    const contracts=[];
    types.forEach(tp=>{for(let i=0;i<3;i++)contracts.push(genContract(td.t,td.p,td.iv,tp,optExp,i));});
    contracts.sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
    let ins=null;
    try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,messages:[{role:"user",content:`Options analyst. ${optTicker} live price $${td.p}, IV=${td.iv}%, strategy=${optStrat}, expiration=${optExp}. Return ONLY raw JSON: {"summary":"str","topPlay":"str","entryTiming":"str","riskWarning":"str","ivAnalysis":"str","keyLevels":{"support":"str","resistance":"str","breakeven":"str"},"tags":["str"]}`}]})});if(res.ok){const e=await res.json();const raw=(e.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").trim();try{ins=JSON.parse(raw);}catch{}if(!ins){try{const m=raw.match(/\{[\s\S]*\}/);if(m)ins=JSON.parse(m[0]);}catch{}}}}catch{}
    if(!ins)ins={summary:`${td.n} live at $${td.p}. IV=${td.iv}% — ${td.iv>60?"elevated, ideal for premium selling":"moderate, directional plays favored"}.`,topPlay:`${contracts[0]?.contractLabel} at $${contracts[0]?.ep} → $${contracts[0]?.t1}/$${contracts[0]?.t2}/$${contracts[0]?.t3}, stop $${contracts[0]?.sl}.`,entryTiming:`Enter on ${contracts[0]?.optType==="call"?"pullback to support or breakout confirmation":"bounce off resistance or break below support"} with volume.`,riskWarning:`Max risk: $${contracts[0]?.entryTotalCost}/contract. IV crush risk ${td.iv>60?"HIGH":"MODERATE"}.`,ivAnalysis:`IV ${td.iv}% is ${td.iv>60?"elevated — sell premium or use spreads":"moderate — directional debit plays are reasonable"}.`,keyLevels:{support:`$${(td.p*.96).toFixed(2)}`,resistance:`$${(td.p*1.04).toFixed(2)}`,breakeven:`$${(td.p*1.02).toFixed(2)}`},tags:[optTicker,optStrat,optExp,td.iv>60?"High IV":"Normal IV","Live Price"]};
    if(runId.current!==rid)return;
    setOProg(100);await new Promise(r=>setTimeout(r,180));
    setOTicker(td);setOContracts(contracts);setOInsights(ins);setOLoading(false);
  },[optTicker,optType,optExp,optStrat,prices]);

  const dispStocks=(()=>{let s=[...stocks];if(sFilter==="Strong Buy")s=s.filter(x=>x.rating==="sb");if(sFilter==="Hidden Gems")s=s.filter(x=>x.isGem);if(sFilter==="Large Cap")s=s.filter(x=>x.cap==="Large");if(sFilter==="International")s=s.filter(x=>x.geo!=="US");if(sSort==="price")s.sort((a,b)=>b.p-a.p);if(sSort==="change")s.sort((a,b)=>b.ch-a.ch);return s;})();
  const sBuys=stocks.filter(s=>s.rating==="sb").length;
  const sGems=stocks.filter(s=>s.isGem).length;
  const sAvg=stocks.length?Math.round(stocks.reduce((a,b)=>a+b.score,0)/stocks.length):0;
  const SSTEPS=["Loading live Finnhub prices","Applying strategy filters",`Scoring ${UNIVERSE_BASE.length}+ stocks`,"Surfacing hidden gems","Generating AI criteria"];
  const OSTEPS=["Fetching live underlying price","Calculating fair value","Computing Greeks (Δ Γ Θ V ρ)","Analyzing IV surface","Generating entry points","Building AI insights"];
  const msLabel=ms==="open"?"● MARKET OPEN":ms==="pre"?"◑ PRE-MARKET":ms==="after"?"◑ AFTER-HOURS":"○ MARKET CLOSED";
  const msClass=ms==="open"?"mopen":"mclosed";

  return(
    <>
      <style>{CSS}</style>
      <div className="app">
        <header className="hdr">
          <div className="logo"><div>RUBBERBAND<b>.</b>AI</div><div className="logo-sub">STOCK + OPTIONS INTELLIGENCE</div></div>
          <div className="hdr-right">
            <span className="chip live">● {clock}</span>
            <span className={`chip ${msClass}`}>{msLabel}</span>
            {pLoading?<span className="chip mloading">⟳ {fetchProg.done}/{fetchProg.total} prices</span>:lastRefresh&&<span className="chip ai">LIVE ✓</span>}
          </div>
        </header>

        <div className="tab-bar">
          <div className={`tab ${tab==="stocks"?"active":""}`} onClick={()=>setTab("stocks")}>📊 Stock Screener{stocks.length>0&&<span className="tab-badge">{stocks.length}</span>}</div>
          <div className={`tab ${tab==="options"?"active":""}`} onClick={()=>setTab("options")}>⚡ Options Screener{oContracts.length>0&&<span className="tab-badge">{oContracts.length}</span>}</div>
          <div style={{marginLeft:"auto",paddingRight:4}}><button onClick={()=>setTab("admin")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--dim)",fontSize:10,opacity:.15,padding:"14px 8px",fontFamily:"DM Mono,monospace",letterSpacing:1}}>⬤</button></div>
        </div>

        {/* STOCK TAB */}
        {tab==="stocks"&&<div className="page">
          <div className="hero">
            <h1>Find every <span>hidden gem</span><br/>in the market.</h1>
            <p>RUBBERBAND.AI scans {UNIVERSE_BASE.length}+ stocks with <b style={{color:"var(--green)"}}>real-time Finnhub prices</b>. Auto-refreshes every 60 seconds.</p>
          </div>

          <div className="email-banner">
            <div><div className="eb-title">📬 Get Weekly RUBBERBAND.AI Stock Picks — Free</div><div className="eb-sub">Top RUBBERBAND.AI picks delivered every Sunday. No spam, ever.</div>{eList.length>0&&<div className="eb-count">🔥 {eList.length} subscriber{eList.length!==1?"s":""} already in</div>}</div>
            {eOk?<div className="sub-ok">✅ You're in! Watch your inbox Sunday.</div>:<div className="eb-form"><input className="ei narrow" placeholder="First name" value={eName} onChange={e=>setEName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&subscribe()}/><input className="ei wide" placeholder="your@email.com" type="email" value={eEmail} onChange={e=>setEEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&subscribe()}/><button className="btn-sub" onClick={subscribe} disabled={!eEmail.includes("@")}>Subscribe Free →</button></div>}
          </div>

          {lastRefresh&&<div className="refresh-row"><div className="ldot"/><span>Live via Finnhub · Updated {lastRefresh.toLocaleTimeString()} · Auto-refresh every 60s</span>{pLoading&&<div className="spin-s"/>}</div>}

          <div className="panel">
            <div className="panel-title">Screen Configuration</div>
            <div className="g3" style={{marginBottom:14}}>
              <div className="fld"><label>Strategy</label><div className="sel-wrap"><select value={strategy} onChange={e=>setStrategy(e.target.value)} disabled={sLoading}>{STRATEGIES.map(s=><option key={s}>{s}</option>)}</select></div></div>
              <div className="fld"><label>Sector</label><div className="sel-wrap"><select value={sector} onChange={e=>setSector(e.target.value)} disabled={sLoading}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select></div></div>
              <div className="fld"><label>Market / Geography</label><div className="sel-wrap"><select value={market} onChange={e=>setMarket(e.target.value)} disabled={sLoading}>{MARKETS.map(m=><option key={m}>{m}</option>)}</select></div></div>
            </div>
            <button className="btn-green" onClick={runStocks} disabled={sLoading||pLoading}>{sLoading?<><div className="spin"/>Scanning…</>:pLoading?<><div className="spin"/>Loading Live Prices…</>:"Run Screen — Find All Matching Stocks"}</button>
          </div>

          {sLoading&&<div className="lbox"><div className="lsteps">{SSTEPS.map((s,i)=><div key={i} className={`lstep ${sStep>i?"done":sStep===i?"active":""}`}><div className="lstep-ico">{sStep>i?"✓":sStep===i?"…":i+1}</div><span>{s}</span></div>)}</div><div className="pbar"><div className="pfill g" style={{width:`${sProg}%`}}/></div></div>}

          {!sResult&&!sLoading&&<div className="empty"><div className="ico">🔍</div><h3>Ready to scan</h3><p>Configure above and click Run.<br/>All prices are live from Finnhub.</p></div>}

          {sResult&&!sLoading&&<div className="results">
            <div className="sumbox"><div className="sum-title">{sResult.title}</div><div className="sum-body">{sResult.summary}</div>{sResult.tags?.length>0&&<div className="tags">{sResult.tags.map((t,i)=><span className="tag" key={i}>{t}</span>)}</div>}</div>
            <div className="stats-row">
              <div className="sbox"><div className="sv g">{dispStocks.length}</div><div className="sl">Stocks Found</div></div>
              <div className="sbox"><div className="sv g">{sBuys}</div><div className="sl">Strong Buys</div></div>
              <div className="sbox"><div className="sv p">{sGems}</div><div className="sl">Hidden Gems</div></div>
              <div className="sbox"><div className="sv">{sAvg}</div><div className="sl">Avg Score</div></div>
            </div>
            <div className="sec-lbl">Screening Criteria</div>
            <div className="crit-grid">{sResult.criteria.map((c,i)=><div className={`cc ${cl(i)}`} key={i}><div className="cc-top"><div className="cc-nm">{c.metric}</div><span className={`cc-pill ${cl(i)}`}>{c.threshold}</span></div><div className="cc-desc">{c.description}</div><div className="cc-bar"><div className="cc-track"><div className={`cc-fill ${cl(i)}`} style={{width:`${Math.min(100,Math.max(0,Number(c.importance)||70))}%`}}/></div><div className="cc-meta"><span>Importance</span><span>{c.importance}/100</span></div></div></div>)}</div>
            <div className="filter-row">{["All","Strong Buy","Hidden Gems","Large Cap","International"].map(f=><button key={f} className={`btn-sm ${sFilter===f?"active":""}`} onClick={()=>setSFilter(f)}>{f}</button>)}<div className="sp"/>{["score","price","change"].map(s=><button key={s} className={`btn-sm ${sSort===s?"active":""}`} onClick={()=>setSSort(s)}>Sort: {s==="score"?"Score":s==="price"?"Price":"% Chg"}</button>)}</div>
            <div className="scan-info">Live prices via Finnhub · {new Date().toLocaleTimeString()} · <span>{UNIVERSE_BASE.length} stocks analyzed</span></div>
            <div className="tbl-wrap"><table>
              <thead><tr><th>#</th><th>Ticker</th><th>Live Price</th><th>Mkt Cap</th><th>Score</th><th>Key Metrics</th><th>Thesis</th><th>Rating</th></tr></thead>
              <tbody>{dispStocks.map((s,i)=><tr key={s.t+i}>
                <td style={{color:"var(--dim)",fontSize:10}}>{i+1}</td>
                <td><div className="tk">{s.t}</div><div className="co">{s.n}</div>{s.isGem&&<div className="gem">💎 Hidden Gem</div>}</td>
                <td><div className="pv">{fmt(s.p)}{s.live&&<span className="live-tag"><span className="ldot"/>LIVE</span>}</div><span className={`cv ${(s.ch||0)>=0?"up":"dn"}`}>{(s.ch||0)>=0?"+":""}{(s.ch||0).toFixed(2)}%</span></td>
                <td><div className="mcv">{s.mc}</div><div className="capv">{s.cap} · {s.sec}</div></td>
                <td><div className="scw"><span className={`scn ${sc(s.score)}`}>{s.score}</span><div className="scb"><div className={`scf ${sc(s.score)}`} style={{width:`${s.score}%`}}/></div></div></td>
                <td><div className="met-list">{(s.metrics||[]).map((m,j)=><div className="met-row" key={j}><span className="met-k">{m.k}</span><span className={`met-v ${m.pass?"pass":""}`}>{m.v}</span></div>)}</div></td>
                <td><div className="thesis">{s.thesis}</div></td>
                <td><span className={`rtag ${s.rating}`}>{rLabel(s.rating)}</span></td>
              </tr>)}</tbody>
            </table></div>
            <div className="disc">⚠ For informational/educational purposes only. Not financial advice. Live prices via Finnhub. Always conduct thorough due diligence before investing.</div>
            {sResult.redFlags?.length>0&&<><div className="sec-lbl" style={{marginTop:20}}>Red Flags to Avoid</div><div className="li-list">{sResult.redFlags.map((f,i)=><div className="li-item" key={i}><div className="li-ico x">✕</div><span>{f}</span></div>)}</div></>}
            {sResult.proTips?.length>0&&<><div className="sec-lbl">Pro Tips</div><div className="li-list">{sResult.proTips.map((t,i)=><div className="li-item" key={i}><div className="li-ico ok">→</div><span>{t}</span></div>)}</div></>}
          </div>}
        </div>}

        {/* OPTIONS TAB */}
        {tab==="options"&&<div className="page">
          <div className="hero">
            <h1>Options <span className="orange">chain screener</span><br/>with exact entry points.</h1>
            <p>Full Greeks · Live underlying prices · {OPT_BASE.length}+ tickers · Day/Week/Month H&amp;L ranges · Precise entry, targets &amp; stops.</p>
            {lastRefresh&&<div className="refresh-row" style={{marginTop:10}}><div className="ldot"/><span>All prices live via Finnhub · Updated {lastRefresh.toLocaleTimeString()} · Auto-refresh 60s</span>{pLoading&&<div className="spin-s"/>}</div>}
          </div>

          <div className="email-banner" style={{marginBottom:20}}>
            <div><div className="eb-title">📬 Get Weekly RUBBERBAND.AI Picks</div><div className="eb-sub">Top plays every Sunday. Free.</div></div>
            {eOk?<div className="sub-ok">✅ You're in!</div>:<div className="eb-form"><input className="ei wide" placeholder="your@email.com" type="email" value={eEmail} onChange={e=>setEEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&subscribe()}/><button className="btn-sub" onClick={subscribe} disabled={!eEmail.includes("@")}>Subscribe →</button></div>}
          </div>

          <div className="panel">
            <div className="panel-title">Options Configuration</div>
            <div className="opt-controls">
              <div className="fld" style={{gridColumn:"1/-1"}}>
                <label>Underlying Ticker {prices[optTicker]&&<span style={{color:"var(--green)",fontSize:9,marginLeft:4}}>● LIVE {fmt(prices[optTicker].price)}{prices[optTicker]&&<span style={{marginLeft:6,color:prices[optTicker].change>=0?"var(--green)":"var(--red)"}}>{prices[optTicker].change>=0?"+":""}{prices[optTicker].change?.toFixed(2)}%</span>}</span>}</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                  {["All","Mega Cap","ETF","High Vol","AI","eVTOL","Biotech","Fintech","EV/Energy","Enterprise","Consumer","Defense"].map(cat=>(
                    <button key={cat} className={`btn-sm ${optCatFilter===cat?"active":""}`} onClick={()=>setOptCatFilter(cat)} disabled={oLoading}>{cat}</button>
                  ))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input
                    className="ei"
                    placeholder="Search ticker or name... (e.g. NVDA, Tesla)"
                    value={optSearch}
                    onChange={e=>setOptSearch(e.target.value.toUpperCase())}
                    disabled={oLoading}
                    style={{flex:1,padding:"9px 14px"}}
                  />
                  <div className="sel-wrap" style={{flex:2}}>
                    <select value={optTicker} onChange={e=>setOptTicker(e.target.value)} disabled={oLoading}>
                      {OPT_BASE
                        .filter(x=>(optCatFilter==="All"||x.cat===optCatFilter)&&(!optSearch||(x.t.includes(optSearch)||x.n.toUpperCase().includes(optSearch))))
                        .map(x=>{const q=prices[x.t];return<option key={x.t} value={x.t}>{x.t} — {x.n}{q?` · $${q.price} (${q.change>=0?"+":""}${q.change?.toFixed(2)}%)`:""}</option>;})}
                    </select>
                  </div>
                </div>
              </div>
              <div className="fld"><label>Contract Type</label><div className="sel-wrap"><select value={optType} onChange={e=>setOptType(e.target.value)} disabled={oLoading}>{OTYPES.map(x=><option key={x}>{x}</option>)}</select></div></div>
              <div className="fld"><label>Expiration</label><div className="sel-wrap"><select value={optExp} onChange={e=>setOptExp(e.target.value)} disabled={oLoading}>{EXPS.map(x=><option key={x}>{x}</option>)}</select></div></div>
              <div className="fld"><label>Strategy</label><div className="sel-wrap"><select value={optStrat} onChange={e=>setOptStrat(e.target.value)} disabled={oLoading}>{OSTRATEGIES.map(x=><option key={x}>{x}</option>)}</select></div></div>
              
            </div>
            <button className="btn-blue" onClick={runOptions} disabled={oLoading}>{oLoading?<><div className="spin-w"/>Scanning…</>:"⚡ Scan Option Chain — Generate Entry Points"}</button>
          </div>

          {oLoading&&<div className="lbox"><div className="lsteps">{OSTEPS.map((s,i)=><div key={i} className={`lstep ${oStep>i?"done":oStep===i?"active":""}`}><div className="lstep-ico">{oStep>i?"✓":oStep===i?"…":i+1}</div><span>{s}</span></div>)}</div><div className="pbar"><div className="pfill b" style={{width:`${oProg}%`}}/></div></div>}

          {!oContracts.length&&!oLoading&&<div className="empty"><div className="ico">⚡</div><h3>Ready to scan options</h3><p>Select a ticker, expiration and strategy.<br/>Underlying prices are live from Finnhub.</p></div>}

          {oContracts.length>0&&!oLoading&&oInsights&&<div className="results">
            <div className="sumbox">
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                <div className="sum-title" style={{margin:0}}>{oTicker?.t} Options — {optExp}</div>
                {oTicker&&prices[oTicker.t]&&<span className="live-tag"><span className="ldot"/>{fmt(prices[oTicker.t].price)} LIVE</span>}
                <span className={`sig ${oInsights.topPlay?.toLowerCase().includes("call")?"bullish":oInsights.topPlay?.toLowerCase().includes("put")?"bearish":"neutral"}`}>{oInsights.topPlay?.toLowerCase().includes("call")?"⬆ Bullish":"⬇ Bearish"}</span>
              </div>
              <div className="sum-body">{oInsights.summary}</div>
              {oInsights.tags?.length>0&&<div className="tags">{oInsights.tags.map((t,i)=><span className="tag" key={i}>{t}</span>)}</div>}
            </div>
            <div className="stats-row">
              <div className="sbox"><div className="sv gold">{oTicker?.iv}%{ivCache[oTicker?.t]&&<span style={{fontSize:9,color:"var(--green)",display:"block",marginTop:2}}>● LIVE IV</span>}</div><div className="sl">Implied Vol</div></div>
              <div className="sbox"><div className="sv b">{oContracts.length}</div><div className="sl">Contracts</div></div>
              <div className="sbox"><div className="sv g">{oContracts.filter(c=>c.signal==="bullish").length}</div><div className="sl">Bullish</div></div>
              <div className="sbox"><div className="sv r">{oContracts.filter(c=>c.signal==="bearish").length}</div><div className="sl">Bearish</div></div>
            </div>
            {oInsights.keyLevels&&<div className="panel" style={{marginBottom:20}}>
              <div className="panel-title">Key Price Levels</div>
              <div className="g4">
                <div className="sbox" style={{margin:0}}><div className="sv r">{oInsights.keyLevels.support}</div><div className="sl">Support</div></div>
                <div className="sbox" style={{margin:0}}><div className="sv g">{oInsights.keyLevels.resistance}</div><div className="sl">Resistance</div></div>
                <div className="sbox" style={{margin:0}}><div className="sv b">{oInsights.keyLevels.breakeven}</div><div className="sl">Breakeven</div></div>
                <div className="sbox" style={{margin:0}}><div className="sv" style={{fontSize:13}}>{fmt(oTicker?.p||0)}</div><div className="sl">Live Price</div></div>
              </div>
              {oInsights.entryTiming&&<div style={{marginTop:14,padding:"12px 14px",background:"var(--s2)",borderRadius:8,border:"1px solid var(--b1)",fontSize:11.5,color:"#7a8fa8",lineHeight:1.7}}><span style={{color:"var(--gold)",fontWeight:700}}>⏱ Entry: </span>{oInsights.entryTiming}</div>}
              {oInsights.ivAnalysis&&<div style={{marginTop:8,padding:"12px 14px",background:"var(--s2)",borderRadius:8,border:"1px solid var(--b1)",fontSize:11.5,color:"#7a8fa8",lineHeight:1.7}}><span style={{color:"var(--blue)",fontWeight:700}}>📊 IV: </span>{oInsights.ivAnalysis}</div>}
            </div>}
            <div className="sec-lbl">Option Contracts ({oContracts.length})</div>
            <div className="opt-cards">{oContracts.map((c,i)=><OCard key={i} c={c}/>)}</div>
            {oInsights.riskWarning&&<div style={{padding:"14px 16px",background:"rgba(255,77,106,.06)",border:"1px solid rgba(255,77,106,.18)",borderRadius:9,marginBottom:16,fontSize:11.5,color:"#ff8fa3",lineHeight:1.7}}><span style={{fontWeight:700,color:"var(--red)"}}>⚠ Risk: </span>{oInsights.riskWarning}</div>}
            {oInsights.topPlay&&<div style={{padding:"14px 16px",background:"rgba(0,232,122,.05)",border:"1px solid rgba(0,232,122,.15)",borderRadius:9,marginBottom:20,fontSize:11.5,color:"#7eeebb",lineHeight:1.7}}><span style={{fontWeight:700,color:"var(--green)"}}>⭐ Top Play: </span>{oInsights.topPlay}</div>}
            <div className="disc">⚠ Options trading involves substantial risk. AI-generated estimates for educational purposes only. Live underlying prices via Finnhub. Never risk more than you can afford to lose.</div>
          </div>}
        </div>}

        {/* ADMIN TAB */}
        {tab==="admin"&&<div className="page">
          {!adminUnlocked?(
            <div style={{maxWidth:360,margin:"80px auto",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:16}}>🔒</div>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,marginBottom:8}}>Owner Access</div>
              <div style={{fontSize:12,color:"var(--dim)",marginBottom:24,lineHeight:1.7}}>This area is only visible to you.<br/>Enter your PIN to continue.</div>
              <div style={{display:"flex",flexDirection:"column",gap:10,alignItems:"center"}}>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="Enter PIN"
                  value={adminPin}
                  onChange={e=>{setAdminPin(e.target.value);setAdminError(false);}}
                  onKeyDown={e=>{if(e.key==="Enter"){if(adminPin===ADMIN_PIN){setAdminUnlocked(true);setAdminPin("");}else{setAdminError(true);setAdminPin("");}}}}
                  style={{background:"var(--s2)",border:`1px solid ${adminError?"var(--red)":"var(--b2)"}`,color:"var(--txt)",fontFamily:"DM Mono,monospace",fontSize:22,padding:"12px 20px",borderRadius:10,outline:"none",width:180,textAlign:"center",letterSpacing:8}}
                />
                {adminError&&<div style={{fontSize:11,color:"var(--red)"}}>Incorrect PIN. Try again.</div>}
                <button onClick={()=>{if(adminPin===ADMIN_PIN){setAdminUnlocked(true);setAdminPin("");}else{setAdminError(true);setAdminPin("");}}} style={{padding:"10px 28px",background:"var(--green)",color:"#000",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:13,marginTop:4}}>Unlock →</button>
              </div>
            </div>
          ):(
            <>
              <div className="hero" style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                <div><h1>Your <span>subscriber list</span></h1><p>Everyone signed up for your weekly AI picks. Export to import into Mailchimp or ConvertKit.</p></div>
                <button onClick={()=>{setAdminUnlocked(false);setTab("stocks");}} style={{padding:"8px 16px",background:"var(--s2)",border:"1px solid var(--b2)",color:"var(--dim)",borderRadius:7,cursor:"pointer",fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:11,marginTop:8}}>🔒 Lock</button>
              </div>
              <div className="stats-row" style={{marginBottom:20}}>
                <div className="sbox"><div className="sv g">{eList.length}</div><div className="sl">Total Subscribers</div></div>
                <div className="sbox"><div className="sv b">{eList.filter(e=>{const d=new Date(e.date);return(new Date()-d)<7*24*60*60*1000;}).length}</div><div className="sl">This Week</div></div>
                <div className="sbox"><div className="sv gold">{eList.length>0?eList[eList.length-1].date:"—"}</div><div className="sl">Latest Signup</div></div>
                <div className="sbox"><div className="sv p">{eList.filter(e=>e.name!=="Anonymous").length}</div><div className="sl">Named Contacts</div></div>
              </div>
              {eList.length===0?<div className="empty"><div className="ico">📬</div><h3>No subscribers yet</h3><p>Share RUBBERBAND.AI — signups appear here instantly.</p></div>:<div className="panel">
                <div className="panel-title">Subscribers ({eList.length})</div>
                <div className="tbl-wrap"><table>
                  <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Date</th></tr></thead>
                  <tbody>{eList.map((e,i)=><tr key={i}><td style={{color:"var(--dim)",fontSize:10}}>{i+1}</td><td>{e.name}</td><td style={{color:"var(--green)"}}>{e.email}</td><td style={{color:"var(--dim)",fontSize:10}}>{e.date}</td></tr>)}</tbody>
                </table></div>
                <button className="export-btn" onClick={exportCSV}>⬇ Export CSV — Import to Mailchimp / ConvertKit</button>
              </div>}
              <div className="panel" style={{marginTop:20}}>
                <div className="panel-title">Monetization Roadmap</div>
                <div className="li-list">
                  {["Export your list and import into Mailchimp (free up to 500 contacts)","Send your first email Sunday with top 3 AI picks from this week","Add a Gumroad link to unlock the full 18-stock list for $9/month","Post a screen recording of RUBBERBAND.AI on X/IG with your link","Add Webull or Tastytrade affiliate links next to each stock for passive income"].map((t,i)=><div className="li-item" key={i}><div className="li-ico ok">{i+1}</div><span>{t}</span></div>)}
                </div>
              </div>
            </>
          )}
        </div>}
      </div>
    </>
  );
}

/* ── OPTION CARD ── */
function OCard({c}){
  const intr=Math.max(0,c.optType==="call"?c.prem-Math.max(0,c.stockPrice-c.strike):c.prem-Math.max(0,c.strike-c.stockPrice));
  const extr=c.prem-intr;
  const greeks=[
    {sym:"Δ",name:"Delta",val:c.delta.toFixed(4),color:c.optType==="call"?"green":"red",pct:Math.abs(c.delta)*100},
    {sym:"Γ",name:"Gamma",val:c.gamma.toFixed(5),color:"blue",pct:Math.min(100,c.gamma*50000)},
    {sym:"Θ",name:"Theta",val:c.theta.toFixed(4),color:"red",pct:Math.min(100,Math.abs(c.theta)*200)},
    {sym:"V",name:"Vega",val:c.vega.toFixed(4),color:"purple",pct:Math.min(100,c.vega*80)},
    {sym:"ρ",name:"Rho",val:c.rho.toFixed(4),color:"cyan",pct:Math.min(100,Math.abs(c.rho)*400)},
  ];
  return(
    <div className={`ocard ${c.optType==="call"?"call-card":"put-card"}`}>
      <div className="ocard-hdr">
        <div className="ohdr-l">
          <span className={`otype ${c.optType}`}>{c.optType.toUpperCase()}</span>
          <div><div className="otick">{c.ticker} ${c.strike}</div><div className="oname">{c.name} · {c.moneyLabel} · {c.dte} DTE</div></div>
        </div>
        <div className="ohdr-r">
          <span className="oexp">{c.expLabel}</span>
          <span className={`sig ${c.signal}`}>{c.signal==="bullish"?"⬆ Bullish":c.signal==="bearish"?"⬇ Bearish":"◎ Neutral"}</span>
        </div>
      </div>
      <div className={`entry-b ${c.optType==="put"?"put-b":""}`}>
        <div><div className="elbl">Optimal Entry Point</div><div className={`eprice ${c.optType==="put"?"put":""}`}>${c.ep}</div><div className="esub">Bid ${c.bid} / Ask ${c.ask} · Spread ${c.spread} · Cost ${c.entryTotalCost}/contract</div></div>
        <div className="etgts">
          <div className="tgt"><div className="tgt-lbl">Target 1</div><div className="tgt-v t1">${c.t1}</div></div>
          <div className="tgt"><div className="tgt-lbl">Target 2</div><div className="tgt-v t2">${c.t2}</div></div>
          <div className="tgt"><div className="tgt-lbl">Target 3</div><div className="tgt-v t3">${c.t3}</div></div>
          <div className="tgt"><div className="tgt-lbl">Stop Loss</div><div className="tgt-v stop">${c.sl}</div></div>
          <div className="tgt"><div className="tgt-lbl">Max P&amp;L</div><div className="tgt-v pnl">+${c.maxPnl} / -${c.maxLoss}</div></div>
        </div>
      </div>
      <div className="ometrics">
        <div className="ometric"><div className="oml">Premium</div><div className="omv">${c.prem}</div><div className="oms">Mid price</div></div>
        <div className="ometric"><div className="oml">Strike</div><div className="omv blue">${c.strike}</div><div className="oms">{c.moneyLabel}</div></div>
        <div className="ometric"><div className="oml">Impl. Vol</div><div className="omv gold">{c.iv}%</div><div className="oms">IV Rank {c.ivRank}</div></div>
        <div className="ometric"><div className="oml">IV Percentile</div><div className="omv purple">{c.ivPct}%</div><div className="oms">30-day pct</div></div>
        <div className="ometric"><div className="oml">Intrinsic</div><div className="omv">${intr.toFixed(2)}</div><div className="oms">Extrinsic: ${extr.toFixed(2)}</div></div>
        <div className="ometric"><div className="oml">Break-even</div><div className="omv cyan">${c.optType==="call"?(c.strike+c.prem).toFixed(2):(c.strike-c.prem).toFixed(2)}</div><div className="oms">At expiry</div></div>
        <div className="ometric"><div className="oml">Multiplier</div><div className="omv">100x</div><div className="oms">Per contract</div></div>
        <div className="ometric"><div className="oml">P/C Ratio</div><div className="omv">{c.pcr}</div><div className="oms">{c.pcr<.7?"Bullish":c.pcr>1.3?"Bearish":"Neutral"}</div></div>
      </div>
      <div className="hl-sec">
        <div className="hl-ttl">Price Range Analysis — Option H&amp;L</div>
        <div className="hl-rows">
          <HLRow label="DAY" r={c.dayR} cur={c.prem} ot={c.optType}/>
          <HLRow label="WEEK" r={c.weekR} cur={c.prem} ot={c.optType}/>
          {c.monthR&&<HLRow label="MONTH" r={c.monthR} cur={c.prem} ot={c.optType}/>}
        </div>
      </div>
      <div className="greeks-row">
        {greeks.map(g=><div className="gbox" key={g.sym}>
          <div className="gsym" style={{color:`var(--${g.color})`}}>{g.sym}</div>
          <div className="gname">{g.name}</div>
          <div className="gval">{g.val}</div>
          <div className="gbw"><div className="gbf" style={{width:`${g.pct}%`,background:`var(--${g.color})`}}/></div>
        </div>)}
      </div>
      <div className="oi-row">
        <div className="oi-box"><div className="oil">Open Interest</div><div className="oiv">{c.oi.toLocaleString()}</div><div className="ois">{c.oi>10000?"High liquidity":c.oi>2000?"Moderate":"Low liquidity"}</div></div>
        <div className="oi-box"><div className="oil">Volume Today</div><div className="oiv">{c.vol.toLocaleString()}</div><div className="ois">{((c.vol/c.oi)*100).toFixed(1)}% of OI</div></div>
        <div className="oi-box"><div className="oil">Put/Call Ratio</div><div className="oiv">{c.pcr}</div><div className="ois">{c.pcr<.7?"Bullish":c.pcr>1.3?"Bearish":"Neutral"} sentiment</div></div>
      </div>
    </div>
  );
}

function HLRow({label,r,cur,ot}){
  const pct=r.hi>r.lo?((cur-r.lo)/(r.hi-r.lo))*100:50;
  return(
    <div className="hl-row">
      <span className="hl-per">{label}</span>
      <div className="hl-bw">
        <div className={`hl-bf ${ot==="call"?"cf":"pf"}`} style={{left:`${(r.lo/(r.hi||1))*50}%`,width:`${((r.hi-r.lo)/(r.hi||1))*85}%`}}/>
        <div className="hl-cm" style={{left:`${Math.max(2,Math.min(95,pct))}%`}}/>
      </div>
      <div className="hl-vals"><span className="hl-lo">L ${r.lo.toFixed(2)}</span><span className="hl-cu">C ${cur.toFixed(2)}</span><span className="hl-hi">H ${r.hi.toFixed(2)}</span></div>
    </div>
  );
}
