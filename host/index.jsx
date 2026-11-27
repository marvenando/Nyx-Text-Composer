/**
 * Text Composer - After Effects ExtendScript Host Engine (ES3 Compatible)
 * Supports After Effects 2021 - 2026+ (JavaScript & Legacy Expression Engines).
 *
 * Non-destructive architecture:
 *  - [TC IN] / [TC OUT] Text Animators + Expression Selectors anchored to inPoint / outPoint.
 *  - [TC FX] Continuous Loop / Wiggle / Wave / Hue modifiers (stack with IN & OUT).
 *  - [TC NUM] Expression-driven Number Counter / Odometer on Source Text.
 *  - [TC BG] Auto-sizing parented Shape Layers (Box, Highlighter, Underline).
 *  - [TC Mask] Dynamic auto-sizing Mask for Mask Reveal presets.
 */

var TC_PREFIX_IN = "[TC IN]";
var TC_PREFIX_OUT = "[TC OUT]";
var TC_PREFIX_FX = "[TC FX]";
var TC_PREFIX_NUM = "[TC NUM]";
var TC_PREFIX_TERM = "[TC TERM]";
var TC_PREFIX_EFX = "[TC EFX]";
var TC_PREFIX_BG = "[TC BG]";
var TC_PREFIX_RGB = "[TC RGB]";
var TC_MASK_NAME = "[TC Mask]";

// ==================== ES3 SAFE JSON HELPERS ====================
function tc_escapeStr(s) {
    return String(s)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n");
}

function tc_jsonResponse(ok, message) {
    return '{"ok":' + (ok ? "true" : "false") + ',"message":"' + tc_escapeStr(message) + '"}';
}

function tc_parseJSON(str) {
    return eval("(" + str + ")");
}

// ==================== CLEANUP HELPERS ====================
function tc_removeByPrefix(layer, prefix) {
    var textProp = layer.property("ADBE Text Properties");
    if (textProp) {
        var animators = textProp.property("ADBE Text Animators");
        if (animators) {
            for (var i = animators.numProperties; i >= 1; i--) {
                var a = animators.property(i);
                if (a && a.name.indexOf(prefix) === 0) {
                    a.remove();
                }
            }
        }
    }

    var effects = layer.property("ADBE Effect Parade");
    if (effects) {
        for (var j = effects.numProperties; j >= 1; j--) {
            var ef = effects.property(j);
            if (ef && ef.name.indexOf(prefix) === 0) {
                ef.remove();
            }
        }
    }
}

function tc_removeMask(layer) {
    var masks = layer.property("ADBE Mask Parade");
    if (!masks) return;
    for (var i = masks.numProperties; i >= 1; i--) {
        var m = masks.property(i);
        if (m && m.name === TC_MASK_NAME) {
            m.remove();
        }
    }
}

// ==================== TIMELINE MARKERS ("In" / "Out") ====================
function tc_ensureMarker(layer, commentName, targetTime) {
    var mProp = layer.property("ADBE Marker");
    if (!mProp) return;
    for (var i = 1; i <= mProp.numKeys; i++) {
        var mv = mProp.keyValue(i);
        if (mv && mv.comment === commentName) {
            return; // Keep user's existing marker timing when swapping presets
        }
    }
    var minT = layer.inPoint + 0.05;
    var maxT = Math.max(minT, layer.outPoint - 0.05);
    var t = targetTime < minT ? minT : (targetTime > maxT ? maxT : targetTime);
    mProp.setValueAtTime(t, new MarkerValue(commentName));
}

function tc_removeMarker(layer, commentName) {
    var mProp = layer.property("ADBE Marker");
    if (!mProp) return;
    for (var i = mProp.numKeys; i >= 1; i--) {
        var mv = mProp.keyValue(i);
        if (mv && mv.comment === commentName) {
            mProp.removeKey(i);
        }
    }
}

function tc_removeLinkedBg(comp, layer) {
    for (var i = comp.numLayers; i >= 1; i--) {
        var l = comp.layer(i);
        if (l && l.parent === layer && l.name.indexOf(TC_PREFIX_BG) === 0) {
            l.remove();
        }
    }
}

function tc_clearCounter(layer) {
    try {
        var src = layer.property("ADBE Text Properties").property("ADBE Text Document");
        if (src && src.expression && (src.expression.indexOf("/*TC_COUNTER*/") !== -1 || src.expression.indexOf("/*TC_TERMINAL*/") !== -1)) {
            src.expression = "";
        }
    } catch (e) {}
    tc_removeByPrefix(layer, TC_PREFIX_NUM);
    tc_removeByPrefix(layer, TC_PREFIX_TERM);
}

function tc_hasAnyMaskPreset(layer) {
    var textProp = layer.property("ADBE Text Properties");
    if (!textProp) return false;
    var animators = textProp.property("ADBE Text Animators");
    if (!animators) return false;
    for (var i = 1; i <= animators.numProperties; i++) {
        if (animators.property(i).name.indexOf("[M]") !== -1) {
            return true;
        }
    }
    return false;
}

// ==================== EFFECT CONTROLS ====================
function tc_addSlider(effects, name, val) {
    var s = effects.addProperty("ADBE Slider Control");
    s.name = name;
    var p = s.property("ADBE Slider Control-0001") || s.property(1);
    if (p) p.setValue(val);
    return s;
}

function tc_addCheckbox(effects, name, checked) {
    var c = effects.addProperty("ADBE Checkbox Control");
    c.name = name;
    var p = c.property("ADBE Checkbox Control-0001") || c.property(1);
    if (p) p.setValue(checked ? 1 : 0);
    return c;
}

function tc_addColor(effects, name, rgba) {
    var col = effects.addProperty("ADBE Color Control");
    col.name = name;
    var p = col.property("ADBE Color Control-0001") || col.property(1);
    if (p) p.setValue(rgba);
    return col;
}

function tc_setExprSelector(expSel, basedOnCode, exprStr) {
    var basedOnProp = expSel.property("ADBE Text Range Type2") || expSel.property("Based On") || expSel.property(4);
    if (basedOnProp) {
        try { basedOnProp.setValue(basedOnCode); } catch (e) {}
    }
    var amountProp = expSel.property("ADBE Text Expressible Amount") || expSel.property("Amount") || expSel.property(1);
    if (amountProp) {
        amountProp.expression = exprStr;
    }
}

function tc_setAnchorGrouping(layer, basedOn, centerPivot) {
    try {
        var textProp = layer.property("ADBE Text Properties");
        var moreOpts = textProp.property("ADBE Text More Options");
        var grpProp = moreOpts.property("ADBE Text Anchor Point Option");
        if (grpProp) {
            // 1 = Character, 2 = Word, 3 = Line, 4 = All
            var code = 1;
            if (basedOn === "words") code = 2;
            else if (basedOn === "lines") code = 3;
            else if (basedOn === "all") code = 4;
            grpProp.setValue(code);
        }
        var alignProp = moreOpts.property("ADBE Text Anchor Point Align");
        if (alignProp) {
            alignProp.setValue(centerPivot ? [0, -35] : [0, 0]);
        }
    } catch (e) {}
}

function tc_ensureControls(layer, prefix, cfg) {
    var effects = layer.property("ADBE Effect Parade");
    tc_addSlider(effects, prefix + " Duration (s)", cfg.duration);
    tc_addSlider(effects, prefix + " Stagger (%)", cfg.stagger);
    tc_addSlider(effects, prefix + " Overshoot", cfg.overshoot);
    tc_addCheckbox(effects, prefix + " Reverse Order", cfg.reverse);
    if (cfg.ae && cfg.ae.accentColor) {
        tc_addColor(effects, prefix + " Accent Color", cfg.ae.accentColor);
    }
}

