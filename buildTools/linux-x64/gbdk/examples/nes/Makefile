# Register all subdirectories in the project's root directory.
SUBDIRS := $(wildcard */.)

# Top-level phony targets.
all clean compile.bat: $(SUBDIRS) FORCE
# Similar to:
# .PHONY: all clean
# all clean: $(SUBDIRS)
# GNU's .PHONY target is more efficient in that it explicitly declares non-files.

# Recurse `make` into each subdirectory
# Pass along targets specified at command-line (if any).
$(SUBDIRS): FORCE
	$(MAKE) -C $@ $(MAKECMDGOALS)

# Force targets.
FORCE: