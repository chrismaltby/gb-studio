#!/bin/bash

#ASSET_FILE=../src/bank3.c

#echo "#pragma bank=3\n" > $ASSET_FILE

# Build tilesets
# ggbgfx tileset school_tiles.png -o tileset.png
# ggbgfx tileset global_tiles.png -o global_tileset.png

# Build sprites
# ggbgfx sprite sprites.png > $ASSET_FILE
#ggbgfx sprite village_sprites.png >> $ASSET_FILE

#ggbgfx tiledata tree_tiles.png >> $ASSET_FILE

# ggbgfx sprite village_sprites2.png >> $ASSET_FILE

# # Build tiledata
# ggbgfx tiledata school_tiles.png >> $ASSET_FILE
# ggbgfx tiledata global_tileset.png >> $ASSET_FILE

# # Build tilemaps
# ggbgfx tilemap -n screen_tiles school_classroom.png school_tiles.png >> $ASSET_FILE
# ggbgfx tilemap -n school_tiles2 school_classroom2.png school_tiles.png >> $ASSET_FILE
# ggbgfx tilemap -n school_tiles3 school_classroom3.png school_tiles.png >> $ASSET_FILE
# ggbgfx tilemap -n gameover_tiles gameover.png tileset.png >> $ASSET_FILE

#ggbgfx tilemap -n trees trees.png tree_tiles.png >> $ASSET_FILE

ggbgfx tileset title_bg3.png -o title_tileset3.png
ggbgfx tiledata title_tileset3.png
ggbgfx tilemap -n title_tiles title_bg3.png title_tileset3.png