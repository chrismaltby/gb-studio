#
#
#

SHELL		= /bin/sh

PRJDIR		= .

include $(PRJDIR)/Makefile.common

SDCC_MISC	= debugger/mcs51 sim/ucsim
SDCC_LIBS	= support/cpp2 support/makebin
SDCC_DOC        = doc

# Parts that are not normally compiled but need to be cleaned
SDCC_EXTRA      = support/regression

SDCC_ASLINK	= as/mcs51 as link
SDCC_PACKIHX	= packihx

TARGETS         = sdcc-libs sdcc-cc sdcc-aslink sdcc-doc

PKGS		= $(SDCC_LIBS) src $(SDCC_ASLINK) $(SDCC_DOC)

ifneq ($(OPT_ENABLE_UCSIM), no)
TARGETS         += sdcc-misc 
PKGS            += $(SDCC_MISC)
endif

ifneq ($(OPT_ENABLE_DEVICE_LIB_BUILD), no)
TARGETS         += sdcc-device
PKGS            += device/include device/lib
endif

ifneq ($(OPT_ENABLE_PACKIHX), no)
TARGETS         += sdcc-packihx
PKGS            += $(SDCC_PACKIHX)
endif

PKGS_TINI	= $(SDCC_LIBS) $(SDCC_ASLINK) \
		  src device/include $(SDCC_PACKIHX)
PORTS		= $(shell cat ports.build)
ALLPORTS	= $(shell cat ports.all)

# Compiling entire program or any subproject
# ------------------------------------------
all: checkconf sdcc

tini: checkconf sdcc-tini

sdcc-libs:
	for lib in $(SDCC_LIBS); do $(MAKE) -C $$lib; done

sdcc-cc: sdcc-libs
	$(MAKE) -C src

sdcc-aslink:
	for as in $(SDCC_ASLINK); do $(MAKE) -C $$as; done

sdcc-misc:
	for misc in $(SDCC_MISC); do $(MAKE) -C $$misc; done

sdcc-packihx:
	$(MAKE) -C $(SDCC_PACKIHX)

sdcc-device:
	$(MAKE) -C device/include
	$(MAKE) -C device/lib

sdcc-device-tini:
	$(MAKE) -C device/include
	$(MAKE) -C device/lib modelDS390

# Empty for now, as doc depends on latex and latex2html
sdcc-doc:

sdcc: $(TARGETS)

sdcc-tini: sdcc-cc sdcc-aslink sdcc-device-tini sdcc-packihx
	$(MAKE) -f main.mk all

# Some interesting sub rules
sdcc-bin: sdcc-cc sdcc-aslink sdcc-misc

sdcc-base: sdcc-cc sdcc-aslink

# Compiling and installing everything and runing test
# ---------------------------------------------------
install:
	$(MAKE) -f main.mk install
	@for pkg in $(PKGS); do\
	  $(MAKE) -C $$pkg install ;\
	done

install-tini:
	$(MAKE) -f main.mk install
	@for pkg in $(PKGS_TINI); do\
	  $(MAKE) -C $$pkg install ;\
	done
	$(MAKE) -C device/lib installDS390



# Deleting all the installed files
# --------------------------------
uninstall:
	$(MAKE) -f main.mk uninstall
	@for pkg in $(PKGS); do\
	  $(MAKE) -C $$pkg uninstall ;\
	done


# Deleting all files created by building the program
# --------------------------------------------------
clean:
	@echo "+ Cleaning root of the project..."
	$(MAKE) -f clean.mk clean
	@echo "+ Cleaning packages in their directories..."
	for pkg in $(PKGS); do\
	  $(MAKE) PORTS="$(PORTS)" -C $$pkg -f clean.mk clean ;\
	done

# Deleting all files created by configuring or building the program
# -----------------------------------------------------------------
distclean:
	@echo "+ DistCleaning root of the project..."
	$(MAKE) -f clean.mk distclean
	@echo "+ DistCleaning packages using clean.mk..."
	for pkg in $(PKGS); do\
	  $(MAKE) -C $$pkg PORTS="$(PORTS)" -f clean.mk distclean ;\
	done
	for pkg in $(SDCC_EXTRA); do \
	  $(MAKE) -C $$pkg clean; \
	done

# Like clean but some files may still exist
# -----------------------------------------
mostlyclean: clean
	$(MAKE) -f clean.mk mostlyclean
	for pkg in $(PKGS); do\
	  $(MAKE) -C $$pkg -f clean.mk PORTS="$(PORTS)" mostlyclean ;\
	done


# Deleting everything that can reconstructed by this Makefile. It deletes
# everything deleted by distclean plus files created by bison, stc.
# -----------------------------------------------------------------------
realclean: distclean
	$(MAKE) -f clean.mk realclean
	for pkg in $(PKGS); do\
	  $(MAKE) -C $$pkg -f clean.mk PORTS="$(PORTS)" realclean ;\
	done


# Creating distribution
# ---------------------
dist: distclean
	@if [ -f devel ]; then\
	  rm -f devel; mkdist sdcc; touch devel;\
	else\
	  mkdist sdcc;\
	fi


# Performing self-test
# --------------------
check:


# Performing installation test
# ----------------------------
installcheck:


# Creating dependencies
# ---------------------
dep:
	$(MAKE) -f main.mk dep
	@for pkg in $(PKGS); do\
	  $(MAKE) -C $$pkg dep ;\
	done


# My rules
# --------
newer: distclean
	@if [ -f start ]; then \
	  tar cvf - \
	    `find . -newer start -type f -print` |\
	  gzip -9c >`date '+%m%d%H%M'`.tgz; \
	else \
	  echo "start file not found.\n"; \
	  exit 1; \
	fi

putcopyright:
	'put(c)' -s $(STARTYEAR) *.cc *.h *.y *.l


# Remaking configuration
# ----------------------
configure: configure.in
	$(SHELL) $(AUTOCONF)

main.mk: $(srcdir)/main_in.mk $(srcdir)/configure.in config.status
	$(SHELL) ./config.status

Makefiles: makefiles

makefiles: config.status

config.status: configure
	$(SHELL) ./config.status --recheck

makefiles:
	$(SHELL) ./config.status

freshconf: main.mk

checkconf:
	@if [ -f devel ]; then\
	  $(MAKE) freshconf;\
	fi

# End of Makefile
