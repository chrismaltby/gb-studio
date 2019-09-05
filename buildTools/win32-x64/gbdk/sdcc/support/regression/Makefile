# Test suite Makefile
# Part of SDCC - http://sdcc.sourceforge.net/
# Michael Hope <michaelh@juju.net.nz> 2001
#
# This Makefile builds and runs the test suites under tests/ for each
# one of the supported ports located under ports/.  The test suite
# results are summarised and individual test failures are logged.  The
# expected result is a single line per port summarising the number of
# failures, test points, and test cases.  The philosophy is that
# checked in code should always pass the suite with no failures, as
# then if there are failures then it is in the current developers code.
#
# Only the required suites are run.  Changing sdcc causes all to be
# re-run.  Changing one suite causes just that to be run.  Changing
# one of the library files should cause all to re-run

# Dependancies:
#   * The sdcc-extra package, available from CVS.
#       o cvs -d cvs.sdcc.sourceforge.net:/cvsroot/sdcc co sdcc-extra
#       o Provides the emulators
#   * The gbdk-lib package from gbdk.
#       o cvs -d cvs.gbdk.sourceforge.net:/cvsroot/gbdk co gbdk-lib
#       o Proviles mul, div, and include files for the z80 tests.
#   * python 1.5 or above
#   * uCsim for the mcs51 port
#
# The paths below assume that sdcc, sdcc-extra, and gbdk-lib all reside in
# the same directory.

# Old notes:
# Starting at the bottom
# Set of source test suites
# Each source suite is processesd producing multiple device specific test suites.
# Each device specific test suite is compiled.
# Each device specific test suite is run, and the output recorded.
# The output from each device specific test suite derrived from a source
# test suite are collated.

# Uncomment this to show only errors and the summary.
# Comment this out for debugging.
#.SILENT:

# All original tests live in TESTS_DIR and below
TESTS_DIR = tests
TESTS_NAME = $(TESTS_DIR)
# All suite results go in RESULTS_DIR
RESULTS_DIR = results
# All data relating to supported ports live in their own directory
# under PORTS_DIR.
PORTS_DIR = ports

# Itermediate data directories
# Directory that generated cases and the related object code go.
CASES_DIR = gen

# Script that takes a source test suite and generates the iterations
GENERATE_CASES = generate-cases.py

