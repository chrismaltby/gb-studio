
# Example of how to use a linkerfile

A linkerfile allows storing all the object files to be linked in a
file which is passed to the linker instead of a list of filenames on
the command line. This may be useful if your project has filenames 
that use up more length than will fit on the command line for Windows
(8191 chars max).

The typical extension for the linkerfile is ".lk". 

It is passed to sdldgb through lcc using `-Wl-f<pathtolinkerfile>`
If calling sdldgb directly, use `-f<pathtolinkerfile>`

The Makefile is configured to store all the compiled ".o" object files 
into `obj/linkerfile.lk`.


