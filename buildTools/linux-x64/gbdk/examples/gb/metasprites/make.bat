REM Automatically generated from Makefile
..\..\..\bin\png2mtspr sprite.png -sh 48 -spr8x16 -c sprite.c 
..\..\..\bin\lcc  -o metasprites.gb metasprites.c sprite.c
