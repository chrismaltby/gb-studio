include Makefile.common

ADATA = $(foreach dir,src/data,$(notdir $(wildcard $(dir)/*.s)))
CDATA = $(foreach dir,src/data,$(notdir $(wildcard $(dir)/*.c)))
MDATA = $(foreach dir,src/data/$(MUSIC_DRIVER),$(notdir $(wildcard $(dir)/*.c)))
EXAMPLES = $(foreach dir,examples,$(wildcard $(dir)/*))
TESTS = $(filter-out test/framework, $(foreach dir,test,$(wildcard $(dir)/*)))

OBJS = $(ENGINE_OBJS) \
	$(ADATA:%.s=$(OBJDIR)/%.o) \
	$(CDATA:%.c=$(OBJDIR)/%.o) \
	$(MDATA:%.c=$(OBJDIR)/%.o)
	
REL_OBJS_LOCAL = $(OBJS:$(OBJDIR)/%.o=$(REL_OBJDIR)/%.rel)
REL_OBJS       = $(REL_OBJS_LOCAL:$(TOP)$(OBJDIR)/%.o=$(REL_OBJDIR)/%.rel)

$(OBJDIR)/%.o:	src/data/$(MUSIC_DRIVER)/%.c
	$(CC) $(CFLAGS) -c -o $@ $<	

$(OBJDIR)/%.o:	src/data/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

$(OBJDIR)/%.o:	src/data/%.s
	$(CC) $(CFLAGS) -c -o $@ $<	

$(REL_OBJDIR)/.rel:		$(OBJS)
$(ROM_BUILD_DIR)/%.gb:	$(REL_OBJS)

.PHONY: 	examples test
examples:
	@for example in $(EXAMPLES) ; do \
		$(MAKE) -C $$example ; \
	done

test:
	@for test in $(TESTS) ; do \
		echo "# $$test"; \
		$(MAKE) -C $$test test; \
		echo ""; \
	done
