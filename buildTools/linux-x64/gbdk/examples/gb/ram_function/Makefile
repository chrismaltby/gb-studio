# If you move this project you can change the directory
# to match your GBDK root directory (ex: GBDK_HOME = "C:/GBDK/"
ifndef GBDK_HOME
	GBDK_HOME = ../../../
endif

LCC = $(GBDK_HOME)bin/lcc -Wa-l -Wl-m -Wl-j

BINS	= ram_fn.gb

# GBDK_DEBUG = ON
ifdef GBDK_DEBUG
	LCCFLAGS += -debug -v
endif


all:	$(BINS)

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | sed s/mkdir\ -p\/mkdir\/ | grep -v make >> compile.bat

%.o:	%.c
	$(LCC) $(LCCFLAGS) -c -o $@ $<

%.s:	%.c
	$(LCC) $(LCCFLAGS) -S -o $@ $<

%.o:	%.s
	$(LCC) $(LCCFLAGS) -c -o $@ $<

%.gb:	%.o
	$(LCC) $(LCCFLAGS) -o $@ $<

clean:
	rm -f *.o *.lst *.map *.gb *~ *.rel *.cdb *.adb *.ihx *.lnk *.sym *.asm *.noi *.rst


ram_fn.o:	ram_fn.c
	$(LCC) $(LCCFLAGS) -D_inc_ram=0xD000 -D_inc_hiram=0xFFA0 -c -o $@ $<

ram_fn.gb:	ram_fn.o
	$(LCC) $(LCCFLAGS) -Wl-g_inc_ram=0xD000 -Wl-g_inc_hiram=0xFFA0 -o $@ ram_fn.o