// ==================== AUTO-SIZING MASK ====================
function tc_ensureMask(layer) {
    tc_removeMask(layer);
    var masks = layer.property("ADBE Mask Parade");
    if (!masks) return;

    var mask = masks.addProperty("ADBE Mask Atom");
    mask.name = TC_MASK_NAME;
    mask.maskMode = MaskMode.ADD;

    var maskPath = mask.property("ADBE Mask Shape");
    var maskExpr = [
        "var midT = inPoint + Math.max(0.01, (outPoint - inPoint) * 0.5);",
        "var r = sourceRectAtTime(midT, false);",
        "var padX = 28;",
        "var padY = 12;",
        "var l = r.left - padX;",
        "var t = r.top - padY;",
        "var ri = r.left + r.width + padX;",
        "var b = r.top + r.height + padY;",
        "createPath([[l, t], [ri, t], [ri, b], [l, b]], [], [], true);"
    ].join("\n");

    maskPath.expression = maskExpr;
}

// ==================== AUTO-SIZING LINKED SHAPE (BOX / HIGHLIGHTER / UNDERLINE) ====================
function tc_ensureBgShape(comp, layer, shapeType, bgColor, direction) {
    tc_removeLinkedBg(comp, layer);

    var shape = comp.layers.addShape();
    shape.name = TC_PREFIX_BG + " " + shapeType.toUpperCase() + " - " + layer.name;
    shape.inPoint = layer.inPoint;
    shape.outPoint = layer.outPoint;
    if (shapeType === "wipeBlock") {
        shape.moveBefore(layer);
    } else {
        shape.moveAfter(layer);
    }
    shape.parent = layer;

    // Reset child transform cleanly so scaled, rotated, or 3D text layers stay pixel-aligned
    var tr = shape.property("ADBE Transform Group");
    if (layer.threeDLayer) {
        shape.threeDLayer = true;
        try { tr.property("ADBE Anchor Point").setValue([0, 0, 0]); } catch (e) {}
        try { tr.property("ADBE Position").setValue([0, 0, shapeType === "wipeBlock" ? -1 : 1]); } catch (e) {}
        try { tr.property("ADBE Scale").setValue([100, 100, 100]); } catch (e) {}
        try { tr.property("ADBE Orientation").setValue([0, 0, 0]); } catch (e) {}
        try { tr.property("ADBE Rotate X").setValue(0); } catch (e) {}
        try { tr.property("ADBE Rotate Y").setValue(0); } catch (e) {}
        try { tr.property("ADBE Rotate Z").setValue(0); } catch (e) {}
    } else {
        try { tr.property("ADBE Anchor Point").setValue([0, 0]); } catch (e) {}
        try { tr.property("ADBE Position").setValue([0, 0]); } catch (e) {}
        try { tr.property("ADBE Scale").setValue([100, 100]); } catch (e) {}
        try { tr.property("ADBE Rotate Z").setValue(0); } catch (e) {}
    }

    var effects = shape.property("ADBE Effect Parade");
    tc_addColor(effects, TC_PREFIX_BG + " Color", bgColor || [0.90, 0.34, 0.28, 1]);
    var defPadX = (shapeType === "underline" || shapeType === "horizon") ? 4 : (shapeType === "box" ? 36 : 26);
    var defPadY = shapeType === "horizon" ? 2 : (shapeType === "underline" ? 4 : (shapeType === "box" ? 18 : 14));
    tc_addSlider(effects, TC_PREFIX_BG + " Pad X", defPadX);
    tc_addSlider(effects, TC_PREFIX_BG + " Pad Y", defPadY);

    var contents = shape.property("ADBE Root Vectors Group");
    var grp = contents.addProperty("ADBE Vector Group");
    grp.name = "Auto Shape";

    var grpContents = grp.property("ADBE Vectors Group");

    var useIn = (direction === "in" || direction === "both");
    var useOut = (direction === "out" || direction === "both");

    // Shared progress expression snippet (s in [0..1], synced to parent In / Out markers)
    var progLines = [
        "var p = thisLayer.parent;",
        "var midT = p.inPoint + Math.max(0.01, (p.outPoint - p.inPoint) * 0.5);",
        "var r = p.sourceRectAtTime(midT, false);",
        'var padX = effect("' + TC_PREFIX_BG + ' Pad X")("Slider");',
        'var padY = effect("' + TC_PREFIX_BG + ' Pad Y")("Slider");',
        "var s = 1;"
    ];
    if (useIn) {
        progLines.push('var dIn = 0.6; try { dIn = Math.max(0.05, p.effect("' + TC_PREFIX_IN + ' Duration (s)")("Slider")); } catch(e) {}');
        progLines.push('try { dIn = Math.max(0.05, p.marker.key("In").time - p.inPoint); } catch(e) {}');
        progLines.push("var tIn = clamp((time - p.inPoint) / (dIn * 0.8), 0, 1);");
        progLines.push("var eIn = (tIn >= 1) ? 1 : (tIn <= 0 ? 0 : 1 - Math.pow(2, -10 * tIn));");
        progLines.push("s *= eIn;");
    }
    if (useOut) {
        progLines.push('var dOut = 0.6; try { dOut = Math.max(0.05, p.effect("' + TC_PREFIX_OUT + ' Duration (s)")("Slider")); } catch(e) {}');
        progLines.push('try { dOut = Math.max(0.05, p.outPoint - p.marker.key("Out").time); } catch(e) {}');
        progLines.push("var tOut = clamp((time - (p.outPoint - dOut)) / (dOut * 0.8), 0, 1);");
        progLines.push("var eOut = 1 - ((tOut >= 1) ? 1 : (tOut <= 0 ? 0 : 1 - Math.pow(2, -10 * tOut)));");
        progLines.push("s *= eOut;");
    }

    if (shapeType === "brackets") {
        // Real open [  ] HUD Corner Brackets using two open vector paths (constant stroke width, no scaling distortion)
        grpContents.addProperty("ADBE Vector Shape - Group").name = "Left Bracket";
        grpContents.addProperty("ADBE Vector Shape - Group").name = "Right Bracket";
        grpContents.addProperty("ADBE Vector Graphic - Stroke");

        var leftPath = grpContents.property("Left Bracket").property("ADBE Vector Shape");
        var rightPath = grpContents.property("Right Bracket").property("ADBE Vector Shape");
        var bStroke = grpContents.property("ADBE Vector Graphic - Stroke");
        bStroke.property("ADBE Vector Stroke Color").expression = 'effect("' + TC_PREFIX_BG + ' Color")("Color")';
        bStroke.property("ADBE Vector Stroke Width").setValue(4);
        bStroke.property("ADBE Vector Stroke Opacity").expression = progLines.concat([
            "clamp(s * 3.5, 0, 1) * 100;"
        ]).join("\n");

        var brCommon = progLines.concat([
            "var xL = r.left - padX;",
            "var xR = r.left + r.width + padX;",
            "var yT = r.top - padY;",
            "var yB = r.top + r.height + padY;",
            "var cx = r.left + r.width * 0.5;",
            "var arm = Math.min(22, (xR - xL) * 0.2);",
            "var curL = cx - (cx - xL) * (0.25 + 0.75 * s);",
            "var curR = cx + (xR - cx) * (0.25 + 0.75 * s);"
        ]);

        leftPath.expression = brCommon.concat([
            "createPath([[curL + arm, yT], [curL, yT], [curL, yB], [curL + arm, yB]], [], [], false);"
        ]).join("\n");

        rightPath.expression = brCommon.concat([
            "createPath([[curR - arm, yT], [curR, yT], [curR, yB], [curR - arm, yB]], [], [], false);"
        ]).join("\n");

        var bTr = grp.property("ADBE Vector Transform Group");
        bTr.property("ADBE Vector Position").setValue([0, 0]);
        bTr.property("ADBE Vector Scale").setValue([100, 100]);

        try {
            shape.selected = false;
            layer.selected = true;
        } catch (e) {}
        return;
    }

    // Add all children first (calling addProperty invalidates prior sibling references in AE)
    grpContents.addProperty("ADBE Vector Shape - Rect");
    grpContents.addProperty("ADBE Vector Graphic - Fill");

    // Re-fetch references cleanly after all addProperty calls
    var rect = grpContents.property("ADBE Vector Shape - Rect");
    var fill = grpContents.property("ADBE Vector Graphic - Fill");
    fill.property("ADBE Vector Fill Color").expression = 'effect("' + TC_PREFIX_BG + ' Color")("Color")';
    if (shapeType === "box") {
        rect.property("ADBE Vector Rect Roundness").setValue(6);
    } else if (shapeType === "highlighter") {
        rect.property("ADBE Vector Rect Roundness").setValue(6);
    } else if (shapeType === "wipeBlock") {
        rect.property("ADBE Vector Rect Roundness").setValue(0);
    } else {
        rect.property("ADBE Vector Rect Roundness").setValue(2);
    }

    var rectSize = rect.property("ADBE Vector Rect Size");
    var rectPos = rect.property("ADBE Vector Rect Position");
    var grpTransform = grp.property("ADBE Vector Transform Group");
    var grpPos = grpTransform.property("ADBE Vector Position");
    var grpScale = grpTransform.property("ADBE Vector Scale");

    if (shapeType === "highlighter" || shapeType === "underline" || shapeType === "box" || shapeType === "horizon") {
        // Direct Rect Size + Rect Position wipe: zero corner distortion, pixel-aligned reveal
        var fullW = "(r.width + padX * 2)";
        var hExpr = (shapeType === "underline" || shapeType === "horizon") ? "Math.max(2, padY)" : "(r.height + padY * 2)";
        var yExpr = (shapeType === "underline" || shapeType === "horizon") ? "(r.top + r.height + 16)" : "(r.top + r.height * 0.5)";

        rectSize.expression = progLines.concat([
            "var w = " + fullW + " * s;",
            "[Math.max(0, w), " + hExpr + "];"
        ]).join("\n");

        if (shapeType === "horizon") {
            // Draws symmetrically outward from horizontal center
            rectPos.expression = progLines.concat([
                "[r.left + r.width * 0.5, " + yExpr + "];"
            ]).join("\n");
        } else {
            rectPos.expression = progLines.concat([
                "var w = " + fullW + " * s;",
                "[r.left - padX + w * 0.5, " + yExpr + "];"
            ]).join("\n");
        }

        grpPos.setValue([0, 0]);
        grpScale.setValue([100, 100]);
    } else if (shapeType === "wipeBlock") {
        // Swiss Block Wipe: expands L->R on first half, retracts L->R on second half (supports IN, OUT, BOTH)
        var wbHead = [
            "var p = thisLayer.parent;",
            "var midT = p.inPoint + Math.max(0.01, (p.outPoint - p.inPoint) * 0.5);",
            "var r = p.sourceRectAtTime(midT, false);",
            'var padX = effect("' + TC_PREFIX_BG + ' Pad X")("Slider");',
            'var padY = effect("' + TC_PREFIX_BG + ' Pad Y")("Slider");',
            "var fullW = r.width + padX * 2;",
            "var leftX = r.left - padX;",
            "var t = 0;"
        ];
        if (useIn) {
            wbHead.push('var dIn = 0.8; try { dIn = Math.max(0.1, p.effect("' + TC_PREFIX_IN + ' Duration (s)")("Slider")); } catch(e) {}');
            wbHead.push('try { dIn = Math.max(0.1, p.marker.key("In").time - p.inPoint); } catch(e) {}');
            wbHead.push("var tIn = clamp((time - p.inPoint) / dIn, 0, 1);");
            wbHead.push("if (tIn > 0 && tIn < 1) t = tIn;");
        }
        if (useOut) {
            wbHead.push('var dOut = 0.8; try { dOut = Math.max(0.1, p.effect("' + TC_PREFIX_OUT + ' Duration (s)")("Slider")); } catch(e) {}');
            wbHead.push('try { dOut = Math.max(0.1, p.outPoint - p.marker.key("Out").time); } catch(e) {}');
            wbHead.push("var tOut = clamp((time - (p.outPoint - dOut)) / dOut, 0, 1);");
            wbHead.push("if (tOut > 0 && tOut < 1) t = tOut;");
        }
        wbHead.push("var easeA = t < 0.5 ? (1 - Math.pow(2, -10 * (t * 2))) : 1;");
        wbHead.push("var easeB = t > 0.5 ? (1 - Math.pow(2, -10 * ((t - 0.5) * 2))) : 0;");
        wbHead.push("var x0 = leftX + fullW * easeB;");
        wbHead.push("var x1 = leftX + fullW * easeA;");
        wbHead.push("var w = (t <= 0 || t >= 1) ? 0 : Math.max(0, x1 - x0);");
        rectSize.expression = wbHead.concat(["[w, r.height + padY * 2];"]).join("\n");
        rectPos.expression = wbHead.concat(["[x0 + w * 0.5, r.top + r.height * 0.5];"]).join("\n");
        grpPos.setValue([0, 0]);
        grpScale.setValue([100, 100]);
    } else {
        // Auto-Boxed Title & HUD Corner Brackets: centered scale-in
        rectSize.expression = [
            "var p = thisLayer.parent;",
            "var midT = p.inPoint + Math.max(0.01, (p.outPoint - p.inPoint) * 0.5);",
            "var r = p.sourceRectAtTime(midT, false);",
            'var padX = effect("' + TC_PREFIX_BG + ' Pad X")("Slider");',
            'var padY = effect("' + TC_PREFIX_BG + ' Pad Y")("Slider");',
            "[r.width + padX * 2, r.height + padY * 2];"
        ].join("\n");
        rectPos.setValue([0, 0]);
        grpPos.expression = [
            "var p = thisLayer.parent;",
            "var midT = p.inPoint + Math.max(0.01, (p.outPoint - p.inPoint) * 0.5);",
            "var r = p.sourceRectAtTime(midT, false);",
            "[r.left + r.width * 0.5, r.top + r.height * 0.5];"
        ].join("\n");
        grpScale.expression = progLines.concat([
            "[s * 100, (0.65 + 0.35 * s) * 100];"
        ]).join("\n");
    }

    // Keep the Text Layer selected instead of the newly created shape layer
    try {
        shape.selected = false;
        layer.selected = true;
    } catch (e) {}
}

