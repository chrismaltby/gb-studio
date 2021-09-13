REM Automatically generated from Makefile
..\..\..\bin\png2mtspr sprite.png -sh 48 -spr8x16 -c sprite.c 
..\..\..\bin\lcc -mgbz80:ap -Wl-j -Wm-yS -o metasprites.pocket metasprites.c sprite.c
