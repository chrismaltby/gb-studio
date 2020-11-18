CC	= ../../../bin/lcc -Wa-l -Wl-m -Wl-j

BINS	= banks_farptr.gb \

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
# Banks using Far pointers example

bank2code.o:	bank2code.c
	$(CC) -Wf-bo1 -c -o $@ $<

banks_farptr.gb:	banks_farptr.o bank2code.o
	$(CC) -Wl-yt1 -Wl-yo4 -o $@ bank2code.o banks_farptr.o

