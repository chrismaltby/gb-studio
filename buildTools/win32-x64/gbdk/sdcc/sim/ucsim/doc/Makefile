# Generated automatically from Makefile.in by configure.
#
# uCsim doc/Makefile
#
# (c) Drotos Daniel, Talker Bt. 1997
#

STARTYEAR	= 1997

SHELL		= /bin/sh
INSTALL		= /usr/bin/install -c

PRJDIR		= ..

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
docdir		= $(prefix)/doc/ucsim


# Compiling entire program or any subproject
# ------------------------------------------
all: doc

doc: checkconf

# Compiling and installing everything and runing test
# ---------------------------------------------------
install: all installdirs
	cp *.html $(docdir)
	cp *.gif $(docdir)
	cp *.jpg $(docdir)
	cp *.fig $(docdir)


# Deleting all the installed files
# --------------------------------
uninstall:
	rm -f $(docdir)/*


# Performing self-test
# --------------------
check:


# Performing installation test
# ----------------------------
installcheck:


# Creating installation directories
# ---------------------------------
installdirs:
	test -d $(docdir) || $(INSTALL) -d $(docdir)


# Creating dependencies
# ---------------------
include clean.mk

# My rules
# --------

# Remaking configuration
# ----------------------
checkconf:
	@if [ -f $(PRJDIR)/devel ]; then\
	  $(MAKE) -f conf.mk srcdir="$(srcdir)" PRJDIR="$(PRJDIR)" freshconf;\
	fi

# End of s51.src/Makefile.in
