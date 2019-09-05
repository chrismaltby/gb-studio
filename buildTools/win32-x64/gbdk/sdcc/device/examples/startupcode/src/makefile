# Makefile for startup-code

SDCC            = sdcc
AS              = asx8051
CP              = cp
RM              = rm -f

CFLAGS          = --debug --stack-after-data --model-large
LDFLAGS         = --debug --stack-after-data

COBJECTS        =	startup_code.rel \
			cpu_c515a.rel

CSOURCES        = $(patsubst %.rel,%.c,$(COBJECTS))

.SUFFIXES: .rel

.c.rel:
	$(SDCC) $(CFLAGS) -c $<

all: startup
	$(SDCC) $(LDFLAGS) $(COBJECTS)

c: $(COBJECTS)

startup: $(COBJECTS)

clean:
	$(RM) *.lst
	$(RM) *.asm
	$(RM) *.bak
	$(RM) *.rst
	$(RM) *.sym
	$(RM) *.hex
	$(RM) *.map

include makefile.dep

dep: makefile.dep

makefile.dep: $(CSOURCES)
	rm -f makefile.dep
	for csrc in $(CSOURCES) ;do\
	$(SDCC) -MM $$csrc >>makefile.dep ;\
	done
