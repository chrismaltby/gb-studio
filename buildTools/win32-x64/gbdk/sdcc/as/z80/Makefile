PRJDIR = ../..

include $(PRJDIR)/Makefile.common

OBJDIR	= obj/$(EXT)

SDC	= .

SLIBSRC	= NewAlloc.c

SRC	= asdata.c asexpr.c aslex.c aslist.c asmain.c asout.c \
	  assubr.c assym.c z80adr.c z80ext.c z80mch.c z80pst.c

OBJS	= $(SRC:%.c=$(OBJDIR)/%.o)
SLIBOBJS	= $(SLIBSRC:%.c=$(OBJDIR)/%.o) 

BINS	= $(BUILDDIR)as$(EXT)

CFLAGS	+= $(CPPFLAGS) $(OPTS) -I. -DINDEXLIB -DMLH_MAP -DUNIX -DSDK
CFLAGS	+= -funsigned-char
CFLAGS	+= -I$(SLIB) 

LDFLAGS += -lm $(EXTRALIBS)

all:	$(OBJDIR) dep $(BINS)

dep: Makefile.dep

Makefile.dep: $(SRC) *.h
	$(CPP) $(CPPFLAGS) $(M_OR_MM) $(SRC) > Makefile.dep

include Makefile.dep

$(OBJDIR):
	mkdir -p $(OBJDIR)

$(BINS): $(OBJS) $(SLIBOBJS)
	$(CC) -o $(BINS) $(OBJS) $(SLIBOBJS) $(LDFLAGS)


$(OBJDIR)/%.o:	%.c
	$(CC) -c $(CFLAGS) -o $@ $<

$(OBJDIR)/%.o:	$(SLIB)/%.c
	$(CC) -c $(CFLAGS) -o $@ $<

_as-z80:
	$(MAKE) EXT=-z80$(E)

_as-gbz80:
	$(MAKE) EXT=-gbz80$(E) OPTS=-DGAMEBOY

include clean.mk
