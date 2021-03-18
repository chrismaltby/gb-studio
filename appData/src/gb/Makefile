GBDK = ../../gbdk
GBDKLIB = $(GBDK)/lib/small/asxxxx
CC = $(GBDK)/bin/lcc
TEST_DIR = ./test
TEST_FW	= $(TEST_DIR)/framework
EMU	= ../../bgb/bgb
GBSPACK = ../../gbspack/gbspack
TEST_CHK = python $(TEST_FW)/unit_checker.py

CART_SIZE = 16
#CART_MBC = 0x1B
CART_MBC = 0x10

ROM_BUILD_DIR = build
OBJDIR = obj
REL_OBJDIR = obj/_rel

#MUSIC_DRIVER = GBT_PLAYER
MUSIC_DRIVER = HUGE_TRACKER

CFLAGS = -Iinclude -Wa-Iinclude -Wa-I$(GBDKLIB) -Wl-a -D$(MUSIC_DRIVER)

LFLAGS_NBANKS += -Wl-yo$(CART_SIZE) -Wl-ya4 -Wl-j -Wl-m -Wl-w

LFLAGS = -Wl-yt$(CART_MBC) $(LFLAGS_NBANKS) -Wl-klib -Wl-lhUGEDriver.lib -Wl-g_shadow_OAM2=0xDF00 -Wl-g.STACK=0xDF00 -Wi-e

PACKFLAGS = -b 4 -f 255 -e rel -c

#--- del ----
CFLAGS += -DSGB
LFLAGS += -Wm-ys
#------------

TARGET = $(ROM_BUILD_DIR)/rom.gb

