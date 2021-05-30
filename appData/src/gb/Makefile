CC = lcc
ROM_BUILD_DIR = build/rom
OBJDIR = obj
CFLAGS = -Wa-l -Iinclude
LFLAGS_NBANKS += -Wl-yo$(CART_SIZE)
LFLAGS = $(LFLAGS_NBANKS) -Wa-l -Wl-m -Wl-j -Wl-yt27 -Wl-ya4

ifdef COLOR
CFLAGS += -DCGB
LFLAGS += -Wm-yc
endif

ifdef PROFILE
CFLAGS += -Wf--profile
endif

ASM = $(foreach dir,src/core,$(notdir $(wildcard $(dir)/*.s))) 
CLASSES = $(foreach dir,src,$(notdir $(wildcard $(dir)/*.c))) 
CORE_CLASSES = $(foreach dir,src/core,$(notdir $(wildcard $(dir)/*.c))) 
STATE_CLASSES = $(foreach dir,src/states,$(notdir $(wildcard $(dir)/*.c))) 
DATA = $(foreach dir,src/data,$(notdir $(wildcard $(dir)/*.c))) 
MUSIC = $(foreach dir,src/music,$(notdir $(wildcard $(dir)/*.c))) 

OBJS = $(CLASSES:%.c=$(OBJDIR)/%.o) $(ASM:%.s=$(OBJDIR)/%.o) $(CORE_CLASSES:%.c=$(OBJDIR)/%.o) $(STATE_CLASSES:%.c=$(OBJDIR)/%.o) $(DATA:%.c=$(OBJDIR)/%.o) $(MUSIC:%.c=$(OBJDIR)/%.o) 

all:	$(ROM_BUILD_DIR)/game.gb

.SECONDARY: $(OBJS) 

$(OBJDIR)/%.o:	src/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/core/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/states/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/data/%.c
	$(CC) $(CFLAGS) -c -o $@ $<	

$(OBJDIR)/%.o:	src/music/%.c
	$(CC) $(CFLAGS) -c -o $@ $<	

$(OBJDIR)/%.s:	src/%.c
	$(CC) $(CFLAGS) -S -o $@ $<

$(OBJDIR)/%.o:	src/core/%.s
	$(CC) $(CFLAGS) -c -o $@ $<

$(ROM_BUILD_DIR)/%.gb:	$(OBJS)
	mkdir -p $(ROM_BUILD_DIR)
	$(CC) $(LFLAGS) -Iinclude -o $@ $^	

clean:
	echo $(dir)
	echo $(CLASSES)
	echo $(OBJS)
	echo "---"
	echo $(ASM:%.s=$(OBJDIR)/%.o)
	rm -rf obj/*
	rm -rf build

rom: $(ROM_BUILD_DIR)/game.gb
