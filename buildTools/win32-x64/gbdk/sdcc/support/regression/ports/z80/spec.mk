# Port specification for the z80 port running ontop of the Java based
# 'ConsoleZ80' emulator.

RRZ80 = $(SDCC_EXTRA_DIR)/emu/rrz80/rrz80

SDCCFLAGS += --lesspedantic --profile -DREENTRANT=

EXEEXT = .bin

# Needs parts of gbdk-lib, namely the internal mul/div/mod functions.
EXTRAS = fwk/lib/testfwk$(OBJEXT) ports/$(PORT)/support$(OBJEXT)

# Rule to generate a Emulator .bin file from the .ihx linker output.
%$(EXEEXT): %.ihx
	$(SDCC_DIR)/bin/makebin -s 32768 < $< > $@

# Rule to link into .ihx
%.ihx: %.c $(EXTRAS)
	$(SDCC) $(SDCCFLAGS) $< $(EXTRAS)

%$(OBJEXT): %.asm
	$(SDCC_DIR)/bin/as-z80 -plosgff $@ $<

%$(OBJEXT): %.s
	$(SDCC_DIR)/bin/as-z80 -plosgff $@ $<

%$(OBJEXT): %.c
	$(SDCC) $(SDCCFLAGS) -c $<

fwk/lib/testfwk$(OBJEXT): fwk/lib/testfwk.c
	$(SDCC) $(SDCCFLAGS) -c $<

# PENDING: Path to sdcc-extra
%.out: %$(EXEEXT)
	mkdir -p `dirname $@`
	$(RRZ80) --maxruntime=3 --mapfile=$(<:.bin=.sym) $< > $@
	-grep -n FAIL $@ /dev/null || true

_clean:
	rm -f ports/$(PORT)/*.lst ports/$(PORT)/*.o ports/$(PORT)/*.sym

