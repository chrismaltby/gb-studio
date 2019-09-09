# Makefile for libc

.EXPORT_ALL_VARIABLES:

TOPDIR = ..

include $(TOPDIR)/Makefile.common

OBJ =	abs.o atoi.o atol.o isalpha.o isdigit.o \
	islower.o isspace.o isupper.o itoa.o labs.o ltoa.o \
	printf.o puts.o reverse.o scanf.o strcat.o string.o \
	strlen.o strncat.o strncmp.o strncpy.o time.o \
	tolower.o toupper.o
#	free.o malloc.o realloc.o calloc.o

all: ports platforms

clean: port-clean ports-clean platform-clean

ports:
	for i in $(PORTS); do make port THIS=$$i; done

platforms:
	for i in $(PLATFORMS); do make -C $$i platform THIS=$$i; done

# Make all the std libs
# Make all the port specific libs

# Uses the LIB <- OBJ rule from Makefile.rules
port: port-clean $(LIB)
	make -C asm/$(PORT) port

port-clean:
	rm -f $(LIBC_OBJ) $(CLEANSPEC)

ports-clean:
	for i in $(PORTS); do make -C asm/$$i clean THIS=$$i; done

platform-clean:
	for i in $(PLATFORMS); do make -C $$i clean PLAT=$$i; done

include Makefile.rules
