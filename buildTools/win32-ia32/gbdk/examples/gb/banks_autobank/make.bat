REM Automatically generated from Makefile
..\..\..\bin\lcc -Wa-l -Wl-m  -c -o banks.o banks.c
..\..\..\bin\lcc -Wa-l -Wl-m  -c -o srcfile_1.o srcfile_1.c
..\..\..\bin\lcc -Wa-l -Wl-m  -c -o srcfile_2.o srcfile_2.c
..\..\..\bin\lcc -Wa-l -Wl-m  -c -o srcfile_3.o srcfile_3.c
..\..\..\bin\lcc -Wa-l -Wl-m  -c -o srcfile_4_not-autobanked.o srcfile_4_not-autobanked.c
..\..\..\bin\lcc -Wa-l -Wl-m  -autobank -Wb-ext=.rel -Wb-v -Wl-yt0x1B -Wl-yoA -Wl-ya4 -o autobanks.gb banks.o srcfile_1.o srcfile_2.o srcfile_3.o srcfile_4_not-autobanked.o 
