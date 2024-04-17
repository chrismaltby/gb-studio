REM Automatically generated from Makefile

..\..\..\bin\png2asset res\scene00001.png -keep_duplicate_tiles -map -bpp2 -c obj\res\scene00001.c
..\..\..\bin\lcc -Iobj  -c -o obj\scene00001.o obj\res\scene00001.c
..\..\..\bin\lcc -Iobj -c -o obj\gbprinter.o src\gbprinter.c
..\..\..\bin\lcc -Iobj -c -o obj\print_example.o src\print_example.c
..\..\..\bin\lcc -Iobj -o obj\print_example.gb obj\scene00001.o obj\gbprinter.o obj\print_example.o 
