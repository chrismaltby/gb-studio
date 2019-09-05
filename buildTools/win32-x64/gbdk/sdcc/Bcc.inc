#Generic rules and options for building with Borland C++

SLIB = $(PRJDIR)/support/Util

OFLAGS = -6 -O2 -g0 -w-proto

.c.obj:
        BCC32 -c -o$@ $(OFLAGS) $(CFLAGS) $(CPPFLAGS) -I$(SLIB) $<
