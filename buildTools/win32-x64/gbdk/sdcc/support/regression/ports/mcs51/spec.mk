# Port specification for the mcs51 port running with uCsim

# path to uCsim
S51 = ../../sim/ucsim/s51.src/s51

SDCCFLAGS += --lesspedantic -DREENTRANT=reentrant --stack-after-data

OBJEXT = .rel
EXEEXT = .ihx

EXTRAS = fwk/lib/testfwk$(OBJEXT) ports/$(PORT)/support$(OBJEXT)

# Rule to link into .ihx
%$(EXEEXT): %$(OBJEXT) $(EXTRAS)
	$(SDCC) $(SDCCFLAGS) $(EXTRAS) $<
	mv fwk/lib/testfwk.ihx $@
	mv fwk/lib/testfwk.map $(@:.ihx=.map)

%$(OBJEXT): %.c
	$(SDCC) $(SDCCFLAGS) -c $<

# run simulator with 5 seconds timeout
%.out: %$(EXEEXT) ports/$(PORT)/timeout
	mkdir -p `dirname $@`
	-ports/$(PORT)/timeout 5 $(S51) -t32 -S in=/dev/null,out=$@ $< < ports/mcs51/uCsim.cmd >/dev/null || \
          echo -e --- FAIL: \"timeout, simulation killed\" in $(<:.ihx=.c)"\n"--- Summary: 1/1/1: timeout >> $@
	-grep -n FAIL $@ /dev/null || true

ports/$(PORT)/timeout: ports/$(PORT)/timeout.c
	gcc -o $@ $<

_clean:
	rm -f ports/$(PORT)/timeout ports/$(PORT)/timeout.exe ports/$(PORT)/*.rel ports/$(PORT)/*.rst \
	      ports/$(PORT)/*.lst ports/$(PORT)/*.sym ports/$(PORT)/*.asm temp.lnk

