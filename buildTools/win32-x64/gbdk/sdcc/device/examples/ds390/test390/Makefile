
all : test390.ihx

test390.ihx : test390.c
	sdcc -mds390 test390.c

normal :
	sdcc -mds390 --model-large test390.c

clean:
	rm mon.ihx *.lst *.rel *.rst *.sym *.cdb *.map *.ihx *.lnk *.asm

sim:
	./s51 -t DS390F -Sout=test.lst test390.ihx

sim_norm:
	./s51 -t DS390 -Sout=test.lst test390.ihx

