# Very simple Makefile for converting the design doc into something useful.
TEX = latex

S = combined_i186_z80_design.tex
PDF = $(S:.tex=.pdf)
PS = $(S:.tex=.ps)

all: $(PS) $(PDF)

%.ps: %.dvi
	dvips -f.ps $< > $@

%.pdf: %.dvi
	dvipdf $< $@

clean:
	rm -f $(PS) $(PDF) *.log *.aux *~
