REM Automatically generated from Makefile
..\..\..\bin\png2asset gb_border.png -map -bpp 4 -max_palettes 4 -pack_mode sgb -use_map_attributes -c border_data.c
..\..\..\bin\lcc -Wm-ys -o border.gb border.c sgb_border.c border_data.c
