PRJDIR = ..
include $(PRJDIR)/Makefile.common

PORTS = z80 gbz80
DOCS = README abstra.doc appendk.txt asmlnk.doc asxhtm.html format.txt

all:
	$(MAKE) -C z80 _as-z80 _as-gbz80 E=$(E) BUILDDIR=../../bin/

install: all install-doc
	$(INSTALL) $(PRJDIR)/bin/as-z80 `echo $(bindir)/as-z80|sed '$(transform)'`
	$(STRIP) `echo $(bindir)/as-z80|sed '$(transform)'`
	$(INSTALL) $(PRJDIR)/bin/as-gbz80 `echo $(bindir)/as-gbz80|sed '$(transform)'`
	$(STRIP) `echo $(bindir)/as-gbz80|sed '$(transform)'`

install-doc:
	$(INSTALL) -d $(docdir)/aslink
	cp -f `find doc -maxdepth 1 -not -type d` $(docdir)/aslink

include clean.mk
