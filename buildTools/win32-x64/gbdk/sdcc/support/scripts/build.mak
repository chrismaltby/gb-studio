# Makefile to get and build all the parts of GBDK

CONFIG_SHELL := $(shell if [ -x "$$BASH" ]; then echo $$BASH; \
	else if [ -x /bin/bash ]; then echo /bin/bash; \
	else echo sh; fi ; fi)

TOPDIR	:= $(shell if [ "$$PWD" != "" ]; then echo $$PWD; else pwd; fi)

BUILD = $(TOPDIR)/build/sdcc
SDCCLIB = $(BUILD)
CVSFLAGS = -z5
CVS = cvs
DIR = .
VER = 2.2.1
# Used as a branch name.
SHORTVER = 221

# Options:
# linux-linux	 Building on Linux, targeting Linux
# linux-ming32	 Building on Linux, targeting mingw32 based win32
# cygwin-mingw32 Building via cygwin on win32, targeting mingw32

COMPILE_MODE = linux-mingw32
SDCC_OR_GBDK = sdcc

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

all: logged_in dist

clean:
	for i in sdcc gbdk-lib gbdk-support/lcc; do make -C $$i clean; done
	rm -f *~
	rm -rf $(BUILD) gbdk-lib gbdk-support sdcc logged_in

update: logged_in
	cd $(DIR); cvs $(CVSFLAGS) -d$(ROOT_SDCC) co -r sdcc-$(SHORTVER) sdcc
	cd $(DIR); cvs $(CVSFLAGS) -d$(ROOT_GBDK) co -r sdcc-$(SHORTVER) gbdk-lib
	cd $(DIR); cvs $(CVSFLAGS) -d$(ROOT_GBDK) co -r sdcc-$(SHORTVER) gbdk-support

_sdcc: sdcc-bin sdcc-misc sdcc-lib sdcc-doc

tidy:
	rm -rf `find $(BUILD) -name "CVS"`
	rm -rf `find $(BUILD)/lib -name "*.asm"`
	-$(TNP)strip $(BUILD)/bin/*

sdcc-bin: sdcc/sdccconf.h
	make -C sdcc sdcc-bin CROSS_LIBGC=$(CROSS_LIBGC)
	mkdir -p $(BUILD)/bin
	for i in \
	sdcc sdcpp link-z80 as-z80 aslink asx8051; \
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

sdcc-lib: sdcc-lib-z80 sdcc-lib-gen
	mkdir -p $(BUILD)/lib
	(cd sdcc/device/lib; tar cf - small large) | (cd $(BUILD)/lib; tar xf -)
	(cd sdcc/device; tar cf - examples include) | (cd $(BUILD); tar xf -)

sdcc-lib-z80:
	make -C gbdk-lib/libc SDCCLIB=$(BUILD) PORTS=z80 PLATFORMS=consolez80
	(cd gbdk-lib/build; tar cf - consolez80 z80) | (cd $(BUILD)/lib; tar xf -)
	mkdir -p $(BUILD)/include/gbdk-lib
	(cd gbdk-lib/include; tar cf - .) | (cd $(BUILD)/include/gbdk-lib; tar xf -)

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
	./configure --datadir=$(SDCC_ROOT)
	echo $$CCC
else
	cd sdcc; ./configure --datadir=$(SDCC_ROOT)
endif

dist: _sdcc lcc tidy

zdist: dist
	tar czf gbdk-$(VER).tar.gz gbdk

logged_in:
	cvs -d$(ROOT_GBDK) login
	cvs -d$(ROOT_SDCC) login
	touch logged_in
	make -f build.mak update
