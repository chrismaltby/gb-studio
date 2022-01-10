CC	= ../../../bin/lcc -mgbz80:ap -Wl-j -Wm-yS

all:
	$(CC) -o large_map.pocket large_map.c bigmap_map.c bigmap_tiles.c

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> compile.bat

clean:
	rm -f *.o *.lst *.map *.pocket *.ihx *.sym *.cdb *.adb *.asm
