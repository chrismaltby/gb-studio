CC	= ../../../bin/lcc -mgbz80:ap -Wl-j -Wm-yS

BINS	= galaxy.pocket

all:	$(BINS)

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> compile.bat

# Compile and link single file in one pass
%.pocket:	%.c
	$(CC) -o $@ $<

clean:
	rm -f *.o *.lst *.map *.pocket *~ *.rel *.cdb *.ihx *.lnk *.sym *.asm *.noi

