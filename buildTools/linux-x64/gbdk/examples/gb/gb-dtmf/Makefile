# If you move this project you can change the directory
# to match your GBDK root directory (ex: GBDK_HOME = "C:/GBDK/"
ifndef GBDK_HOME
	GBDK_HOME = ../../../
endif

LCC = $(GBDK_HOME)bin/lcc -Wa-l -Wl-m

BINS	= gb-dtmf.gb

all:	$(BINS)

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | sed s/mkdir\ -p\/mkdir\/ | grep -v make >> compile.bat

%.s:	%.c
	$(LCC) $(LCCFLAGS) -S -o $@ $<

%.o:	%.c
	$(LCC) $(LCCFLAGS) -c -o $@ $<

%.o:	%.s
	$(LCC) $(LCCFLAGS) -c -o $@ $<

%.gb:	%.o
	$(LCC) $(LCCFLAGS) -o $@ $<

clean:
	rm -f *.o *.lst *.map *.gb *.ihx *.sym *.cdb *.adb *.asm *.noi *.rst
