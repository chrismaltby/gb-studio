CC	= ../../../bin/lcc

all:	
	$(CC) -Wm-ys -o sgb_sfx.gb main.c sgb_sfx_names.c

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> compile.bat

clean:
	rm -f *.o *.lst *.map *.gb *.ihx *.sym *.cdb *.adb *.asm
