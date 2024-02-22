
### Displaying an image with more than 256 tiles in APA mode.

This example shows how to use APA graphics mode and png2asset to convert and display an image with more than 256 tiles. The image should be in PNG format with 4 colors at 160 x 144.

This sample project can be used to make a minimal program which displays a logo

The image is displayed with:
`draw_image();`

This call will automatically switch to APA graphics mode and install it's start and mid-frame ISRs which switch the tile source, enabling it to display more than 256 tiles. The screen hardware map is configured such that each tile used is unique, and indexed sequentially from left-to-right, top-to-bottom (20 x 18 = 360 tiles total).

png2asset is called with these values in order to produce a compatible image:
- `keep_duplicate_tiles`   : Don't remove duplicate tiles (required for APA bitmap image display)
- `map`                    : Use "map style" output, not metasprite
- `tiles_only`             : Only keep tiles, no map (since APA mode expects tiles in linear order)
- `bpp 2`                  : Use 2bpp output


Pixel art originally by RodrixAP under Creative Commons Attribution 2.0 Generic (CC BY 2.0)

https://www.flickr.com/photos/rodrixap/10591266994/in/album-72157637154901153/

