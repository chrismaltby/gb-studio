REM Automatically generated from Makefile
..\..\..\bin\lcc -mz80:gg -Wm-yoA -Wl-m -Wl-j -c -o smoketest.o smoketest.c
..\..\..\bin\lcc -mz80:gg -Wm-yoA -Wl-m -Wl-j -c -o banked.o banked.c
..\..\..\bin\lcc -mz80:gg -Wm-yoA -Wl-m -Wl-j -c -o assets.o assets.c
..\..\..\bin\lcc -mz80:gg -Wm-yoA -Wl-m -Wl-j -Wm-yS -o smoketest.gg smoketest.o banked.o assets.o
rm -f *.map *.noi *.ihx *.lst
