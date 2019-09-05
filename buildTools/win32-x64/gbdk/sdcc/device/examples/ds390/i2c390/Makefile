CC = sdcc

MFLAGS = -mds390
LFLAGS = --xram-loc 0x100080 --code-loc 0x10000 -Wl-r

OBJECTS = i2c390.rel ds1621.rel pcf8591.rel

all: i2c390.hex

clean:
	rm -f *~ \#* *.asm *.cdb *.rel *.hex *.ihx *.lst *.map *.rst *.sym *.lnk core *.dump*

i2c390.hex: $(OBJECTS)
	$(CC) $(MFLAGS) $(LFLAGS) $(OBJECTS)
	packihx i2c390.ihx >i2c390.hex
	#tinitalk -c execute i2c390.hex

%.rel: %.c
	$(CC) -c $(MFLAGS) $<
