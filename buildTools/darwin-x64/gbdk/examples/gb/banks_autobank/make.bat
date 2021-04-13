REM Automatically generated from Makefile
..\..\..\bin\lcc -Wa-l -Wl-m  -c -o banks.o banks.c
..\..\..\bin\lcc -Wa-l -Wl-m  -c -o srcfile_1.o srcfile_1.c
..\..\..\bin\lcc -Wa-l -Wl-m  -c -o srcfile_2.o srcfile_2.c
..\..\..\bin\lcc -Wa-l -Wl-m  -c -o srcfile_3.o srcfile_3.c
..\..\..\bin\lcc -Wa-l -Wl-m  -c -o srcfile_4_not-autobanked.o srcfile_4_not-autobanked.c
..\..\..\bin\bankpack -ext=.rel -v -yt19 banks.o srcfile_1.o srcfile_2.o srcfile_3.o srcfile_4_not-autobanked.o 
..\..\..\bin\lcc -Wa-l -Wl-m  -Wl-yt19 -Wl-yo4 -Wl-ya4 -o autobanks.gb banks.rel srcfile_1.rel srcfile_2.rel srcfile_3.rel srcfile_4_not-autobanked.rel 
