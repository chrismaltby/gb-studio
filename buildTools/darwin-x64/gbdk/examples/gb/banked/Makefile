SRC = main.c bank2.c bank3.c
BIN = banked.gb

OBJ = $(SRC:.c=.o)

CC	= ../../../bin/lcc -Wa-l -Wl-m -Wl-j

all: $(BIN)

clean:
	rm $(OBJ)

$(BIN): $(OBJ)
	$(CC) -Wl-yt2 -Wl-yo4 -Wl-ya4 -o $@ $(OBJ)

%.o:	%.c
	$(CC) -c -o $@ $<

