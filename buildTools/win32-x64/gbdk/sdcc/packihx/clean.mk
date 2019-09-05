clean:
	rm -f *core *[%~] *.[oa] *.output
	rm -f .[a-z]*~ \#*
	rm -f packihx

distclean realclean: clean
	rm -f config.* Makefile
