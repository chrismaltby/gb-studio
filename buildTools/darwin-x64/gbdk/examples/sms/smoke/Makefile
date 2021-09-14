CC	= ../../../bin/lcc -mz80:sms -Wm-yoA -Wa-l -Wl-j

BINS	= smoketest.sms

all:	$(BINS)

ASRC = $(wildcard *.s)
CSRC = $(wildcard *.c) 

OBJS = $(CSRC:%.c=%.o) $(ASRC:%.s=%.o)

make.bat: Makefile
	@echo "REM Automatically generated from Makefile" > make.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> make.bat

# Compile and link single file in one pass

%.o:	%.c
	$(CC) -c -o $@ $<

%.o:	%.s
	$(CC) -c -o $@ $<

$(BINS):	$(OBJS)
	$(CC) -Wm-yS -o $@ $^
	rm -f *.map *.noi *.ihx *.lst

clean:
	rm -f *.o *.lst *.map *.sms *~ *.rel *.cdb *.ihx *.lnk *.sym *.asm *.noi

