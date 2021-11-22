REM Automatically generated from Makefile
..\..\..\bin\lcc -Wa-l -Wl-m -Wl-j -D_inc_ram=0xD000 -D_inc_hiram=0xFFA0 -c -o ram_fn.o ram_fn.c
..\..\..\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-g_inc_ram=0xD000 -Wl-g_inc_hiram=0xFFA0 -o ram_fn.gb ram_fn.o
