CC = sdcc
#CC = /home/johan/sdcc/bin/sdcc

MFLAGS = -mds390
LFLAGS = --xram-loc 0x180080 --code-loc 0x10000 -Wl-r

TARGETS = tstfind.hex temp.hex swtloop.hex swtoper.hex counter.hex \
	tstow.hex thermodl.hex gethumd.hex

OW_OBJECTS = ownetu.rel owsesu.rel owllu.rel owlli.rel owtrnu.rel \
	crcutil.rel tinilnk.rel findtype.rel ds2480ut.rel owfile.rel

SENSOR_OBJECTS = temp10.rel  swt12.rel cnt1d.rel thermo21.rel ad26.rel

TINI_TEST_OBJECTS =

all: ow.lib sensors.lib $(TINI_TEST_OBJECTS) $(TARGETS)

ow.lib: $(OW_OBJECTS)
	rm -f $@; \
	for object in $(OW_OBJECTS) $(TINI_TEST_OBJECTS); do \
		echo $$object >>$@; \
	done;

sensors.lib: $(SENSOR_OBJECTS)
	rm -f $@; \
	for object in $(SENSOR_OBJECTS); do \
		echo $$object >>$@; \
	done;

clean:
	rm -f core *~ \#* *.asm *.cdb *.rel *.hex *.ihx *.lst *.map \
		*.rst *.sym *.lnk *.lib *.dump*

%.hex: ow.lib sensors.lib $(TINI_TEST_OBJECTS) %.rel
	$(CC) $(MFLAGS) $(LFLAGS) $*.rel $(TINI_TEST_OBJECTS) \
		-L . ow.lib sensors.lib
	packihx $*.ihx >$@
	#tinitalk -c execute $@

%.rel: %.c
	$(CC) -c $(MFLAGS) $<
