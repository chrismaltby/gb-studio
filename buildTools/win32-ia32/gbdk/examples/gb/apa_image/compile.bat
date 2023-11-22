REM Automatically generated from Makefile

..\..\..\bin\png2asset res\scenery.png -keep_duplicate_tiles -map -bpp2 -tiles_only -c obj\res\scenery.c
..\..\..\bin\lcc  -c -o obj\scenery.o obj\res\scenery.c
..\..\..\bin\lcc -Iobj -Wm-yc -c -o obj\main.o src\main.c
..\..\..\bin\lcc -Iobj -Wm-yc -o obj\apa_image.gb obj\scenery.o obj\main.o 
