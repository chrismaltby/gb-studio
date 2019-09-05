# A simple Makefile that attempts to weave everything together
# for a build.  Basically:
#  * Makes a temporary build directory
#  * Copies itself and build.mak off, hands over to the new Makefile
#  * Downloads the source
#  * Compiles the native, then win32 versions
#  * Takes the libs from native and hooks them into win32
#  * tars it all up and calls it done

DIST = gbdk

BUILD_DIR = /home/michaelh/tmp/$(DIST)-build
NATIVE = linux-linux
CROSS = linux-mingw32
NATIVE_DIST = linux-glibc2
CROSS_DIST = win32

VER = 2.21-pre1

all: spawn

spawn:
	mkdir -p $(BUILD_DIR)
	cp build.mak mega.mak $(BUILD_DIR)
	make -C $(BUILD_DIR) -f mega.mak build

build: orig native cross dist

dist:
	cd $(NATIVE)/build; tar czf ../../$(DIST)-$(VER)-$(NATIVE_DIST).tar.gz $(DIST)
ifeq ($(CROSS_DIST), win32)
	rm -f $(DIST)-$(VER)-$(CROSS_DIST).zip
	cd $(CROSS)/build; zip -rlq9 ../../$(DIST)-$(VER)-$(CROSS_DIST).zip $(DIST)
else
	cd $(CROSS)/build; tar czf ../../$(DIST)-$(VER)-$(CROSS_DIST).tar.gz $(DIST)
endif

clean:
	rm -rf $(BUILD_DIR)

orig:
	mkdir -p orig
	cp build.mak orig
	touch orig/logged_in			# Assume already logged in
	make -C orig -f build.mak update

linux-linux: orig
	mkdir -p linux-linux
	(cd orig; tar cf - .) | (cd linux-linux; tar xf -)

linux-mingw32: orig
	mkdir -p linux-mingw32
	(cd orig; tar cf - .) | (cd linux-mingw32; tar xf -)

native: $(NATIVE) dummy
	cp build.mak $(NATIVE)
	make -C $(NATIVE) -f build.mak COMPILE_MODE=$(NATIVE)

dummy:

# We do a first pass, ignored build on sdccconf.h as at the moment
# it fails while configuring the sim.
cross-bin: $(CROSS) dummy
	cp build.mak $(CROSS)
	-make -C $(CROSS) -f build.mak COMPILE_MODE=$(CROSS) sdcc/sdccconf.h
	make -C $(CROSS) -f build.mak COMPILE_MODE=$(CROSS) sdcc-bin lcc tidy

# Binary files are compiled; now copy the built libs from the native
# version across
cross-mix:
	mv $(CROSS)/build/$(DIST)/bin $(CROSS)/build/$(DIST)/bin.1
	(cd $(NATIVE); tar cf - build/$(DIST)) | (cd $(CROSS); tar xf - )
	rm -rf $(CROSS)/build/$(DIST)/bin
	mv $(CROSS)/build/$(DIST)/bin.1 $(CROSS)/build/$(DIST)/bin

cross: cross-bin cross-mix
