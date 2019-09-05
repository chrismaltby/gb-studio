# PENDING: Delegate up to the Makefile

# Deleting all files created by building the program
# --------------------------------------------------
clean:
	make clean

# Deleting all files created by configuring or building the program
# -----------------------------------------------------------------
distclean: 
	make distclean

# Like clean but some files may still exist
# -----------------------------------------
mostlyclean:
	make mostlyclean

# Deleting everything that can reconstructed by this Makefile. It deletes
# everything deleted by distclean plus files created by bison, etc.
# -----------------------------------------------------------------------
realclean: 
	make realclean