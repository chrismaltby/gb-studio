CC	= ../../../bin/lcc

all:
	$(CC) -mgbz80:ap -Wl-j -Wm-yS -Wm-ys -o border.pocket border.c sgb_border.c border_data.c

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> compile.bat

clean:
	rm -f *.o *.lst *.map *.pocket *.ihx *.sym *.cdb *.adb *.asm
