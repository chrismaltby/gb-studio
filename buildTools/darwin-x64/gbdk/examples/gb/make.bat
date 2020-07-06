REM Automatically generated from Makefile
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o galaxy.o galaxy.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -o galaxy.gb galaxy.o
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o space.o space.s
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -o space.gb space.o
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o paint.o paint.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -o paint.gb paint.o
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o rpn.o rpn.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -o rpn.gb rpn.o
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o rand.o rand.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -o rand.gb rand.o
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o comm.o comm.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -o comm.gb comm.o
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o irq.o irq.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -o irq.gb irq.o
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o filltest.o filltest.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -o filltest.gb filltest.o
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -D_inc_ram=0xD000 -D_inc_hiram=0xFFA0 -c -o ram_fn.o ram_fn.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-g_inc_ram=0xD000 -Wl-g_inc_hiram=0xFFA0 -o ram_fn.gb ram_fn.o
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o fonts.o fonts.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -o fonts.gb fonts.o
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o samptest.o samptest.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -o samptest.gb samptest.o
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o banks.o banks.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -Wf-ba0 -c -o bank_0.o bank_0.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -Wf-bo1 -Wf-ba1 -c -o bank_1.o bank_1.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -Wf-bo2 -Wf-ba2 -c -o bank_2.o bank_2.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -Wf-bo3 -Wf-ba3 -c -o bank_3.o bank_3.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt2 -Wl-yo4 -Wl-ya4 -o banks.gb banks.o bank_0.o bank_1.o bank_2.o bank_3.o
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o MBC1_RAM_INIT.o MBC1_RAM_INIT.s
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o new_banks.o new_banks.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt2 -Wl-yo4 -Wl-ya4 -o new_banks.gb MBC1_RAM_INIT.o new_banks.o
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -c -o farptr.o farptr.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -Wf-bo1 -c -o bank1code.o bank1code.c
..\..\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Wl-yo4 -o farptr.gb bank1code.o farptr.o
