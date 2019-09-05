# Top level Makefile for GBDK that combines the builds for sdcc,
# gbdk-lib, gbdk-support and maccer
#
# 2001  Michael Hope <michaelh@juju.net.nz>
# $Id: Makefile,v 1.4 2001/11/04 18:43:51 michaelh Exp $
#
TOPDIR = $(shell pwd)

# Package name, used for tarballs and cvs
PKG = gbdk
# Version, used for tarballs
VER = 2.96a
# Short version, used for cvs tags
SHORTVER = 296

# Prefix to add to the standard tools.  Usefull for a standard gcc
# cross-compile.
TOOLSPREFIX =

TARGETCC = $(TOOLSPREFIX)gcc
TARGETRANLIB = $(TOOLSPREFIX)ranlib
TARGETAR = $(TOOLSPREFIX)ar
TARGETCXX = $(TOOLSPREFIX)g++
TARGETSTRIP = $(TOOLSPREFIX)strip
# Add extra flags here.  g++ 2.95.4 requires -fdollars-in-identifiers
TARGETCXXFLAGS =

# Directory containing the source to maccer
MACCERDIR = $(TOPDIR)/maccer
# Directory containing the source to sdcc
SDCCDIR = $(TOPDIR)/sdcc
# Directory containing the source to gbdk-lib
GBDKLIBDIR = $(TOPDIR)/gbdk-lib
# Directory containing the source to gbdk-support
GBDKSUPPORTDIR = $(TOPDIR)/gbdk-support


# Base setup
# Extension to add to executables
EXEEXTENSION = 
# Host operating system identifier.  The one below should work for
# most systems.
HOSTOS = ppc-unknown-linux2.2
# Target operating system identifier.  Used in the output zip name.
TARGETOS = ppc-unknown-linux2.2

# Directory that gbdk should finally end up in
TARGETDIR = /opt/gbdk
# Directory that gbdk for this target is built into.
BUILDDIR = $(TOPDIR)/build/$(TARGETOS)/gbdk

NOISELOG = $(TOPDIR)/noise.log

all: native-build

clean: sdcc-clean gbdk-support-clean gbdk-lib-clean

distclean: clean build-dir-clean

# Build rule for michaelh's machine to spin a release
sapphire-full-build: native-build binary cross-clean cross-linux-mingw32-build

# Cross-compilation targets
FIXUPMASKS = *.c *.h .bat *.s ChangeLog README

native-build: gbdk-build gbdk-install

cross-clean: sdcc-clean gbdk-support-clean

cross-build: gbdk-build gbdk-install cross-cleanup

cross-cleanup:
ifdef MSDOSLINEENDS
	for i in $(FIXUPMASKS); do \
		find $(BUILDDIR) -name $$i -exec unix2dos {} \; ; \
	done
endif

cross-linux-mingw32-build:
	$(MAKE) TARGETOS=i586-mingw32msvc \
		TOOLSPREFIX=i586-mingw32msvc- \
		EXEEXTENSION=.exe \
		CROSSCOMPILING=1 \
		MSDOSLINEENDS=1 \
		TARGETDIR=/sdcc \
		ARCHIVETYPE=zip \
		cross-build gbdk-lib-examples-makefile binary

# Source code drop
src: clean
	rm -rf gbdk
	mkdir -p gbdk
	cp -r Makefile sdcc gbdk-lib gbdk-support gbdk
	rm -rf `find gbdk -name CVS`
	tar czf gbdk-$(VER).tar.gz gbdk

# Base rules
gbdk-build: maccer-build sdcc-build gbdk-support-build gbdk-lib-build 

gbdk-install: sdcc-install gbdk-support-install gbdk-lib-install

# Directories
build-bin-dir:
	mkdir -p $(BUILDDIR)/bin

build-dir-clean:
	rm -r $(BUILDDIR)

# Setup rules
CVSFLAGS = -r $(PKG)-$(SHORTVER)

setup-from-local:
	rm -rf sdcc gbdk-lib gbdk-support
	ln -s ../sdcc
	ln -s ../gbdk-lib
	ln -s ../gbdk-support

setup-from-cvs:
	cvs -d :pserver:anonymous@cvs.sdcc.sourceforge.net:/cvsroot/sdcc -q co $(CVSFLAGS) sdcc
	cvs -d :pserver:anonymous@cvs.gbdk.sourceforge.net:/cvsroot/gbdk -q co $(CVSFLAGS) gbdk-lib
	cvs -d :pserver:anonymous@cvs.gbdk.sourceforge.net:/cvsroot/gbdk -q co $(CVSFLAGS) gbdk-support

