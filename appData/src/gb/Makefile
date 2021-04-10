OBJDIR = obj

EXAMPLES = $(foreach dir,examples,$(wildcard $(dir)/*))
EXAMPLES_DIR = ./examples

TESTS = $(filter-out test/framework, $(foreach dir,test,$(wildcard $(dir)/*)))
TEST_DIR = ./test

all:		examples test

.PHONY: 	develop examples test clean settings
develop:
	$(MAKE) -C ./examples/develop

examples:
	rm -rf $(EXAMPLES_DIR)/*/obj
	rm -rf $(EXAMPLES_DIR)/*/build
	@for example in $(EXAMPLES) ; do \
		rm -rf $(OBJDIR) ; \
		$(MAKE) -C $$example ; \
	done

test:
	rm -f $(TEST_DIR)/*/capture.bmp	
	rm -rf $(TEST_DIR)/*/obj
	rm -rf $(TEST_DIR)/*/build
	rm -rf $(OBJDIR)
	@for test in $(TESTS) ; do \
		echo "# $$test"; \
		$(MAKE) -C $$test test; \
		echo ""; \
	done

clean:
	@echo "CLEANUP..."
	rm -rf $(OBJDIR)
	rm -rf $(ROM_BUILD_DIR)
	rm -f $(TEST_DIR)/*/capture.bmp	
	rm -rf $(TEST_DIR)/*/obj
	rm -rf $(TEST_DIR)/*/build
	rm -rf $(EXAMPLES_DIR)/*/obj
	rm -rf $(EXAMPLES_DIR)/*/build
