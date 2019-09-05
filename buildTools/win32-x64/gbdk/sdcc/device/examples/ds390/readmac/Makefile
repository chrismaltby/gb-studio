CC = sdcc

MFLAGS = -mds390
LFLAGS = --xram-loc 0x180080 --code-loc 0x10000 -Wl-r

OBJECTS = readmac.rel ow.rel crcutil.rel

all: readmac.hex

clean:
	rm -f *~ \#* *.asm *.cdb *.rel *.hex *.ihx *.lst *.map *.rst *.sym *.lnk core *.dump*

readmac.hex: readmac.ihx
	packihx readmac.ihx >readmac.hex

readmac.ihx: $(OBJECTS)
	$(CC) $(MFLAGS) $(LFLAGS) $(OBJECTS)

%.rel: %.c
	$(CC) -c $(MFLAGS) $<
