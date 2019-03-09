# Makefile to get and build all the parts of GBDK

CONFIG_SHELL := $(shell if [ -x "$$BASH" ]; then echo $$BASH; \
	else if [ -x /bin/bash ]; then echo /bin/bash; \
	else echo sh; fi ; fi)

TOPDIR	:= $(shell if [ "$$PWD" != "" ]; then echo $$PWD; else pwd; fi)

BUILD = $(TOPDIR)/build/gbdk
SDCCLIB = $(BUILD)
CVSFLAGS = -z5
CVS = cvs
DIR = .
VER = 2.95-3
# Used as a branch name.
SHORTVER = 295-3

# Options:
# linux-linux	 Building on Linux, targeting Linux
# linux-ming32	 Building on Linux, targeting mingw32 based win32
# cygwin-mingw32 Building via cygwin on win32, targeting mingw32

COMPILE_MODE = linux-linux
SDCC_OR_GBDK = gbdk

ROOT_GBDK = :pserver:anonymous@cvs.gbdk.sourceforge.net:/cvsroot/gbdk
ROOT_SDCC = :pserver:anonymous@cvs.sdcc.sourceforge.net:/cvsroot/sdcc

ifeq ($(COMPILE_MODE),linux-linux)
# For Linux
SE = 
E =
SDCC_ROOT = /usr/lib/$(SDCC_OR_GBDK)
endif

ifeq ($(COMPILE_MODE),linux-mingw32)
# For mingw32 hosted on Linux
# Tools name prefix
TNP = i386-mingw32-
# Source extension - what the gcc generated files have appended
SE =
# Dest extenstion - what extension we want them to have.
E = .exe
SDCC_ROOT = /$(SDCC_OR_GBDK)
# Set to cross to bypass the detection
CROSS_LIBGC = 1
endif

ifeq ($(COMPILE_MODE),cygwin-mingw32)
# For mingw32 on win32
# Source extension - what the gcc generated files have appended
SE = .exe
# Dest extenstion - what extension we want them to have.
SDCC_ROOT = /$(SDCC_OR_GBDK)
endif

MODELS = small medium

ifeq ($(SDCC_OR_GBDK),gbdk)
CONFIGURE_FLAGS = --disable-mcs51-port --disable-avr-port --disable-ds390-port
LIBS = gbdk-lib-gbz80 gbdk-lib-include gbdk-libc-copy
MISC = gbdk-lib-examples
DOC = gbdk-doc
DOC_MISC = gbdk-support/README gbdk-support/ChangeLog build.mak \
	   gbdk-support/mega.mak
else
LIBS = gbdk-lib sdcc-lib
MISC = sdcc-misc
DOC = sdcc-doc
endif

all: logged_in dist

clean:
	for i in sdcc gbdk-lib gbdk-support/lcc; do make -C $$i clean; done
	rm -f *~
	rm -rf $(BUILD) gbdk-lib gbdk-support sdcc logged_in

update: logged_in
	cd $(DIR); cvs $(CVSFLAGS) -d$(ROOT_SDCC) co -r $(SDCC_OR_GBDK)-$(SHORTVER) sdcc
	cd $(DIR); cvs $(CVSFLAGS) -d$(ROOT_GBDK) co -r $(SDCC_OR_GBDK)-$(SHORTVER) gbdk-lib
	cd $(DIR); cvs $(CVSFLAGS) -d$(ROOT_GBDK) co -r $(SDCC_OR_GBDK)-$(SHORTVER) gbdk-support

_sdcc: sdcc-bin $(LIBS) $(MISC) $(DOC)

