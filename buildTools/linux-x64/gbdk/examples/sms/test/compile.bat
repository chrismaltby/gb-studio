REM Automatically generated from Makefile
..\..\..\bin\lcc -mz80:sms -Wm-yoA -Wl-j -c -o test.o test.c
..\..\..\bin\lcc -mz80:sms -Wm-yoA -Wl-j -Wm-yS -o test.sms test.o
rm -f *.map *.noi *.ihx *.lst
