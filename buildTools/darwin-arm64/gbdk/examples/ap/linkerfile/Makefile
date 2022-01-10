#
# A Makefile that compiles all .c and .s files in "src" and "res" 
# subdirectories and places the output in a "obj" subdirectory
#

# If you move this project you can change the directory 
# to match your GBDK root directory (ex: GBDK_HOME = "C:/GBDK/"
GBDK_HOME = ../../../

LCC = $(GBDK_HOME)bin/lcc

# You can set flags for LCC here
# For example, you can uncomment the line below to turn on debug output
LCCFLAGS = -mgbz80:ap
# LCCFLAGS += -debug
# LCCFLAGS += -v

# You can set the name of the .pocket ROM file here
PROJECTNAME    = Example

SRCDIR      = src
OBJDIR      = obj
RESDIR      = res
BINS	    = $(OBJDIR)/$(PROJECTNAME).pocket
CSOURCES    = $(foreach dir,$(SRCDIR),$(notdir $(wildcard $(dir)/*.c))) $(foreach dir,$(RESDIR),$(notdir $(wildcard $(dir)/*.c)))
ASMSOURCES  = $(foreach dir,$(SRCDIR),$(notdir $(wildcard $(dir)/*.s)))
OBJS       = $(CSOURCES:%.c=$(OBJDIR)/%.o) $(ASMSOURCES:%.s=$(OBJDIR)/%.o)

all:	prepare $(BINS)

compile.bat: Makefile
	@echo "REM Automatically generated from Makefile" > compile.bat
	@make -sn | sed y/\\//\\\\/ | grep -v make >> compile.bat

# Compile .c files in "src/" to .o object files
$(OBJDIR)/%.o:	$(SRCDIR)/%.c
	$(LCC) $(LCCFLAGS) -c -o $@ $<

# Compile .c files in "res/" to .o object files
$(OBJDIR)/%.o:	$(RESDIR)/%.c
	$(LCC) $(LCCFLAGS) -c -o $@ $<

# Compile .s assembly files in "src/" to .o object files
$(OBJDIR)/%.o:	$(SRCDIR)/%.s
	$(LCC) $(LCCFLAGS) -c -o $@ $<

# If needed, compile .c files i n"src/" to .s assembly files
# (not required if .c is compiled directly to .o)
$(OBJDIR)/%.s:	$(SRCDIR)/%.c
	$(LCC) $(LCCFLAGS) -S -o $@ $<


$(OBJDIR)/linkfile.lk:	$(OBJS)
	rm -f $@
	@for obj in $(OBJS); do \
		echo $$obj >>$@; \
	done

# Link the compiled object files (via linkerfile) into a .pocket ROM file
$(BINS):	$(OBJDIR)/linkfile.lk
		$(LCC) $(LCCFLAGS) -o $(BINS) -Wl-f$<

prepare:
	mkdir -p $(OBJDIR)
	mkdir -p $(RESDIR)

clean:
#	rm -f  *.pocket *.ihx *.cdb *.adb *.noi *.map
	rm -f  $(OBJDIR)/*.*

