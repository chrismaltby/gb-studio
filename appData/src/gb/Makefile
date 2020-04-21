SHELL_FILE = node_modules/gbdkjs/shell_debug/build/index.html
EMCC = emcc -O2 -Wno-implicit-function-declaration -Inode_modules/gbdkjs/include -Inode_modules/gbdkjs/gbdk/include -Iinclude -Iinclude/core -Iinclude/states -Lsrc -Lsrc/core -Lsrc/data -Lsrc/states --js-library node_modules/gbdkjs/emscripten_bindings.js -s ALLOW_MEMORY_GROWTH=1 -s ASSERTIONS=1 -s SAFE_HEAP=1 -s DETERMINISTIC=1 -s BINARYEN_IGNORE_IMPLICIT_TRAPS=1

CC = lcc

ROM_BUILD_DIR = build/rom
WEB_BUILD_DIR = build/debug

OBJDIR = obj

CFLAGS = -Wa-l -Wl-m -Wl-j -Wl-yt27 -Iinclude -Iinclude/core -Iinclude/states -Igenerated -Inode_modules/gbdkjs/include
CFLAGS += -DCGB

LFLAGS_NBANKS += -Wl-yo$(CART_SIZE) -Wl-ya4 -Wl-yp0x143=0x80
LFLAGS = $(LFLAGS_NBANKS) -Wl-m

ASM = $(foreach dir,src/core,$(notdir $(wildcard $(dir)/*.s))) 
CLASSES = $(foreach dir,src,$(notdir $(wildcard $(dir)/*.c))) 
CORE_CLASSES = $(foreach dir,src/core,$(notdir $(wildcard $(dir)/*.c))) 
STATE_CLASSES = $(foreach dir,src/states,$(notdir $(wildcard $(dir)/*.c))) 
DATA = $(foreach dir,src/data,$(notdir $(wildcard $(dir)/*.c))) 
MUSIC = $(foreach dir,src/music,$(notdir $(wildcard $(dir)/*.c))) 

OBJS = $(CLASSES:%.c=$(OBJDIR)/%.o) $(ASM:%.s=$(OBJDIR)/%.o) $(CORE_CLASSES:%.c=$(OBJDIR)/%.o) $(STATE_CLASSES:%.c=$(OBJDIR)/%.o) $(DATA:%.c=$(OBJDIR)/%.o) $(MUSIC:%.c=$(OBJDIR)/%.o) 
WEB_OBJS = $(CLASSES:%.c=$(OBJDIR)/%.bc) $(CORE_CLASSES:%.c=$(OBJDIR)/%.bc) $(STATE_CLASSES:%.c=$(OBJDIR)/%.bc) $(DATA:%.c=$(OBJDIR)/%.bc) $(MUSIC:%.c=$(OBJDIR)/%.bc) 

all:	$(ROM_BUILD_DIR)/game.gb

.SECONDARY: $(OBJS) $(WEB_OBJS)

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

$(OBJDIR)/%.bc:	src/%.c
	$(EMCC) -o $@ -c $<

$(OBJDIR)/%.bc:	src/core/%.c
	$(EMCC) -o $@ -c $<

$(OBJDIR)/%.bc:	src/states/%.c
	$(EMCC) -o $@ -c $<

$(OBJDIR)/%.bc:	src/data/%.c
	$(EMCC) -o $@ -c $<	

$(OBJDIR)/%.bc:	src/music/%.c
	$(EMCC) -o $@ -c $<		

$(ROM_BUILD_DIR)/%.gb:	$(OBJS)
	mkdir -p $(ROM_BUILD_DIR)
	$(CC) $(LFLAGS) -Wa-l -Wl-m -Wl-j -Wl-yt27 -Iinclude -o $@ $^	

$(WEB_BUILD_DIR)/%.html:	$(WEB_OBJS)
	mkdir -p $(WEB_BUILD_DIR)
	cp -r node_modules/gbdkjs/shell_debug/build/static $(WEB_BUILD_DIR)
	$(EMCC) --shell-file $(SHELL_FILE) -s ASSERTIONS=1 -o $@ $^

clean:
	echo $(dir)
	echo $(CLASSES)
	echo $(OBJS)
	echo "---"
	echo $(ASM:%.s=$(OBJDIR)/%.o)
	rm -rf obj/*
	rm -rf build

rom: $(ROM_BUILD_DIR)/game.gb

debug: $(WEB_BUILD_DIR)/game.html
	mv $(WEB_BUILD_DIR)/game.html $(WEB_BUILD_DIR)/index.html
