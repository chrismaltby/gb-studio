        .OS_RESET       = 0x0000
        .LS_IO          = 0x0003
        .LS_DSK         = 0x0004
        .LS_INT_VECTOR  = 0x0038
        .LS_FCB0        = 0x005C
        .LS_FCB1        = 0x006C
        .LS_FILE_BUFFER = 0x0080
        .BDOS           = 0x0005

        .EXTBIO         = 0xFFCA

        ; MSX-DOS 1
        _TERM0          = 0x00  ; Program terminate
        _CONIN          = 0x01  ; Console input
        _CONOUT         = 0x02  ; Console output
        _AUXIN          = 0x03  ; Auxiliary input
        _AUXOUT         = 0x04  ; Auxiliary output
        _LSTOUT         = 0x05  ; Printer output
        _DIRIO          = 0x06  ; Direct console I/O
        _DIRIN          = 0x07  ; Direct console input
        _INNOE          = 0x08  ; Console input without echo
        _STROUT         = 0x09  ; String output
        _BUFIN          = 0x0A  ; Buffered line input
        _CONST          = 0x0B  ; Console status
        _CPMVER         = 0x0C  ; Return version number
        _DSKRST         = 0x0D  ; Disk reset
        _SELDSK         = 0x0E  ; Select disk
        _FOPEN          = 0x0F  ; Open file (FCB)
        _FCLOSE         = 0x10  ; Close file (FCB)
        _SFIRST         = 0x11  ; Search for first entry (FCB)
        _SNEXT          = 0x12  ; Search for next entry (FCB)
        _FDEL           = 0x13  ; Delete file (FCB)
        _RDSEQ          = 0x14  ; Sequential read (FCB)
        _WRSEQ          = 0x15  ; Sequential write (FCB)
        _FMAKE          = 0x16  ; Create file (FCB)
        _FREN           = 0x17  ; Rename file (FCB)
        _LOGIN          = 0x18  ; Get login vector
        _CURDRV         = 0x19  ; Get current drive
        _SETDTA         = 0x1A  ; Set disk transfer address
        _ALLOC          = 0x1B  ; Get allocation information
        _RDRND          = 0x21  ; Random read (FCB)
        _WRRND          = 0x22  ; Random write (FCB)
        _FSIZE          = 0x23  ; Get file size (FCB)
        _SETRND         = 0x24  ; Set random record (FCB)
        _WRBLK          = 0x26  ; Random block write (FCB)
        _RDBLK          = 0x27  ; Random block read (FCB)
        _WRZER          = 0x28  ; Random write with zero fill (FCB)
        _GDATE          = 0x2A  ; Get date
        _SDATE          = 0x2B  ; Set date
        _GTIME          = 0x2C  ; Get time
        _STIME          = 0x2D  ; Set time
        _VERIFY         = 0x2E  ; Set/reset verify flag
        _RDABS          = 0x2F  ; Absolute sector read
        _WRABS          = 0x30  ; Absolute sector write

        ; MSX-DOS2
        _DPARM          = 0x31  ; Get disk parameters
        _FFIRST         = 0x40  ; Find first entry
        _FNEXT          = 0x41  ; Find next entry
        _FNEW           = 0x42  ; Find new entry
        _OPEN           = 0x43  ; Open file handle
        _CREATE         = 0x44  ; Create file handle
        _CLOSE          = 0x45  ; Close file handle
        _ENSURE         = 0x46  ; Ensure file handle
        _DUP            = 0x47  ; Duplicate file handle
        _READ           = 0x48  ; Read from file handle
        _WRITE          = 0x49  ; Write to file handle
        _SEEK           = 0x4A  ; Move file handle pointer
        _IOCTL          = 0x4B  ; I/O control for devices
        _HTEST          = 0x4C  ; Test file handle
        _DELETE         = 0x4D  ; Delete file or subdirectory
        _RENAME         = 0x4E  ; Rename file or subdirectory
        _MOVE           = 0x4F  ; Move file or subdirectory
        _ATTR           = 0x50  ; Get/set file attributes
        _FTIME          = 0x51  ; Get/set file date and time
        _HDELETE        = 0x52  ; Delete file handle
        _HRENAME        = 0x53  ; Rename file handle
        _HMOVE          = 0x54  ; Move file handle
        _HATTR          = 0x55  ; Get/set file handle attributes
        _HFTIME         = 0x56  ; Get/set file handle date and time
        _GETDTA         = 0x57  ; Get disk transfer address
        _GETVFY         = 0x58  ; Get verify flag setting
        _GETCD          = 0x59  ; Get current directory
        _CHDIR          = 0x5A  ; Change current directory
        _PARSE          = 0x5B  ; Parse pathname
        _PFILE          = 0x5C  ; Parse filename
        _CHKCHR         = 0x5D  ; Check character
        _WPATH          = 0x5E  ; Get whole path string
        _FLUSH          = 0x5F  ; Flush disk buffers
        _FORK           = 0x60  ; Fork a child process
        _JOIN           = 0x61  ; Rejoin parent process
        _TERM           = 0x62  ; Terminate with error code
        _DEFAB          = 0x63  ; Define abort exit routine
        _DEFER          = 0x64  ; Define disk error handler routine
        _ERROR          = 0x65  ; Get previous error code
        _EXPLAIN        = 0x66  ; Explain error code
        _FORMAT         = 0x67  ; Format a disk
        _RAMD           = 0x68  ; Create or destroy RAM disk
        _BUFFER         = 0x69  ; Allocate sector buffers
        _ASSIGN         = 0x6A  ; Logical drive assignment
        _GENV           = 0x6B  ; Get environment item
        _SENV           = 0x6C  ; Set environment item
        _FENV           = 0x6D  ; Find environment item
        _DSKCHK         = 0x6E  ; Get/set disk check status
        _DOSVER         = 0x6F  ; Get MSX-DOS version number
        _REDIR          = 0x70  ; Get/set redirection status

        ; MSX_DOS ERROR CODES
        .NCOMP          = 0xFF  ; Incompatible disk
        .WRERR          = 0xFE  ; Write error
        .DISK           = 0xFD  ; Disk error
        .NRDY           = 0xFC  ; Not ready
        .VERFY          = 0xFB  ; Verify error
        .DATA           = 0xFA  ; Data error
        .RNF            = 0xF9  ; Sector not found
        .WPROT          = 0xF8  ; Write protected disk
        .UFORM          = 0xF7  ; Unformatted disk
        .NDOS           = 0xF6  ; Not a DOS disk
        .WDISK          = 0xF5  ; Wrong disk
        .WFILE          = 0xF4  ; Wrong disk for file
        .SEEK           = 0xF3  ; Seek error
        .IFAT           = 0xF2  ; Bad file allocation table
        .NOUPB          = 0xF1  ; --
        .IFORM          = 0xF0  ; Cannot format this drive
        .INTER          = 0xDF  ; Internal error
        .NORAM          = 0xDE  ; Not enough memory
        .IBDOS          = 0xDC  ; Invalid MSX-DOS call
        .IDRV           = 0xDB  ; Invalid drive
        .IFNM           = 0xDA  ; Invalid filename
        .IPATH          = 0xD9  ; Invalid pathname
        .PLONG          = 0xD8  ; Pathname too long
        .NOFIL          = 0xD7  ; File not found
        .NODIR          = 0xD6  ; Directory not found
        .DRFUL          = 0xD5  ; Root directory full
        .DKFUL          = 0xD4  ; Disk full
        .DUPF           = 0xD3  ; Duplicate filename
        .DIRE           = 0xD2  ; Invalid directory move
        .FILRO          = 0xD1  ; Read only file
        .DIRNE          = 0xD0  ; Directory not empty
        .IATTR          = 0xCF  ; Invalid attributes
        .DOT            = 0xCE  ; Invalid . or .. operation
        .SYSX           = 0xCD  ; System file exists
        .DIRX           = 0xCC  ; Directory exists
        .FILEX          = 0xCB  ; File exists
        .FOPEN          = 0xCA  ; File already in use
        .OV64K          = 0xC9  ; Cannot transfer above 64K
        .FILE           = 0xC8  ; File allocation error
        .EOF            = 0xC7  ; End of file
        .ACCV           = 0xC6  ; File access violation
        .IPROC          = 0xC5  ; Invalid process id
        .NHAND          = 0xC4  ; No spare file handles
        .IHAND          = 0xC3  ; Invalid file handle
        .NOPEN          = 0xC2  ; File handle not open
        .IDEV           = 0xC1  ; Invalid device operation
        .IENV           = 0xC0  ; Invalid environment string
        .ELONG          = 0xBF  ; Environment string too long
        .IDATE          = 0xBE  ; Invalid date
        .ITIME          = 0xBD  ; Invalid time
        .RAMDX          = 0xBC  ; RAM disk (drive H ) already exists
        .NRAMD          = 0xBB  ; RAM disk does not exist
        .HDEAD          = 0xBA  ; File handle has been deleted
        .EOL            = 0xB9  ; Internal error. Should never occur
        .ISBFN          = 0xB8  ; Invalid sub-function number
        .STOP           = 0x9F  ; Ctrl-STOP pressed
        .CTRLC          = 0x9E  ; Ctrl-C pressed
        .ABORT          = 0x9D  ; Disk operation aborted
        .OUTERR         = 0x9C  ; Error on standard output
        .INERR          = 0x9B  ; Error on standard input
        .BADCOM         = 0x8F  ; Wrong version of COMMAND
        .BADCM          = 0x8E  ; Unrecognized command
        .BUFUL          = 0x8D  ; Command too long
        .OKCMD          = 0x8C  ; --
        .IPARM          = 0x8B  ; Invalid parameter
        .INP            = 0x8A  ; Too many parameters
        .NOPAR          = 0x89  ; Missing parameter
        .IOPT           = 0x88  ; Invalid option
        .BADNO          = 0x87  ; Invalid number
        .NOHELP         = 0x86  ; File for HELP not found
        .BADVER         = 0x85  ; Wrong version of MSX-DOS
        .NOCAT          = 0x84  ; Cannot concatenate destination file
        .BADEST         = 0x83  ; Cannot create destination file
        .COPY           = 0x82  ; File cannot be copied onto itself
        .OVDEST         = 0x81  ; Cannot overwrite previous destination file

        .VDP_VRAM       = 0x4000
        .VDP_TILEDATA0  = 0x4000
        .VDP_TILEDATA1  = 0x4800
        .VDP_TILEDATA2  = 0x5000
        .VDP_COLORDATA0 = 0x6000
        .VDP_COLORDATA1 = 0x6800
        .VDP_COLORDATA2 = 0x7000

        .VDP_SPRDATA0   = 0x7800

        .VDP_TILEMAP    = 0x5C00
        .VDP_CRAM       = 0xC000
        .VDP_SAT        = 0x5B00

        .VDP_SAT_TERM   = 0xD0

        .VDP_VCOUNTER   = 0x7E
        .VDP_PSG        = 0x7F
        .VDP_HCOUNTER   = 0x7F

        .VDP_DATA       = 0x98
        .VDP_CMD        = 0x99
        .VDP_STAT       = 0x99

        .STATF_INT_VBL  = 0b10000000
        .STATF_9_SPR    = 0b01000000
        .STATF_SPR_COLL = 0b00100000

        .VDP_REG_MASK   = 0b10000000
        .VDP_R0         = 0b10000000

        .R0_DEFAULT     = 0b00000000
        .R0_CB_OUTPUT   = 0b00000000
        .R0_CB_INPUT    = 0b01000000
        .R0_IE2_OFF     = 0b00000000
        .R0_IE2         = 0b00100000
        .R0_IE1_OFF     = 0b00000000
        .R0_IE1         = 0b00010000
        .R0_SCR_MODE1   = 0b00000000
        .R0_SCR_MODE2   = 0b00000010
        .R0_ES_OFF      = 0b00000000
        .R0_ES          = 0b00000001

        .VDP_R1         = 0b10000001

        .R1_DEFAULT     = 0b10000000
        .R1_DISP_OFF    = 0b00000000
        .R1_DISP_ON     = 0b01000000
        .R1_IE_OFF      = 0b00000000
        .R1_IE          = 0b00100000
        .R1_SCR_MODE1   = 0b00010000
        .R1_SCR_MODE2   = 0b00000000
        .R1_SCR_MODE3   = 0b00000000
        .R1_SPR_8X8     = 0b00000000
        .R1_SPR_16X16   = 0b00000010
        .R1_SPR_MAG     = 0b00000001
        .R1_SPR_MAG_OFF = 0b00000000

        .VDP_R2         = 0b10000010

        .R2_MAP_0x1C00  = 0x07

        .VDP_R3         = 0b10000011
        .VDP_R4         = 0b10000100
        .VDP_R5         = 0b10000101

        .R5_SAT_0x1B00  = 0x36
        .R5_SAT_MASK    = 0b10000001

        .VDP_R6         = 0b10000110

        .VDP_R7         = 0b10000111
        .VDP_RBORDER    = 0b10000111

        .R7_COLOR_MASK  = 0b11110000

        .VDP_R8         = 0b10001000

        .VDP_R9         = 0b10001001

        .VDP_R10        = 0b10001010

        .JOYPAD_COUNT   = 1

        .UP             = 0b00100000
        .DOWN           = 0b01000000
        .LEFT           = 0b00010000
        .RIGHT          = 0b10000000
        .A              = 0b00000001
        .B              = 0b00000100
        .SELECT         = 0b00001000
        .START          = 0b00000010

        .KBD_SELECT_ROW = 0xAA
        .KBD_INPUT      = 0xA9

        .FMADDRESS      = 0xF0
        .FMDATA         = 0xF1
        .AUDIOCTRL      = 0xF2

        .MAP_FRAME0     = 0xfffc
        .MAP_FRAME1     = 0xfffd
        .MAP_FRAME2     = 0xfffe
        .MAP_FRAME3     = 0xffff

        .SYSTEM_NTSC    = 0x00
        .SYSTEM_PAL     = 0x01

        .CPU_CLOCK      = 3579545

        ;; GBDK library screen modes

        .T_MODE         = 0x02  ; Text mode (bit 2)
        .T_MODE_OUT     = 0x02  ; Text mode output only
        .T_MODE_INOUT   = 0x03  ; Text mode with input
        .M_NO_SCROLL    = 0x04  ; Disables scrolling of the screen in text mode
        .M_NO_INTERP    = 0x08  ; Disables special character interpretation

        ;; Screen dimentions in tiles

        .SCREEN_X_OFS   = 0
        .SCREEN_Y_OFS   = 0
        .SCREEN_WIDTH   = 32
        .SCREEN_HEIGHT  = 24
        .VDP_MAP_HEIGHT = 24
        .VDP_MAP_WIDTH  = 32

        ;; Interrupt flags

        .VBL_IFLAG      = 0x01
        .LCD_IFLAG      = 0x02

        ; characters
        .CR             = 0x0A
        .SPACE          = 0x00

        ;; C related
        ;; Overheap of a banked call.  Used for parameters
        ;;  = ret + real ret + bank

        .BANKOV         = 5

        ;; Main user routine
        .globl  _main

        ;; interrupt handler
        .globl _INT_ISR

        ;; Macro definitions