# Rules for maccer
maccer-build:
	$(MAKE) -C $(MACCERDIR)

maccer-clean:
	$(MAKE) -C $(MACCERDIR) clean

# Rules for sdcc
SDCCCONFIGUREFLAGS = \
		--disable-mcs51-port \
		--disable-avr-port \
		--disable-ds390-port \
		--disable-pic-port \
		--disable-i186-port \
		--disable-tlcs900h-port \
		--disable-ucsim \
		--disable-device-lib-build \
		--disable-packihx

SDCCCONFIGUREFLAGS += \
		--prefix=$(TARGETDIR) \
		--program-suffix=$(EXEEXTENSION)

sdcc-build: $(SDCCDIR)/sdccconf.h
	$(MAKE) -C $(SDCCDIR) SDCC_SUB_VERSION=$(PKG)-$(VER)

$(SDCCDIR)/sdccconf.h:
	cd $(SDCCDIR); CC=$(TARGETCC) CXX=$(TARGETCXX) STRIP=$(TARGETSTRIP) RANLIB=$(TARGETRANLIB) CXXFLAGS=$(TARGETCXXFLAGS) ./configure $(SDCCCONFIGUREFLAGS) --host=$(HOSTOS)

sdcc-install: sdcc-build build-bin-dir
	rm -fr tmp
	$(MAKE) -C $(SDCCDIR) install prefix=$(TOPDIR)/tmp
	cp tmp/bin/sdcc* tmp/bin/sdcpp* tmp/bin/link-* tmp/bin/as-* $(BUILDDIR)/bin

# PENDING: Hack below
sdcc-clean:
	-$(MAKE) -C $(SDCCDIR) distclean
	touch $(SDCCDIR)/doc/holder.pdf

# Rules for gbdk-support
gbdk-support-build:
	$(MAKE) -C $(GBDKSUPPORTDIR)/lcc TOOLSPREFIX=$(TOOLSPREFIX) TARGETDIR=$(TARGETDIR)/

gbdk-support-install: gbdk-support-build build-bin-dir
	cp $(GBDKSUPPORTDIR)/lcc/lcc $(BUILDDIR)/bin/lcc$(EXEEXTENSION)
	$(TARGETSTRIP) $(BUILDDIR)/bin/lcc*
	cp $(GBDKSUPPORTDIR)/README $(GBDKSUPPORTDIR)/ChangeLog $(BUILDDIR)

gbdk-support-clean:
	$(MAKE) -C $(GBDKSUPPORTDIR)/lcc clean

# Rules for gbdk-lib
gbdk-lib-build:
ifndef CROSSCOMPILING
	$(MAKE) -C $(GBDKLIBDIR)/libc PORTS=gbz80 PLATFORMS=gb SDCCLIB=$(SDCCDIR)
endif

gbdk-lib-install: gbdk-lib-build
	cp -r $(GBDKLIBDIR)/libc $(GBDKLIBDIR)/include $(GBDKLIBDIR)/examples $(GBDKLIBDIR)/tools $(BUILDDIR)
	rm -rf $(BUILDDIR)/lib
	cp -r $(GBDKLIBDIR)/build $(BUILDDIR)/lib

gbdk-lib-clean:
	$(MAKE) -C $(GBDKLIBDIR) clean

gbdk-lib-examples-makefile:
	$(MAKE) -C $(BUILDDIR)/examples/gb make.bat
	unix2dos $(BUILDDIR)/examples/gb/make.bat

# Final binary
binary: binary-tidyup
ifeq ($(ARCHIVETYPE),zip)
	rm -f $(TOPDIR)/gbdk-$(VER)-$(TARGETOS).zip
	cd $(BUILDDIR)/..; zip -9Xrq $(TOPDIR)/gbdk-$(VER)-$(TARGETOS).zip gbdk
else
	rm -f $(TOPDIR)/gbdk-$(VER)-$(TARGETOS).tar.gz
	cd $(BUILDDIR)/..; tar czf $(TOPDIR)/gbdk-$(VER)-$(TARGETOS).tar.gz gbdk
endif

binary-tidyup:
	rm -rf `find $(BUILDDIR) -name CVS`

# Install
install: native-build
	mkdir -p $(TARGETDIR)
	cp -r $(BUILDDIR)/* $(TARGETDIR)
