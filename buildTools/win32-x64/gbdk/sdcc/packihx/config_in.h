#ifndef PACKIHX_HEADER
#define PACKIHX_HEADER

#undef TYPE_BYTE
#undef TYPE_WORD
#define TYPE_UBYTE unsigned TYPE_BYTE
#define TYPE_UWORD unsigned TYPE_WORD

typedef TYPE_UBYTE Uint8;
typedef TYPE_UWORD Uint16;

#endif
