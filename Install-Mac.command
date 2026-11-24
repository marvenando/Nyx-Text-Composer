#!/bin/bash
set -e

EXT_ID="com.textcomposer.panel"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST_ROOT="$HOME/Library/Application Support/Adobe/CEP/extensions"
DEST="$DEST_ROOT/$EXT_ID"

# If already installed, offer Reinstall / Uninstall / Cancel via native macOS dialog
if [ -e "$DEST" ] || [ -L "$DEST" ]; then
  CHOICE=$(osascript -e 'button returned of (display dialog "Nyx Text Composer is already installed." buttons {"Cancel", "Uninstall", "Reinstall"} default button "Reinstall" with title "Nyx Text Composer Installer")' 2>/dev/null || echo "Cancel")
  if [ "$CHOICE" = "Cancel" ]; then
    exit 0
  fi
  rm -rf "$DEST"
  if [ "$CHOICE" = "Uninstall" ]; then
    osascript -e 'display dialog "Nyx Text Composer has been uninstalled." buttons {"OK"} default button "OK" with title "Nyx Text Composer Installer"' >/dev/null
    exit 0
  fi
fi

# 1. Enable Adobe CEP PlayerDebugMode for After Effects 2021 - 2026+ (CSXS 10-13)
for VER in 10 11 12 13; do
  defaults write "com.adobe.CSXS.$VER" PlayerDebugMode 1
done

# 2. Copy extension files into ~/Library/Application Support/Adobe/CEP/extensions/
mkdir -p "$DEST"
cp -R "$SRC_DIR/CSXS" "$DEST/"
cp -R "$SRC_DIR/client" "$DEST/"
cp -R "$SRC_DIR/host" "$DEST/"

# 3. Show confirmation dialog
osascript -e 'display dialog "Nyx Text Composer is installed!\n\nRestart After Effects, then open:\nWindow > Extensions > Nyx Text Composer" buttons {"OK"} default button "OK" with title "Nyx Text Composer Installer"' >/dev/null
