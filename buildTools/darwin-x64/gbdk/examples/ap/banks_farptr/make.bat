REM Automatically generated from Makefile
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS -c -o banks_farptr.o banks_farptr.c
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS -c -o bank2code.o bank2code.c
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS -Wl-yt0x19 -Wl-yoA -o banks_farptr.pocket bank2code.o banks_farptr.o
