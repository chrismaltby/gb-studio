CC	= ../../../bin/lcc -Wa-l -Wl-m -Wl-j

BINS	= sound.gb sound.duck
# BINS	= sound.gb sound.duck sound.pocket

all:	$(BINS)

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | sed s/mkdir\ -p\/mkdir\/ | grep -v make >> compile.bat

# Compile and link single file in one pass
%.gb:	%.c
	$(CC) -msm83:gb -o $@ $<

# Build megaduck version with -m port:plat flag
%.duck:	%.c
	$(CC) -msm83:duck -o $@ $<

# Build analogue pocket version with -m port:plat flag
%.pocket:	%.c
	$(CC) -msm83:ap -o $@ $<

clean:
	rm -f *.o *.lst *.map *.duck *.pocket *.gb *~ *.rel *.cdb *.ihx *.lnk *.sym *.asm *.noi

