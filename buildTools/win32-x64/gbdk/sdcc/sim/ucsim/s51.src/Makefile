# Generated automatically from Makefile.in by configure.
#
# uCsim s51.src/Makefile
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
STRIP		= strip

PRJDIR		= ..

DEFS            = $(subs -DHAVE_CONFIG_H,,-DHAVE_CONFIG_H)
CPPFLAGS        =  -I. -I$(PRJDIR) \
		  -I$(PRJDIR)/cmd.src -I$(PRJDIR)/sim.src -I$(PRJDIR)/gui.src
CFLAGS          =  -Wall
CXXFLAGS        =  -Wall
M_OR_MM         = -MM
PICOPT		= 
SHAREDLIB	= no

SDCC		= sdcc
SDCFLAGS	= --debug --stack-after-data --model-small
SDCPPFLAGS	= 

LIBS		=  -L$(PRJDIR) -lsim -lcmd -lguiucsim -lutil
DL		= 

dl_ok		= no

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

OBJECTS_SHARED	= glob.o sim51.o \
		  inc.o jmp.o mov.o logic.o arith.o bit.o \
		  timer0.o timer1.o timer2.o serial.o port.o interrupt.o \
		  uc51.o uc52.o uc51r.o uc89c51r.o uc251.o uc390.o
OBJECTS_EXE	= s51.o 
OBJECTS		= $(OBJECTS_SHARED) $(OBJECTS_EXE)


# Compiling entire program or any subproject
# ------------------------------------------
all: checkconf otherlibs s51.src

tests: test_ser.ihx

test_ser.ihx: test_ser.rel
	$(SDCC) $(SDCFLAGS) $<


# Compiling and installing everything and runing test
# ---------------------------------------------------
install: all installdirs
	if test -f s51.exe; then $(INSTALL) s51.exe $(bindir); $(STRIP) $(bindir)/s51.exe; fi
	if test -f s51; then $(INSTALL) s51 $(bindir); $(STRIP) $(bindir)/s51; fi


# Deleting all the installed files
# --------------------------------
uninstall:
	rm -f $(bindir)/s51


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

#parser.cc: parser.y

#plex.cc: plex.l

# My rules
# --------
.SUFFIXES: .rel

s51.src: s51 shared_lib

s51: $(OBJECTS) $(PRJDIR)/*.a
	$(CXX) $(CXXFLAGS) -o s51 $(OBJECTS) $(LIBS)

ifeq ($(SHAREDLIB),yes)
shared_lib: $(PRJDIR)/s51.so
else
shared_lib:
	@echo "No shared lib made."
endif

$(PRJDIR)/s51.so: $(OBJECTS_SHARED)
	$(CXX) -shared $(OBJECTS_SHARED) -o $(PRJDIR)/s51.so

otherlibs:
	cd $(PRJDIR)/cmd.src && $(MAKE) all
	cd $(PRJDIR)/sim.src && $(MAKE) all
	$(MAKE) -C $(PRJDIR)/gui.src checkconf ucsim_lib

.cc.o:
	$(CXX) $(CXXFLAGS) $(PICOPT) $(CPPFLAGS) -c $< -o $@

.c.rel:
	$(SDCC) $(SDCFLAGS) $(SDCPPFLAGS) -c $<


# Remaking configuration
# ----------------------
checkconf:
	@if [ -f $(PRJDIR)/devel ]; then\
	  $(MAKE) -f conf.mk srcdir="$(srcdir)" PRJDIR="$(PRJDIR)" freshconf;\
	fi

# End of s51.src/Makefile.in
