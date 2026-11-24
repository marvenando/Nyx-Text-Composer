/**
 * Lightweight Adobe CSInterface bridge for After Effects CEP Panels.
 * Works inside Adobe CEP runtime (window.__adobe_cep__) and falls back
 * gracefully in a standard browser for UI previewing.
 */
(function (global) {
  "use strict";

  function CSInterface() {}

  CSInterface.THEME_COLOR_CHANGED_EVENT = "com.adobe.csxs.events.ThemeColorChanged";

  CSInterface.prototype.isCEP = function () {
    return typeof window.__adobe_cep__ !== "undefined";
  };

  CSInterface.prototype.evalScript = function (script, callback) {
    if (typeof window.__adobe_cep__ !== "undefined") {
      window.__adobe_cep__.evalScript(script, callback || function () {});
    } else {
      // Browser preview mode fallback
      if (typeof callback === "function") {
        setTimeout(function () {
          callback(
            JSON.stringify({
              ok: true,
              previewMode: true,
              message: "Browser preview mode (open inside After Effects to apply to layers)."
            })
          );
        }, 40);
      }
    }
  };

  CSInterface.prototype.getHostEnvironment = function () {
    if (typeof window.__adobe_cep__ !== "undefined") {
      try {
        return JSON.parse(window.__adobe_cep__.getHostEnvironment());
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  CSInterface.prototype.getSystemPath = function (pathType) {
    if (typeof window.__adobe_cep__ !== "undefined") {
      try {
        var path = decodeURI(window.__adobe_cep__.getSystemPath(pathType));
        if (path.indexOf("file://") === 0) {
          path = path.replace(/^file:\/\/\/?/, "");
          // Keep leading slash on macOS/Linux, strip leading slash before drive letter on Windows
          if (!/^[A-Za-z]:/.test(path)) {
            path = "/" + path;
          }
        }
        return path;
      } catch (e) {
        return "";
      }
    }
    return "";
  };

  CSInterface.prototype.addEventListener = function (type, listener, obj) {
    if (typeof window.__adobe_cep__ !== "undefined") {
      window.__adobe_cep__.addEventListener(type, listener, obj);
    }
  };

  global.CSInterface = CSInterface;
})(window);
