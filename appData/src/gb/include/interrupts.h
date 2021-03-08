#ifndef INTERRUPTS_H_INCLUDE
#define INTERRUPTS_H_INCLUDE

void simple_LCD_isr();
void fullscreen_LCD_isr();

void VBL_isr();

void remove_LCD_ISRs();

#endif