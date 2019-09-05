PRJDIR = ../..

include $(PRJDIR)/Makefile.common

OBJDIR	= obj/$(EXT)

SLIBSRC	= NewAlloc.c

SRC	= lkarea.c lkdata.c lkeval.c lkhead.c lkihx.c lklex.c \
	  lklibr.c lklist.c lkmain.c lkrloc.c lks19.c lksym.c \
	  lkgb.c lkgg.c

OBJS	= $(SRC:%.c=$(OBJDIR)/%.o) 
SLIBOBJS	= $(SLIBSRC:%.c=$(OBJDIR)/%.o) 

BINS	= $(BUILDDIR)link$(EXT)

CFLAGS	+= $(CPPFLAGS) $(OPTS) -DINDEXLIB -DMLH_MAP -DUNIX -DSDK
CFLAGS	+= -funsigned-char -DUNIX
CFLAGS	+= -I$(PRJDIR)/as/$(PORT) -I$(SLIB) 

LDFLAGS += -lm $(EXTRALIBS)

all:	$(BINS)

$(BINS): $(OBJDIR) $(OBJS) $(SLIBOBJS)
	$(CC) -g -o $(BINS) $(OBJS) $(SLIBOBJS) $(LDFLAGS)

$(OBJDIR):
	mkdir -p $(OBJDIR)

$(OBJDIR)/%.o:	%.c
	$(CC) -c $(CFLAGS) -o $@ $<

$(OBJDIR)/%.o:	$(SLIB)/%.c
	$(CC) -c $(CFLAGS) -o $@ $<

_link-z80:
	$(MAKE) EXT=-z80$(E) PORT=z80

_link-gbz80:
	$(MAKE) EXT=-gbz80$(E) OPTS=-DGAMEBOY PORT=z80

include clean.mk
