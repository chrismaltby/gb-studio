CC	= ../../../bin/lcc -mgbz80:ap -Wl-j -Wm-yS

BINS	= gb-dtmf.pocket

all:	$(BINS)

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> compile.bat

%.s:	%.c
	$(CC) -S -o $@ $<

%.o:	%.c
	$(CC) -c -o $@ $<

%.o:	%.s
	$(CC) -c -o $@ $<

%.pocket:	%.o
	$(CC) -o $@ $<

clean:
	rm -f *.o *.lst *.map *.pocket *.ihx *.sym *.cdb *.adb *.asm
