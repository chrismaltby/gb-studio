$(LIB): pre $(OBJ)
	cd $(BUILD); ls *.o > `basename $(LIB)`

pre: set-model build-dir

$(BUILD)/%.o: %.c
	$(CC) $(CFLAGS) -c $<
	mv `basename $< .c`.o $@

$(BUILD)/%.o: %.s
	$(AS) -plosgff $@ $<
