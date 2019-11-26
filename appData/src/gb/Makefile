CC = lcc -Wa-l -Wl-m -Wl-j -Wl-yt$(CART_TYPE) -Iinclude

ROM_BUILD_DIR = build/rom

OBJ_DIR = obj
SOURCE_DIR = src

CFLAGS = -Wl-yo64 -Wl-ya4 -Wl-yp0x143=0x80

SOURCES := $(shell find -L $(SOURCE_DIR) -name '*.c')
SOURCES_ASM := $(shell find -L $(SOURCE_DIR) -name '*.s')
OBJS = $(SOURCES:$(SOURCE_DIR)/%.c=$(OBJ_DIR)/%.o) $(SOURCES_ASM:$(SOURCE_DIR)/%.s=$(OBJ_DIR)/%.o)

all:	game.html

$(OBJ_DIR)/%.o:	$(SOURCE_DIR)/%.c
	$(CC) -c -o $@ $<

$(OBJ_DIR)/%.o:	$(SOURCE_DIR)/%.s
	$(CC) -c -o $@ $<

$(ROM_BUILD_DIR)/%.gb:  $(OBJS)
	mkdir -p $(ROM_BUILD_DIR)
	$(CC) $(CFLAGS) -o $@ $^	

clean:
	rm -rf build
	rm -rf obj/*.o
	rm -rf obj/data/*.o	
	rm -rf obj/*.lst
	rm -rf obj/data/*.lst

rom: $(ROM_BUILD_DIR)/game.gb