// ==================== NATIVE LAYER EFFECTS (INK, HOLOGRAM, CRT, SHADOW) ====================
function tc_applyLayerEffect(layer, fxType) {
    tc_removeByPrefix(layer, TC_PREFIX_EFX);
    var effects = layer.property("ADBE Effect Parade");
    if (!effects) return;

    try {
        if (fxType === "inkStamp" && effects.canAddProperty("ADBE Roughen Edges")) {
            var re = effects.addProperty("ADBE Roughen Edges");
            re.name = TC_PREFIX_EFX + " Ink Edges";
            try { re.property("ADBE Roughen Edges-0002").setValue(2.5); } catch (e) {} // Border
            try { re.property("ADBE Roughen Edges-0003").setValue(1.5); } catch (e) {} // Edge Sharpness
            try { re.property("ADBE Roughen Edges-0005").setValue(40); } catch (e) {}  // Scale
        } else if (fxType === "hologram") {
            if (effects.canAddProperty("ADBE Venetian Blinds")) {
                var vb = effects.addProperty("ADBE Venetian Blinds");
                vb.name = TC_PREFIX_EFX + " Scanlines";
                try { vb.property("ADBE Venetian Blinds-0001").setValue(22); } catch (e) {} // Transition
                try { vb.property("ADBE Venetian Blinds-0002").setValue(90); } catch (e) {} // Direction
                try { vb.property("ADBE Venetian Blinds-0003").setValue(6); } catch (e) {}  // Width
            }
            if (effects.canAddProperty("ADBE Glo2")) {
                var hg = effects.addProperty("ADBE Glo2");
                hg.name = TC_PREFIX_EFX + " Holo Glow";
                try { hg.property("ADBE Glo2-0002").setValue(55); } catch (e) {}  // Threshold
                try { hg.property("ADBE Glo2-0003").setValue(28); } catch (e) {}  // Radius
                try { hg.property("ADBE Glo2-0004").setValue(1.2); } catch (e) {} // Intensity
            }
        } else if (fxType === "crtGlow" && effects.canAddProperty("ADBE Glo2")) {
            var cg = effects.addProperty("ADBE Glo2");
            cg.name = TC_PREFIX_EFX + " CRT Glow";
            try { cg.property("ADBE Glo2-0002").setValue(50); } catch (e) {}
            try { cg.property("ADBE Glo2-0003").setValue(36); } catch (e) {}
            try { cg.property("ADBE Glo2-0004").setValue(1.3); } catch (e) {}
        } else if (fxType === "hardShadow" && effects.canAddProperty("ADBE Drop Shadow")) {
            var ds = effects.addProperty("ADBE Drop Shadow");
            ds.name = TC_PREFIX_EFX + " Hard Shadow";
            try { (ds.property("Shadow Color") || ds.property(1)).setValue([1.0, 0.16, 0.43, 1]); } catch (e) {} // Hot pink #FF2A6D
            try { (ds.property("Opacity") || ds.property(2)).setValue(255); } catch (e) {}
            try { (ds.property("Direction") || ds.property(3)).setValue(135); } catch (e) {}
            try { (ds.property("Distance") || ds.property(4)).setValue(7); } catch (e) {}
            try { (ds.property("Softness") || ds.property(5)).setValue(0); } catch (e) {}
        } else if (fxType === "vhsTracking" || fxType === "vhsBleed") {
            // 1. Horizontal analog tape tracking distortion (Wave Warp)
            if (effects.canAddProperty("ADBE Wave Warp")) {
                var ww = effects.addProperty("ADBE Wave Warp");
                ww.name = TC_PREFIX_EFX + " VHS Warp";
                var wwType = ww.property("Wave Type") || ww.property(1);
                var wwHeight = ww.property("Wave Height") || ww.property(2);
                var wwWidth = ww.property("Wave Width") || ww.property(3);
                var wwDir = ww.property("Direction") || ww.property(4);
                var wwSpeed = ww.property("Wave Speed") || ww.property(5);
                try { if (wwType) wwType.setValue(2); } catch (e) {} // 2 = Square (tape tear)
                try { if (wwHeight) wwHeight.setValue(fxType === "vhsTracking" ? 6 : 3); } catch (e) {}
                try { if (wwWidth) wwWidth.setValue(140); } catch (e) {}
                try { if (wwDir) wwDir.setValue(0); } catch (e) {}
                try { if (wwSpeed) wwSpeed.setValue(fxType === "vhsTracking" ? 2.4 : 1.2); } catch (e) {}
            }
            // 2. Subtle CRT/VHS horizontal scanlines
            if (effects.canAddProperty("ADBE Venetian Blinds")) {
                var vhsScan = effects.addProperty("ADBE Venetian Blinds");
                vhsScan.name = TC_PREFIX_EFX + " VHS Scanlines";
                try { vhsScan.property("ADBE Venetian Blinds-0001").setValue(16); } catch (e) {}
                try { vhsScan.property("ADBE Venetian Blinds-0002").setValue(90); } catch (e) {}
                try { vhsScan.property("ADBE Venetian Blinds-0003").setValue(4); } catch (e) {}
            }
            // 3. Continuous retro red/cyan VHS color bleed (works at comp center & edges on all AE GPUs)
            if (effects.canAddProperty("ADBE Drop Shadow")) {
                var bleedDist = fxType === "vhsTracking" ? 6 : 5;
                var vhsRed = effects.addProperty("ADBE Drop Shadow");
                vhsRed.name = TC_PREFIX_EFX + " VHS Red Bleed";
                try { (vhsRed.property("Shadow Color") || vhsRed.property(1)).setValue([1.0, 0.14, 0.34, 1]); } catch (e) {}
                try { (vhsRed.property("Opacity") || vhsRed.property(2)).setValue(185); } catch (e) {}
                try { (vhsRed.property("Direction") || vhsRed.property(3)).setValue(270); } catch (e) {}
                try { (vhsRed.property("Distance") || vhsRed.property(4)).setValue(bleedDist); } catch (e) {}
                try { (vhsRed.property("Softness") || vhsRed.property(5)).setValue(4); } catch (e) {}

                var vhsCyan = effects.addProperty("ADBE Drop Shadow");
                vhsCyan.name = TC_PREFIX_EFX + " VHS Cyan Bleed";
                try { (vhsCyan.property("Shadow Color") || vhsCyan.property(1)).setValue([0.04, 0.88, 1.0, 1]); } catch (e) {}
                try { (vhsCyan.property("Opacity") || vhsCyan.property(2)).setValue(185); } catch (e) {}
                try { (vhsCyan.property("Direction") || vhsCyan.property(3)).setValue(90); } catch (e) {}
                try { (vhsCyan.property("Distance") || vhsCyan.property(4)).setValue(bleedDist); } catch (e) {}
                try { (vhsCyan.property("Softness") || vhsCyan.property(5)).setValue(4); } catch (e) {}
            }
        } else if (fxType === "rottingInk" && effects.canAddProperty("ADBE Roughen Edges")) {
            var rot = effects.addProperty("ADBE Roughen Edges");
            rot.name = TC_PREFIX_EFX + " Rotting Edges";
            try { (rot.property("Border") || rot.property("ADBE Roughen Edges-0002")).setValue(4.5); } catch (e) {}
            try { (rot.property("Edge Sharpness") || rot.property("ADBE Roughen Edges-0003")).setValue(1.2); } catch (e) {}
            try { (rot.property("Fractal Influence") || rot.property("ADBE Roughen Edges-0004")).setValue(1.8); } catch (e) {}
            try { (rot.property("Scale") || rot.property("ADBE Roughen Edges-0005")).setValue(26); } catch (e) {}
            try { (rot.property("Evolution") || rot.property("ADBE Roughen Edges-0008")).expression = "posterizeTime(12);\ntime * 180;"; } catch (e) {}
        } else if (fxType === "analogHorror" || fxType === "boilingDecay") {
            if (effects.canAddProperty("ADBE Turbulent Displace")) {
                var td = effects.addProperty("ADBE Turbulent Displace");
                td.name = TC_PREFIX_EFX + " Analog Displace";
                try { (td.property("Amount") || td.property(2)).setValue(fxType === "boilingDecay" ? 14 : 11); } catch (e) {}
                try { (td.property("Size") || td.property(3)).setValue(fxType === "boilingDecay" ? 16 : 18); } catch (e) {}
                try { (td.property("Evolution") || td.property(6)).expression = "posterizeTime(8);\ntime * 150;"; } catch (e) {}
            }
            if (fxType === "analogHorror" && effects.canAddProperty("ADBE Venetian Blinds")) {
                var aScan = effects.addProperty("ADBE Venetian Blinds");
                aScan.name = TC_PREFIX_EFX + " CCTV Scanlines";
                try { aScan.property("ADBE Venetian Blinds-0001").setValue(20); } catch (e) {}
                try { aScan.property("ADBE Venetian Blinds-0002").setValue(90); } catch (e) {}
                try { aScan.property("ADBE Venetian Blinds-0003").setValue(4); } catch (e) {}
            }
            if (fxType === "boilingDecay" && effects.canAddProperty("ADBE Roughen Edges")) {
                var bd = effects.addProperty("ADBE Roughen Edges");
                bd.name = TC_PREFIX_EFX + " Decay Edges";
                try { (bd.property("Border") || bd.property("ADBE Roughen Edges-0002")).setValue(3.5); } catch (e) {}
                try { (bd.property("Scale") || bd.property("ADBE Roughen Edges-0005")).setValue(28); } catch (e) {}
                try { (bd.property("Evolution") || bd.property("ADBE Roughen Edges-0008")).expression = "posterizeTime(8);\ntime * 140;"; } catch (e) {}
            }
        }
    } catch (e) {}
}

