CC	= ../../../bin/lcc

all:
	$(CC) -mgbz80:ap -Wl-j -Wm-yS -Wm-ys -o border.pocket border.c sgb_border.c border_data.c

make.bat: Makefile
	@echo "REM Automatically generated from Makefile" > make.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> make.bat

clean:
	rm -f *.o *.lst *.map *.pocket *.ihx *.sym *.cdb *.adb *.asm
