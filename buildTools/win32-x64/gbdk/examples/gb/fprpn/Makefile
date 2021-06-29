CC	= ../../../bin/lcc -Wa-l -Wl-m -Wl-j

# Disabled building this for now since it's broken
BINS =
# BINS	= fprpn.gb

all:	$(BINS)

make.bat: Makefile
	@echo "REM Automatically generated from Makefile" > make.bat
# Disabled building this for now since it's broken
# @make -sn | sed y/\\//\\\\/ | grep -v make >> make.bat

# Compile and link single file in one pass
%.gb:	%.c
	$(CC) -o $@ $<

clean:
	rm -f *.o *.lst *.map *.gb *~ *.rel *.cdb *.ihx *.lnk *.sym *.asm *.noi

