
RLE Decompress
============

Demonstrates using rle_decompress to load a compressed tile map into vram.

## Map Data encoding
The Tile Map is exported in binary format (one map entry per byte) and encoded in sequential **columns** 20 tiles high.

The data is compressed using the `gbcompress` utility using the `--alg=rle` argument.

`gbcompress --alg=rle map.bin map.bin.rle`

## Display
As the program scrolls, a new column is drawn once for every 8 pixels scrolled. The Tile Map data is decoded 20 tiles at a time (column height) and rendered to the next (just barely off-screen) column on the right.

## Graphics
The tileset graphics are by GrafxKid under CC0 license:

https://opengameart.org/content/cave-tileset-4

