# If you move this project you can change the directory
# to match your GBDK root directory (ex: GBDK_HOME = "C:/GBDK/"
ifndef GBDK_HOME
	GBDK_HOME = ../../../
endif

LCC = $(GBDK_HOME)bin/lcc -mmos6502:nes -Wm-yoA -Wl-j

BINS	= smoketest.nes

# GBDK_DEBUG = ON
ifdef GBDK_DEBUG
	LCCFLAGS += -debug -v
endif


all:	$(BINS)

ASRC = $(wildcard *.s)
CSRC = $(wildcard *.c) 

OBJS = $(CSRC:%.c=%.o) $(ASRC:%.s=%.o)

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | sed s/mkdir\ -p\/mkdir\/ | grep -v make >> compile.bat

# Compile and link single file in one pass

%.o:	%.c
	$(LCC) $(LCCFLAGS) -c -o $@ $<

%.o:	%.s
	$(LCC) $(LCCFLAGS) -c -o $@ $<

$(BINS):	$(OBJS)
	$(LCC) $(LCCFLAGS) -Wm-yS -o $@ $^
	rm -f *.map *.noi *.ihx *.lst *.rst

clean:
	rm -f *.o *.lst *.map *.nes *~ *.rel *.cdb *.adb *.ihx *.lnk *.sym *.asm *.noi *.rst

