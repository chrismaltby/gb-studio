VER = 2.94

doc:
	mkdir -p ../doc
	doxygen libc.dox
	make -C ../doc/libc/latex pdf

dist:
	mkdir -p ../build/doc
	cd ../doc/libc; tar czf ../../build/doc/gbdk-doc-html-$(VER).tar.gz html
	cp ../doc/libc/latex/refman.pdf ../build/doc/gbdk-doc-$(VER).pdf
	gzip ../build/doc/gbdk-doc-$(VER).pdf
	(cd ../doc/libc; tar cf - html) | (cd ../build/doc; tar xf -)

