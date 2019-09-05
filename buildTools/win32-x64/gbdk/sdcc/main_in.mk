#
#
#

# Version
VERSION         = @VERSION@
VERSIONHI       = @VERSIONHI@
VERSIONLO       = @VERSIONLO@
VERSIONP        = @VERSIONP@

# Programs
SHELL		= /bin/sh
CC		= @CC@
CPP		= @CPP@
RANLIB		= @RANLIB@
INSTALL		= @INSTALL@
AUTOCONF        = @AUTOCONF@

# Directories
PRJDIR		= .

prefix          = @prefix@
exec_prefix     = @exec_prefix@
bindir          = @bindir@
libdir          = @libdir@
datadir         = @datadir@
includedir      = @includedir@
mandir          = @mandir@
man1dir         = $(mandir)/man1
man2dir         = $(mandir)/man2
infodir         = @infodir@
srcdir          = @srcdir@

# Flags
DEFS            = $(subs -DHAVE_CONFIG_H,,@DEFS@)
CPPFLAGS        = @CPPFLAGS@ -I$(PRJDIR)
CFLAGS          = @CFLAGS@
M_OR_MM         = @M_OR_MM@


# Compiling entire program or any subproject
# ------------------------------------------
all: checkconf


# Compiling and installing everything and runing test
# ---------------------------------------------------
install: all installdirs


# Deleting all the installed files
# --------------------------------
uninstall:


# Performing self-test
# --------------------
check:


# Performing installation test
# ----------------------------
installcheck:


# Creating installation directories
# ---------------------------------
installdirs:


# Creating dependencies
# ---------------------
dep: #main.dep

#main.dep: *.c *.h
#	$(CPP) $(CPPFLAGS) $(M_OR_MM) *.c >main.dep

#include main.dep
include clean.mk

# My rules
# --------
.c.o:
	$(CC) $(CFLAGS) $(CPPFLAGS) -c $< -o $@

.y.c:
	rm -f $*.cc $*.h
	$(YACC) -d $<
	mv y.tab.c $*.cc
	mv y.tab.h $*.h

.l.c:
	rm -f $*.cc
	$(LEX) -t $< >$*.cc


# Remaking configuration
# ----------------------
checkconf:
	@if [ -f $(PRJDIR)/devel ]; then\
	  $(MAKE) -f $(srcdir)/conf.mk srcdir="$(srcdir)" freshconf;\
	fi

# End of main_in.mk/main.mk

