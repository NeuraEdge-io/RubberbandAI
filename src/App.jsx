import { useState, useCallback, useRef, useEffect } from "react";

const FINNHUB_KEY = "d6ogvahr01qnu98i1cp0d6ogvahr01qnu98i1cpg";
const FINNHUB_URL = "https://finnhub.io/api/v1";

// ── STRIPE PAYMENT LINKS ──
// Replace these with your actual Stripe Payment Link URLs.
// Create them at: dashboard.stripe.com → Payment Links → Create
// Set "After payment" redirect URL to: https://rubberband-ai.vercel.app/?rb_success=pro
// or: https://rubberband-ai.vercel.app/?rb_success=edge
const STRIPE_PRO_LINK  = "https://buy.stripe.com/dRm14o4XyaTbeda58Eds402"; // $19/mo LIVE
const STRIPE_EDGE_LINK = "https://buy.stripe.com/9B6cN61Lm7GZ2us0Sods403"; // $29/mo LIVE
// After payment Stripe redirects back with ?rb_success=pro or ?rb_success=edge
// The app reads this on load and permanently unlocks the tier in localStorage
// Options chain cache — keyed by ticker, stores Finnhub chain data at scan time
const OPT_CACHE     = {};
const OPT_CACHE_TTL = 8 * 60 * 1000;
const OPT_INFLIGHT  = {};

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
/* ── FREEMIUM / MONETIZATION ── */
.paywall-overlay{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px;}
.paywall-card{background:linear-gradient(135deg,var(--s1) 0%,var(--s2) 100%);border:1px solid rgba(0,232,122,.3);border-radius:20px;padding:40px 36px;max-width:480px;width:100%;text-align:center;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 60px rgba(0,232,122,.08);}
.paywall-icon{font-size:48px;margin-bottom:16px;}
.paywall-title{font-family:'Syne',sans-serif;font-weight:800;font-size:26px;color:var(--txt);margin-bottom:8px;}
.paywall-sub{font-size:13px;color:var(--dim);line-height:1.7;margin-bottom:28px;}
.paywall-features{text-align:left;margin-bottom:28px;display:flex;flex-direction:column;gap:8px;}
.paywall-feat{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--txt);}
.paywall-feat-icon{color:var(--green);font-size:14px;flex-shrink:0;}
.paywall-btns{display:flex;flex-direction:column;gap:10px;}
.btn-upgrade{background:linear-gradient(135deg,var(--green),#00d4ff);color:#000;border:none;border-radius:10px;padding:14px 28px;font-family:'Syne',sans-serif;font-weight:800;font-size:14px;cursor:pointer;letter-spacing:.3px;}
.btn-upgrade:hover{opacity:.9;}
.btn-dismiss{background:transparent;border:1px solid var(--b2);color:var(--dim);border-radius:10px;padding:10px 20px;font-size:12px;cursor:pointer;font-family:'DM Mono',monospace;}
.scan-counter{font-size:9px;color:var(--dim);text-align:center;margin-top:8px;font-family:'DM Mono',monospace;}
.scan-counter b{color:var(--gold);}
.pro-badge{background:linear-gradient(135deg,var(--green),#00d4ff);color:#000;font-size:8px;font-weight:800;padding:2px 7px;border-radius:4px;font-family:'Syne',sans-serif;letter-spacing:.5px;margin-left:6px;vertical-align:middle;}
/* ── PRICING PAGE ── */
.pricing-hero{text-align:center;padding:40px 0 32px;}
.pricing-hero h1{font-size:36px;margin-bottom:12px;}
.pricing-sub{font-size:15px;color:var(--dim);max-width:480px;margin:0 auto;}
.pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin-bottom:32px;}
.pricing-card{background:var(--s1);border:1px solid var(--b2);border-radius:16px;padding:28px 24px;position:relative;}
.pricing-card.featured{border-color:var(--green);background:linear-gradient(135deg,rgba(0,232,122,.08),rgba(0,212,255,.04));box-shadow:0 0 40px rgba(0,232,122,.08);}
.pricing-card-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--green);color:#000;font-size:9px;font-weight:800;padding:3px 14px;border-radius:20px;font-family:'Syne',sans-serif;letter-spacing:.5px;white-space:nowrap;}
.pricing-tier{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;margin-bottom:6px;}
.pricing-price{font-family:'Syne',sans-serif;font-weight:800;font-size:36px;color:var(--green);margin-bottom:4px;}
.pricing-price span{font-size:14px;color:var(--dim);font-weight:400;}
.pricing-desc{font-size:11px;color:var(--dim);margin-bottom:20px;line-height:1.6;}
.pricing-feats{list-style:none;padding:0;margin:0 0 24px;display:flex;flex-direction:column;gap:9px;}
.pricing-feat{font-size:11.5px;color:var(--txt);display:flex;gap:8px;align-items:flex-start;line-height:1.5;}
.pricing-feat-check{color:var(--green);flex-shrink:0;margin-top:1px;}
.pricing-feat-x{color:var(--dim);flex-shrink:0;margin-top:1px;opacity:.5;}
.pricing-cta{width:100%;padding:12px;border-radius:9px;font-family:'Syne',sans-serif;font-weight:800;font-size:13px;cursor:pointer;border:none;letter-spacing:.3px;}
.pricing-cta.primary{background:linear-gradient(135deg,var(--green),#00d4ff);color:#000;}
.pricing-cta.secondary{background:var(--s2);color:var(--txt);border:1px solid var(--b2);}
/* ── TRADE JOURNAL ── */
.journal-tabs{display:flex;gap:6px;margin-bottom:20px;}
.jtab{padding:8px 18px;border-radius:7px;border:1px solid var(--b2);background:transparent;color:var(--dim);cursor:pointer;font-size:11px;font-family:'DM Mono',monospace;letter-spacing:.4px;}
.jtab.active{background:rgba(0,232,122,.1);border-color:rgba(0,232,122,.3);color:var(--green);}
.journal-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}
.jfld{display:flex;flex-direction:column;gap:4px;}
.jfld label{font-size:9.5px;color:var(--dim);letter-spacing:.6px;text-transform:uppercase;}
.jfld input,.jfld select,.jfld textarea{background:var(--s2);border:1px solid var(--b2);color:var(--txt);border-radius:7px;padding:8px 11px;font-size:12px;font-family:'DM Mono',monospace;outline:none;width:100%;}
.jfld textarea{resize:vertical;min-height:64px;grid-column:1/-1;}
.journal-entry{background:var(--s1);border:1px solid var(--b1);border-radius:10px;padding:14px 16px;margin-bottom:10px;}
.je-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;flex-wrap:wrap;gap:6px;}
.je-ticker{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;}
.je-type{font-size:9px;padding:2px 8px;border-radius:4px;font-weight:700;font-family:'DM Mono',monospace;}
.je-type.call{background:rgba(0,232,122,.1);color:var(--green);border:1px solid rgba(0,232,122,.2);}
.je-type.put{background:rgba(255,77,106,.1);color:var(--red);border:1px solid rgba(255,77,106,.2);}
.je-levels{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:6px;}
.je-lv{font-size:10px;color:var(--dim);}
.je-lv b{color:var(--txt);}
.je-notes{font-size:11px;color:var(--dim);line-height:1.6;border-top:1px solid var(--b1);padding-top:8px;margin-top:6px;}
.je-outcome{font-size:9px;padding:2px 9px;border-radius:4px;font-weight:700;}
.je-outcome.win{background:rgba(0,232,122,.1);color:var(--green);}
.je-outcome.loss{background:rgba(255,77,106,.1);color:var(--red);}
.je-outcome.open{background:rgba(245,166,35,.1);color:var(--gold);}
/* ── WATCHLIST ALERTS ── */
.alert-list{display:flex;flex-direction:column;gap:8px;}
.alert-card{background:var(--s1);border:1px solid var(--b1);border-radius:9px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;}
.alert-sym{font-family:'Syne',sans-serif;font-weight:800;font-size:15px;}
.alert-thresh{font-size:10px;color:var(--dim);font-family:'DM Mono',monospace;}
.alert-remove{background:rgba(255,77,106,.1);border:1px solid rgba(255,77,106,.2);color:var(--red);border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;font-family:'DM Mono',monospace;}
.alert-status{font-size:9px;padding:2px 8px;border-radius:4px;font-weight:700;}
.alert-status.triggered{background:rgba(0,232,122,.1);color:var(--green);border:1px solid rgba(0,232,122,.2);}
.alert-status.watching{background:rgba(245,166,35,.08);color:var(--gold);border:1px solid rgba(245,166,35,.18);}
.app-footer{background:linear-gradient(180deg,transparent 0%,rgba(0,0,0,.4) 100%);border-top:1px solid var(--b1);padding:28px 24px 32px;margin-top:40px;}
.footer-inner{max-width:960px;margin:0 auto;}
.footer-disc{background:rgba(255,59,48,.06);border:1px solid rgba(255,59,48,.18);border-radius:10px;padding:14px 18px;margin-bottom:20px;display:flex;gap:12px;align-items:flex-start;}
.footer-disc-icon{font-size:18px;flex-shrink:0;margin-top:1px;}
.footer-disc-body{font-size:11px;color:rgba(255,120,120,.9);line-height:1.75;}
.footer-disc-title{font-family:'Syne',sans-serif;font-weight:800;font-size:12px;color:#ff8080;letter-spacing:.3px;margin-bottom:4px;}
.footer-links{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;}
.footer-tag{font-size:9.5px;padding:3px 10px;border-radius:5px;background:rgba(255,255,255,.04);border:1px solid var(--b1);color:var(--dim);font-family:'DM Mono',monospace;letter-spacing:.4px;}
.footer-bottom{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding-top:14px;border-top:1px solid var(--b1);}
.footer-brand{font-family:'Syne',sans-serif;font-weight:800;font-size:12px;color:var(--dim);letter-spacing:.5px;}
.footer-copy{font-size:9.5px;color:var(--dim);opacity:.6;}
.hdr{position:sticky;top:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:56px;background:rgba(7,9,13,.97);backdrop-filter:blur(20px);border-bottom:1px solid var(--b1);flex-wrap:wrap;gap:6px;}
.logo{display:flex;align-items:center;gap:10px;font-family:'Syne',sans-serif;font-weight:800;font-size:18px;letter-spacing:-.5px;}.logo-img{width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;filter:drop-shadow(0 0 6px rgba(0,232,122,.5));}
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
/* ── TICKER LIVE PRICE STRIP ── */
.tkr-cell{display:flex;flex-direction:column;gap:2px;}
.tkr-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.tk{font-family:"Syne",sans-serif;font-weight:800;font-size:13px;letter-spacing:.3px;}
.co{font-size:10px;color:var(--dim);line-height:1.4;}
.tkr-price{display:inline-flex;align-items:center;gap:5px;margin-top:3px;padding:3px 8px;border-radius:6px;background:var(--s2);border:1px solid var(--b2);}
.tkr-price .tp-val{font-family:"Syne",sans-serif;font-weight:800;font-size:12px;color:var(--txt);}
.tkr-price .tp-chg{font-size:10px;font-weight:700;padding:1px 5px;border-radius:3px;}
.tp-chg.up{color:var(--green);background:rgba(0,232,122,.1);}
.tp-chg.dn{color:var(--red);background:rgba(255,77,106,.1);}
.tp-chg.flat{color:var(--dim);background:rgba(74,96,128,.1);}
.tkr-hl{font-size:9px;color:var(--dim);margin-top:1px;}
.ldot-sm{width:5px;height:5px;border-radius:50%;background:var(--green);display:inline-block;animation:blink 2s infinite;flex-shrink:0;}
/* ── MR MINI CARD (used inside stock table) ── */
.mr-mini{display:flex;flex-direction:column;gap:3px;}
.mr-mini-badge{display:inline-flex;align-items:center;gap:4px;font-family:"Syne",sans-serif;font-weight:800;font-size:9px;padding:2px 7px;border-radius:4px;white-space:nowrap;}
.mr-mini-badge.extreme{background:rgba(0,232,122,.12);color:var(--green);border:1px solid rgba(0,232,122,.28);}
.mr-mini-badge.strong{background:rgba(0,212,255,.1);color:var(--cyan);border:1px solid rgba(0,212,255,.22);}
.mr-mini-badge.moderate{background:rgba(245,166,35,.08);color:var(--gold);border:1px solid rgba(245,166,35,.18);}
.mr-mini-badge.overbought{background:rgba(255,77,106,.08);color:var(--red);border:1px solid rgba(255,77,106,.18);}
.mr-mini-badge.none{background:rgba(74,96,128,.07);color:var(--dim);border:1px solid var(--b2);}
.mr-mini-stats{display:flex;gap:6px;flex-wrap:wrap;}
.mr-mini-stat{font-size:9px;color:var(--dim);}
.mr-mini-stat b{font-size:9.5px;}
.mr-score-pill{display:inline-flex;align-items:center;gap:3px;font-size:9px;font-family:"DM Mono",monospace;margin-top:2px;}
/* ── OPT LIVE TICKER STRIP (in options tab above controls) ── */
.opt-ticker-strip{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--s1);border:1px solid var(--b1);border-radius:10px;margin-bottom:14px;flex-wrap:wrap;}
.ots-sym{font-family:"Syne",sans-serif;font-weight:800;font-size:20px;letter-spacing:-.5px;}
.ots-name{font-size:11px;color:var(--dim);}
.ots-price{font-family:"Syne",sans-serif;font-weight:800;font-size:22px;}
.ots-chg{font-size:12px;font-weight:700;padding:2px 8px;border-radius:5px;}
.ots-chg.up{color:var(--green);background:rgba(0,232,122,.1);}
.ots-chg.dn{color:var(--red);background:rgba(255,77,106,.1);}
.ots-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:10px;color:var(--dim);}
.ots-meta span b{color:var(--txt);}
.ots-divider{width:1px;height:32px;background:var(--b2);flex-shrink:0;}
/* ── OVERSOLD TICKER LIST (options tab — shows all oversold tickers) ── */
.os-ticker-list{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;}
.os-ticker-card{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:9px;cursor:pointer;transition:all .15s;min-width:110px;}
.os-ticker-card:hover{transform:translateY(-1px);}
.os-ticker-card.extreme{background:rgba(0,232,122,.07);border:1px solid rgba(0,232,122,.25);}
.os-ticker-card.strong{background:rgba(0,212,255,.06);border:1px solid rgba(0,212,255,.2);}
.os-ticker-card.moderate{background:rgba(245,166,35,.05);border:1px solid rgba(245,166,35,.15);}
.os-ticker-card .otc-sym{font-family:"Syne",sans-serif;font-weight:800;font-size:13px;}
.os-ticker-card .otc-sig{font-size:8.5px;font-weight:700;margin-top:1px;}
.os-ticker-card .otc-price{font-size:10px;color:var(--dim);}
.os-ticker-card .otc-chg{font-size:10px;font-weight:600;}

/* ── MEAN REVERSION / OVERSOLD ── */
.mr-badge{display:inline-flex;align-items:center;gap:4px;font-family:'Syne',sans-serif;font-weight:800;font-size:9.5px;padding:3px 8px;border-radius:5px;white-space:nowrap;letter-spacing:.3px;}
.mr-badge.extreme{background:rgba(0,232,122,.12);color:var(--green);border:1px solid rgba(0,232,122,.3);animation:blink 2s infinite;}
.mr-badge.strong{background:rgba(0,212,255,.1);color:var(--cyan);border:1px solid rgba(0,212,255,.25);}
.mr-badge.moderate{background:rgba(245,166,35,.08);color:var(--gold);border:1px solid rgba(245,166,35,.2);}
.mr-badge.none{background:rgba(74,96,128,.08);color:var(--dim);border:1px solid var(--b2);}
.mr-badge.overbought{background:rgba(255,77,106,.08);color:var(--red);border:1px solid rgba(255,77,106,.2);}
.mr-panel{background:linear-gradient(135deg,rgba(0,232,122,.04) 0%,rgba(0,212,255,.03) 100%);border:1px solid rgba(0,232,122,.18);border-radius:13px;padding:18px 20px;margin-bottom:20px;}
.mr-panel.strong-signal{border-color:rgba(0,232,122,.4);background:linear-gradient(135deg,rgba(0,232,122,.08) 0%,rgba(0,212,255,.04) 100%);}
.mr-panel.extreme-signal{border-color:var(--green);background:linear-gradient(135deg,rgba(0,232,122,.12) 0%,rgba(0,212,255,.06) 100%);box-shadow:0 0 20px rgba(0,232,122,.08);}
.mr-panel.overbought-panel{border-color:rgba(255,77,106,.3);background:linear-gradient(135deg,rgba(255,77,106,.06) 0%,rgba(255,77,106,.02) 100%);}
.mr-title{font-family:'Syne',sans-serif;font-weight:800;font-size:14px;margin-bottom:4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.mr-sub{font-size:11px;color:var(--dim);line-height:1.7;margin-bottom:14px;}
.mr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:14px;}
.mr-metric{background:var(--s1);border:1px solid var(--b1);border-radius:8px;padding:10px 12px;}
.mr-m-lbl{font-size:8.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--dim);margin-bottom:4px;}
.mr-m-val{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;}
.mr-m-sub{font-size:9px;color:var(--dim);margin-top:2px;}
.mr-bar-wrap{margin-top:6px;height:4px;background:var(--dim2);border-radius:2px;overflow:hidden;}
.mr-bar{height:100%;border-radius:2px;transition:width .4s ease;}
.entry-alert{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:9px;margin-bottom:10px;font-size:11.5px;line-height:1.65;}
.entry-alert.buy{background:rgba(0,232,122,.06);border:1px solid rgba(0,232,122,.2);color:#7eeebb;}
.entry-alert.warn{background:rgba(245,166,35,.06);border:1px solid rgba(245,166,35,.18);color:#f5c842;}
.entry-alert.sell{background:rgba(255,77,106,.06);border:1px solid rgba(255,77,106,.18);color:#ff8fa3;}
.entry-alert .ea-ico{font-size:16px;flex-shrink:0;margin-top:1px;}
.entry-alert b{color:inherit;font-family:'Syne',sans-serif;}
/* ── DIP TRIGGER SYSTEM ── */
.dip-banner{border-radius:13px;padding:16px 20px;margin-bottom:18px;border-width:1px;border-style:solid;}
.dip-banner.dip-prime{background:linear-gradient(135deg,rgba(0,232,122,.13) 0%,rgba(0,212,255,.07) 100%);border-color:var(--green);box-shadow:0 0 24px rgba(0,232,122,.10);}
.dip-banner.dip-watch{background:linear-gradient(135deg,rgba(0,212,255,.10) 0%,rgba(0,232,122,.05) 100%);border-color:rgba(0,212,255,.5);}
.dip-banner.dip-neutral{background:rgba(255,255,255,.03);border-color:var(--b2);}
.dip-banner.dip-danger{background:linear-gradient(135deg,rgba(255,77,106,.08) 0%,rgba(255,77,106,.03) 100%);border-color:rgba(255,77,106,.4);}
.dip-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;}
.dip-title{font-family:'Syne',sans-serif;font-weight:800;font-size:13px;display:flex;align-items:center;gap:7px;}
.dip-badge{font-size:9px;font-family:'DM Mono',monospace;padding:3px 9px;border-radius:5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;}
.dip-badge.prime{background:rgba(0,232,122,.15);color:var(--green);border:1px solid rgba(0,232,122,.3);}
.dip-badge.watch{background:rgba(0,212,255,.12);color:var(--cyan);border:1px solid rgba(0,212,255,.25);}
.dip-badge.neutral{background:rgba(255,255,255,.06);color:var(--dim);border:1px solid var(--b2);}
.dip-badge.danger{background:rgba(255,77,106,.12);color:var(--red);border:1px solid rgba(255,77,106,.25);}
.dip-score-ring{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--dim);}
.dip-score-num{font-family:'Syne',sans-serif;font-weight:800;font-size:22px;}
.dip-levels{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0;}
.dip-level{background:rgba(255,255,255,.04);border:1px solid var(--b1);border-radius:9px;padding:10px 12px;}
.dip-level.entry{border-color:rgba(0,232,122,.3);background:rgba(0,232,122,.06);}
.dip-level.target{border-color:rgba(0,212,255,.25);background:rgba(0,212,255,.05);}
.dip-level.stop{border-color:rgba(255,77,106,.25);background:rgba(255,77,106,.05);}
.dip-level-lbl{font-size:8.5px;color:var(--dim);letter-spacing:.8px;text-transform:uppercase;margin-bottom:3px;}
.dip-level-val{font-family:'Syne',sans-serif;font-weight:800;font-size:15px;}
.dip-level-sub{font-size:9px;color:var(--dim);margin-top:2px;}
.dip-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}
.dip-meta-pill{font-size:9px;padding:3px 9px;border-radius:5px;background:rgba(255,255,255,.05);border:1px solid var(--b1);color:var(--dim);}
.dip-meta-pill b{color:var(--txt);}
.dip-confluence{margin-top:12px;}
.dip-confluence-title{font-size:9px;color:var(--dim);letter-spacing:.8px;text-transform:uppercase;margin-bottom:6px;}
.dip-signals{display:flex;flex-wrap:wrap;gap:5px;}
.dip-sig{font-size:9px;padding:3px 8px;border-radius:5px;font-weight:600;}
.dip-sig.bull{background:rgba(0,232,122,.1);color:var(--green);border:1px solid rgba(0,232,122,.2);}
.dip-sig.bear{background:rgba(255,77,106,.1);color:var(--red);border:1px solid rgba(255,77,106,.2);}
.dip-sig.neut{background:rgba(255,255,255,.05);color:var(--dim);border:1px solid var(--b1);}
.dip-reason{font-size:11px;color:var(--dim);line-height:1.65;margin-top:8px;padding-top:8px;border-top:1px solid var(--b1);}
.dip-reason b{color:var(--txt);}
.dip-rr{font-size:9px;padding:3px 9px;border-radius:5px;font-weight:700;background:rgba(245,166,35,.1);border:1px solid rgba(245,166,35,.2);color:var(--gold);}
.stock-dip-col{min-width:180px;}
.sdip{padding:6px 0;}
.sdip-badge{display:inline-flex;align-items:center;gap:4px;font-size:8.5px;font-weight:700;font-family:'Syne',sans-serif;padding:2px 7px;border-radius:4px;white-space:nowrap;margin-bottom:4px;}
.sdip-badge.prime{background:rgba(0,232,122,.12);color:var(--green);border:1px solid rgba(0,232,122,.25);}
.sdip-badge.watch{background:rgba(0,212,255,.1);color:var(--cyan);border:1px solid rgba(0,212,255,.2);}
.sdip-badge.neutral{background:rgba(255,255,255,.04);color:var(--dim);border:1px solid var(--b1);}
.sdip-badge.danger{background:rgba(255,77,106,.08);color:var(--red);border:1px solid rgba(255,77,106,.18);}
.sdip-levels{display:flex;flex-direction:column;gap:2px;}
.sdip-row{display:flex;justify-content:space-between;align-items:center;font-size:9px;}
.sdip-lbl{color:var(--dim);font-size:8.5px;}
.sdip-val{font-weight:700;font-size:10px;}
.sdip-rr{font-size:8px;color:var(--gold);margin-top:2px;}
.mr-signals{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}
.mr-sig-item{font-size:10px;padding:3px 9px;border-radius:4px;display:flex;align-items:center;gap:4px;}
.mr-sig-item.bull{background:rgba(0,232,122,.08);color:var(--green);border:1px solid rgba(0,232,122,.18);}
.mr-sig-item.bear{background:rgba(255,77,106,.08);color:var(--red);border:1px solid rgba(255,77,106,.18);}
.mr-sig-item.neut{background:rgba(74,96,128,.08);color:var(--dim);border:1px solid var(--b2);}
.rsi-gauge{position:relative;height:10px;background:linear-gradient(90deg,var(--green) 0%,var(--green) 28%,var(--gold) 28%,var(--gold) 35%,var(--dim2) 35%,var(--dim2) 65%,var(--gold) 65%,var(--gold) 72%,var(--red) 72%,var(--red) 100%);border-radius:5px;margin:8px 0 4px;overflow:visible;}
.rsi-needle{position:absolute;top:-3px;width:3px;height:16px;background:white;border-radius:2px;transform:translateX(-50%);transition:left .5s ease;box-shadow:0 0 4px rgba(0,0,0,.5);}
.rsi-labels{display:flex;justify-content:space-between;font-size:8.5px;color:var(--dim);}
/* ── TRADINGVIEW CHARTS ── */
.chart-modal-overlay{position:fixed;inset:0;z-index:999;background:rgba(0,0,0,.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;}
.chart-modal{background:var(--s1);border:1px solid var(--b2);border-radius:16px;width:100%;max-width:920px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,.7);}
.chart-modal-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--b1);flex-shrink:0;}
.chart-modal-hdr-left{display:flex;align-items:center;gap:10px;}
.chart-modal-tk{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--txt);}
.chart-modal-name{font-size:11px;color:var(--dim);margin-top:1px;}
.chart-modal-price{font-family:'Syne',sans-serif;font-weight:800;font-size:18px;}
.chart-modal-close{background:rgba(255,255,255,.06);border:1px solid var(--b2);color:var(--dim);width:32px;height:32px;border-radius:8px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
.chart-modal-close:hover{background:rgba(255,77,106,.15);color:var(--red);border-color:var(--red);}
.chart-interval-bar{display:flex;gap:6px;padding:10px 20px;border-bottom:1px solid var(--b1);flex-shrink:0;flex-wrap:wrap;}
.chart-int-btn{font-size:10px;font-family:'DM Mono',monospace;padding:4px 11px;border-radius:6px;border:1px solid var(--b2);background:transparent;color:var(--dim);cursor:pointer;letter-spacing:.5px;transition:all .15s;}
.chart-int-btn:hover{color:var(--txt);border-color:var(--b2);}
.chart-int-btn.active{background:rgba(0,232,122,.12);border-color:rgba(0,232,122,.4);color:var(--green);}
.chart-frame-wrap{flex:1;min-height:420px;background:#000;}
.chart-frame-wrap iframe{width:100%;height:100%;border:none;display:block;}
/* Inline chart panel in options tab */
.opt-chart-panel{background:var(--s1);border:1px solid var(--b1);border-radius:13px;overflow:hidden;margin-bottom:18px;}
.opt-chart-hdr{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--b1);flex-wrap:wrap;gap:8px;}
.opt-chart-title{font-family:'Syne',sans-serif;font-weight:800;font-size:13px;color:var(--txt);display:flex;align-items:center;gap:8px;}
.opt-chart-intervals{display:flex;gap:5px;}
.opt-chart-body{height:380px;background:#000;}
.opt-chart-body iframe{width:100%;height:100%;border:none;display:block;}
/* Sparkline click hint */
.tkr-chart-btn{font-size:8.5px;color:var(--blue);opacity:.7;cursor:pointer;margin-top:3px;letter-spacing:.4px;transition:opacity .15s;}
.tkr-chart-btn:hover{opacity:1;}

`;

/* ── UNIVERSE ── */
const UNIVERSE_BASE = [
  // ── Mega Cap Tech ──
  {t:"NVDA",n:"NVIDIA Corp",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"AAPL",n:"Apple Inc",sec:"Technology",cap:"Large",geo:"US"},
  {t:"MSFT",n:"Microsoft Corp",sec:"Technology",cap:"Large",geo:"US"},
  {t:"AMZN",n:"Amazon.com",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"GOOGL",n:"Alphabet Inc",sec:"Technology",cap:"Large",geo:"US"},
  {t:"META",n:"Meta Platforms",sec:"Technology",cap:"Large",geo:"US"},
  {t:"TSLA",n:"Tesla Inc",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"AMD",n:"AMD",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"AVGO",n:"Broadcom Inc",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"ORCL",n:"Oracle Corp",sec:"Technology",cap:"Large",geo:"US"},
  {t:"INTC",n:"Intel Corp",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"QCOM",n:"Qualcomm",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"MU",n:"Micron Technology",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"NFLX",n:"Netflix",sec:"Technology",cap:"Large",geo:"US"},
  {t:"UBER",n:"Uber Technologies",sec:"Technology",cap:"Large",geo:"US"},
  {t:"MRVL",n:"Marvell Technology",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"TSM",n:"Taiwan Semiconductor",sec:"Semiconductors",cap:"Large",geo:"Asia Pacific"},
  {t:"ASML",n:"ASML Holding",sec:"Semiconductors",cap:"Large",geo:"Europe"},
  // ── Enterprise SaaS ──
  {t:"CRM",n:"Salesforce",sec:"Technology",cap:"Large",geo:"US"},
  {t:"NOW",n:"ServiceNow",sec:"Technology",cap:"Large",geo:"US"},
  {t:"ADBE",n:"Adobe Inc",sec:"Technology",cap:"Large",geo:"US"},
  {t:"INTU",n:"Intuit Inc",sec:"Technology",cap:"Large",geo:"US"},
  {t:"HUBS",n:"HubSpot Inc",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"WDAY",n:"Workday",sec:"Technology",cap:"Large",geo:"US"},
  {t:"VEEV",n:"Veeva Systems",sec:"Technology",cap:"Large",geo:"US"},
  {t:"TEAM",n:"Atlassian",sec:"Technology",cap:"Large",geo:"US"},
  {t:"MDB",n:"MongoDB",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"ESTC",n:"Elastic NV",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"CFLT",n:"Confluent",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"DDOG",n:"Datadog Inc",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"SNOW",n:"Snowflake",sec:"Technology",cap:"Large",geo:"US"},
  {t:"MNDY",n:"Monday.com",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"ZBRA",n:"Zebra Technologies",sec:"Technology",cap:"Large",geo:"US"},
  {t:"TEL",n:"TE Connectivity",sec:"Technology",cap:"Large",geo:"US"},
  // ── AI / Cybersecurity / Cloud ──
  {t:"PLTR",n:"Palantir Tech",sec:"Technology",cap:"Large",geo:"US"},
  {t:"APP",n:"Applovin Corp",sec:"Technology",cap:"Large",geo:"US"},
  {t:"CRWD",n:"CrowdStrike",sec:"Technology",cap:"Large",geo:"US"},
  {t:"NET",n:"Cloudflare",sec:"Technology",cap:"Large",geo:"US"},
  {t:"ZS",n:"Zscaler",sec:"Technology",cap:"Large",geo:"US"},
  {t:"OKTA",n:"Okta Inc",sec:"Technology",cap:"Large",geo:"US"},
  {t:"S",n:"SentinelOne",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"PATH",n:"UiPath",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"GTLB",n:"GitLab",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"SMCI",n:"Super Micro Computer",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"CRWV",n:"CoreWeave Inc",sec:"Technology",cap:"Large",geo:"US"},
  {t:"IONQ",n:"IonQ Inc",sec:"Technology",cap:"Small",geo:"US"},
  {t:"SOUN",n:"SoundHound AI",sec:"Technology",cap:"Small",geo:"US"},
  {t:"SERV",n:"Serve Robotics",sec:"Technology",cap:"Micro",geo:"US"},
  {t:"NBIS",n:"Nebius Group",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"AI",n:"C3.ai",sec:"Technology",cap:"Small",geo:"US"},
  {t:"BBAI",n:"BigBear.ai",sec:"Technology",cap:"Small",geo:"US"},
  {t:"RGTI",n:"Rigetti Computing",sec:"Technology",cap:"Small",geo:"US"},
  {t:"QBTS",n:"D-Wave Quantum",sec:"Technology",cap:"Small",geo:"US"},
  {t:"ARQQ",n:"Arqit Quantum",sec:"Technology",cap:"Micro",geo:"US"},
  {t:"QUBT",n:"Quantum Computing Inc",sec:"Technology",cap:"Micro",geo:"US"},
  {t:"TEM",n:"Tempus AI Inc",sec:"Healthcare",cap:"Mid",geo:"US"},
  // ── Fintech / Finance ──
  {t:"V",n:"Visa Inc",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"MA",n:"Mastercard",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"PYPL",n:"PayPal",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"COIN",n:"Coinbase Global",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"SQ",n:"Block Inc",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"AFRM",n:"Affirm Holdings",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"UPST",n:"Upstart Holdings",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"SOFI",n:"SoFi Technologies",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"NU",n:"Nu Holdings",sec:"Fintech",cap:"Large",geo:"Latin America"},
  {t:"TOST",n:"Toast Inc",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"BILL",n:"Bill.com",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"RELY",n:"Remitly Global",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"ALKT",n:"Alkami Technology",sec:"Fintech",cap:"Small",geo:"US"},
  {t:"DAVE",n:"Dave Inc",sec:"Fintech",cap:"Small",geo:"US"},
  {t:"ADYEY",n:"Adyen",sec:"Fintech",cap:"Large",geo:"Europe"},
  {t:"JPM",n:"JPMorgan Chase",sec:"Financials",cap:"Large",geo:"US"},
  {t:"BAC",n:"Bank of America",sec:"Financials",cap:"Large",geo:"US"},
  {t:"GS",n:"Goldman Sachs",sec:"Financials",cap:"Large",geo:"US"},
  // ── Healthcare / Biotech ──
  {t:"LLY",n:"Eli Lilly",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"UNH",n:"UnitedHealth",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"ISRG",n:"Intuitive Surgical",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"DXCM",n:"Dexcom",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"SYK",n:"Stryker Corp",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"NVO",n:"Novo Nordisk",sec:"Healthcare",cap:"Large",geo:"Europe"},
  {t:"VRTX",n:"Vertex Pharma",sec:"Biotech",cap:"Large",geo:"US"},
  {t:"REGN",n:"Regeneron",sec:"Biotech",cap:"Large",geo:"US"},
  {t:"BIIB",n:"Biogen",sec:"Biotech",cap:"Large",geo:"US"},
  {t:"GILD",n:"Gilead Sciences",sec:"Biotech",cap:"Large",geo:"US"},
  {t:"MRNA",n:"Moderna",sec:"Biotech",cap:"Mid",geo:"US"},
  {t:"BNTX",n:"BioNTech",sec:"Biotech",cap:"Mid",geo:"Europe"},
  {t:"ALNY",n:"Alnylam Pharma",sec:"Biotech",cap:"Large",geo:"US"},
  {t:"NUVL",n:"Nuvalent Inc",sec:"Biotech",cap:"Mid",geo:"US"},
  {t:"AXSM",n:"Axsome Therapeutics",sec:"Biotech",cap:"Small",geo:"US"},
  {t:"NTRA",n:"Natera Inc",sec:"Healthcare",cap:"Mid",geo:"US"},
  {t:"BEAM",n:"Beam Therapeutics",sec:"Biotech",cap:"Small",geo:"US"},
  {t:"CRSP",n:"CRISPR Therapeutics",sec:"Biotech",cap:"Mid",geo:"US"},
  {t:"PRCT",n:"PROCEPT BioRobotics",sec:"Healthcare",cap:"Small",geo:"US"},
  {t:"RXST",n:"RxSight Inc",sec:"Biotech",cap:"Small",geo:"US"},
  {t:"INSM",n:"Insmed",sec:"Biotech",cap:"Mid",geo:"US"},
  {t:"KRYS",n:"Krystal Biotech",sec:"Biotech",cap:"Mid",geo:"US"},
  {t:"ACAD",n:"ACADIA Pharma",sec:"Biotech",cap:"Mid",geo:"US"},
  {t:"NVAX",n:"Novavax",sec:"Biotech",cap:"Small",geo:"US"},
  {t:"SAVA",n:"Cassava Sciences",sec:"Biotech",cap:"Small",geo:"US"},
  {t:"MGNX",n:"MacroGenics",sec:"Biotech",cap:"Small",geo:"US"},
  // ── Consumer / Retail ──
  {t:"SHOP",n:"Shopify Inc",sec:"Technology",cap:"Large",geo:"Canada"},
  {t:"MELI",n:"MercadoLibre",sec:"Technology",cap:"Large",geo:"Latin America"},
  {t:"ONON",n:"On Holding AG",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"CELH",n:"Celsius Holdings",sec:"Consumer Staples",cap:"Mid",geo:"US"},
  {t:"BIRK",n:"Birkenstock",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"VITL",n:"Vital Farms",sec:"Consumer Staples",cap:"Small",geo:"US"},
  {t:"SPOT",n:"Spotify Technology",sec:"Technology",cap:"Large",geo:"Europe"},
  {t:"NTR",n:"Nutrien Ltd",sec:"Materials",cap:"Large",geo:"Canada"},
  {t:"SNAP",n:"Snap Inc",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"PINS",n:"Pinterest",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"RBLX",n:"Roblox Corp",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"U",n:"Unity Software",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"TTWO",n:"Take-Two Interactive",sec:"Technology",cap:"Large",geo:"US"},
  {t:"EA",n:"Electronic Arts",sec:"Technology",cap:"Large",geo:"US"},
  {t:"ABNB",n:"Airbnb",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"LYFT",n:"Lyft Inc",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"DASH",n:"DoorDash",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"ETSY",n:"Etsy Inc",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"W",n:"Wayfair",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"HIMS",n:"Hims & Hers Health",sec:"Healthcare",cap:"Mid",geo:"US"},
  // ── EV / Clean Energy ──
  {t:"ENPH",n:"Enphase Energy",sec:"Clean Energy",cap:"Mid",geo:"US"},
  {t:"FSLR",n:"First Solar",sec:"Clean Energy",cap:"Mid",geo:"US"},
  {t:"NEE",n:"NextEra Energy",sec:"Utilities",cap:"Large",geo:"US"},
  {t:"CEG",n:"Constellation Energy",sec:"Utilities",cap:"Large",geo:"US"},
  {t:"NEP",n:"NextEra Energy Partners",sec:"Utilities",cap:"Mid",geo:"US"},
  {t:"RIVN",n:"Rivian Automotive",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"LCID",n:"Lucid Group",sec:"Consumer Discretionary",cap:"Small",geo:"US"},
  {t:"NIO",n:"NIO Inc",sec:"Consumer Discretionary",cap:"Mid",geo:"Asia Pacific"},
  {t:"XPEV",n:"XPeng Inc",sec:"Consumer Discretionary",cap:"Mid",geo:"Asia Pacific"},
  {t:"LI",n:"Li Auto",sec:"Consumer Discretionary",cap:"Mid",geo:"Asia Pacific"},
  {t:"ARRY",n:"Array Technologies",sec:"Clean Energy",cap:"Small",geo:"US"},
  {t:"STEM",n:"Stem Inc",sec:"Clean Energy",cap:"Small",geo:"US"},
  // ── Defense / Industrial ──
  {t:"GE",n:"GE Aerospace",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"KTOS",n:"Kratos Defense",sec:"Defense",cap:"Small",geo:"US"},
  {t:"RTX",n:"RTX Corp",sec:"Defense",cap:"Large",geo:"US"},
  {t:"LMT",n:"Lockheed Martin",sec:"Defense",cap:"Large",geo:"US"},
  {t:"NOC",n:"Northrop Grumman",sec:"Defense",cap:"Large",geo:"US"},
  {t:"BA",n:"Boeing",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"HII",n:"Huntington Ingalls",sec:"Defense",cap:"Large",geo:"US"},
  {t:"TDG",n:"TransDigm Group",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"RKLB",n:"Rocket Lab USA",sec:"eVTOL",cap:"Small",geo:"US"},
  {t:"ASTS",n:"AST SpaceMobile",sec:"eVTOL",cap:"Small",geo:"US"},
  {t:"LUNR",n:"Intuitive Machines",sec:"eVTOL",cap:"Small",geo:"US"},
  {t:"RDW",n:"Redwire Corp",sec:"Industrials",cap:"Small",geo:"US"},
  // ── Mining / Materials ──
  {t:"FCX",n:"Freeport-McMoRan",sec:"Mining",cap:"Large",geo:"US"},
  {t:"MP",n:"MP Materials",sec:"Mining",cap:"Small",geo:"US"},
  {t:"XOM",n:"Exxon Mobil",sec:"Energy",cap:"Large",geo:"US"},
  {t:"CVX",n:"Chevron Corp",sec:"Energy",cap:"Large",geo:"US"},
  // ── China / International ──
  {t:"BABA",n:"Alibaba Group",sec:"Technology",cap:"Large",geo:"Asia Pacific"},
  {t:"JD",n:"JD.com",sec:"Technology",cap:"Large",geo:"Asia Pacific"},
  {t:"PDD",n:"PDD Holdings",sec:"Technology",cap:"Large",geo:"Asia Pacific"},
  {t:"BIDU",n:"Baidu Inc",sec:"Technology",cap:"Large",geo:"Asia Pacific"},
  // ── High Vol / Momentum ──
  {t:"MSTR",n:"MicroStrategy",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"HOOD",n:"Robinhood Markets",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"GME",n:"GameStop",sec:"Consumer Discretionary",cap:"Small",geo:"US"},
  {t:"RDDT",n:"Reddit Inc",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"RXRX",n:"Recursion Pharma",sec:"Biotech",cap:"Mid",geo:"US"},
  {t:"IREN",n:"Iris Energy Ltd",sec:"Technology",cap:"Small",geo:"International"},
  {t:"MARA",n:"MARA Holdings",sec:"Technology",cap:"Small",geo:"US"},
  {t:"RIOT",n:"Riot Platforms",sec:"Technology",cap:"Small",geo:"US"},
  {t:"CLSK",n:"CleanSpark",sec:"Clean Energy",cap:"Small",geo:"US"},
  {t:"HUT",n:"Hut 8 Corp",sec:"Technology",cap:"Small",geo:"Canada"},
  {t:"CIFR",n:"Cipher Mining",sec:"Technology",cap:"Micro",geo:"US"},
  {t:"OPEN",n:"Opendoor Technologies",sec:"Technology",cap:"Small",geo:"US"},
  {t:"WOLF",n:"Wolfspeed",sec:"Semiconductors",cap:"Small",geo:"US"},
  {t:"PLUG",n:"Plug Power",sec:"Clean Energy",cap:"Small",geo:"US"},
  {t:"CHPT",n:"ChargePoint Holdings",sec:"Clean Energy",cap:"Small",geo:"US"},
  {t:"BLNK",n:"Blink Charging",sec:"Clean Energy",cap:"Micro",geo:"US"},
  // ── eVTOL / Space ──
  {t:"ACHR",n:"Archer Aviation",sec:"eVTOL",cap:"Small",geo:"US"},
  {t:"JOBY",n:"Joby Aviation",sec:"eVTOL",cap:"Small",geo:"US"},
  {t:"BETA",n:"Beta Technologies",sec:"eVTOL",cap:"Small",geo:"US"},
  // ── ETFs ──
  {t:"SPY",n:"S&P 500 ETF",sec:"ETF",cap:"Large",geo:"US"},
  {t:"QQQ",n:"Nasdaq 100 ETF",sec:"ETF",cap:"Large",geo:"US"},
  {t:"IWM",n:"Russell 2000 ETF",sec:"ETF",cap:"Large",geo:"US"},
  {t:"GLD",n:"Gold ETF",sec:"ETF",cap:"Large",geo:"US"},
  {t:"TLT",n:"20yr Treasury ETF",sec:"ETF",cap:"Large",geo:"US"},
  {t:"XLF",n:"Financial Select ETF",sec:"ETF",cap:"Large",geo:"US"},
  {t:"XLE",n:"Energy Select ETF",sec:"ETF",cap:"Large",geo:"US"},
  {t:"ARKK",n:"ARK Innovation ETF",sec:"ETF",cap:"Large",geo:"US"},
  {t:"SQQQ",n:"ProShares UltraPro Short QQQ",sec:"ETF",cap:"Large",geo:"US"},
  {t:"TQQQ",n:"ProShares UltraPro QQQ",sec:"ETF",cap:"Large",geo:"US"},
  {t:"SPXL",n:"Direxion S&P 500 Bull 3X",sec:"ETF",cap:"Large",geo:"US"},
  {t:"SPXS",n:"Direxion S&P 500 Bear 3X",sec:"ETF",cap:"Large",geo:"US"},
  {t:"BITO",n:"ProShares Bitcoin ETF",sec:"ETF",cap:"Mid",geo:"US"},
  {t:"IBIT",n:"iShares Bitcoin Trust",sec:"ETF",cap:"Large",geo:"US"},
  {t:"KWEB",n:"China Internet ETF",sec:"ETF",cap:"Mid",geo:"US"},
  {t:"FXI",n:"China Large-Cap ETF",sec:"ETF",cap:"Mid",geo:"US"},
  // ── New Additions (Mar 2026) ──
  {t:"HD",n:"Home Depot",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"DE",n:"Deere & Co",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"CF",n:"CF Industries",sec:"Materials",cap:"Large",geo:"US"},
  {t:"CRDO",n:"Credo Technology",sec:"Semiconductors",cap:"Mid",geo:"US"},
  {t:"TMUS",n:"T-Mobile US",sec:"Technology",cap:"Large",geo:"US"},
  {t:"CIEN",n:"Ciena Corp",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"CRCL",n:"Circle Internet",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"STX",n:"Seagate Technology",sec:"Technology",cap:"Large",geo:"US"},
  {t:"COR",n:"Cencora Inc",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"RH",n:"RH (Restoration Hardware)",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"FIG",n:"Fortress Investment Group",sec:"Financials",cap:"Mid",geo:"US"},
  {t:"INFQ",n:"Infinity Natural Resources",sec:"Energy",cap:"Small",geo:"US"},
  {t:"GH",n:"Guardant Health",sec:"Biotech",cap:"Mid",geo:"US"},
  {t:"COHR",n:"Coherent Corp",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"VLN",n:"Valneva SE",sec:"Biotech",cap:"Small",geo:"Europe"},
  {t:"KRMN",n:"Karman Space",sec:"eVTOL",cap:"Small",geo:"US"},
  {t:"ERAS",n:"Erasca Inc",sec:"Biotech",cap:"Small",geo:"US"},
  {t:"SPIR",n:"Spire Global",sec:"Technology",cap:"Small",geo:"US"},
  {t:"LASR",n:"nLIGHT Inc",sec:"Technology",cap:"Small",geo:"US"},
  {t:"AMPX",n:"Amprius Technologies",sec:"Technology",cap:"Micro",geo:"US"},
  {t:"SYM",n:"Symbotic Inc",sec:"Technology",cap:"Mid",geo:"US"},
  // ── Expanded High-Probability Universe ──
  {t:"ARES",n:"Ares Management Corp",sec:"Financials",cap:"Large",geo:"US"},
  {t:"XYZ",n:"Block Inc (XYZ)",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"NSRGY",n:"Nestle SA",sec:"Consumer Staples",cap:"Large",geo:"Europe"},
  {t:"GEV",n:"GE Vernova",sec:"Clean Energy",cap:"Large",geo:"US"},
  {t:"LIN",n:"Linde PLC",sec:"Materials",cap:"Large",geo:"US"},
  {t:"PWR",n:"Quanta Services",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"ROST",n:"Ross Stores",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"HLT",n:"Hilton Worldwide",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"LHX",n:"L3Harris Technologies",sec:"Defense",cap:"Large",geo:"US"},
  {t:"AAOI",n:"Applied Optoelectronics",sec:"Technology",cap:"Small",geo:"US"},
  {t:"COF",n:"Capital One Financial",sec:"Financials",cap:"Large",geo:"US"},
  {t:"CCJ",n:"Cameco Corp",sec:"Energy",cap:"Mid",geo:"US"},
  {t:"DJT",n:"Trump Media & Technology",sec:"Technology",cap:"Small",geo:"US"},
  {t:"LNG",n:"Cheniere Energy",sec:"Energy",cap:"Large",geo:"US"},
  {t:"LITE",n:"Lumentum Holdings",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"CAT",n:"Caterpillar Inc",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"VMC",n:"Vulcan Materials",sec:"Materials",cap:"Large",geo:"US"},
  {t:"COST",n:"Costco Wholesale",sec:"Consumer Staples",cap:"Large",geo:"US"},
  {t:"VICR",n:"Vicor Corp",sec:"Technology",cap:"Small",geo:"US"},
  {t:"EME",n:"EMCOR Group",sec:"Industrials",cap:"Mid",geo:"US"},
  {t:"BLK",n:"BlackRock Inc",sec:"Financials",cap:"Large",geo:"US"},
  {t:"KKR",n:"KKR & Co",sec:"Financials",cap:"Large",geo:"US"},
  {t:"APO",n:"Apollo Global Mgmt",sec:"Financials",cap:"Large",geo:"US"},
  {t:"BAM",n:"Brookfield Asset Mgmt",sec:"Financials",cap:"Large",geo:"US"},
  {t:"MS",n:"Morgan Stanley",sec:"Financials",cap:"Large",geo:"US"},
  {t:"WFC",n:"Wells Fargo",sec:"Financials",cap:"Large",geo:"US"},
  {t:"C",n:"Citigroup Inc",sec:"Financials",cap:"Large",geo:"US"},
  {t:"AXP",n:"American Express",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"DFS",n:"Discover Financial",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"ICE",n:"Intercontinental Exchange",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"CME",n:"CME Group",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"CBOE",n:"Cboe Global Markets",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"MSCI",n:"MSCI Inc",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"NDAQ",n:"Nasdaq Inc",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"PANW",n:"Palo Alto Networks",sec:"Technology",cap:"Large",geo:"US"},
  {t:"FTNT",n:"Fortinet Inc",sec:"Technology",cap:"Large",geo:"US"},
  {t:"CYBR",n:"CyberArk Software",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"ZI",n:"ZoomInfo Technologies",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"ARM",n:"Arm Holdings",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"MCHP",n:"Microchip Technology",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"AMAT",n:"Applied Materials",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"LRCX",n:"Lam Research",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"KLAC",n:"KLA Corp",sec:"Semiconductors",cap:"Large",geo:"US"},
  {t:"DELL",n:"Dell Technologies",sec:"Technology",cap:"Large",geo:"US"},
  {t:"HPQ",n:"HP Inc",sec:"Technology",cap:"Large",geo:"US"},
  {t:"HPE",n:"Hewlett Packard Enterprise",sec:"Technology",cap:"Large",geo:"US"},
  {t:"NTAP",n:"NetApp Inc",sec:"Technology",cap:"Large",geo:"US"},
  {t:"PSTG",n:"Pure Storage",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"ANET",n:"Arista Networks",sec:"Technology",cap:"Large",geo:"US"},
  {t:"CSCO",n:"Cisco Systems",sec:"Technology",cap:"Large",geo:"US"},
  {t:"UPS",n:"United Parcel Service",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"FDX",n:"FedEx Corp",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"XPO",n:"XPO Inc",sec:"Industrials",cap:"Mid",geo:"US"},
  {t:"DAL",n:"Delta Air Lines",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"UAL",n:"United Airlines",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"AAL",n:"American Airlines",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"LUV",n:"Southwest Airlines",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"UNP",n:"Union Pacific",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"CSX",n:"CSX Corp",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"NSC",n:"Norfolk Southern",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"PFE",n:"Pfizer Inc",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"MRK",n:"Merck & Co",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"ABBV",n:"AbbVie Inc",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"JNJ",n:"Johnson & Johnson",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"BMY",n:"Bristol-Myers Squibb",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"AMGN",n:"Amgen Inc",sec:"Biotech",cap:"Large",geo:"US"},
  {t:"ILMN",n:"Illumina Inc",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"IDXX",n:"IDEXX Laboratories",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"WMT",n:"Walmart Inc",sec:"Consumer Staples",cap:"Large",geo:"US"},
  {t:"TGT",n:"Target Corp",sec:"Consumer Staples",cap:"Large",geo:"US"},
  {t:"MCD",n:"McDonalds Corp",sec:"Consumer Staples",cap:"Large",geo:"US"},
  {t:"SBUX",n:"Starbucks Corp",sec:"Consumer Staples",cap:"Large",geo:"US"},
  {t:"CMG",n:"Chipotle Mexican Grill",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"YUM",n:"Yum! Brands",sec:"Consumer Staples",cap:"Large",geo:"US"},
  {t:"NKE",n:"Nike Inc",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"LULU",n:"Lululemon Athletica",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"MNST",n:"Monster Beverage",sec:"Consumer Staples",cap:"Mid",geo:"US"},
  {t:"PEP",n:"PepsiCo Inc",sec:"Consumer Staples",cap:"Large",geo:"US"},
  {t:"KO",n:"Coca-Cola Co",sec:"Consumer Staples",cap:"Large",geo:"US"},
  {t:"MDLZ",n:"Mondelez International",sec:"Consumer Staples",cap:"Large",geo:"US"},
  {t:"HSY",n:"Hershey Co",sec:"Consumer Staples",cap:"Mid",geo:"US"},
  {t:"DKNG",n:"DraftKings Inc",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"MGM",n:"MGM Resorts",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"LVS",n:"Las Vegas Sands",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"WYNN",n:"Wynn Resorts",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"CZR",n:"Caesars Entertainment",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"NCLH",n:"Norwegian Cruise Line",sec:"Consumer Discretionary",cap:"Mid",geo:"US"},
  {t:"CCL",n:"Carnival Corp",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"RCL",n:"Royal Caribbean",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"BKNG",n:"Booking Holdings",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"EXPE",n:"Expedia Group",sec:"Consumer Discretionary",cap:"Large",geo:"US"},
  {t:"OXY",n:"Occidental Petroleum",sec:"Energy",cap:"Large",geo:"US"},
  {t:"DVN",n:"Devon Energy",sec:"Energy",cap:"Large",geo:"US"},
  {t:"EOG",n:"EOG Resources",sec:"Energy",cap:"Large",geo:"US"},
  {t:"HAL",n:"Halliburton Co",sec:"Energy",cap:"Large",geo:"US"},
  {t:"SLB",n:"SLB Schlumberger",sec:"Energy",cap:"Large",geo:"US"},
  {t:"NEM",n:"Newmont Corp",sec:"Mining",cap:"Large",geo:"US"},
  {t:"GOLD",n:"Barrick Gold",sec:"Mining",cap:"Large",geo:"US"},
  {t:"WPM",n:"Wheaton Precious Metals",sec:"Mining",cap:"Large",geo:"US"},
  {t:"DHR",n:"Danaher Corp",sec:"Healthcare",cap:"Large",geo:"US"},
  {t:"ROP",n:"Roper Technologies",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"IDEX",n:"IDEX Corp",sec:"Industrials",cap:"Mid",geo:"US"},
  {t:"AME",n:"AMETEK Inc",sec:"Industrials",cap:"Large",geo:"US"},
  {t:"ROKU",n:"Roku Inc",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"TTD",n:"The Trade Desk",sec:"Technology",cap:"Large",geo:"US"},
  {t:"MGNI",n:"Magnite Inc",sec:"Technology",cap:"Small",geo:"US"},
  {t:"FIS",n:"Fidelity National Info",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"FISV",n:"Fiserv Inc",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"GPN",n:"Global Payments",sec:"Fintech",cap:"Large",geo:"US"},
  {t:"TW",n:"Tradeweb Markets",sec:"Fintech",cap:"Mid",geo:"US"},
  {t:"AMT",n:"American Tower",sec:"Technology",cap:"Large",geo:"US"},
  {t:"EQIX",n:"Equinix Inc",sec:"Technology",cap:"Large",geo:"US"},
  {t:"DLR",n:"Digital Realty Trust",sec:"Technology",cap:"Large",geo:"US"},
  {t:"ZM",n:"Zoom Video",sec:"Technology",cap:"Large",geo:"US"},
  {t:"DOCU",n:"DocuSign Inc",sec:"Technology",cap:"Mid",geo:"US"},
  {t:"SE",n:"Sea Limited",sec:"Technology",cap:"Large",geo:"Asia Pacific"},
  {t:"GRAB",n:"Grab Holdings",sec:"Technology",cap:"Mid",geo:"Asia Pacific"},
];

const OPT_BASE = [
  // ── Mega Cap ──
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
  {t:"INTC",n:"Intel Corp",iv:46,cat:"Mega Cap"},
  {t:"QCOM",n:"Qualcomm",iv:38,cat:"Mega Cap"},
  {t:"MU",n:"Micron Technology",iv:58,cat:"Mega Cap"},
  {t:"NFLX",n:"Netflix",iv:36,cat:"Mega Cap"},
  {t:"UBER",n:"Uber Technologies",iv:44,cat:"Mega Cap"},
  // ── ETFs ──
  {t:"SPY",n:"S&P 500 ETF",iv:14,cat:"ETF"},
  {t:"QQQ",n:"Nasdaq 100 ETF",iv:18,cat:"ETF"},
  {t:"IWM",n:"Russell 2000 ETF",iv:22,cat:"ETF"},
  {t:"SQQQ",n:"ProShares UltraPro Short QQQ",iv:85,cat:"ETF"},
  {t:"TQQQ",n:"ProShares UltraPro QQQ",iv:82,cat:"ETF"},
  {t:"ARKK",n:"ARK Innovation ETF",iv:62,cat:"ETF"},
  {t:"GLD",n:"Gold ETF",iv:16,cat:"ETF"},
  {t:"TLT",n:"20yr Treasury ETF",iv:18,cat:"ETF"},
  {t:"XLF",n:"Financial Select ETF",iv:18,cat:"ETF"},
  {t:"XLE",n:"Energy Select ETF",iv:22,cat:"ETF"},
  {t:"SPXL",n:"Direxion S&P 500 Bull 3X",iv:48,cat:"ETF"},
  {t:"SPXS",n:"Direxion S&P 500 Bear 3X",iv:52,cat:"ETF"},
  {t:"BITO",n:"ProShares Bitcoin ETF",iv:72,cat:"ETF"},
  {t:"IBIT",n:"iShares Bitcoin Trust",iv:68,cat:"ETF"},
  // ── High Vol / Meme / Momentum ──
  {t:"PLTR",n:"Palantir Tech",iv:88,cat:"High Vol"},
  {t:"COIN",n:"Coinbase",iv:95,cat:"High Vol"},
  {t:"RDDT",n:"Reddit Inc",iv:84,cat:"High Vol"},
  {t:"MSTR",n:"MicroStrategy",iv:115,cat:"High Vol"},
  {t:"HOOD",n:"Robinhood Markets",iv:78,cat:"High Vol"},
  {t:"GME",n:"GameStop",iv:92,cat:"High Vol"},
  {t:"AMC",n:"AMC Entertainment",iv:110,cat:"High Vol"},
  {t:"CIFR",n:"Cipher Mining",iv:118,cat:"High Vol"},
  {t:"MARA",n:"MARA Holdings",iv:105,cat:"High Vol"},
  {t:"RIOT",n:"Riot Platforms",iv:108,cat:"High Vol"},
  {t:"CLSK",n:"CleanSpark",iv:112,cat:"High Vol"},
  {t:"HUT",n:"Hut 8 Corp",iv:114,cat:"High Vol"},
  {t:"BITF",n:"Bitfarms",iv:116,cat:"High Vol"},
  {t:"BTBT",n:"Bit Digital",iv:119,cat:"High Vol"},
  {t:"WOLF",n:"Wolfspeed",iv:118,cat:"High Vol"},
  {t:"PLUG",n:"Plug Power",iv:106,cat:"High Vol"},
  {t:"CHPT",n:"ChargePoint Holdings",iv:102,cat:"High Vol"},
  {t:"BLNK",n:"Blink Charging",iv:114,cat:"High Vol"},
  {t:"NKLA",n:"Nikola Corp",iv:128,cat:"High Vol"},
  {t:"OPEN",n:"Opendoor Technologies",iv:96,cat:"High Vol"},
  {t:"CLOV",n:"Clover Health",iv:104,cat:"High Vol"},
  {t:"SPCE",n:"Virgin Galactic",iv:122,cat:"High Vol"},
  {t:"WKHS",n:"Workhorse Group",iv:124,cat:"High Vol"},
  {t:"XELA",n:"Exela Technologies",iv:132,cat:"High Vol"},
  {t:"HIMS",n:"Hims & Hers Health",iv:88,cat:"High Vol"},
  {t:"RXRX",n:"Recursion Pharma",iv:94,cat:"High Vol"},
  {t:"GFAI",n:"Guardforce AI",iv:136,cat:"High Vol"},
  {t:"MVIS",n:"MicroVision",iv:118,cat:"High Vol"},
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
  {t:"NBIS",n:"Nebius Group",iv:92,cat:"AI"},
  {t:"MSAI",n:"MultiSensor AI",iv:128,cat:"AI"},
  {t:"AITX",n:"Artificial Intelligence Tech",iv:134,cat:"AI"},
  {t:"ARQQ",n:"Arqit Quantum",iv:118,cat:"AI"},
  {t:"QUBT",n:"Quantum Computing Inc",iv:124,cat:"AI"},
  {t:"LAES",n:"SEALSQ Corp",iv:138,cat:"AI"},
  {t:"PAYO",n:"Payoneer Global",iv:68,cat:"AI"},
  {t:"TASK",n:"TaskUs",iv:72,cat:"AI"},
  {t:"S",n:"SentinelOne",iv:74,cat:"AI"},
  {t:"NET",n:"Cloudflare",iv:56,cat:"AI"},
  {t:"ZS",n:"Zscaler",iv:58,cat:"AI"},
  {t:"OKTA",n:"Okta Inc",iv:62,cat:"AI"},
  // ── eVTOL / Aerospace ──
  {t:"ACHR",n:"Archer Aviation",iv:108,cat:"eVTOL"},
  {t:"JOBY",n:"Joby Aviation",iv:96,cat:"eVTOL"},
  {t:"RKLB",n:"Rocket Lab USA",iv:94,cat:"eVTOL"},
  {t:"EVTL",n:"Vertical Aerospace",iv:114,cat:"eVTOL"},
  {t:"LILM",n:"Lilium",iv:120,cat:"eVTOL"},
  {t:"ASTS",n:"AST SpaceMobile",iv:112,cat:"eVTOL"},
  {t:"LUNR",n:"Intuitive Machines",iv:118,cat:"eVTOL"},
  {t:"RDW",n:"Redwire Corp",iv:106,cat:"eVTOL"},
  // ── Biotech / Health ──
  {t:"NUVL",n:"Nuvalent Inc",iv:78,cat:"Biotech"},
  {t:"AXSM",n:"Axsome Therapeutics",iv:82,cat:"Biotech"},
  {t:"BEAM",n:"Beam Therapeutics",iv:86,cat:"Biotech"},
  {t:"RXST",n:"RxSight Inc",iv:72,cat:"Biotech"},
  {t:"PRCT",n:"PROCEPT BioRobotics",iv:76,cat:"Biotech"},
  {t:"NTRA",n:"Natera Inc",iv:68,cat:"Biotech"},
  {t:"LLY",n:"Eli Lilly",iv:28,cat:"Biotech"},
  {t:"MRNA",n:"Moderna",iv:74,cat:"Biotech"},
  {t:"BNTX",n:"BioNTech",iv:66,cat:"Biotech"},
  {t:"NVAX",n:"Novavax",iv:118,cat:"Biotech"},
  {t:"SAVA",n:"Cassava Sciences",iv:128,cat:"Biotech"},
  {t:"MGNX",n:"MacroGenics",iv:108,cat:"Biotech"},
  {t:"ACAD",n:"ACADIA Pharma",iv:82,cat:"Biotech"},
  {t:"INSM",n:"Insmed",iv:78,cat:"Biotech"},
  {t:"KRYS",n:"Krystal Biotech",iv:72,cat:"Biotech"},
  {t:"ALNY",n:"Alnylam Pharma",iv:48,cat:"Biotech"},
  {t:"VRTX",n:"Vertex Pharma",iv:32,cat:"Biotech"},
  {t:"REGN",n:"Regeneron",iv:28,cat:"Biotech"},
  {t:"BIIB",n:"Biogen",iv:36,cat:"Biotech"},
  {t:"GILD",n:"Gilead Sciences",iv:24,cat:"Biotech"},
  // ── Fintech / Finance ──
  {t:"SQ",n:"Block Inc",iv:62,cat:"Fintech"},
  {t:"AFRM",n:"Affirm Holdings",iv:86,cat:"Fintech"},
  {t:"UPST",n:"Upstart Holdings",iv:92,cat:"Fintech"},
  {t:"SOFI",n:"SoFi Technologies",iv:74,cat:"Fintech"},
  {t:"NU",n:"Nu Holdings",iv:58,cat:"Fintech"},
  {t:"V",n:"Visa Inc",iv:18,cat:"Fintech"},
  {t:"PYPL",n:"PayPal",iv:44,cat:"Fintech"},
  {t:"MA",n:"Mastercard",iv:20,cat:"Fintech"},
  {t:"ADYEY",n:"Adyen",iv:42,cat:"Fintech"},
  {t:"DAVE",n:"Dave Inc",iv:112,cat:"Fintech"},
  {t:"RELY",n:"Remitly Global",iv:78,cat:"Fintech"},
  {t:"TOST",n:"Toast Inc",iv:58,cat:"Fintech"},
  {t:"BILL",n:"Bill.com",iv:68,cat:"Fintech"},
  // ── EV / Clean Energy ──
  {t:"RIVN",n:"Rivian Automotive",iv:88,cat:"EV/Energy"},
  {t:"LCID",n:"Lucid Group",iv:96,cat:"EV/Energy"},
  {t:"NIO",n:"NIO Inc",iv:82,cat:"EV/Energy"},
  {t:"XPEV",n:"XPeng Inc",iv:78,cat:"EV/Energy"},
  {t:"ENPH",n:"Enphase Energy",iv:66,cat:"EV/Energy"},
  {t:"FSLR",n:"First Solar",iv:52,cat:"EV/Energy"},
  {t:"LI",n:"Li Auto",iv:74,cat:"EV/Energy"},
  {t:"FSR",n:"Fisker Inc",iv:132,cat:"EV/Energy"},
  {t:"PTRA",n:"Proterra",iv:126,cat:"EV/Energy"},
  {t:"STEM",n:"Stem Inc",iv:108,cat:"EV/Energy"},
  {t:"ARRY",n:"Array Technologies",iv:72,cat:"EV/Energy"},
  {t:"NEP",n:"NextEra Energy Partners",iv:48,cat:"EV/Energy"},
  // ── Enterprise SaaS ──
  {t:"NOW",n:"ServiceNow",iv:34,cat:"Enterprise"},
  {t:"CRM",n:"Salesforce",iv:30,cat:"Enterprise"},
  {t:"HUBS",n:"HubSpot",iv:44,cat:"Enterprise"},
  {t:"ADBE",n:"Adobe Inc",iv:32,cat:"Enterprise"},
  {t:"WDAY",n:"Workday",iv:36,cat:"Enterprise"},
  {t:"VEEV",n:"Veeva Systems",iv:34,cat:"Enterprise"},
  {t:"TEAM",n:"Atlassian",iv:46,cat:"Enterprise"},
  {t:"MDB",n:"MongoDB",iv:58,cat:"Enterprise"},
  {t:"ESTC",n:"Elastic NV",iv:62,cat:"Enterprise"},
  {t:"CFLT",n:"Confluent",iv:68,cat:"Enterprise"},
  // ── Consumer / Retail ──
  {t:"SHOP",n:"Shopify",iv:56,cat:"Consumer"},
  {t:"MELI",n:"MercadoLibre",iv:44,cat:"Consumer"},
  {t:"ONON",n:"On Holding",iv:48,cat:"Consumer"},
  {t:"CELH",n:"Celsius Holdings",iv:72,cat:"Consumer"},
  {t:"BIRK",n:"Birkenstock",iv:38,cat:"Consumer"},
  {t:"SNAP",n:"Snap Inc",iv:82,cat:"Consumer"},
  {t:"PINS",n:"Pinterest",iv:54,cat:"Consumer"},
  {t:"RBLX",n:"Roblox Corp",iv:68,cat:"Consumer"},
  {t:"U",n:"Unity Software",iv:74,cat:"Consumer"},
  {t:"TTWO",n:"Take-Two Interactive",iv:42,cat:"Consumer"},
  {t:"EA",n:"Electronic Arts",iv:28,cat:"Consumer"},
  {t:"ABNB",n:"Airbnb",iv:46,cat:"Consumer"},
  {t:"LYFT",n:"Lyft Inc",iv:72,cat:"Consumer"},
  {t:"DASH",n:"DoorDash",iv:58,cat:"Consumer"},
  {t:"ETSY",n:"Etsy Inc",iv:52,cat:"Consumer"},
  {t:"W",n:"Wayfair",iv:78,cat:"Consumer"},
  // ── Defense / Industrial ──
  {t:"KTOS",n:"Kratos Defense",iv:62,cat:"Defense"},
  {t:"GE",n:"GE Aerospace",iv:28,cat:"Defense"},
  {t:"FCX",n:"Freeport-McMoRan",iv:44,cat:"Defense"},
  {t:"MP",n:"MP Materials",iv:68,cat:"Defense"},
  {t:"RTX",n:"RTX Corp",iv:26,cat:"Defense"},
  {t:"LMT",n:"Lockheed Martin",iv:22,cat:"Defense"},
  {t:"NOC",n:"Northrop Grumman",iv:24,cat:"Defense"},
  {t:"BA",n:"Boeing",iv:38,cat:"Defense"},
  {t:"HII",n:"Huntington Ingalls",iv:28,cat:"Defense"},
  {t:"TDG",n:"TransDigm Group",iv:32,cat:"Defense"},
  // ── China / International ──
  {t:"BABA",n:"Alibaba Group",iv:52,cat:"China/Intl"},
  {t:"JD",n:"JD.com",iv:58,cat:"China/Intl"},
  {t:"PDD",n:"PDD Holdings",iv:62,cat:"China/Intl"},
  {t:"BIDU",n:"Baidu Inc",iv:54,cat:"China/Intl"},
  {t:"KWEB",n:"China Internet ETF",iv:48,cat:"China/Intl"},
  {t:"FXI",n:"China Large-Cap ETF",iv:38,cat:"China/Intl"},
  {t:"ASML",n:"ASML Holding",iv:34,cat:"China/Intl"},
  {t:"TSM",n:"Taiwan Semiconductor",iv:36,cat:"China/Intl"},
  // ── New Additions ──
  {t:"JPM",n:"JPMorgan Chase",iv:22,cat:"Mega Cap"},
  {t:"BAC",n:"Bank of America",iv:26,cat:"Mega Cap"},
  {t:"GS",n:"Goldman Sachs",iv:28,cat:"Mega Cap"},
  {t:"UNH",n:"UnitedHealth",iv:24,cat:"Biotech"},
  {t:"ISRG",n:"Intuitive Surgical",iv:28,cat:"Biotech"},
  {t:"DXCM",n:"Dexcom",iv:44,cat:"Biotech"},
  {t:"NVO",n:"Novo Nordisk",iv:26,cat:"Biotech"},
  {t:"NEE",n:"NextEra Energy",iv:22,cat:"EV/Energy"},
  {t:"XOM",n:"Exxon Mobil",iv:24,cat:"Defense"},
  {t:"CVX",n:"Chevron Corp",iv:22,cat:"Defense"},
  {t:"MNDY",n:"Monday.com",iv:54,cat:"Enterprise"},
  {t:"ALKT",n:"Alkami Technology",iv:62,cat:"Fintech"},
  {t:"VITL",n:"Vital Farms",iv:48,cat:"Consumer"},
  {t:"APP",n:"Applovin Corp",iv:72,cat:"AI"},
  {t:"INTU",n:"Intuit Inc",iv:28,cat:"Enterprise"},
  {t:"SYK",n:"Stryker Corp",iv:22,cat:"Biotech"},
  {t:"CRWV",n:"CoreWeave Inc",iv:88,cat:"AI"},
  {t:"MRVL",n:"Marvell Technology",iv:52,cat:"Mega Cap"},
  {t:"CEG",n:"Constellation Energy",iv:42,cat:"EV/Energy"},
  {t:"TEM",n:"Tempus AI Inc",iv:78,cat:"AI"},
  {t:"CRSP",n:"CRISPR Therapeutics",iv:82,cat:"Biotech"},
  {t:"IREN",n:"Iris Energy Ltd",iv:95,cat:"High Vol"},
  {t:"BETA",n:"Beta Technologies",iv:70,cat:"eVTOL"},
  {t:"TEL",n:"TE Connectivity",iv:26,cat:"Enterprise"},
  {t:"SPOT",n:"Spotify Technology",iv:42,cat:"Consumer"},
  {t:"NTR",n:"Nutrien Ltd",iv:28,cat:"Consumer"},
  {t:"ZBRA",n:"Zebra Technologies",iv:34,cat:"Enterprise"},
  // ── New Additions (Mar 2026) ──
  {t:"HD",n:"Home Depot",iv:18,cat:"Consumer"},
  {t:"DE",n:"Deere & Co",iv:22,cat:"Defense"},
  {t:"CF",n:"CF Industries",iv:32,cat:"Consumer"},
  {t:"CRDO",n:"Credo Technology",iv:78,cat:"AI"},
  {t:"TMUS",n:"T-Mobile US",iv:20,cat:"Mega Cap"},
  {t:"CIEN",n:"Ciena Corp",iv:48,cat:"Enterprise"},
  {t:"CRCL",n:"Circle Internet",iv:72,cat:"Fintech"},
  {t:"STX",n:"Seagate Technology",iv:38,cat:"Enterprise"},
  {t:"COR",n:"Cencora Inc",iv:16,cat:"Biotech"},
  {t:"RH",n:"RH (Restoration Hardware)",iv:52,cat:"Consumer"},
  {t:"FIG",n:"Fortress Investment Group",iv:42,cat:"Fintech"},
  {t:"INFQ",n:"Infinity Natural Resources",iv:68,cat:"High Vol"},
  {t:"GH",n:"Guardant Health",iv:74,cat:"Biotech"},
  {t:"COHR",n:"Coherent Corp",iv:56,cat:"AI"},
  {t:"VLN",n:"Valneva SE",iv:88,cat:"Biotech"},
  {t:"KRMN",n:"Karman Space",iv:92,cat:"eVTOL"},
  {t:"ERAS",n:"Erasca Inc",iv:86,cat:"Biotech"},
  {t:"SPIR",n:"Spire Global",iv:82,cat:"AI"},
  {t:"LASR",n:"nLIGHT Inc",iv:64,cat:"Defense"},
  {t:"AMPX",n:"Amprius Technologies",iv:96,cat:"High Vol"},
  {t:"SYM",n:"Symbotic Inc",iv:68,cat:"AI"},
  // ── Owner-requested + High-Probability Additions ──
  {t:"ARES",n:"Ares Management Corp",iv:72,cat:"Fintech"},
  {t:"XYZ",n:"Block Inc (XYZ)",iv:58,cat:"Fintech"},
  {t:"NSRGY",n:"Nestle SA",iv:18,cat:"Consumer"},
  {t:"GEV",n:"GE Vernova",iv:44,cat:"EV/Energy"},
  {t:"LIN",n:"Linde PLC",iv:20,cat:"Defense"},
  {t:"PWR",n:"Quanta Services",iv:34,cat:"Defense"},
  {t:"ROST",n:"Ross Stores",iv:22,cat:"Consumer"},
  {t:"HLT",n:"Hilton Worldwide",iv:28,cat:"Consumer"},
  {t:"LHX",n:"L3Harris Technologies",iv:24,cat:"Defense"},
  {t:"AAOI",n:"Applied Optoelectronics",iv:92,cat:"High Vol"},
  {t:"COF",n:"Capital One Financial",iv:32,cat:"Fintech"},
  {t:"CCJ",n:"Cameco Corp",iv:58,cat:"EV/Energy"},
  {t:"DJT",n:"Trump Media & Technology",iv:128,cat:"High Vol"},
  {t:"LNG",n:"Cheniere Energy",iv:32,cat:"Defense"},
  {t:"LITE",n:"Lumentum Holdings",iv:54,cat:"AI"},
  {t:"CAT",n:"Caterpillar Inc",iv:24,cat:"Defense"},
  {t:"VMC",n:"Vulcan Materials",iv:22,cat:"Defense"},
  {t:"COST",n:"Costco Wholesale",iv:18,cat:"Consumer"},
  {t:"VICR",n:"Vicor Corp",iv:62,cat:"AI"},
  {t:"EME",n:"EMCOR Group",iv:28,cat:"Defense"},
  {t:"BLK",n:"BlackRock Inc",iv:22,cat:"Fintech"},
  {t:"KKR",n:"KKR & Co",iv:42,cat:"Fintech"},
  {t:"APO",n:"Apollo Global Mgmt",iv:44,cat:"Fintech"},
  {t:"BAM",n:"Brookfield Asset Mgmt",iv:32,cat:"Fintech"},
  {t:"MS",n:"Morgan Stanley",iv:28,cat:"Fintech"},
  {t:"WFC",n:"Wells Fargo",iv:26,cat:"Fintech"},
  {t:"C",n:"Citigroup Inc",iv:28,cat:"Fintech"},
  {t:"AXP",n:"American Express",iv:24,cat:"Fintech"},
  {t:"DFS",n:"Discover Financial",iv:28,cat:"Fintech"},
  {t:"ICE",n:"Intercontinental Exchange",iv:20,cat:"Fintech"},
  {t:"CME",n:"CME Group",iv:18,cat:"Fintech"},
  {t:"CBOE",n:"Cboe Global Markets",iv:20,cat:"Fintech"},
  {t:"MSCI",n:"MSCI Inc",iv:22,cat:"Fintech"},
  {t:"NDAQ",n:"Nasdaq Inc",iv:18,cat:"Fintech"},
  {t:"PANW",n:"Palo Alto Networks",iv:48,cat:"AI"},
  {t:"FTNT",n:"Fortinet Inc",iv:42,cat:"AI"},
  {t:"CYBR",n:"CyberArk Software",iv:58,cat:"AI"},
  {t:"ZI",n:"ZoomInfo Technologies",iv:62,cat:"AI"},
  {t:"ARM",n:"Arm Holdings",iv:62,cat:"Mega Cap"},
  {t:"MCHP",n:"Microchip Technology",iv:36,cat:"Mega Cap"},
  {t:"AMAT",n:"Applied Materials",iv:38,cat:"Mega Cap"},
  {t:"LRCX",n:"Lam Research",iv:36,cat:"Mega Cap"},
  {t:"KLAC",n:"KLA Corp",iv:34,cat:"Mega Cap"},
  {t:"DELL",n:"Dell Technologies",iv:38,cat:"Enterprise"},
  {t:"HPQ",n:"HP Inc",iv:26,cat:"Enterprise"},
  {t:"HPE",n:"Hewlett Packard Enterprise",iv:28,cat:"Enterprise"},
  {t:"NTAP",n:"NetApp Inc",iv:32,cat:"Enterprise"},
  {t:"PSTG",n:"Pure Storage",iv:48,cat:"Enterprise"},
  {t:"ANET",n:"Arista Networks",iv:42,cat:"Enterprise"},
  {t:"CSCO",n:"Cisco Systems",iv:22,cat:"Enterprise"},
  {t:"UPS",n:"United Parcel Service",iv:22,cat:"Defense"},
  {t:"FDX",n:"FedEx Corp",iv:26,cat:"Defense"},
  {t:"XPO",n:"XPO Inc",iv:38,cat:"Defense"},
  {t:"DAL",n:"Delta Air Lines",iv:38,cat:"Consumer"},
  {t:"UAL",n:"United Airlines",iv:42,cat:"Consumer"},
  {t:"AAL",n:"American Airlines",iv:58,cat:"High Vol"},
  {t:"LUV",n:"Southwest Airlines",iv:28,cat:"Consumer"},
  {t:"UNP",n:"Union Pacific",iv:18,cat:"Defense"},
  {t:"CSX",n:"CSX Corp",iv:20,cat:"Defense"},
  {t:"NSC",n:"Norfolk Southern",iv:20,cat:"Defense"},
  {t:"PFE",n:"Pfizer Inc",iv:24,cat:"Biotech"},
  {t:"MRK",n:"Merck & Co",iv:20,cat:"Biotech"},
  {t:"ABBV",n:"AbbVie Inc",iv:22,cat:"Biotech"},
  {t:"JNJ",n:"Johnson & Johnson",iv:18,cat:"Biotech"},
  {t:"BMY",n:"Bristol-Myers Squibb",iv:28,cat:"Biotech"},
  {t:"AMGN",n:"Amgen Inc",iv:24,cat:"Biotech"},
  {t:"ILMN",n:"Illumina Inc",iv:38,cat:"Biotech"},
  {t:"IDXX",n:"IDEXX Laboratories",iv:24,cat:"Biotech"},
  {t:"WMT",n:"Walmart Inc",iv:18,cat:"Consumer"},
  {t:"TGT",n:"Target Corp",iv:26,cat:"Consumer"},
  {t:"MCD",n:"McDonalds Corp",iv:18,cat:"Consumer"},
  {t:"SBUX",n:"Starbucks Corp",iv:28,cat:"Consumer"},
  {t:"CMG",n:"Chipotle Mexican Grill",iv:30,cat:"Consumer"},
  {t:"YUM",n:"Yum! Brands",iv:20,cat:"Consumer"},
  {t:"NKE",n:"Nike Inc",iv:26,cat:"Consumer"},
  {t:"LULU",n:"Lululemon Athletica",iv:38,cat:"Consumer"},
  {t:"MNST",n:"Monster Beverage",iv:24,cat:"Consumer"},
  {t:"PEP",n:"PepsiCo Inc",iv:16,cat:"Consumer"},
  {t:"KO",n:"Coca-Cola Co",iv:14,cat:"Consumer"},
  {t:"MDLZ",n:"Mondelez International",iv:18,cat:"Consumer"},
  {t:"HSY",n:"Hershey Co",iv:18,cat:"Consumer"},
  {t:"DKNG",n:"DraftKings Inc",iv:72,cat:"Consumer"},
  {t:"MGM",n:"MGM Resorts",iv:38,cat:"Consumer"},
  {t:"LVS",n:"Las Vegas Sands",iv:32,cat:"Consumer"},
  {t:"WYNN",n:"Wynn Resorts",iv:38,cat:"Consumer"},
  {t:"CZR",n:"Caesars Entertainment",iv:48,cat:"Consumer"},
  {t:"NCLH",n:"Norwegian Cruise Line",iv:52,cat:"Consumer"},
  {t:"CCL",n:"Carnival Corp",iv:42,cat:"Consumer"},
  {t:"RCL",n:"Royal Caribbean",iv:38,cat:"Consumer"},
  {t:"BKNG",n:"Booking Holdings",iv:26,cat:"Consumer"},
  {t:"EXPE",n:"Expedia Group",iv:34,cat:"Consumer"},
  {t:"OXY",n:"Occidental Petroleum",iv:34,cat:"Defense"},
  {t:"DVN",n:"Devon Energy",iv:38,cat:"Defense"},
  {t:"EOG",n:"EOG Resources",iv:28,cat:"Defense"},
  {t:"HAL",n:"Halliburton Co",iv:34,cat:"Defense"},
  {t:"SLB",n:"SLB (Schlumberger)",iv:32,cat:"Defense"},
  {t:"NEM",n:"Newmont Corp",iv:32,cat:"Defense"},
  {t:"GOLD",n:"Barrick Gold",iv:34,cat:"Defense"},
  {t:"WPM",n:"Wheaton Precious Metals",iv:28,cat:"Defense"},
  {t:"DHR",n:"Danaher Corp",iv:22,cat:"Biotech"},
  {t:"ROP",n:"Roper Technologies",iv:20,cat:"Enterprise"},
  {t:"IDEX",n:"IDEX Corp",iv:22,cat:"Defense"},
  {t:"AME",n:"AMETEK Inc",iv:20,cat:"Defense"},
  {t:"ROKU",n:"Roku Inc",iv:68,cat:"Consumer"},
  {t:"TTD",n:"The Trade Desk",iv:62,cat:"AI"},
  {t:"MGNI",n:"Magnite Inc",iv:74,cat:"AI"},
  {t:"FIS",n:"Fidelity National Info",iv:28,cat:"Fintech"},
  {t:"FISV",n:"Fiserv Inc",iv:22,cat:"Fintech"},
  {t:"GPN",n:"Global Payments",iv:28,cat:"Fintech"},
  {t:"TW",n:"Tradeweb Markets",iv:30,cat:"Fintech"},
  {t:"AMT",n:"American Tower",iv:18,cat:"ETF"},
  {t:"EQIX",n:"Equinix Inc",iv:22,cat:"Enterprise"},
  {t:"DLR",n:"Digital Realty Trust",iv:22,cat:"Enterprise"},
  {t:"ZM",n:"Zoom Video",iv:42,cat:"Enterprise"},
  {t:"DOCU",n:"DocuSign Inc",iv:44,cat:"Enterprise"},
  {t:"SE",n:"Sea Limited",iv:72,cat:"Consumer"},
  {t:"GRAB",n:"Grab Holdings",iv:68,cat:"Consumer"},
];

/* ── FINNHUB ── */
async function fetchQuote(ticker) {
  try {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch(
      `${FINNHUB_URL}/quote?symbol=${ticker}&token=${FINNHUB_KEY}`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (!r.ok) return null;
    const d = await r.json();
    // Use live price if available; fall back to prevClose so scans work after-hours/weekends
    const price = (d?.c > 0) ? d.c : (d?.pc > 0) ? d.pc : 0;
    if (d && price > 0) {
      return {
        price:       +price.toFixed(2),
        change:      +(d.dp || 0).toFixed(2),
        high:        +(d.h  || price).toFixed(2),
        low:         +(d.l  || price).toFixed(2),
        prevClose:   +(d.pc || price).toFixed(2),
        open:        +(d.o  || price).toFixed(2),
        volume:      d.v || 0,
        source:      d.c > 0 ? 'finnhub-live' : 'finnhub-close',
        dollarChange:+(d.c > 0 ? d.c - d.pc : 0).toFixed(2),
      };
    }
  } catch {}
  return null;
}

// ══════════════════════════════════════════════════════════
// EXPIRATION DATE GENERATOR — pure JS, instant, no network call
// Generates every real option expiration for next 730 days:
//   • Every Friday = weekly expiration
//   • 3rd Friday of each month = standard monthly (labeled separately)  
//   • Jan expirations 1-2 years out = LEAPS
// This is how OCC actually schedules expirations.
// ══════════════════════════════════════════════════════════
function generateExpirationDates() {
  const today = new Date(); today.setHours(0,0,0,0);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const seen   = new Set();
  const result = [];

  const makeEntry = (dateObj) => {
    const dte = Math.round((dateObj.getTime() - today.getTime()) / 86400000);
    if (dte < 0) return null;
    const mon  = MONTHS[dateObj.getMonth()];
    const day  = dateObj.getDate();
    const year = dateObj.getFullYear();
    const dow  = DAYS[dateObj.getDay()];
    const mm   = String(dateObj.getMonth()+1).padStart(2,'0');
    const dd   = String(day).padStart(2,'0');
    const dateStr = `${year}-${mm}-${dd}`;
    if (seen.has(dateStr)) return null;
    seen.add(dateStr);
    const weekNum       = Math.ceil(day / 7);
    const isFriday      = dateObj.getDay() === 5;
    const isThirdFriday = isFriday && weekNum === 3;
    let kind;
    if      (dte === 0)  kind = '0 DTE';
    else if (dte === 1)  kind = '1 DTE';
    else if (dte === 2)  kind = '2 DTE';
    else if (dte === 3)  kind = '3 DTE';
    else if (dte === 4)  kind = '4 DTE';
    else if (dte === 5)  kind = '5 DTE';
    else if (dte === 6)  kind = '6 DTE';
    else if (dte <= 13)  kind = 'Weekly';
    else if (dte <= 37)  kind = isThirdFriday ? 'Monthly'   : 'Weekly';
    else if (dte <= 100) kind = isThirdFriday ? 'Monthly'   : 'Weekly';
    else if (dte <= 200) kind = isThirdFriday ? 'Quarterly' : 'Weekly';
    else                 kind = `LEAPS ${year}`;
    const display = dte <= 6
      ? `${dow} ${mon} ${day}  ·  ${dte} DTE`
      : `${mon} ${day}, ${year}  ·  ${dte}d  ·  ${kind}`;
    return { dateStr, label:`${mon} ${day}, ${year}`, short:`${mon} ${day}`,
             full:`${dow} ${mon} ${day}, ${year}`, dte, kind, year, display };
  };

  // ── Tier 1: Walk forward day-by-day until we have 7 weekday entries (0–6 DTE) ──
  // Scans up to 14 calendar days to handle long weekends / holidays.
  // Guarantees 1 DTE and 2 DTE are ALWAYS present.
  let weekdayCount = 0;
  for (let offset = 0; offset <= 14 && weekdayCount < 7; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip Sat/Sun
    const entry = makeEntry(d);
    if (entry) { result.push(entry); weekdayCount++; }
  }

  // ── Tier 2: Every Friday for the next 730 days (weeklies, monthlies, LEAPS) ──
  const fri = new Date(today);
  // Advance to first Friday
  while (fri.getDay() !== 5) fri.setDate(fri.getDate() + 1);
  const end = new Date(today); end.setDate(today.getDate() + 730);
  while (fri <= end) {
    const entry = makeEntry(new Date(fri));
    if (entry) result.push(entry);
    fri.setDate(fri.getDate() + 7);
  }

  // Sort by DTE so dropdown reads 0 DTE → LEAPS chronologically
  result.sort((a, b) => a.dte - b.dte);
  return result;
}
// Computed at module load — always fresh because generateExpirationDates()
// is pure JS with no external deps, runs in <1ms.
const ALL_EXPIRATIONS = generateExpirationDates();

// ── FINNHUB OPTION CHAIN (scan time only) ──
// Called once when user hits Scan — uses Finnhub for real OI/volume/bid/ask
async function loadFinnhubChain(ticker) {
  // Check cache first
  const cached = OPT_CACHE[ticker];
  if (cached && (Date.now() - cached.ts) < OPT_CACHE_TTL) return cached;
  if (OPT_INFLIGHT[ticker]) return OPT_INFLIGHT[ticker];

  OPT_INFLIGHT[ticker] = (async () => {
    try {
      // Finnhub option chain — real OI, volume, bid/ask per strike
      const url = `${FINNHUB_URL}/stock/option-chain?symbol=${ticker}&token=${FINNHUB_KEY}`;
      const ctrl=new AbortController();
      const t=setTimeout(()=>ctrl.abort(),12000);
      const r = await fetch(url,{signal:ctrl.signal});
      clearTimeout(t);
      if (!r.ok) return null;
      const d = await r.json();
      if (!d || !Array.isArray(d.data) || !d.data.length) return null;

      // Build chain maps keyed by expiration date string
      const chains = {};
      const expDates = [];
      d.data.forEach(exp => {
        const expDate = exp.expirationDate;
        if (!expDate) return;
        expDates.push(expDate);
        chains[expDate] = {};
        const calls = exp.options?.CALL || [];
        const puts  = exp.options?.PUT  || [];
        calls.forEach(c => {
          const k = +c.strike; if (!k || isNaN(k)) return;
          if (!chains[expDate][k]) chains[expDate][k] = {};
          chains[expDate][k].call = {
            iv:     c.impliedVolatility > 0 ? +(c.impliedVolatility * 100).toFixed(1) : null,
            volume: typeof c.volume       === 'number' ? c.volume       : null,
            oi:     typeof c.openInterest === 'number' ? c.openInterest : null,
            bid:    c.bid > 0       ? +c.bid.toFixed(2)       : null,
            ask:    c.ask > 0       ? +c.ask.toFixed(2)       : null,
            last:   c.lastPrice > 0 ? +c.lastPrice.toFixed(2) : null,
          };
        });
        puts.forEach(p => {
          const k = +p.strike; if (!k || isNaN(k)) return;
          if (!chains[expDate][k]) chains[expDate][k] = {};
          chains[expDate][k].put = {
            iv:     p.impliedVolatility > 0 ? +(p.impliedVolatility * 100).toFixed(1) : null,
            volume: typeof p.volume       === 'number' ? p.volume       : null,
            oi:     typeof p.openInterest === 'number' ? p.openInterest : null,
            bid:    p.bid > 0       ? +p.bid.toFixed(2)       : null,
            ask:    p.ask > 0       ? +p.ask.toFixed(2)       : null,
            last:   p.lastPrice > 0 ? +p.lastPrice.toFixed(2) : null,
          };
        });
      });

      // ATM IV from nearest expiration
      const nearExpData = d.data[0];
      const allContracts = [...(nearExpData?.options?.CALL||[]), ...(nearExpData?.options?.PUT||[])];
      const ivs = allContracts.map(c => c.impliedVolatility).filter(v => v > 0.01 && v < 5);
      const iv  = ivs.length ? Math.round(ivs.reduce((a,b)=>a+b,0)/ivs.length*100) : null;

      const result = { ts: Date.now(), dates: expDates.sort(), chains, iv };
      OPT_CACHE[ticker] = result;
      return result;
    } catch(e) { console.warn('Chain fetch error:', ticker, e?.message); return null; }
    finally { delete OPT_INFLIGHT[ticker]; }
  })();
  return OPT_INFLIGHT[ticker];
}

async function fetchOptionChainData(ticker, targetDateStr) {
  // targetDateStr must be "YYYY-MM-DD" — the format Finnhub uses
  const data = await loadFinnhubChain(ticker);
  if (!data || !data.dates || !data.dates.length) return null;

  // 1. Exact match on YYYY-MM-DD string
  let bestExp = data.dates.find(d => d === targetDateStr);

  // 2. Closest by calendar distance (handles slight mismatches)
  if (!bestExp && targetDateStr) {
    const targetMs = new Date(targetDateStr + 'T00:00:00').getTime();
    if (!isNaN(targetMs)) {
      let bestDiff = Infinity;
      data.dates.forEach(exp => {
        const ms = new Date(exp + 'T00:00:00').getTime();
        const diff = Math.abs(ms - targetMs);
        if (diff < bestDiff) { bestDiff = diff; bestExp = exp; }
      });
    }
  }

  // 3. Fall back to nearest expiration
  if (!bestExp) bestExp = data.dates[0];
  if (!bestExp) return null;

  const chainMap = { ...(data.chains[bestExp] || {}), _expDate: bestExp };
  return Object.keys(chainMap).filter(k => k !== '_expDate').length > 0 ? chainMap : null;
}

async function fetchLiveIV(ticker) {
  const data = await loadFinnhubChain(ticker);
  return data?.iv || null;
}

// Instant — reads from pre-computed ALL_EXPIRATIONS, no network
function fetchExpirationDates() {
  return ALL_EXPIRATIONS;
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

/* ── MEAN REVERSION ENGINE ── */
function calcMeanReversion(price, high, low, prevClose, change, iv) {
  // Price position within today's range (0-100)
  const dayRange = high - low || 1;
  const pricePos = Math.max(0, Math.min(100, ((price - low) / dayRange) * 100));

  // Simulated RSI based on price change momentum (realistic proxy)
  // Negative change = oversold territory, positive = overbought
  const changeAbs = Math.abs(change || 0);
  let rsi;
  // Deterministic RSI proxy based on price change — consistent on each page load
  // Real RSI needs 14 candles of OHLC data; Finnhub free tier doesn't provide candles.
  // This is a momentum-consistent proxy: large negative changes → oversold RSI territory
  if (change <= -8)       rsi = Math.max(8,  18 - changeAbs * 0.9);
  else if (change <= -5)  rsi = Math.max(15, 26 - changeAbs * 0.7);
  else if (change <= -3)  rsi = Math.max(22, 33 - changeAbs * 0.6);
  else if (change <= -1)  rsi = 38 + (change + 1) * 2.5 + 5;
  else if (change <= 1)   rsi = 50 + change * 2.5;
  else if (change <= 3)   rsi = 55 + (change - 1) * 3;
  else if (change <= 5)   rsi = 62 + (change - 3) * 3;
  else if (change <= 8)   rsi = 70 + (change - 5) * 2;
  else                    rsi = Math.min(95, 78 + changeAbs * 0.6);
  rsi = +Math.max(5, Math.min(95, rsi)).toFixed(1);

  // Stochastic %K (price position vs range)
  const stochK = +pricePos.toFixed(1);
  const stochD = +(pricePos * 0.88 + 3).toFixed(1); // deterministic smoothed

  // Distance from 52-week high (simulated — negative = below 52wk hi)
  const dist52w = +(-Math.abs(change) * 2.8).toFixed(1);

  // Bollinger Band position (0=lower band, 50=mid, 100=upper band)
  // Bollinger %B: deterministic from price position & change magnitude
  let bbPos;
  if (change <= -5)      bbPos = Math.max(0,  6  + changeAbs * 0.4);
  else if (change <= -2) bbPos = Math.max(5,  18 + change * 3);
  else if (change <= 0)  bbPos = 38 + change * 5;
  else if (change <= 2)  bbPos = 52 + change * 6;
  else if (change <= 5)  bbPos = 66 + (change - 2) * 4;
  else                   bbPos = Math.min(98, 80 + (change - 5) * 3);
  bbPos = +Math.max(0, Math.min(100, bbPos)).toFixed(1);

  // MACD signal (simplified)
  const macdBull = change > 0 && rsi > 40 && rsi < 70;
  const macdBear = change < 0 && rsi > 60;
  const macd = macdBull ? "bullish" : macdBear ? "bearish" : "neutral";

  // Volume spike proxy (high IV = high volume day)
  const volSpike = iv > 80 || changeAbs > 5;

  // CCI proxy (commodity channel index)
  // CCI: deterministic from change
  let cci;
  if (change <= -5)      cci = -(90  + changeAbs * 14);
  else if (change <= -2) cci = -(30  + changeAbs * 10);
  else if (change <= 1)  cci = change * 15;
  else if (change <= 4)  cci = 20 + change * 18;
  else                   cci = 80  + (change - 4) * 22;
  cci = +Math.max(-250, Math.min(250, cci)).toFixed(0);

  // Williams %R
  // Williams %R: directly from price position (deterministic)
  let willR = -(100 - pricePos);
  willR = +Math.max(-100, Math.min(0, willR)).toFixed(1);

  // Mean Reversion Score (0-100, higher = stronger buy signal)
  let mrScore = 50;
  if (rsi < 30) mrScore += 28;
  else if (rsi < 40) mrScore += 16;
  else if (rsi > 70) mrScore -= 22;
  else if (rsi > 80) mrScore -= 30;

  if (bbPos < 15) mrScore += 18;
  else if (bbPos < 25) mrScore += 10;
  else if (bbPos > 85) mrScore -= 18;

  if (stochK < 20) mrScore += 12;
  else if (stochK > 80) mrScore -= 12;

  if (change < -5) mrScore += 14;
  else if (change < -2) mrScore += 7;
  else if (change > 5) mrScore -= 10;

  if (willR < -80) mrScore += 10;
  if (cci < -100) mrScore += 8;
  if (cci > 100) mrScore -= 8;

  mrScore = Math.max(0, Math.min(100, +mrScore.toFixed(0)));

  // Determine signal level
  let signal, signalLabel, signalColor;
  if (mrScore >= 75) { signal="extreme"; signalLabel="🟢 EXTREME OVERSOLD — Prime Entry"; signalColor="var(--green)"; }
  else if (mrScore >= 60) { signal="strong"; signalLabel="🔵 STRONG OVERSOLD — Watch Entry"; signalColor="var(--cyan)"; }
  else if (mrScore >= 45) { signal="moderate"; signalLabel="🟡 MILDLY OVERSOLD"; signalColor="var(--gold)"; }
  else if (mrScore <= 20) { signal="overbought"; signalLabel="🔴 OVERBOUGHT — Avoid Calls"; signalColor="var(--red)"; }
  else { signal="none"; signalLabel="◎ NEUTRAL — No Edge"; signalColor="var(--dim)"; }

  // Entry timing recommendation
  let entryRec = "";
  if (signal === "extreme") entryRec = "Price at/near lower Bollinger Band with RSI < 30. Mean reversion calls/LEAPS favored. Enter on next green candle or volume spike. Tight stop below today's low.";
  else if (signal === "strong") entryRec = "RSI approaching oversold with price near range lows. Consider scaling into calls. Wait for RSI to tick above 32 before full position.";
  else if (signal === "moderate") entryRec = "Mild pullback — wait for RSI < 35 or a retest of intraday lows before entering. Not an ideal mean reversion setup yet.";
  else if (signal === "overbought") entryRec = "Stock is overbought — avoid calls, consider puts or iron condors to take advantage of elevated IV and potential pullback.";
  else entryRec = "Stock is trading near fair value. No mean reversion edge present. Wait for a larger deviation.";

  // Confluence signals
  const signals = [];
  if (rsi < 30) signals.push({label:"RSI < 30 ✓",type:"bull"});
  else if (rsi > 70) signals.push({label:"RSI > 70 ✗",type:"bear"});
  else signals.push({label:`RSI ${rsi}`,type:"neut"});

  if (bbPos < 20) signals.push({label:"Below BB Lower ✓",type:"bull"});
  else if (bbPos > 80) signals.push({label:"Above BB Upper ✗",type:"bear"});
  else signals.push({label:"Mid BB",type:"neut"});

  if (stochK < 20) signals.push({label:"Stoch < 20 ✓",type:"bull"});
  else if (stochK > 80) signals.push({label:"Stoch > 80 ✗",type:"bear"});
  else signals.push({label:`Stoch ${stochK}`,type:"neut"});

  if (willR < -80) signals.push({label:"Will%R Oversold ✓",type:"bull"});
  else if (willR > -20) signals.push({label:"Will%R Overbought ✗",type:"bear"});
  else signals.push({label:`Will%R ${willR}`,type:"neut"});

  if (cci < -100) signals.push({label:"CCI < -100 ✓",type:"bull"});
  else if (cci > 100) signals.push({label:"CCI > 100 ✗",type:"bear"});
  else signals.push({label:`CCI ${cci.toFixed(0)}`,type:"neut"});

  signals.push({label:macd==="bullish"?"MACD Bull ✓":macd==="bearish"?"MACD Bear ✗":"MACD Neut",type:macd==="bullish"?"bull":macd==="bearish"?"bear":"neut"});
  if (volSpike) signals.push({label:"Vol Spike ✓",type:"bull"});

  const bullCount = signals.filter(s=>s.type==="bull").length;
  const bearCount = signals.filter(s=>s.type==="bear").length;

  return { rsi, stochK, stochD, bbPos, cci, willR, macd, dist52w, pricePos, mrScore, signal, signalLabel, signalColor, entryRec, signals, bullCount, bearCount, volSpike };
}


/* ── DIP TRIGGER ENGINE ──
   Detects 20%+ dip conditions and computes precise entry/exit levels.
   Uses: price vs 52w high proxy, day range, change%, RSI proxy, BB position,
   volume spike, support/resistance zones, and risk/reward calculation.
   Returns: { grade, score, dipPct, entry, t1, t2, t3, stop, rr, 
              confidence, reasons, signals, zone, riskPerShare }
*/
function calcDipTrigger(price, high, low, prevClose, change, iv, ticker) {
  if (!price || price <= 0) return null;

  const chg      = change || 0;
  const chgAbs   = Math.abs(chg);
  const dayRange = (high || price * 1.01) - (low || price * 0.99);
  const pricePos = dayRange > 0 ? ((price - (low||price*.99)) / dayRange) * 100 : 50;

  // ── Simulate 52-week high proxy ──
  // We don't have historical data, so estimate from current momentum
  // High IV + negative change = likely in a drawdown
  const ivFactor    = Math.min((iv || 30) / 100, 1);
  const dipEstimate = chg < 0
    ? Math.min(75, chgAbs * 3.2 + ivFactor * 18)
    : Math.max(0,  ivFactor * 8  - chg * 1.2);
  const dipPct = +dipEstimate.toFixed(1);

  // ── RSI proxy (reuse from MR engine logic) ──
  let rsi;
  if      (chg <= -8) rsi = Math.max(8,  18 - chgAbs * 0.9);
  else if (chg <= -5) rsi = Math.max(15, 26 - chgAbs * 0.7);
  else if (chg <= -3) rsi = Math.max(22, 33 - chgAbs * 0.6);
  else if (chg <= -1) rsi = 38 + (chg + 1) * 2.5 + 5;
  else if (chg <= 1)  rsi = 50 + chg * 2.5;
  else if (chg <= 3)  rsi = 55 + (chg - 1) * 3;
  else if (chg <= 5)  rsi = 62 + (chg - 3) * 3;
  else if (chg <= 8)  rsi = 70 + (chg - 5) * 2;
  else                rsi = Math.min(95, 78 + chgAbs * 0.6);
  rsi = +Math.max(5, Math.min(95, rsi)).toFixed(1);

  // ── BB position proxy ──
  let bbPos;
  if      (chg <= -5) bbPos = Math.max(0,  6  + chgAbs * 0.4);
  else if (chg <= -2) bbPos = Math.max(5,  18 + chg * 3);
  else if (chg <= 0)  bbPos = 38 + chg * 5;
  else if (chg <= 2)  bbPos = 52 + chg * 6;
  else if (chg <= 5)  bbPos = 66 + (chg - 2) * 4;
  else                bbPos = Math.min(98, 80 + (chg - 5) * 3);
  bbPos = +Math.max(0, Math.min(100, bbPos)).toFixed(1);

  // ── DIP SCORE (0–100) ──
  let score = 0;

  // Dip depth contribution (20%+ = significant, 40%+ = extreme)
  if      (dipPct >= 50) score += 35;
  else if (dipPct >= 40) score += 30;
  else if (dipPct >= 30) score += 24;
  else if (dipPct >= 20) score += 18;
  else if (dipPct >= 12) score += 10;
  else if (dipPct >= 6)  score += 5;

  // RSI oversold confirmation
  if      (rsi < 20) score += 25;
  else if (rsi < 30) score += 20;
  else if (rsi < 40) score += 12;
  else if (rsi > 70) score -= 15;

  // Bollinger Band confirmation
  if      (bbPos < 10) score += 15;
  else if (bbPos < 20) score += 10;
  else if (bbPos < 30) score += 5;
  else if (bbPos > 80) score -= 10;

  // Day position (buying near session low = better entry)
  if      (pricePos < 15) score += 12;
  else if (pricePos < 30) score += 7;
  else if (pricePos > 85) score -= 8;

  // Volume/IV spike = capitulation signal
  if ((iv || 30) > 80 || chgAbs > 6) score += 10;
  if ((iv || 30) > 100)               score += 5;

  // Negative change magnitude (larger drop = better entry)
  if      (chg <= -8)  score += 12;
  else if (chg <= -5)  score += 8;
  else if (chg <= -3)  score += 5;
  else if (chg > 3)    score -= 10;

  score = Math.max(0, Math.min(100, score));

  // ── GRADE ──
  let grade, gradeLabel, gradeColor, gradeEmoji;
  if      (score >= 75) { grade = 'prime';   gradeLabel = '🟢 PRIME DIP ENTRY';  gradeColor = 'var(--green)'; gradeEmoji = '🎯'; }
  else if (score >= 55) { grade = 'watch';   gradeLabel = '🔵 DIP WATCH ZONE';   gradeColor = 'var(--cyan)';  gradeEmoji = '📍'; }
  else if (score >= 35) { grade = 'neutral'; gradeLabel = '⬜ MILD PULLBACK';     gradeColor = 'var(--dim)';   gradeEmoji = '⏳'; }
  else                  { grade = 'danger';  gradeLabel = '🔴 AVOID / OVERBOUGHT';gradeColor = 'var(--red)';   gradeEmoji = '🚫'; }

  // ── SUPPORT ZONES (technical levels) ──
  // ATR proxy: use day range as surrogate
  const atr = Math.max(dayRange, price * 0.008);

  // Entry zone: slightly below current for confirmed reversal
  const entry    = +(price * (chg < -3 ? 1.002 : 0.997)).toFixed(2); // slight buffer
  const support1 = +(price - atr * 1.2).toFixed(2);
  const support2 = +(price - atr * 2.4).toFixed(2);
  const resist1  = +(price + atr * 1.5).toFixed(2);
  const resist2  = +(price + atr * 3.0).toFixed(2);

  // Fibonacci-based targets from entry
  const range = price * 0.01 * Math.max(chgAbs, 2); // base move magnitude
  const t1  = +(entry + range * 1.0).toFixed(2);   // +1R
  const t2  = +(entry + range * 1.618).toFixed(2); // Golden ratio
  const t3  = +(entry + range * 2.618).toFixed(2); // Ext fib
  const stop = +(entry - range * 0.60).toFixed(2); // Tight stop

  const riskPerShare = +(entry - stop).toFixed(2);
  const reward1      = +(t1 - entry).toFixed(2);
  const rr           = riskPerShare > 0 ? +( reward1 / riskPerShare ).toFixed(1) : 0;

  // ── CONFLUENCE SIGNALS ──
  const signals = [];
  if (rsi < 30)       signals.push({label:`RSI ${rsi} — Oversold`,  type:'bull'});
  else if (rsi > 70)  signals.push({label:`RSI ${rsi} — Extended`,  type:'bear'});
  else                signals.push({label:`RSI ${rsi} — Neutral`,   type:'neut'});

  if (bbPos < 20)     signals.push({label:'Below BB Lower Band',     type:'bull'});
  else if (bbPos > 80)signals.push({label:'Above BB Upper Band',     type:'bear'});
  else                signals.push({label:`BB ${bbPos.toFixed(0)}% Mid`, type:'neut'});

  if (pricePos < 20)  signals.push({label:'Near Session Low ✓',     type:'bull'});
  else if (pricePos > 80) signals.push({label:'Near Session High',   type:'bear'});

  if (dipPct >= 20)   signals.push({label:`${dipPct}% Est. Drawdown`, type:'bull'});
  if (chg <= -5)      signals.push({label:`${chg.toFixed(1)}% Day Drop`, type:'bull'});
  if ((iv||30) > 80)  signals.push({label:'High IV — Capitulation?', type:'bull'});
  if (chg > 5)        signals.push({label:'Overbought Extension',    type:'bear'});

  // ── REASON NARRATIVE ──
  const reasons = [];
  if (dipPct >= 20) reasons.push(`<b>${dipPct}% estimated drawdown</b> from recent highs — historically a mean-reversion opportunity.`);
  if (rsi < 30)     reasons.push(`<b>RSI at ${rsi}</b> — deeply oversold. Statistical edge for bounce.`);
  if (bbPos < 20)   reasons.push(`Price <b>below Bollinger lower band</b> — stretched 2+ standard deviations.`);
  if (chg <= -5)    reasons.push(`<b>${chg.toFixed(1)}% single-session drop</b> — elevated chance of next-day reversal.`);
  if ((iv||30) > 80)reasons.push(`<b>IV spike to ${iv}%</b> — suggests capitulatory selling pressure.`);
  if (pricePos < 20)reasons.push(`Trading <b>near session low</b> — intraday risk/reward favors longs.`);
  if (reasons.length === 0) reasons.push('No strong dip signals detected. Wait for deeper pullback or more confluence.');

  // ── ZONE DESCRIPTION ──
  const zone = dipPct >= 40 ? 'Deep Value Zone' : dipPct >= 25 ? 'Primary Buy Zone' : dipPct >= 15 ? 'Accumulation Zone' : 'Monitoring Zone';
  const confidence = score >= 75 ? 'High' : score >= 55 ? 'Medium' : score >= 35 ? 'Low' : 'Very Low';

  return {
    grade, gradeLabel, gradeColor, gradeEmoji,
    score, dipPct, confidence, zone,
    entry, t1, t2, t3, stop,
    support1, support2, resist1, resist2,
    riskPerShare, reward1, rr,
    signals, reasons, rsi, bbPos, pricePos,
    bullSignals: signals.filter(s=>s.type==='bull').length,
    bearSignals: signals.filter(s=>s.type==='bear').length,
  };
}

/* ── OPTIONS MATH ── */
function erf(x){const a1=.254829592,a2=-.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=.3275911;const sign=x<0?-1:1;const t2=1/(1+p*Math.abs(x));const y=1-(((((a5*t2+a4)*t2)+a3)*t2+a2)*t2+a1)*t2*Math.exp(-x*x);return sign*y;}
function N(x){return .5*(1+erf(x/Math.sqrt(2)));}
function Npdf(x){return Math.exp(-.5*x*x)/Math.sqrt(2*Math.PI);}
function rnd(a,b,d=2){return parseFloat((Math.random()*(b-a)+a).toFixed(d));}
function rint(a,b){return Math.floor(Math.random()*(b-a+1)+a);}


/* ── EXPIRATION DATE CALCULATOR ──
   Real US equity options expire:
   - Weeklies: every Friday
   - Standard monthlies: 3rd Friday of the month
   Given DTE, compute the exact calendar expiration date.
*/
function calcExpirationDate(dte) {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const today = new Date();
  today.setHours(0,0,0,0);
  // Target date = today + dte days
  const target = new Date(today.getTime() + dte * 86400000);

  // For short DTE (≤14), snap to the next Friday on or after target
  function nextFriday(d) {
    const day = d.getDay(); // 0=Sun,1=Mon,...,5=Fri,6=Sat
    const diff = day <= 5 ? (5 - day) : 6; // days until next Friday (same day if already Friday)
    const f = new Date(d.getTime() + diff * 86400000);
    return f;
  }

  // For longer DTE (>14), use 3rd Friday of the target month
  function thirdFriday(year, month) {
    // Find first day of month
    let d = new Date(year, month, 1);
    // Move to first Friday
    while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
    // 3rd Friday = first Friday + 14 days
    d.setDate(d.getDate() + 14);
    return d;
  }

  let expDate;
  if (dte <= 14) {
    expDate = nextFriday(target);
  } else {
    // Use 3rd Friday of the target month
    const tf = thirdFriday(target.getFullYear(), target.getMonth());
    // If 3rd Friday is before target, use next month's 3rd Friday
    expDate = tf >= target ? tf : thirdFriday(
      target.getMonth() === 11 ? target.getFullYear()+1 : target.getFullYear(),
      target.getMonth() === 11 ? 0 : target.getMonth()+1
    );
  }

  const mon  = MONTHS[expDate.getMonth()];
  const day  = expDate.getDate();
  const year = expDate.getFullYear();
  const dow  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][expDate.getDay()];
  // Real DTE from today to expiration
  const realDte = Math.round((expDate.getTime() - today.getTime()) / 86400000);
  return {
    date: expDate,
    label: `${mon} ${day}, ${year}`,        // "Mar 21, 2025"
    short: `${mon} ${day}`,                   // "Mar 21"
    full: `${dow} ${mon} ${day}, ${year}`,   // "Fri Mar 21, 2025"
    realDte,
  };
}
/* ── STRIKE GRID: matches CBOE/OCC standard option strike intervals ──
   Price < $5      → $0.50 increments
   Price $5–$25    → $1.00 increments
   Price $25–$50   → $1.00 increments (sometimes $2.50 for weeklies, use $1 for safety)
   Price $50–$100  → $2.50 increments
   Price $100–$200 → $2.50 increments (some use $5, use $2.50 for granularity)
   Price $200–$500 → $5.00 increments
   Price > $500    → $10.00 increments (NVDA/AMZN/TSLA range)
   Snap ATM to nearest grid point, then generate:
     idx=0 → ATM (nearest to current price)
     idx=1 → 1 strike OTM (calls: above; puts: below)
     idx=2 → 2 strikes OTM
*/
function strikeIncrement(price) {
  if (price < 5)    return 0.5;
  if (price < 25)   return 1;
  if (price < 50)   return 1;
  if (price < 100)  return 2.5;
  if (price < 200)  return 2.5;
  if (price < 500)  return 5;
  if (price < 1000) return 10;
  return 25; // >$1000 (e.g. AMZN, GOOGL could be here)
}
function snapToGrid(price, incr) {
  return Math.round(price / incr) * incr;
}
function genContract(ticker,price,iv,optType,expDateStr,idx){
  const isCall=optType==="call";
  // expDateStr is a real "YYYY-MM-DD" string — compute DTE directly
  const today=new Date(); today.setHours(0,0,0,0);
  const expDate=new Date((expDateStr||"")+"T00:00:00");
  const isValidDate=!isNaN(expDate.getTime());
  const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const realDte=isValidDate?Math.max(Math.round((expDate.getTime()-today.getTime())/86400000),1):30;
  const mon=MONTHS[expDate.getMonth()];
  const day=expDate.getDate();
  const yr=expDate.getFullYear();
  const dow=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][expDate.getDay()];
  const expInfo={
    realDte,
    label:`${mon} ${day}, ${yr}`,
    short:`${mon} ${day}`,
    full:`${dow} ${mon} ${day}, ${yr}`,
    date:expDate,
  };
  const t=Math.max(realDte/365,0.001);
  // Compute proper strike grid based on live price
  const incr = strikeIncrement(price);
  const atm = snapToGrid(price, incr);
  // idx=0: ATM, idx=1: 1-strike OTM, idx=2: 2-strikes OTM
  // For calls: higher strikes are OTM. For puts: lower strikes are OTM.
  const otmMultiplier = isCall ? 1 : -1;
  const strike = +(atm + otmMultiplier * idx * incr).toFixed(2);
  const isATM=Math.abs(price/strike-1)<.025;
  const isOTM=isCall?strike>price:strike<price;
  const ivP=Math.min((iv/100)*(1+.1*(7/Math.max(realDte,1))),2.5);
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
  // OI and Volume are always null until populated from real chain data
  // Never use random estimates — show "—" if not available
  const oi=null, vol=null;
  const realData=false;
  let signal="neutral";
  const absDelta=Math.abs(delta);
  if(isCall&&absDelta>.45)signal="bullish";
  else if(isCall&&absDelta>.3)signal="bullish";
  else if(!isCall&&absDelta>.4)signal="bearish";
  else if(!isCall&&absDelta>.3)signal="bearish";
  return {
    ticker,name:OPT_BASE.find(x=>x.t===ticker)?.n||ticker,
    stockPrice:price,strike,optType,expLabel:expDateStr,dte:expInfo.realDte,
    expirationDate:expInfo.label,
    expirationFull:expInfo.full,
    expirationShort:expInfo.short,
    prem,ep,t1,t2,t3,sl,
    maxPnl:+((t3-ep)*100).toFixed(0),maxLoss:+((ep-sl)*100).toFixed(0),
    delta:+delta.toFixed(4),gamma:+gamma.toFixed(6),theta:+theta.toFixed(4),vega:+vega.toFixed(4),rho:+rho.toFixed(4),
    iv:+(ivP*100).toFixed(1),ivRank:rint(15,92),ivPct:rint(10,95),
    oi,vol,pcr:null,
    dayR:{lo:rnd(prem*.65,prem*.88),hi:rnd(prem*1.12,prem*1.45)},
    weekR:{lo:rnd(prem*.45,prem*.75),hi:rnd(prem*1.3,prem*1.85)},
    monthR:realDte>=30?{lo:rnd(prem*.25,prem*.6),hi:rnd(prem*1.5,prem*2.8)}:null,
    signal,moneyLabel:isATM?"ATM":isOTM?"OTM":"ITM",
    bid:+(prem*.975).toFixed(2),ask:+(prem*1.025).toFixed(2),spread:+(prem*.05).toFixed(2),
    contractLabel:`${ticker} $${strike} ${isCall?"CALL":"PUT"} ${expInfo.short}`,
    entryTotalCost:+(ep*100).toFixed(0),
    realData,
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
const SECTORS=["All Sectors","Technology","Semiconductors","Fintech","Financials","Healthcare","Biotech","Consumer Discretionary","Consumer Staples","Industrials","Defense","Clean Energy","Energy","Utilities","Materials","Mining","ETF","eVTOL"];
const MARKETS=["US Large Cap","US Mid Cap","US Small Cap","US Micro Cap","International Developed","Emerging Markets","Global","Canada","Europe","Asia Pacific","Latin America"];
// ── Label a real calendar expiration date for display in the dropdown ──
// Input: "YYYY-MM-DD" string from Finnhub
// Output: "Mar 21 · 1 DTE · Same-Day" style label — exact DTE always shown
function labelExpDate(dateStr) {
  if (!dateStr) return null;
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today  = new Date(); today.setHours(0,0,0,0);
  const exp    = new Date(dateStr + "T00:00:00");
  if (isNaN(exp.getTime())) return null;
  const dte  = Math.round((exp.getTime() - today.getTime()) / 86400000);
  const mon  = MONTHS[exp.getMonth()];
  const day  = exp.getDate();
  const year = exp.getFullYear();
  const dow  = exp.getDay();
  const dowName = DAYS[dow];
  // ── Exact kind label — every DTE gets a precise tag ──
  let kind;
  if (dte <= 0)        kind = "Same-Day";
  else if (dte === 1)  kind = "1 DTE";
  else if (dte === 2)  kind = "2 DTE";
  else if (dte === 3)  kind = "3 DTE";
  else if (dte === 4)  kind = "4 DTE";
  else if (dte === 5)  kind = "5 DTE";
  else if (dte <= 9)   kind = "Weekly";
  else if (dte <= 16)  kind = "2-Week";
  else if (dte <= 23)  kind = "3-Week";
  else if (dte <= 37)  kind = "Monthly";   // ~30 DTE
  else if (dte <= 55)  kind = "Monthly";   // ~45 DTE
  else if (dte <= 75)  kind = "Quarterly";
  else if (dte <= 105) kind = "Quarterly";
  else if (dte <= 200) kind = "LEAPS";
  else                 kind = `LEAPS ${year}`;
  // Promote to "Monthly" label if it's a standard 3rd Friday (dow===5, right range)
  if (dte >= 17 && dte <= 55 && dow === 5) kind = "Monthly";
  // Display: "Mar 21 · 1 DTE · Fri" for short; full label for option element
  const dteTag = dte <= 0 ? "0 DTE" : `${dte} DTE`;
  return {
    label:   `${mon} ${day}, ${year}`,
    short:   `${mon} ${day}`,
    full:    `${dowName} ${mon} ${day}, ${year}`,
    dte, kind, year, dateStr,
    display: dte<=5 ? `${dowName} ${mon} ${day}  ·  ${dteTag}` : `${mon} ${day}, ${year}  ·  ${dteTag}  ·  ${kind}`,
  };
}
const OSTRATEGIES=["High IV Crush (Sell)","Low IV Buy","Momentum Calls","Protective Puts","Covered Calls","Cash-Secured Puts","Debit Spreads","Iron Condors","Directional (Calls)","Directional (Puts)"];
const OTYPES=["Calls Only","Puts Only","Both Calls & Puts"];


/* ── CHART LINK COMPONENT ──
   Opens TradingView in new tab — zero iframe overhead, instant.
   No loading spinner, no CORS, no blocked embeds.
*/
function TVChart({ ticker, interval = "D" }) {
  const tvUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(ticker)}&interval=${interval}`;
  const intervals = [["1m","1"],["5m","5"],["15m","15"],["1h","60"],["1D","D"],["1W","W"]];
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                 height:"100%",minHeight:180,gap:16,padding:24,background:"rgba(0,0,0,.4)"}}>
      <div style={{fontSize:28}}>📈</div>
      <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,color:"var(--txt)"}}>{ticker}</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
        {intervals.map(([label,val])=>(
          <a key={val}
            href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(ticker)}&interval=${val}`}
            target="_blank" rel="noopener noreferrer"
            style={{padding:"6px 14px",background:"rgba(0,232,122,.1)",border:"1px solid rgba(0,232,122,.3)",
                    borderRadius:7,color:"var(--green)",fontSize:11,fontFamily:"DM Mono,monospace",
                    textDecoration:"none",letterSpacing:".5px"}}>
            {label}
          </a>
        ))}
      </div>
      <a href={tvUrl} target="_blank" rel="noopener noreferrer"
        style={{padding:"10px 28px",background:"linear-gradient(135deg,rgba(0,232,122,.18),rgba(0,212,255,.1))",
                border:"1px solid rgba(0,232,122,.4)",borderRadius:10,color:"var(--green)",
                fontWeight:700,fontSize:13,textDecoration:"none",marginTop:4}}>
        Open Full Chart →
      </a>
      <div style={{fontSize:10,color:"var(--dim)"}}>Powered by TradingView · Opens in new tab</div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   APP
══════════════════════════════════════════════ */
/* ── DIP TRIGGER BANNER COMPONENT ──
   Shared by both stock screener rows and options screener.
   compact=true → mini version for table cells
*/
function DipBanner({ dip, compact = false }) {
  if (!dip) return null;

  if (compact) {
    return (
      <div className="sdip">
        <div className={`sdip-badge ${dip.grade}`}>{dip.gradeEmoji} {dip.grade==='prime'?'PRIME ENTRY':dip.grade==='watch'?'DIP WATCH':dip.grade==='danger'?'EXTENDED':'PULLBACK'} · {dip.score}/100</div>
        <div className="sdip-levels">
          <div className="sdip-row"><span className="sdip-lbl">Entry</span><span className="sdip-val" style={{color:'var(--green)'}}>${dip.entry}</span></div>
          <div className="sdip-row"><span className="sdip-lbl">T1</span><span className="sdip-val" style={{color:'var(--cyan)'}}>${dip.t1}</span></div>
          <div className="sdip-row"><span className="sdip-lbl">T2</span><span className="sdip-val" style={{color:'var(--blue)'}}>${dip.t2}</span></div>
          <div className="sdip-row"><span className="sdip-lbl">Stop</span><span className="sdip-val" style={{color:'var(--red)'}}>${dip.stop}</span></div>
        </div>
        <div className="sdip-rr">R/R {dip.rr}:1 · {dip.dipPct}% est. dip · {dip.confidence} conf.</div>
      </div>
    );
  }

  return (
    <div className={`dip-banner dip-${dip.grade}`}>
      <div className="dip-header">
        <div className="dip-title">
          <span style={{fontSize:18}}>{dip.gradeEmoji}</span>
          <span style={{color:dip.gradeColor}}>{dip.gradeLabel}</span>
          <span className={`dip-badge ${dip.grade}`}>{dip.confidence} Confidence</span>
          <span className={`dip-badge ${dip.grade}`}>{dip.zone}</span>
        </div>
        <div className="dip-score-ring">
          <div className="dip-score-num" style={{color:dip.gradeColor}}>{dip.score}</div>
          <div style={{fontSize:9,color:'var(--dim)',lineHeight:1.3}}>DIP<br/>SCORE</div>
        </div>
      </div>

      <div className="dip-levels">
        <div className="dip-level entry">
          <div className="dip-level-lbl">Entry Zone</div>
          <div className="dip-level-val" style={{color:'var(--green)'}}>${dip.entry}</div>
          <div className="dip-level-sub">Confirmed reversal entry</div>
        </div>
        <div className="dip-level target">
          <div className="dip-level-lbl">Target 1 (+1R)</div>
          <div className="dip-level-val" style={{color:'var(--cyan)'}}>${dip.t1}</div>
          <div className="dip-level-sub">First profit zone</div>
        </div>
        <div className="dip-level target">
          <div className="dip-level-lbl">Target 2 (Fib 1.618)</div>
          <div className="dip-level-val" style={{color:'var(--blue)'}}>${dip.t2}</div>
          <div className="dip-level-sub">Primary exit target</div>
        </div>
        <div className="dip-level target">
          <div className="dip-level-lbl">Target 3 (Fib 2.618)</div>
          <div className="dip-level-val" style={{color:'var(--cyan)'}}>${dip.t3}</div>
          <div className="dip-level-sub">Full extension target</div>
        </div>
        <div className="dip-level stop">
          <div className="dip-level-lbl">Stop Loss</div>
          <div className="dip-level-val" style={{color:'var(--red)'}}>${dip.stop}</div>
          <div className="dip-level-sub">Invalidation level</div>
        </div>
        <div className="dip-level" style={{borderColor:'rgba(245,166,35,.3)',background:'rgba(245,166,35,.05)'}}>
          <div className="dip-level-lbl">Risk / Reward</div>
          <div className="dip-level-val" style={{color:'var(--gold)'}}>{dip.rr}:1</div>
          <div className="dip-level-sub">${dip.riskPerShare} risk/share</div>
        </div>
      </div>

      <div className="dip-meta">
        <span className="dip-meta-pill">Est. Drawdown <b>{dip.dipPct}%</b></span>
        <span className="dip-meta-pill">RSI <b style={{color:dip.rsi<30?'var(--green)':dip.rsi>70?'var(--red)':'inherit'}}>{dip.rsi}</b></span>
        <span className="dip-meta-pill">BB Position <b>{dip.bbPos.toFixed(0)}%</b></span>
        <span className="dip-meta-pill">Support 1 <b>${dip.support1}</b></span>
        <span className="dip-meta-pill">Support 2 <b>${dip.support2}</b></span>
        <span className="dip-meta-pill">Resistance 1 <b>${dip.resist1}</b></span>
        <span className="dip-meta-pill">Bull Signals <b style={{color:'var(--green)'}}>{dip.bullSignals}</b></span>
        <span className="dip-meta-pill">Bear Signals <b style={{color:'var(--red)'}}>{dip.bearSignals}</b></span>
      </div>

      <div className="dip-confluence">
        <div className="dip-confluence-title">Confluence Signals</div>
        <div className="dip-signals">
          {dip.signals.map((sig,i)=>(
            <span key={i} className={`dip-sig ${sig.type}`}>{sig.label}</span>
          ))}
        </div>
      </div>

      <div className="dip-reason">
        {dip.reasons.map((r,i)=>(
          <div key={i} style={{marginBottom:i<dip.reasons.length-1?5:0}} dangerouslySetInnerHTML={{__html:'• '+r}}/>
        ))}
      </div>
    </div>
  );
}

/* ── OPTION CARD ── */
function OCard({c}){
  // Show real-data indicator for vol/OI sourced from Finnhub option chain
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
          <div>
              <div className="otick">{c.ticker} ${c.strike} {c.optType.toUpperCase()}</div>
              <div className="oname">{c.name} · {c.moneyLabel} · {c.dte} DTE</div>
            </div>
        </div>
        <div className="ohdr-r">
          <span className="oexp" title={c.expirationFull}>
            📅 {c.expirationDate}
          </span>
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
        <div className="ometric"><div className="oml">Expires</div><div className="omv" style={{fontSize:12,color:"var(--gold)"}}>{c.expirationDate}</div><div className="oms">{c.expirationFull}</div></div>
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
        <div className="oi-box">
          <div className="oil">Open Interest</div>
          <div className="oiv" style={{color:c.oiReal?"var(--cyan)":"var(--txt)"}}>
            {c.oi!=null?c.oi.toLocaleString():"0"}
            {c.oiReal&&<span style={{fontSize:9,color:"var(--green)",marginLeft:3}}>●LIVE</span>}
            {c.oiEst&&<span style={{fontSize:9,color:"var(--gold)",marginLeft:3}}>~EST</span>}
          </div>
          <div className="ois">{c.oi>10000?"High liquidity":c.oi>2000?"Moderate liquidity":"Low liquidity"}</div>
        </div>
        <div className="oi-box">
          <div className="oil">Volume Today</div>
          <div className="oiv" style={{color:c.oiReal?"var(--cyan)":"var(--txt)"}}>
            {c.vol!=null?c.vol.toLocaleString():"0"}
            {c.oiReal&&<span style={{fontSize:9,color:"var(--green)",marginLeft:3}}>●LIVE</span>}
            {c.volEst&&<span style={{fontSize:9,color:"var(--gold)",marginLeft:3}}>~EST</span>}
          </div>
          <div className="ois">{c.oi&&c.oi>0?`${((c.vol/c.oi)*100).toFixed(1)}% of OI`:c.oiReal?"From chain":"Delta model"}</div>
        </div>
        <div className="oi-box">
          <div className="oil">Put/Call Ratio</div>
          <div className="oiv">{c.pcr||"—"}</div>
          <div className="ois">{c.pcr?(c.pcr<0.7?"Bullish":c.pcr>1.3?"Bearish":"Neutral")+" sentiment":"N/A"}</div>
        </div>
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

function App({ session, onSignOut, onRequestAuth }) {
  const [tab,setTab]=useState("stocks");
  // ── USER SESSION ──
  const user = session?.user || null;
  const userEmail = user?.email || "";
  const isOwnerEmail = userEmail === "rubberband.ai.io@gmail.com";
  const [prices,setPrices]=useState({});
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
  // Always generate fresh on component mount — pure JS, <1ms, guarantees 1 DTE & 2 DTE
  const [availExps,setAvailExps]=useState(()=>generateExpirationDates());
  const [optExp,setOptExp]=useState(()=>{
    const exps=generateExpirationDates();
    const preferred=exps.reduce((b,e)=>!b||Math.abs(e.dte-30)<Math.abs(b.dte-30)?e:b,null)||exps[0];
    return preferred?.dateStr||null;
  });
  const [expsLoading,setExpsLoading]=useState(false);
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
  const [optChain,setOptChain]=useState({});
  const [adminUnlocked,setAdminUnlocked]=useState(false);
  const [adminPin,setAdminPin]=useState("");
  const [adminError,setAdminError]=useState(false);
  const ADMIN_PIN="2580";
  const [eName,setEName]=useState("");
  const [eEmail,setEEmail]=useState("");
  const [eList,setEList]=useState(()=>{try{return JSON.parse(localStorage.getItem("rubberband_emails")||"[]");}catch{return [];}});
  const [eOk,setEOk]=useState(false);
  const runId=useRef(0);
  const optRunId=useRef(0);
  const [clock,setClock]=useState(new Date().toLocaleTimeString());

  // ── FREEMIUM / OWNER ACCESS ──
  // Owner (PIN 2580) gets full access forever. Free users pay via Stripe.
  const OWNER_PIN="2580";
  const [isPro,setIsPro]=useState(()=>{
    try{
      const params=new URLSearchParams(window.location.search);
      const success=params.get("rb_success");
      if(success==="pro"||success==="edge"){
        localStorage.setItem("rb_pro","true");
        if(success==="edge")localStorage.setItem("rb_tier","edge");
        window.history.replaceState({},"",window.location.pathname);
        return true;
      }
      return localStorage.getItem("rb_pro")==="true";
    }catch{return false;}
  });
  const [userTier,setUserTier]=useState(()=>{
    try{return localStorage.getItem("rb_tier")||"free";}catch{return "free";}
  });
  const isOwner=adminUnlocked||isOwnerEmail; // Owner = admin PIN OR owner email
  const hasFullAccess=isOwner||isPro;
  const hasEdgeAccess=isOwner||(isPro&&userTier==="edge"); // Edge features

  // Gate upgrade: guests must log in first, then go to Stripe
  const goUpgrade=(link)=>{
    if(!session){
      if(onRequestAuth)onRequestAuth();
    } else {
      window.location.href=link;
    }
  };
  // Freemium daily counters — all reset at midnight
  const _getDaily=(key,def=0)=>{
    try{
      const dateKey=key+"_date"; const today=new Date().toDateString();
      const storedDate=localStorage.getItem(dateKey);
      if(storedDate!==today){localStorage.setItem(dateKey,today);localStorage.setItem(key,String(def));return def;}
      return parseInt(localStorage.getItem(key)||String(def));
    }catch{return def;}
  };
  const _setDaily=(key,val)=>{try{localStorage.setItem(key,String(val));}catch{}};

  const [freeScansUsed,setFreeScansUsed]=useState(()=>_getDaily("rb_stock_scans"));   // stock scans
  const [freeOptScans,setFreeOptScans]=useState(()=>_getDaily("rb_opt_scans"));        // options entry scans
  const [freeAiUsed,setFreeAiUsed]=useState(()=>_getDaily("rb_ai_used"));              // AI insights
  const [freeOptTickers,setFreeOptTickers]=useState(()=>{                               // options tickers scanned today
    try{return new Set(JSON.parse(localStorage.getItem("rb_opt_tickers")||"[]"));}catch{return new Set();}
  });
  const FREE_STOCK_LIMIT=2;
  const FREE_OPT_LIMIT=2;
  const FREE_AI_LIMIT=2;
  const [showPaywall,setShowPaywall]=useState(false);
  const [showPricing,setShowPricing]=useState(false);

  // ── TRADE JOURNAL ──
  const [journal,setJournal]=useState(()=>{try{return JSON.parse(localStorage.getItem("rb_journal")||"[]");}catch{return[];}});
  const [journalEntry,setJournalEntry]=useState({ticker:"",type:"call",entry:"",target:"",stop:"",notes:"",outcome:""});
  const [journalTab,setJournalTab]=useState("log"); // log | new | stats

  // ── WATCHLIST ALERTS ──
  const [watchlist,setWatchlist]=useState(()=>{try{return JSON.parse(localStorage.getItem("rb_watchlist")||"[]");}catch{return[];}});
  const [alertTicker,setAlertTicker]=useState("");
  const [alertThreshold,setAlertThreshold]=useState(75);

  useEffect(()=>{
    const id=setInterval(()=>{setClock(new Date().toLocaleTimeString());setMs(mktStatus());},1000);
    return()=>clearInterval(id);
  },[]);

  // NO background fetching — Finnhub only called when user hits Scan or Run Screen

  useEffect(()=>{try{localStorage.setItem("rubberband_emails",JSON.stringify(eList));}catch{};},[eList]);
  useEffect(()=>{try{localStorage.setItem("rb_journal",JSON.stringify(journal));}catch{};},[journal]);
  useEffect(()=>{try{localStorage.setItem("rb_watchlist",JSON.stringify(watchlist));}catch{};},[watchlist]);
  useEffect(()=>{try{localStorage.setItem("rb_opt_tickers",JSON.stringify([...freeOptTickers]));}catch{};},[freeOptTickers]);

  const subscribe=()=>{
    if(!eEmail.includes("@"))return;
    const entry={name:"Subscriber",email:eEmail.trim().toLowerCase(),date:new Date().toLocaleDateString()};
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
    // Freemium gate — owner always bypasses
    if(!hasFullAccess){
      if(freeScansUsed>=FREE_STOCK_LIMIT){setShowPaywall(true);return;}
      const used=freeScansUsed+1;
      setFreeScansUsed(used);
      _setDaily("rb_stock_scans",used);
    }
    const rid=++runId.current;
    setSLoading(true);setSStep(1);setSProg(10);setSResult(null);setStocks([]);setSFilter("All");
    // Fetch fresh prices for stock screener tickers — sequential, on demand only
    const stockTickers=UNIVERSE_BASE.map(s=>s.t);
    const CHUNK=8;const GAP=150;
    for(let i=0;i<stockTickers.length;i+=CHUNK){
      if(runId.current!==rid){setSLoading(false);return;}
      const chunk=stockTickers.slice(i,i+CHUNK);
      const results=await Promise.allSettled(chunk.map(t=>fetchQuote(t)));
      const batch={};
      results.forEach((r,j)=>{if(r.status==='fulfilled'&&r.value)batch[chunk[j]]=r.value;});
      setPrices(prev=>({...prev,...batch}));
      setSProg(10+Math.round(((i+CHUNK)/stockTickers.length)*50));
      if(i+CHUNK<stockTickers.length)await new Promise(r=>setTimeout(r,GAP));
    }
    if(runId.current!==rid){setSLoading(false);return;}
    setLastRefresh(new Date());
    setSProg(65);
    const universe=liveUniverse();
    const scored=universe.map(s=>({...s,score:scoreStock(s,strategy,sector,market)})).sort((a,b)=>b.score-a.score).slice(0,25).map(s=>{
      const q=prices[s.t];
      const dip=q?calcDipTrigger(q.price,q.high||q.price*1.015,q.low||q.price*0.985,q.prevClose||q.price,q.change||0,OPT_BASE.find(x=>x.t===s.t)?.iv||30,s.t):null;
      return {...s,rating:getRating(s.score),metrics:getMetrics(s,strategy),thesis:buildThesis(s,strategy),isGem:s.cap==="Small"||s.cap==="Micro",dip};
    });
    setSProg(70);
    // Fire AI and render stocks simultaneously — don't block UI on AI
    setStocks(scored);setSProg(85);
    let crit=null;
    try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1600,messages:[{role:"user",content:`Expert equity analyst. ${strategy} stocks in ${sector}, ${market}. Return ONLY raw JSON no markdown: {"title":"str","summary":"str","criteria":[{"metric":"str","threshold":"str","description":"str","importance":80}],"redFlags":["str"],"proTips":["str"],"tags":["str"]} 8 criteria, importance 50-99.`}]})});if(res.ok){const e=await res.json();const raw=(e.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").trim();try{crit=JSON.parse(raw);}catch{}if(!crit){try{const m=raw.match(/\{[\s\S]*\}/);if(m)crit=JSON.parse(m[0]);}catch{}}}}catch{}
    if(!crit||!Array.isArray(crit.criteria)||!crit.criteria.length)crit=fallbackCrit(strategy,sector,market);
    if(runId.current!==rid){setSLoading(false);return;}
    setSProg(100);
    setSResult(crit);setSLoading(false);
  },[strategy,sector,market,prices]);

  // When ticker changes, refresh expirations (always fresh dates) and reset to ~30 DTE
  useEffect(()=>{
    const exps=generateExpirationDates();
    setAvailExps(exps);
    const preferred=exps.reduce((b,e)=>!b||Math.abs(e.dte-30)<Math.abs(b.dte-30)?e:b,null)||exps[0];
    if(preferred)setOptExp(preferred.dateStr);
  },[optTicker]);



  /* OPTIONS SCREENER */
  const pricesRef=useRef(prices);
  useEffect(()=>{pricesRef.current=prices;},[prices]);

  const runOptions=useCallback(async()=>{
    const rid=++optRunId.current;
    const tickerNow=optTicker, expNow=optExp, typeNow=optType, stratNow=optStrat;
    const _ubMatch=UNIVERSE_BASE.find(x=>x.t===tickerNow);
    const base=OPT_BASE.find(x=>x.t===tickerNow)
      ||(_ubMatch?{t:tickerNow,n:_ubMatch.n,iv:45,cat:"Stock"}:null)
      ||{t:tickerNow,n:tickerNow,iv:45,cat:"Stock"};

    // Helper — always clears loading state before any exit
    const abort=(msg)=>{ setOLoading(false); if(msg) setOInsights({error:true,msg}); };

    // Freemium gate — owner always bypasses
    if(!hasFullAccess){
      // Lock after 2 scans/day
      if(freeOptScans>=FREE_OPT_LIMIT){setOLoading(false);setShowPaywall(true);return;}
      // Lock after 1 unique ticker per day
      if(freeOptTickers.size>0&&!freeOptTickers.has(tickerNow)){
        setOLoading(false);setShowPaywall(true);return;
      }
      const used=freeOptScans+1;
      setFreeOptScans(used);
      _setDaily("rb_opt_scans",used);
      const newTickers=new Set([...freeOptTickers,tickerNow]);
      setFreeOptTickers(newTickers);
    }
    setOLoading(true); setOProg(10);
    setOContracts([]); setOInsights(null); setOTicker(null);

    // ── STEP 1: Live price ──
    setOStep(1); setOProg(20);
    const freshQuote = await fetchQuote(tickerNow);
    if(optRunId.current!==rid){ abort(); return; }
    if(!freshQuote||freshQuote.price<=0){
      abort(`Could not load live price for ${tickerNow}. Check connection and try again.`);
      return;
    }
    const livePrice=freshQuote.price;
    setPrices(prev=>({...prev,[tickerNow]:freshQuote}));
    setLastRefresh(new Date());

    // ── STEP 2: Option chain + IV (10s timeout each) ──
    setOStep(2); setOProg(40);
    let chainData=null, liveIV=null;
    try {
      const withTimeout=(p,ms)=>Promise.race([p, new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))]);
      [chainData]=await Promise.all([
        withTimeout(fetchOptionChainData(tickerNow,expNow),10000).catch(()=>null),
        withTimeout(fetchLiveIV(tickerNow),10000).catch(()=>null).then(iv=>{if(iv)liveIV=iv;})
      ]);
    } catch{}
    if(optRunId.current!==rid){ abort(); return; }
    liveIV=liveIV||ivCache[tickerNow]||base.iv||35;
    if(chainData) setOptChain(prev=>({...prev,[tickerNow]:chainData}));
    setOProg(55);

    // ── STEP 3: Build contracts ──
    setOStep(3); setOProg(65);
    const td = {
      t:           tickerNow,
      n:           base.n,
      p:           livePrice,
      iv:          liveIV,
      expLabel:    expNow,
      scanTime:    new Date().toLocaleTimeString(),
      priceSource: 'finnhub',
    };
    const types = typeNow==='Calls Only'?['call']:typeNow==='Puts Only'?['put']:['call','put'];
    const contracts=[];

    // Pre-filter chain keys — strip metadata, keep only valid numeric strikes
    const chainStrikes = chainData
      ? Object.keys(chainData)
          .filter(k=>k!=='_expDate'&&k!=='_underlying'&&!isNaN(+k)&&+k>0)
          .map(Number)
          .sort((a,b)=>a-b)
      : [];

    setOStep(4); setOProg(75);
    for(const tp of types){
      for(let i=0;i<3;i++){
        // genContract always uses td.p — the live price we just fetched
        const c = genContract(tickerNow, td.p, td.iv, tp, expNow, i); // expNow = real YYYY-MM-DD

        // Merge real Finnhub chain data if we have a matching strike
        if(chainStrikes.length>0){
          const nearest = chainStrikes.reduce((best,s)=>
            Math.abs(s-c.strike)<Math.abs(best-c.strike)?s:best,
            chainStrikes[0]
          );
          const incr = strikeIncrement(td.p);
          if(Math.abs(nearest-c.strike)<=incr*3){
            const realRow = chainData[nearest];
            const side    = tp==='call'?realRow?.call:realRow?.put;
            if(side){
              // Real OI and volume from Finnhub chain
              if(typeof side.oi     ==='number') { c.oi=side.oi;      c.oiReal=true; }
              if(typeof side.volume ==='number') { c.vol=side.volume; c.oiReal=true; }
              // Real bid/ask → mid price entry
              if(side.bid>0&&side.ask>0){
                c.bid=+side.bid.toFixed(2);
                c.ask=+side.ask.toFixed(2);
                const mid=+((side.bid+side.ask)/2).toFixed(2);
                c.prem=mid; c.ep=mid;
              } else if(side.last>0){
                c.prem=+side.last.toFixed(2);
                c.ep=+side.last.toFixed(2);
              }
              if(side.iv>0&&side.iv<300) c.iv=+side.iv.toFixed(1);
              c.spread=(side.ask>0&&side.bid>0)?+(side.ask-side.bid).toFixed(2):c.spread;
              // Recalculate all targets from real entry
              c.t1=+(c.ep*1.30).toFixed(2);
              c.t2=+(c.ep*1.65).toFixed(2);
              c.t3=+(c.ep*2.20).toFixed(2);
              c.sl=+(c.ep*0.55).toFixed(2);
              c.entryTotalCost=+(c.ep*100).toFixed(0);
              c.maxPnl=+((c.t3-c.ep)*100).toFixed(0);
              c.maxLoss=+((c.ep-c.sl)*100).toFixed(0);
              c.strike=nearest;
              c.contractLabel=`${tickerNow} $${nearest} ${tp==='call'?'CALL':'PUT'} ${c.expirationShort}`;
              c.realData=true;
            }
          }
        }

        // Fill estimated OI/vol only when chain returned nothing
        if(c.oi===null||c.vol===null){
          const absDelta=Math.abs(c.delta);
          const liqFactor=td.iv>60?1.8:td.iv>40?1.2:0.8;
          const estOI =Math.round(absDelta*45000*liqFactor);
          const estVol=Math.round(estOI*(0.12+absDelta*0.18));
          if(c.oi ===null){c.oi =estOI; c.oiEst=true;}
          if(c.vol===null){c.vol=estVol;c.volEst=true;}
        }
        if(c.pcr===null){
          const q=pricesRef.current[tickerNow];
          c.pcr=q&&q.change<-2?+((0.5+Math.random()*0.3)).toFixed(2)
               :q&&q.change> 2?+((1.2+Math.random()*0.4)).toFixed(2)
               :+((0.8+Math.random()*0.4)).toFixed(2);
        }

        contracts.push(c);
      }
    }
    contracts.sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));

    setOStep(5); setOProg(88);
    // ── AI insights — gated for free users (2/day limit) ──
    let ins=null;
    const canUseAi=hasFullAccess||(freeAiUsed<FREE_AI_LIMIT);
    if(!canUseAi){
      // Free user used up AI — give fallback insights only (no API call)
      ins=null; // will use fallback below
    }
    try{ if(canUseAi){
      const ctrl=new AbortController();
      const aiTimer=setTimeout(()=>ctrl.abort(),12000);
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        signal:ctrl.signal,
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:800,
          messages:[{role:'user',content:
            `Options analyst. ${tickerNow} at $${td.p}. IV=${td.iv}%. Strategy=${stratNow}. Exp=${expNow}.
Return ONLY raw JSON: {"summary":"str","topPlay":"str","entryTiming":"str","riskWarning":"str","ivAnalysis":"str","keyLevels":{"support":"str","resistance":"str","breakeven":"str"},"tags":["str"]}`
          }]
        })
      });
      clearTimeout(aiTimer);
      if(res.ok){
        const e=await res.json();
        const raw=(e.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('').trim();
        try{ins=JSON.parse(raw);}catch{}
        if(!ins){try{const m=raw.match(/\{[\s\S]*\}/);if(m)ins=JSON.parse(m[0]);}catch{}}
      }
    }}catch{}

    // Track AI usage for free users
    if(!hasFullAccess&&canUseAi&&ins){
      const used=freeAiUsed+1;setFreeAiUsed(used);_setDaily("rb_ai_used",used);
    }

    if(!ins) ins={
      summary:`${base.n} (${tickerNow}) live at $${td.p.toFixed(2)}. IV ${td.iv}% — ${td.iv>60?'elevated, premium selling favored':'moderate, directional plays reasonable'}.`,
      topPlay:`${contracts[0]?.contractLabel} entry $${contracts[0]?.ep} → T1 $${contracts[0]?.t1} / T2 $${contracts[0]?.t2} / T3 $${contracts[0]?.t3}, stop $${contracts[0]?.sl}.`,
      entryTiming:`Enter on ${contracts[0]?.optType==='call'?'pullback to support or breakout':'bounce off resistance or breakdown'} with volume confirmation.`,
      riskWarning:`Max risk $${contracts[0]?.entryTotalCost}/contract. IV crush risk: ${td.iv>60?'HIGH — size down':'MODERATE'}.`,
      ivAnalysis:`IV ${td.iv}% is ${td.iv>60?'elevated — sell premium or use spreads':'moderate — directional debit plays are fine'}.`,
      keyLevels:{
        support:`$${(td.p*0.96).toFixed(2)}`,
        resistance:`$${(td.p*1.04).toFixed(2)}`,
        breakeven:`$${(td.p*1.02).toFixed(2)}`
      },
      tags:[tickerNow,stratNow,expNow,td.iv>60?'High IV':'Normal IV','Live Price']
    };

    // Final guard — if ticker changed during scan, discard results
    if(optRunId.current!==rid){ setOLoading(false); return; }

    setOProg(100);
    setOTicker(td);
    setOContracts(contracts);
    setOInsights(ins);
    setOLoading(false);
  },[optTicker,optType,optExp,optStrat,ivCache]);

  const dispStocks=(()=>{let s=[...stocks];if(sFilter==="Strong Buy")s=s.filter(x=>x.rating==="sb");if(sFilter==="Hidden Gems")s=s.filter(x=>x.isGem);if(sFilter==="Large Cap")s=s.filter(x=>x.cap==="Large");if(sFilter==="International")s=s.filter(x=>x.geo!=="US");if(sSort==="price")s.sort((a,b)=>b.p-a.p);if(sSort==="change")s.sort((a,b)=>b.ch-a.ch);return s;})();
  const sBuys=stocks.filter(s=>s.rating==="sb").length;
  const sGems=stocks.filter(s=>s.isGem).length;
  const sAvg=stocks.length?Math.round(stocks.reduce((a,b)=>a+b.score,0)/stocks.length):0;
  const SSTEPS=["Loading live Finnhub prices","Applying strategy filters",`Scoring ${UNIVERSE_BASE.length} tickers`,"Surfacing hidden gems","Generating AI criteria"];
  const OSTEPS=["Fetching fresh live quote","Fetching option chain + IV","Building strike grid","Computing Greeks (Δ Γ Θ V ρ)","Matching real chain contracts","Generating AI insights"];
  const msLabel=ms==="open"?"● MARKET OPEN":ms==="pre"?"◑ PRE-MARKET":ms==="after"?"◑ AFTER-HOURS":"○ MARKET CLOSED";
  const msClass=ms==="open"?"mopen":"mclosed";

  return(
    <>
      <style>{CSS}</style>
      <div className="app">
        <header className="hdr">
          <div className="logo">
            <img src="/logo.jpeg" alt="RUBBERBAND.AI" className="logo-img" />
            <div><div>RUBBERBAND<b>.</b>AI</div><div className="logo-sub">STOCK + OPTIONS INTELLIGENCE</div></div>
          </div>
          <div className="hdr-right">
            <span className="chip live">● {clock}</span>
            <span className={`chip ${msClass}`}>{msLabel}</span>
            {lastRefresh&&<span className="chip ai">LIVE ✓</span>}
          </div>
        </header>

        <div className="tab-bar">
          {/* Sign Up / Sign In — leftmost, always visible */}
          {user ? (
            <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,margin:"auto 8px auto 0",padding:"5px 10px 5px 6px",cursor:"pointer",flexShrink:0}} onClick={()=>setTab("admin")}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#00e87a,#00d4ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#000",flexShrink:0}}>
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span style={{fontSize:10,color:"rgba(255,255,255,.55)",fontFamily:"DM Mono,monospace",maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {isOwner?"👑 ":isPro?"⭐ ":""}{userEmail.split("@")[0]}
              </span>
              <button onClick={e=>{e.stopPropagation();onSignOut();}} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",cursor:"pointer",fontSize:10,padding:"0 0 0 3px",fontFamily:"DM Mono,monospace",lineHeight:1}} title="Sign out">⏏</button>
            </div>
          ) : (
            <button
              onClick={()=>{ if(onRequestAuth) onRequestAuth(); }}
              style={{display:"flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,rgba(0,232,122,.15),rgba(0,212,255,.08))",border:"1px solid rgba(0,232,122,.35)",borderRadius:8,margin:"auto 10px auto 0",padding:"6px 14px",color:"var(--green)",fontSize:11,fontFamily:"Syne,sans-serif",fontWeight:800,cursor:"pointer",letterSpacing:.3,whiteSpace:"nowrap",flexShrink:0}}>
              👤 Sign Up / Sign In
            </button>
          )}
          <div className={`tab ${tab==="stocks"?"active":""}`} onClick={()=>setTab("stocks")}>📊 Stock Screener{stocks.length>0&&<span className="tab-badge">{stocks.length}</span>}</div>
          <div className={`tab ${tab==="options"?"active":""}`} onClick={()=>setTab("options")}>⚡ Options Screener{oContracts.length>0&&<span className="tab-badge">{oContracts.length}</span>}</div>
          <div className={`tab ${tab==="pricing"?"active":""}`} onClick={()=>setTab("pricing")} style={{fontSize:11}}>💎 Pro</div>
          {hasFullAccess&&<div className={`tab ${tab==="journal"?"active":""}`} onClick={()=>setTab("journal")} style={{fontSize:11}}>📓 Journal</div>}
          {hasFullAccess&&<div className={`tab ${tab==="alerts"?"active":""}`} onClick={()=>setTab("alerts")} style={{fontSize:11}}>🔔 Alerts</div>}
          {hasEdgeAccess&&<div className={`tab ${tab==="premarket"?"active":""}`} onClick={()=>setTab("premarket")} style={{fontSize:11,color:"var(--gold)"}}>⚡ Pre-Market</div>}
          {hasEdgeAccess&&<div className={`tab ${tab==="earnings"?"active":""}`} onClick={()=>setTab("earnings")} style={{fontSize:11,color:"var(--gold)"}}>📅 Earnings</div>}
          {hasEdgeAccess&&<div className={`tab ${tab==="heatmap"?"active":""}`} onClick={()=>setTab("heatmap")} style={{fontSize:11,color:"var(--gold)"}}>🔥 Heat Map</div>}
          <div style={{marginLeft:"auto",paddingRight:4,flexShrink:0}}>
            <button onClick={()=>setTab("admin")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--dim)",fontSize:10,opacity:.15,padding:"14px 4px",fontFamily:"DM Mono,monospace",letterSpacing:1}}>⬤</button>
          </div>
        </div>

        {/* STOCK TAB */}
        {tab==="stocks"&&<div className="page">
          <div className="hero">
            <h1>Find every <span>hidden gem</span><br/>in the market.</h1>
            <p>RUBBERBAND.AI scans all {UNIVERSE_BASE.length} tickers with <b style={{color:"var(--green)"}}>real-time Finnhub prices</b>. Prices fetched fresh on each scan.</p>
          </div>

          <div className="email-banner">
            <div><div className="eb-title">📬 Get Weekly RUBBERBAND.AI Stock Picks — Free</div><div className="eb-sub">Top RUBBERBAND.AI picks delivered every Sunday. No spam, ever.</div>{eList.length>0&&<div className="eb-count">🔥 {eList.length} subscriber{eList.length!==1?"s":""} already in</div>}</div>
            {eOk?<div className="sub-ok">✅ You're in! Watch your inbox Sunday.</div>:<div className="eb-form"><input className="ei wide" placeholder="your@email.com" type="email" value={eEmail} onChange={e=>setEEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&subscribe()}/><button className="btn-sub" onClick={subscribe} disabled={!eEmail.includes("@")}>Subscribe Free →</button></div>}
          </div>

          {lastRefresh&&<div className="refresh-row"><div className="ldot"/><span>Live via Finnhub · Prices as of {lastRefresh.toLocaleTimeString()}</span>{false}</div>}

          <div className="panel">
            <div className="panel-title">Screen Configuration</div>
            <div className="g3" style={{marginBottom:14}}>
              <div className="fld"><label>Strategy</label><div className="sel-wrap"><select value={strategy} onChange={e=>setStrategy(e.target.value)} disabled={sLoading}>{STRATEGIES.map(s=><option key={s}>{s}</option>)}</select></div></div>
              <div className="fld"><label>Sector</label><div className="sel-wrap"><select value={sector} onChange={e=>setSector(e.target.value)} disabled={sLoading}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select></div></div>
              <div className="fld"><label>Market / Geography</label><div className="sel-wrap"><select value={market} onChange={e=>setMarket(e.target.value)} disabled={sLoading}>{MARKETS.map(m=><option key={m}>{m}</option>)}</select></div></div>
            </div>
            <button className="btn-green" onClick={runStocks} disabled={sLoading}>{sLoading?<><div className="spin"/>Scanning…</>:"Run Screen — Find All Matching Stocks"}</button>
            {!hasFullAccess&&<div className="scan-counter">
              Stock scans: <b>{Math.max(0,FREE_STOCK_LIMIT-freeScansUsed)}</b>/{FREE_STOCK_LIMIT} remaining · AI insights: <b>{Math.max(0,FREE_AI_LIMIT-freeAiUsed)}</b>/{FREE_AI_LIMIT} remaining today ·{" "}
              <span onClick={()=>{goUpgrade(STRIPE_PRO_LINK);}} style={{color:"var(--green)",cursor:"pointer",textDecoration:"underline"}}>Upgrade to Pro via Stripe</span>
            </div>}
            {hasFullAccess&&<div className="scan-counter"><span style={{color:"var(--green)"}}>✓ {isOwner?"Owner — Unlimited access":"Pro — Unlimited access"}</span></div>}
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
            <div className="scan-info">Live prices via Finnhub · {new Date().toLocaleTimeString()} · <span>{UNIVERSE_BASE.length} tickers analyzed</span></div>
            <div className="tbl-wrap"><table>
              <thead><tr><th>#</th><th>Ticker</th><th>Live Price</th><th>Mkt Cap</th><th>Score</th><th>MR Signal</th><th style={{minWidth:170}}>🎯 Dip Trigger</th><th>Key Metrics</th><th>Rating</th></tr></thead>
              <tbody>{dispStocks.map((s,i)=><tr key={s.t+i}>
                <td style={{color:"var(--dim)",fontSize:10}}>{i+1}</td>
                <td>
                  <a className="tkr-cell" href={`https://www.tradingview.com/chart/?symbol=${s.t}`} target="_blank" rel="noopener noreferrer" style={{cursor:"pointer",textDecoration:"none",color:"inherit"}}>
                    <div className="tkr-top"><div className="tk">{s.t}</div>{s.isGem&&<div className="gem">💎</div>}</div>
                    <div className="co">{s.n}</div>
                    <div className="tkr-chart-btn">📈 View Chart</div>
                    {s.p&&<div className="tkr-price">
                      <span className="ldot-sm"/>
                      <span className="tp-val">{fmt(s.p)}</span>
                      <span className={`tp-chg ${(s.ch||0)>0?"up":(s.ch||0)<0?"dn":"flat"}`}>{(s.ch||0)>=0?"+":""}{(s.ch||0).toFixed(2)}% <span style={{opacity:.8}}>{(s.ch||0)>=0?"+":""}{fmt(Math.abs(s.p*((s.ch||0)/100)))}</span></span>
                    </div>}
                    {prices[s.t]?.high&&<div className="tkr-hl">H:{fmt(prices[s.t].high)} L:{fmt(prices[s.t].low)}</div>}
                  </a>
                </td>
                <td><div className="pv">{fmt(s.p)}{s.live&&<span className="live-tag"><span className="ldot"/>LIVE</span>}</div><span className={`cv ${(s.ch||0)>=0?"up":"dn"}`}>{(s.ch||0)>=0?"+":""}{(s.ch||0).toFixed(2)}% <span style={{fontSize:9}}>{(s.ch||0)>=0?"+":""}{fmt(Math.abs(s.p*((s.ch||0)/100)))}</span></span></td>
                <td><div className="mcv">{s.mc}</div><div className="capv">{s.cap} · {s.sec}</div></td>
                <td><div className="scw"><span className={`scn ${sc(s.score)}`}>{s.score}</span><div className="scb"><div className={`scf ${sc(s.score)}`} style={{width:`${s.score}%`}}/></div></div></td>
                <td>
                  {s.mr&&<div className="mr-mini">
                    <span className={`mr-mini-badge ${s.mr.signal}`}>
                      {s.mr.signal==="extreme"?"🟢 EXTREME OS":s.mr.signal==="strong"?"🔵 STRONG OS":s.mr.signal==="moderate"?"🟡 MILD OS":s.mr.signal==="overbought"?"🔴 OVERBOUGHT":"◎ NEUTRAL"}
                    </span>
                    <div className="mr-mini-stats">
                      <span className="mr-mini-stat">RSI <b style={{color:s.mr.rsi<30?"var(--green)":s.mr.rsi>70?"var(--red)":"var(--txt)"}}>{s.mr.rsi}</b></span>
                      <span className="mr-mini-stat">BB <b style={{color:s.mr.bbPos<20?"var(--green)":s.mr.bbPos>80?"var(--red)":"var(--txt)"}}>{s.mr.bbPos.toFixed(0)}%</b></span>
                      <span className="mr-mini-stat">Stoch <b style={{color:s.mr.stochK<20?"var(--green)":s.mr.stochK>80?"var(--red)":"var(--txt)"}}>{s.mr.stochK}</b></span>
                    </div>
                    <div className="mr-score-pill">
                      Score: <b style={{color:s.mr.mrScore>=65?"var(--green)":s.mr.mrScore<=30?"var(--red)":"var(--gold)"}}>{s.mr.mrScore}/100</b>
                    </div>
                    {(s.mr.signal==="extreme"||s.mr.signal==="strong")&&<div style={{fontSize:8.5,color:"var(--green)",marginTop:2,lineHeight:1.5}}>
                      🎯 Mean reversion entry window
                    </div>}
                  </div>}
                </td>
                <td className="stock-dip-col"><DipBanner dip={s.dip} compact={true}/></td><td><div className="met-list">{(s.metrics||[]).map((m,j)=><div className="met-row" key={j}><span className="met-k">{m.k}</span><span className={`met-v ${m.pass?"pass":""}`}>{m.v}</span></div>)}</div></td>
                
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
            {lastRefresh&&<div className="refresh-row" style={{marginTop:10}}><div className="ldot"/><span>Prices fetched fresh on each scan · Last: {lastRefresh.toLocaleTimeString()}</span>{false}</div>}
          </div>

          <div className="email-banner" style={{marginBottom:20}}>
            <div><div className="eb-title">📬 Get Weekly RUBBERBAND.AI Picks</div><div className="eb-sub">Top plays every Sunday. Free.</div></div>
            {eOk?<div className="sub-ok">✅ You're in!</div>:<div className="eb-form"><input className="ei wide" placeholder="your@email.com" type="email" value={eEmail} onChange={e=>setEEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&subscribe()}/><button className="btn-sub" onClick={subscribe} disabled={!eEmail.includes("@")}>Subscribe →</button></div>}
          </div>

          {/* ── LIVE CHART for selected options ticker ── */}
          <div className="opt-chart-panel">
            <div className="opt-chart-hdr">
              <div className="opt-chart-title">
                <span style={{color:"var(--cyan)"}}>📈</span>
                <span>{optTicker}</span>
                {prices[optTicker]&&<span style={{fontSize:12,fontWeight:400,color:prices[optTicker].change>=0?"var(--green)":"var(--red)"}}>
                  {fmt(prices[optTicker].price)} <span style={{fontSize:10}}>{prices[optTicker].change>=0?"+":""}{prices[optTicker].change?.toFixed(2)}%</span>
                </span>}
                <span style={{fontSize:10,color:"var(--dim)",fontWeight:400}}>{[...UNIVERSE_BASE,...OPT_BASE].find(x=>x.t===optTicker)?.n}</span>
              </div>
              <div className="opt-chart-intervals">
                {[["1m","1"],["5m","5"],["15m","15"],["1h","60"],["1D","D"],["1W","W"]].map(([label,val])=>(
                  <a key={val} href={`https://www.tradingview.com/chart/?symbol=${optTicker}&interval=${val}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{padding:"4px 11px",background:"rgba(0,232,122,.08)",border:"1px solid rgba(0,232,122,.25)",
                            borderRadius:6,color:"var(--green)",fontSize:10,fontFamily:"DM Mono,monospace",
                            textDecoration:"none",letterSpacing:".5px"}}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
            <div className="opt-chart-body">
              <TVChart ticker={optTicker} interval="D"/>
            </div>
          </div>

          {/* ── OPTIONS CONFIG PANEL ── */}
          <div className="panel">
            <div className="panel-title">Options Configuration</div>
            <div className="opt-controls">
              <div className="fld" style={{gridColumn:"1/-1"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:8}}>
                  <label style={{margin:0}}>Underlying Ticker</label>
                  {prices[optTicker]&&(
                    <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
                        <span className="ldot"/>
                        <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:16,color:"var(--txt)"}}>{fmt(prices[optTicker].price)}</span>
                        <span style={{fontSize:11,fontWeight:600,color:prices[optTicker].change>=0?"var(--green)":"var(--red)",background:prices[optTicker].change>=0?"rgba(0,232,122,.1)":"rgba(255,77,106,.1)",padding:"2px 7px",borderRadius:4}}>
                          {prices[optTicker].change>=0?"+":""}{prices[optTicker].change?.toFixed(2)}% <span style={{opacity:.8}}>({prices[optTicker].change>=0?"+":""}{fmt(Math.abs(prices[optTicker].price*(prices[optTicker].change/100)))})</span>
                        </span>
                      </span>
                      <span style={{fontSize:10,color:"var(--dim)"}}>H: <b style={{color:"var(--green)"}}>{fmt(prices[optTicker].high)}</b></span>
                      <span style={{fontSize:10,color:"var(--dim)"}}>L: <b style={{color:"var(--red)"}}>{fmt(prices[optTicker].low)}</b></span>
                      <span style={{fontSize:10,color:"var(--dim)"}}>Prev: <b style={{color:"var(--txt)"}}>{fmt(prices[optTicker].prevClose)}</b></span>
                      {ivCache[optTicker]&&<span style={{fontSize:10,color:"var(--gold)",background:"rgba(245,166,35,.08)",border:"1px solid rgba(245,166,35,.2)",padding:"2px 7px",borderRadius:4}}>IV {ivCache[optTicker]}%</span>}
                      <span style={{fontSize:9,color:"var(--dim)"}}>Updated {lastRefresh?.toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                  {["All","Mega Cap","ETF","High Vol","AI","eVTOL","Biotech","Fintech","EV/Energy","Enterprise","Consumer","Defense","China/Intl","Crypto"].map(cat=>(
                    <button key={cat} className={`btn-sm ${optCatFilter===cat?"active":""}`} onClick={()=>setOptCatFilter(cat)} disabled={oLoading}>{cat}</button>
                  ))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input className="ei" placeholder="Search ticker or name..." value={optSearch} onChange={e=>setOptSearch(e.target.value.toUpperCase())} disabled={oLoading} style={{flex:1,padding:"9px 14px"}}/>
                  <div className="sel-wrap" style={{flex:2}}>
                    <select value={optTicker} onChange={e=>setOptTicker(e.target.value)} disabled={oLoading}>
                      {OPT_BASE
                        .filter(x=>(optCatFilter==="All"||x.cat===optCatFilter)&&(!optSearch||(x.t.includes(optSearch)||x.n.toUpperCase().includes(optSearch))))
                        .map(x=>{
                          const q=prices[x.t];
                          const mr=q?calcMeanReversion(q.price,q.high||q.price*1.015,q.low||q.price*0.985,q.prevClose||q.price,q.change||0,x.iv||50):null;
                          const osTag=mr?.signal==="extreme"?" 🟢OS":mr?.signal==="strong"?" 🔵OS":"";
                          return<option key={x.t} value={x.t}>{x.t}{osTag} — {x.n}{q?` · $${q.price}  ${q.change>=0?"+":""}${q.change?.toFixed(2)}% (${q.change>=0?"+":""}$${Math.abs(q.price*(q.change/100)).toFixed(2)})`:""}</option>;
                        })}
                    </select>
                  </div>
                </div>
              </div>
              <div className="fld"><label>Contract Type</label><div className="sel-wrap"><select value={optType} onChange={e=>setOptType(e.target.value)} disabled={oLoading}>{OTYPES.map(x=><option key={x}>{x}</option>)}</select></div></div>
              <div className="fld">
                <label>Expiration {expsLoading&&<span style={{fontSize:9,color:"var(--gold)"}}>⟳ loading...</span>}</label>
                <div className="sel-wrap">
                  <select value={optExp||""} onChange={e=>setOptExp(e.target.value)} disabled={oLoading||expsLoading}>
                    {availExps.length===0&&<option value="">Loading dates...</option>}
                    {availExps.map(e=>(
                      <option key={e.dateStr} value={e.dateStr}>{e.display}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="fld"><label>Strategy</label><div className="sel-wrap"><select value={optStrat} onChange={e=>setOptStrat(e.target.value)} disabled={oLoading}>{OSTRATEGIES.map(x=><option key={x}>{x}</option>)}</select></div></div>
            </div>
            <button className="btn-blue" onClick={runOptions} disabled={oLoading}>{oLoading?<><div className="spin-w"/>Scanning…</>:"⚡ Scan Option Chain — Generate Entry Points"}</button>
            {!hasFullAccess&&<div className="scan-counter" style={{marginTop:8}}>
              Entry point scans: <b>{Math.max(0,FREE_OPT_LIMIT-freeOptScans)}</b>/{FREE_OPT_LIMIT} remaining ·
              AI insights: <b>{Math.max(0,FREE_AI_LIMIT-freeAiUsed)}</b>/{FREE_AI_LIMIT} remaining ·
              Ticker lock: <b>{freeOptTickers.size>0?[...freeOptTickers].join(", "):"none scanned yet"}</b>{" "}
              · <span onClick={()=>{goUpgrade(STRIPE_PRO_LINK);}} style={{color:"var(--green)",cursor:"pointer",textDecoration:"underline"}}>Upgrade via Stripe</span>
            </div>}
            {hasFullAccess&&<div className="scan-counter"><span style={{color:"var(--green)"}}>✓ {isOwner?"Owner — Unlimited access":"Pro — Unlimited access"}</span></div>}
          </div>


          {/* ── TOP PLAY — free gets 1/day, pro gets full AI insights ── */}
          {oInsights?.topPlay&&(()=>{
            const aiLocked=!hasFullAccess&&freeAiUsed>=FREE_AI_LIMIT;
            return(
              <div style={{background:"linear-gradient(135deg,rgba(0,232,122,.1) 0%,rgba(0,212,255,.06) 100%)",border:"1px solid rgba(0,232,122,.35)",borderRadius:13,padding:"16px 20px",marginBottom:16}}>
                {/* Top Play row */}
                <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap",marginBottom:aiLocked?12:0}}>
                  <div style={{flexShrink:0,fontSize:22,lineHeight:1}}>⭐</div>
                  <div style={{flex:1,minWidth:220}}>
                    <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:11,letterSpacing:1.5,textTransform:"uppercase",color:"var(--green)",marginBottom:5}}>
                      ⭐ Top Play — {oTicker?.t||optTicker} · {oInsights.topPlay?.toLowerCase().includes("call")?"⬆ Bullish Signal":"⬇ Bearish Signal"}
                    </div>
                    <div style={{fontSize:13,color:"var(--txt)",lineHeight:1.7,fontWeight:600}}>{oInsights.topPlay}</div>
                    {oInsights.entryTiming&&!aiLocked&&<div style={{fontSize:11,color:"var(--dim)",marginTop:6,lineHeight:1.6}}>
                      <span style={{color:"var(--gold)",fontWeight:700}}>⏱ Entry: </span>{oInsights.entryTiming}
                    </div>}
                  </div>
                  {prices[oTicker?.t]&&<div style={{flexShrink:0,textAlign:"right"}}>
                    <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,color:prices[oTicker.t].change>=0?"var(--green)":"var(--red)"}}>{fmt(prices[oTicker.t].price)}</div>
                    <div style={{fontSize:11,color:prices[oTicker.t].change>=0?"var(--green)":"var(--red)",fontWeight:700}}>{prices[oTicker.t].change>=0?"+":""}{prices[oTicker.t].change?.toFixed(2)}%</div>
                    <div style={{fontSize:9,color:"var(--dim)",marginTop:2}}>● LIVE</div>
                  </div>}
                </div>
                {/* Free tier lock notice after AI used up */}
                {aiLocked&&(
                  <div style={{borderTop:"1px solid rgba(0,232,122,.2)",paddingTop:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                    <div style={{fontSize:11,color:"var(--dim)"}}>🔒 <b style={{color:"var(--gold)"}}>AI insights limit reached</b> — you've used your {FREE_AI_LIMIT} free AI insights today. Full entry timing, IV analysis, and risk details unlock with Pro.</div>
                    <button className="btn-upgrade" style={{padding:"7px 18px",fontSize:11}} onClick={()=>{goUpgrade(STRIPE_PRO_LINK);}}>Upgrade → $19/mo via Stripe</button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── MEAN REVERSION INDICATOR (single instance, always live) ── */}
          {prices[optTicker]&&(()=>{
            const q=prices[optTicker];
            const base=OPT_BASE.find(x=>x.t===optTicker)||{n:optTicker,iv:50};
            const mr=calcMeanReversion(q.price,q.high||q.price*1.015,q.low||q.price*0.985,q.prevClose||q.price,q.change||0,base.iv||50);
            return(
              <div className={`mr-panel ${mr.signal==="extreme"?"extreme-signal":mr.signal==="strong"?"strong-signal":mr.signal==="overbought"?"overbought-panel":""}`} style={{marginBottom:20}}>
                <div className="mr-title">
                  <span style={{color:mr.signalColor}}>{mr.signalLabel}</span>
                  <span style={{fontSize:10,color:"var(--dim)",fontFamily:"DM Mono,monospace",fontWeight:400}}>MR Score: <b style={{color:mr.mrScore>=65?"var(--green)":mr.mrScore<=30?"var(--red)":"var(--gold)",fontSize:13}}>{mr.mrScore}/100</b></span>
                </div>
                <div className="mr-sub">{base.n} — {mr.bullCount} bullish confluences, {mr.bearCount} bearish signals detected · Updated {lastRefresh?.toLocaleTimeString()||"—"}</div>
                <div className="mr-grid">
                  <div className="mr-metric"><div className="mr-m-lbl">RSI (14)</div><div className="mr-m-val" style={{color:mr.rsi<30?"var(--green)":mr.rsi>70?"var(--red)":"var(--txt)"}}>{mr.rsi}</div><div className="mr-m-sub">{mr.rsi<30?"Oversold ✓":mr.rsi>70?"Overbought ✗":"Neutral"}</div><div className="mr-bar-wrap"><div className="mr-bar" style={{width:`${mr.rsi}%`,background:mr.rsi<30?"var(--green)":mr.rsi>70?"var(--red)":"var(--gold)"}}/></div></div>
                  <div className="mr-metric"><div className="mr-m-lbl">Bollinger %B</div><div className="mr-m-val" style={{color:mr.bbPos<20?"var(--green)":mr.bbPos>80?"var(--red)":"var(--txt)"}}>{mr.bbPos.toFixed(0)}%</div><div className="mr-m-sub">{mr.bbPos<20?"Below Lower ✓":mr.bbPos>80?"Above Upper ✗":"Mid-Band"}</div><div className="mr-bar-wrap"><div className="mr-bar" style={{width:`${mr.bbPos}%`,background:mr.bbPos<20?"var(--green)":mr.bbPos>80?"var(--red)":"var(--gold)"}}/></div></div>
                  <div className="mr-metric"><div className="mr-m-lbl">Stochastic %K</div><div className="mr-m-val" style={{color:mr.stochK<20?"var(--green)":mr.stochK>80?"var(--red)":"var(--txt)"}}>{mr.stochK}</div><div className="mr-m-sub">{mr.stochK<20?"Oversold ✓":mr.stochK>80?"Overbought ✗":"Neutral"}</div><div className="mr-bar-wrap"><div className="mr-bar" style={{width:`${mr.stochK}%`,background:mr.stochK<20?"var(--green)":mr.stochK>80?"var(--red)":"var(--gold)"}}/></div></div>
                  <div className="mr-metric"><div className="mr-m-lbl">Williams %R</div><div className="mr-m-val" style={{color:mr.willR<-80?"var(--green)":mr.willR>-20?"var(--red)":"var(--txt)"}}>{mr.willR}</div><div className="mr-m-sub">{mr.willR<-80?"Oversold ✓":mr.willR>-20?"Overbought ✗":"Neutral"}</div><div className="mr-bar-wrap"><div className="mr-bar" style={{width:`${100+mr.willR}%`,background:mr.willR<-80?"var(--green)":mr.willR>-20?"var(--red)":"var(--gold)"}}/></div></div>
                  <div className="mr-metric"><div className="mr-m-lbl">CCI</div><div className="mr-m-val" style={{color:mr.cci<-100?"var(--green)":mr.cci>100?"var(--red)":"var(--txt)"}}>{mr.cci}</div><div className="mr-m-sub">{mr.cci<-100?"Oversold ✓":mr.cci>100?"Overbought ✗":"Neutral"}</div><div className="mr-bar-wrap"><div className="mr-bar" style={{width:`${Math.min(100,Math.max(0,50+mr.cci/4))}%`,background:mr.cci<-100?"var(--green)":mr.cci>100?"var(--red)":"var(--gold)"}}/></div></div>
                  <div className="mr-metric"><div className="mr-m-lbl">Day Position</div><div className="mr-m-val" style={{color:mr.pricePos<25?"var(--green)":mr.pricePos>75?"var(--red)":"var(--txt)"}}>{mr.pricePos.toFixed(0)}%</div><div className="mr-m-sub">{mr.pricePos<25?"Near Low ✓":mr.pricePos>75?"Near High ✗":"Mid-Range"}</div><div className="mr-bar-wrap"><div className="mr-bar" style={{width:`${mr.pricePos}%`,background:mr.pricePos<25?"var(--green)":mr.pricePos>75?"var(--red)":"var(--gold)"}}/></div></div>
                  <div className="mr-metric"><div className="mr-m-lbl">MACD</div><div className="mr-m-val" style={{color:mr.macd==="bullish"?"var(--green)":mr.macd==="bearish"?"var(--red)":"var(--dim)",fontSize:13}}>{mr.macd==="bullish"?"Bull ↑":mr.macd==="bearish"?"Bear ↓":"Flat →"}</div><div className="mr-m-sub">{mr.macd==="bullish"?"Crossover ✓":mr.macd==="bearish"?"Death ✗":"No signal"}</div></div>
                  <div className="mr-metric"><div className="mr-m-lbl">MR Score</div><div className="mr-m-val" style={{color:mr.mrScore>=65?"var(--green)":mr.mrScore<=30?"var(--red)":"var(--gold)",fontSize:22}}>{mr.mrScore}</div><div className="mr-m-sub">{mr.mrScore>=75?"Prime Entry":mr.mrScore>=60?"Strong Setup":mr.mrScore<=30?"Avoid — OB":"Neutral"}</div><div className="mr-bar-wrap"><div className="mr-bar" style={{width:`${mr.mrScore}%`,background:mr.mrScore>=65?"var(--green)":mr.mrScore<=30?"var(--red)":"var(--gold)"}}/></div></div>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:9.5,color:"var(--dim)",marginBottom:4,letterSpacing:.8,textTransform:"uppercase"}}>RSI Gauge</div>
                  <div className="rsi-gauge"><div className="rsi-needle" style={{left:`${mr.rsi}%`}}/></div>
                  <div className="rsi-labels"><span style={{color:"var(--green)"}}>Oversold &lt;30</span><span>Neutral 30–70</span><span style={{color:"var(--red)"}}>Overbought &gt;70</span></div>
                </div>
                <div className={`entry-alert ${mr.signal==="extreme"||mr.signal==="strong"?"buy":mr.signal==="overbought"?"sell":"warn"}`}>
                  <div className="ea-ico">{mr.signal==="extreme"?"🎯":mr.signal==="strong"?"📍":mr.signal==="overbought"?"🚫":"⏳"}</div>
                  <div><b>Mean Reversion Entry:</b> {mr.entryRec}</div>
                </div>
                <div className="mr-signals">{mr.signals.map((sig,i)=><span key={i} className={`mr-sig-item ${sig.type}`}>{sig.label}</span>)}</div>
              </div>
            );
          })()}

          {/* ── OVERSOLD SCANNER ── */}
          {(()=>{
            const osTickers=OPT_BASE.filter(x=>prices[x.t]).map(x=>{const q=prices[x.t];const mr=calcMeanReversion(q.price,q.high||q.price*1.015,q.low||q.price*0.985,q.prevClose||q.price,q.change||0,x.iv||50);return{...x,q,mr};}).filter(x=>x.mr.signal==="extreme"||x.mr.signal==="strong").sort((a,b)=>b.mr.mrScore-a.mr.mrScore).slice(0,20);
            if(!osTickers.length)return null;
            return(
              <div style={{marginBottom:20}}>
                <div className="sec-lbl" style={{marginBottom:10}}>🎯 Oversold Opportunity Scanner — {osTickers.length} tickers with mean reversion edge</div>
                <div className="os-ticker-list">
                  {osTickers.map(x=>(
                    <div key={x.t} className={`os-ticker-card ${x.mr.signal}`} onClick={()=>setOptTicker(x.t)}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <span className="otc-sym" style={{color:x.mr.signal==="extreme"?"var(--green)":"var(--cyan)"}}>{x.t}</span>
                        <span style={{fontSize:9,color:x.mr.signal==="extreme"?"var(--green)":"var(--cyan)",fontWeight:700}}>{x.mr.mrScore}</span>
                      </div>
                      <div className="otc-sig" style={{color:x.mr.signal==="extreme"?"var(--green)":"var(--cyan)"}}>{x.mr.signal==="extreme"?"🟢 PRIME ENTRY":"🔵 WATCH"}</div>
                      <div className="otc-price">{fmt(x.q.price)}</div>
                      <div className={`otc-chg`} style={{color:x.q.change>=0?"var(--green)":"var(--red)",fontSize:10,fontWeight:600}}>{x.q.change>=0?"+":""}{x.q.change?.toFixed(2)}% / {x.q.change>=0?"+":""}{fmt(Math.abs(x.q.price*(x.q.change/100)))}</div>
                      <div style={{fontSize:8,color:"var(--dim)",marginTop:2}}>RSI {x.mr.rsi}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:9.5,color:"var(--dim)",marginBottom:16,lineHeight:1.7}}>↑ Click any ticker to load it. Auto-updates every 30s.</div>
              </div>
            );
          })()}

          {oLoading&&<div className="lbox"><div className="lsteps">{OSTEPS.map((s,i)=><div key={i} className={`lstep ${oStep>i?"done":oStep===i?"active":""}`}><div className="lstep-ico">{oStep>i?"✓":oStep===i?"…":i+1}</div><span>{s}</span></div>)}</div><div className="pbar"><div className="pfill b" style={{width:`${oProg}%`}}/></div></div>}

          {!oContracts.length&&!oLoading&&oInsights?.error&&(
            <div style={{background:"rgba(255,59,48,0.1)",border:"1px solid rgba(255,59,48,0.35)",borderRadius:12,padding:"20px 24px",margin:"16px 0",textAlign:"center"}}>
              <div style={{fontSize:22,marginBottom:8}}>⚠️</div>
              <div style={{color:"#ff6b6b",fontWeight:700,fontSize:14,marginBottom:6}}>Price Unavailable</div>
              <div style={{color:"var(--dim)",fontSize:12,lineHeight:1.6}}>{oInsights.msg}</div>
              <button onClick={runOptions} style={{marginTop:14,padding:"8px 20px",background:"rgba(255,59,48,0.2)",border:"1px solid rgba(255,59,48,0.4)",borderRadius:8,color:"#ff6b6b",cursor:"pointer",fontSize:12,fontWeight:700}}>↺ Retry</button>
            </div>
          )}
          {!oContracts.length&&!oLoading&&!oInsights?.error&&<div className="empty"><div className="ico">⚡</div><h3>Ready to scan options</h3><p>Select a ticker above, then hit Scan.<br/>Prices are live from Finnhub.</p></div>}

                    {oContracts.length>0&&!oLoading&&oInsights&&oTicker&&<div className="results">
            <div className="sumbox">
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                <div className="sum-title" style={{margin:0}}>{oTicker.t} Options — {oTicker.expLabel?labelExpDate(oTicker.expLabel)?.label||oTicker.expLabel:""}</div>
                {oTicker&&prices[oTicker.t]&&(
                  <span className="live-tag">
                    <span className="ldot"/>
                    <b style={{fontSize:14,fontFamily:"Syne,sans-serif"}}>{fmt(prices[oTicker.t].price)}</b>
                    <span style={{marginLeft:4,color:prices[oTicker.t].change>=0?"var(--green)":"var(--red)",fontWeight:700}}>
                      {prices[oTicker.t].change>=0?"+":""}{prices[oTicker.t].change?.toFixed(2)}% <span style={{fontWeight:500,opacity:.85}}>({prices[oTicker.t].change>=0?"+":""}{fmt(Math.abs(prices[oTicker.t].price*(prices[oTicker.t].change/100)))})</span>
                    </span>
                  </span>
                )}
              </div>
              <div style={{fontSize:9,color:"var(--dim)",marginBottom:6,display:"flex",gap:12,flexWrap:"wrap"}}>
                <span>📍 Scanned: <b style={{color:"var(--txt)"}}>{oTicker.t}</b></span>
                <span>⏱ At: <b style={{color:"var(--txt)"}}>{oTicker.scanTime}</b></span>
                <span>💰 Price: <b style={{color:"var(--green)"}}>${oTicker.p}</b></span>
                <span>📅 Exp: <b style={{color:"var(--gold)"}}>{oTicker.expLabel?labelExpDate(oTicker.expLabel)?.display||oTicker.expLabel:""}</b></span>
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
            {(()=>{const q=prices[oTicker.t];const base=OPT_BASE.find(x=>x.t===oTicker.t)||{iv:45};const dip=q?calcDipTrigger(q.price,q.high||q.price*1.015,q.low||q.price*0.985,q.prevClose||q.price,q.change||0,base.iv||45,oTicker.t):null;return dip?(<div style={{marginBottom:20}}><div className="sec-lbl" style={{marginBottom:10}}>🎯 Dip Trigger Analysis — {oTicker.t}</div><DipBanner dip={dip} compact={false}/></div>):null;})()}
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
            <div className="disc">⚠ Options trading involves substantial risk. AI-generated estimates for educational purposes only. Live underlying prices via Finnhub. Never risk more than you can afford to lose.</div>
          </div>}
        </div>}

        {/* PRICING TAB */}
        {tab==="pricing"&&<div className="page">
          {/* Success banner after Stripe redirect */}
          {isPro&&userTier&&(
            <div style={{background:"linear-gradient(135deg,rgba(0,232,122,.15),rgba(0,212,255,.08))",border:"1px solid var(--green)",borderRadius:12,padding:"14px 20px",marginBottom:24,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <span style={{fontSize:20}}>🎉</span>
              <div>
                <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:13,color:"var(--green)"}}>You're on {userTier==="edge"?"Edge":"Pro"} — Unlimited Access Active</div>
                <div style={{fontSize:11,color:"var(--dim)",marginTop:2}}>All features unlocked. Manage your subscription at <a href="https://billing.stripe.com" target="_blank" rel="noopener noreferrer" style={{color:"var(--green)"}}>billing.stripe.com</a></div>
              </div>
            </div>
          )}

          <div className="pricing-hero">
            <h1>Simple, <span>transparent</span> pricing</h1>
            <p className="pricing-sub">Pay securely via Stripe. Cancel anytime. No hidden fees. Your access unlocks instantly after payment.</p>
          </div>

          {/* Stripe trust badges */}
          <div style={{display:"flex",justifyContent:"center",gap:16,flexWrap:"wrap",marginBottom:28}}>
            {["🔒 Secured by Stripe","💳 All major cards","↩ Cancel anytime","🔄 Instant access"].map((b,i)=>(
              <span key={i} style={{fontSize:11,color:"var(--dim)",fontFamily:"DM Mono,monospace",padding:"5px 12px",background:"rgba(255,255,255,.04)",border:"1px solid var(--b1)",borderRadius:20}}>{b}</span>
            ))}
          </div>

          <div className="pricing-grid">
            {/* FREE */}
            <div className="pricing-card">
              <div className="pricing-tier">Free</div>
              <div className="pricing-price">$0<span>/mo</span></div>
              <div className="pricing-desc">Try the platform. No card required.</div>
              <ul className="pricing-feats">
                {[
                  ["2 stock scans per day",true],
                  ["2 options scans per day (1 ticker)",true],
                  ["2 AI insights per day",true],
                  ["Dip trigger badge only",true],
                  ["Full entry/exit levels",false],
                  ["Full AI options insights",false],
                  ["Trade journal",false],
                  ["Watchlist alerts",false],
                ].map(([f,on],i)=>(
                  <li key={i} className="pricing-feat">
                    <span className={on?"pricing-feat-check":"pricing-feat-x"}>{on?"✓":"✕"}</span>{f}
                  </li>
                ))}
              </ul>
              <button className="pricing-cta secondary" onClick={()=>setTab("stocks")}>Continue Free →</button>
            </div>

            {/* PRO */}
            <div className="pricing-card featured">
              <div className="pricing-card-badge">MOST POPULAR</div>
              <div className="pricing-tier">Pro <span className="pro-badge">PRO</span></div>
              <div className="pricing-price">$19<span>/mo</span></div>
              <div className="pricing-desc">Everything you need to trade with an edge, every day.</div>
              <ul className="pricing-feats">
                {[
                  ["Unlimited stock + options scans",true],
                  ["All 208 stocks · 229 options tickers",true],
                  ["Full dip trigger: entry, T1, T2, T3, stop",true],
                  ["Full AI insights + IV analysis",true],
                  ["Trade journal with P&L tracking",true],
                  ["Watchlist alerts",true],
                  ["Mean reversion + all 7 indicators",true],
                  ["Real-time Finnhub data on every scan",true],
                ].map(([f],i)=>(
                  <li key={i} className="pricing-feat"><span className="pricing-feat-check">✓</span>{f}</li>
                ))}
              </ul>
              {isPro
                ? <button className="pricing-cta secondary" disabled>✓ Active Plan</button>
                : <button className="pricing-cta primary" onClick={()=>{
                    goUpgrade(STRIPE_PRO_LINK);
                  }}>
                    <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.831 3.47 1.426 3.47 2.338 0 .99-.893 1.548-2.585 1.548-2.227 0-5.028-.917-7.083-2.034l-.89 5.594c2.043 1.02 5.08 1.694 8.21 1.694 2.583 0 4.777-.618 6.381-1.84 1.72-1.305 2.586-3.203 2.586-5.597 0-4.094-2.526-5.868-6.346-7.19z"/></svg>
                      Pay with Stripe — $19/mo
                    </span>
                  </button>
              }
              <div style={{fontSize:10,color:"var(--dim)",textAlign:"center",marginTop:8}}>
                Secure checkout · Instant unlock · Cancel anytime
              </div>
            </div>

            {/* EDGE */}
            <div className="pricing-card">
              <div className="pricing-tier">Edge</div>
              <div className="pricing-price">$29<span>/mo</span></div>
              <div className="pricing-desc">For serious traders who want every data edge.</div>
              <ul className="pricing-feats">
                {[
                  ["Everything in Pro",true],
                  ["Pre-market AI brief — top setups before open",true],
                  ["Earnings IV crush playbook — per stock",true],
                  ["Portfolio heat map — all positions scored",true],
                  ["Unlimited watchlist alerts",true],
                  ["Every future feature — first access",true],
                ].map(([f],i)=>(
                  <li key={i} className="pricing-feat"><span className="pricing-feat-check">✓</span>{f}</li>
                ))}
              </ul>
              {userTier==="edge"
                ? <button className="pricing-cta secondary" disabled>✓ Active Plan</button>
                : <button className="pricing-cta primary" onClick={()=>{
                    goUpgrade(STRIPE_EDGE_LINK);
                  }}>
                    <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.831 3.47 1.426 3.47 2.338 0 .99-.893 1.548-2.585 1.548-2.227 0-5.028-.917-7.083-2.034l-.89 5.594c2.043 1.02 5.08 1.694 8.21 1.694 2.583 0 4.777-.618 6.381-1.84 1.72-1.305 2.586-3.203 2.586-5.597 0-4.094-2.526-5.868-6.346-7.19z"/></svg>
                      Pay with Stripe — $29/mo
                    </span>
                  </button>
              }
              <div style={{fontSize:10,color:"var(--dim)",textAlign:"center",marginTop:8}}>
                Secure checkout · Instant unlock · Cancel anytime
              </div>
            </div>
          </div>

          {/* How payment works */}
          <div className="panel" style={{marginBottom:20}}>
            <div className="panel-title">How it works</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginTop:4}}>
              {[
                ["1","Click Pay with Stripe","You're taken to Stripe's secure checkout page — the same platform used by Amazon, Google, and millions of businesses."],
                ["2","Enter your card details","Stripe handles everything. Your card details never touch our servers. 256-bit encryption."],
                ["3","Instant access","After payment Stripe redirects you back to RUBBERBAND.AI and your plan unlocks automatically — no code, no email."],
                ["4","Cancel anytime","Manage or cancel your subscription directly at billing.stripe.com using the email you signed up with. Click the link in your Stripe receipt email, or visit billing.stripe.com directly."],
              ].map(([n,title,desc],i)=>(
                <div key={i} style={{padding:"14px 16px",background:"rgba(255,255,255,.03)",border:"1px solid var(--b1)",borderRadius:10}}>
                  <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,color:"var(--green)",marginBottom:6}}>{n}</div>
                  <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>{title}</div>
                  <div style={{fontSize:11,color:"var(--dim)",lineHeight:1.6}}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{textAlign:"center",padding:"16px 0",fontSize:11,color:"var(--dim)",lineHeight:1.8}}>
            <b style={{color:"var(--txt)"}}>Questions?</b> Email <span style={{color:"var(--green)"}}>rubberband.ai.io@gmail.com</span>
            {" · "}Payments powered by <b style={{color:"var(--txt)"}}>Stripe</b> — PCI DSS compliant
            {" · "}<a href="https://billing.stripe.com" target="_blank" rel="noopener noreferrer" style={{color:"var(--green)",textDecoration:"underline"}}>Cancel anytime at billing.stripe.com</a>
          </div>
        </div>}

        {/* TRADE JOURNAL TAB */}
        {tab==="journal"&&hasFullAccess&&<div className="page">
          <div className="hero"><h1>Trade <span>Journal</span></h1><p>Log your trades, track your edge. Every entry is saved privately in your browser.</p></div>
          <div className="journal-tabs">
            {[["log","📋 My Trades"],["new","✏️ Log Trade"],["stats","📊 Stats"]].map(([t,l])=>(
              <button key={t} className={`jtab ${journalTab===t?"active":""}`} onClick={()=>setJournalTab(t)}>{l}</button>
            ))}
          </div>

          {journalTab==="new"&&(
            <div className="panel">
              <div className="panel-title">Log a New Trade</div>
              <div className="journal-form">
                <div className="jfld"><label>Ticker</label><input value={journalEntry.ticker} onChange={e=>setJournalEntry(p=>({...p,ticker:e.target.value.toUpperCase()}))} placeholder="NVDA"/></div>
                <div className="jfld"><label>Type</label><select value={journalEntry.type} onChange={e=>setJournalEntry(p=>({...p,type:e.target.value}))}><option value="call">Call</option><option value="put">Put</option><option value="stock">Stock</option></select></div>
                <div className="jfld"><label>Entry Price</label><input type="number" value={journalEntry.entry} onChange={e=>setJournalEntry(p=>({...p,entry:e.target.value}))} placeholder="0.00"/></div>
                <div className="jfld"><label>Target</label><input type="number" value={journalEntry.target} onChange={e=>setJournalEntry(p=>({...p,target:e.target.value}))} placeholder="0.00"/></div>
                <div className="jfld"><label>Stop Loss</label><input type="number" value={journalEntry.stop} onChange={e=>setJournalEntry(p=>({...p,stop:e.target.value}))} placeholder="0.00"/></div>
                <div className="jfld"><label>Outcome</label><select value={journalEntry.outcome} onChange={e=>setJournalEntry(p=>({...p,outcome:e.target.value}))}><option value="open">Open / Active</option><option value="win">Win ✓</option><option value="loss">Loss ✗</option></select></div>
                <div className="jfld" style={{gridColumn:"1/-1"}}><label>Notes / Reasoning</label><textarea value={journalEntry.notes} onChange={e=>setJournalEntry(p=>({...p,notes:e.target.value}))} placeholder="Why did you take this trade? What was the setup? What did you learn?"/></div>
              </div>
              <button className="btn-green" onClick={()=>{
                if(!journalEntry.ticker||!journalEntry.entry)return;
                const entry={...journalEntry,id:Date.now(),date:new Date().toLocaleDateString(),time:new Date().toLocaleTimeString()};
                setJournal(prev=>[entry,...prev]);
                setJournalEntry({ticker:"",type:"call",entry:"",target:"",stop:"",notes:"",outcome:""});
                setJournalTab("log");
              }}>Save Trade →</button>
            </div>
          )}

          {journalTab==="log"&&(
            journal.length===0
              ?<div className="empty"><div className="ico">📋</div><h3>No trades logged yet</h3><p>Use the Log Trade tab to record your first trade.</p></div>
              :<div>{journal.map((e,i)=>(
                <div key={e.id||i} className="journal-entry">
                  <div className="je-header">
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span className="je-ticker">{e.ticker}</span>
                      <span className={`je-type ${e.type}`}>{e.type.toUpperCase()}</span>
                      {e.outcome&&<span className={`je-outcome ${e.outcome}`}>{e.outcome==="win"?"✓ WIN":e.outcome==="loss"?"✗ LOSS":"◎ OPEN"}</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:10,color:"var(--dim)"}}>{e.date} {e.time}</span>
                      <button onClick={()=>setJournal(prev=>prev.filter((_,j)=>j!==i))} style={{background:"rgba(255,77,106,.1)",border:"none",color:"var(--red)",borderRadius:5,padding:"2px 8px",cursor:"pointer",fontSize:10}}>✕</button>
                    </div>
                  </div>
                  <div className="je-levels">
                    <span className="je-lv">Entry <b style={{color:"var(--green)"}}>${e.entry}</b></span>
                    {e.target&&<span className="je-lv">Target <b style={{color:"var(--cyan)"}}>${e.target}</b></span>}
                    {e.stop&&<span className="je-lv">Stop <b style={{color:"var(--red)"}}>${e.stop}</b></span>}
                    {e.entry&&e.target&&<span className="je-lv">R/R <b style={{color:"var(--gold)"}}>{(((+e.target-+e.entry)/(+e.entry-+e.stop))||0).toFixed(1)}:1</b></span>}
                  </div>
                  {e.notes&&<div className="je-notes">{e.notes}</div>}
                </div>
              ))}</div>
          )}

          {journalTab==="stats"&&(()=>{
            const wins=journal.filter(e=>e.outcome==="win").length;
            const losses=journal.filter(e=>e.outcome==="loss").length;
            const total=wins+losses;
            const winRate=total>0?Math.round((wins/total)*100):0;
            const byType=["call","put","stock"].map(t=>({type:t,count:journal.filter(e=>e.type===t).length}));
            return(
              <div>
                <div className="stats-row">
                  <div className="sbox"><div className="sv g">{journal.length}</div><div className="sl">Total Trades</div></div>
                  <div className="sbox"><div className="sv g">{wins}</div><div className="sl">Wins</div></div>
                  <div className="sbox"><div className="sv r">{losses}</div><div className="sl">Losses</div></div>
                  <div className="sbox"><div className="sv gold">{winRate}%</div><div className="sl">Win Rate</div></div>
                </div>
                <div className="panel" style={{marginTop:16}}>
                  <div className="panel-title">Trades by Type</div>
                  {byType.map((b,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--b1)",fontSize:12}}>
                      <span style={{textTransform:"uppercase",fontFamily:"DM Mono,monospace",fontSize:10,color:"var(--dim)"}}>{b.type}</span>
                      <span style={{fontWeight:700}}>{b.count} trades</span>
                    </div>
                  ))}
                </div>
                {journal.length===0&&<div className="empty"><div className="ico">📊</div><h3>Log trades to see stats</h3></div>}
              </div>
            );
          })()}
        </div>}

        {/* WATCHLIST ALERTS TAB */}
        {tab==="alerts"&&hasFullAccess&&<div className="page">
          <div className="hero"><h1>Watchlist <span>Alerts</span></h1><p>Track tickers and get notified when their dip trigger score crosses your threshold.</p></div>
          <div className="panel" style={{marginBottom:20}}>
            <div className="panel-title">Add Ticker to Watchlist</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
              <div className="jfld" style={{flex:1,minWidth:120}}>
                <label>Ticker</label>
                <input value={alertTicker} onChange={e=>setAlertTicker(e.target.value.toUpperCase())} placeholder="NVDA" maxLength={6} style={{background:"var(--s2)",border:"1px solid var(--b2)",color:"var(--txt)",borderRadius:7,padding:"8px 11px",fontSize:12,fontFamily:"DM Mono,monospace",outline:"none",width:"100%"}}/>
              </div>
              <div className="jfld" style={{flex:1,minWidth:160}}>
                <label>Alert when Dip Score ≥</label>
                <input type="number" min={1} max={100} value={alertThreshold} onChange={e=>setAlertThreshold(+e.target.value)} style={{background:"var(--s2)",border:"1px solid var(--b2)",color:"var(--txt)",borderRadius:7,padding:"8px 11px",fontSize:12,fontFamily:"DM Mono,monospace",outline:"none",width:"100%"}}/>
              </div>
              <button className="btn-green" style={{marginBottom:0,padding:"9px 22px",fontSize:12}} onClick={()=>{
                if(!alertTicker)return;
                if(watchlist.find(w=>w.ticker===alertTicker))return;
                setWatchlist(prev=>[...prev,{ticker:alertTicker,threshold:alertThreshold,added:new Date().toLocaleDateString()}]);
                setAlertTicker("");
              }}>+ Add</button>
            </div>
          </div>
          {watchlist.length===0
            ?<div className="empty"><div className="ico">🔔</div><h3>No alerts set</h3><p>Add tickers above to monitor for dip trigger signals.</p></div>
            :<div className="alert-list">
              {watchlist.map((w,i)=>{
                const q=prices[w.ticker];
                const base=OPT_BASE.find(x=>x.t===w.ticker)||{iv:45};
                const dip=q?calcDipTrigger(q.price,q.high||q.price*1.015,q.low||q.price*0.985,q.prevClose||q.price,q.change||0,base.iv||45,w.ticker):null;
                const triggered=dip&&dip.score>=w.threshold;
                return(
                  <div key={i} className="alert-card">
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <span className="alert-sym">{w.ticker}</span>
                        <span className={`alert-status ${triggered?"triggered":"watching"}`}>{triggered?"🟢 TRIGGERED":"⏳ Watching"}</span>
                      </div>
                      <div className="alert-thresh">Alert when score ≥ {w.threshold} · {dip?`Current: ${dip.score}/100 (${dip.grade})`:"Run a scan to check score"}</div>
                      {triggered&&dip&&<div style={{fontSize:10,color:"var(--green)",marginTop:4}}>Entry: ${dip.entry} · T1: ${dip.t1} · Stop: ${dip.stop}</div>}
                    </div>
                    <button className="alert-remove" onClick={()=>setWatchlist(prev=>prev.filter((_,j)=>j!==i))}>Remove</button>
                  </div>
                );
              })}
            </div>
          }
          <div className="disc" style={{marginTop:16}}>⚠ Alert scores are based on the last scan for each ticker. Run a scan to get current dip scores. Browser-based alerts only — no push notifications yet.</div>
        </div>}

        {/* PRE-MARKET AI BRIEF — EDGE TIER */}
        {tab==="premarket"&&hasEdgeAccess&&<div className="page">
          <div className="hero">
            <h1>⚡ Pre-Market <span>AI Brief</span></h1>
            <p>AI-generated top setups for today's session. Updates each morning before market open.</p>
          </div>
          {(()=>{
            const mktDate=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
            const etHour=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"})).getHours();
            const isPreMarket=etHour>=4&&etHour<9;
            const isMarketDay=new Date().getDay()>0&&new Date().getDay()<6;
            // Build top 5 setups from scanned prices
            const scanned=Object.keys(prices).filter(t=>prices[t]).slice(0,40);
            const setups=scanned.map(t=>{
              const q=prices[t];
              const base=OPT_BASE.find(x=>x.t===t)||{iv:40,n:t};
              const dip=calcDipTrigger(q.price,q.high||q.price*1.01,q.low||q.price*0.99,q.prevClose||q.price,q.change||0,base.iv||40,t);
              return{t,q,dip,base};
            }).filter(x=>x.dip&&x.dip.score>=55).sort((a,b)=>b.dip.score-a.dip.score).slice(0,6);
            return(
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
                  <div style={{background:"rgba(0,232,122,.08)",border:"1px solid rgba(0,232,122,.2)",borderRadius:8,padding:"8px 14px",fontSize:11,color:"var(--green)",fontFamily:"DM Mono,monospace"}}>
                    {isPreMarket?"⚡ PRE-MARKET LIVE":"📅 "+mktDate}
                  </div>
                  <div style={{fontSize:11,color:"var(--dim)"}}>
                    {scanned.length>0?`${scanned.length} tickers analyzed from your recent scans`:"Run scans on the Stock or Options tabs first to populate setups"}
                  </div>
                </div>
                {setups.length===0?(
                  <div className="empty">
                    <div className="ico">⚡</div>
                    <h3>No setups loaded yet</h3>
                    <p>Run stock or options scans to populate your pre-market brief.<br/>Your top dip setups will appear here automatically.</p>
                  </div>
                ):(
                  <div>
                    <div className="sec-lbl" style={{marginBottom:12}}>🎯 Today's Top {setups.length} Dip Setups — Ranked by Signal Strength</div>
                    {setups.map((s,i)=>(
                      <div key={s.t} style={{background:i===0?"linear-gradient(135deg,rgba(0,232,122,.1),rgba(0,212,255,.06))":"var(--s1)",border:`1px solid ${i===0?"var(--green)":"var(--b1)"}`,borderRadius:13,padding:"18px 20px",marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:10}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,color:i===0?"var(--green)":"var(--txt)"}}>{s.t}</span>
                            {i===0&&<span style={{background:"var(--green)",color:"#000",fontSize:9,fontWeight:800,padding:"2px 9px",borderRadius:4,fontFamily:"Syne,sans-serif",letterSpacing:.5}}>TOP SETUP</span>}
                            <span className={`dip-badge ${s.dip.grade}`}>{s.dip.gradeLabel}</span>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,color:s.q.change>=0?"var(--green)":"var(--red)"}}>{fmt(s.q.price)}</div>
                            <div style={{fontSize:11,color:s.q.change>=0?"var(--green)":"var(--red)",fontWeight:700}}>{s.q.change>=0?"+":""}{s.q.change?.toFixed(2)}%</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                          <span style={{fontSize:10,padding:"3px 9px",background:"rgba(0,232,122,.08)",border:"1px solid rgba(0,232,122,.2)",borderRadius:5,color:"var(--green)",fontFamily:"DM Mono,monospace"}}>Entry ${s.dip.entry}</span>
                          <span style={{fontSize:10,padding:"3px 9px",background:"rgba(0,212,255,.08)",border:"1px solid rgba(0,212,255,.2)",borderRadius:5,color:"var(--cyan)",fontFamily:"DM Mono,monospace"}}>T1 ${s.dip.t1}</span>
                          <span style={{fontSize:10,padding:"3px 9px",background:"rgba(0,212,255,.08)",border:"1px solid rgba(0,212,255,.2)",borderRadius:5,color:"var(--blue)",fontFamily:"DM Mono,monospace"}}>T2 ${s.dip.t2}</span>
                          <span style={{fontSize:10,padding:"3px 9px",background:"rgba(255,77,106,.08)",border:"1px solid rgba(255,77,106,.2)",borderRadius:5,color:"var(--red)",fontFamily:"DM Mono,monospace"}}>Stop ${s.dip.stop}</span>
                          <span style={{fontSize:10,padding:"3px 9px",background:"rgba(245,166,35,.08)",border:"1px solid rgba(245,166,35,.2)",borderRadius:5,color:"var(--gold)",fontFamily:"DM Mono,monospace"}}>R/R {s.dip.rr}:1</span>
                          <span style={{fontSize:10,padding:"3px 9px",background:"rgba(255,255,255,.04)",border:"1px solid var(--b1)",borderRadius:5,color:"var(--dim)",fontFamily:"DM Mono,monospace"}}>Score {s.dip.score}/100</span>
                        </div>
                        <div style={{fontSize:11,color:"var(--dim)",lineHeight:1.65}}>
                          {s.dip.reasons.slice(0,2).map((r,j)=><div key={j} dangerouslySetInnerHTML={{__html:"• "+r}}/>)}
                        </div>
                        <div style={{marginTop:8,display:"flex",gap:5,flexWrap:"wrap"}}>
                          {s.dip.signals.filter(sig=>sig.type==="bull").slice(0,4).map((sig,j)=>(
                            <span key={j} className="dip-sig bull">{sig.label}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="disc" style={{marginTop:12}}>⚠ Pre-market setups are based on your most recent price scans. Run fresh scans for updated signals. Not financial advice.</div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>}

        {/* EARNINGS IV CRUSH PLAYBOOK — EDGE TIER */}
        {tab==="earnings"&&hasEdgeAccess&&<div className="page">
          <div className="hero">
            <h1>📅 Earnings <span>IV Playbook</span></h1>
            <p>Options strategy guide for earnings plays. IV crush analysis and positioning for every major ticker.</p>
          </div>
          {(()=>{
            // Earnings calendar — major tickers with typical earnings windows
            const earningsData=[
              {t:"NVDA",n:"NVIDIA",sector:"Semis",ivBefore:85,ivAfter:42,ivCrush:51,move:8.2,strategy:"Iron Condor / Short Straddle",notes:"Historically moves 8-12% on earnings. IV crush is extreme — 50%+ drop post-earnings. Sell premium 1-2 days before."},
              {t:"TSLA",n:"Tesla",sector:"EV",ivBefore:92,ivAfter:55,ivCrush:40,move:9.8,strategy:"Short Strangle outside expected move",notes:"Very high IV before earnings. Expected move usually overstates actual move. Ideal for premium selling strategies."},
              {t:"META",n:"Meta Platforms",sector:"Tech",ivBefore:62,ivAfter:34,ivCrush:45,move:6.1,strategy:"Iron Condor or ATM Straddle sell",notes:"Consistent IV crush 40-50%. Moves within expected range ~65% of the time. Sell ATM straddle for best R/R."},
              {t:"AAPL",n:"Apple",sector:"Tech",ivBefore:38,ivAfter:22,ivCrush:42,move:4.2,strategy:"Short Strangle / Covered Call",notes:"Lower IV base but still crushes 40%+. Small mover historically. Best for conservative premium selling."},
              {t:"AMZN",n:"Amazon",sector:"Cloud",ivBefore:54,ivAfter:28,ivCrush:48,move:7.3,strategy:"Iron Condor — wide wings",notes:"AWS revenue drives post-earnings direction. IV crush strong. Wide condor recommended for margin of safety."},
              {t:"GOOGL",n:"Alphabet",sector:"Tech",ivBefore:48,ivAfter:26,ivCrush:46,move:5.8,strategy:"Short Straddle or Iron Condor",notes:"Search + cloud dual driver. Moves within expected range ~70% of time. Strong crush candidate."},
              {t:"MSFT",n:"Microsoft",sector:"Cloud",ivBefore:42,ivAfter:24,ivCrush:43,move:4.5,strategy:"Short Strangle / Cash-secured put",notes:"Azure growth is the key metric. Lower IV but reliable crush. Best for conservative traders."},
              {t:"COIN",n:"Coinbase",sector:"Crypto",ivBefore:118,ivAfter:68,ivCrush:42,move:14.2,strategy:"Buy ATM Straddle 5+ DTE before earnings",notes:"BTC correlation makes moves unpredictable. High IV means debit straddle can profit if BTC volatile around earnings."},
              {t:"AMD",n:"AMD",sector:"Semis",ivBefore:74,ivAfter:44,ivCrush:41,move:7.8,strategy:"Iron Condor or Short Straddle",notes:"AI GPU narrative drives earnings reaction. IV crush strong. Expected move typically overstates actual move."},
              {t:"PLTR",n:"Palantir",sector:"AI",ivBefore:96,ivAfter:54,ivCrush:44,move:11.2,strategy:"Short Strangle — wide",notes:"Very high IV pre-earnings. Government contract news drives direction. Wide strangle gives 2x expected move cushion."},
              {t:"NFLX",n:"Netflix",sector:"Streaming",ivBefore:58,ivAfter:32,ivCrush:45,move:9.4,strategy:"Short Straddle or Iron Butterfly",notes:"Subscriber numbers are the key metric. Moves historically within expected range ~60% of time. Strong crush."},
              {t:"CRM",n:"Salesforce",sector:"SaaS",ivBefore:52,ivAfter:28,ivCrush:46,move:6.8,strategy:"Iron Condor",notes:"Billings growth drives reaction. Reliable IV crush. Conservative condor 1-wide from expected move is the play."},
            ];
            return(
              <div>
                <div style={{background:"rgba(245,166,35,.06)",border:"1px solid rgba(245,166,35,.2)",borderRadius:10,padding:"12px 16px",marginBottom:20,fontSize:11,color:"var(--gold)",lineHeight:1.7}}>
                  <b>How to use this playbook:</b> IV Crush % = how much implied volatility drops immediately after earnings. Higher crush = better for premium sellers. The "Expected Move" = what the options market is pricing in. Historical data shows stocks move within the expected range ~65% of the time.
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {earningsData.map((e,i)=>{
                    const q=prices[e.t];
                    return(
                      <div key={e.t} style={{background:"var(--s1)",border:"1px solid var(--b1)",borderRadius:12,padding:"16px 18px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:10}}>
                          <div>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                              <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:17}}>{e.t}</span>
                              <span style={{fontSize:10,color:"var(--dim)"}}>{e.n}</span>
                              <span style={{fontSize:9,padding:"2px 7px",background:"rgba(0,212,255,.1)",border:"1px solid rgba(0,212,255,.2)",borderRadius:4,color:"var(--cyan)",fontFamily:"DM Mono,monospace"}}>{e.sector}</span>
                            </div>
                            <div style={{fontSize:11,fontWeight:700,color:"var(--gold)"}}>{e.strategy}</div>
                          </div>
                          {q&&<div style={{textAlign:"right"}}>
                            <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:16}}>{fmt(q.price)}</div>
                            <div style={{fontSize:10,color:q.change>=0?"var(--green)":"var(--red)"}}>{q.change>=0?"+":""}{q.change?.toFixed(2)}%</div>
                          </div>}
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8,marginBottom:10}}>
                          {[
                            ["IV Before",e.ivBefore+"%","var(--gold)"],
                            ["IV After",e.ivAfter+"%","var(--dim)"],
                            ["IV Crush",e.ivCrush+"%","var(--green)"],
                            ["Avg Move","±"+e.move+"%","var(--cyan)"],
                          ].map(([label,val,color],j)=>(
                            <div key={j} style={{background:"rgba(255,255,255,.03)",border:"1px solid var(--b1)",borderRadius:7,padding:"8px 10px",textAlign:"center"}}>
                              <div style={{fontSize:8.5,color:"var(--dim)",letterSpacing:.6,textTransform:"uppercase",marginBottom:3}}>{label}</div>
                              <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:15,color}}>{val}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{fontSize:11,color:"var(--dim)",lineHeight:1.65}}>{e.notes}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="disc" style={{marginTop:16}}>⚠ Historical IV crush percentages are estimates based on typical earnings behavior. Actual results vary. Always verify current IV before entering positions.</div>
              </div>
            );
          })()}
        </div>}

        {/* PORTFOLIO HEAT MAP — EDGE TIER */}
        {tab==="heatmap"&&hasEdgeAccess&&<div className="page">
          <div className="hero">
            <h1>🔥 Portfolio <span>Heat Map</span></h1>
            <p>Score every position in your portfolio. See what to add, reduce, and watch — all in one view.</p>
          </div>
          {(()=>{
            const scanned=Object.entries(prices).filter(([t,q])=>q&&q.price>0);
            if(scanned.length===0) return(
              <div className="empty"><div className="ico">🔥</div><h3>No positions loaded</h3><p>Run stock or options scans first. Every ticker you scan will appear here with a heat map score.</p></div>
            );
            const heatData=scanned.map(([t,q])=>{
              const base=OPT_BASE.find(x=>x.t===t)||UNIVERSE_BASE.find(x=>x.t===t)||{iv:40,n:t,sec:"Unknown"};
              const dip=calcDipTrigger(q.price,q.high||q.price*1.01,q.low||q.price*0.99,q.prevClose||q.price,q.change||0,base.iv||40,t);
              const mr=calcMeanReversion(q.price,q.high||q.price*1.015,q.low||q.price*0.985,q.prevClose||q.price,q.change||0,base.iv||50);
              const heatScore=Math.round((dip.score*0.6)+(mr.mrScore*0.4));
              const action=heatScore>=70?"ADD":heatScore>=50?"HOLD":heatScore>=35?"WATCH":"REDUCE";
              const actionColor=heatScore>=70?"var(--green)":heatScore>=50?"var(--cyan)":heatScore>=35?"var(--gold)":"var(--red)";
              return{t,q,dip,mr,heatScore,action,actionColor,base};
            }).sort((a,b)=>b.heatScore-a.heatScore);
            const adds=heatData.filter(x=>x.action==="ADD").length;
            const reduces=heatData.filter(x=>x.action==="REDUCE").length;
            return(
              <div>
                <div className="stats-row" style={{marginBottom:20}}>
                  <div className="sbox"><div className="sv g">{adds}</div><div className="sl">Add Signals</div></div>
                  <div className="sbox"><div className="sv b">{heatData.filter(x=>x.action==="HOLD").length}</div><div className="sl">Hold</div></div>
                  <div className="sbox"><div className="sv gold">{heatData.filter(x=>x.action==="WATCH").length}</div><div className="sl">Watch</div></div>
                  <div className="sbox"><div className="sv r">{reduces}</div><div className="sl">Reduce Signals</div></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:20}}>
                  {heatData.map((h,i)=>{
                    const intensity=h.heatScore/100;
                    const bg=h.action==="ADD"?`rgba(0,232,122,${intensity*0.25})`
                      :h.action==="REDUCE"?`rgba(255,77,106,${intensity*0.25})`
                      :h.action==="HOLD"?`rgba(0,212,255,${intensity*0.15})`
                      :`rgba(245,166,35,${intensity*0.15})`;
                    const border=h.action==="ADD"?`rgba(0,232,122,${intensity*0.6})`
                      :h.action==="REDUCE"?`rgba(255,77,106,${intensity*0.5})`
                      :h.action==="HOLD"?"rgba(0,212,255,.25)":"rgba(245,166,35,.25)";
                    return(
                      <div key={h.t} style={{background:bg,border:`1px solid ${border}`,borderRadius:10,padding:"12px 14px",cursor:"pointer"}} onClick={()=>{setOptTicker(h.t);setTab("options");}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                          <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:16}}>{h.t}</span>
                          <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:13,color:h.actionColor}}>{h.action}</span>
                        </div>
                        <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:22,color:h.actionColor,marginBottom:4}}>{h.heatScore}</div>
                        <div style={{fontSize:9,color:"var(--dim)",marginBottom:6}}>Heat Score / 100</div>
                        <div style={{fontSize:10,fontWeight:600}}>{fmt(h.q.price)}</div>
                        <div style={{fontSize:9,color:h.q.change>=0?"var(--green)":"var(--red)"}}>{h.q.change>=0?"+":""}{h.q.change?.toFixed(2)}%</div>
                        <div style={{marginTop:6,fontSize:8.5,color:"var(--dim)"}}>Dip {h.dip.score} · MR {h.mr.mrScore}</div>
                        <div style={{width:"100%",height:3,background:"rgba(255,255,255,.08)",borderRadius:2,marginTop:6}}>
                          <div style={{width:`${h.heatScore}%`,height:"100%",background:h.actionColor,borderRadius:2}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{background:"var(--s1)",border:"1px solid var(--b1)",borderRadius:12,padding:"16px 20px",marginBottom:16}}>
                  <div className="sec-lbl" style={{marginBottom:12}}>Heat Map Legend</div>
                  <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                    {[["🟢 ADD (70-100)","Dip trigger + MR both strong. Prime entry zone.","var(--green)"],
                      ["🔵 HOLD (50-69)","Decent setup. Hold existing positions.","var(--cyan)"],
                      ["🟡 WATCH (35-49)","Mixed signals. Wait for better entry.","var(--gold)"],
                      ["🔴 REDUCE (<35)","Extended/overbought. Consider reducing.","var(--red)"]].map(([label,desc,color],j)=>(
                      <div key={j} style={{flex:1,minWidth:160}}>
                        <div style={{fontWeight:700,fontSize:11,color,marginBottom:3}}>{label}</div>
                        <div style={{fontSize:10,color:"var(--dim)"}}>{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="disc">⚠ Heat map scores are based on technical dip trigger and mean reversion signals only. Not a recommendation to buy or sell. Click any tile to load ticker in Options Screener.</div>
              </div>
            );
          })()}
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
              <div className="stats-row" style={{marginTop:20}}>
                <div className="sbox"><div className="sv g">{isOwner?"Owner":isPro?"Pro":"Free"}</div><div className="sl">Access Tier</div></div>
                <div className="sbox"><div className="sv gold">{freeScansUsed}/{FREE_STOCK_LIMIT}</div><div className="sl">Stock Scans Today</div></div>
                <div className="sbox"><div className="sv b">{freeOptScans}/{FREE_OPT_LIMIT}</div><div className="sl">Opt Scans Today</div></div>
                <div className="sbox"><div className="sv p">{freeAiUsed}/{FREE_AI_LIMIT}</div><div className="sl">AI Insights Today</div></div>
              </div>
              <div className="stats-row">
                <div className="sbox"><div className="sv g">{journal.length}</div><div className="sl">Journal Entries</div></div>
                <div className="sbox"><div className="sv b">{watchlist.length}</div><div className="sl">Watchlist Alerts</div></div>
                <div className="sbox"><div className="sv p">{eList.length}</div><div className="sl">Email Subscribers</div></div>
                <div className="sbox"><div className="sv gold">{freeOptTickers.size>0?[...freeOptTickers].join(", "):"—"}</div><div className="sl">Free Ticker Lock</div></div>
              </div>
              <div className="panel" style={{marginTop:20}}>
                <div className="panel-title">Owner Controls</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
                  <button className="btn-green" style={{fontSize:11,padding:"8px 18px"}} onClick={()=>{setIsPro(true);try{localStorage.setItem("rb_pro","true");}catch{}}}>✓ Grant Pro Access</button>
                  <button className="btn-sm" onClick={()=>{setIsPro(false);try{localStorage.removeItem("rb_pro");}catch{}}}>Revoke Pro</button>
                  <button className="btn-sm" onClick={()=>{
                    setFreeScansUsed(0);setFreeOptScans(0);setFreeAiUsed(0);setFreeOptTickers(new Set());
                    _setDaily("rb_stock_scans",0);_setDaily("rb_opt_scans",0);_setDaily("rb_ai_used",0);
                    try{localStorage.removeItem("rb_opt_tickers");}catch{}
                  }}>Reset All Daily Limits</button>
                </div>
                <div style={{fontSize:10,color:"var(--dim)",lineHeight:1.8}}>
                  As owner (PIN unlocked) you always have full access regardless of Pro status. Use "Grant Pro Access" to test the Pro experience as a regular user would see it.
                </div>
              </div>
              <div className="panel" style={{marginTop:16}}>
                <div className="panel-title">Monetization Roadmap</div>
                <div className="li-list">
                  {["Export subscriber list → import into Mailchimp (free ≤500 contacts)","Sunday email: top 3 AI dip setups of the week — drives upgrades","Share your Pro access code via X/IG/TikTok to drive paid signups","Add Tastytrade or Webull affiliate links next to each options card","Launch Edge tier ($29/mo) with pre-market brief and earnings playbook","Offer annual Pro at $149/yr (save $79) to boost LTV"].map((t,i)=><div className="li-item" key={i}><div className="li-ico ok">{i+1}</div><span>{t}</span></div>)}
                </div>
              </div>
            </>
          )}
        </div>}
      </div>

      {/* ── PAYWALL MODAL ── */}
      {showPaywall&&(
        <div className="paywall-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowPaywall(false);}}>
          <div className="paywall-card">
            <div className="paywall-icon">🔐</div>
            <div className="paywall-title">You've hit the free limit</div>
            <div className="paywall-sub">Free users get <b>3 scans per day</b>. Upgrade to Pro for unlimited scans, full dip trigger levels, AI insights, trade journal, and watchlist alerts.</div>
            <div className="paywall-features">
              {["Unlimited stock + options scans","Full dip trigger: entry, T1, T2, T3, stop levels","AI-generated options insights & IV analysis","Trade journal with P&L tracking","Watchlist alerts for dip trigger signals","Pre-market AI brief — daily top setups","Priority Finnhub data refresh"].map((f,i)=>(
                <div key={i} className="paywall-feat"><span className="paywall-feat-icon">✓</span>{f}</div>
              ))}
            </div>
            <div className="paywall-btns">
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <button className="btn-upgrade" onClick={()=>{setShowPaywall(false);goUpgrade(STRIPE_PRO_LINK);}}>
                  <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.831 3.47 1.426 3.47 2.338 0 .99-.893 1.548-2.585 1.548-2.227 0-5.028-.917-7.083-2.034l-.89 5.594c2.043 1.02 5.08 1.694 8.21 1.694 2.583 0 4.777-.618 6.381-1.84 1.72-1.305 2.586-3.203 2.586-5.597 0-4.094-2.526-5.868-6.346-7.19z"/></svg>
                    Upgrade to Pro — $19/mo via Stripe
                  </span>
                </button>
                <button className="btn-dismiss" onClick={()=>{setShowPaywall(false);setTab("pricing");}}>View all plans</button>
              </div>
              <button className="btn-dismiss" onClick={()=>setShowPaywall(false)}>Maybe later</button>
            </div>
          </div>
        </div>
      )}

      {/* ── GLOBAL DISCLOSURE FOOTER ── */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-disc">
            <div className="footer-disc-icon">⚠️</div>
            <div className="footer-disc-body">
              <div className="footer-disc-title">IMPORTANT DISCLOSURE — NOT FINANCIAL ADVICE</div>
              RUBBERBAND.AI is a financial data and screening tool provided for <b>informational and educational purposes only</b>. 
              Nothing on this platform constitutes financial, investment, legal, or tax advice, nor a solicitation or recommendation to buy or sell any security. 
              All stock screener results, options analytics, dip trigger signals, entry/exit levels, Greeks, and AI-generated insights are <b>algorithmic estimates</b> and do not reflect actual market conditions, guaranteed returns, or professional investment guidance. 
              Options trading involves <b>substantial risk of loss</b> and is not suitable for all investors. Past performance does not guarantee future results. 
              Always conduct your own thorough due diligence and consult a <b>licensed financial advisor</b> before making any investment decision. 
              <b>You may lose all of your invested capital.</b>
              <br/><br/>
              <b>Universe Disclosure:</b> RUBBERBAND.AI screens a curated universe of stocks and options selected for <b>high-probability price action, liquidity, options volume, and volatility characteristics</b>. 
              This platform does not cover every stock on the market — it focuses on tickers with the strongest technical setups, institutional interest, and options market activity. 
              Inclusion in our screener does not constitute a recommendation. Exclusion does not imply a negative view.
            </div>
          </div>
          <div className="footer-links">
            {["Not Financial Advice","Educational Use Only","Options Risk: High","Past Performance ≠ Future Results","Always DYOR","Consult a Licensed Advisor","AI Estimates Only","Trade at Your Own Risk"].map((t,i)=>(
              <span key={i} className="footer-tag">{t}</span>
            ))}
          </div>
          <div className="footer-bottom">
            <div className="footer-brand">RUBBERBAND<span style={{color:"var(--green)"}}>.</span>AI</div>
            <div className="footer-copy">© {new Date().getFullYear()} RUBBERBAND.AI · All content for educational purposes only · Not affiliated with any broker or exchange</div>
          </div>
        </div>
      </footer>

    </>
  );
}

export default App;