// ==================== CHROMATIC RGB HIT ====================
function tc_applyRgbHit(layer, direction) {
    tc_removeByPrefix(layer, TC_PREFIX_RGB);
    var effects = layer.property("ADBE Effect Parade");
    if (!effects.canAddProperty("ADBE Drop Shadow")) return;

    var useIn = (direction === "in" || direction === "both");
    var useOut = (direction === "out" || direction === "both");

    // Sharp optical impact shudder: spikes on frame 1, oscillates & decays cleanly to 0
    var distLines = ["var amt = 0;"];
    if (useIn) {
        distLines.push('var dIn = 0.48; try { dIn = Math.max(0.05, effect("' + TC_PREFIX_IN + ' Duration (s)")("Slider")); } catch(e) {}');
        distLines.push('try { dIn = Math.max(0.05, marker.key("In").time - inPoint); } catch(e) {}');
        distLines.push("var tIn = clamp((time - inPoint) / dIn, 0, 1);");
        distLines.push("if (tIn > 0 && tIn < 0.92) amt = Math.max(amt, Math.abs(Math.cos(tIn * 36) * Math.exp(-6.5 * tIn)) * 18);");
    }
    if (useOut) {
        distLines.push('var dOut = 0.48; try { dOut = Math.max(0.05, effect("' + TC_PREFIX_OUT + ' Duration (s)")("Slider")); } catch(e) {}');
        distLines.push('try { dOut = Math.max(0.05, outPoint - marker.key("Out").time); } catch(e) {}');
        distLines.push("var tOut = clamp((time - (outPoint - dOut)) / dOut, 0, 1);");
        distLines.push("if (tOut > 0.08 && tOut < 1) amt = Math.max(amt, Math.abs(Math.cos((1 - tOut) * 36) * Math.exp(-6.5 * (1 - tOut))) * 18);");
    }
    var distExpr = distLines.concat(["amt;"]).join("\n");
    var opacExpr = distLines.concat(["amt > 0.5 ? 235 : 0;"]).join("\n");

    try {
        var rgbRed = effects.addProperty("ADBE Drop Shadow");
        rgbRed.name = TC_PREFIX_RGB + " Red Split";
        (rgbRed.property("Shadow Color") || rgbRed.property(1)).setValue([1.0, 0.12, 0.34, 1]);
        (rgbRed.property("Opacity") || rgbRed.property(2)).expression = opacExpr;
        (rgbRed.property("Direction") || rgbRed.property(3)).setValue(270);
        (rgbRed.property("Distance") || rgbRed.property(4)).expression = distExpr;
        (rgbRed.property("Softness") || rgbRed.property(5)).setValue(0);

        var rgbCyan = effects.addProperty("ADBE Drop Shadow");
        rgbCyan.name = TC_PREFIX_RGB + " Cyan Split";
        (rgbCyan.property("Shadow Color") || rgbCyan.property(1)).setValue([0.0, 0.90, 1.0, 1]);
        (rgbCyan.property("Opacity") || rgbCyan.property(2)).expression = opacExpr;
        (rgbCyan.property("Direction") || rgbCyan.property(3)).setValue(90);
        (rgbCyan.property("Distance") || rgbCyan.property(4)).expression = distExpr;
        (rgbCyan.property("Softness") || rgbCyan.property(5)).setValue(0);
    } catch (e) {}
}

