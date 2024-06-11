#include <gbdk/platform.h>
#include <stdint.h>
#include <stdio.h>

// force bank switching macro
uint8_t __dummy_variable;
#define switch_to(x) (__dummy_variable = (char)((x)[0]), (void *)(x))

uint8_t _current_ram_bank = 0;
#define SWITCH_RAM_BANK(x) (_current_ram_bank = (SWITCH_RAM(x), (x)))

// constant in base ROM
const char const hello_code[] = "hello from CODE\n";

// variable in base RAM
char data[20] = "DATA";
int  add_num_wram = 1;

// constants in ROM banks

void set_ROM_bank1(void) NONBANKED { SWITCH_ROM(1); }
void set_ROM_bank2(void) NONBANKED { SWITCH_ROM(2); }
__addressmod set_ROM_bank1 const CODE_1;
__addressmod set_ROM_bank2 const CODE_2;

CODE_1 const char hello_rom_1[] = "hello from CODE_1\n";
CODE_2 const char hello_rom_2[] = "hello from CODE_2\n";

// variables in RAM banks

void set_RAM_bank0(void) NONBANKED { SWITCH_RAM_BANK(0); }
void set_RAM_bank1(void) NONBANKED { SWITCH_RAM_BANK(1); }
__addressmod set_RAM_bank0 DATA_0;
__addressmod set_RAM_bank1 DATA_1;

// Variables in SRAM Bank 0
DATA_0 char hello_sram_0[20];
DATA_0 int  add_num_sram_0;

// Variables in SRAM Bank 1
DATA_1 char hello_sram_1[20];
DATA_1 int  add_num_sram_1a;
DATA_1 int  add_num_sram_1b;

// define array of pointers in RAM1 to the variables that are RAM2
// there is a flaw in compiler that disallows pointers into banks to be in the other banks
// details: https://sourceforge.net/p/sdcc/bugs/2995/
DATA_1 int * const CODE_1 add_num__ptr[2] = {&add_num_sram_1a, &add_num_sram_1b};

void main(void) {
    ENABLE_RAM;

    add_num_sram_0 = 2;
    add_num_sram_1a = 4;
    add_num_sram_1b = 8;

    // say hello
    for (int8_t i = 0; (hello_code[i]); i++) putchar(hello_code[i]);
    for (int8_t i = 0; (hello_rom_1[i]); i++) putchar(hello_rom_1[i]);
    for (int8_t i = 0; (hello_rom_2[i]); i++) putchar(hello_rom_2[i]);

    // prepare and say hello from rom bank1 to sram bank0
    for (int8_t i = 0; (i < sizeof(hello_rom_1)); i++) hello_sram_0[i] = hello_rom_1[i];
    for (int8_t i = 0; (i < 4); i++) hello_sram_0[i + 11] = data[i];
    for (int8_t i = 0; (hello_sram_0[i]); i++) putchar(hello_sram_0[i]);

    // prepare and say hello from rom bank2 to sram bank1
    for (int8_t i = 0; (i < sizeof(hello_rom_2)); i++) hello_sram_1[i] = hello_rom_2[i];
    for (int8_t i = 0; (i < 4); i++) hello_sram_1[i + 11] = data[i];
    for (int8_t i = 0; (hello_sram_1[i]); i++) putchar(hello_sram_1[i]);

    printf("once more...\n");
    // say hello again; just use the vars to access them, the switching if needed is handled automatically
    for (int8_t i = 0; (hello_code[i]); i++) putchar(hello_code[i]);
    for (int8_t i = 0; (hello_rom_1[i]); i++) putchar(hello_rom_1[i]);
    for (int8_t i = 0; (hello_rom_2[i]); i++) putchar(hello_rom_2[i]);
    for (int8_t i = 0; (hello_sram_0[i]); i++) putchar(hello_sram_0[i]);
    for (int8_t i = 0; (hello_sram_1[i]); i++) putchar(hello_sram_1[i]);

    printf("once more...\n");
    // if we need an address, then we use a macro switch_to()
    printf("%s", hello_code);
    printf("%s", switch_to(hello_rom_1));
    printf("%s", switch_to(hello_rom_2));
    printf("%s", switch_to(hello_sram_0));
    printf("%s", switch_to(hello_sram_1));

    // Add the RAM variables from different address spaces together
    printf("1+2+4+8=0x%x", (int)(add_num_wram + add_num_sram_0 + (*add_num__ptr[0]) + (*add_num__ptr[1])));

    // stop
    while(1);
}
