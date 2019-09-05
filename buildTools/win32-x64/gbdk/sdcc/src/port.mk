# Common Makefile for all ports.
# Input: SOURCES - list of C files included in the project
#        SPECIAL - list of special files that should be included in dependencies
#        PEEPRULES - list of all peephole rules (.rul) derrived files
#        PREBUILD - list of special files to build before deps.

# Ports are always located in sdcc/src/<portname>
PRJDIR = ../..
# Output
LIB = port.a
# Include the sdcc/src directory
INCLUDEFLAGS = -I..

# If the sources aren't specified, assume all in this directory.
ifndef SOURCES
SOURCES = $(wildcard *.c)
endif

# If the peephole rules aren't specified, assume all.
ifndef PEEPRULES
PEEPDEFS = $(wildcard *.def)
PEEPRULES = $(PEEPDEFS:.def=.rul)
endif

PREBUILD += $(PEEPRULES)

all: $(PREBUILD) dep $(LIB)

include $(PRJDIR)/Makefile.common

$(LIB): $(OBJ)
	rm -f $(LIB)
	$(AR) r $(LIB) $(OBJ)
	$(RANLIB) $(LIB)

%.rul: %.def
	$(AWK) -f ../SDCCpeeph.awk $< > $@

dep: Makefile.dep

Makefile.dep: $(PREBUILD) Makefile $(SOURCES) $(SPECIAL) *.h $(PRJDIR)/*.h $(PRJDIR)/src/*.h
	$(CPP) $(CPPFLAGS) $(M_OR_MM) $(SOURCES) >Makefile.dep

include Makefile.dep

include ../port-clean.mk
