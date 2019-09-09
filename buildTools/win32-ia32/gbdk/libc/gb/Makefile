# GB specific Makefile

TOPDIR = ../..

include $(TOPDIR)/Makefile.common

THIS = gb
OBJ =	cgb.o cpy_data.o drawing.o f_ibm_sh.o \
	f_italic.o f_min.o f_spect.o get_bk_t.o get_data.o \
	get_prop.o get_spr.o get_wi_t.o get_xy_t.o global.o \
	hiramcpy.o ibmfixed.o init_tt.o input.o mv_bkg.o \
	mv_spr.o mv_win.o pad.o sample.o \
	scroll_b.o scroll_s.o scroll_w.o serial.o set_bk_t.o \
	set_data.o set_prop.o set_spr.o set_wi_t.o set_xy_t.o \
	sgb.o font.o delay.o \
	gprint.o gprintf.o gprintn.o gprintln.o digits.o \
	rand.o arand.o 
ifeq ($(ASM),asxxxx)
OBJ +=	sfr.o
endif
ifeq ($(ASM),rgbds)
OBJ +=	stubs.o
endif

CRT0 =	crt0.o

AS = $(AS_GBZ80)

include ../Makefile.platform

#OBJ = 	crt0.o putchar.o font.o ibmfixed.o drawing.o init_tt.o \
#	cpy_data.o
