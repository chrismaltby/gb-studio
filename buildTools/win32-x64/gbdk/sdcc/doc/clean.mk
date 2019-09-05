# remove intermediate file, not the final pdf's and html's
# because these are needed for the distribution
clean:
	rm -rf *.tex *.aux *.dvi *.idx *.ilg *.ind *.log *.toc *~ \#* \
		*.ps */*.css */*.pl *.gif core

# now get rid of the generated pdf's and html's as well
superclean: clean
	rm -rf *.pdf $(MANUAL).html $(TSS).html

distclean: superclean
