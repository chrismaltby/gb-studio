TARGETS = clock390 hello390 i2c390 readmac rtc390 ow390

all: $(TARGETS)
	for target in $(TARGETS); do \
		(cd $$target; $(MAKE)); \
	done;

clean: $(TARGETS)
	rm -f *~ \#* *.asm *.cdb *.rel *.hex *.ihx *.lst *.map *.rst *.sym *.lnk
	for target in $(TARGETS); do \
		(cd $$target; $(MAKE) clean); \
	done;
