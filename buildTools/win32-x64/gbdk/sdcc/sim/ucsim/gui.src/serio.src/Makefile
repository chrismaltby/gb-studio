# Generated automatically from Makefile.in by configure.
# Makefile for kano-networks talker

SHELL		= /bin/sh
CXX		= g++
CXXCPP		= g++ -E
INSTALL		= /usr/bin/install -c
CP		= /bin/cp

PRJDIR		= ../..

DEFS            = $(subs -DHAVE_CONFIG_H,,-DHAVE_CONFIG_H)
CPPFLAGS        =  -I. -I$(PRJDIR)
#		  -I$(PRJDIR)/cmd.src -I$(PRJDIR)/sim.src
CFLAGS          =  -Wall
CXXFLAGS        =  -Wall
M_OR_MM         = -MM

LIBS		=  

curses_ok	= 

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

OBJECTS		= main.o fileio.o frontend.o posix_signal.o


# Compiling entire program or any subproject
# ------------------------------------------
all: serio.src

ifeq ($(curses_ok),yes)
serio.src: checkconf serialview
else
serio.src: checkconf
endif


# Compiling and installing everything and runing test
# ---------------------------------------------------
install: all installdirs
	$(INSTALL) -s serialview $(bindir)


# Deleting all the installed files
# --------------------------------
uninstall:
	rm -f $(bindir)/serialview


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

Makefile.dep: *.cc *.h *.hh
	$(CXXCPP) $(CPPFLAGS) $(M_OR_MM) *.cc >Makefile.dep

include Makefile.dep
include clean.mk


# My rules
# --------
serialview: $(OBJECTS)
	$(CXX) -o $@ $(OBJECTS) $(LIBS)

.cc.o:
	$(CXX) $(CXXFLAGS)  $(CPPFLAGS) -c $< -o $@

# Remaking configuration
# ----------------------
checkconf:
	@if [ -f $(PRJDIR)/devel ]; then\
	  $(MAKE) -f conf.mk srcdir="$(srcdir)" PRJDIR="$(PRJDIR)" freshconf;\
	fi

# End of gui.src/serio.src/Makefile.in
