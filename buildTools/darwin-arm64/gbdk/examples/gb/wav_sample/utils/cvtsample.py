#!/usr/bin/env python3
import sys
import wave

def main(argv=None):
    argv = argv or sys.argv
    if len(argv) < 2:
        print("cvtsample.py: no filename; try cvtsample.py --help")
        sys.exit(1)
    infilename = argv[1]
    ident = argv[2] if len(argv) > 2 else "sample"
    fmt = argv[3].upper() if len(argv) > 3 else "C"
    if infilename in ('--help', '-h'):
        print("usage: cvtsample.py SOURCE [IDENTIFIER] [FMT]")
        return

    if (fmt == "C"):
        sHDR = "const UINT8 {:s}[] = {{\n"
        sFOOT = "};\n"
        sEMIT = "0x{:x}"
        sNEW = ",\n"
        sNONEW = ","
    elif (fmt == "ASM"):
        sHDR = "{:s}::"
        sFOOT = ""
        sEMIT = "${:x}"
        sNEW = "\n"
        sNONEW = ","

    with wave.open(infilename, mode="rb") as f:
        p = f.getparams()        
        if (p.nchannels == 1) and (p.sampwidth == 1) and (p.framerate >= 8000) and (p.framerate <= 8192) and (p.comptype == 'NONE'):
            data = f.readframes(p.nframes)
            c = 0
            cnt = 0;
            flag = False
            sys.stdout.write(sHDR.format(ident))
            for i in range(len(data) - len(data) % 32):
                c = ((c << 4) | (data[i] >> 4)) & 0xFF
                if flag:
                    sys.stdout.write(sEMIT.format(c))
                    cnt += 1
                    sys.stdout.write(sNEW if (cnt % 16 == 0) else sNONEW)
                        
                flag = not flag
            sys.stdout.write(sFOOT)
            sys.stdout.flush()
        else:
            sys.stderr.write("ERROR: Invalid wav file format\n")
            sys.stderr.write("Requires - nChannels: 1, sampWidth: 1, rate: 8000 - 8192, compType: NONE\n")
            sys.stderr.write("Found    - nChannels: %d, sampWidth: %d, rate: %d, compType: %s\n" % (p.nchannels, p.sampwidth, p.framerate, p.comptype))
            sys.stderr.flush()

if __name__=='__main__':
    main()
