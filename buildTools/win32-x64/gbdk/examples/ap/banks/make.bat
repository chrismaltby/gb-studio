REM Automatically generated from Makefile
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS -c -o banks.o banks.c
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS -Wf-ba0 -c -o bank_0.o bank_0.c
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS -Wf-bo1 -Wf-ba1 -c -o bank_1.o bank_1.c
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS -Wf-bo2 -Wf-ba2 -c -o bank_2.o bank_2.c
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS -Wf-bo3 -Wf-ba3 -c -o bank_3.o bank_3.c
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS -Wl-yt0x1A -Wl-yo4 -Wl-ya4 -o banks.pocket banks.o bank_0.o bank_1.o bank_2.o bank_3.o
