set SDCCFLAGS=--debug --stack-after-data --model-large 
cls
cd src
sdcc --version
sdcc %SDCCFLAGS% --compile-only startup_code.c
sdcc %SDCCFLAGS% --compile-only cpu_c515a.c
sdcc %SDCCFLAGS% startup_code.rel cpu_c515a.rel
cd ..
pause
c.bat
