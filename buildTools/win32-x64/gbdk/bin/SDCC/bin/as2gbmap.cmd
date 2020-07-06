@setlocal enabledelayedexpansion && python -x "%~f0" %* & exit /b !ERRORLEVEL!
#!/usr/bin/env python

# as2gbmap - asxxxx to gb map file converter
#
# Copyright (c) 2010 Borut Razem
#
# This file is part of sdcc.
#
#  This software is provided 'as-is', without any express or implied
#  warranty.  In no event will the authors be held liable for any damages
#  arising from the use of this software.
#
#  Permission is granted to anyone to use this software for any purpose,
#  including commercial applications, and to alter it and redistribute it
#  freely, subject to the following restrictions:
#
#  1. The origin of this software must not be misrepresented; you must not
#     claim that you wrote the original software. If you use this software
#     in a product, an acknowledgment in the product documentation would be
#     appreciated but is not required.
#  2. Altered source versions must be plainly marked as such, and must not be
#     misrepresented as being the original software.
#  3. This notice may not be removed or altered from any source distribution.
#
#  Borut Razem
#  borut.razem@siol.net

from __future__ import print_function

import sys
import os
import re
from optparse import OptionParser
import operator

def main():
    '''asxxxx to gb map file converter'''
    usage = "usage: %prog [options] [<input_asxxxx_map_file> [<output_gb_file>]]"
    parser = OptionParser(usage = usage, version = "1.0")
    parser.set_defaults(no_gmb = False)
    parser.add_option("-j", "--no$gmb", action = "store_true", dest = "no_gmb", help = "generate no$gmb symbol file (default: rrgb)")
    (options, args) = parser.parse_args()

    if len(args) > 0 and args[0] != "-":
        try:
            fin = open(args[0], "r")
        except IOError as xxx_todo_changeme:
            (errno, strerror) = xxx_todo_changeme.args
            print("%s: can't open %s: %s" % (os.path.basename(sys.argv[0]), args[0], strerror), file=sys.stderr)
            return 1
    else:
        fin = sys.stdin

    if len(args) > 1 and args[1] != "-":
        try:
            fout = open(args[1], "w")
        except IOError as xxx_todo_changeme1:
            (errno, strerror) = xxx_todo_changeme1.args
            print("%s: can't create %s: %s" % (os.path.basename(sys.argv[1]), args[1], strerror), file=sys.stderr)
            return 1
    else:
        fout = sys.stdout;

    areas = []
    modules = []
    libraries = []
    ubads = []

    radix = 'HEX'
    state = None
    area = None
    
    # process asxxxx map file
    for line in fin:
        if re.match(r"^Hexadecimal$", line):
            radix = 'HEX';
            continue

        if re.match(r"^Area +Addr +Size +Decimal +Bytes +\(Attributes\)$", line):
            line = next(fin)
            if re.match(r"^[- ]+$", line):
                line = next(fin)
                m = re.match(r"^([^ ]+) +([0-9A-Fa-f]{4}) +([0-9A-Fa-f]{4}) += +\d+\. +\w+ +\(([^\)]+)\)$", line)
                if m:
                    if area:
                        if m.group(1) != area['area']:
                            areas.append(area)
                            area = {'area': m.group(1), 'radix': radix, 'base': int(m.group(2), 16), 'size': int(m.group(3), 16), 'attrib': m.group(4).replace(',', ' '), 'globals': []}
                    else:
                        area = {'area': m.group(1), 'radix': radix, 'base': int(m.group(2), 16), 'size': int(m.group(3), 16), 'attrib': m.group(4).replace(',', ' '), 'globals': []}
                    state = 'IN_AREA'
            continue

        m = re.match(r"^ +([0-9A-Fa-f]{4}) +([^ ]+) +$", line)
        if state == 'IN_AREA' and m:
            area['globals'].append({'value': int(m.group(1), 16), 'global': m.group(2)})
            continue

        m = re.match(r"Files Linked +\[ module\(s\) \]$", line)
        if m:
            state = 'IN_MODULES'
            continue

        m = re.match(r"Libraries Linked +\[ object file \]$", line)
        if m:
            state = 'IN_LIBRARIES'
            continue

        m = re.match(r"User Base Address Definitions$", line)
        if m:
            state = 'IN_UBAD'
            continue

        m = re.match(r"^([^ ]+) +\[ ([^ ]*) \]$", line)
        if m:
            if state == 'IN_MODULES':
                modules.append({'file': m.group(1), 'name': m.group(2)})
                continue

            if state == 'IN_LIBRARIES':
                libraries.append({'library': m.group(1), 'module': m.group(2)})
                continue

        m = re.match(r"^([^ ]+) += +0x([0-9A-Fa-f]{4})$", line)
        if state == 'IN_UBAD' and m:
            ubads.append({'symbol': m.group(1), 'value': m.group(2)})
            continue

    if area:
        areas.append(area)


    if options.no_gmb:
        # generate no$gmp map file
        print('; no$gmb format .sym file', file=fout)
        print('; Generated automagically by %s' % os.path.basename(sys.argv[0]), file=fout)
        for e in areas:
            print('; Area: %s' % e['area'], file=fout)
            if e['globals']:
                e['globals'].sort(key = operator.itemgetter('value'))
                for g in e['globals']:
                   if g['global'][0:3] != 'l__':
                        if g['value'] > 0x7FFF:
                            print('00:%04X %s' % (g['value'], g['global']), file=fout)
                        else:
                            print('%02X:%04X %s' % (g['value'] // 16384, g['value'], g['global']), file=fout)
    else:
        # generate rrgb map file
        for e in areas:
            print('AREA %s' % e['area'], file=fout)
            print('\tRADIX %s' % e['radix'], file=fout)
            print('\tBASE %04X' % e['base'], file=fout)
            print('\tSIZE %04X' % e['size'], file=fout)
            print('\tATTRIB %s' % e['attrib'], file=fout)
            if e['globals']:
                e['globals'].sort(key = operator.itemgetter('value'))
                print('\tGLOBALS', file=fout)
                for g in e['globals']:
                    print('\t\t%s\t%04X' % (g['global'], g['value']), file=fout)
    
        if modules:
            print('MODULES', file=fout)
            for m in modules:
                print('\tFILE %s' % m['file'], file=fout)
                if m['name']:
                    print('\t\tNAME %s' % m['name'], file=fout)
    
        if libraries:
            print('LIBRARIES', file=fout)
            for m in libraries:
                print('\tLIBRARY %s' % m['library'], file=fout)
                print('\t\tMODULE %s' % m['module'], file=fout)
    
        if ubads:
            print('USERBASEDEF', file=fout)
            for m in ubads:
                print('\t%s = 0x%04X' % (m['symbol'], int(m['value'], 16)), file=fout)
        return 0

if __name__ == '__main__':
    sys.exit(main())
