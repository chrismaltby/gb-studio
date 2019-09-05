# Port specification for the gbz80 port.

EMU = $(SDCC_EXTRA_DIR)/emu/rrgb/rrgb

SDCCFLAGS += --lesspedantic -DREENTRANT=

EXEEXT = .gb

# Needs parts of gbdk-lib, namely the internal mul/div/mod functions.
EXTRAS = fwk/lib/testfwk$(OBJEXT) ports/$(PORT)/support$(OBJEXT)

# Rule to link into .ihx
%.gb: %.c $(EXTRAS)
	$(SDCC) $(SDCCFLAGS) $< $(EXTRAS)

%$(OBJEXT): %.asm
	../../bin/as-gbz80 -plosgff $@ $<

%$(OBJEXT): %.s
	../../bin/as-gbz80 -plosgff $@ $<

%$(OBJEXT): %.c
	$(SDCC) $(SDCCFLAGS) -c $<

# PENDING: Path to sdcc-extra
%.out: %$(EXEEXT)
	mkdir -p `dirname $@`
	$(EMU) -m $< > $@
	-grep -n FAIL $@ /dev/null || true

_clean:
	rm -f ports/$(PORT)/*.lst ports/$(PORT)/*.o ports/$(PORT)/*.sym

