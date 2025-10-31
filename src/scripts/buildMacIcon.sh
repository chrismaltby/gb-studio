#!/bin/sh

ICON_PATH="./src/assets/app/icon/app_icon.icon"
OUTPUT_PATH="./src/assets/app/icon"
PLIST_PATH="$OUTPUT_PATH/assetcatalog_generated_info.plist"
DEVELOPMENT_REGION="en"

# Adapted from https://github.com/electron/packager/pull/1806/files
actool $ICON_PATH --compile $OUTPUT_PATH \
  --output-format human-readable-text --notices --warnings --errors \
  --output-partial-info-plist $PLIST_PATH \
  --app-icon Icon --include-all-app-icons \
  --enable-on-demand-resources NO \
  --development-region $DEVELOPMENT_REGION \
  --target-device mac \
  --minimum-deployment-target 26.0 \
  --platform macosx

rm $PLIST_PATH
