CC = sdcc

MFLAGS = -mds390
LFLAGS = --xram-loc 0x100080 --code-loc 0x10000 -Wl-r

OBJECTS = rtc390.rel

all: rtc390.hex

clean:
	rm -f *~ \#* *.asm *.cdb *.rel *.hex *.ihx *.lst *.map *.rst *.sym *.lnk core *.dump*

rtc390.hex: $(OBJECTS)
	$(CC) $(MFLAGS) $(LFLAGS) $(OBJECTS) 
	packihx rtc390.ihx >rtc390.hex
	#tinitalk -c execute rtc390.hex

%.rel: %.c
	$(CC) -c $(MFLAGS) -I . $<
