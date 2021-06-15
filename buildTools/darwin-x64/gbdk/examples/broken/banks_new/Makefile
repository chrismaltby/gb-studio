CC	= ../../../bin/lcc -Wa-l -Wl-m -Wl-j

BINS	= banks_new.gb


all:	$(BINS)

make.bat: Makefile
	@echo "REM Automatically generated from Makefile" > make.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> make.bat

%.o:	%.c
	$(CC) -c -o $@ $<

%.s:	%.c
	$(CC) -S -o $@ $<

%.o:	%.s
	$(CC) -c -o $@ $<

%.gb:	%.o
	$(CC) -o $@ $<

clean:
	rm -f *.o *.lst *.map *.gb *~ *.rel *.cdb *.ihx *.lnk *.sym *.asm *.noi


############################################################
# Multiple banks NEW method example

banks_new.gb: MBC1_RAM_INIT.o banks_new.o
	$(CC) -Wl-yt2 -Wl-yo4 -Wl-ya4 -o $@ MBC1_RAM_INIT.o banks_new.o
