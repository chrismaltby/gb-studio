# GBSPack

Copyright (c) 2020 Chris Maltby, released under the [MIT license](https://opensource.org/licenses/MIT).

GBSPack is a command line tool used to pack GBDK2020 data files created by GB Studio into chunks that will fit in Game Boy ROM banks.

It is intended to be used after compiling all object files in a GBDK project but before linking allowing you to automatically distribute data between banks.

## Usage

```bash
gbspack -b 6 scene5_init.o scene6_init.o etc...
```

## Options

- `--bank` Set the initial bank to pack code into (default 1)

- `--output` Set the output path to write modified object files (defaults to updating in place)

- `--ext` Set the output file extension (default "o")

- `--print-max` Print maximum bank number with allocated data

- `--print-cart` Print minimum cartridge size for allocated data

- `--mbc1` Use MBC1 hardware (skip banks 0x20, 0x40 and 0x60)

- `--filter` Only repack files from specified bank (default repack all banks)

- `--additional` Reserve N additional banks at end of cart for batteryless saving (default 0)

## Input files

Input object files must be in the following format

**script5_init.o**
```
XL3
H 2 areas 5 global symbols
S ___bank_script5_init Def0000FF
S .__.ABS. Def000000
S _Tiles Ref000000
S ___bank_Tiles Ref000000
A _CODE size 0 flags 0 addr 0
A _CODE_255 size 12 flags 0 addr 0
S _script5_init Def000000
T 00 00 00
...
```

will create files identical except with the bank number updated

**output/script5_init.o**
```
XL3
H 2 areas 5 global symbols
S ___bank_script5_init Def000008
S .__.ABS. Def000000
S _Tiles Ref000000
S ___bank_Tiles Ref000000
A _CODE size 0 flags 0 addr 0
A _CODE_8 size 12 flags 0 addr 0
S _script5_init Def000000
T 00 00 00
...
```

`S ___bank_script5_init Def0000FF` becomes `S ___bank_script5_init Def000008`  
`A _CODE_255 size 12 flags 0 addr 0` becomes `A _CODE_8 size 12 flags 0 addr 0`

### Important

Input files must contain a line with `A _CODE_{bank} size {hexSize}` (where bank will be 255 for GB Studio output)

If a definition is included in the format `S ___bank_{filename} Def0000{hexBank}` it will be updated to replace the original bank with the packed bank number, this will allow constructing a far_ptr to access this data without knowing at ahead of time where the data will be placed. If the value of {hexBank} and {bank} don't match up this line will not be updated.

e.g the if file `scene10.o` contains the line `S ___bank_scene10 Def0000FF` and was stored in bank 255 originally, if packed into bank 8 the value will be updated to `S ___bank_scene10 Def000008`.

## Build from source

Install [Rustup](https://www.rust-lang.org/tools/install)

```
cargo build --release
./target/release/gbspack --version
```