// ==================== PER-CHARACTER 3D ====================
function tc_enablePerChar3D(comp, layer) {
    try {
        layer.threeDLayer = true;
        var textProps = layer.property("ADBE Text Properties");
        var animators = textProps.property("ADBE Text Animators");
        var cmdId = app.findMenuCommandId("Enable Per-character 3D");
        if (cmdId && cmdId !== 0) {
            var prevSel = [];
            for (var i = 0; i < comp.selectedLayers.length; i++) {
                prevSel.push(comp.selectedLayers[i]);
            }
            for (var j = 0; j < prevSel.length; j++) {
                prevSel[j].selected = false;
            }
            layer.selected = true;
            var testAnim = animators.addProperty("ADBE Text Animator");
            var can3D = testAnim.property("ADBE Text Animator Properties").canAddProperty("ADBE Text Rotation X");
            testAnim.remove();
            if (!can3D) {
                app.executeCommand(cmdId);
            }
            layer.selected = false;
            for (var k = 0; k < prevSel.length; k++) {
                prevSel[k].selected = true;
            }
        }
    } catch (e) {}
}

// ==================== EXPRESSION GENERATOR ====================
function tc_buildSelectorExpression(prefix, isOut, easeType, randomOrder, centerOut, isKaraoke, alternating) {
    var lines = [];
    lines.push('var dur = Math.max(0.05, effect("' + prefix + ' Duration (s)")("Slider"));');
    if (isOut) {
        lines.push('try { dur = Math.max(0.05, outPoint - marker.key("Out").time); } catch (e) {}');
    } else {
        lines.push('try { dur = Math.max(0.05, marker.key("In").time - inPoint); } catch (e) {}');
    }
    lines.push('var stag = clamp(effect("' + prefix + ' Stagger (%)")("Slider"), 0, 100) / 100;');
    lines.push('var ovr = Math.max(0, effect("' + prefix + ' Overshoot")("Slider")) / 100;');
    lines.push('var rev = effect("' + prefix + ' Reverse Order")("Checkbox") == 1;');
    lines.push("var total = Math.max(1, textTotal);");
    lines.push("var idx = textIndex - 1;");

    if (randomOrder) {
        lines.push("var seed = Math.sin((idx + 1) * 12.9898 + 78.233) * 43758.5453;");
        lines.push("var norm = seed - Math.floor(seed);");
        lines.push("if (rev) norm = 1 - norm;");
    } else if (centerOut) {
        lines.push("var mid = (total - 1) / 2;");
        lines.push("var norm = total > 1 ? Math.abs(idx - mid) / Math.max(0.5, mid) : 0;");
        lines.push("if (rev) norm = 1 - norm;");
    } else {
        lines.push("var norm = total > 1 ? idx / (total - 1) : 0;");
        lines.push("if (rev) norm = 1 - norm;");
    }

    lines.push("var staggerSpan = stag * 0.72;");
    lines.push("var unitDur = Math.max(0.08, 1 - staggerSpan);");

    if (isOut) {
        lines.push("var gT = (time - (outPoint - dur)) / dur;");
        lines.push("var t = clamp((gT - norm * staggerSpan) / unitDur, 0, 1);");
    } else {
        lines.push("var gT = (time - inPoint) / dur;");
        lines.push("var t = clamp((gT - norm * staggerSpan) / unitDur, 0, 1);");
    }

    if (isKaraoke) {
        // Bell-curve pulse per word: pops up & lights up, then settles cleanly back
        lines.push("var p = (t <= 0 || t >= 1) ? 0 : Math.sin(t * Math.PI);");
        lines.push("p * 100;");
        return lines.join("\n");
    }

    if (easeType === "expo") {
        lines.push("var p = (t >= 1) ? 1 : (t <= 0 ? 0 : 1 - Math.pow(2, -10 * t));");
    } else if (easeType === "cubic") {
        lines.push("var p = 1 - Math.pow(1 - t, 3);");
    } else if (easeType === "back") {
        lines.push("var c1 = 1.2 + ovr * 3.2;");
        lines.push("var c3 = c1 + 1;");
        lines.push("var p = (t <= 0) ? 0 : (t >= 1 ? 1 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2));");
    } else if (easeType === "elastic") {
        lines.push("var amp = 1 + ovr * 1.6;");
        lines.push("var p = (t <= 0) ? 0 : (t >= 1 ? 1 : Math.pow(2, -8 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3.2)) * amp + 1);");
    } else if (easeType === "step") {
        lines.push("var p = (t >= 0.5) ? 1 : 0;");
    } else if (easeType === "flicker") {
        lines.push("var s = Math.sin(t * 44 + idx * 5) + Math.cos(t * 21 + idx * 3);");
        lines.push("var p = (t <= 0.01) ? 0 : (t >= 0.99 ? 1 : (s > -0.15 ? 1 : 0));");
    } else if (easeType === "glitch") {
        lines.push("var st = Math.floor(t * 6) / 6;");
        lines.push("var jitter = Math.sin(t * 65 + idx * 11) * 0.18 * (1 - t);");
        lines.push("var p = (t <= 0.01) ? 0 : (t >= 0.99 ? 1 : clamp(st + jitter, 0, 1));");
    } else if (easeType === "posterize12") {
        lines.push("var st12 = Math.floor(t * 5) / 5;");
        lines.push("var p = (t <= 0.01) ? 0 : (t >= 0.99 ? 1 : 1 - Math.pow(1 - st12, 2));");
    } else if (easeType === "impact") {
        lines.push("var p = (t <= 0.01) ? 0 : (t >= 0.99 ? 1 : (t < 0.35 ? 1 - Math.pow(1 - (t / 0.35), 3) : 1 + Math.sin((t - 0.35) * 42) * (0.14 + ovr * 0.25) * Math.exp(-8 * (t - 0.35))));");
    } else if (easeType === "strobe") {
        lines.push("var p = (t <= 0.01) ? 0 : (t >= 0.99 ? 1 : (t < 0.45 ? (Math.floor(t * 16) % 2 == 0 ? 1 : 0) : 1));");
    } else if (easeType === "decode") {
        // Rapidly scramble visible characters through random offsets, then lock cleanly to 0
        lines.push("var frameStep = Math.floor(time * 22);");
        lines.push("var rnd = Math.abs(Math.sin((idx + 1) * 19.7 + frameStep * 12.9898));");
        if (isOut) {
            lines.push("var amt = (t <= 0.02 || t >= 0.95) ? 0 : (0.25 + rnd * 0.75) * 100;");
        } else {
            lines.push("var amt = (t <= 0.02 || t >= 0.95) ? 0 : (0.25 + rnd * 0.75) * 100;");
        }
        lines.push("amt;");
        return lines.join("\n");
    } else {
        lines.push("var p = t;");
    }

    var altMult = alternating ? " * ((idx % 2 == 0) ? 1 : -1)" : "";
    if (isOut) {
        lines.push("p * 100" + altMult + ";");
    } else {
        lines.push("(1 - p) * 100" + altMult + ";");
    }

    return lines.join("\n");
}

