# Deleting all files created by building the program
# --------------------------------------------------
clean:
	rm -f *core *[%~] *.[oa]
	rm -f .[a-z]*~
	rm -f $(PRJDIR)/link-z80 link-z80
	rm -f *.dep
	rm -rf obj

# Deleting all files created by configuring or building the program
# -----------------------------------------------------------------
distclean: clean


# Like clean but some files may still exist
# -----------------------------------------
mostlyclean: clean

# Deleting everything that can reconstructed by this Makefile. It deletes
# everything deleted by distclean plus files created by bison, etc.
# -----------------------------------------------------------------------
realclean: distclean
