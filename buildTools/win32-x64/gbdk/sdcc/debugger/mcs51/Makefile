# Generated automatically from Makefile.in by configure.
#
#
#

VERSION         = 2.3.1
VERSIONHI       = 2
VERSIONLO       = 3
VERSIONP        = 1

SHELL		= /bin/sh
CC		= gcc
CPP		= gcc -E
INSTALL		= /usr/bin/install -c
STRIP           = strip

PRJDIR		= ../..
SLIB		= $(PRJDIR)/support/Util

srcdir		= .
prefix		= /opt/gbdk
exec_prefix     = ${prefix}
bindir          = ${exec_prefix}/bin
libdir          = ${exec_prefix}/lib
datadir         = ${prefix}/share
includedir      = ${prefix}/include
mandir          = ${prefix}/man
man1dir         = $(mandir)/man1
man2dir         = $(mandir)/man2
infodir         = ${prefix}/info

STD_INC		= @sdcc_include_dir@
CPPFLAGS	=  -I. -I$(PRJDIR) -I$(PRJDIR)/support -I$(SLIB)
CFLAGS		= -ggdb -O2 -pipe
M_OR_MM		= -MM
LDFLAGS		= 

LIBS            = 
LIBDIRS         =

SLIBOBJS		= NewAlloc.o

OBJECTS		= sdcdb.o symtab.o simi.o $(PRJDIR)/src/SDCCset.o \
		  break.o cmd.o $(PRJDIR)/src/SDCChasht.o \
		  $(PRJDIR)/support/Util/SDCCerr.o
SOURCES		= $(patsubst %.o,%.c,$(OBJECTS))

TARGET		= $(PRJDIR)/bin/sdcdb


# Compiling entire program or any subproject
# ------------------------------------------
all: checkconf $(TARGET)

# Compiling and installing everything and runing test
# ---------------------------------------------------
install: all installdirs
	$(INSTALL) $(TARGET) $(bindir)/sdcdb
	$(STRIP) $(bindir)/sdcdb
	cp $(PRJDIR)/debugger/mcs51/sdcdb.el $(bindir)/sdcdb.el
	cp $(PRJDIR)/debugger/mcs51/sdcdbsrc.el $(bindir)/sdcdbsrc.el


# Deleting all the installed files
# --------------------------------
uninstall:
	rm -f $(bindir)/sdcdb
	rm -f $(bindir)/sdcdb.el
	rm -f $(bindir)/sdcdbsrc.el

# Performing self-test
# --------------------
check:


# Performing installation test
# ----------------------------
installcheck:


# Creating installation directories
# ---------------------------------
installdirs:
	$(INSTALL) -d $(bindir)


# Creating dependencies
# ---------------------
dep: Makefile.dep

Makefile.dep: $(SOURCES) *.h $(PRJDIR)/*.h
	$(CPP) $(CPPFLAGS) $(M_OR_MM) $(SOURCES) >Makefile.dep

include Makefile.dep
include clean.mk

# My rules
# --------
$(TARGET): $(OBJECTS) $(SLIBOBJS)
	$(CC) $(LDFLAGS) -o $@ $(OBJECTS) $(SLIBOBJS) $(LIBDIRS) $(LIBS)

.c.o:
	$(CC) $(CPPFLAGS) $(CFLAGS) -c -o $@ $<

$(SLIBOBJS):%.o:$(SLIB)/%.c
	$(CC) $(CPPFLAGS) $(CFLAGS) -c -o $@ $<

# Remaking configuration
# ----------------------
checkconf:
	@if [ -f $(PRJDIR)/devel ]; then\
          $(MAKE) -f conf.mk srcdir="$(srcdir)" PRJDIR="$(PRJDIR)" freshconf;\
        fi

# End of cpp/Makefile
