REM Automatically generated from Makefile
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS -D_inc_ram=0xD000 -D_inc_hiram=0xFFA0 -c -o ram_fn.o ram_fn.c
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS -Wl-g_inc_ram=0xD000 -Wl-g_inc_hiram=0xFFA0 -o ram_fn.pocket ram_fn.o
