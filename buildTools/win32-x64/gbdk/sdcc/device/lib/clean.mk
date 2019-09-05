include incl.mk

# Deleting all files created by building the program
# --------------------------------------------------
clean:
	rm -f *core *[%~] *.[oa] *.rel *.lst *.sym *.asm *.ihx *.dump* *.cdb
	rm -f .[a-z]*~
	rm -f *.dump*
	rm -rf build
	for model in $(MODELS); do \
	  rm -rf $$model; \
	done
	make -C ds390 clean
	make -C z80 clean
	make -C gbz80 clean

# Deleting all files created by configuring or building the program
# -----------------------------------------------------------------
distclean: clean
	rm -f Makefile *.dep
	rm -f ds390/*.dep

# Like clean but some files may still exist
# -----------------------------------------
mostlyclean: clean


# Deleting everything that can reconstructed by this Makefile. It deletes
# everything deleted by distclean plus files created by bison, etc.
# -----------------------------------------------------------------------
realclean: distclean
