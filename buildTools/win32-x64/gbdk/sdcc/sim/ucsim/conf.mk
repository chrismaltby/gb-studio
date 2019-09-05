#
# Makefile targets to remake configuration
#

freshconf: main.mk ddconfig.h

main.mk: $(srcdir)/main_in.mk config.status
	$(SHELL) ./config.status

ddconfig.h: ddconfig_in.h config.status
	@echo "Re-making ddconfig.h"
	$(SHELL) ./config.status

# End of conf.mk
