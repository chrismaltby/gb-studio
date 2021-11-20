CC	= ../../../bin/lcc
PNG2ASSET = ../../../bin/png2asset

all:
	$(PNG2ASSET) gb_border.png -map -bpp 4 -max_palettes 4 -pack_mode sgb -use_map_attributes -c border_data.c
	$(CC) -Wm-ys -o border.gb border.c sgb_border.c border_data.c

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> compile.bat

clean:
	rm -f *.o *.lst *.map *.gb *.ihx *.sym *.cdb *.adb *.asm
