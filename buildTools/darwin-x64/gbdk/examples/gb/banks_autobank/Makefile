CC	= ../../../bin/lcc -Wa-l -Wl-m

CFLAGS	= -DGBDK_2_COMPAT

BINS	    = autobanks.gb
CSOURCES   := $(wildcard *.c)
ASMSOURCES := $(wildcard *.s)
OBJS       = $(CSOURCES:%.c=%.o) $(ASMSOURCES:%.c=%.o)

all:	$(BINS)

make.bat: Makefile
	@echo "REM Automatically generated from Makefile" > make.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> make.bat

%.o:	%.c
	$(CC) $(CFLAGS) -c -o $@ $<

%.o:	%.s
	$(CC) $(CFLAGS) -c -o $@ $<

%.s:	%.c
	$(CC) $(CFLAGS) -S -o $@ $<

# Link the compiled object files into a autobanks.gb ROM file
# -autobank : turns on auto banking
# -Wb-v     : prints out assigned bank info
# -Wl-yo4   : Use 4 ROM banks
# -Wl-ya4   : Use 4 RAM banks
# -Wl-yt19  : Use MBC5 cartridge type
$(BINS):	$(OBJS)
	$(CC) $(CFLAGS) -autobank -Wb-v -Wl-yt19 -Wl-yo4 -Wl-ya4 -o $(BINS) $(OBJS)
#	./romusage autobanks.map -g

clean:
	rm -f *.o *.lst *.map *.gb *.ihx *.sym *.cdb *.adb *.asm


# For lcc linker option: -Wl-ytN where N is one of the numbers below
#
# ROM Byte 0147: Cartridge type:
# 0-ROM ONLY            12-ROM+MBC3+RAM
# 1-ROM+MBC1            13-ROM+MBC3+RAM+BATT
# 2-ROM+MBC1+RAM        19-ROM+MBC5
# 3-ROM+MBC1+RAM+BATT   1A-ROM+MBC5+RAM
# 5-ROM+MBC2            1B-ROM+MBC5+RAM+BATT
# 6-ROM+MBC2+BATTERY    1C-ROM+MBC5+RUMBLE
# 8-ROM+RAM             1D-ROM+MBC5+RUMBLE+SRAM
# 9-ROM+RAM+BATTERY     1E-ROM+MBC5+RUMBLE+SRAM+BATT
# B-ROM+MMM01           1F-Pocket Camera
# C-ROM+MMM01+SRAM      FD-Bandai TAMA5
# D-ROM+MMM01+SRAM+BATT FE - Hudson HuC-3
# F-ROM+MBC3+TIMER+BATT FF - Hudson HuC-1
# 10-ROM+MBC3+TIMER+RAM+BATT
# 11-ROM+MBC3

