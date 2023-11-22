// TODO: Permissive License

#ifndef GBC_HICOLOR_H
#define GBC_HICOLOR_H

#define HICOLOR_VAR(varname) varname ## _data

typedef struct hicolor_data {
        uint16_t  tile_count;
        uint8_t   height_in_tiles;
        uint8_t * p_tiles;
        uint8_t * p_map;
        uint8_t * p_attribute_map;
        uint8_t * p_palette;
} hicolor_data;

// Loads Tile Patterns, Map and Map Attributes for the HiColor image,
// then installs the HiColor ISR handler which updates palettes per scanline.
void hicolor_start(const hicolor_data * p_hicolor, uint8_t p_hicolor_bank) NONBANKED;

// De-installs the HiColor ISR handler
inline void hicolor_stop(void) {
    hicolor_start(NULL, 0);
}


#endif