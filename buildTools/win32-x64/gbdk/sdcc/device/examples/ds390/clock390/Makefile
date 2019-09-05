CC = sdcc

MFLAGS = -mds390
LFLAGS = --xram-loc 0x100080 --code-loc 0x10000 -Wl-r

OBJECTS = clock390.rel

all: clock390.hex

clean:
	rm -f *~ \#* *.asm *.cdb *.rel *.hex *.ihx *.lst *.map *.rst *.sym *.lnk core *.dump*

clock390.hex: $(OBJECTS)
	$(CC) $(MFLAGS) $(LFLAGS) $(OBJECTS)
	packihx clock390.ihx >clock390.hex
	#tinitalk -c execute clock390.hex

%.rel: %.c
	$(CC) -c $(MFLAGS) $<
