/**
 * Text Composer - Curated Preset Catalog (32 Presets across 8 Categories)
 * Each preset defines both its live UI preview metadata and its After Effects
 * ExtendScript animator parameters.
 */
window.TEXT_COMPOSER_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "mask", label: "Mask Reveal" },
  { id: "overshoot", label: "Overshoot & Slide" },
  { id: "bounce", label: "Pop & Bounce" },
  { id: "fade", label: "Fade & Tracking" },
  { id: "3d", label: "3D Flip" },
  { id: "typewriter", label: "Typewriter" },
  { id: "blur", label: "Blur & Stretch" },
  { id: "glitch", label: "Glitch" },
  { id: "loops", label: "Loops & FX" },
  { id: "social", label: "Social & Captions" },
  { id: "mechanical", label: "Mechanical & Data" },
  { id: "editorial", label: "Editorial & Boxes" },
  { id: "brutalist", label: "Brutalist & Print" },
  { id: "hud", label: "Sci-Fi & HUD" },
  { id: "anime", label: "Anime & Impact" },
  { id: "retro", label: "Retro & VHS" },
  { id: "luxury", label: "Luxury & Fashion" },
  { id: "kinetic", label: "Kinetic Poster" },
  { id: "horror", label: "Horror & Thriller" }
];

