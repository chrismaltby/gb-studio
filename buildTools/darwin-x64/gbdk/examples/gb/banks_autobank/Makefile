LCC	= ../../../bin/lcc -Wa-l -Wl-m
BANKPACK  = ../../../bin/bankpack

# CFLAGS	=

BINS	    = autobanks.gb
CSOURCES   := $(wildcard *.c)
ASMSOURCES := $(wildcard *.s)

# Compiling will produce .o files
OBJS       = $(CSOURCES:%.c=%.o) $(ASMSOURCES:%.c=%.o)

# Process: .c and .s files -> .o -> (bankpack) -> .rel -> (linker) ... -> .gb
#
# In this makefile autobanked .o files get converted to .rel files (-ext=.rel)
# which will be passed to the linker instead of .o files.
#
# This allows correct packing every time, even
# for source files that don't get re-compiled.
OBJS_AUTOBANKED = $(CSOURCES:%.c=%.rel) $(ASMSOURCES:%.c=%.rel)

all:	$(BINS)

make.bat: Makefile
	@echo "REM Automatically generated from Makefile" > make.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> make.bat

%.o:	%.c
	$(LCC) $(CFLAGS) -c -o $@ $<

%.o:	%.s
	$(LCC) $(CFLAGS) -c -o $@ $<

%.s:	%.c
	$(LCC) $(CFLAGS) -S -o $@ $<

# Auto-bank the .o files into .rel files
# (called with $(OBJS), which is .o files)
# -v        : prints out assigned bank info
# -ext=.rel : set output extension for autobanked files to .rel
#
# Link the compiled object files into a autobanks.gb ROM file 
# (called with $(OBJS_AUTOBANKED), which is .rel files)
# -Wl-yo4      : Use 4 ROM banks
# -Wl-ya4      : Use 4 RAM banks
# -Wl-yt19     : Use MBC5 cartridge type
$(BINS):	$(OBJS)
	$(BANKPACK) -ext=.rel -v -yt19 $(OBJS)
	$(LCC) $(CFLAGS) -Wl-yt19 -Wl-yo4 -Wl-ya4 -o $(BINS) $(OBJS_AUTOBANKED)
#	./romusage autobanks.map -g

clean:
	rm -f *.o *.lst *.map *.gb *.ihx *.sym *.cdb *.adb *.asm *.rel


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

