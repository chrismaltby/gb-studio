rem DOS CVS access does not like .lnk files, so this is workaround.
copy blink_lnk blink.lnk
asx8051.exe -los blink.asm
aslink -f blink.lnk


