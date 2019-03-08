md obj\data
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/BankData.o src\BankData.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/game.o src/game.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/Math.o src/Math.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/bank3.o src/bank3.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/ScriptRunner_b.o src/ScriptRunner_b.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/Stack.o src/Stack.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/FadeManager.o src/FadeManager.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/Scene.o src/Scene.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/BankManager.o src/BankManager.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/UI_b.o src/UI_b.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/Scene_b.o src/Scene_b.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/UI.o src/UI.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/ScriptRunner.o src/ScriptRunner.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/data/bank_17.o src/data/bank_17.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/data/data_ptrs.o src/data/data_ptrs.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/data/strings_16.o src/data/strings_16.c
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -c -o obj/SpriteHelpers.o src/SpriteHelpers.c
md build\rom
..\_gbstudio_build_tools_\gbdk\bin\lcc -Wa-l -Wl-m -Wl-j -Wl-yt1 -Iinclude -DUSE_SFR_FOR_REG -Wl-yo32 -Wl-ya4 -o build/rom/game.gb obj/BankData.o obj/game.o obj/Math.o obj/bank3.o obj/ScriptRunner_b.o obj/Stack.o obj/FadeManager.o obj/Scene.o obj/BankManager.o obj/UI_b.o obj/Scene_b.o obj/UI.o obj/ScriptRunner.o obj/data/bank_17.o obj/data/data_ptrs.o obj/data/strings_16.o obj/SpriteHelpers.o
REM rm obj/ScriptRunner_b.o obj/game.o obj/data/data_ptrs.o obj/Scene.o obj/Stack.o obj/Math.o obj/FadeManager.o obj/SpriteHelpers.o obj/BankData.o obj/Scene_b.o obj/UI.o obj/data/strings_16.o obj/ScriptRunner.o obj/bank3.o obj/UI_b.o obj/data/bank_17.o obj/BankManager.o