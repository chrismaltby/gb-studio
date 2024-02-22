#!/usr/bin/env python3
import sys
import wave
from pathlib import Path
from optparse import OptionParser

def main(argv=None):
    parser = OptionParser("Usage: cvtsamplesms.py [options] INPUT_FILE_NAME.WAV")
    parser.add_option("-o", '--out',        dest='outfilename',                                      help='output file name')
    parser.add_option("-i", '--identifier', dest='identifier',                                       help='source identifier')

    parser.add_option("-b", '--bank',       dest='bank',        default="255",                       help='BANK number (default AUTO=255)')    

    (options, args) = parser.parse_args()

    if (len(args) == 0):
        parser.print_help()
        parser.error("Input file name required\n")
    
    infilename = Path(args[0])
    
    if options.outfilename == None:
        outfilename = infilename.with_suffix('.c')
    else:
        outfilename = Path(options.outfilename)
        
    if options.identifier == None:
        identifier = str(Path(infilename.name).with_suffix(''))
    else: 
        identifier = options.identifier

    sHDR    = ("#pragma bank {1:s}\n\n"
               "#include <gbdk/platform.h>\n"
               "#include <stdint.h>\n\n"
               "BANKREF({0:s})\n"
               "const uint8_t {0:s}[{2:d}] = {{\n")
    sFOOT   = "\n}};\n"
    sEMIT   = "0x{:x}"
    sNEW    = ",\n"
    sNONEW  = ","

    with wave.open(str(infilename), mode="rb") as f:
        p = f.getparams()
        if (p.nchannels == 1) and (p.sampwidth == 1) and (p.framerate >= 8000) and (p.framerate <= 8192) and (p.comptype == 'NONE'):
            data = f.readframes(p.nframes)
            c = 0
            cnt = 0;

            # output C source file
            with open(str(outfilename), "wb") as outf:                
                outf.write(bytes(sHDR.format(identifier, options.bank, len(data) - (len(data) % 16)), "ascii"))
                result = ""
                for c in data:
                    result += sEMIT.format(c)
                    cnt += 1
                    if (cnt % 16 == 0):
                        result = "{}{}".format(result, sNEW)
                        outf.write(bytes(result, "ascii"))
                        result = ""
                    else:
                        result += sNONEW
                outf.write(bytes(sFOOT.format(), "ascii"))
        else:
            print("ERROR: Invalid WAV file format")
            sys.exit(1)

        # output C header file
        if outfilename.suffix == ".c":
            with open(str(outfilename.with_suffix('.h')), "wb") as hdrf:
                hdrf.write(bytes(("#ifndef __{0:s}_INCLUDE__\n"
                                  "#define __{0:s}_INCLUDE__\n\n"
                                  "#include <gbdk/platform.h>\n"
                                  "#include <stdint.h>\n\n"
                                  "BANKREF_EXTERN({0:s})\n"
                                  "extern const uint8_t {0:s}[{2:d}];\n"
                                  "#endif\n").format(identifier, 4, len(data) - (len(data) % 16)), "ascii"))

if __name__=='__main__':
    main()