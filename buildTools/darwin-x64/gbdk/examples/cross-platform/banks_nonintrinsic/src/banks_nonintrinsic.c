#include <gbdk/platform.h>
#include <stdint.h>
#include <stdio.h>

// force bank switching macro
uint8_t __dummy_variable;
#define switch_to(x) (__dummy_variable = (char)((x)[0]), (void *)(x))

uint8_t _current_ram_bank = 0;
#define SWITCH_RAM_BANK(x) (_current_ram_bank = (SWITCH_RAM(x), (x)))

// constant in base ROM
const char const hello0[] = "hello from CODE\n";
// variable in base RAM
char data[20] = "DATA";
int  addendum0 = 1;

// constants in ROM banks

void set_ROM_bank1(void) NONBANKED { SWITCH_ROM(1); }
void set_ROM_bank2(void) NONBANKED { SWITCH_ROM(2); }

__addressmod set_ROM_bank1 const CODE_1;
__addressmod set_ROM_bank2 const CODE_2;

CODE_1 const char hello1[] = "hello from CODE_1\n";
CODE_2 const char hello2[] = "hello from CODE_2\n";

// variables in RAM banks

void set_RAM_bank1(void) NONBANKED { SWITCH_RAM_BANK(0); }
void set_RAM_bank2(void) NONBANKED { SWITCH_RAM_BANK(1); }

__addressmod set_RAM_bank1 DATA_0;
__addressmod set_RAM_bank2 DATA_1;

DATA_0 char hello1_ram[20];
DATA_0 int  addendum1_ram;
DATA_1 char hello2_ram[20];
DATA_1 int  addendum2_ram;
DATA_1 int  addendum3_ram;

// define array of pointers in RAM2 to the variables that are RAM2
// there is a flaw in compiler that disallows pointers into banks to be in the other banks
// details: https://sourceforge.net/p/sdcc/bugs/2995/
DATA_0 int * const CODE_1 addendum_ptr[2] = {&addendum2_ram, &addendum3_ram};

void main() {
    ENABLE_RAM;

    addendum1_ram = 2;
    addendum2_ram = 4;
    addendum3_ram = 8;

    // say hello
    for (int8_t i = 0; (hello0[i]); i++) putchar(hello0[i]);  
    for (int8_t i = 0; (hello1[i]); i++) putchar(hello1[i]);
    for (int8_t i = 0; (hello2[i]); i++) putchar(hello2[i]);

    // prepare and say hello from rom bank1 to ram bank0
    for (int8_t i = 0; (i < sizeof(hello1)); i++) hello1_ram[i] = hello1[i];
    for (int8_t i = 0; (i < 4); i++) hello1_ram[i + 11] = data[i];
    for (int8_t i = 0; (hello1_ram[i]); i++) putchar(hello1_ram[i]);

    // prepare and say hello from rom bank1 to ram bank1
    for (int8_t i = 0; (i < sizeof(hello2)); i++) hello2_ram[i] = hello2[i];
    for (int8_t i = 0; (i < 4); i++) hello2_ram[i + 11] = data[i];
    for (int8_t i = 0; (hello2_ram[i]); i++) putchar(hello2_ram[i]);

    printf("once more...\n");
    // hello again; if we access we just access, don't care
    for (int8_t i = 0; (hello0[i]); i++) putchar(hello0[i]);  
    for (int8_t i = 0; (hello1[i]); i++) putchar(hello1[i]);
    for (int8_t i = 0; (hello2[i]); i++) putchar(hello2[i]);
    for (int8_t i = 0; (hello1_ram[i]); i++) putchar(hello1_ram[i]);
    for (int8_t i = 0; (hello2_ram[i]); i++) putchar(hello2_ram[i]);

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
