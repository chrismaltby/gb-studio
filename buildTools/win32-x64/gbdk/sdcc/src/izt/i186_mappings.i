static const ASM_MAPPING _as86_mapping[] = {
    { "global", ".GLOBAL %s" },
    { "labeldef", "%s:" },
    { "tlabeldef", "l%05d:" },
    { "tlabel", "l%05d" },
    { "fileprelude", "" },
    { "functionheader", 
      "; ---------------------------------\n"
      "; Function %s\n"
      "; ---------------------------------"
    },
    { "functionlabeldef", "%s:" },
    { "zero", "$00" },
    { "one", "$01" },
    { "area", ".SECT %s" },
    { "areadata", ".SECT .DATA" },
    { "areacode", ".SECT .TEXT" }, 
    { "areahome", ".SECT .TEXT" }, 
    { "module", "; Module %s" },
    { "ascii", ".ASCII \"%s\"" },
    { "ds", "lcomm %d" },
    { "db", ".B" },
    { "dbs", "DB %s" },
    { "dw", "DW" },
    { "dws", "DW %s" },
    { "immed", "" },
    { "constbyte", "$%02X" },
    { "constword", "$%04X" },
    { "immedword", "$%04X" },
    { "immedbyte", "$%02X" },
    { "hashedstr", "%s" },
    { "lsbimmeds", "%s & $FF" },
    { "msbimmeds", "%s >> 8" },
    { NULL, NULL }
};

static const ASM_MAPPING _as86_i186_mapping[] = {
    { "adjustsp", "add sp,*-%d" },
    { "enter", "enter 0,0" },
    { "enterx", "enter -%d,0" },
    { "leave", "leave" },
    { "leavex", "leave" },
    { NULL, NULL }
};

static const ASM_MAPPINGS _as86_mappings = {
    NULL,
    _as86_mapping,
};

static const ASM_MAPPINGS _as86_i186_mappings = {
    &_as86_mappings,
    _as86_i186_mapping
};
