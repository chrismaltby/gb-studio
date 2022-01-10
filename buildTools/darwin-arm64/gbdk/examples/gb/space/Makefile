GBDK	= ../../..
LIB	= $(GBDK)/lib/small/asxxxx/
CC	= $(GBDK)/bin/lcc -Wa-I$(LIB) -Wa-l -Wl-m -Wl-j

BINS	= space.gb

all:	$(BINS)

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> compile.bat

# Compile and link single file in one pass
%.gb:	%.s
	$(CC) -o $@ $<

clean:
	rm -f *.o *.lst *.map *.gb *~ *.rel *.cdb *.ihx *.lnk *.sym *.asm *.noi

