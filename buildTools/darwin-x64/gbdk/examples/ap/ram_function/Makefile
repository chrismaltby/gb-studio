CC	= ../../../bin/lcc -mgbz80:ap -Wl-j -Wm-yS

BINS	= ram_fn.pocket

all:	$(BINS)

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> compile.bat

%.o:	%.c
	$(CC) -c -o $@ $<

%.s:	%.c
	$(CC) -S -o $@ $<

%.o:	%.s
	$(CC) -c -o $@ $<

%.pocket:	%.o
	$(CC) -o $@ $<

clean:
	rm -f *.o *.lst *.map *.pocket *~ *.rel *.cdb *.ihx *.lnk *.sym *.asm *.noi


ram_fn.o:	ram_fn.c
	$(CC) -D_inc_ram=0xD000 -D_inc_hiram=0xFFA0 -c -o $@ $<

ram_fn.pocket:	ram_fn.o
	$(CC) -Wl-g_inc_ram=0xD000 -Wl-g_inc_hiram=0xFFA0 -o $@ $<

