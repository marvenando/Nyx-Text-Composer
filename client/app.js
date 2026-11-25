(function () {
  "use strict";

  var csInterface = new window.CSInterface();
  var config = window.TEXT_COMPOSER_CONFIG || { version: "1.0.0", githubRepo: "", branch: "main", updateFiles: [] };
  var categories = window.TEXT_COMPOSER_CATEGORIES || [];
  var presets = window.TEXT_COMPOSER_PRESETS || [];

  var STORAGE_FAVS = "tc_favorites_v1";
  var STORAGE_TOKEN = "tc_github_token_v1";
  var STORAGE_THEME = "nyx_theme_v1";
  var state = {
    viewMode: "transitions", // "transitions" | "loops"
    category: "all",
    search: "",
    favoritesOnly: false,
    autoPlayAll: false,
    favorites: loadFavorites(),
    settings: {
      basedOn: "auto",
      duration: 0, // 0 = preset default
      stagger: -1, // -1 = preset default
      reverse: false
    }
  };

  // Active preview animation loops keyed by preset id
  var activeLoops = {};
  var SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*";

  // DOM refs
  var elCount = document.getElementById("presetCount");
  var elTabTransitions = document.getElementById("tabTransitions");
  var elTabLoops = document.getElementById("tabLoops");
  var elCountTransitions = document.getElementById("countTransitions");
  var elCountLoops = document.getElementById("countLoops");
  var elCategoryBar = document.getElementById("categoryBar");
  var elGrid = document.getElementById("presetGrid");
  var elEmpty = document.getElementById("emptyState");
  var elSearch = document.getElementById("searchInput");
  var elClearSearch = document.getElementById("btnClearSearch");
  var elBtnFavFilter = document.getElementById("btnFavFilter");
  var elBtnAutoPlay = document.getElementById("btnAutoPlay");
  var elBtnUpdate = document.getElementById("btnUpdate");
  var elUpdateDot = document.getElementById("updateDot");
  var elUpdateBanner = document.getElementById("updateBanner");
  var elUpdateBannerText = document.getElementById("updateBannerText");
  var elBtnInstallUpdate = document.getElementById("btnInstallUpdate");
  var elBtnDismissUpdate = document.getElementById("btnDismissUpdate");
  var elBtnClearLayer = document.getElementById("btnClearLayer");
  var pendingRemoteVersion = "";
  var elBtnResetFilters = document.getElementById("btnResetFilters");
  var elBtnToggleSettings = document.getElementById("btnToggleSettings");
  var elDrawerBody = document.getElementById("drawerBody");
  var elSettingsSummary = document.getElementById("settingsSummary");
  var elOptTheme = document.getElementById("optTheme");
  var elOptBasedOn = document.getElementById("optBasedOn");
  var elOptDuration = document.getElementById("optDuration");
  var elValDuration = document.getElementById("valDuration");
  var elOptStagger = document.getElementById("optStagger");
  var elValStagger = document.getElementById("valStagger");
  var elOptReverse = document.getElementById("optReverse");
  var elOptGithubToken = document.getElementById("optGithubToken");
  var elStatusTag = document.getElementById("statusTag");
  var elStatusText = document.getElementById("statusText");
  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function loadFavorites() {
    try {
      var raw = localStorage.getItem(STORAGE_FAVS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(STORAGE_FAVS, JSON.stringify(state.favorites));
    } catch (e) {}
  }

  function setStatus(msg, level) {
    elStatusText.textContent = msg;
    if (!level) {
      elStatusTag.className = "status-tag hidden";
      elStatusTag.textContent = "";
      return;
    }
    var labels = { ok: "DONE", warn: "NOTE", err: "ERROR" };
    elStatusTag.textContent = labels[level] || "";
    elStatusTag.className = "status-tag " + level;
  }

  // ==================== EASING MATH FOR LIVE PREVIEWS ====================
  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function evalEase(t, type) {
    t = clamp01(t);
    if (type === "expo") {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }
    if (type === "cubic") {
      return 1 - Math.pow(1 - t, 3);
    }
    if (type === "back") {
      var c1 = 1.9;
      var c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    if (type === "elastic") {
      if (t === 0 || t === 1) return t;
      var c4 = (2 * Math.PI) / 3.2;
      return Math.pow(2, -8 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
    if (type === "step") {
      return t >= 0.5 ? 1 : 0;
    }
    if (type === "flicker") {
      if (t <= 0.01) return 0;
      if (t >= 0.99) return 1;
      var s = Math.sin(t * 42) + Math.cos(t * 19);
      return s > -0.15 ? 1 : 0;
    }
    if (type === "glitch") {
      if (t <= 0.01) return 0;
      if (t >= 0.99) return 1;
      var step = Math.floor(t * 6) / 6;
      return step + (Math.sin(t * 60) * 0.12);
    }
    if (type === "posterize12") {
      if (t <= 0.01) return 0;
      if (t >= 0.99) return 1;
      var st12 = Math.floor(t * 5) / 5;
      return 1 - Math.pow(1 - st12, 2);
    }
    if (type === "impact") {
      if (t <= 0.01) return 0;
      if (t >= 0.99) return 1;
      if (t < 0.35) return 1 - Math.pow(1 - (t / 0.35), 3);
      var decay = Math.exp(-8 * (t - 0.35));
      return 1 + Math.sin((t - 0.35) * 42) * 0.14 * decay;
    }
    if (type === "strobe") {
      if (t <= 0.01) return 0;
      if (t >= 0.99) return 1;
      return t < 0.45 ? (Math.floor(t * 16) % 2 === 0 ? 1 : 0) : 1;
    }
    return t;
  }

  // ==================== PREVIEW ANIMATION ENGINE ====================
  function applyUnitPose(el, preset, p, origChar, unitIdx, totalUnits, nowMs) {
    var mode = preset.preview.mode;
    var inv = 1 - p; // 1 = hidden/start, 0 = resting
    var opacity = clamp01(p * 1.4);
    var transform = "";
    var filter = "none";
    var letterSpacing = "";

    switch (mode) {
      case "mask-up":
        transform = "translate3d(0," + (inv * 30).toFixed(2) + "px,0)";
        opacity = 1;
        break;
      case "mask-down":
        transform = "translate3d(0," + (-inv * 30).toFixed(2) + "px,0)";
        opacity = 1;
        break;
      case "mask-left":
        transform = "translate3d(" + (inv * 72).toFixed(2) + "px,0,0)";
        opacity = 1;
        break;
      case "slide-up":
        transform = "translate3d(0," + (inv * 24).toFixed(2) + "px,0)";
        break;
      case "slide-down":
        transform = "translate3d(0," + (-inv * 24).toFixed(2) + "px,0)";
        break;
      case "slide-left":
        transform = "translate3d(" + (inv * 48).toFixed(2) + "px,0,0) skewX(" + (-inv * 14).toFixed(1) + "deg)";
        break;
      case "skew-slide":
        transform = "translate3d(" + (-inv * 44).toFixed(2) + "px,0,0) skewX(" + (inv * 24).toFixed(1) + "deg)";
        break;
      case "pop":
        var sc = Math.max(0, p);
        transform = "scale(" + sc.toFixed(3) + ")";
        break;
      case "bounce-y":
        var scb = Math.max(0.2, 0.4 + 0.6 * p);
        transform = "translate3d(0," + (-inv * 26).toFixed(2) + "px,0) scale(" + scb.toFixed(3) + ")";
        break;
      case "pop-spin":
        var scp = Math.max(0, p);
        transform = "scale(" + scp.toFixed(3) + ") rotate(" + (-inv * 55).toFixed(1) + "deg)";
        break;
      case "zoom-down":
        var scz = 1 + inv * 0.95;
        transform = "scale(" + scz.toFixed(3) + ")";
        break;
      case "tracking-in":
        letterSpacing = (0.06 + inv * 0.45).toFixed(3) + "em";
        break;
      case "tracking-out":
        letterSpacing = (0.06 - inv * 0.22).toFixed(3) + "em";
        break;
      case "fade-up":
        transform = "translate3d(0," + (inv * 12).toFixed(2) + "px,0)";
        opacity = clamp01(p);
        break;
      case "fade-random":
        transform = "scale(" + (0.85 + 0.15 * p).toFixed(3) + ")";
        opacity = clamp01(p);
        break;
      case "flip-x":
        transform = "rotateX(" + (-inv * 92).toFixed(1) + "deg) translate3d(0," + (inv * 10).toFixed(1) + "px,0)";
        break;
      case "flip-y":
        transform = "rotateY(" + (inv * 92).toFixed(1) + "deg)";
        break;
      case "fly-z":
        transform = "translate3d(0,0," + (-inv * 180).toFixed(1) + "px) scale(" + (1 + inv * 0.5).toFixed(3) + ")";
        filter = inv > 0.02 ? "blur(" + (inv * 6).toFixed(1) + "px)" : "none";
        break;
      case "tumble-3d":
        transform = "rotateX(" + (inv * 75).toFixed(1) + "deg) rotateY(" + (-inv * 55).toFixed(1) + "deg) translate3d(0," + (-inv * 18).toFixed(1) + "px,0)";
        break;
      case "typewriter":
      case "typewriter-word":
        opacity = p >= 0.5 ? 1 : 0;
        break;
      case "decode":
        if (p <= 0.02) {
          opacity = 0;
          el.textContent = origChar;
        } else if (p < 0.96) {
          opacity = 1;
          var idx = Math.floor((nowMs / 45 + unitIdx * 7)) % SCRAMBLE_CHARS.length;
          el.textContent = origChar === " " ? " " : SCRAMBLE_CHARS.charAt(idx);
        } else {
          opacity = 1;
          el.textContent = origChar;
        }
        break;
      case "blur-in":
        filter = inv > 0.02 ? "blur(" + (inv * 8).toFixed(1) + "px)" : "none";
        transform = "scale(" + (1 + inv * 0.16).toFixed(3) + ")";
        opacity = clamp01(p);
        break;
      case "blur-whip":
        transform = "translate3d(" + (-inv * 54).toFixed(1) + "px,0,0)";
        filter = inv > 0.02 ? "blur(" + (inv * 7).toFixed(1) + "px)" : "none";
        break;
      case "stretch-y":
        transform = "scaleY(" + Math.max(0.05, p).toFixed(3) + ") translate3d(0," + (inv * 16).toFixed(1) + "px,0)";
        break;
      case "stretch-x":
        transform = "scaleX(" + (1 + inv * 1.1).toFixed(3) + ") scaleY(" + (0.35 + 0.65 * clamp01(p)).toFixed(3) + ")";
        filter = inv > 0.05 ? "blur(" + (inv * 4).toFixed(1) + "px)" : "none";
        break;
      case "flicker":
        opacity = p >= 0.5 ? 1 : 0;
        break;
      case "glitch-jitter":
        var jx = inv > 0.02 ? (Math.sin(nowMs * 0.09 + unitIdx * 13) * 10 * inv) : 0;
        var jy = inv > 0.02 ? (Math.cos(nowMs * 0.11 + unitIdx * 7) * 5 * inv) : 0;
        transform = "translate3d(" + jx.toFixed(1) + "px," + jy.toFixed(1) + "px,0) skewX(" + (inv * 22).toFixed(1) + "deg)";
        opacity = p > 0.05 ? 1 : 0;
        break;
      // ---- NEW PACK 1: CONTINUOUS LOOPS & FX ----
      case "loop-wiggle":
        var stepT = Math.floor(nowMs / 100); // ~10fps posterized
        var wx = Math.sin(stepT * 12.7 + unitIdx * 4.3) * 2.8;
        var wy = Math.cos(stepT * 9.3 + unitIdx * 6.1) * 2.8;
        var wr = Math.sin(stepT * 7.1 + unitIdx * 2.9) * 4.5;
        transform = "translate3d(" + wx.toFixed(1) + "px," + wy.toFixed(1) + "px,0) rotate(" + wr.toFixed(1) + "deg)";
        opacity = 1;
        break;
      case "loop-wave":
        var waveY = Math.sin((nowMs * 0.006) + unitIdx * 0.7) * 7;
        transform = "translate3d(0," + waveY.toFixed(2) + "px,0)";
        opacity = 1;
        break;
      case "loop-drift":
        var drift = ((nowMs % 2200) / 2200) * 0.28;
        letterSpacing = (0.04 + drift).toFixed(3) + "em";
        opacity = 1;
        break;
      case "loop-pulse":
        var pulse = 1 + Math.sin((nowMs * 0.008) + unitIdx * 0.8) * 0.1;
        transform = "scale(" + pulse.toFixed(3) + ")";
        opacity = 1;
        break;
      case "loop-hue":
        var hue = Math.floor((nowMs * 0.18 + unitIdx * 34) % 360);
        el.style.color = "hsl(" + hue + ", 90%, 68%)";
        opacity = 1;
        break;
      // ---- NEW PACK 2: SOCIAL & CAPTIONS ----
      case "karaoke-pop":
        var isLit = p > 0.15 && p < 0.92;
        var kScale = isLit ? 1.18 : 1.0;
        transform = "scale(" + kScale.toFixed(3) + ")";
        el.style.color = isLit ? "var(--accent)" : "";
        opacity = 1;
        break;
      case "outline-fill":
        opacity = 1;
        if (p < 0.5) {
          el.style.color = "transparent";
          el.style.webkitTextStroke = "1.2px var(--text-primary)";
        } else {
          el.style.color = "";
          el.style.webkitTextStroke = "0px transparent";
        }
        break;
      case "highlighter":
        opacity = clamp01(p * 1.4);
        transform = "translate3d(0," + (inv * 6).toFixed(1) + "px,0)";
        el.style.padding = "2px 6px";
        el.style.borderRadius = "3px";
        el.style.color = p > 0.35 ? "#171215" : "";
        el.style.background = "linear-gradient(90deg, #facc15 " + Math.round(clamp01(p) * 100) + "%, transparent " + Math.round(clamp01(p) * 100) + "%)";
        break;
      // ---- NEW PACK 3: MECHANICAL & DATA ----
      case "slot-roll":
        opacity = 1;
        transform = "translate3d(0," + (-inv * 28).toFixed(2) + "px,0)";
        if (p > 0.04 && p < 0.92) {
          var sIdx = Math.floor((nowMs / 35 + unitIdx * 5)) % SCRAMBLE_CHARS.length;
          el.textContent = origChar === " " ? " " : SCRAMBLE_CHARS.charAt(sIdx);
        } else {
          el.textContent = origChar;
        }
        break;
      case "split-flap":
        opacity = p > 0.05 ? 1 : 0;
        transform = "rotateX(" + (-inv * 110).toFixed(1) + "deg)";
        if (p > 0.05 && p < 0.92) {
          var fIdx = Math.floor((nowMs / 55 + unitIdx * 3)) % SCRAMBLE_CHARS.length;
          el.textContent = origChar === " " ? " " : SCRAMBLE_CHARS.charAt(fIdx);
        } else {
          el.textContent = origChar;
        }
        break;
      case "counter":
        opacity = 1;
        var numVal = Math.round(clamp01(p) * 10000);
        el.textContent = "$" + numVal.toLocaleString("en-US");
        break;
      // ---- NEW PACK 4: EDITORIAL & BOXES ----
      case "center-out":
        transform = "scale(" + Math.max(0, p).toFixed(3) + ")";
        opacity = clamp01(p * 1.4);
        break;
      case "auto-box":
        opacity = 1;
        el.style.padding = "3px 8px";
        el.style.borderRadius = "4px";
        el.style.background = "rgba(45, 140, 255, " + clamp01(p).toFixed(2) + ")";
        transform = "scaleX(" + (0.2 + 0.8 * clamp01(p)).toFixed(3) + ") translate3d(0," + (inv * 10).toFixed(1) + "px,0)";
        break;
      case "underline":
        opacity = 1;
        el.style.paddingBottom = "3px";
        el.style.backgroundImage = "linear-gradient(#2d8cff, #2d8cff)";
        el.style.backgroundRepeat = "no-repeat";
        el.style.backgroundPosition = "0 100%";
        el.style.backgroundSize = Math.round(clamp01(p) * 100) + "% 2.5px";
        transform = "translate3d(0," + (inv * 12).toFixed(1) + "px,0)";
        break;
      case "rgb-hit":
        var scRgb = 1 + inv * 0.45;
        var splitPx = (inv * 7).toFixed(1);
        transform = "scale(" + scRgb.toFixed(3) + ")";
        el.style.textShadow = inv > 0.03 ? (splitPx + "px 0 #ff2a6d, -" + splitPx + "px 0 #05d9e8") : "none";
        opacity = clamp01(p * 1.6);
        break;
      // ---- NEW PACK 5: BRUTALIST & PRINT ----
      case "hard-snap":
        transform = "translate3d(0," + (inv * 24).toFixed(1) + "px,0) scale(" + (1 + inv * 0.25).toFixed(3) + ")";
        opacity = p > 0.05 ? 1 : 0;
        break;
      case "archival-cut":
        var tilt = (unitIdx % 2 === 0 ? -1 : 1) * inv * 12;
        transform = "translate3d(0," + (-inv * 20).toFixed(1) + "px,0) rotate(" + tilt.toFixed(1) + "deg)";
        opacity = p > 0.05 ? 1 : 0;
        break;
      case "block-wipe":
        opacity = p > 0.45 ? 1 : 0.01;
        var bw = p < 0.5 ? Math.round((p / 0.5) * 100) : Math.round(((1 - p) / 0.5) * 100);
        el.style.padding = "2px 6px";
        el.style.background = p < 0.98 ? ("linear-gradient(90deg, var(--text-primary) " + bw + "%, transparent " + bw + "%)") : "transparent";
        el.style.color = p < 0.5 ? "transparent" : "";
        break;
      // ---- NEW PACK 6: SCI-FI & HUD ----
      case "terminal-cursor":
        opacity = 1;
        var charsShown = Math.floor(clamp01(p) * origChar.length);
        var blink = Math.floor(nowMs / 360) % 2 === 0 ? "_" : "\u00A0";
        el.textContent = origChar.slice(0, charsShown) + blink;
        el.style.color = "#6ee7b7";
        break;
      case "hud-brackets":
        opacity = clamp01(p * 1.4);
        el.style.padding = "2px 8px";
        el.style.borderLeft = "2px solid rgba(5, 217, 232, " + clamp01(p).toFixed(2) + ")";
        el.style.borderRight = "2px solid rgba(5, 217, 232, " + clamp01(p).toFixed(2) + ")";
        transform = "scaleX(" + (0.4 + 0.6 * clamp01(p)).toFixed(3) + ")";
        break;
      case "hologram":
        opacity = p >= 0.5 ? 0.92 : 0;
        el.style.color = "#38bdf8";
        el.style.textShadow = "0 0 8px rgba(56, 189, 248, 0.7)";
        filter = inv > 0.05 ? "blur(" + (inv * 3).toFixed(1) + "px)" : "none";
        break;
      case "target-lock":
        letterSpacing = (0.06 + inv * 0.5).toFixed(3) + "em";
        opacity = clamp01(p * 1.4);
        if (p > 0.04 && p < 0.85) {
          var tIdx = Math.floor((nowMs / 40 + unitIdx * 7)) % SCRAMBLE_CHARS.length;
          el.textContent = origChar === " " ? " " : SCRAMBLE_CHARS.charAt(tIdx);
        } else {
          el.textContent = origChar;
        }
        break;
      // ---- NEW PACK 7: ANIME & IMPACT ----
      case "beat-slam":
        var scBeat = 1 + (1 - p) * 0.85;
        transform = "scale(" + Math.max(0.85, scBeat).toFixed(3) + ")";
        filter = inv > 0.05 ? "blur(" + (Math.abs(inv) * 6).toFixed(1) + "px)" : "none";
        opacity = p > 0.02 ? 1 : 0;
        break;
      case "shear-slice":
        var dirS = unitIdx % 2 === 0 ? 1 : -1;
        transform = "translate3d(" + (dirS * inv * 38).toFixed(1) + "px,0,0) skewX(" + (-inv * 34).toFixed(1) + "deg)";
        opacity = clamp01(p * 1.5);
        break;
      case "strobe":
        opacity = p >= 0.5 ? 1 : 0;
        transform = "scale(" + (1 + (1 - clamp01(p)) * 0.25).toFixed(3) + ")";
        break;
      // ---- NEW PACK 8: RETRO & VHS ----
      case "crt-on":
        var sxCrt = 1 + inv * 1.3;
        var syCrt = 0.05 + 0.95 * clamp01(p);
        transform = "scale(" + sxCrt.toFixed(3) + "," + syCrt.toFixed(3) + ")";
        el.style.textShadow = "0 0 10px rgba(255,255,255,0.65)";
        opacity = p > 0.02 ? 1 : 0;
        break;
      case "retro-stutter":
        transform = "scale(" + Math.max(0, p).toFixed(3) + ") rotate(" + (-inv * 8).toFixed(1) + "deg)";
        el.style.textShadow = "3px 3px 0 #ff2a6d";
        opacity = p > 0.05 ? 1 : 0;
        break;
      case "loop-vhs":
        var vx = Math.sin(nowMs * 0.015) * 3.5 + (Math.sin(nowMs * 0.09) > 0.92 ? 6 : 0);
        var vy = Math.cos(nowMs * 0.021) * 1.2;
        transform = "translate3d(" + vx.toFixed(1) + "px," + vy.toFixed(1) + "px,0) skewX(" + (vx * 0.7).toFixed(1) + "deg)";
        el.style.textShadow = "2px 0 rgba(255,42,109,0.65), -2px 0 rgba(5,217,232,0.65)";
        opacity = 1;
        break;
      default:
        opacity = clamp01(p);
    }

    el.style.opacity = opacity.toFixed(3);
    el.style.transform = transform;
    el.style.filter = filter;
    if (letterSpacing) {
      el.style.letterSpacing = letterSpacing;
    }
  }

  function resetCardPreview(card, preset) {
    var units = card.querySelectorAll(".preview-unit");
    for (var i = 0; i < units.length; i++) {
      var u = units[i];
      u.style.opacity = "1";
      u.style.transform = "";
      u.style.filter = "none";
      u.style.letterSpacing = "";
      u.style.color = "";
      u.style.webkitTextStroke = "";
      u.style.background = "";
      u.style.backgroundImage = "";
      u.style.backgroundSize = "";
      u.style.padding = "";
      u.style.paddingBottom = "";
      u.style.borderRadius = "";
      u.style.borderLeft = "";
      u.style.borderRight = "";
      u.style.textShadow = "";
      if (u.dataset.char) {
        u.textContent = u.dataset.char;
      }
    }
  }

  function startCardPreview(card, preset) {
    if (activeLoops[preset.id]) return;

    var units = Array.prototype.slice.call(card.querySelectorAll(".preview-unit"));
    var total = units.length || 1;
    var animDurMs = Math.max(550, preset.defaultDuration * 1000);
    var holdMs = 700;
    var cycleMs = animDurMs + holdMs;
    var startTs = performance.now();

    // Deterministic pseudo-random order for random-order presets
    var order = [];
    for (var i = 0; i < total; i++) order.push(i);
    if (preset.ae && preset.ae.randomOrder) {
      order.sort(function (a, b) {
        return Math.sin(a * 12.9898 + 1.5) - Math.sin(b * 12.9898 + 1.5);
      });
    }

    function tick(now) {
      if (!activeLoops[preset.id]) return;
      var elapsed = (now - startTs) % cycleMs;
      var globalT = clamp01(elapsed / animDurMs);
      var staggerFrac = clamp01((preset.defaultStagger || 40) / 100) * 0.65;

      for (var i = 0; i < total; i++) {
        var idx = order[i];
        var delay;
        if (preset.ae && preset.ae.centerOut && total > 1) {
          var mid = (total - 1) / 2;
          delay = (Math.abs(i - mid) / Math.max(0.5, mid)) * staggerFrac;
        } else {
          delay = total > 1 ? (idx / (total - 1)) * staggerFrac : 0;
        }
        var span = Math.max(0.15, 1 - staggerFrac);
        var localT = clamp01((globalT - delay) / span);
        var eased = evalEase(localT, preset.preview.ease);
        applyUnitPose(units[i], preset, eased, units[i].dataset.char || "", i, total, now);
      }

      activeLoops[preset.id] = requestAnimationFrame(tick);
    }

    activeLoops[preset.id] = requestAnimationFrame(tick);
  }

  function stopCardPreview(card, preset) {
    if (activeLoops[preset.id]) {
      cancelAnimationFrame(activeLoops[preset.id]);
      delete activeLoops[preset.id];
    }
    resetCardPreview(card, preset);
  }

  function stopAllPreviews() {
    Object.keys(activeLoops).forEach(function (id) {
      cancelAnimationFrame(activeLoops[id]);
      delete activeLoops[id];
    });
  }

  // ==================== RENDER UI ====================
  function updateModeTabs() {
    var transCount = presets.filter(function (p) { return !p.isLoop; }).length;
    var loopCount = presets.filter(function (p) { return !!p.isLoop; }).length;
    if (elCountTransitions) elCountTransitions.textContent = String(transCount);
    if (elCountLoops) elCountLoops.textContent = String(loopCount);

    var isLoops = state.viewMode === "loops";
    if (elTabTransitions) {
      elTabTransitions.classList.toggle("active", !isLoops);
      elTabTransitions.setAttribute("aria-selected", !isLoops ? "true" : "false");
    }
    if (elTabLoops) {
      elTabLoops.classList.toggle("active", isLoops);
      elTabLoops.setAttribute("aria-selected", isLoops ? "true" : "false");
    }
    elCategoryBar.classList.toggle("hidden", isLoops);
  }

  function renderCategories() {
    elCategoryBar.innerHTML = "";
    if (state.viewMode === "loops") return;

    categories.forEach(function (cat) {
      if (cat.id === "loops") return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-tab" + (state.category === cat.id ? " active" : "");
      btn.setAttribute("aria-pressed", state.category === cat.id ? "true" : "false");
      btn.textContent = cat.label;
      btn.addEventListener("click", function () {
        state.category = cat.id;
        renderCategories();
        renderGrid();
      });
      elCategoryBar.appendChild(btn);
    });
  }

  function getFilteredPresets() {
    var q = state.search.trim().toLowerCase();
    var wantLoops = state.viewMode === "loops";
    return presets.filter(function (p) {
      if (wantLoops && !p.isLoop) return false;
      if (!wantLoops && p.isLoop) return false;
      if (state.favoritesOnly && state.favorites.indexOf(p.id) === -1) return false;
      if (!wantLoops && state.category !== "all" && p.category !== state.category) return false;
      if (q) {
        var hay = (p.name + " " + p.category + " " + (p.tags || []).join(" ")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function buildPreviewSpans(preset) {
    var wrap = document.createElement("div");
    wrap.className = "preview-mask-box" + (preset.ae && preset.ae.mask ? " is-masked" : "");

    var textEl = document.createElement("div");
    textEl.className = "preview-text";

    var unitMode = preset.preview.unit;
    var str = preset.sampleText || "TEXT";

    if (unitMode === "whole") {
      var span = document.createElement("span");
      span.className = "preview-unit";
      span.textContent = str;
      span.dataset.char = str;
      textEl.appendChild(span);
    } else if (unitMode === "words") {
      var words = str.split(" ");
      words.forEach(function (w, idx) {
        var span = document.createElement("span");
        span.className = "preview-unit";
        span.textContent = w;
        span.dataset.char = w;
        textEl.appendChild(span);
        if (idx < words.length - 1) {
          var sp = document.createElement("span");
          sp.className = "preview-unit space";
          sp.innerHTML = "&nbsp;";
          sp.dataset.char = " ";
          textEl.appendChild(sp);
        }
      });
    } else {
      for (var i = 0; i < str.length; i++) {
        var ch = str.charAt(i);
        var s = document.createElement("span");
        s.className = "preview-unit" + (ch === " " ? " space" : "");
        s.textContent = ch === " " ? "\u00A0" : ch;
        s.dataset.char = ch;
        textEl.appendChild(s);
      }
    }

    wrap.appendChild(textEl);
    return wrap;
  }

  function renderGrid() {
    stopAllPreviews();
    var list = getFilteredPresets();
    elGrid.innerHTML = "";
    elCount.textContent = list.length + " preset" + (list.length === 1 ? "" : "s");

    if (list.length === 0) {
      var elEmptyMsg = document.getElementById("emptyMessage");
      if (elEmptyMsg) {
        if (state.favoritesOnly && state.favorites.length === 0) {
          elEmptyMsg.textContent = "No favorites saved yet. Click the star on any preset card to save it.";
        } else {
          elEmptyMsg.textContent = "No presets match your current search or category filter.";
        }
      }
      elEmpty.classList.remove("hidden");
      return;
    }
    elEmpty.classList.add("hidden");

    list.forEach(function (preset) {
      var card = document.createElement("article");
      card.className = "preset-card";

      // Semantic Preview Wrapper (no nested buttons: stage button + sibling fav button)
      var previewWrap = document.createElement("div");
      previewWrap.className = "preview-wrap";

      var stage = document.createElement("button");
      stage.type = "button";
      stage.className = "preview-stage";
      var defaultModeLabel = preset.isLoop ? "loop effect" : (preset.isCounter ? "number counter" : (preset.isTerminal ? "terminal cursor" : "In animation"));
      stage.setAttribute("aria-label", "Apply " + preset.name + " as " + defaultModeLabel);
      stage.title = "Click to apply " + preset.name;
      stage.appendChild(buildPreviewSpans(preset));

      stage.addEventListener("click", function () {
        if (preset.isLoop) applyPreset(preset, "fx");
        else if (preset.isCounter) applyPreset(preset, "counter");
        else if (preset.isTerminal) applyPreset(preset, "terminal");
        else applyPreset(preset, "in");
      });

      previewWrap.appendChild(stage);

      if (preset.ae && preset.ae.perChar3D) {
        var badge = document.createElement("span");
        badge.className = "mode-badge";
        badge.textContent = "3D";
        previewWrap.appendChild(badge);
      } else if (preset.isLoop) {
        var badgeFx = document.createElement("span");
        badgeFx.className = "mode-badge";
        badgeFx.textContent = "LOOP";
        previewWrap.appendChild(badgeFx);
      } else if (preset.isCounter) {
        var badgeNum = document.createElement("span");
        badgeNum.className = "mode-badge";
        badgeNum.textContent = "DATA";
        previewWrap.appendChild(badgeNum);
      } else if (preset.isTerminal) {
        var badgeTerm = document.createElement("span");
        badgeTerm.className = "mode-badge";
        badgeTerm.textContent = "TERM";
        previewWrap.appendChild(badgeTerm);
      }

      // Favorite star (sibling button, accessible name & aria-pressed)
      var isFav = state.favorites.indexOf(preset.id) !== -1;
      var favBtn = document.createElement("button");
      favBtn.type = "button";
      favBtn.className = "fav-btn" + (isFav ? " is-fav" : "");
      favBtn.setAttribute("aria-label", (isFav ? "Remove " : "Save ") + preset.name + (isFav ? " from favorites" : " to favorites"));
      favBtn.setAttribute("aria-pressed", isFav ? "true" : "false");
      favBtn.title = isFav ? "Remove from favorites" : "Save to favorites";
      favBtn.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M8 1.4l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.93 3.88 14.1l.79-4.6L1.33 6.25l4.61-.67L8 1.4z"/></svg>';
      favBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleFavorite(preset.id);
      });
      previewWrap.appendChild(favBtn);

      // Card Meta & Buttons
      var meta = document.createElement("div");
      meta.className = "card-meta";

      var title = document.createElement("div");
      title.className = "card-title";
      title.textContent = preset.name;

      var actions = document.createElement("div");
      actions.className = "card-actions" + (preset.isLoop || preset.isCounter || preset.isTerminal ? " single-action" : "");

      if (preset.isLoop) {
        var btnFx = document.createElement("button");
        btnFx.type = "button";
        btnFx.className = "apply-btn btn-primary";
        btnFx.textContent = "APPLY LOOP FX";
        btnFx.title = "Apply continuous effect (stacks with In and Out presets)";
        btnFx.addEventListener("click", function () { applyPreset(preset, "fx"); });
        actions.appendChild(btnFx);
      } else if (preset.isCounter) {
        var btnCounter = document.createElement("button");
        btnCounter.type = "button";
        btnCounter.className = "apply-btn btn-primary";
        btnCounter.textContent = "APPLY COUNTER";
        btnCounter.title = "Animate Source Text number from 0 to target value";
        btnCounter.addEventListener("click", function () { applyPreset(preset, "counter"); });
        actions.appendChild(btnCounter);
      } else if (preset.isTerminal) {
        var btnTerm = document.createElement("button");
        btnTerm.type = "button";
        btnTerm.className = "apply-btn btn-primary";
        btnTerm.textContent = "APPLY TERMINAL";
        btnTerm.title = "Type out text with a blinking cursor";
        btnTerm.addEventListener("click", function () { applyPreset(preset, "terminal"); });
        actions.appendChild(btnTerm);
      } else {
        var btnIn = document.createElement("button");
        btnIn.type = "button";
        btnIn.className = "apply-btn btn-primary";
        btnIn.textContent = "IN";
        btnIn.title = "Apply as In animation with draggable In marker";
        btnIn.addEventListener("click", function () { applyPreset(preset, "in"); });

        var btnOut = document.createElement("button");
        btnOut.type = "button";
        btnOut.className = "apply-btn btn-out";
        btnOut.textContent = "OUT";
        btnOut.title = "Apply as Out animation with draggable Out marker";
        btnOut.addEventListener("click", function () { applyPreset(preset, "out"); });

        var btnBoth = document.createElement("button");
        btnBoth.type = "button";
        btnBoth.className = "apply-btn btn-both";
        btnBoth.textContent = "BOTH";
        btnBoth.title = "Apply both In and Out animations";
        btnBoth.addEventListener("click", function () { applyPreset(preset, "both"); });

        actions.appendChild(btnIn);
        actions.appendChild(btnOut);
        actions.appendChild(btnBoth);
      }

      meta.appendChild(title);
      meta.appendChild(actions);

      card.appendChild(previewWrap);
      card.appendChild(meta);

      // Hover & keyboard focus preview triggers
      card.addEventListener("mouseenter", function () {
        if (!state.autoPlayAll) startCardPreview(card, preset);
      });
      card.addEventListener("mouseleave", function () {
        if (!state.autoPlayAll) stopCardPreview(card, preset);
      });
      stage.addEventListener("focus", function () {
        if (!state.autoPlayAll) startCardPreview(card, preset);
      });
      stage.addEventListener("blur", function () {
        if (!state.autoPlayAll) stopCardPreview(card, preset);
      });

      elGrid.appendChild(card);

      if (state.autoPlayAll && !prefersReducedMotion) {
        startCardPreview(card, preset);
      }
    });
  }

  function toggleFavorite(id) {
    var idx = state.favorites.indexOf(id);
    if (idx === -1) {
      state.favorites.push(id);
    } else {
      state.favorites.splice(idx, 1);
    }
    saveFavorites();
    renderGrid();
  }

  // ==================== EXTENDSCRIPT BRIDGE ====================
  function buildPayload(preset, direction) {
    var duration = state.settings.duration > 0 ? state.settings.duration : preset.defaultDuration;
    var stagger = state.settings.stagger >= 0 ? state.settings.stagger : preset.defaultStagger;
    var basedOn = state.settings.basedOn !== "auto" ? state.settings.basedOn : preset.defaultBasedOn;

    return {
      id: preset.id,
      name: preset.name,
      direction: direction, // "in" | "out" | "both"
      duration: duration,
      stagger: stagger,
      overshoot: preset.defaultOvershoot || 0,
      basedOn: basedOn, // "chars" | "words" | "lines"
      reverse: !!state.settings.reverse,
      ae: preset.ae
    };
  }

  function applyPreset(preset, direction) {
    var payload = buildPayload(preset, direction);
    var encoded = JSON.stringify(payload);
    // Escape backslashes and single quotes for safe evalScript call
    var safeStr = encoded.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    setStatus("Applying " + preset.name + " (" + direction.toUpperCase() + ")...", "");

    csInterface.evalScript("TextComposer_applyPreset('" + safeStr + "')", function (rawResult) {
      handleHostResponse(rawResult);
    });
  }

  function clearSelectedLayers() {
    setStatus("Clearing Text Composer animations...", "");
    csInterface.evalScript("TextComposer_clearSelected()", function (rawResult) {
      handleHostResponse(rawResult);
    });
  }

  function handleHostResponse(rawResult) {
    if (!rawResult || rawResult === "EvalScript error.") {
      setStatus("ExtendScript error. Check that After Effects has an active comp.", "err");
      return;
    }
    try {
      var res = JSON.parse(rawResult);
      if (res.ok) {
        setStatus(res.message || "Done.", res.previewMode ? "warn" : "ok");
      } else {
        setStatus(res.message || "Could not apply preset.", "warn");
      }
    } catch (e) {
      setStatus(String(rawResult), "warn");
    }
  }

  // ==================== SETTINGS & EVENTS ====================
  function updateSettingsSummary() {
    var durText = state.settings.duration > 0 ? state.settings.duration.toFixed(2) + "s" : "Auto Dur";
    var unitMap = { auto: "Auto Unit", chars: "Chars", words: "Words", lines: "Lines" };
    var parts = [durText, unitMap[state.settings.basedOn]];
    if (state.settings.reverse) parts.push("Rev");
    elSettingsSummary.textContent = parts.join(" \u00B7 ");
  }

  elSearch.addEventListener("input", function () {
    state.search = elSearch.value;
    elClearSearch.classList.toggle("hidden", !state.search);
    renderGrid();
  });

  elClearSearch.addEventListener("click", function () {
    elSearch.value = "";
    state.search = "";
    elClearSearch.classList.add("hidden");
    renderGrid();
  });

  elBtnFavFilter.addEventListener("click", function () {
    state.favoritesOnly = !state.favoritesOnly;
    elBtnFavFilter.classList.toggle("active", state.favoritesOnly);
    elBtnFavFilter.setAttribute("aria-pressed", state.favoritesOnly ? "true" : "false");
    renderGrid();
  });

  elBtnAutoPlay.addEventListener("click", function () {
    state.autoPlayAll = !state.autoPlayAll;
    elBtnAutoPlay.classList.toggle("active", state.autoPlayAll);
    elBtnAutoPlay.setAttribute("aria-pressed", state.autoPlayAll ? "true" : "false");
    renderGrid();
  });

  elBtnClearLayer.addEventListener("click", clearSelectedLayers);

  elBtnResetFilters.addEventListener("click", function () {
    state.category = "all";
    state.search = "";
    state.favoritesOnly = false;
    elSearch.value = "";
    elClearSearch.classList.add("hidden");
    elBtnFavFilter.classList.remove("active");
    renderCategories();
    renderGrid();
  });

  elBtnToggleSettings.addEventListener("click", function () {
    var expanded = elBtnToggleSettings.getAttribute("aria-expanded") === "true";
    elBtnToggleSettings.setAttribute("aria-expanded", String(!expanded));
    elDrawerBody.classList.toggle("hidden", expanded);
  });

  elOptBasedOn.addEventListener("change", function () {
    state.settings.basedOn = elOptBasedOn.value;
    updateSettingsSummary();
  });

  elOptDuration.addEventListener("input", function () {
    var v = parseFloat(elOptDuration.value);
    state.settings.duration = v;
    elValDuration.textContent = v > 0 ? v.toFixed(2) + "s" : "Auto";
    updateSettingsSummary();
  });

  elOptStagger.addEventListener("input", function () {
    var v = parseInt(elOptStagger.value, 10);
    state.settings.stagger = v;
    elValStagger.textContent = v >= 0 ? v + "%" : "Auto";
    updateSettingsSummary();
  });

  elOptReverse.addEventListener("change", function () {
    state.settings.reverse = elOptReverse.checked;
    updateSettingsSummary();
  });

  // ==================== GITHUB 1-CLICK AUTO-UPDATER ====================
  function loadToken() {
    try {
      return (localStorage.getItem(STORAGE_TOKEN) || "").trim();
    } catch (e) {
      return "";
    }
  }

  function saveToken(val) {
    try {
      var clean = String(val || "").trim();
      if (clean) localStorage.setItem(STORAGE_TOKEN, clean);
      else localStorage.removeItem(STORAGE_TOKEN);
    } catch (e) {}
  }

  function isRepoConfigured() {
    return config.githubRepo && config.githubRepo.indexOf("YOUR_USERNAME") === -1 && config.githubRepo.indexOf("/") !== -1;
  }

  function compareSemver(a, b) {
    var pa = String(a || "0.0.0").split(".").map(Number);
    var pb = String(b || "0.0.0").split(".").map(Number);
    for (var i = 0; i < 3; i++) {
      var na = pa[i] || 0;
      var nb = pb[i] || 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  }

  function fetchRepoFile(relPath) {
    var token = loadToken();
    var branch = config.branch || "main";
    if (token) {
      var apiUrl = "https://api.github.com/repos/" + config.githubRepo + "/contents/" + relPath + "?ref=" + encodeURIComponent(branch) + "&t=" + Date.now();
      return fetch(apiUrl, {
        headers: {
          "Authorization": "Bearer " + token,
          "Accept": "application/vnd.github.raw+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      });
    }
    var rawUrl = "https://raw.githubusercontent.com/" + config.githubRepo + "/" + branch + "/" + relPath + "?t=" + Date.now();
    return fetch(rawUrl);
  }

  function getNodeRequire() {
    if (window.cep_node && typeof window.cep_node.require === "function") return window.cep_node.require;
    if (typeof window.require === "function") return window.require;
    return null;
  }

  function checkForUpdates(silent, forceUpdate) {
    if (!isRepoConfigured()) {
      if (!silent) {
        setStatus("Set your GitHub repo in client/config.js to enable 1-click updates.", "warn");
      }
      return;
    }

    if (!silent) {
      elBtnUpdate.classList.add("spinning");
      setStatus("Checking GitHub (" + config.githubRepo + ") for updates...", "");
    }

    fetchRepoFile("package.json")
      .then(function (resp) {
        if (!resp.ok) {
          if ((resp.status === 404 || resp.status === 401 || resp.status === 403) && !loadToken()) {
            throw new Error("Private repo: paste your read-only Update Token in Apply Settings.");
          }
          if (resp.status === 401 || resp.status === 403) {
            throw new Error("Invalid or expired Update Token (HTTP " + resp.status + ").");
          }
          throw new Error("HTTP " + resp.status);
        }
        return resp.json();
      })
      .then(function (remotePkg) {
        var remoteVer = remotePkg.version || "1.0.0";
        var hasNewer = compareSemver(remoteVer, config.version) > 0;

        if (hasNewer) {
          pendingRemoteVersion = remoteVer;
          elUpdateDot.classList.remove("hidden");
          elBtnUpdate.title = "Update available: v" + remoteVer + " (click to install)";
          if (elUpdateBanner && elUpdateBannerText) {
            elUpdateBannerText.textContent = "Update v" + remoteVer + " available";
            elUpdateBanner.classList.remove("hidden");
          }
          if (silent) {
            setStatus("Update v" + remoteVer + " is available. Click Install update to apply.", "ok");
          }
        }

        if (silent) return;

        if (!hasNewer && !forceUpdate) {
          elBtnUpdate.classList.remove("spinning");
          setStatus("Nyx Text Composer v" + config.version + " is up to date.", "ok");
          return;
        }

        performUpdate(remoteVer);
      })
      .catch(function (err) {
        if (!silent) {
          elBtnUpdate.classList.remove("spinning");
          setStatus("Update check failed: " + err.message, "err");
        }
      });
  }

  function performUpdate(remoteVer) {
    var nodeReq = getNodeRequire();
    if (!nodeReq || !csInterface.isCEP()) {
      elBtnUpdate.classList.remove("spinning");
      setStatus("Update v" + remoteVer + " available! Open inside After Effects to auto-install.", "warn");
      return;
    }

    var fs = nodeReq("fs");
    var path = nodeReq("path");
    var extRoot = csInterface.getSystemPath("extension");
    if (!extRoot) {
      elBtnUpdate.classList.remove("spinning");
      setStatus("Could not locate extension install folder.", "err");
      return;
    }

    var files = config.updateFiles || [];
    setStatus("Downloading v" + remoteVer + " (" + files.length + " files)...", "");

    Promise.all(
      files.map(function (relPath) {
        return fetchRepoFile(relPath).then(function (r) {
          if (!r.ok) throw new Error("Failed " + relPath + " (HTTP " + r.status + ")");
          return r.text().then(function (txt) {
            return { relPath: relPath, content: txt };
          });
        });
      })
    )
      .then(function (downloaded) {
        downloaded.forEach(function (item) {
          var fullPath = path.join(extRoot, item.relPath);
          var dir = path.dirname(fullPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(fullPath, item.content, "utf8");
        });

        // Hot-reload ExtendScript host file inside After Effects
        var jsxPath = path.join(extRoot, "host", "index.jsx").replace(/\\/g, "/");
        csInterface.evalScript('$.evalFile("' + jsxPath + '")', function () {
          elBtnUpdate.classList.remove("spinning");
          setStatus("Updated to v" + remoteVer + "! Reloading panel...", "ok");
          setTimeout(function () {
            window.location.reload();
          }, 600);
        });
      })
      .catch(function (err) {
        elBtnUpdate.classList.remove("spinning");
        setStatus("Update failed: " + err.message, "err");
      });
  }

  if (elOptGithubToken) {
    elOptGithubToken.value = loadToken();
    elOptGithubToken.addEventListener("change", function () {
      saveToken(elOptGithubToken.value);
      setStatus(elOptGithubToken.value.trim() ? "Update Token saved locally." : "Update Token cleared.", "ok");
    });
  }

  if (elBtnUpdate) {
    elBtnUpdate.addEventListener("click", function (e) {
      if (elOptGithubToken) saveToken(elOptGithubToken.value);
      checkForUpdates(false, !!e.shiftKey);
    });
  }

  if (elBtnInstallUpdate) {
    elBtnInstallUpdate.addEventListener("click", function () {
      if (elOptGithubToken) saveToken(elOptGithubToken.value);
      if (pendingRemoteVersion) {
        elBtnUpdate.classList.add("spinning");
        performUpdate(pendingRemoteVersion);
      } else {
        checkForUpdates(false, false);
      }
    });
  }

  if (elBtnDismissUpdate) {
    elBtnDismissUpdate.addEventListener("click", function () {
      if (elUpdateBanner) elUpdateBanner.classList.add("hidden");
    });
  }

  // ==================== THEME SWITCHER ====================
  function applyTheme(themeId) {
    var valid = { "nyx-plum": 1, "obsidian-amber": 1, "slate-sage": 1, "swiss-paper": 1 };
    var chosen = valid[themeId] ? themeId : "nyx-plum";
    document.documentElement.setAttribute("data-theme", chosen);
    if (elOptTheme) elOptTheme.value = chosen;
    try {
      localStorage.setItem(STORAGE_THEME, chosen);
    } catch (e) {}
  }

  function loadTheme() {
    try {
      return localStorage.getItem(STORAGE_THEME) || "nyx-plum";
    } catch (e) {
      return "nyx-plum";
    }
  }

  if (elOptTheme) {
    elOptTheme.addEventListener("change", function () {
      applyTheme(elOptTheme.value);
      setStatus("Panel theme switched to " + elOptTheme.options[elOptTheme.selectedIndex].text + ".", "ok");
    });
  }

  if (elTabTransitions) {
    elTabTransitions.addEventListener("click", function () {
      state.viewMode = "transitions";
      updateModeTabs();
      renderCategories();
      renderGrid();
    });
  }

  if (elTabLoops) {
    elTabLoops.addEventListener("click", function () {
      state.viewMode = "loops";
      updateModeTabs();
      renderCategories();
      renderGrid();
    });
  }

  // Init
  applyTheme(loadTheme());
  updateModeTabs();
  renderCategories();
  renderGrid();
  updateSettingsSummary();

  if (!csInterface.isCEP()) {
    setStatus("Browser preview mode: hover or focus cards to preview. Open in After Effects to apply.", "warn");
  } else {
    checkForUpdates(true, false);
  }
})();
