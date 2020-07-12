# Developer Guide

## Profiling Engine

When GB Studio is run from source an extra checkbox will appear on the Build Page, "Enable BGB Profiling". Turning this setting on will pass aditional profiling flags to the GBDK compiler producing profiling log data when the game is run using the [BGB emulator](https://bgb.bircd.org/)

If you start BGB using a command line using the -watch flag it will reload your game on each successful build:

```
./bgb -watch -rom game.gb
```

To make use of the profiling data it is recommended to use https://github.com/untoxa/bgb_profiling_toolkit.

When using "Export ROM" a `.map` file is included with your ROM which when used with the BGB output file will allow generating profiling statistics

e.g.
```
python calc_statistics.py debugmsg.txt game.map

_UIOnInteract:_PopBank:_StackPop                    MIN:      34 AVG:     34.00 95P:      34 MAX:      34 TOTAL: 0x0000000000000044 NCALLS: 2
_ActorRunCollisionScripts:_PushBank:_StackPush      MIN:      26 AVG:     26.00 95P:      26 MAX:      26 TOTAL: 0x0000000000000034 NCALLS: 2
_UIUpdate:_UIUpdate_b:_UIDrawTextBuffer             MIN:     290 AVG:    354.00 95P:     290 MAX:     419 TOTAL: 0x00000000000002c5 NCALLS: 2
_UpdateCamera:_PushBank:_StackPush:_MusicUpdate     MIN:      84 AVG:     84.00 95P:      84 MAX:      84 TOTAL: 0x0000000000000054 NCALLS: 1
_FadeUpdate:_PushBank                               MIN:      82 AVG:     82.00 95P:      82 MAX:      82 TOTAL: 0x00000000000000a4 NCALLS: 2

```
