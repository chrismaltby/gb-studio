# Simple Makefile for the lcc frontend.

ifndef TARGETDIR
TARGETDIR = /opt/gbdk
endif

CC = $(TOOLSPREFIX)gcc
CFLAGS = -ggdb -O -Wall -DGBDKLIBDIR=\"$(TARGETDIR)\"
OBJ = lcc.o gb.o
BIN = lcc

all: $(BIN)

$(BIN): $(OBJ)

clean:
	rm -f *.o $(BIN) *~
