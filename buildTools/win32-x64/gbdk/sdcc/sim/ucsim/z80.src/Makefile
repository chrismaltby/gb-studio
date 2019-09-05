# Generated automatically from Makefile.in by configure.
#
# uCsim z80.src/Makefile
#
# (c) Drotos Daniel, Talker Bt. 1997
#

STARTYEAR	= 1997

SHELL		= /bin/sh
CXX		= g++
CPP		= @CPP@
CXXCPP		= g++ -E
RANLIB		= ranlib
INSTALL		= /usr/bin/install -c

PRJDIR		= ..

DEFS            = $(subs -DHAVE_CONFIG_H,,-DHAVE_CONFIG_H)
CPPFLAGS        =  -I. -I$(PRJDIR) \
		  -I$(PRJDIR)/cmd.src -I$(PRJDIR)/sim.src -I$(PRJDIR)/gui.src
CFLAGS          =  -Wall
CXXFLAGS        =  -Wall
M_OR_MM         = -MM

LIBS		=  -L$(PRJDIR) -lsim -lcmd -lutil -lguiucsim

prefix          = /opt/gbdk
exec_prefix     = ${prefix}
bindir          = ${exec_prefix}/bin
libdir          = ${exec_prefix}/lib
datadir         = ${prefix}/share
includedir      = ${prefix}/include
mandir          = ${prefix}/man
man1dir         = $(mandir)/man1
man2dir         = $(mandir)/man2
infodir         = ${prefix}/info
srcdir          = .

OBJECTS         = sz80.o glob.o \
		  inst.o \
		  simz80.o z80.o

Z80ASM		= 
#TEST_OBJ	= test_bit.hex test_dis.hex test_mov.hex test_jmp.hex \
#		  test_arith.hex


# Compiling entire program or any subproject
# ------------------------------------------
all: checkconf otherlibs z80.src tests

tests: $(TEST_OBJ)


# Compiling and installing everything and runing test
# ---------------------------------------------------
install: all installdirs
	$(INSTALL) -s sz80 $(bindir)


# Deleting all the installed files
# --------------------------------
uninstall:
	rm -f $(bindir)/sz80


# Performing self-test
# --------------------
check:


# Performing installation test
# ----------------------------
installcheck:


# Creating installation directories
# ---------------------------------
installdirs:
	test -d $(bindir) || $(INSTALL) -d $(bindir)


# Creating dependencies
# ---------------------
dep: Makefile.dep

Makefile.dep: *.cc *.h
	$(CXXCPP) $(CPPFLAGS) $(M_OR_MM) *.cc >Makefile.dep

include Makefile.dep
include clean.mk

# My rules
# --------
.SUFFIXES: .asm .hex

z80.src: sz80

sz80: $(OBJECTS) $(PRJDIR)/*.a
	$(CXX) $(CXXFLAGS) -o sz80 $(OBJECTS) $(LIBS)

otherlibs:
	cd $(PRJDIR)/cmd.src && $(MAKE) all
	cd $(PRJDIR)/sim.src && $(MAKE) all

.cc.o:
	$(CXX) $(CXXFLAGS) $(CPPFLAGS) $(TARGET_ARCH) -c $< -o $@

.asm.hex:
	$(Z80ASM) -l $< -o $@ -e $<.lst


# Remaking configuration
# ----------------------
checkconf:
	@if [ -f $(PRJDIR)/devel ]; then\
	  $(MAKE) -f conf.mk srcdir="$(srcdir)" PRJDIR="$(PRJDIR)" freshconf;\
	fi

# End of z80.src/Makefile.in
