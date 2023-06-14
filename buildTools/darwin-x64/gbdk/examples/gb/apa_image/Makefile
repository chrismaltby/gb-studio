#
# A Makefile that compiles all .c and .s files in "src" and "res" 
# subdirectories and places the output in a "obj" subdirectory
#

# If you move this project you can change the directory 
# to match your GBDK root directory (ex: GBDK_HOME = "C:/GBDK/"
GBDK_HOME = ../../../

LCC = $(GBDK_HOME)bin/lcc
PNG2ASSET = $(GBDK_HOME)bin/png2asset

# You can set flags for LCC here
# For example, you can uncomment the line below to turn on debug output
# LCCFLAGS += -debug

# Add directory where image gets converted into (obj/)
# So they can be included with "#include <res/somefile.h>"
LCCFLAGS += -I$(OBJDIR)

# Make the ROM CGB compatible (but not exclusive)
LCCFLAGS += -Wm-yc

# You can set the name of the .gb ROM file here
PROJECTNAME = apa_image

SRCDIR      = src
OBJDIR      = obj
RESOBJSRC   = obj/res
RESDIR      = res
MKDIRS      = $(OBJDIR) $(BINDIR) $(RESOBJSRC) # See bottom of Makefile for directory auto-creation

BINS	    = $(OBJDIR)/$(PROJECTNAME).gb

# For png2asset: converting source pngs -> .c -> .o
IMGPNGS     = $(foreach dir,$(RESDIR),$(notdir $(wildcard $(dir)/*.png)))
IMGSOURCES  = $(IMGPNGS:%.png=$(RESOBJSRC)/%.c)
IMGOBJS     = $(IMGSOURCES:$(RESOBJSRC)/%.c=$(OBJDIR)/%.o)

CSOURCES    = $(foreach dir,$(SRCDIR),$(notdir $(wildcard $(dir)/*.c))) $(foreach dir,$(RESDIR),$(notdir $(wildcard $(dir)/*.c)))
ASMSOURCES  = $(foreach dir,$(SRCDIR),$(notdir $(wildcard $(dir)/*.s)))
OBJS       = $(CSOURCES:%.c=$(OBJDIR)/%.o) $(ASMSOURCES:%.s=$(OBJDIR)/%.o)

all: $(BINS)

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> compile.bat

# Use png2asset to convert the png into C formatted metasprite data
# -keep_duplicate_tiles   : Don't remove duplicate tiles
# -map                    : Use "map style" output, not metasprite
# -tiles_only             : Only keep tiles, no map (since APA mode expects tiles in linear order)
# -bpp 2                  : Use 2bpp output
# -c ...                  : Set C output file
# Convert metasprite .pngs in res/ -> .c files in obj/<platform ext>/src/
$(RESOBJSRC)/%.c:	$(RESDIR)/%.png
	$(PNG2ASSET) $< -keep_duplicate_tiles -map -bpp2 -tiles_only -c $@

# Compile the pngs that were converted to .c files
# .c files in obj/res/ -> .o files in obj/
$(OBJDIR)/%.o:	$(RESOBJSRC)/%.c
	$(LCC) $(CFLAGS) -c -o $@ $<

# Compile .c files in "src/" to .o object files
$(OBJDIR)/%.o:	$(SRCDIR)/%.c
	$(LCC) $(LCCFLAGS) -c -o $@ $<

# Compile .c files in "res/" to .o object files
$(OBJDIR)/%.o:	$(RESDIR)/%.c
	$(LCC) $(CFLAGS) -c -o $@ $<

# Compile .s assembly files in "src/" to .o object files
$(OBJDIR)/%.o:	$(SRCDIR)/%.s
	$(LCC) $(LCCFLAGS) -c -o $@ $<

# If needed, compile .c files in "src/" to .s assembly files
# (not required if .c is compiled directly to .o)
$(OBJDIR)/%.s:	$(SRCDIR)/%.c
	$(LCC) $(LCCFLAGS) -S -o $@ $<

# Convert images first so they're available when compiling the main sources
$(OBJS):	$(IMGOBJS)

# Link the compiled object files into a .gb ROM file
$(BINS):	$(OBJS)
	$(LCC) $(LCCFLAGS) -o $(BINS) $(IMGOBJS) $(OBJS)

clean:
	rm -f  $(OBJDIR)/*.*
	rm -f  $(RESOBJSRC)/*.*


# create necessary directories after Makefile is parsed but before build
# info prevents the command from being pasted into the makefile
$(info $(shell mkdir -p $(MKDIRS)))