ASRC = $(foreach dir,src,$(notdir $(wildcard $(dir)/*.s))) 
CSRC = $(foreach dir,src,$(notdir $(wildcard $(dir)/*.c))) 

ACORE = $(foreach dir,src/core,$(notdir $(wildcard $(dir)/*.s))) 
CCORE = $(foreach dir,src/core,$(notdir $(wildcard $(dir)/*.c))) 
CSTATES = $(foreach dir,src/states,$(notdir $(wildcard $(dir)/*.c))) 
ASTATES = $(foreach dir,src/states,$(notdir $(wildcard $(dir)/*.s))) 
ADATA = $(foreach dir,src/data,$(notdir $(wildcard $(dir)/*.s)))
CDATA = $(foreach dir,src/data,$(notdir $(wildcard $(dir)/*.c)))
MDRVR = $(foreach dir,src/core/$(MUSIC_DRIVER),$(notdir $(wildcard $(dir)/*.s)))
MDATA = $(foreach dir,src/data/$(MUSIC_DRIVER),$(notdir $(wildcard $(dir)/*.c)))

OBJS = $(CSRC:%.c=$(OBJDIR)/%.o) $(ASRC:%.s=$(OBJDIR)/%.o) $(ACORE:%.s=$(OBJDIR)/%.o) $(CCORE:%.c=$(OBJDIR)/%.o) $(ADATA:%.s=$(OBJDIR)/%.o) $(CDATA:%.c=$(OBJDIR)/%.o) $(MDATA:%.c=$(OBJDIR)/%.o) $(MDRVR:%.s=$(OBJDIR)/%.o) $(CSTATES:%.c=$(OBJDIR)/%.o) $(ASTATES:%.s=$(OBJDIR)/%.o)
REL_OBJS = $(OBJS:$(OBJDIR)/%.o=$(REL_OBJDIR)/%.rel)

all: directories $(TARGET) symbols

.PHONY: clean release debug color super profile test directories
.SECONDARY: $(OBJS) 

release:
	$(eval CFLAGS += -Wf'--max-allocs-per-node 50000')
	@echo "RELEASE mode ON"
	
debug:
	$(eval CFLAGS += -Wf--fverbose-asm -Wf--debug -Wl-m -Wl-w -Wl-y -DVM_DEBUG_OUTPUT)
	$(eval CFLAGS += -Wf--nolospre -Wf--nogcse)
	$(eval LFLAGS += -Wf--debug -Wl-m -Wl-w -Wl-y)
	@echo "DEBUG mode ON"

color:
	$(eval CFLAGS += -DCGB)
	$(eval LFLAGS += -Wm-yC)
	@echo "COLOR mode ON"

super:
	$(eval CFLAGS += -DSGB)
	$(eval LFLAGS += -Wm-ys)
	@echo "COLOR mode ON"

profile:
	$(eval CFLAGS += -Wf--profile)
	@echo "PROFILE mode ON"

batteryless:
	$(eval PACKFLAGS += -a 4)
	$(eval BATTERYLESS = 1)
	$(eval CFLAGS += -DBATTERYLESS)
	@echo "BETTERYLESS SAVE ON"

directories: $(ROM_BUILD_DIR) $(OBJDIR) $(REL_OBJDIR)

$(ROM_BUILD_DIR):
	mkdir -p $(ROM_BUILD_DIR)

$(OBJDIR):
	mkdir -p $(OBJDIR)

$(REL_OBJDIR):
	mkdir -p $(REL_OBJDIR)

$(OBJDIR)/%.o:	src/core/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/core/%.s
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/core/$(MUSIC_DRIVER)/%.s
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/data/$(MUSIC_DRIVER)/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/states/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/states/%.s
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/data/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/data/%.s
	$(CC) $(CFLAGS) -c -o $@ $<	

$(OBJDIR)/%.o:	src/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/%.s
	$(CC) $(CFLAGS) -c -o $@ $<

$(REL_OBJS):	$(OBJS)
	mkdir -p $(REL_OBJDIR)
	$(eval CART_SIZE=$(shell $(GBSPACK) $(PACKFLAGS) -o $(REL_OBJDIR) $(OBJS)))
	$(eval LFLAGS += -Wl-g__start_save=$(shell expr $(CART_SIZE) - 4 ))

$(ROM_BUILD_DIR)/%.gb:	$(REL_OBJS)
	$(CC) $(LFLAGS) -o $@ $^

$(OBJDIR)/test_main.o: test/framework/test_main.c
	$(CC) $(CFLAGS) -c -o $@ $<

clean:
	@echo "CLEANUP..."
	rm -rf $(OBJDIR)
	rm -rf $(ROM_BUILD_DIR)
	rm -f $(TEST_DIR)/*.noi
	rm -f $(TEST_DIR)/*.map
	rm -f $(TEST_DIR)/*.gb
	rm -f $(TEST_DIR)/*.sna
	rm -f $(TEST_DIR)/*.bmp	

rom: directories $(TARGET)

symbols:
	python ./utils/noi2sym.py $(patsubst %.gb,%.noi,$(TARGET)) >$(patsubst %.gb,%.sym,$(TARGET))

test: directories $(OBJS) $(OBJDIR)/test_main.o $(TEST_DIR)/*.json
	@echo "Running tests..."
	$(eval CART_SIZE=$(shell $(GBSPACK) $(PACKFLAGS) -o $(REL_OBJDIR) $(OBJS)))
	@for file in $(patsubst %.json,%,$(filter %.json,$^))  ; do \
		echo "$${file}"; \
		$(CC) $(CFLAGS) -c -o $(OBJDIR)/$${file/test\//}.o $${file}.c; \
		$(CC) $(LFLAGS) -o $${file}.gb $(filter-out $(REL_OBJDIR)/main.rel, $(REL_OBJS)) $(OBJDIR)/test_main.o $(OBJDIR)/$${file/test\//}.o; \
		$(EMU) -set "DebugSrcBrk=1" -hf -stateonexit -screenonexit ./$${file}.bmp -rom $${file}.gb; \
		$(TEST_CHK) $${file}.json $${file}.noi $${file}.sna $${file}.bmp ; \
	done
