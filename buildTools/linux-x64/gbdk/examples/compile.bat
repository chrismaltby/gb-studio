@echo off

REM Automatically build all GBDK-2020 examples.

for /d %%i in (.\*) do (
	pushd "%%i"
	.\compile.bat
	popd
)
