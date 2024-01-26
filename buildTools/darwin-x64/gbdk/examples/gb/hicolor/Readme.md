# GBDK Example
This example Requires GBDK-2020 4.2.0 or higher (due to using `vsync()`)

PNG images placed in the res/hicolor folder will get automatically converted and compiled.

To use them, include the automatically generated header file (based on the png filename) and then use the `hicolor_start()` and `hicolor_stop()` functions.

For the current GBDK example ISR implementation there is a limit of 6 sprites per line before the hi-color timing breaks down and there start to be background artifacts.

# Palette ISR
The new palette update ISR is contributed by Toxa
https://github.com/untoxa


# Example image
Example image Pixel art originally by RodrixAP under Creative Commons Attribution 2.0 Generic (CC BY 2.0)
https://www.flickr.com/photos/rodrixap/10591266994/in/album-72157637154901153/

