all: refman.dvi

ps: refman.ps

pdf: ps
	ps2pdf refman.ps refman.pdf

refman.ps: refman.dvi
	dvips -o refman.ps refman.dvi

refman.dvi: refman.tex doxygen.sty
	echo "Running latex..."
	latex refman.tex
	echo "Running makeindex..."
	makeindex refman.idx
	echo "Rerunning latex...."
	latex refman.tex
clean:
	rm -f *.ps *.dvi *.aux *.toc *.idx *.ind *.ilg *.log *.out