function tc_populateAnimatorProps(animProps, props, prefix) {
    if (props.position3D) {
        var p3 = animProps.addProperty("ADBE Text Position 3D");
        p3.setValue(props.position3D);
    } else if (props.position) {
        var p2 = animProps.addProperty("ADBE Text Position 3D");
        p2.setValue([props.position[0], props.position[1]]);
    }

    if (props.scale) {
        var sc = animProps.addProperty("ADBE Text Scale 3D");
        sc.setValue([props.scale[0], props.scale[1]]);
    }

    if (typeof props.opacity === "number") {
        var op = animProps.addProperty("ADBE Text Opacity");
        op.setValue(props.opacity);
    }

    if (typeof props.rotation === "number") {
        var rot = animProps.addProperty("ADBE Text Rotation");
        rot.setValue(props.rotation);
    }

    if (typeof props.rotationX === "number" && animProps.canAddProperty("ADBE Text Rotation X")) {
        var rx = animProps.addProperty("ADBE Text Rotation X");
        rx.setValue(props.rotationX);
    }

    if (typeof props.rotationY === "number" && animProps.canAddProperty("ADBE Text Rotation Y")) {
        var ry = animProps.addProperty("ADBE Text Rotation Y");
        ry.setValue(props.rotationY);
    }

    if (typeof props.skew === "number") {
        var sk = animProps.addProperty("ADBE Text Skew");
        sk.setValue(props.skew);
    }

    if (typeof props.tracking === "number") {
        var tr = animProps.addProperty("ADBE Text Tracking Amount");
        tr.setValue(props.tracking);
    }

    if (props.blur) {
        var bl = animProps.addProperty("ADBE Text Blur");
        bl.setValue([props.blur[0], props.blur[1]]);
    }

    if (typeof props.charOffset === "number") {
        var co = animProps.addProperty("ADBE Text Character Offset");
        co.setValue(props.charOffset);
    }

    if (props.fillColor) {
        var fc = animProps.addProperty("ADBE Text Fill Color");
        fc.setValue(props.fillColor);
        if (prefix) {
            fc.expression = 'effect("' + prefix + ' Accent Color")("Color")';
        }
    }

    if (typeof props.fillHue === "number") {
        var fh = animProps.addProperty("ADBE Text Fill Hue");
        fh.setValue(props.fillHue);
    }

    if (typeof props.fillOpacity === "number") {
        var fo = animProps.addProperty("ADBE Text Fill Opacity");
        fo.setValue(props.fillOpacity);
    }

    if (props.strokeColor) {
        var stc = animProps.addProperty("ADBE Text Stroke Color");
        stc.setValue(props.strokeColor);
    }

    if (typeof props.strokeWidth === "number") {
        var stw = animProps.addProperty("ADBE Text Stroke Width");
        stw.setValue(props.strokeWidth);
    }
}

// ==================== APPLY SINGLE DIRECTION (IN / OUT) ====================
function tc_applyDirection(comp, layer, cfg, isOut) {
    var prefix = isOut ? TC_PREFIX_OUT : TC_PREFIX_IN;
    var ae = cfg.ae || {};
    var props = ae.props || {};

    tc_removeByPrefix(layer, prefix);

    if (ae.perChar3D) {
        tc_enablePerChar3D(comp, layer);
    }

    tc_ensureControls(layer, prefix, cfg);

    // Add draggable timeline marker ("In" or "Out")
    if (isOut) {
        tc_ensureMarker(layer, "Out", layer.outPoint - (cfg.duration || 0.8));
    } else {
        tc_ensureMarker(layer, "In", layer.inPoint + (cfg.duration || 0.8));
    }

    var textProp = layer.property("ADBE Text Properties");
    var animators = textProp.property("ADBE Text Animators");
    var animator = animators.addProperty("ADBE Text Animator");
    animator.name = prefix + " " + cfg.name + (ae.mask ? " [M]" : "");

    var animProps = animator.property("ADBE Text Animator Properties");
    tc_populateAnimatorProps(animProps, props, prefix);

    var selectors = animator.property("ADBE Text Selectors");
    for (var i = selectors.numProperties; i >= 1; i--) {
        selectors.property(i).remove();
    }

    var expSel = selectors.addProperty("ADBE Text Expressible Selector");
    var basedOnCode = 1;
    if (cfg.basedOn === "words") basedOnCode = 3;
    else if (cfg.basedOn === "lines") basedOnCode = 4;

    var needsCenterPivot = !!(ae && ae.centerPivot) ||
        (cfg.id !== "stretch_vertical" && (!!props.scale || typeof props.rotation === "number" || typeof props.rotationX === "number" || typeof props.rotationY === "number"));
    tc_setAnchorGrouping(layer, cfg.basedOn, needsCenterPivot);
    tc_setExprSelector(
        expSel,
        basedOnCode,
        tc_buildSelectorExpression(
            prefix,
            isOut,
            ae.ease || "expo",
            !!ae.randomOrder,
            !!ae.centerOut,
            cfg.id === "social_karaoke_pop",
            !!ae.alternating
        )
    );

    // Companion visibility/fade gate for Decode, CRT Power-On, and Alternating Slice presets
    if (ae.ease === "decode" || ae.visGate || ae.alternating) {
        var visAnim = animators.addProperty("ADBE Text Animator");
        visAnim.name = prefix + " " + cfg.name + " Visibility";
        var visProps = visAnim.property("ADBE Text Animator Properties");
        visProps.addProperty("ADBE Text Opacity").setValue(0);
        var visSels = visAnim.property("ADBE Text Selectors");
        for (var v = visSels.numProperties; v >= 1; v--) {
            visSels.property(v).remove();
        }
        var visSel = visSels.addProperty("ADBE Text Expressible Selector");
        var visExpr;
        if (ae.alternating) {
            visExpr = tc_buildSelectorExpression(prefix, isOut, "expo", !!ae.randomOrder, !!ae.centerOut, false, false);
        } else {
            visExpr = tc_buildSelectorExpression(prefix, isOut, "step", !!ae.randomOrder, !!ae.centerOut, false, false)
                .replace("var p = (t >= 0.5) ? 1 : 0;", isOut ? "var p = (t >= 0.94) ? 1 : 0;" : "var p = (t > 0.02) ? 1 : 0;");
        }
        tc_setExprSelector(visSel, basedOnCode, visExpr);
    }

    if (ae.mask) {
        tc_ensureMask(layer);
    } else if (!tc_hasAnyMaskPreset(layer)) {
        tc_removeMask(layer);
    }
}

