include ./Makefile.common
include ./Makefile.build

GBSTOOLS_DIR = $(TOP)../_gbstools
GBDK = $(GBSTOOLS_DIR)/gbdk
GBSPACK = $(GBSTOOLS_DIR)/gbspack/gbspack

ROM_BUILD_DIR = build
OBJDIR = obj
REL_OBJDIR = obj/_rel

ADATA = $(foreach dir,src/data,$(notdir $(wildcard $(dir)/*.s)))
CDATA = $(foreach dir,src/data,$(notdir $(wildcard $(dir)/*.c)))
MDATA = $(foreach dir,src/data/music,$(notdir $(wildcard $(dir)/*.c)))

OBJS = $(ENGINE_OBJS) \
	$(ADATA:%.s=$(OBJDIR)/%.o) \
	$(CDATA:%.c=$(OBJDIR)/%.o) \
	$(MDATA:%.c=$(OBJDIR)/%.o)
	
REL_OBJS_LOCAL = $(OBJS:$(OBJDIR)/%.o=$(REL_OBJDIR)/%.rel)
REL_OBJS       = $(REL_OBJS_LOCAL:$(TOP)$(OBJDIR)/%.o=$(REL_OBJDIR)/%.rel)

CFLAGS += -Idata/include -Wa-Idata/include

all: settings directories $(TARGET)

$(OBJDIR)/%.o:	src/data/music/%.c
	$(CC) $(CFLAGS) -c -o $@ $<	

$(OBJDIR)/%.o:	src/data/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/data/%.s
	$(CC) $(CFLAGS) -c -o $@ $<	
