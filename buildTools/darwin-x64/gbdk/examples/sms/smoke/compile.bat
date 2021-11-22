REM Automatically generated from Makefile
..\..\..\bin\lcc -mz80:sms -Wm-yoA -Wl-j -c -o assets.o assets.c
..\..\..\bin\lcc -mz80:sms -Wm-yoA -Wl-j -c -o banked.o banked.c
..\..\..\bin\lcc -mz80:sms -Wm-yoA -Wl-j -c -o smoketest.o smoketest.c
..\..\..\bin\lcc -mz80:sms -Wm-yoA -Wl-j -c -o ram_bank0.o ram_bank0.s
..\..\..\bin\lcc -mz80:sms -Wm-yoA -Wl-j -c -o ram_bank1.o ram_bank1.s
..\..\..\bin\lcc -mz80:sms -Wm-yoA -Wl-j -Wm-yS -o smoketest.sms assets.o banked.o smoketest.o ram_bank0.o ram_bank1.o
rm -f *.map *.noi *.ihx *.lst