// ==================== APPLY CONTINUOUS LOOP / FX ====================
function tc_applyLoopFX(comp, layer, cfg) {
    var ae = cfg.ae || {};
    var props = ae.props || {};
    var mode = ae.loopMode || "wave";

    tc_removeByPrefix(layer, TC_PREFIX_FX);

    if (ae.perChar3D) {
        tc_enablePerChar3D(comp, layer);
    }

    var effects = layer.property("ADBE Effect Parade");
    tc_addSlider(effects, TC_PREFIX_FX + " Speed", ae.loopSpeed || 2);
    tc_addSlider(effects, TC_PREFIX_FX + " Intensity (%)", ae.loopIntensity || 100);

    var textProp = layer.property("ADBE Text Properties");
    var animators = textProp.property("ADBE Text Animators");

    // For Neon Hue Cycle: apply a saturated base fill so white/gray/black text actually shifts color
    if (mode === "hue") {
        var baseAnim = animators.addProperty("ADBE Text Animator");
        baseAnim.name = TC_PREFIX_FX + " Neon Base Fill";
        var baseProps = baseAnim.property("ADBE Text Animator Properties");
        if (baseProps.canAddProperty("ADBE Text Fill Color")) {
            baseProps.addProperty("ADBE Text Fill Color").setValue([1.0, 0.2, 0.45, 1]);
        }
    }

    var animator = animators.addProperty("ADBE Text Animator");
    animator.name = TC_PREFIX_FX + " " + cfg.name;

    var animProps = animator.property("ADBE Text Animator Properties");
    tc_populateAnimatorProps(animProps, props, null);

    var selectors = animator.property("ADBE Text Selectors");
    for (var i = selectors.numProperties; i >= 1; i--) {
        selectors.property(i).remove();
    }

    var expSel = selectors.addProperty("ADBE Text Expressible Selector");
    var basedOnCode = 1;
    if (cfg.basedOn === "words") basedOnCode = 3;
    else if (cfg.basedOn === "lines" || cfg.basedOn === "all") basedOnCode = 4;

    var needsCenterPivot = !!(ae && ae.centerPivot) ||
        (cfg.id !== "stretch_vertical" && (!!props.scale || typeof props.rotation === "number" || typeof props.rotationX === "number" || typeof props.rotationY === "number"));
    tc_setAnchorGrouping(layer, cfg.basedOn, needsCenterPivot);

    var lines = [
        'var spd = Math.max(0.05, effect("' + TC_PREFIX_FX + ' Speed")("Slider"));',
        'var inten = effect("' + TC_PREFIX_FX + ' Intensity (%)")("Slider");',
        "var idx = textIndex - 1;"
    ];

    if (mode === "wiggle") {
        lines.push("var stepT = Math.floor(time * spd);");
        lines.push("var s = Math.sin((idx + 1) * 19.37 + stepT * 12.9898);");
        lines.push("s * inten;");
    } else if (mode === "wave") {
        lines.push("Math.sin(time * spd * 3.14159 + idx * 0.7) * inten;");
    } else if (mode === "drift") {
        lines.push("var prog = clamp((time - inPoint) / Math.max(0.1, outPoint - inPoint), 0, 1);");
        lines.push("prog * spd * inten;");
    } else if (mode === "pulse") {
        lines.push("((Math.sin(time * spd * 3.14159) + 1) * 0.5) * inten;");
    } else if (mode === "hue") {
        lines.push("((time * spd * 0.5 + idx * 0.14) % 1) * inten;");
    } else if (mode === "vhs") {
        lines.push("var gl = Math.sin(time * spd * 9.3) > 0.92 ? 1.8 : 0.45;");
        lines.push("Math.sin(time * spd * 2.1 + idx * 0.4) * gl * inten;");
    } else if (mode === "neonFlicker") {
        lines.push("var n = Math.sin(time * spd * 3.1 + idx * 4.7) + Math.cos(time * spd * 1.9 + idx * 2.3);");
        lines.push("(n < -1.15 ? 0.85 : 0) * inten;");
    } else if (mode === "shimmer") {
        lines.push("var tot = Math.max(1, textTotal - 1);");
        lines.push("var ph = ((time * spd * 0.7) % 1.8) - 0.4;");
        lines.push("var d = Math.abs((idx / tot) - ph);");
        lines.push("Math.max(0, 1 - d * 3.5) * inten;");
    } else if (mode === "ripple") {
        lines.push("((Math.sin(time * spd * 3.14159 + idx * 0.7) + 1) * 0.5) * inten;");
    } else if (mode === "rumble") {
        lines.push("Math.sin(time * spd * 3.7) * Math.cos(time * spd * 2.3) * inten;");
    } else if (mode === "convulse") {
        lines.push("var stepT = Math.floor(time * spd);");
        lines.push("var spike = Math.sin((idx + 1) * 23.1 + stepT * 17.3) * Math.cos((idx + 1) * 11.7 + stepT * 9.1);");
        lines.push("spike * inten;");
    } else if (mode === "fluorescent") {
        lines.push("var fl = Math.sin(time * spd * 2.7) + Math.sin(time * spd * 6.9) * 0.7;");
        lines.push("(fl < -1.05 ? 0.88 : 0) * inten;");
    } else {
        lines.push("Math.sin(time * spd * 3.14159) * inten;");
    }

    tc_setExprSelector(expSel, basedOnCode, lines.join("\n"));
}

