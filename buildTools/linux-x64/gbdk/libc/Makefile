# Makefile for libc

.EXPORT_ALL_VARIABLES:

TOPDIR = ..

CSRC =	abs.c atoi.c atol.c isalpha.c isdigit.c \
	islower.c isspace.c isupper.c itoa.c labs.c \
	printf.c puts.c reverse.c scanf.c strcat.c string.c \
	strlen.c strncat.c strncmp.c strncpy.c time.c \
	tolower.c toupper.c \
	_modulong.c _modslong.c _divulong.c _divslong.c _mullong.c
#	free.c malloc.c realloc.c calloc.c ltoa.c

include $(TOPDIR)/Makefile.common

all: ports platforms

clean: port-clean ports-clean platform-clean

ports:
	for i in $(PORTS); do make port THIS=$$i PORT=$$i; done

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
