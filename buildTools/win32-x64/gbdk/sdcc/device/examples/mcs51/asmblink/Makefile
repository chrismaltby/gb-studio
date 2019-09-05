# makefile for Linux

all : blink.ihx

blink.ihx : blink.lnk
	asx8051 -los blink.asm
	aslink -f blink.lnk

blink.lnk : blink_lnk
	cp blink_lnk blink.lnk

clean:
	rm -f mon.ihx *.lst *.rel *.rst *.sym *.cdb *.map *.ihx