// ==================== APPLY NUMBER COUNTER ====================
function tc_applyCounter(layer, cfg) {
    tc_clearCounter(layer);

    var textProp = layer.property("ADBE Text Properties");
    var srcProp = textProp.property("ADBE Text Document");
    var rawText = "";
    try {
        rawText = String(srcProp.value.text);
    } catch (e) {
        rawText = "1000";
    }

    // Parse prefix, number, suffix from current text (e.g. "$10,000" or "98.5%")
    var match = rawText.match(/^([^0-9\-\.]*)([\-]?[0-9,\.]+)(.*)$/);
    var prefix = match ? match[1] : "";
    var numStr = match ? match[2].replace(/,/g, "") : "1000";
    var suffix = match ? match[3] : "";
    var targetVal = parseFloat(numStr);
    if (isNaN(targetVal)) targetVal = 1000;

    var decimals = 0;
    var dotIdx = numStr.indexOf(".");
    if (dotIdx !== -1) {
        decimals = numStr.length - dotIdx - 1;
    }

    var effects = layer.property("ADBE Effect Parade");
    tc_addSlider(effects, TC_PREFIX_NUM + " Duration (s)", cfg.duration || 1.5);
    tc_addSlider(effects, TC_PREFIX_NUM + " Start Value", 0);
    tc_addSlider(effects, TC_PREFIX_NUM + " End Value", targetVal);
    tc_addSlider(effects, TC_PREFIX_NUM + " Decimals", decimals);
    tc_addCheckbox(effects, TC_PREFIX_NUM + " Commas", true);
    tc_ensureMarker(layer, "In", layer.inPoint + (cfg.duration || 1.5));

    var safePre = tc_escapeStr(prefix);
    var safeSuf = tc_escapeStr(suffix);

    var expr = [
        "/*TC_COUNTER*/",
        'var dur = Math.max(0.05, effect("' + TC_PREFIX_NUM + ' Duration (s)")("Slider"));',
        'try { dur = Math.max(0.05, marker.key("In").time - inPoint); } catch (e) {}',
        'var v0 = effect("' + TC_PREFIX_NUM + ' Start Value")("Slider");',
        'var v1 = effect("' + TC_PREFIX_NUM + ' End Value")("Slider");',
        'var dec = Math.max(0, Math.round(effect("' + TC_PREFIX_NUM + ' Decimals")("Slider")));',
        'var useCommas = effect("' + TC_PREFIX_NUM + ' Commas")("Checkbox") == 1;',
        "var t = clamp((time - inPoint) / dur, 0, 1);",
        "var e = (t >= 1) ? 1 : (t <= 0 ? 0 : 1 - Math.pow(2, -10 * t));",
        "var val = v0 + (v1 - v0) * e;",
        "var fixed = val.toFixed(dec);",
        "if (useCommas) {",
        '  var parts = fixed.split(".");',
        '  parts[0] = parts[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");',
        '  fixed = parts.join(".");',
        "}",
        '"' + safePre + '" + fixed + "' + safeSuf + '";'
    ].join("\n");

    srcProp.expression = expr;
}

// ==================== APPLY TERMINAL CURSOR TYPEWRITER ====================
function tc_applyTerminal(layer, cfg) {
    tc_clearCounter(layer);

    var textProp = layer.property("ADBE Text Properties");
    var srcProp = textProp.property("ADBE Text Document");
    var effects = layer.property("ADBE Effect Parade");
    tc_addSlider(effects, TC_PREFIX_TERM + " Duration (s)", cfg.duration || 1.2);
    tc_addSlider(effects, TC_PREFIX_TERM + " Blink Speed (Hz)", 2.5);
    tc_ensureMarker(layer, "In", layer.inPoint + (cfg.duration || 1.2));

    var cursor = (cfg.ae && cfg.ae.cursorChar) ? tc_escapeStr(cfg.ae.cursorChar) : "_";

    var expr = [
        "/*TC_TERMINAL*/",
        'var dur = Math.max(0.05, effect("' + TC_PREFIX_TERM + ' Duration (s)")("Slider"));',
        'try { dur = Math.max(0.05, marker.key("In").time - inPoint); } catch (e) {}',
        'var blinkHz = Math.max(0.2, effect("' + TC_PREFIX_TERM + ' Blink Speed (Hz)")("Slider"));',
        "var full = String(value);",
        "var t = clamp((time - inPoint) / dur, 0, 1);",
        "var count = Math.floor(t * full.length);",
        "var showCur = (Math.floor((time - inPoint) * blinkHz * 2) % 2) == 0;",
        'full.slice(0, count) + (showCur ? "' + cursor + '" : " ");'
    ].join("\n");

    srcProp.expression = expr;
}

// ==================== PUBLIC ENTRYPOINTS ====================
function TextComposer_applyPreset(jsonStr) {
    var comp = app.project ? app.project.activeItem : null;
    if (!comp || !(comp instanceof CompItem)) {
        return tc_jsonResponse(false, "Open a Composition first.");
    }

    var selected = comp.selectedLayers;
    if (!selected || selected.length === 0) {
        return tc_jsonResponse(false, "Select at least one Text Layer.");
    }

    var cfg;
    try {
        cfg = tc_parseJSON(jsonStr);
    } catch (e) {
        return tc_jsonResponse(false, "Invalid preset payload: " + e.toString());
    }

    var textLayers = [];
    for (var i = 0; i < selected.length; i++) {
        if (selected[i] instanceof TextLayer) {
            textLayers.push(selected[i]);
        }
    }

    if (textLayers.length === 0) {
        return tc_jsonResponse(false, "No Text Layers selected. Select a Text Layer and try again.");
    }

    app.beginUndoGroup("Text Composer: " + cfg.name + " (" + cfg.direction.toUpperCase() + ")");
    try {
        for (var j = 0; j < textLayers.length; j++) {
            var layer = textLayers[j];
            var ae = cfg.ae || {};

            if (cfg.direction === "fx") {
                tc_applyLoopFX(comp, layer, cfg);
                if (ae.fxEffect) {
                    tc_applyLayerEffect(layer, ae.fxEffect);
                } else {
                    tc_removeByPrefix(layer, TC_PREFIX_EFX);
                }
            } else if (cfg.direction === "counter") {
                tc_applyCounter(layer, cfg);
            } else if (cfg.direction === "terminal") {
                tc_applyTerminal(layer, cfg);
            } else {
                if (cfg.direction === "in" || cfg.direction === "both") {
                    tc_applyDirection(comp, layer, cfg, false);
                }
                if (cfg.direction === "out" || cfg.direction === "both") {
                    tc_applyDirection(comp, layer, cfg, true);
                }
                if (ae.bgShape) {
                    tc_ensureBgShape(comp, layer, ae.bgShape, ae.bgColor, cfg.direction);
                } else {
                    tc_removeLinkedBg(comp, layer);
                }
                if (ae.rgbHit) {
                    tc_applyRgbHit(layer, cfg.direction);
                } else {
                    tc_removeByPrefix(layer, TC_PREFIX_RGB);
                }
                if (ae.fxEffect) {
                    tc_applyLayerEffect(layer, ae.fxEffect);
                } else {
                    tc_removeByPrefix(layer, TC_PREFIX_EFX);
                }
            }
        }
        app.endUndoGroup();
        return tc_jsonResponse(
            true,
            "Applied '" + cfg.name + "' (" + cfg.direction.toUpperCase() + ") to " +
            textLayers.length + " text layer" + (textLayers.length > 1 ? "s." : ".")
        );
    } catch (err) {
        app.endUndoGroup();
        var lineInfo = err.line ? " (line " + err.line + ")" : "";
        return tc_jsonResponse(false, "Error applying preset" + lineInfo + ": " + err.toString());
    }
}

function TextComposer_clearSelected() {
    var comp = app.project ? app.project.activeItem : null;
    if (!comp || !(comp instanceof CompItem)) {
        return tc_jsonResponse(false, "Open a Composition first.");
    }

    var selected = comp.selectedLayers;
    if (!selected || selected.length === 0) {
        return tc_jsonResponse(false, "Select at least one Text Layer to clear.");
    }

    var count = 0;
    app.beginUndoGroup("Text Composer: Clear Animations");
    try {
        for (var i = 0; i < selected.length; i++) {
            if (selected[i] instanceof TextLayer) {
                tc_removeByPrefix(selected[i], TC_PREFIX_IN);
                tc_removeByPrefix(selected[i], TC_PREFIX_OUT);
                tc_removeByPrefix(selected[i], TC_PREFIX_FX);
                tc_removeByPrefix(selected[i], TC_PREFIX_EFX);
                tc_removeByPrefix(selected[i], TC_PREFIX_RGB);
                tc_removeMask(selected[i]);
                tc_removeMarker(selected[i], "In");
                tc_removeMarker(selected[i], "Out");
                tc_removeLinkedBg(comp, selected[i]);
                tc_clearCounter(selected[i]);
                count++;
            }
        }
        app.endUndoGroup();
        if (count === 0) {
            return tc_jsonResponse(false, "No Text Layers selected.");
        }
        return tc_jsonResponse(
            true,
            "Cleared Text Composer animations from " + count + " text layer" + (count > 1 ? "s." : ".")
        );
    } catch (err) {
        app.endUndoGroup();
        return tc_jsonResponse(false, "Error clearing layer: " + err.toString());
    }
}
