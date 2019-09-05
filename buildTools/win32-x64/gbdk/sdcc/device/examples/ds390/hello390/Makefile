hello390.hex: hello390.c
	sdcc -mds390 --xram-loc 0x100080 --code-loc 0x10000 \
		-Wl-r hello390.c
	packihx hello390.ihx >hello390.hex
	#tinitalk -c execute hello390.hex

clean:
	rm -f *~ \#* *.asm *.cdb *.rel *.hex *.ihx *.lst *.map *.rst *.sym *.lnk core *.dump*
