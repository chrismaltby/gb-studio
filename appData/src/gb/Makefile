NODE_MODULES = ./node_modules
SHELL_FILE = ${NODE_MODULES}/gbdkjs/shell_deploy/index.html
DEBUG_SHELL_FILE = ${NODE_MODULES}/gbdkjs/shell_debug/build/index.html

EMCC = emcc -O2 -s WASM=0 -Wno-implicit-function-declaration -I${NODE_MODULES}/gbdkjs/include -I${NODE_MODULES}/gbdkjs/gbdk/include -Iinclude -Isrc/data --js-library ${NODE_MODULES}/gbdkjs/emscripten_bindings.js
CC = lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude
MOD2GBT = ../mod2gbt/mod2gbt

ROM_BUILD_DIR = build/rom
WEB_BUILD_DIR = build/web
WEB_DEBUG_BUILD_DIR = build/debug

OBJ_DIR = obj
SOURCE_DIR = src

CFLAGS = -DUSE_SFR_FOR_REG -Wl-yt3 -Wl-yo32 -Wl-ya4
CIGNORE = 3>&1 1>&2 2>&3 3>&- 

SOURCES := $(shell find -L $(SOURCE_DIR) -name '*.c')
SOURCES_ASM := $(shell find -L $(SOURCE_DIR) -name '*.s')
OBJS = $(SOURCES:$(SOURCE_DIR)/%.c=$(OBJ_DIR)/%.o) $(SOURCES_ASM:$(SOURCE_DIR)/%.s=$(OBJ_DIR)/%.o)
EM_OBJS = $(SOURCES:$(SOURCE_DIR)/%.c=$(OBJ_DIR)/%.bc)

all:	game.html

%.music.c:	%.mod
	$(MOD2GBT) $< 'song_'$(basename $(basename $@)) -c 28
	mv music.c $@

$(OBJ_DIR)/%.o:	$(SOURCE_DIR)/%.c
	$(CC) -c -o $@ $<

$(OBJ_DIR)/%.o:	$(SOURCE_DIR)/%.s
	$(CC) -c -o $@ $<

$(OBJ_DIR)/%.bc:	$(SOURCE_DIR)/%.c
	$(EMCC) -o $@ $<

$(ROM_BUILD_DIR)/%.gb:  $(OBJS)
	mkdir -p $(ROM_BUILD_DIR)
	$(CC) $(CFLAGS) -o $@ $^	

$(WEB_BUILD_DIR)/%.html:	$(EM_OBJS)
	mkdir -p $(WEB_BUILD_DIR)
	cp -r ${NODE_MODULES}/gbdkjs/shell_deploy/static $(WEB_BUILD_DIR)
	$(EMCC) --shell-file $(SHELL_FILE) -s ASSERTIONS=1 -s SAFE_HEAP=1 --profiling-funcs -g -o $@ $^

$(WEB_DEBUG_BUILD_DIR)/%.html: $(EM_OBJS)
	mkdir -p $(WEB_DEBUG_BUILD_DIR)
	cp -r ${NODE_MODULES}/gbdkjs/shell_debug/build/static $(WEB_DEBUG_BUILD_DIR)
	$(EMCC) --shell-file $(DEBUG_SHELL_FILE) -s ASSERTIONS=1 -o $@ $^

clean:
	rm -rf build
	rm -rf obj/*.o
	rm -rf obj/data/*.o	
	rm -rf obj/*.lst
	rm -rf obj/data/*.lst

rom: $(ROM_BUILD_DIR)/game.gb

pretty:
	gindent -kr -ci2 -cli2 -i2 -l80 -nut $(SOURCES)

tidy:
	rm -f src/*~
	rm -f src/data/*~

web: $(WEB_BUILD_DIR)/game.html
	mv $(WEB_BUILD_DIR)/game.html $(WEB_BUILD_DIR)/index.html

debug: $(WEB_DEBUG_BUILD_DIR)/game.html
	mv $(WEB_DEBUG_BUILD_DIR)/game.html $(WEB_DEBUG_BUILD_DIR)/index.html
