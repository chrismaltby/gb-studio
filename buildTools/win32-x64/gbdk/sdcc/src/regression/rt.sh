# test Script

USAGE="Usage: `basename $0` BASENAME"

if [ $# -lt 1 ] ; then
  echo "$USAGE"
  exit 1
fi

# compile
../../bin/sdcc -c -mpic14 $1.c
gpasm -c  -I /usr/local/share/gpasm/header $1.asm
./create_stc $1.cod $1.stc
./simulate $1.stc garbage.log
cat garbage.log
rm garbage.log