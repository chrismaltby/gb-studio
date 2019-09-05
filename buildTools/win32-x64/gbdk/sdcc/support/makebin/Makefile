PRJDIR = ../..

SOURCES = makebin.c
BIN = $(PRJDIR)/bin/makebin

include $(PRJDIR)/Makefile.common

all: $(BIN)

$(BIN): $(OBJ)
	$(CC) -o $(BIN) $(OBJ)

install: all
	mkdir -p $(bindir)
	$(INSTALL) $(BIN) `echo $(bindir)/makebin|sed '$(transform)'`

include clean.mk
