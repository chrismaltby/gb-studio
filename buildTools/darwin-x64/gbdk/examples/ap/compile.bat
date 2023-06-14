@echo off

REM Automatically build all Analogue Pocket examples in this directory.

for /d %%i in (.\*) do (
	pushd "%%i"
	.\compile.bat
	popd
)
