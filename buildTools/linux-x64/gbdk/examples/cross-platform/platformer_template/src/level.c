#include <stdint.h>
#include <gbdk/platform.h>
#include "common.h"
#include "World1Area1.h"
#include "World1Area2.h"
#include "World2Area1.h"
#include "World1Tileset.h"
#include "World2Tileset.h"

#define WORLD1_SOLID_TILE_COUNT 17
#define WORLD2_SOLID_TILE_COUNT 68

BANKREF_EXTERN(World1Tileset)
BANKREF_EXTERN(World2Tileset)
BANKREF_EXTERN(World1Area1)
BANKREF_EXTERN(World1Area2)
BANKREF_EXTERN(World1Area1)


// Instead of directly referencing our map constants, camera and physica code will reference these which can be changed between levels
uint16_t currentLevelWidth;
uint16_t currentLevelWidthInTiles;
uint16_t currentLevelHeight;
uint16_t currentLevelHeightInTiles;
const uint8_t *currentLevelMap;
uint8_t currentLevelNonSolidTileCount;
uint8_t currentAreaBank;


// What is the current and next level we are on
// When they differ, we'll change levels
uint8_t currentLevel = 255;
uint8_t nextLevel = 0;

/**
 * @param worldX a (non-scaled) x position in the world
 * @param worldY a (non-scaled) y position in the world
 * @return uint8_t FALSE (0) if the tile is not solid, TRUE (1) if the tile is solid
 */
uint8_t IsTileSolid(uint16_t worldX,uint16_t worldY) NONBANKED{

    uint8_t _previous_bank = CURRENT_BANK;

    SWITCH_ROM(currentAreaBank);

    // Get convert the world position to a column and row by dividing by 8
    uint16_t column = worldX>>3;
    uint16_t row = worldY>>3;

    uint16_t worldMaxRow = currentLevelHeight>>3;

    // Our y coordinate and row are unsigned integers
    // We'll check if the row is larger than the maxium
    // if that is the case, the player's unsigned y position has wrapped around (instead of going into negative values)
    if(row>worldMaxRow||column>=currentLevelWidthInTiles){

        SWITCH_ROM(_previous_bank);
        return TRUE;
    }

    uint16_t index = column + row* currentLevelWidthInTiles;

    uint8_t tile = currentLevelMap[index];

    SWITCH_ROM(_previous_bank);

    return tile<currentLevelNonSolidTileCount;
}



void SetupCurrentLevel(void) NONBANKED{

    uint8_t _previous_bank = CURRENT_BANK;

    for(uint8_t i=0;i<DEVICE_SCREEN_BUFFER_WIDTH;i++){
        for(uint8_t j=0;j<DEVICE_SCREEN_BUFFER_HEIGHT;j++){
            set_attribute_xy(i,j,0);
            }
    }


    // We only have 3 levels
    // This will loop between them
    switch(currentLevel % 3){
        case 0:



            // Switch to whichever bank our song is in
            // Not neccessary if the song is in bank 0
            SWITCH_ROM(( BANK(World1Tileset)));

            set_native_tile_data(0,World1Tileset_TILE_COUNT,World1Tileset_tiles);
            setBKGPalettes(World1Tileset_PALETTE_COUNT,World1Tileset_palettes);
            
            // Switch to whichever bank our song is in
            // Not neccessary if the song is in bank 0
            SWITCH_ROM((currentAreaBank = BANK(World1Area1)));

            currentLevelNonSolidTileCount=WORLD1_SOLID_TILE_COUNT;
            currentLevelWidth = World1Area1_WIDTH;
            currentLevelHeight = World1Area1_HEIGHT;
            currentLevelWidthInTiles = World1Area1_WIDTH>>3;
            currentLevelHeightInTiles = World1Area1_HEIGHT>>3;            
            currentLevelMap= World1Area1_map;


            break;
        case 1:


            // Switch to whichever bank our song is in
            // Not neccessary if the song is in bank 0
            SWITCH_ROM((currentAreaBank = BANK(World1Tileset)));


            set_native_tile_data(0,World1Tileset_TILE_COUNT,World1Tileset_tiles);
            setBKGPalettes(World1Tileset_PALETTE_COUNT,World1Tileset_palettes);

            
            // Switch to whichever bank our song is in
            // Not neccessary if the song is in bank 0
            SWITCH_ROM((currentAreaBank = BANK(World1Area2)));

            currentLevelNonSolidTileCount=WORLD1_SOLID_TILE_COUNT;
            currentLevelWidth = World1Area2_WIDTH;
            currentLevelHeight = World1Area2_HEIGHT;
            currentLevelWidthInTiles = World1Area2_WIDTH>>3;
            currentLevelHeightInTiles = World1Area2_HEIGHT>>3;
            currentLevelMap= World1Area2_map;

            break;
        case 2:


            // Switch to whichever bank our song is in
            // Not neccessary if the song is in bank 0
            SWITCH_ROM((BANK(World2Tileset)));

            set_native_tile_data(0,World2Tileset_TILE_COUNT,World2Tileset_tiles);
            setBKGPalettes(World2Tileset_PALETTE_COUNT,World2Tileset_palettes);

            
            // Switch to whichever bank our song is in
            // Not neccessary if the song is in bank 0
            SWITCH_ROM((currentAreaBank = BANK(World2Area1)));

            currentLevelNonSolidTileCount=WORLD2_SOLID_TILE_COUNT;
            currentLevelWidth = World2Area1_WIDTH;
            currentLevelHeight = World2Area1_HEIGHT;
            currentLevelWidthInTiles = World2Area1_WIDTH>>3;
            currentLevelHeightInTiles = World2Area1_HEIGHT>>3;
            currentLevelMap= World2Area1_map;

            break;
    }

    SWITCH_ROM(_previous_bank);
}
