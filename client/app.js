(function () {
  "use strict";

  var csInterface = new window.CSInterface();
  var config = window.TEXT_COMPOSER_CONFIG || { version: "1.0.0", githubRepo: "", branch: "main", updateFiles: [] };
  var categories = window.TEXT_COMPOSER_CATEGORIES || [];
  var presets = window.TEXT_COMPOSER_PRESETS || [];

  var STORAGE_FAVS = "tc_favorites_v1";
  var state = {
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
  var elCategoryBar = document.getElementById("categoryBar");
  var elGrid = document.getElementById("presetGrid");
  var elEmpty = document.getElementById("emptyState");
  var elSearch = document.getElementById("searchInput");
  var elClearSearch = document.getElementById("btnClearSearch");
  var elBtnFavFilter = document.getElementById("btnFavFilter");
  var elBtnAutoPlay = document.getElementById("btnAutoPlay");
  var elBtnUpdate = document.getElementById("btnUpdate");
  var elUpdateDot = document.getElementById("updateDot");
  var elBtnClearLayer = document.getElementById("btnClearLayer");
  var elBtnResetFilters = document.getElementById("btnResetFilters");
  var elBtnToggleSettings = document.getElementById("btnToggleSettings");
  var elDrawerBody = document.getElementById("drawerBody");
  var elSettingsSummary = document.getElementById("settingsSummary");
  var elOptBasedOn = document.getElementById("optBasedOn");
  var elOptDuration = document.getElementById("optDuration");
  var elValDuration = document.getElementById("valDuration");
  var elOptStagger = document.getElementById("optStagger");
  var elValStagger = document.getElementById("valStagger");
  var elOptReverse = document.getElementById("optReverse");
  var elStatusDot = document.getElementById("statusDot");
  var elStatusText = document.getElementById("statusText");

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
    elStatusDot.className = "status-dot" + (level ? " " + level : "");
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
        el.style.color = isLit ? "#ffd61f" : "#f4f4f8";
        opacity = 1;
        break;
      case "outline-fill":
        opacity = 1;
        if (p < 0.5) {
          el.style.color = "transparent";
          el.style.webkitTextStroke = "1.2px #f4f4f8";
        } else {
          el.style.color = "#f4f4f8";
          el.style.webkitTextStroke = "0px transparent";
        }
        break;
      case "highlighter":
        opacity = clamp01(p * 1.4);
        transform = "translate3d(0," + (inv * 6).toFixed(1) + "px,0)";
        el.style.padding = "2px 6px";
        el.style.borderRadius = "3px";
        el.style.color = p > 0.35 ? "#111114" : "#f4f4f8";
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
  function renderCategories() {
    elCategoryBar.innerHTML = "";
    categories.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.className = "cat-pill" + (state.category === cat.id ? " active" : "");
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
    return presets.filter(function (p) {
      if (state.favoritesOnly && state.favorites.indexOf(p.id) === -1) return false;
      if (state.category !== "all" && p.category !== state.category) return false;
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
    elCount.textContent = list.length + " Preset" + (list.length === 1 ? "" : "s");

    if (list.length === 0) {
      elEmpty.classList.remove("hidden");
      return;
    }
    elEmpty.classList.add("hidden");

    list.forEach(function (preset) {
      var card = document.createElement("div");
      card.className = "preset-card";

      // Stage
      var stage = document.createElement("div");
      stage.className = "preview-stage";
      stage.title = "Click to apply IN animation";
      stage.appendChild(buildPreviewSpans(preset));

      if (preset.ae && preset.ae.perChar3D) {
        var badge = document.createElement("span");
        badge.className = "badge-3d";
        badge.textContent = "3D";
        stage.appendChild(badge);
      } else if (preset.isLoop) {
        var badgeFx = document.createElement("span");
        badgeFx.className = "badge-fx";
        badgeFx.textContent = "LOOP";
        stage.appendChild(badgeFx);
      } else if (preset.isCounter) {
        var badgeNum = document.createElement("span");
        badgeNum.className = "badge-num";
        badgeNum.textContent = "DATA";
        stage.appendChild(badgeNum);
      }

      // Favorite star
      var isFav = state.favorites.indexOf(preset.id) !== -1;
      var favBtn = document.createElement("button");
      favBtn.className = "fav-btn" + (isFav ? " is-fav" : "");
      favBtn.title = isFav ? "Remove from Favorites" : "Add to Favorites";
      favBtn.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M8 1.4l2.06 4.18 4.61.67-3.34 3.25.79 4.6L8 11.93 3.88 14.1l.79-4.6L1.33 6.25l4.61-.67L8 1.4z"/></svg>';
      favBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleFavorite(preset.id);
      });
      stage.appendChild(favBtn);

      // Clicking stage applies default mode
      stage.addEventListener("click", function () {
        if (preset.isLoop) applyPreset(preset, "fx");
        else if (preset.isCounter) applyPreset(preset, "counter");
        else applyPreset(preset, "in");
      });

      // Card Meta & Buttons
      var meta = document.createElement("div");
      meta.className = "card-meta";

      var titleRow = document.createElement("div");
      titleRow.className = "card-title-row";
      var title = document.createElement("div");
      title.className = "card-title";
      title.textContent = preset.name;
      titleRow.appendChild(title);

      var actions = document.createElement("div");
      actions.className = "card-actions" + (preset.isLoop || preset.isCounter ? " single-action" : "");

      if (preset.isLoop) {
        var btnFx = document.createElement("button");
        btnFx.className = "apply-btn btn-fx";
        btnFx.textContent = "APPLY LOOP FX";
        btnFx.title = "Apply continuous effect (stacks with IN and OUT presets)";
        btnFx.addEventListener("click", function () { applyPreset(preset, "fx"); });
        actions.appendChild(btnFx);
      } else if (preset.isCounter) {
        var btnCounter = document.createElement("button");
        btnCounter.className = "apply-btn btn-counter";
        btnCounter.textContent = "APPLY COUNTER";
        btnCounter.title = "Animate Source Text number from 0 to target value";
        btnCounter.addEventListener("click", function () { applyPreset(preset, "counter"); });
        actions.appendChild(btnCounter);
      } else {
        var btnIn = document.createElement("button");
        btnIn.className = "apply-btn btn-in";
        btnIn.textContent = "IN";
        btnIn.title = "Apply as IN animation (anchored to layer In Point)";
        btnIn.addEventListener("click", function () { applyPreset(preset, "in"); });

        var btnOut = document.createElement("button");
        btnOut.className = "apply-btn btn-out";
        btnOut.textContent = "OUT";
        btnOut.title = "Apply as OUT animation (anchored to layer Out Point)";
        btnOut.addEventListener("click", function () { applyPreset(preset, "out"); });

        var btnBoth = document.createElement("button");
        btnBoth.className = "apply-btn btn-both";
        btnBoth.textContent = "BOTH";
        btnBoth.title = "Apply both IN and OUT animations";
        btnBoth.addEventListener("click", function () { applyPreset(preset, "both"); });

        actions.appendChild(btnIn);
        actions.appendChild(btnOut);
        actions.appendChild(btnBoth);
      }

      meta.appendChild(titleRow);
      meta.appendChild(actions);

      card.appendChild(stage);
      card.appendChild(meta);

      // Hover preview triggers
      card.addEventListener("mouseenter", function () {
        if (!state.autoPlayAll) {
          startCardPreview(card, preset);
        }
      });
      card.addEventListener("mouseleave", function () {
        if (!state.autoPlayAll) {
          stopCardPreview(card, preset);
        }
      });

      elGrid.appendChild(card);

      if (state.autoPlayAll) {
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
    renderGrid();
  });

  elBtnAutoPlay.addEventListener("click", function () {
    state.autoPlayAll = !state.autoPlayAll;
    elBtnAutoPlay.classList.toggle("active", state.autoPlayAll);
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

  function getRawUrl(relPath) {
    return "https://raw.githubusercontent.com/" + config.githubRepo + "/" + (config.branch || "main") + "/" + relPath + "?t=" + Date.now();
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

    fetch(getRawUrl("package.json"))
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.json();
      })
      .then(function (remotePkg) {
        var remoteVer = remotePkg.version || "1.0.0";
        var hasNewer = compareSemver(remoteVer, config.version) > 0;

        if (hasNewer) {
          elUpdateDot.classList.remove("hidden");
          elBtnUpdate.title = "Update available: v" + remoteVer + " (click to install)";
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
        return fetch(getRawUrl(relPath)).then(function (r) {
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

  if (elBtnUpdate) {
    elBtnUpdate.addEventListener("click", function (e) {
      checkForUpdates(false, !!e.shiftKey);
    });
  }

  // Init
  renderCategories();
  renderGrid();
  updateSettingsSummary();

  if (!csInterface.isCEP()) {
    setStatus("Browser Preview Mode — hover cards to preview. Install in AE to apply.", "warn");
  } else {
    checkForUpdates(true, false);
  }
})();
