md obj\data
REM ..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/game.o src/game.c
md build\rom
REM ..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -DUSE_SFR_FOR_REG -Wl-yo32 -Wl-ya4 -o build/rom/game.gb obj/game.o

REM ..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -DUSE_SFR_FOR_REG -Iinclude -c -o obj/game2.o src/game2.c
REM ..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -DUSE_SFR_FOR_REG -Wl-yo32 -Wl-ya4 -o build/rom/game.gb obj/game2.o

REM THIS ONE WORKS
REM ..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -DUSE_SFR_FOR_REG -c -o obj/galaxy.o src/galaxy.c
REM ..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -DUSE_SFR_FOR_REG -o build/rom/game1.gb obj/galaxy.o



..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/game.o src/game.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/FadeManager.o src/FadeManager.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/Stack.o src/Stack.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/BankManager.o src/BankManager.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/BankData.o src\BankData.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/UI.o src/UI.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/UI_b.o src/UI_b.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/data/bank_17.o src/data/bank_17.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/data/data_ptrs.o src/data/data_ptrs.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/data/strings_16.o src/data/strings_16.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/SpriteHelpers.o src/SpriteHelpers.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/bank3.o src/bank3.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/Math.o src/Math.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/ScriptRunner.o src/ScriptRunner.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/ScriptRunner_b.o src/ScriptRunner_b.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/Scene.o src/Scene.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/Scene_b.o src/Scene_b.c


..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/palette_town.music.o palette_town.music.c
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/gbt_player.o src/gbt_player.s
..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/gbt_player_bank1.o src/gbt_player_bank1.s

..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -DUSE_SFR_FOR_REG -Wl-yo32 -Wl-ya4 -o build/rom/game.gb obj/game.o obj/FadeManager.o obj/Stack.o obj/BankManager.o obj/BankData.o obj/UI.o obj/UI_b.o obj/data/bank_17.o obj/data/data_ptrs.o obj/data/strings_16.o obj/SpriteHelpers.o obj/bank3.o obj/Math.o obj/ScriptRunner.o obj/ScriptRunner_b.o obj/Scene.o obj/Scene_b.o  obj/palette_town.music.o obj/gbt_player.o obj/gbt_player_bank1.o
REM ..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/Scene.o src/Scene.c
REM ..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/Scene_b.o src/Scene_b.c
REM ..\_gbs\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -DUSE_SFR_FOR_REG -Wl-yo32 -Wl-ya4 -o build/rom/game.gb obj/BankData.o obj/game.o obj/Math.o obj/bank3.o obj/ScriptRunner_b.o obj/Stack.o obj/FadeManager.o obj/Scene.o obj/BankManager.o obj/UI_b.o obj/Scene_b.o obj/UI.o obj/ScriptRunner.o obj/data/bank_17.o obj/data/data_ptrs.o obj/data/strings_16.o obj/SpriteHelpers.o