tidy:
	rm -rf `find $(BUILD) -name "CVS"`
	rm -rf `find $(BUILD)/lib -name "*.asm"`
	-$(TNP)strip $(BUILD)/bin/*

sdcc-bin: sdcc/sdccconf.h
	make -C sdcc sdcc-cc sdcc-aslink CROSS_LIBGC=$(CROSS_LIBGC) \
	PASS_ON=SDCC_SUB_VERSION=$(SDCC_OR_GBDK)-$(VER)
	mkdir -p $(BUILD)/bin
	for i in \
	sdcc sdcpp link-gbz80 as-gbz80; \
	do cp sdcc/bin/$$i$(SE) $(BUILD)/bin/$$i$(E); done

sdcc-misc: sdcc/sdccconf.h
	make -C sdcc sdcc-misc CROSS_LIBGC=$(CROSS_LIBGC)
	mkdir -p $(BUILD)/bin
	for i in \
	sdcdb; \
	do cp sdcc/bin/$$i$(SE) $(BUILD)/bin/$$i$(E); done
	cp sdcc/sim/ucsim/s51.src/s51$(E) $(BUILD)/bin
	cp sdcc/sim/ucsim/z80.src/sz80$(E) $(BUILD)/bin
	cp sdcc/sim/ucsim/avr.src/savr$(E) $(BUILD)/bin
	cp sdcc/debugger/mcs51/*.el $(BUILD)/bin

sdcc-doc:
	(cd sdcc; tar cf - doc) | (cd $(BUILD); tar xf -)
	cp sdcc/README sdcc/COPYING $(BUILD)
	mkdir -p $(BUILD)/sim
	for i in COPYING INSTALL README TODO; \
	do cp sdcc/sim/ucsim/$$i $(BUILD)/sim; done
	(cd sdcc/sim/ucsim; tar cf - doc) | (cd $(BUILD)/sim; tar xf -)

gbdk-doc: gbdk-lib-doc

sdcc-lib: sdcc-lib-z80

gbdk-lib: gbdk-lib-z80 gbdk-lib-gbz80 gbdk-lib-include

gbdk-libc-copy:
	make -C gbdk-lib clean
	(cd gbdk-lib; tar cf - libc) | (cd $(BUILD); tar xf -)

gbdk-lib-gbz80: gbdk-lib-gbz80-rgbds gbdk-lib-gbz80-asxxxx

gbdk-lib-examples:
	make -C gbdk-lib/examples/gb make.bat
	(cd gbdk-lib; tar cf - examples) | (cd $(BUILD); tar xf -)

gbdk-lib-tools:
	(cd gbdk-lib; tar cf - tools) | (cd $(BUILD); tar xf -)

gbdk-lib-doc:
	mkdir -p $(BUILD)/doc/sdcc
	(cd sdcc/doc; tar cf - .) | (cd $(BUILD)/doc/sdcc; tar xf - )
	mkdir -p $(BUILD)/doc/asxxxx
	(cd sdcc/as/doc; tar cf - .) | (cd $(BUILD)/doc/asxxxx; tar xf - )
	for i in $(DOC_MISC); do \
	cp $(DOC_MISC) $(BUILD); done
	mkdir -p gbdk-lib/doc/libc
	cd gbdk-lib/include; doxygen libc.dox
	(cd gbdk-lib/doc; tar cf - libc) | (cd $(BUILD)/doc; tar xf -)

gbdk-lib-include:
	(cd gbdk-lib; tar cf - include) | (cd $(BUILD); tar xf -)

gbdk-lib-gbz80-asxxxx:
	mkdir -p $(BUILD)/lib
	for i in $(MODELS); do \
	make -C gbdk-lib/libc clean; \
	make -C gbdk-lib/libc SDCCLIB=$(BUILD) PORTS=gbz80 PLATFORMS=gb ASM=asxxxx MODEL=$$i; \
	(cd gbdk-lib/build; tar cf - $$i/asxxxx/gb $$i/asxxxx/gbz80) | (cd $(BUILD)/lib; tar xf -); \
	done

gbdk-lib-gbz80-rgbds:
	mkdir -p $(BUILD)/lib
	for i in $(MODELS); do \
	make -C gbdk-lib/libc clean; \
	make -C gbdk-lib/libc SDCCLIB=$(BUILD) PORTS=gbz80 PLATFORMS=gb ASM=rgbds MODEL=$$i; \
	(cd gbdk-lib/build; tar cf - $$i/rgbds/gb $$i/rgbds/gbz80) | (cd $(BUILD)/lib; tar xf -); \
	done

sdcc-lib-gen:
	make -C sdcc sdcc-device

lcc:
	make -C gbdk-support/lcc SDCCLIB=$(SDCC_ROOT)/ TNP=$(TNP)
	cp gbdk-support/lcc/lcc$(SE) $(BUILD)/bin/lcc$(E)

sdcc/sdccconf.h: sdcc/configure
ifdef TNP
	cd sdcc; \
	export CCC=$(TNP)c++; \
	export RANLIB=$(TNP)ranlib; \
	export CC=$(TNP)gcc; \
	./configure --datadir=$(SDCC_ROOT) $(CONFIGURE_FLAGS)
else
	cd sdcc; ./configure --datadir=$(SDCC_ROOT) $(CONFIGURE_FLAGS)
endif

dist: _sdcc lcc tidy

zdist: dist
	cd build; tar czf ../gbdk-$(VER).tar.gz $(SDCC_OR_GBDK)

logged_in:
	cvs -d$(ROOT_GBDK) login
	cvs -d$(ROOT_SDCC) login
	touch logged_in
	make -f build.mak update
