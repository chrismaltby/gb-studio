# Generated automatically from Makefile.in by configure.
#
#
#

VERSION         = 2.3.1
VERSIONHI       = 2
VERSIONLO       = 3
VERSIONP        = 1

SHELL		= /bin/sh
CPP		= gcc -E
INSTALL		= /usr/bin/install -c
CP              = cp

PRJDIR		= ..

prefix          = /opt/gbdk
exec_prefix     = ${prefix}
bindir          = ${exec_prefix}/bin
libdir          = ${exec_prefix}/lib
datadir         = ${prefix}/share
sdcc_datadir    = ${prefix}/share/sdcc
includedir      = ${prefix}/include
mandir          = ${prefix}/man
man1dir         = $(mandir)/man1
man2dir         = $(mandir)/man2
infodir         = ${prefix}/info
srcdir          = .

CPPFLAGS        =  -I$(PRJDIR)


# Compiling entire program or any subproject
# ------------------------------------------
all:


# Compiling and installing everything and runing test
# ---------------------------------------------------
install: all installdirs
	$(CP) -r asm *.h $(sdcc_datadir)/include/


# Deleting all the installed files
# --------------------------------
uninstall:
	for hdr in *.h; do rm -f $(sdcc_datadir)/$$hdr; done


# Performing self-test
# --------------------
check:


# Performing installation test
# ----------------------------
installcheck:


# Creating installation directories
# ---------------------------------
installdirs:
	[ -d $(sdcc_datadir)/include ] || mkdir -p $(sdcc_datadir)/include


# Creating dependencies
# ---------------------
dep: #Makefile.dep

#Makefile.dep:
#	$(CPP) $(CPPFLAGS) $(M_OR_MM) *.c >main.dep

#include Makefile.dep
include clean.mk

# My rules
# --------


# Remaking configuration
# ----------------------
checkconf:
	@if [ -f $(PRJDIR)/devel ]; then\
	  $(MAKE) -f $(srcdir)/conf.mk srcdir="$(srcdir)" PRJDIR="$(PRJDIR)" \
	  freshconf;\
	fi

# End of main_in.mk/main.mk