window.TEXT_COMPOSER_PRESETS = [
  // ==================== 1. MASK REVEAL ====================
  {
    id: "mask_slide_up",
    name: "Mask Slide Up",
    category: "mask",
    tags: ["clean", "corporate", "title", "reveal", "up"],
    sampleText: "REVEAL",
    defaultDuration: 0.75,
    defaultStagger: 35,
    defaultOvershoot: 0,
    defaultBasedOn: "words",
    preview: { mode: "mask-up", unit: "words", ease: "expo" },
    ae: {
      mask: true,
      ease: "expo",
      props: { position: [0, 120] }
    }
  },
  {
    id: "mask_slide_down",
    name: "Mask Slide Down",
    category: "mask",
    tags: ["clean", "drop", "reveal", "down"],
    sampleText: "DROP IN",
    defaultDuration: 0.75,
    defaultStagger: 35,
    defaultOvershoot: 0,
    defaultBasedOn: "words",
    preview: { mode: "mask-down", unit: "words", ease: "expo" },
    ae: {
      mask: true,
      ease: "expo",
      props: { position: [0, -120] }
    }
  },
  {
    id: "mask_slide_left",
    name: "Mask Slide Left",
    category: "mask",
    tags: ["clean", "swipe", "reveal", "left"],
    sampleText: "SWIPE",
    defaultDuration: 0.8,
    defaultStagger: 25,
    defaultOvershoot: 0,
    defaultBasedOn: "lines",
    preview: { mode: "mask-left", unit: "words", ease: "expo" },
    ae: {
      mask: true,
      ease: "expo",
      props: { position: [220, 0] }
    }
  },
  {
    id: "mask_rise_chars",
    name: "Mask Rise Letters",
    category: "mask",
    tags: ["kinetic", "characters", "smooth", "modern"],
    sampleText: "KINETIC",
    defaultDuration: 0.85,
    defaultStagger: 55,
    defaultOvershoot: 15,
    defaultBasedOn: "chars",
    preview: { mode: "mask-up", unit: "chars", ease: "back" },
    ae: {
      mask: true,
      ease: "back",
      props: { position: [0, 110] }
    }
  },

  // ==================== 2. OVERSHOOT & SLIDE ====================
  {
    id: "overshoot_up",
    name: "Overshoot Up",
    category: "overshoot",
    tags: ["slide", "spring", "smooth", "youtube"],
    sampleText: "SPRING",
    defaultDuration: 0.85,
    defaultStagger: 45,
    defaultOvershoot: 35,
    defaultBasedOn: "chars",
    preview: { mode: "slide-up", unit: "chars", ease: "back" },
    ae: {
      ease: "back",
      props: { position: [0, 90], opacity: 0 }
    }
  },
  {
    id: "overshoot_down",
    name: "Overshoot Drop",
    category: "overshoot",
    tags: ["slide", "drop", "spring", "title"],
    sampleText: "FALL IN",
    defaultDuration: 0.85,
    defaultStagger: 45,
    defaultOvershoot: 35,
    defaultBasedOn: "chars",
    preview: { mode: "slide-down", unit: "chars", ease: "back" },
    ae: {
      ease: "back",
      props: { position: [0, -90], opacity: 0 }
    }
  },
  {
    id: "overshoot_left",
    name: "Whip From Right",
    category: "overshoot",
    tags: ["whip", "fast", "slide", "horizontal"],
    sampleText: "WHIP IN",
    defaultDuration: 0.7,
    defaultStagger: 40,
    defaultOvershoot: 40,
    defaultBasedOn: "words",
    preview: { mode: "slide-left", unit: "words", ease: "back" },
    ae: {
      ease: "back",
      props: { position: [180, 0], opacity: 0, skew: -14 }
    }
  },
  {
    id: "overshoot_skew",
    name: "Skew Slide Rush",
    category: "overshoot",
    tags: ["sport", "fast", "skew", "slant"],
    sampleText: "VELOCITY",
    defaultDuration: 0.75,
    defaultStagger: 45,
    defaultOvershoot: 30,
    defaultBasedOn: "chars",
    preview: { mode: "skew-slide", unit: "chars", ease: "back" },
    ae: {
      ease: "back",
      props: { position: [-140, 0], skew: 24, opacity: 0 }
    }
  },

  // ==================== 3. POP & BOUNCE ====================
  {
    id: "pop_scale_chars",
    name: "Pop In Letters",
    category: "bounce",
    tags: ["pop", "scale", "energetic", "social"],
    sampleText: "POP IN",
    defaultDuration: 0.8,
    defaultStagger: 55,
    defaultOvershoot: 50,
    defaultBasedOn: "chars",
    preview: { mode: "pop", unit: "chars", ease: "back" },
    ae: {
      ease: "back",
      props: { scale: [0, 0], opacity: 0 }
    }
  },
  {
    id: "bounce_elastic",
    name: "Elastic Bounce",
    category: "bounce",
    tags: ["elastic", "bouncy", "playful", "youtube"],
    sampleText: "BOUNCE",
    defaultDuration: 1.0,
    defaultStagger: 50,
    defaultOvershoot: 65,
    defaultBasedOn: "chars",
    preview: { mode: "bounce-y", unit: "chars", ease: "elastic" },
    ae: {
      ease: "elastic",
      props: { position: [0, -100], scale: [40, 40], opacity: 0 }
    }
  },
  {
    id: "pop_spin",
    name: "Spin & Pop",
    category: "bounce",
    tags: ["rotate", "pop", "fun", "dynamic"],
    sampleText: "TWIST",
    defaultDuration: 0.85,
    defaultStagger: 50,
    defaultOvershoot: 45,
    defaultBasedOn: "chars",
    preview: { mode: "pop-spin", unit: "chars", ease: "back" },
    ae: {
      ease: "back",
      props: { scale: [0, 0], rotation: -55, opacity: 0 }
    }
  },
  {
    id: "punch_zoom",
    name: "Punch Zoom Down",
    category: "bounce",
    tags: ["impact", "slam", "zoom", "bold"],
    sampleText: "IMPACT",
    defaultDuration: 0.65,
    defaultStagger: 35,
    defaultOvershoot: 35,
    defaultBasedOn: "words",
    preview: { mode: "zoom-down", unit: "words", ease: "back" },
    ae: {
      ease: "back",
      props: { scale: [210, 210], opacity: 0 }
    }
  },

  // ==================== 4. FADE & TRACKING ====================
  {
    id: "tracking_expand",
    name: "Cinematic Tracking",
    category: "fade",
    tags: ["cinematic", "trailer", "spacing", "elegant"],
    sampleText: "CINEMA",
    defaultDuration: 1.1,
    defaultStagger: 20,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "tracking-in", unit: "whole", ease: "expo" },
    ae: {
      ease: "expo",
      props: { tracking: 65, opacity: 0 }
    }
  },
  {
    id: "tracking_contract",
    name: "Tighten & Fade",
    category: "fade",
    tags: ["clean", "minimal", "tracking", "fade"],
    sampleText: "MINIMAL",
    defaultDuration: 0.95,
    defaultStagger: 25,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "tracking-out", unit: "whole", ease: "expo" },
    ae: {
      ease: "expo",
      props: { tracking: -30, opacity: 0 }
    }
  },
  {
    id: "fade_wave",
    name: "Smooth Fade Wave",
    category: "fade",
    tags: ["soft", "elegant", "subtitle", "fade"],
    sampleText: "SMOOTH",
    defaultDuration: 0.9,
    defaultStagger: 60,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "fade-up", unit: "chars", ease: "cubic" },
    ae: {
      ease: "cubic",
      props: { opacity: 0, position: [0, 28] }
    }
  },
  {
    id: "fade_random",
    name: "Random Dissolve",
    category: "fade",
    tags: ["random", "scatter", "film", "credits"],
    sampleText: "SCATTER",
    defaultDuration: 1.0,
    defaultStagger: 65,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "fade-random", unit: "chars", ease: "cubic" },
    ae: {
      ease: "cubic",
      randomOrder: true,
      props: { opacity: 0, scale: [85, 85] }
    }
  },

  // ==================== 5. 3D FLIP & ROTATE ====================
  {
    id: "flip_3d_x",
    name: "3D Flip X Up",
    category: "3d",
    tags: ["3d", "flip", "rotate", "hinge"],
    sampleText: "FLIP 3D",
    defaultDuration: 0.9,
    defaultStagger: 50,
    defaultOvershoot: 25,
    defaultBasedOn: "chars",
    preview: { mode: "flip-x", unit: "chars", ease: "back" },
    ae: {
      perChar3D: true,
      ease: "back",
      props: { rotationX: -95, opacity: 0, position3D: [0, 40, 0] }
    }
  },
  {
    id: "flip_3d_y",
    name: "3D Swivel Y",
    category: "3d",
    tags: ["3d", "swivel", "spin", "modern"],
    sampleText: "SWIVEL",
    defaultDuration: 0.9,
    defaultStagger: 55,
    defaultOvershoot: 20,
    defaultBasedOn: "chars",
    preview: { mode: "flip-y", unit: "chars", ease: "back" },
    ae: {
      perChar3D: true,
      ease: "back",
      props: { rotationY: 95, opacity: 0 }
    }
  },
  {
    id: "depth_fly_in",
    name: "3D Fly From Camera",
    category: "3d",
    tags: ["3d", "depth", "z-space", "cinematic"],
    sampleText: "DEPTH",
    defaultDuration: 0.95,
    defaultStagger: 50,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "fly-z", unit: "chars", ease: "expo" },
    ae: {
      perChar3D: true,
      ease: "expo",
      props: { position3D: [0, 0, -450], opacity: 0, blur: [18, 18] }
    }
  },
  {
    id: "tumble_3d",
    name: "3D Tumble Cascade",
    category: "3d",
    tags: ["3d", "cascade", "rotate", "dynamic"],
    sampleText: "TUMBLE",
    defaultDuration: 1.0,
    defaultStagger: 55,
    defaultOvershoot: 30,
    defaultBasedOn: "chars",
    preview: { mode: "tumble-3d", unit: "chars", ease: "back" },
    ae: {
      perChar3D: true,
      ease: "back",
      props: { rotationX: 75, rotationY: -55, position3D: [0, -70, 120], opacity: 0 }
    }
  },

  // ==================== 6. TYPEWRITER ====================
  {
    id: "typewriter_classic",
    name: "Classic Typewriter",
    category: "typewriter",
    tags: ["type", "code", "terminal", "step"],
    sampleText: "TYPING_",
    defaultDuration: 1.0,
    defaultStagger: 95,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "typewriter", unit: "chars", ease: "step" },
    ae: {
      ease: "step",
      props: { opacity: 0 }
    }
  },
  {
    id: "typewriter_words",
    name: "Word-By-Word Snap",
    category: "typewriter",
    tags: ["captions", "reels", "shorts", "tiktok", "words"],
    sampleText: "WORD POP",
    defaultDuration: 0.9,
    defaultStagger: 90,
    defaultOvershoot: 0,
    defaultBasedOn: "words",
    preview: { mode: "typewriter-word", unit: "words", ease: "step" },
    ae: {
      ease: "step",
      props: { opacity: 0 }
    }
  },
  {
    id: "decode_scramble",
    name: "Cipher Decode",
    category: "typewriter",
    tags: ["hacker", "decode", "matrix", "tech"],
    sampleText: "DECODE",
    defaultDuration: 1.1,
    defaultStagger: 65,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "decode", unit: "chars", ease: "linear" },
    ae: {
      ease: "decode",
      props: { charOffset: 26 }
    }
  },
  {
    id: "typewriter_punch",
    name: "Type & Stamp",
    category: "typewriter",
    tags: ["stamp", "type", "bold", "editorial"],
    sampleText: "STAMP",
    defaultDuration: 0.9,
    defaultStagger: 75,
    defaultOvershoot: 25,
    defaultBasedOn: "chars",
    preview: { mode: "zoom-down", unit: "chars", ease: "back" },
    ae: {
      ease: "back",
      props: { scale: [175, 175], opacity: 0 }
    }
  },

  // ==================== 7. BLUR & STRETCH ====================
  {
    id: "blur_evaporate",
    name: "Blur Dissolve",
    category: "blur",
    tags: ["blur", "dreamy", "cinematic", "soft"],
    sampleText: "FOCUS",
    defaultDuration: 0.95,
    defaultStagger: 45,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "blur-in", unit: "chars", ease: "expo" },
    ae: {
      ease: "expo",
      props: { blur: [36, 36], opacity: 0, scale: [115, 115] }
    }
  },
  {
    id: "blur_directional_h",
    name: "Motion Blur Whip",
    category: "blur",
    tags: ["fast", "motion", "blur", "whip"],
    sampleText: "FLASH",
    defaultDuration: 0.65,
    defaultStagger: 35,
    defaultOvershoot: 20,
    defaultBasedOn: "words",
    preview: { mode: "blur-whip", unit: "words", ease: "expo" },
    ae: {
      ease: "expo",
      props: { position: [-200, 0], blur: [65, 0], opacity: 0 }
    }
  },
  {
    id: "stretch_vertical",
    name: "Vertical Stretch",
    category: "blur",
    tags: ["stretch", "rubber", "stylish", "editorial"],
    sampleText: "STRETCH",
    defaultDuration: 0.85,
    defaultStagger: 45,
    defaultOvershoot: 35,
    defaultBasedOn: "chars",
    preview: { mode: "stretch-y", unit: "chars", ease: "back" },
    ae: {
      ease: "back",
      props: { scale: [100, 0], position: [0, 60], opacity: 0 }
    }
  },
  {
    id: "stretch_horizontal",
    name: "Wide Squash Snap",
    category: "blur",
    tags: ["wide", "squash", "elastic", "bold"],
    sampleText: "EXPAND",
    defaultDuration: 0.8,
    defaultStagger: 40,
    defaultOvershoot: 35,
    defaultBasedOn: "words",
    preview: { mode: "stretch-x", unit: "words", ease: "back" },
    ae: {
      ease: "back",
      centerPivot: true,
      props: { scale: [210, 35], blur: [14, 0], opacity: 0 }
    }
  },

  // ==================== 8. GLITCH & FLICKER ====================
  {
    id: "glitch_flicker",
    name: "Neon Flicker",
    category: "glitch",
    tags: ["flicker", "neon", "cyber", "strobe"],
    sampleText: "FLICKER",
    defaultDuration: 0.85,
    defaultStagger: 60,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "flicker", unit: "chars", ease: "flicker" },
    ae: {
      ease: "flicker",
      randomOrder: true,
      props: { opacity: 0 }
    }
  },
  {
    id: "glitch_jitter",
    name: "Digital Jitter",
    category: "glitch",
    tags: ["glitch", "shake", "tech", "vhs"],
    sampleText: "GLITCH",
    defaultDuration: 0.8,
    defaultStagger: 50,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "glitch-jitter", unit: "chars", ease: "glitch" },
    ae: {
      ease: "glitch",
      randomOrder: true,
      props: { position: [38, -22], skew: 28, opacity: 0 }
    }
  },
  {
    id: "glitch_decode_snap",
    name: "Cyber Scramble",
    category: "glitch",
    tags: ["cyber", "scramble", "tech", "gaming"],
    sampleText: "CYBER",
    defaultDuration: 0.9,
    defaultStagger: 60,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "decode", unit: "chars", ease: "glitch" },
    ae: {
      ease: "glitch",
      randomOrder: true,
      props: { charOffset: 24, position: [0, 18], opacity: 0 }
    }
  },
  {
    id: "glitch_slice_blur",
    name: "Signal Lock",
    category: "glitch",
    tags: ["signal", "tv", "blur", "glitch"],
    sampleText: "SIGNAL",
    defaultDuration: 0.75,
    defaultStagger: 45,
    defaultOvershoot: 0,
    defaultBasedOn: "words",
    preview: { mode: "blur-whip", unit: "words", ease: "glitch" },
    ae: {
      ease: "glitch",
      props: { position: [90, 0], blur: [48, 0], opacity: 0 }
    }
  },

  // ==================== 9. CONTINUOUS LOOPS & FX ====================
  {
    id: "loop_stop_motion_wiggle",
    name: "Stop-Motion Wiggle",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "wiggle", "hand-drawn", "collage", "posterize"],
    sampleText: "WIGGLE",
    defaultDuration: 1.0,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "loop-wiggle", unit: "chars", ease: "linear" },
    ae: {
      loopMode: "wiggle",
      loopSpeed: 10,
      loopIntensity: 100,
      props: { position: [7, 7], rotation: 4 }
    }
  },
  {
    id: "loop_floating_wave",
    name: "Floating Wave",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "wave", "float", "bob", "smooth"],
    sampleText: "FLOAT",
    defaultDuration: 1.4,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "loop-wave", unit: "chars", ease: "linear" },
    ae: {
      loopMode: "wave",
      loopSpeed: 1.8,
      loopIntensity: 100,
      props: { position: [0, 18] }
    }
  },
  {
    id: "loop_tracking_drift",
    name: "Cinematic Tracking Drift",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "tracking", "drift", "cinematic", "trailer"],
    sampleText: "DRIFT",
    defaultDuration: 2.0,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "loop-drift", unit: "whole", ease: "linear" },
    ae: {
      loopMode: "drift",
      loopSpeed: 1.0,
      loopIntensity: 100,
      props: { tracking: 35 }
    }
  },
  {
    id: "loop_rhythmic_pulse",
    name: "Rhythmic Pulse",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "pulse", "breathe", "beat", "scale"],
    sampleText: "PULSE",
    defaultDuration: 1.0,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "all",
    preview: { mode: "loop-pulse", unit: "whole", ease: "linear" },
    ae: {
      loopMode: "pulse",
      loopSpeed: 2.0,
      loopIntensity: 100,
      centerPivot: true,
      props: { scale: [112, 112] }
    }
  },
  {
    id: "loop_neon_hue",
    name: "Neon Hue Cycle",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "color", "hue", "neon", "rainbow"],
    sampleText: "PRISM",
    defaultDuration: 1.5,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "loop-hue", unit: "chars", ease: "linear" },
    ae: {
      loopMode: "hue",
      loopSpeed: 1.2,
      loopIntensity: 100,
      fxEffect: "crtGlow",
      props: { fillHue: 360 }
    }
  },

  // ==================== 10. SOCIAL & VIRAL CAPTIONS ====================
  {
    id: "social_karaoke_pop",
    name: "Karaoke Word Highlight",
    category: "social",
    tags: ["shorts", "reels", "tiktok", "captions", "karaoke", "hormozi"],
    sampleText: "WORD POP",
    defaultDuration: 0.9,
    defaultStagger: 70,
    defaultOvershoot: 40,
    defaultBasedOn: "words",
    preview: { mode: "karaoke-pop", unit: "words", ease: "back" },
    ae: {
      ease: "back",
      accentColor: [1.0, 0.84, 0.12, 1],
      props: { scale: [118, 118], fillColor: [1.0, 0.84, 0.12, 1] }
    }
  },
  {
    id: "social_outline_fill",
    name: "Outline-to-Fill Snap",
    category: "social",
    tags: ["outline", "stroke", "fill", "bold", "social", "trend"],
    sampleText: "OUTLINE",
    defaultDuration: 0.8,
    defaultStagger: 50,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "outline-fill", unit: "chars", ease: "step" },
    ae: {
      ease: "step",
      props: { fillOpacity: 0, strokeWidth: 3, strokeColor: [1, 1, 1, 1] }
    }
  },
  {
    id: "social_highlighter_swipe",
    name: "Highlighter Box Swipe",
    category: "social",
    tags: ["highlight", "marker", "box", "captions", "youtube", "editorial"],
    sampleText: "MARKED",
    defaultDuration: 0.7,
    defaultStagger: 25,
    defaultOvershoot: 0,
    defaultBasedOn: "words",
    preview: { mode: "highlighter", unit: "whole", ease: "expo" },
    ae: {
      ease: "expo",
      bgShape: "highlighter",
      bgColor: [0.98, 0.8, 0.08, 1],
      props: { opacity: 0, position: [0, 14] }
    }
  },
  {
    id: "social_rapid_punch",
    name: "Rapid Hook Punch",
    category: "social",
    tags: ["fast", "hook", "reels", "shorts", "tiktok", "punch"],
    sampleText: "WATCH THIS",
    defaultDuration: 0.45,
    defaultStagger: 65,
    defaultOvershoot: 45,
    defaultBasedOn: "words",
    preview: { mode: "pop", unit: "words", ease: "back" },
    ae: {
      ease: "back",
      props: { scale: [45, 45], position: [0, 22], opacity: 0 }
    }
  },

  // ==================== 11. MECHANICAL & DATA ====================
  {
    id: "mech_slot_roll",
    name: "Slot-Machine Roll",
    category: "mechanical",
    tags: ["slot", "ticker", "roll", "reel", "hook", "masked"],
    sampleText: "ROLLING",
    defaultDuration: 0.9,
    defaultStagger: 55,
    defaultOvershoot: 25,
    defaultBasedOn: "chars",
    preview: { mode: "slot-roll", unit: "chars", ease: "back" },
    ae: {
      mask: true,
      ease: "back",
      props: { position: [0, -140], charOffset: 10 }
    }
  },
  {
    id: "mech_split_flap",
    name: "Split-Flap Board",
    category: "mechanical",
    tags: ["airport", "board", "flap", "3d", "mechanical"],
    sampleText: "BOARD",
    defaultDuration: 1.0,
    defaultStagger: 60,
    defaultOvershoot: 10,
    defaultBasedOn: "chars",
    preview: { mode: "split-flap", unit: "chars", ease: "back" },
    ae: {
      perChar3D: true,
      ease: "back",
      props: { rotationX: -110, charOffset: 12, opacity: 0 }
    }
  },
  {
    id: "mech_number_counter",
    name: "Number Counter",
    category: "mechanical",
    isCounter: true,
    tags: ["counter", "numbers", "data", "odometer", "infographic", "stats"],
    sampleText: "$10,000",
    defaultDuration: 1.5,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "counter", unit: "whole", ease: "expo" },
    ae: {
      counter: true,
      ease: "expo"
    }
  },

  // ==================== 12. EDITORIAL & BOXES ====================
  {
    id: "ed_center_out",
    name: "Center-Out Split",
    category: "editorial",
    tags: ["center", "symmetric", "split", "clean", "title"],
    sampleText: "CENTER",
    defaultDuration: 0.85,
    defaultStagger: 55,
    defaultOvershoot: 20,
    defaultBasedOn: "chars",
    preview: { mode: "center-out", unit: "chars", ease: "back" },
    ae: {
      ease: "back",
      centerOut: true,
      props: { scale: [0, 0], tracking: -20, opacity: 0 }
    }
  },
  {
    id: "ed_auto_box",
    name: "Auto-Boxed Title",
    category: "editorial",
    tags: ["box", "background", "lower-third", "title", "clean"],
    sampleText: "BOXED",
    defaultDuration: 0.8,
    defaultStagger: 20,
    defaultOvershoot: 0,
    defaultBasedOn: "words",
    preview: { mode: "auto-box", unit: "whole", ease: "expo" },
    ae: {
      mask: true,
      ease: "expo",
      bgShape: "box",
      bgColor: [0.90, 0.34, 0.28, 1],
      props: { position: [0, 68] }
    }
  },
  {
    id: "ed_underline_draw",
    name: "Underline Draw",
    category: "editorial",
    tags: ["underline", "line", "bar", "minimal", "editorial"],
    sampleText: "HEADLINE",
    defaultDuration: 0.8,
    defaultStagger: 25,
    defaultOvershoot: 0,
    defaultBasedOn: "words",
    preview: { mode: "underline", unit: "whole", ease: "expo" },
    ae: {
      mask: true,
      ease: "expo",
      bgShape: "underline",
      bgColor: [0.98, 0.66, 0.44, 1],
      props: { position: [0, 56] }
    }
  },
  {
    id: "ed_rgb_hit",
    name: "Chromatic RGB Hit",
    category: "editorial",
    tags: ["rgb", "chromatic", "glitch", "impact", "flash"],
    sampleText: "RGB HIT",
    defaultDuration: 0.48,
    defaultStagger: 10,
    defaultOvershoot: 30,
    defaultBasedOn: "words",
    preview: { mode: "rgb-hit", unit: "words", ease: "impact" },
    ae: {
      ease: "impact",
      centerPivot: true,
      rgbHit: true,
      props: { scale: [135, 135], opacity: 0, blur: [28, 0] }
    }
  },

  // ==================== 13. BRUTALIST & PRINT ====================
  {
    id: "brut_hard_snap",
    name: "Brutalist Hard-Snap",
    category: "brutalist",
    tags: ["swiss", "brutalist", "12fps", "posterize", "snap", "film"],
    sampleText: "BRUTAL",
    defaultDuration: 0.7,
    defaultStagger: 45,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "hard-snap", unit: "chars", ease: "posterize12" },
    ae: {
      ease: "posterize12",
      props: { position: [0, 75], scale: [125, 125], opacity: 0 }
    }
  },
  {
    id: "brut_ink_stamp",
    name: "Ink Stamp Press",
    category: "brutalist",
    tags: ["ink", "stamp", "print", "documentary", "rough", "vox"],
    sampleText: "STAMPED",
    defaultDuration: 0.65,
    defaultStagger: 30,
    defaultOvershoot: 20,
    defaultBasedOn: "words",
    preview: { mode: "zoom-down", unit: "words", ease: "back" },
    ae: {
      ease: "back",
      fxEffect: "inkStamp",
      props: { scale: [165, 165], opacity: 0 }
    }
  },
  {
    id: "brut_archival_cutout",
    name: "Archival Cutout",
    category: "brutalist",
    tags: ["collage", "paper", "newspaper", "12fps", "documentary", "cutout"],
    sampleText: "ARCHIVE",
    defaultDuration: 0.85,
    defaultStagger: 50,
    defaultOvershoot: 0,
    defaultBasedOn: "words",
    preview: { mode: "archival-cut", unit: "words", ease: "posterize12" },
    ae: {
      ease: "posterize12",
      props: { position: [0, -55], rotation: -12, opacity: 0 }
    }
  },
  {
    id: "brut_block_wipe",
    name: "Swiss Block Wipe",
    category: "brutalist",
    tags: ["swiss", "block", "wipe", "reveal", "editorial", "studio"],
    sampleText: "SWISS",
    defaultDuration: 0.8,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "words",
    preview: { mode: "block-wipe", unit: "whole", ease: "expo" },
    ae: {
      ease: "step",
      bgShape: "wipeBlock",
      bgColor: [0.95, 0.95, 0.96, 1],
      props: { opacity: 0 }
    }
  },

  // ==================== 14. SCI-FI & GAMING HUD ====================
  {
    id: "hud_terminal_cursor",
    name: "Terminal Cursor Type",
    category: "hud",
    isTerminal: true,
    tags: ["terminal", "cursor", "code", "hud", "sci-fi", "gaming"],
    sampleText: "SYS_OK",
    defaultDuration: 1.2,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "terminal-cursor", unit: "whole", ease: "linear" },
    ae: {
      terminal: true,
      cursorChar: "_"
    }
  },
  {
    id: "hud_corner_brackets",
    name: "HUD Corner Brackets",
    category: "hud",
    tags: ["hud", "brackets", "frame", "gaming", "tech", "ui"],
    sampleText: "TARGET",
    defaultDuration: 0.75,
    defaultStagger: 40,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "hud-brackets", unit: "whole", ease: "expo" },
    ae: {
      ease: "expo",
      bgShape: "brackets",
      bgColor: [0.02, 0.85, 0.91, 1],
      props: { opacity: 0, charOffset: 10 }
    }
  },
  {
    id: "hud_hologram_scan",
    name: "Hologram Scanlines",
    category: "hud",
    tags: ["hologram", "scanlines", "sci-fi", "glow", "cyber", "flicker"],
    sampleText: "HOLO",
    defaultDuration: 0.9,
    defaultStagger: 55,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "hologram", unit: "chars", ease: "flicker" },
    ae: {
      ease: "flicker",
      randomOrder: true,
      fxEffect: "hologram",
      props: { opacity: 0, blur: [8, 0] }
    }
  },
  {
    id: "hud_target_lock",
    name: "Target Lock Readout",
    category: "hud",
    tags: ["lock", "hud", "tracking", "center", "sci-fi", "data"],
    sampleText: "LOCKED",
    defaultDuration: 0.85,
    defaultStagger: 45,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "target-lock", unit: "chars", ease: "expo" },
    ae: {
      ease: "expo",
      centerOut: true,
      props: { tracking: 90, charOffset: 14, opacity: 0 }
    }
  },

  // ==================== 15. ANIME & IMPACT ====================
  {
    id: "anime_beat_slam",
    name: "Beat Impact Slam",
    category: "anime",
    tags: ["amv", "anime", "beat", "slam", "impact", "shake", "drop"],
    sampleText: "IMPACT!",
    defaultDuration: 0.55,
    defaultStagger: 15,
    defaultOvershoot: 40,
    defaultBasedOn: "words",
    preview: { mode: "beat-slam", unit: "words", ease: "impact" },
    ae: {
      ease: "impact",
      centerPivot: true,
      props: { scale: [185, 185], blur: [38, 12], opacity: 0 }
    }
  },
  {
    id: "anime_cyber_jitter",
    name: "Cyber Tracking Jitter",
    category: "anime",
    tags: ["anime", "amv", "cyberpunk", "jitter", "tracking", "madhouse"],
    sampleText: "SYNAPSE",
    defaultDuration: 0.85,
    defaultStagger: 50,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "cyber-tracking", unit: "whole", ease: "glitch" },
    ae: {
      ease: "glitch",
      centerPivot: true,
      randomOrder: true,
      props: { tracking: 110, scale: [130, 85], blur: [14, 0], opacity: 0 }
    }
  },
  {
    id: "anime_shear_slice",
    name: "Shear Slice Snap",
    category: "anime",
    tags: ["slice", "slash", "anime", "amv", "skew", "fast"],
    sampleText: "SLASH",
    defaultDuration: 0.6,
    defaultStagger: 40,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "shear-slice", unit: "chars", ease: "expo" },
    ae: {
      ease: "expo",
      alternating: true,
      props: { position: [140, 0], skew: -38 }
    }
  },
  {
    id: "anime_flash_strobe",
    name: "Flash Strobe Punch",
    category: "anime",
    tags: ["strobe", "flash", "hype", "amv", "music", "punch"],
    sampleText: "STROBE",
    defaultDuration: 0.55,
    defaultStagger: 25,
    defaultOvershoot: 30,
    defaultBasedOn: "words",
    preview: { mode: "strobe", unit: "words", ease: "strobe" },
    ae: {
      ease: "strobe",
      centerPivot: true,
      props: { scale: [130, 130], opacity: 0 }
    }
  },

  // ==================== 16. RETRO & VHS ANALOG ====================
  {
    id: "retro_crt_power",
    name: "CRT Power-On",
    category: "retro",
    tags: ["crt", "tv", "retro", "80s", "glow", "power"],
    sampleText: "CRT ON",
    defaultDuration: 0.65,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "lines",
    preview: { mode: "crt-on", unit: "whole", ease: "expo" },
    ae: {
      ease: "expo",
      centerPivot: true,
      visGate: true,
      fxEffect: "crtGlow",
      props: { scale: [240, 4], blur: [28, 0] }
    }
  },
  {
    id: "retro_80s_stutter",
    name: "80s Stutter Pop",
    category: "retro",
    tags: ["80s", "retro", "shadow", "12fps", "stutter", "pop"],
    sampleText: "RETRO",
    defaultDuration: 0.75,
    defaultStagger: 45,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "retro-stutter", unit: "chars", ease: "posterize12" },
    ae: {
      ease: "posterize12",
      centerPivot: true,
      fxEffect: "hardShadow",
      props: { scale: [0, 0], rotation: -8, opacity: 0 }
    }
  },
  {
    id: "retro_vhs_wobble",
    name: "VHS Tracking Wobble",
    category: "retro",
    isLoop: true,
    tags: ["vhs", "tape", "analog", "wobble", "loop", "fx", "retro"],
    sampleText: "VHS 94",
    defaultDuration: 1.5,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "lines",
    preview: { mode: "loop-vhs", unit: "whole", ease: "linear" },
    ae: {
      loopMode: "vhs",
      loopSpeed: 6,
      loopIntensity: 100,
      fxEffect: "vhsTracking",
      props: { position: [14, 4], skew: 8, blur: [5, 0] }
    }
  },
  {
    id: "retro_tape_bleed",
    name: "Retro Tape Bleed",
    category: "retro",
    tags: ["vhs", "bleed", "rgb", "analog", "blur", "retro"],
    sampleText: "ANALOG",
    defaultDuration: 0.85,
    defaultStagger: 45,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "tape-bleed", unit: "chars", ease: "flicker" },
    ae: {
      ease: "flicker",
      fxEffect: "vhsBleed",
      props: { blur: [22, 4], opacity: 0 }
    }
  },

  // ==================== 17. LUXURY & FASHION ====================
  {
    id: "lux_velvet_serif",
    name: "Velvet Serif Reveal",
    category: "luxury",
    tags: ["luxury", "fashion", "serif", "editorial", "vogue", "slow"],
    sampleText: "VELVET",
    defaultDuration: 1.35,
    defaultStagger: 20,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "velvet-serif", unit: "whole", ease: "cubic" },
    ae: {
      ease: "cubic",
      centerPivot: true,
      props: { tracking: 45, scale: [106, 106], opacity: 0 }
    }
  },
  {
    id: "lux_3d_whisper",
    name: "Editorial 3D Whisper",
    category: "luxury",
    tags: ["luxury", "3d", "subtle", "blur", "fashion", "clean"],
    sampleText: "ATELIER",
    defaultDuration: 1.2,
    defaultStagger: 45,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "3d-whisper", unit: "chars", ease: "expo" },
    ae: {
      perChar3D: true,
      ease: "expo",
      centerPivot: true,
      props: { rotationY: 28, blur: [14, 14], opacity: 0 }
    }
  },
  {
    id: "lux_silk_curtain",
    name: "Silk Curtain Mask",
    category: "luxury",
    tags: ["luxury", "mask", "curtain", "fashion", "smooth", "title"],
    sampleText: "MAISON",
    defaultDuration: 1.1,
    defaultStagger: 30,
    defaultOvershoot: 0,
    defaultBasedOn: "words",
    preview: { mode: "silk-curtain", unit: "words", ease: "expo" },
    ae: {
      mask: true,
      ease: "expo",
      centerPivot: true,
      props: { position: [0, 85], scale: [108, 108] }
    }
  },
  {
    id: "lux_horizon_line",
    name: "Horizon Line Reveal",
    category: "luxury",
    tags: ["luxury", "line", "horizon", "minimal", "mask", "editorial"],
    sampleText: "HORIZON",
    defaultDuration: 1.0,
    defaultStagger: 25,
    defaultOvershoot: 0,
    defaultBasedOn: "words",
    preview: { mode: "horizon-line", unit: "whole", ease: "expo" },
    ae: {
      mask: true,
      ease: "expo",
      bgShape: "horizon",
      bgColor: [0.95, 0.95, 0.95, 1],
      props: { position: [0, 72] }
    }
  },

  // ==================== 18. KINETIC POSTER ====================
  {
    id: "kin_staircase",
    name: "Staircase Interleave",
    category: "kinetic",
    tags: ["kinetic", "poster", "alternating", "vertical", "swiss"],
    sampleText: "STAIRS",
    defaultDuration: 0.85,
    defaultStagger: 45,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "staircase", unit: "chars", ease: "expo" },
    ae: {
      ease: "expo",
      alternating: true,
      props: { position: [0, 95] }
    }
  },
  {
    id: "kin_accordion",
    name: "Accordion Snap",
    category: "kinetic",
    tags: ["kinetic", "expand", "compress", "tracking", "poster"],
    sampleText: "ACCORDION",
    defaultDuration: 0.85,
    defaultStagger: 25,
    defaultOvershoot: 30,
    defaultBasedOn: "words",
    preview: { mode: "accordion", unit: "whole", ease: "back" },
    ae: {
      ease: "back",
      centerPivot: true,
      props: { scale: [40, 100], tracking: -40, opacity: 0 }
    }
  },
  {
    id: "kin_pendulum",
    name: "Pendulum Swing",
    category: "kinetic",
    tags: ["kinetic", "swing", "rotate", "elastic", "playful"],
    sampleText: "SWING",
    defaultDuration: 1.05,
    defaultStagger: 45,
    defaultOvershoot: 45,
    defaultBasedOn: "chars",
    preview: { mode: "pendulum", unit: "chars", ease: "elastic" },
    ae: {
      ease: "elastic",
      centerPivot: true,
      props: { rotation: 38, opacity: 0 }
    }
  },
  {
    id: "kin_domino_3d",
    name: "Domino 3D Cascade",
    category: "kinetic",
    tags: ["kinetic", "3d", "domino", "cascade", "poster", "flip"],
    sampleText: "DOMINO",
    defaultDuration: 0.9,
    defaultStagger: 75,
    defaultOvershoot: 25,
    defaultBasedOn: "chars",
    preview: { mode: "flip-x", unit: "chars", ease: "back" },
    ae: {
      perChar3D: true,
      ease: "back",
      centerPivot: true,
      props: { rotationX: -85, position3D: [0, -35, 40], opacity: 0 }
    }
  },

  // ==================== 19. MORE CONTINUOUS LOOPS & FX ====================
  {
    id: "loop_broken_neon",
    name: "Broken Neon Flicker",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "neon", "flicker", "broken", "sign", "retro"],
    sampleText: "NEON",
    defaultDuration: 1.2,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "loop-neon-flicker", unit: "chars", ease: "linear" },
    ae: {
      loopMode: "neonFlicker",
      loopSpeed: 12,
      loopIntensity: 100,
      fxEffect: "crtGlow",
      props: { opacity: 0 }
    }
  },
  {
    id: "loop_shimmer_sweep",
    name: "Shimmer Sweep",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "shimmer", "glint", "luxury", "wave"],
    sampleText: "SHIMMER",
    defaultDuration: 1.6,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "loop-shimmer", unit: "chars", ease: "linear" },
    ae: {
      loopMode: "shimmer",
      loopSpeed: 1.4,
      loopIntensity: 100,
      centerPivot: true,
      fxEffect: "crtGlow",
      props: { scale: [112, 112], blur: [4, 0] }
    }
  },
  {
    id: "loop_scale_ripple",
    name: "Kinetic Scale Ripple",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "ripple", "stretch", "poster", "kinetic"],
    sampleText: "RIPPLE",
    defaultDuration: 1.4,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "loop-ripple", unit: "chars", ease: "linear" },
    ae: {
      loopMode: "ripple",
      loopSpeed: 2.2,
      loopIntensity: 100,
      centerPivot: true,
      props: { scale: [100, 128] }
    }
  },
  {
    id: "loop_3d_sway",
    name: "3D Float Sway",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "3d", "sway", "float", "subtle"],
    sampleText: "SWAY 3D",
    defaultDuration: 1.8,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "loop-3d-sway", unit: "chars", ease: "linear" },
    ae: {
      perChar3D: true,
      loopMode: "wave",
      loopSpeed: 1.4,
      loopIntensity: 100,
      centerPivot: true,
      props: { rotationY: 22, position3D: [0, 10, 0] }
    }
  },
  {
    id: "loop_impact_rumble",
    name: "Impact Rumble",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "shake", "rumble", "bass", "gaming", "hype"],
    sampleText: "RUMBLE",
    defaultDuration: 1.0,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "all",
    preview: { mode: "loop-rumble", unit: "whole", ease: "linear" },
    ae: {
      loopMode: "rumble",
      loopSpeed: 24,
      loopIntensity: 100,
      centerPivot: true,
      props: { position: [8, 8], rotation: 2.5 }
    }
  },
  {
    id: "loop_gentle_pendulum",
    name: "Gentle Pendulum",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "pendulum", "rock", "rotate", "smooth"],
    sampleText: "ROCKING",
    defaultDuration: 1.6,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "words",
    preview: { mode: "loop-pendulum", unit: "words", ease: "linear" },
    ae: {
      loopMode: "wave",
      loopSpeed: 1.2,
      loopIntensity: 100,
      centerPivot: true,
      props: { rotation: 8 }
    }
  },

  // ==================== 20. HORROR & THRILLER ====================
  {
    id: "hor_creeping_dread",
    name: "Creeping Dread Zoom",
    category: "horror",
    tags: ["horror", "thriller", "a24", "dread", "slow", "zoom", "scary"],
    sampleText: "DREAD",
    defaultDuration: 1.8,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "all",
    preview: { mode: "creeping-dread", unit: "whole", ease: "cubic" },
    ae: {
      ease: "cubic",
      centerPivot: true,
      props: { scale: [90, 90], tracking: -20, blur: [16, 16], opacity: 0 }
    }
  },
  {
    id: "hor_possessed_twitch",
    name: "Possessed Twitch",
    category: "horror",
    tags: ["horror", "twitch", "creepy", "possessed", "se7en", "scary"],
    sampleText: "TWITCH",
    defaultDuration: 0.9,
    defaultStagger: 65,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "possessed-twitch", unit: "chars", ease: "glitch" },
    ae: {
      ease: "twitch",
      visGate: true,
      randomOrder: true,
      centerPivot: true,
      props: { position: [18, -22], rotation: 16 }
    }
  },
  {
    id: "hor_rotting_ink",
    name: "Rotting Ink Decay",
    category: "horror",
    tags: ["horror", "decay", "rot", "ink", "rough", "eerie", "dark"],
    sampleText: "DECAY",
    defaultDuration: 1.2,
    defaultStagger: 55,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "rotting-ink", unit: "chars", ease: "cubic" },
    ae: {
      ease: "cubic",
      randomOrder: true,
      fxEffect: "rottingInk",
      props: { blur: [12, 12], opacity: 0 }
    }
  },
  {
    id: "hor_analog_alert",
    name: "Analog Horror Alert",
    category: "horror",
    tags: ["horror", "analog", "cctv", "vhs", "found-footage", "eerie"],
    sampleText: "DO NOT LOOK",
    defaultDuration: 1.0,
    defaultStagger: 55,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "analog-alert", unit: "chars", ease: "flicker" },
    ae: {
      ease: "flicker",
      randomOrder: true,
      fxEffect: "analogHorror",
      props: { blur: [8, 0], opacity: 0 }
    }
  },
  {
    id: "hor_ghostly_fog",
    name: "Ghostly Fog Fade",
    category: "horror",
    tags: ["horror", "ghost", "fog", "mist", "haunted", "blur", "slow"],
    sampleText: "HAUNTED",
    defaultDuration: 1.7,
    defaultStagger: 70,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "ghostly-fog", unit: "chars", ease: "cubic" },
    ae: {
      ease: "cubic",
      randomOrder: true,
      props: { blur: [48, 22], tracking: 35, opacity: 0 }
    }
  },
  {
    id: "hor_jumpscare_slam",
    name: "Jumpscare Slam",
    category: "horror",
    tags: ["horror", "jumpscare", "slam", "trailer", "impact", "scary"],
    sampleText: "RUN",
    defaultDuration: 0.45,
    defaultStagger: 10,
    defaultOvershoot: 45,
    defaultBasedOn: "words",
    preview: { mode: "jumpscare-slam", unit: "words", ease: "impact" },
    ae: {
      ease: "impact",
      centerPivot: true,
      rgbHit: true,
      props: { scale: [240, 240], blur: [42, 18], opacity: 0 }
    }
  },

  // ==================== 21. HORROR LOOPS & FX ====================
  {
    id: "loop_ominous_creep",
    name: "Ominous Slow Creep",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "horror", "thriller", "zoom", "creep", "tension"],
    sampleText: "CLOSER",
    defaultDuration: 2.0,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "all",
    preview: { mode: "loop-creep", unit: "whole", ease: "linear" },
    ae: {
      loopMode: "drift",
      loopSpeed: 1.0,
      loopIntensity: 100,
      centerPivot: true,
      props: { scale: [112, 112] }
    }
  },
  {
    id: "loop_haunted_convulse",
    name: "Haunted Letter Convulse",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "horror", "convulse", "jitter", "twitch", "creepy"],
    sampleText: "CURSED",
    defaultDuration: 1.2,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "loop-convulse", unit: "chars", ease: "linear" },
    ae: {
      loopMode: "convulse",
      loopSpeed: 10,
      loopIntensity: 100,
      centerPivot: true,
      props: { position: [9, 11], rotation: 9 }
    }
  },
  {
    id: "loop_boiling_decay",
    name: "Boiling Decay Edges",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "horror", "boil", "decay", "analog", "cursed"],
    sampleText: "ROTTING",
    defaultDuration: 1.4,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "chars",
    preview: { mode: "loop-boiling", unit: "chars", ease: "linear" },
    ae: {
      loopMode: "wiggle",
      loopSpeed: 8,
      loopIntensity: 55,
      fxEffect: "boilingDecay",
      props: { position: [4, 4], skew: 5 }
    }
  },
  {
    id: "loop_dying_fluorescent",
    name: "Dying Fluorescent",
    category: "loops",
    isLoop: true,
    tags: ["loop", "fx", "horror", "flicker", "light", "hallway", "eerie"],
    sampleText: "EXIT",
    defaultDuration: 1.4,
    defaultStagger: 0,
    defaultOvershoot: 0,
    defaultBasedOn: "all",
    preview: { mode: "loop-fluorescent", unit: "whole", ease: "linear" },
    ae: {
      loopMode: "fluorescent",
      loopSpeed: 14,
      loopIntensity: 100,
      fxEffect: "crtGlow",
      props: { opacity: 0 }
    }
  }
];
