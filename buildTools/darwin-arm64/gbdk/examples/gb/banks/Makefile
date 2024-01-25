CC	= ../../../bin/lcc -Wa-l -Wl-m -Wl-j

BINS	= banks.gb \

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

%.gb:	%.o
	$(CC) -o $@ $<

clean:
	rm -f *.o *.lst *.map *.gb *~ *.rel *.cdb *.ihx *.lnk *.sym *.asm *.noi

############################################################
# Multiple bank example

# Compile bank 0 (no ROM)
#      RAM bank 0 : -Wf-ba0
#
bank_0.o:	bank_0.c
	$(CC) -Wf-ba0 -c -o $@ $<

# Compile bank 1 (ROM+RAM)
#      ROM bank 1 : -Wf-bo1
#      RAM bank 1 : -Wf-ba1
#
bank_1.o:	bank_1.c
	$(CC) -Wf-bo1 -Wf-ba1 -c -o $@ $<

# Compile bank 2 (ROM+RAM)
#      ROM bank 2 : -Wf-bo2
#      RAM bank 2 : -Wf-ba2
#
bank_2.o:	bank_2.c
	$(CC) -Wf-bo2 -Wf-ba2 -c -o $@ $<

# Compile bank 3 (ROM+RAM)
#      ROM bank 3 : -Wf-bo3
#      RAM bank 3 : -Wf-ba3
#
bank_3.o:	bank_3.c
	$(CC) -Wf-bo3 -Wf-ba3 -c -o $@ $<

# Link banks
#      MBC5+ROM+RAM : -Wl-yt0x19
#      4 ROM banks  : -Wl-yo4
#      4 RAM banks  : -Wl-ya4
#
banks.gb:	banks.o bank_0.o bank_1.o bank_2.o bank_3.o
	$(CC) -Wl-yt0x1A -Wl-yo4 -Wl-ya4 -o $@ banks.o bank_0.o bank_1.o bank_2.o bank_3.o

