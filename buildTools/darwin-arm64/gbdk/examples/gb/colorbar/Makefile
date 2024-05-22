# If you move this project you can change the directory
# to match your GBDK root directory (ex: GBDK_HOME = "C:/GBDK/"
ifndef GBDK_HOME
	GBDK_HOME = ../../../
endif

LCC = $(GBDK_HOME)bin/lcc -Wa-l -Wl-m

# GBDK_DEBUG = ON
ifdef GBDK_DEBUG
	LCCFLAGS += -debug -v
endif

# CFLAGS	=

BINS	= colorbar.gb

all:	$(BINS)

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | sed s/mkdir\ -p\/mkdir\/ | grep -v make >> compile.bat

%.o:	%.c
	$(LCC) $(LCCFLAGS) $(CFLAGS) -c -o $@ $<

%.o:	%.s
	$(LCC) $(LCCFLAGS) $(CFLAGS) -c -o $@ $<

%.s:	%.c
	$(LCC) $(LCCFLAGS) $(CFLAGS) -S -o $@ $<

%.gb:	%.o
	$(LCC) $(LCCFLAGS) -o $@ $<

clean:
	rm -f *.o *.lst *.map *.gb *.ihx *.sym *.cdb *.adb *.asm *.noi *.rst

# Link file, and write 0x80 at position 0x143 in header
colorbar.gb:	colorbar.o
	$(LCC) $(LCCFLAGS) $(CFLAGS) -Wm-yC -o colorbar.gb colorbar.o
