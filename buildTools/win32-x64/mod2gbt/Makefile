# SPDX-License-Identifier: MIT
#
# Copyright (c) 2020, Antonio Niño Díaz

NAME	:= mod2gbt

SOURCES	:= \
	mod2gbt.c \

OBJS	:= $(SOURCES:.c=.o)

all: $(NAME)

$(NAME): $(OBJS)
	$(CC) $(CFLAGS) -o $@ $(OBJS)

.c.o:
	$(CC) $(CFLAGS) -c -o $*.o $<

clean:
	rm -f $(OBJS) $(NAME)
