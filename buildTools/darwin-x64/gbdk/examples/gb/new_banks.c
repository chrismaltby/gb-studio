#include <gb/gb.h>
#include <stdio.h>

// this macro is needed when using RAM banks with MBC1
#define SET_RAM_MBC1_MODE(b) \
  *(unsigned char *)0x6000 = (b)

// current_bank contains the bank and it's type ROM or RAM
volatile __sfr __at (0xFC) __current_ram_bank;
volatile __sfr __at (0xFD) __current_rom_bank;
#define SET_ROM_BANK(n) ((__current_rom_bank = (n)), SWITCH_ROM_MBC1((n)))
#define SET_RAM_BANK(n) ((__current_ram_bank = (n)), SWITCH_RAM_MBC1((n)))
#define SET_BANKS(rom, ram) \
  (SET_ROM_BANK((rom)), SET_RAM_BANK((ram)))
#define RESTORE_BANKS \
  (SWITCH_ROM_MBC1(__current_rom_bank), SWITCH_RAM_MBC1(__current_ram_bank))

// force bank switching macro
volatile __sfr __at (0xFE) __dummy_variable;
#define switch_to(x) (__dummy_variable = (char)((x)[0]), (void *)(x))

// constant in base ROM
const char const hello0[] = "hello from CODE\n";
// variable in base RAM
char data[20] = "DATA";
int  addendum0 = 1;

// constants in ROM banks

void set_ROM_bank1(void) NONBANKED __preserves_regs(b, c, d, e) { SET_ROM_BANK(1); }
void set_ROM_bank2(void) NONBANKED __preserves_regs(b, c, d, e) { SET_ROM_BANK(2); }

__addressmod set_ROM_bank1 const CODE_1;
__addressmod set_ROM_bank2 const CODE_2;

CODE_1 const char const hello1[] = "hello from CODE_1\n";
CODE_2 const char const hello2[] = "hello from CODE_2\n";

// variables in RAM banks

void set_RAM_bank1(void) NONBANKED __preserves_regs(b, c, d, e) { SET_RAM_BANK(1); }
void set_RAM_bank2(void) NONBANKED __preserves_regs(b, c, d, e) { SET_RAM_BANK(2); }

__addressmod set_RAM_bank1 DATA_1;
__addressmod set_RAM_bank2 DATA_2;

DATA_1 char hello1_ram[20];
DATA_1 int  addendum1_ram = 2;
DATA_2 char hello2_ram[20];
DATA_2 int  addendum2_ram = 4;
DATA_2 int  addendum3_ram = 8;

// define array of pointers in RAM2 to the variables that are RAM2
// there is a flaw in compiler that disallows pointers into banks to be in the other banks
// details: https://sourceforge.net/p/sdcc/bugs/2995/
DATA_2 int * DATA_2 addendum_ptr[2] = {&addendum2_ram, &addendum3_ram};

void main() {
    // we have already initialized MBC1 in MBC1_RAM_INIT.s
    
    // initially set the banks
    SET_BANKS(1, 1);

    // say hello
    for (INT8 i = 0; (hello0[i]); i++) putchar(hello0[i]);  
    for (INT8 i = 0; (hello1[i]); i++) putchar(hello1[i]);
    for (INT8 i = 0; (hello2[i]); i++) putchar(hello2[i]);

    // prepare and say hello from rom bank1 to ram bank0
    for (INT8 i = 0; (i < sizeof(hello1)); i++) hello1_ram[i] = hello1[i];
    for (INT8 i = 0; (i < 4); i++) hello1_ram[i + 11] = data[i];
    for (INT8 i = 0; (hello1_ram[i]); i++) putchar(hello1_ram[i]);

    // prepare and say hello from rom bank1 to ram bank1
    for (INT8 i = 0; (i < sizeof(hello2)); i++) hello2_ram[i] = hello2[i];
    for (INT8 i = 0; (i < 4); i++) hello2_ram[i + 11] = data[i];
    for (INT8 i = 0; (hello2_ram[i]); i++) putchar(hello2_ram[i]);

    printf("once more...\n");
    // hello again; if we access we just access, don't care
    for (INT8 i = 0; (hello0[i]); i++) putchar(hello0[i]);  
    for (INT8 i = 0; (hello1[i]); i++) putchar(hello1[i]);
    for (INT8 i = 0; (hello2[i]); i++) putchar(hello2[i]);
    for (INT8 i = 0; (hello1_ram[i]); i++) putchar(hello1_ram[i]);
    for (INT8 i = 0; (hello2_ram[i]); i++) putchar(hello2_ram[i]);

    printf("once more...\n");
    // if we need an address, then we use a macro switch_to()
    printf("%s", hello0);
    printf("%s", switch_to(hello1));    
    printf("%s", switch_to(hello2));
    printf("%s", switch_to(hello1_ram));
    printf("%s", switch_to(hello2_ram));

    printf("1+2+4+8=0x%x", (int)(addendum0 + addendum1_ram + (*addendum_ptr[0]) + (*addendum_ptr[1])));

    // stop
    while(1);
}
