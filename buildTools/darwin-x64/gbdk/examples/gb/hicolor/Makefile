# If you move this project you can change the directory
# to match your GBDK root directory (ex: GBDK_HOME = "C:/GBDK/"
ifndef GBDK_HOME
	GBDK_HOME = ../../../
endif

LCC = $(GBDK_HOME)bin/lcc

# You can set flags for LCC here
LCCFLAGS += -Wm-yC # GB Color required for Hi Color
LCCFLAGS += -Wf-MMD -Wf-Wp-MP # Header file dependency output (-MMD) for Makefile use + per-header Phoney rules (-MP)
LCCFLAGS += -Wl-yt0x19        # MBC5
LCCFLAGS += -autobank -Wb-v -Wb-ext=.rel # Auto-bank packing

# For testing only: randomize autobank assignment
# LCCFLAGS += -Wb-random -Wb-max=3 -Wb-v

# For Hi Color:
PNG2HICOLORGB = $(GBDK_HOME)bin/png2hicolorgb
# Use conversion method type 1, Faster Adaptive attribute sizing for Left / Right side of screen, C source output
# Bank 255 for auto-banking
HICOLOR_FLAGS = --type=1 -L=1 -R=1 --csource --bank=255
# Add the object dir as an include dir since that's
# where the converted png source files will get generated
LCCFLAGS += -I$(OBJDIR) -I$(SRCDIR)


# GBDK_DEBUG = ON
ifdef GBDK_DEBUG
	LCCFLAGS += -debug -v
endif


# You can set the name of the .gb ROM file here
PROJECTNAME = hicolor_pic

BINDIR      = bin
SRCDIR      = src
OBJDIR      = obj
RESDIR      = res
HICOLORDIR  = $(RESDIR)/hicolor
MKDIRS      = $(OBJDIR) $(BINDIR) # See bottom of Makefile for directory auto-creation


BINS	    = $(BINDIR)/$(PROJECTNAME).gbc
CSOURCES    = $(foreach dir,$(SRCDIR),$(notdir $(wildcard $(dir)/*.c))) $(foreach dir,$(RESDIR),$(notdir $(wildcard $(dir)/*.c)))
ASMSOURCES  = $(foreach dir,$(SRCDIR),$(notdir $(wildcard $(dir)/*.s)))

# For Hi Color:
# The HICOLORS entries should be first in the OBJS list so they get generated before anything which might depend on them
HICOLORS     = $(foreach dir,$(HICOLORDIR),$(notdir $(wildcard $(dir)/*.png)))
HICOLOR_SRCS = $(HICOLORS:%.png=$(OBJDIR)/%.c)
OBJS         = $(HICOLORS:%.png=$(OBJDIR)/%.o) $(CSOURCES:%.c=$(OBJDIR)/%.o) $(ASMSOURCES:%.s=$(OBJDIR)/%.o)

all: $(BINS)

# Dependencies (using output from -Wf-MMD -Wf-Wp-MP)
DEPS = $(OBJS:%.o=%.d)

-include $(DEPS)


# == Start Hi Color conversion ==

# Convert png images in res/hicolor to .c files (which incbin the generated .til/.map/.pal/.atr files)
# The resulting C files will get compiled to object files afterward
.SECONDEXPANSION:
$(OBJDIR)/%.c: $(HICOLORDIR)/%.png
	$(PNG2HICOLORGB) $< $(HICOLOR_FLAGS) -o $@

# Prevent make from deleting intermediary generated hi-color C source files
.SECONDARY: $(HICOLOR_SRCS)

# Compile hicolor .c files in "obj/" to .o object files
$(OBJDIR)/%.o:	$(OBJDIR)/%.c
	$(LCC) $(LCCFLAGS) -c -o $@ $<

# == End Hi Color conversion ==


# Compile .c files in "src/" to .o object files
$(OBJDIR)/%.o:	$(SRCDIR)/%.c
	$(LCC) $(LCCFLAGS) -c -o $@ $<

# Compile .c files in "res/" to .o object files
$(OBJDIR)/%.o:	$(RESDIR)/%.c
	$(LCC) $(LCCFLAGS) -c -o $@ $<

# Compile .s assembly files in "src/" to .o object files
$(OBJDIR)/%.o:	$(SRCDIR)/%.s
	$(LCC) $(LCCFLAGS) -c -o $@ $<

# If needed, compile .c files in "src/" to .s assembly files
# (not required if .c is compiled directly to .o)
$(OBJDIR)/%.s:	$(SRCDIR)/%.c
	$(LCC) $(LCCFLAGS) -S -o $@ $<

# Link the compiled object files into a .gb ROM file
$(BINS): $(OBJS)
	$(LCC) $(LCCFLAGS) -o $(BINS) $(OBJS)


clean:
	rm -f  $(OBJDIR)/*.* $(BINDIR)/*.*

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | sed s/mkdir\ -p\/mkdir\/ | grep -v make >> compile.bat

# create necessary directories after Makefile is parsed but before build
# info prevents the command from being pasted into the makefile
$(info $(shell mkdir -p $(MKDIRS)))
