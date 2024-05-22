REM Automatically generated from Makefile
mkdir obj
..\..\..\bin\lcc   -c -o obj\main.o src\main.c
..\..\..\bin\lcc   -c -o obj\dungeon_map.o res\dungeon_map.c
..\..\..\bin\lcc   -c -o obj\dungeon_tiles.o res\dungeon_tiles.c
..\..\..\bin\lcc   -o obj\Example.gb obj\main.o obj\dungeon_map.o obj\dungeon_tiles.o 
