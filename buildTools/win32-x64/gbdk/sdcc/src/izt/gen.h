// izt specific gen functions.
#ifndef IZT_GEN_INCLUDE
#define IZT_GEN_INCLUDE

// Emit a line of code.
void iemit (const char *format,...);

// Generic descripter for a function that can emit a type of iCode.
typedef struct
  {
    int op;
    void (*emit) (iCode * ic);
  }
EMITTER;

// Call the base izt handler to handle this iCode.
void izt_baseEmitter (iCode * ic);
// Initialise the base emitter table.
void izt_initBaseEmitters (hTab ** into);
// Add a NULL terminated array of emitters into the given hash table.
void izt_addEmittersToHTab (hTab ** into, EMITTER _base_emitters[]);
// Initialise the emitter tables.
void izt_initEmitters (void);

#endif
