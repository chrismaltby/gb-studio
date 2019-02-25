ifeq ($(ASM),rgbds)
CFLAGS += --asm=rgbds
# Override the default rule
%.o: %.s

$(LIB): pre $(OBJ) $(CRT0)
	mkdir -p $(BUILD)
ifneq ($(LIB_APPEND), 1)
	rm -f $(LIB)
endif
	xlib $(LIB) a $(OBJ)
ifdef CRT0
	cp -f $(CRT0) $(BUILD)
endif

pre: set-model
	-astorgb.pl global.s > global.asm

%.o: %.c
	$(CC) $(CFLAGS) -c $<

%.asm: %.s
	astorgb.pl $< > $@

%.o: %.rasm
	rgbasm -o$@ $<

%.o: %.asm
	rgbasm -o$@ $<

