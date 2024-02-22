REM Automatically generated from Makefile
..\..\..\bin\lcc -mmos6502:nes -Wm-yoA -Wl-j  -c -o smoketest.o smoketest.c
..\..\..\bin\lcc -mmos6502:nes -Wm-yoA -Wl-j  -Wm-yS -o smoketest.nes smoketest.o
rm -f *.map *.noi *.ihx *.lst *.rst
