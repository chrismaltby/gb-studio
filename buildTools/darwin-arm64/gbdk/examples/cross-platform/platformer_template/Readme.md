# GBDK-2020 Platformer Template

A Basic "Mario-Style" Platformer Template

The Player can walk, run, and jump on the background of 3 different areas. The  Player Character is rendered using metasprites.

Controls:
  - D-pad left/right: Walk Horizontally
  - D-pad up:         Jump (hold to increase jump height)
  - A:                Jump (hold to increase jump height)
  - B:                Sprint

The "res" folder contains some PNGs that are converted to .c and .h files using [png2asset](https://gbdk-2020.github.io/gbdk-2020/docs/api/docs_toolchain_settings.html#png2asset-settings).

The level.c file defines a function for changing the level. The code expects all non-solid tiles be first in the tilesets. The amount of non-solid tiles should be specified in "currentLevelNonSolidTileCount" when changing level.

## How to add levels

Create a tileset using your favorite graphics editor. Make sure:
- Each tile has no more than 4 colors (For games not targeting Game Boy Family consoles, see the GBDK-2020 documentation)
- You don't have more than 256 unique tiles
- (when scanning per-tile, left-to-right.) **ALL** solid tiles come **BEFORE** non-solid tiles. (The number of solid tiles will later be used in level.c)

In the makefile, Update the "png2asset" target to convert your tileset to .c and .h files. Make sure:
- For simplicity, you use the following params: `-noflip -map -tileset_only -keep_duplicate_tiles` (This ensures easy compatibility with your tilemap editor at the cost of some VRAM space.)

> $(PNG2ASSET) res\world1-tileset.png -c res\World1Tileset.c -noflip -map -tileset_only -keep_duplicate_tiles

You can use your tileset in a tilemap editor like [Tiled](https://www.mapeditor.org/) or [LDtk](https://ldtk.io/).
Make sure you export the level as an **PNG** image.
After exporting the level as an image, use png2asset to generate tilemap .c and .h files from that PNG. Make sure:
- For simplicity use the ` -noflip -map -maps_only` arguments. (Again, at the cost of VRAM space, this makes for easy compatibility with your tilemap editor's output)
- Specify the source tileset using the `-source_tileset` argument
- Make sure the level is at least 20 tiles wide, and 18 tiles high. (For games not targeting Game Boy Family consoles, see the GBDK-2020 documentation)

> $(PNG2ASSET) res\world1-area1.png -c res\World1Area1.c -noflip -map -maps_only -source_tileset res\world1-tileset.png

Include the generated .h files in the level.h
Add new levels to the switch statement in level.c's "SetupCurrentLevel" function.

> This template initially uses the modulus operator to cycle between 3 levels. Change the '3' to however many elements you have.

Make sure to set their level tile data into vram.

> If you're tilemap has more tiles than your tileset, you will encounter some display issues. This is one reason for the arguments previously mentioned "for simplicity". Just Make sure your tilemap editor program doesn't use more than one tileset.

Make sure to set the number of solid tiles. These should always come first. This should include duplicates and flipped tiles.

> As an optimizatation you could remove adjust your tileset, tilemap, and png2asset to handle duplicates/tile-flipping, but you would loose some DMG compatibility