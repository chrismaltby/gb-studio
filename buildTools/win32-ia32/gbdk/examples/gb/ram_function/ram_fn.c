#include <gb/gb.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

uint16_t counter = 0;

// inc() must be a relocatable function, be careful!
void inc() {
    counter++;
}
// dummy function, needed to calculate inc() size, must be after it
void inc_end() {} 

// calculate the distance between objects 
#define object_distance(a, b) ((void *)&(b) - (void *)&(a))

// variables at an absolute addresses which are defined by passing parameters to compiler
unsigned char __at _inc_ram   ram_buffer[];
unsigned char __at _inc_hiram hiram_buffer[];

// those are function pointer variables, we can initialize them right here
typedef void (*inc_t)(void);
inc_t inc_ram_var   = (inc_t)ram_buffer;
inc_t inc_hiram_var = (inc_t)hiram_buffer;

// those are defined by passing parameters to the linker, they must be located at the same 
// addresses where ram_buffer and hiram_buffer are located
extern void inc_ram();
extern void inc_hiram();

void print_counter() {
    printf(" Counter is %u\n", counter);
}

void main() {
    // copy inc() function to it's new destinations: hiram_buffer and ram_buffer
    hiramcpy((uint8_t)&hiram_buffer, (void *)&inc, (uint8_t)object_distance(inc, inc_end));
    memcpy(&ram_buffer, (void *)&inc, (uint16_t)object_distance(inc, inc_end));

    // print initial counter state
    puts("Program Start...");
    print_counter();

    // Call function in ROM
    puts("Call ROM");
    inc();
    print_counter();

    // Call function in RAM using link-time address
    puts("Call RAM direct");
    inc_ram();
    print_counter();

    // Call function in RAM using pointer-to-function variable
    puts("Call RAM indirect");
    inc_ram_var();
    print_counter();

    // Call function in HIRAM using link-time address
    puts("Call HIRAM direct");
    inc_hiram();
    print_counter();

    // Call function in HIRAM using pointer-to-function variable
    puts("Call HIRAM indirect");
    inc_hiram_var();
    print_counter();

    puts("The End...");
}
