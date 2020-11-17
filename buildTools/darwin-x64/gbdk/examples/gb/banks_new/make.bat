REM Automatically generated from Makefile
..\..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o MBC1_RAM_INIT.o MBC1_RAM_INIT.s
..\..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o banks_new.o banks_new.c
..\..\..\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt2 -Wl-yo4 -Wl-ya4 -o banks_new.gb MBC1_RAM_INIT.o banks_new.o
