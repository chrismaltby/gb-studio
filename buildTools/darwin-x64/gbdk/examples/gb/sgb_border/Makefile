CC	= ../../../bin/lcc

all:
	$(CC) -Wm-ys -o border.gb border.c sgb_border.c border_data.c

make.bat: Makefile
	@echo "REM Automatically generated from Makefile" > make.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> make.bat

clean:
	rm -f *.o *.lst *.map *.gb *.ihx *.sym *.cdb *.adb *.asm
