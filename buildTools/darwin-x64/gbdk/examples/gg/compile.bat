@echo off

REM Automatically build all Game Gear examples in this directory.

for /d %%i in (.\*) do (
	pushd "%%i"
	.\compile.bat
	popd
)
