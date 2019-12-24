CC = lcc

ROM_BUILD_DIR = build/rom
OBJDIR = obj

CFLAGS = -Wa-l -Wl-m -Wl-j -Wl-yt27 -Iinclude -Iinclude/core -Iinclude/states -Igenerated -Inode_modules/gbdkjs/include
CFLAGS += -DCGB

LFLAGS_NBANKS += -Wl-yp0x143=0xC0
LFLAGS = $(LFLAGS_NBANKS) -Wl-m

ASM = $(foreach dir,src,$(notdir $(wildcard $(dir)/*.s))) 
CLASSES = $(foreach dir,src,$(notdir $(wildcard $(dir)/*.c))) 
CORE_CLASSES = $(foreach dir,src/core,$(notdir $(wildcard $(dir)/*.c))) 
STATE_CLASSES = $(foreach dir,src/states,$(notdir $(wildcard $(dir)/*.c))) 
DATA = $(foreach dir,src/data,$(notdir $(wildcard $(dir)/*.c))) 

OBJS = $(CLASSES:%.c=$(OBJDIR)/%.o) $(ASM:%.s=$(OBJDIR)/%.o) $(CORE_CLASSES:%.c=$(OBJDIR)/%.o) $(STATE_CLASSES:%.c=$(OBJDIR)/%.o) $(DATA:%.c=$(OBJDIR)/%.o)

all:	$(ROM_BUILD_DIR)/game.gb

$(OBJDIR)/%.o:	src/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/core/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/states/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/data/%.c
	$(CC) $(CFLAGS) -c -o $@ $<	

$(OBJDIR)/%.s:	src/%.c
	$(CC) $(CFLAGS) -S -o $@ $<

$(OBJDIR)/%.o:	src/%.s
	$(CC) $(CFLAGS) -c -o $@ $<

$(ROM_BUILD_DIR)/%.gb:	$(OBJS)
	mkdir -p $(ROM_BUILD_DIR)
	$(CC) $(LFLAGS) -Wa-l -Wl-m -Wl-j -Wl-yt27 -Iinclude -Wl-yo64 -Wl-ya4 -Wl-yp0x143=0x80 -o $@ $^	

clean:
	echo $(dir)
	echo $(CLASSES)
	echo $(OBJS)
	echo "---"
	echo $(ASM:%.s=$(OBJDIR)/%.o)
	rm -f obj/*
	rm -rf build

rom: $(ROM_BUILD_DIR)/game.gb
