#!/bin/bash

ASSET_FILE=../include/assets.h

# Build tilesets
ggbgfx tileset screen.png screen2.png window.png -o tileset.png
ggbgfx tileset city.png -o city_tileset.png

# Build sprites
ggbgfx sprite player_sprites.png > $ASSET_FILE

# Build tiledata
ggbgfx tiledata tileset.png >> $ASSET_FILE
ggbgfx tiledata city_tileset.png >> $ASSET_FILE

# Build tilemaps
ggbgfx tilemap -n screen_tiles screen.png tileset.png >> $ASSET_FILE
ggbgfx tilemap -n window_tiles window.png tileset.png >> $ASSET_FILE
ggbgfx tilemap -n screen2_tiles screen2.png tileset.png >> $ASSET_FILE
ggbgfx tilemap -n city_tiles city.png city_tileset.png >> $ASSET_FILE
