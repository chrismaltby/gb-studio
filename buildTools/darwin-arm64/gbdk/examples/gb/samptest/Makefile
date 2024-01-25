CC	= ../../../bin/lcc -Wa-l -Wl-m -Wl-j

BINS	= samptest.gb

all:	$(BINS)

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> compile.bat

# Compile and link single file in one pass
%.o:	%.s
	$(CC) -c -o $@ $<

%.o:	%.c
	$(CC) -c -o $@ $<

%.gb:	%.o sample.o
	$(CC) -o $@ $< sample.o

clean:
	rm -f *.o *.lst *.map *.gb *~ *.rel *.cdb *.ihx *.lnk *.sym *.asm *.noi

