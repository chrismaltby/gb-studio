REM Automatically generated from Makefile
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS  -c -o banks.o banks.c
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS  -c -o srcfile_2.o srcfile_2.c
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS  -c -o srcfile_3.o srcfile_3.c
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS  -c -o srcfile_4_not-autobanked.o srcfile_4_not-autobanked.c
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS  -c -o srcfile_1.o srcfile_1.c
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS  -autobank -Wb-ext=.rel -Wb-v -Wl-yt0x1B -Wl-yoA -Wl-ya4 -o autobanks.pocket banks.o srcfile_2.o srcfile_3.o srcfile_4_not-autobanked.o srcfile_1.o 
