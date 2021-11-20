#
# Simple Makefile that compiles all .c and .s files in the same folder
#

# If you move this project you can change the directory 
# to match your GBDK root directory (ex: GBDK_HOME = "C:/GBDK/"
GBDK_HOME = ../../../

LCC = $(GBDK_HOME)bin/lcc -mgbz80:ap -Wl-j -Wm-yS

# You can uncomment the line below to turn on debug output
# LCC = $(LCC) -debug

# You can set the name of the .pocket ROM file here
PROJECTNAME    = gbdecompress

BINS	    = $(PROJECTNAME).pocket
CSOURCES   := $(wildcard *.c)
ASMSOURCES := $(wildcard *.s)

all:	$(BINS)

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> compile.bat

# Compile and link all source files in a single call to LCC
$(BINS): $(CSOURCES) $(ASMSOURCES)
	$(LCC) -o $@ $(CSOURCES) $(ASMSOURCES)

clean:
	rm -f *.o *.lst *.map *.pocket *.ihx *.sym *.cdb *.adb *.asm *.noi