.macro CALL_BDOS fn
        ld c, fn
        call .BDOS
.endm

.macro JP_BDOS fn
        ld c, fn
        jp .BDOS
.endm

.macro VDP_WRITE_DATA regH regL
        ld a, regL
        out (#.VDP_DATA), a
        ld a, regH
        inc hl
        dec hl
        out (#.VDP_DATA), a
.endm

.macro VDP_WRITE_CMD regH regL
        ld a, regL
        di
        out (#.VDP_CMD), a
        ld a, regH
        ei
        out (#.VDP_CMD), a
.endm

.macro VDP_DELAY ?lbl
        nop
        jr lbl
lbl:
.endm

.macro VDP_CANCEL_INT
        in a, (.VDP_STAT)       ; cancel pending VDP interrupts
.endm

.macro WRITE_VDP_CMD_HL
        MSX_WRITE_VDP_CMD h, l
.endm

.macro WRITE_VDP_DATA_HL
        MSX_WRITE_VDP_DATA h, l
.endm

.macro CALL_HL
        call ___sdcc_call_hl
.endm

.macro DISABLE_VBLANK_COPY
        ld hl, #__shadow_OAM_OFF
        inc (hl)
.endm

.macro ENABLE_VBLANK_COPY
        ld hl, #__shadow_OAM_OFF
        dec (hl)
.endm

.macro ADD_A_REG16 regH regL
        add regL
        ld regL, a
        adc regH
        sub regL
        ld regH, a
.endm

.macro MUL_DE_BY_A_RET_HL ?lbl1 ?lbl2
        ; Multiply DE by A, return result in HL; preserves: BC
        ld hl, #0
lbl1:
        srl a
        jp nc, lbl2
        add hl, de
lbl2:
        sla e
        rl d
        or a
        jp nz, lbl1
.endm

.macro DIV_PART divident divisor ?lbl
        rl divident
        rla
        sub divisor
        jr  nc, lbl
        add divisor
lbl:
.endm
.macro FAST_DIV8 divident divisor
        ; returns modulus in A
        .rept 8
                DIV_PART divident divisor
        .endm
        ld a, divident
        cpl
.endm
.macro FAST_MOD8 divident divisor
        ; returns modulus in A
        .rept 8
                DIV_PART divident divisor
        .endm
.endm