# Magically generate the list of configured ports to test.
# Each directory under ports/ is used as a port name.  Each port is tested.
# The port name must be the same as the one used in the SDCC '-mxxx' argument.
# Each port must have a spec.mk which describes how to build the object
# files and how to run the emulator.
ALL_PORTS = $(filter-out CVS mcs51 gbz80,$(notdir $(wildcard $(PORTS_DIR)/*)))

# These  ports will be cleaned with 'make clean'
CLEAN_PORTS = $(filter-out CVS,$(notdir $(wildcard $(PORTS_DIR)/*)))                                                                 

all: test-ports

# Test all of the ports
test-ports:
	for i in $(ALL_PORTS); do $(MAKE) inter-port-clean test-port PORT=$$i; done

# Helper rule for testing the z80 port only
test-z80:
	$(MAKE) inter-port-clean test-port PORT=z80

# Helper rule for testing the z80 port only
test-gbz80:
	$(MAKE) inter-port-clean test-port PORT=gbz80

# Helper rule for testing the mcs51 small model port only
test-mcs51:
	$(MAKE) inter-port-clean test-port PORT=mcs51

# Helper rule for testing the host cc only
test-host:
	$(MAKE) inter-port-clean test-port PORT=host

test-host2:
	$(MAKE) test-port PORT=host

# Begin per-port rules
# List of all of the known source test suites.
ALL_TESTS = $(shell find $(TESTS_DIR) -name "*.c")

# Intermediate directory
PORT_CASES_DIR = $(CASES_DIR)/$(PORT)
PORT_RESULTS_DIR = $(RESULTS_DIR)/$(PORT)
# Each test generates a result log file
PORT_RESULTS = $(ALL_TESTS:$(TESTS_DIR)/%.c=$(PORT_RESULTS_DIR)/%.out)

SDCC_DIR = ../..
SDCC_EXTRA_DIR = ../../../sdcc-extra


# Defaults.  Override in spec.mk if required.
# Path to SDCC
SDCC = $(SDCC_DIR)/bin/sdcc
# Base flags.
SDCCFLAGS = -m$(PORT)
# Extension of object intermediate files
OBJEXT = .o
# Extension of files that can be run in the emulator
EXEEXT = .bin
# Currently unused.  Extension to append to intermediate directories.
DIREXT = 

# Only include if we're in a per-port call.
ifdef PORT
include $(PORTS_DIR)/$(PORT)/spec.mk
endif

SDCCFLAGS += -Ifwk/include -Itests

# List of intermediate files to keep.  Pretty much keep everything as
# disk space is free.
.PRECIOUS: $(PORT_CASES_DIR)/% %$(OBJEXT) %$(EXEEXT)

# Rule to generate the iterations of a test suite off the soure suite.
$(PORT_CASES_DIR)/%/iterations.stamp: $(TESTS_DIR)/%.c $(GENERATE_CASES)
	echo Processing $<
	rm -rf $(CASES_DIR)/$(TESTS_NAME)
	mkdir -p $(CASES_DIR)/$(TESTS_NAME)
	mkdir -p `dirname $@`
	python $(GENERATE_CASES) $< > /dev/null
	cp $(CASES_DIR)/$(TESTS_NAME)/*.c `dirname $@`
	touch $@

# Rule linking the combined results log to all of the files in the
# iteration directory.
$(PORT_RESULTS_DIR)/%.out: $(PORT_CASES_DIR)/%/iterations.stamp
	$(MAKE) iterations PORT=$(PORT) CASES=`dirname $<`

# Rule to summaries the results for one port after all of the tests
# have been run.
port-results: port-dirs $(PORT_RESULTS)
	echo Summary for \'$(PORT)\': `cat $(PORT_RESULTS) | python collate-results.py`

port-dirs:
	mkdir -p $(PORT_CASES_DIR) $(PORT_RESULTS_DIR)

test-port: port-results

# Begin rules that process each iteration generated from the source
# test

# List of all of the generated iteration source files.
SUB_CASES = $(sort $(wildcard $(CASES)/*.c))
# List of all the sub result logs generated from the iterations.
SUB_RESULTS = $(SUB_CASES:%.c=%.out)
# Overall target.  Concatenation of all of the sub results.
RESULTS = $(CASES:$(CASES_DIR)/%$(DIREXT)=$(RESULTS_DIR)/%.out)

iterations: $(RESULTS)

# Rule to generate the overall target from the sub results.
$(RESULTS): $(SUB_RESULTS)
	cat $(SUB_RESULTS) > $@

# The remainder of the rules are in $PORT/spec.mak.  The port needs to
# be able to turn an iterated test suite into a sub result, normally
# by:
#    1. Compile the required library files
#    2. Compile this test suite.
#    3. Link 1, 2, and any required stdlib into an executable.
#    4. Run the executable inside an emulator, and capture the text
#    output into %.out.
#
# The emulator must exit when main() returns.

# BeginGeneric rules

clean: inter-port-clean
	rm -rf $(CASES_DIR) $(RESULTS_DIR) *.pyc
	for i in $(CLEAN_PORTS); do $(MAKE) -f $(PORTS_DIR)/$$i/spec.mk _clean PORT=$$i; done

inter-port-clean:
	rm -f  fwk/lib/*.o fwk/lib/*.asm fwk/lib/*.rst fwk/lib/*.lst fwk/lib/*.rel \
               fwk/lib/*.ihx fwk/lib/*.map fwk/lib/*.sym                                                                                 
