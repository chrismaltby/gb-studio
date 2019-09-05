#
sdccdir=$PWD
echo "/*-------------------------------------------------------------------------"
echo "  sdccbuild.sh - installation & build script for SDCC"
echo
echo "            Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1999)"
echo 
echo "  This program is free software; you can redistribute it and/or modify it"
echo "  under the terms of the GNU General Public License as published by the"
echo "  Free Software Foundation; either version 2, or (at your option) any"
echo "  later version."
echo   
echo "  This program is distributed in the hope that it will be useful,"
echo "  but WITHOUT ANY WARRANTY; without even the implied warranty of"
echo "  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the"
echo "  GNU General Public License for more details."
echo   
echo "  You should have received a copy of the GNU General Public License"
echo "  along with this program; if not, write to the Free Software"
echo "  Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA."
echo   
echo "  In other words, you are welcome to use, share and improve this program."
echo "  You are forbidden to forbid anyone else to use, share and improve"
echo "  what you give them.   Help stamp out software-hoarding!  "
echo "-------------------------------------------------------------------------*/"
echo
echo 
echo "This script will compile and build sdcc compiler system. Executables will"
echo "be placed in the directory '" $sdccdir"/bin' . Make sure you add this"
echo " directory to your PATH environment variable."
echo 
echo "Hit Enter to start the build process"
read junk
echo "----------------------------------------------------------" ;
echo "      Building 'gc - a conservative garbage collector'"     ;
echo "----------------------------------------------------------" ;

if test -d $sdccdir/gc; 
    then cd $sdccdir/gc ;
#	 make -f Makefile clean
    else
	echo "----------------------------------------------------------" ;
	echo "  directory " $sdccdir/gc "not found . Script terminated";
	echo "----------------------------------------------------------" ;
	exit 1;
fi

if make -f Makefile CC=gcc ;
    then
	echo "----------------------------------------------------------" ;
	echo "               gc - build successful" ;
	echo "----------------------------------------------------------" ;

    else
	echo "----------------------------------------------------------" ;    
	echo "        gc - build failed . Script terminated";
	echo "----------------------------------------------------------" ;
	exit 1;
fi

echo "----------------------------------------------------------" ;
echo "                Building 'cpp - c-preprocessor'" ;
echo "----------------------------------------------------------" ;

if test -d $sdccdir/cpp ;
    then cd $sdccdir/cpp ;
#         rm *.o ;
    else
	echo "----------------------------------------------------------" ;
	echo "  directory " $sdccdir/cpp "not found . Script terminated";
	echo "----------------------------------------------------------" ;
	exit 1;
fi        

if make -f Makefile SDCCDIR=$sdccdir; 
    then
	echo "----------------------------------------------------------" ;
	echo "               cpp - build successful" ;
	echo "----------------------------------------------------------" ;

    else
	echo "----------------------------------------------------------" ;    
	echo "        cpp - build failed . Script terminated";
	echo "----------------------------------------------------------" ;
	exit 1;
fi

echo "----------------------------------------------------------" ;
echo "               Building 'asx8051 - assembler'" ;
echo "----------------------------------------------------------" ;

if test -d $sdccdir/asxxxx ;
    then cd $sdccdir/asxxxx ;
#         rm *.o ;
    else
	echo "----------------------------------------------------------" ;
	echo "  directory " $sdccdir/asxxxx "not found . Script terminated";
	echo "----------------------------------------------------------" ;
	exit 1;
fi

if make -f Makefile.asx8051 SDCCDIR=$sdccdir ;
    then
	echo "----------------------------------------------------------" ;
	echo "               asx8051 - build successful" ;
	echo "----------------------------------------------------------" ;

    else
	echo "----------------------------------------------------------" ;    
	echo "        asx8051 - build failed . Script terminated";
	echo "----------------------------------------------------------" ;
	exit 1;
fi

echo "----------------------------------------------------------" ;
echo "           Building 'aslink - linkage editor' " ;
echo "----------------------------------------------------------" ;

if test -d $sdccdir/asxxxx ;
    then cd $sdccdir/asxxxx ;
#         rm *.o ;
    else
	echo "----------------------------------------------------------" ;
	echo "  directory " $sdccdir/asxxxx "not found . Script terminated";
	echo "----------------------------------------------------------" ;
	exit 1;
fi

if make -f Makefile.aslink SDCCDIR=$sdccdir ;
    then
	echo "----------------------------------------------------------" ;
	echo "               aslink - build successful" ;
	echo "----------------------------------------------------------" ;

    else
	echo "----------------------------------------------------------" ;    
	echo "        aslink - build failed . Script terminated";
	echo "----------------------------------------------------------" ;
	exit 1;
fi

echo "----------------------------------------------------------" ;
echo "                      Building 'sdcc' " 
echo "----------------------------------------------------------" ;

cd $sdccdir
if test `uname` = "Linux"; 
    then
	ldflag="-Wl,-defsym,_DYNAMIC=0" ;
fi

#make -f Makefile clean
if make -f Makefile SDCCDIR=$sdccdir STD_LIB="libsdcc" STD_INT_LIB="libint" STD_LONG_LIB="liblong" STD_FP_LIB="libfloat" LDXFLAGS=$ldflag
    then 
	echo "----------------------------------------------------------" ;
	echo "               sdcc - build successful" ;
	echo "----------------------------------------------------------" ;
    else
	echo "----------------------------------------------------------" ;    
	echo "        sdcc - build failed . Script terminated";
	echo "----------------------------------------------------------" ;
	exit 1;
fi

echo "----------------------------------------------------------" ;    
echo " GREAT!! now we will use SDCC to compile the support rtns"
echo "----------------------------------------------------------" ;    

echo "To compile the support routines type 'Large' or 'Small' or Control-c to quit"
read size

lowersize=`echo $size | awk '{ printf("%s", tolower($0)) }'`

cd $sdccdir/sdcc51lib

PATH_SEPARATOR=":"
if test `uname` = "MS-DOS";
    then
	PATH_SEPARATOR=";"
fi

PATH=$PATH$PATH_SEPARATOR$sdccdir/bin

if test $lowersize = "large"; 
then 
  echo "Compiling with the Large Model"
  model="--model-large"
else
  echo "Compiling with the Small Model"
  model="--model-small"
fi

for i in _*.c ; 
    do
        echo "Compiling file " $i ;
        sdcc -c $model -I$sdccdir/sdcc51inc $i ;
    done;       

echo "Compiling file malloc.c"
sdcc -c $model malloc.c

echo "Compiling file serial.c"
sdcc -c $model serial.c


echo "----------------------------------------------------------" ;    
echo "            Important Directories & files"
echo "     Header <...h> files directory  " $sdccdir"/sdcc51inc"
echo "     Library .lib  files directory  " $sdccdir"/sdcc51lib"
echo "     SDCC support libraries are :-"
echo "      " $sdccdir"/sdcc51lib/libsdcc.lib - basic support routines"
echo "      " $sdccdir"/sdcc51lib/libint.lib  - (16 bit) arithmetic "
echo "      " $sdccdir"/sdcc51lib/liblong.lib - (32 bit) arithmetic "
echo "      " $sdccdir"/sdcc51lib/libfloat.lib- floating point routines"
echo " DON'T FORGET to add " $sdccdir"/bin to your PATH environment"
echo "----------------------------------------------------------" ;    
