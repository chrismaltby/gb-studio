CFLAGS=-Wall -g

tinitalk: tinitalk.c tinitalk.h
	cc -o $@ $(CFLAGS) $<
	cp $@ /usr/local/bin

clean:
	rm -f core *~ *.o tinitalk \#*
