CC = ../../../bin/sdcc

#VERBOSE = --verbose

OBJECTS = tinibios.rel memcpyx.rel  lcd390.rel i2c390.rel rtc390.rel

SOURCES = $(patsubst %.rel,%.c,$(OBJECTS))

CPPFLAGS = -I../../include
CFLAGS = -mds390 $(CPPFLAGS) $(VERBOSE)

all: $(OBJECTS) libds390.lib

clean:
	rm -f *.lst *.rel *.sym *.cdb *.asm \#* *~ *.rst *.hex 
	rm -f *.ihx temp.lnk *.map *.lib

superclean:
	make clean ; rm Makefile.dep

libds390.lib: $(OBJECTS)
	rm -f $@; \
	for libfile in $(OBJECTS); do \
		echo $$libfile >>$@; \
	done;

%.rel: %.c
	$(CC) -c $(CFLAGS) $<

# Creating dependencies
# ---------------------
depend: Makefile.dep

Makefile.dep: $(SOURCES)
	rm -f Makefile.dep
	for i in $(SOURCES); do \
	  $(CC) -M $(CPPFLAGS) $$i >$${i}.dep; \
	  cat $${i}.dep >>Makefile.dep; \
	  rm $${i}.dep; \
	done

include Makefile.dep
