#!/bin/sh

ICON_PATH="./src/assets/app/icon/app_icon.icon"
OUTPUT_PATH="./src/assets/app/icon"
PLIST_PATH="$OUTPUT_PATH/assetcatalog_generated_info.plist"
DEVELOPMENT_REGION="en"
ICTOOL_PATH="/Applications/Icon Composer.app/Contents/Executables/ictool"
PNG_ICON_PATH="./src/assets/app/icon/app_icon.png"
ICO_ICON_PATH="./src/assets/app/icon/app_icon.ico"
PNG_256_ICON_PATH="./src/assets/app/icon/app_icon_256.png"
UI_ICON_PATH="./src/components/ui/icons/app_icon_256.png"
ICONSET_PATH="./src/assets/app/icon/app_icon.iconset"

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

# Extract png icons
"$ICTOOL_PATH" ./src/assets/app/icon/app_icon.icon --export-image --output-file ./src/assets/app/icon/app_icon.png --platform macOS --rendition Default --width 1024 --height 1024 --scale 1
"$ICTOOL_PATH" ./src/assets/app/icon/app_icon.icon --export-image --output-file $PNG_ICON_PATH --platform macOS --rendition Default --width 1024 --height 1024 --scale 1
"$ICTOOL_PATH" ./src/assets/app/icon/app_icon.icon --export-image --output-file $PNG_256_ICON_PATH --platform macOS --rendition Default --width 256 --height 256 --scale 1

# Optimize pngs
oxipng -o 4 --strip safe --alpha $PNG_ICON_PATH
oxipng -o 4 --strip safe --alpha $PNG_256_ICON_PATH

# Create ico
magick $PNG_256_ICON_PATH -profile "/System/Library/ColorSync/Profiles/sRGB Profile.icc" -colorspace sRGB -define icon:auto-resize=256,128,64,48,32,16 -strip $ICO_ICON_PATH

# Create icns
mkdir -p $ICONSET_PATH
for s in 16 32 128 256 512; do
  magick $PNG_ICON_PATH -resize ${s}x${s} $ICONSET_PATH/icon_${s}x${s}.png
  magick $PNG_ICON_PATH -resize $((s*2))x$((s*2)) $ICONSET_PATH/icon_${s}x${s}@2x.png
done
iconutil -c icns $ICONSET_PATH
rm -rf $ICONSET_PATH

# Move 256 png to UI icons
mv $PNG_256_ICON_PATH $UI_ICON_PATH
