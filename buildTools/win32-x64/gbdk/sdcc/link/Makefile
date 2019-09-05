PRJDIR = ..

include $(PRJDIR)/Makefile.common

PORTS = z80 gbz80

all: 
	$(MAKE) -C z80 _link-z80 _link-gbz80 E=$(E) BUILDDIR=../../bin/

install: all
	$(INSTALL) $(PRJDIR)/bin/link-z80 `echo $(bindir)/link-z80|sed '$(transform)'`
	$(STRIP) `echo $(bindir)/link-z80|sed '$(transform)'`
	$(INSTALL) $(PRJDIR)/bin/link-gbz80 `echo $(bindir)/link-gbz80|sed '$(transform)'`
	$(STRIP) `echo $(bindir)/link-gbz80|sed '$(transform)'`

include clean.mk
