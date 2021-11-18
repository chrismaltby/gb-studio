CC	= ../../../bin/lcc -mgbz80:ap -Wl-j -Wm-yS

# CFLAGS	=

BINS	= colorbar.pocket

all:	$(BINS)

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> compile.bat

%.o:	%.c
	$(CC) $(CFLAGS) -c -o $@ $<

%.o:	%.s
	$(CC) $(CFLAGS) -c -o $@ $<

%.s:	%.c
	$(CC) $(CFLAGS) -S -o $@ $<

%.pocket:	%.o
	$(CC) -o $@ $<

clean:
	rm -f *.o *.lst *.map *.pocket *.ihx *.sym *.cdb *.adb *.asm

# Link file, and write 0x80 at position 0x143 in header
colorbar.pocket:	colorbar.o
	$(CC) $(CFLAGS) -Wm-yC -o colorbar.pocket colorbar.o
