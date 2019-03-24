..\..\bin\lcc -Wa-l -c -o dscan.o dscan.c
..\..\bin\lcc -Wl-m -Wl-yp0x143=0x80 -o dscan.gb dscan.o
