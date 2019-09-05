CC = sdcc

MFLAGS = -mds390 --model-flat24 --stack-10bit
MFLAGS += -DREG= -DNOSTRUCTASSIGN -DNOENUM
LFLAGS = --xram-loc 0x100080 --code-loc 0x10000 -Wl-r

OBJECTS = dhry.rel

all: dhry.hex

clean:
	rm -f *~ \#* *.asm *.cdb *.rel *.hex *.ihx *.lst *.map *.rst *.sym *.lnk

dhry.hex: dhry.ihx
	packihx dhry.ihx >dhry.hex

dhry.ihx: $(OBJECTS)
	$(CC) $(MFLAGS) $(LFLAGS) $(OBJECTS)

%.rel: %.c
	$(CC) -c $(MFLAGS) $<
