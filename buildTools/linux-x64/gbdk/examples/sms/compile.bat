@echo off

REM Automatically build all Sega Master System examples in this directory.

for /d %%i in (.\*) do (
	pushd "%%i"
	.\compile.bat
	popd
)
