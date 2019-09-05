# Port specification for compiling on the host machines version of gcc
SDCC = gcc
SDCCFLAGS = -Wall -fsigned-char -DREENTRANT=

EXEEXT = .bin

# Required extras
EXTRAS = fwk/lib/testfwk$(OBJEXT) ports/$(PORT)/support$(OBJEXT)

%.out: %$(EXEEXT)
	mkdir -p `dirname $@`
	-$< > $@
	-grep -n FAIL $@ /dev/null || true	

%$(EXEEXT): %$(OBJEXT) $(EXTRAS)
	$(SDCC) $(SDCCFLAGS) -o $@ $< $(EXTRAS)

%$(OBJEXT): %.c fwk/include/*.h
	$(SDCC) $(SDCCFLAGS) -c $< -o $@

_clean:
	rm -f ports/$(PORT)/support.o

