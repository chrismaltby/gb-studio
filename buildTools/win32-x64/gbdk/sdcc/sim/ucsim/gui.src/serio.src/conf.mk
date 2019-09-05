# uCsim gui.src/serio.src/conf.mk

#
# Makefile targets to remake configuration
#

freshconf: Makefile

Makefile: $(srcdir)/Makefile.in $(PRJDIR)/configure.in
	cd $(PRJDIR) && $(SHELL) ./config.status

# End of gui.src/serio.src/conf.mk
