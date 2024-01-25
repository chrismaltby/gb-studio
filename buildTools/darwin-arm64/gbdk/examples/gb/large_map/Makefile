CC	= ../../../bin/lcc

all:
	$(CC) -o large_map.gb large_map.c bigmap_map.c bigmap_tiles.c

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> compile.bat

clean:
	rm -f *.o *.lst *.map *.gb *.ihx *.sym *.cdb *.adb *.asm
