# Makefile for libc

TOPDIR = ..

include $(TOPDIR)/Makefile.common

LIBC_OBJ =	abs.o atoi.o atol.o isalpha.o isdigit.o \
		islower.o isspace.o isupper.o itoa.o labs.o ltoa.o \
		printf.o puts.o reverse.o scanf.o strcat.o string.o \
		strlen.o strncat.o strncmp.o strncpy.o time.o \
		tolower.o toupper.o
#		free.o malloc.o realloc.o calloc.o

CFLAGS = -I$(TOPDIR)/include
CFLAGS += -m$(PORT) -v
CC = $(SCC)

all: ports platforms

clean: port-clean ports-clean platform-clean

ports:
	for i in $(PORTS); do make port PORT=$$i; done

platforms:
	for i in $(PLATFORMS); do make -C $$i platform PLAT=$$i; done

# Make all the std libs
# Make all the port specific libs
port: port-clean $(LIBC_OBJ)
	mkdir -p $(TOPDIR)/build/$(PORT)
	cp $(LIBC_OBJ) $(TOPDIR)/build/$(PORT)
	cd $(TOPDIR)/build/$(PORT); ls $(LIBC_OBJ) > $(PORT).lib
	make -C asm/$(PORT) port

port-clean:
	rm -f $(LIBC_OBJ) $(CLEANSPEC)

ports-clean:
	for i in $(PORTS); do make -C asm/$$i clean PORT=$$i; done

platform-clean:
	for i in $(PLATFORMS); do make -C $$i clean PLAT=$$i; done
