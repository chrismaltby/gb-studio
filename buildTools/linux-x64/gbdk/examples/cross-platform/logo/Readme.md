This project shows how assets can be managed for multiple different console targets together.

`png2asset` is used to generate assets in the native format for each console at compile-time from separate source PNG images. The Makefile is set to use the source PNG folder which matches the current console being compiled, and the source code uses @ref set_native_tile_data() to load the assets tiles in native format.

