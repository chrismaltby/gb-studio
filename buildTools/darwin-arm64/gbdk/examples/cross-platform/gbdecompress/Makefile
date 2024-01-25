# If you move this project you can change the directory
# to match your GBDK root directory (ex: GBDK_HOME = "C:/GBDK/"
GBDK_HOME = ../../../
LCC = $(GBDK_HOME)bin/lcc
PNG2ASSET = $(GBDK_HOME)/bin/png2asset

# Set platforms to build here, spaced separated. (These are in the separate Makefile.targets)
# They can also be built/cleaned individually: "make gg" and "make gg-clean"
# Possible are: gb gbc pocket megaduck sms gg
TARGETS=gb pocket megaduck sms gg

# Configure platform specific LCC flags here:
LCCFLAGS_gb      = -Wl-yt0x1B # Set an MBC for banking (1B-ROM+MBC5+RAM+BATT)
LCCFLAGS_pocket  = -Wl-yt0x1B # Usually the same as required for .gb
LCCFLAGS_duck    = -Wl-yt0x1B # Usually the same as required for .gb
LCCFLAGS_gbc     = -Wl-yt0x1B -Wm-yc # Same as .gb with: -Wm-yc (gb & gbc) or Wm-yC (gbc exclusive)
LCCFLAGS_sms     =
LCCFLAGS_gg      =

LCCFLAGS += $(LCCFLAGS_$(EXT)) # This adds the current platform specific LCC Flags

LCCFLAGS += -Wl-j -Wm-yoA -Wm-ya4 -autobank -Wb-ext=.rel -Wb-v # MBC + Autobanking related flags
# LCCFLAGS += -debug # Uncomment to enable debug output
# LCCFLAGS += -v     # Uncomment for lcc verbose output

# Add directory where platform specific meta tile sprites get converted into (obj/<platform ext>/src)
# So they can be included with "#include <res/somefile.h>"
CFLAGS += -I$(OBJDIR)

# You can set the name of the ROM file here
PROJECTNAME = gbdecompress

SRCDIR      = src
OBJDIR      = obj/$(EXT)
RESOBJSRC   = obj/$(EXT)/res
RESDIR      = res
BINDIR      = build/$(EXT)
MKDIRS      = $(OBJDIR) $(BINDIR) $(RESOBJSRC) # See bottom of Makefile for directory auto-creation

BINS	    = $(OBJDIR)/$(PROJECTNAME).$(EXT)
# For png2asset: converting metasprite source pngs -> .c -> .o
METAPNGS    = $(foreach dir,$(RESDIR),$(notdir $(wildcard $(dir)/*.png)))
METASRCS    = $(METAPNGS:%.png=$(RESOBJSRC)/%.c)
METAOBJS    = $(METASRCS:$(RESOBJSRC)/%.c=$(OBJDIR)/%.o)

CSOURCES    = $(foreach dir,$(SRCDIR),$(notdir $(wildcard $(dir)/*.c))) $(foreach dir,$(RESDIR),$(notdir $(wildcard $(dir)/*.c)))
ASMSOURCES  = $(foreach dir,$(SRCDIR),$(notdir $(wildcard $(dir)/*.s)))
OBJS        = $(CSOURCES:%.c=$(OBJDIR)/%.o) $(ASMSOURCES:%.s=$(OBJDIR)/%.o)


# Builds all targets sequentially
all: $(TARGETS)

# Use png2asset to convert the png into C formatted metasprite data
# -sh 48   : Sets sprite height to 48 (width remains automatic)
# -spr8x16 : Use 8x16 hardware sprites
# -c ...   : Set C output file
# Convert metasprite .pngs in res/ -> .c files in obj/<platform ext>/src/
$(RESOBJSRC)/%.c:	$(RESDIR)/%.png
	$(PNG2ASSET) $< -sh 48 -spr8x16 -noflip -c $@

# Compile the Metasprite pngs that were converted to .c files
# .c files in obj/<platform ext>/src/ -> .o files in obj/
$(OBJDIR)/%.o:	$(RESOBJSRC)/%.c
	$(LCC) $(CFLAGS) -c -o $@ $<

# Compile .c files in "src/" to .o object files
$(OBJDIR)/%.o:	$(SRCDIR)/%.c
	$(LCC) $(CFLAGS) -c -o $@ $<

# Compile .c files in "res/" to .o object files
$(OBJDIR)/%.o:	$(RESDIR)/%.c
	$(LCC) $(CFLAGS) -c -o $@ $<

# Compile .s assembly files in "src/" to .o object files
$(OBJDIR)/%.o:	$(SRCDIR)/%.s
	$(LCC) $(CFLAGS) -c -o $@ $<

# If needed, compile .c files i n"src/" to .s assembly files
# (not required if .c is compiled directly to .o)
$(OBJDIR)/%.s:	$(SRCDIR)/%.c
	$(LCC) $(CFLAGS) -S -o $@ $<

# Convert and build MetaSprites first so they're available when compiling the main sources
$(OBJS):	$(METAOBJS)

# Link the compiled object files into a .gb ROM file
$(BINS):	$(OBJS)
	$(LCC) $(LCCFLAGS) $(CFLAGS) -o $(BINDIR)/$(PROJECTNAME).$(EXT) $(METAOBJS) $(OBJS)

clean:
	@echo Cleaning
	@for target in $(TARGETS); do \
		$(MAKE) $$target-clean; \
	done

# Include available build targets
include Makefile.targets


# create necessary directories after Makefile is parsed but before build
# info prevents the command from being pasted into the makefile
ifneq ($(strip $(EXT)),)           # Only make the directories if EXT has been set by a target
$(info $(shell mkdir -p $(MKDIRS)))
endif
