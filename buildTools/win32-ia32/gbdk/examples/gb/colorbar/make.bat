..\..\bin\lcc -Wa-l -c -o colorbar.o colorbar.c
..\..\bin\lcc -Wl-m -Wl-yp0x143=0x80 -o colorbar.gb colorbar.o
