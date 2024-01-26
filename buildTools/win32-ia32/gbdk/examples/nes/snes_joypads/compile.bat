REM Automatically generated from Makefile
..\..\..\bin\lcc -mmos6502:nes -Wm-yoA -Wl-j  -c -o snes_joypads.o snes_joypads.c
..\..\..\bin\lcc -mmos6502:nes -Wm-yoA -Wl-j  -Wm-yS -o snes_joypads.nes snes_joypads.o
rm -f *.map *.noi *.ihx *.lst *.rst
