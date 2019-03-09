md obj\data
REM ..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/game.o src/game.c
md build\rom
REM ..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -DUSE_SFR_FOR_REG -Wl-yo32 -Wl-ya4 -o build/rom/game.gb obj/game.o

REM ..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -DUSE_SFR_FOR_REG -c -o sound.o sound.c
REM ..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -DUSE_SFR_FOR_REG -o sound.gb sound.o

REM THIS ONE WORKS
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -DUSE_SFR_FOR_REG -c -o obj/galaxy.o src/galaxy.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -DUSE_SFR_FOR_REG -o build/rom/game.gb obj/galaxy.o

