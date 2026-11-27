/**
 * Text Composer - Version & GitHub Auto-Update Configuration
 *
 * To enable 1-click in-panel updates for you and your friends:
 *  1. Push this folder to a public GitHub repository.
 *  2. Replace "YOUR_USERNAME/ae-text-composer" below with your GitHub "username/repo".
 *  3. Whenever you push changes, bump "version" here AND in package.json.
 */
window.TEXT_COMPOSER_CONFIG = {
  version: "1.6.3",
  githubRepo: "marvenando/Nyx-Text-Composer",
  branch: "main",
  updateFiles: [
    "client/config.js",
    "client/index.html",
    "client/styles.css",
    "client/presets.js",
    "client/app.js",
    "client/lib/CSInterface.js",
    "host/index.jsx",
    "package.json"
  ]
};
