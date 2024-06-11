#pragma bank 255

#include <gbdk/platform.h>
#include <gbdk/metasprites.h>
#include <stdint.h>
#include "common.h"
#include "PlayerCharacterSprites.h"
#include "camera.h"
#include "level.h"

BANKREF_EXTERN(PlayerCharacterSprites)


#define GRAVTY 45
#define GROUND_FRICTION 15
#define PLAYER_CHARACTER_INCREASE_JUMP_TIMER_MAX 20
#define PLAYER_CHARACTER_JUMP_VELOCITY 550
#define PLAYER_CHARACTER_WALK_VELOCITY 325
#define PLAYER_CHARACTER_RUN_VELOCITY 425
#define PLAYER_CHARACTER_WALK_TWO_FRAME_COUNTER 3
#define PLAYER_CHARACTER_RUN_TWO_FRAME_COUNTER 5

#define PLAYER_CHARACTER_METASPRITE_PIVOT_X 12
#define PLAYER_CHARACTER_METASPRITE_PIVOT_Y 6
#define PLAYER_CHARACTER_BOUNDING_BOX_HALF_WIDTH 5
#define PLAYER_CHARACTER_BOUNDING_BOX_HALF_HEIGHT 12
#define PLAYER_CHARACTER_BOUNDING_BOX_HEIGHT 24

uint8_t facingRight =TRUE;

uint8_t playerJumpIncrease = 0;
uint8_t threeFrameCounter=0;
uint16_t playerX, playerY;
int16_t playerXVelocity, playerYVelocity;

const uint8_t baseProp=0;

#if defined(SEGA)
    #define PLAYER_PALETTES_BANK CURRENT_BANK
    #define PLAYER_PALETTES PlayerPalettesGGSMS
    #define set_player_sprite_data set_sprite_native_data

#else
    #define PLAYER_PALETTES_BANK BANK(PlayerCharacterSprites)
    #define PLAYER_PALETTES PlayerCharacterSprites_palettes
    #define set_player_sprite_data set_sprite_data
#endif



const palette_color_t PlayerPalettesGGSMS[16] = {
	RGB8(255,128, 64), RGB8(248,248,248), RGB8(168,168,168), RGB8(  0,  0,  0)
	,
	RGB8(143,  0,  0), RGB8(  6,112,  0), RGB8(  0, 31,173), RGB8(122,134,  0)
	,
	RGB8(  0,138,111), RGB8( 75,  0, 82), RGB8(255,  0,  0), RGB8( 33,255,  0)
	,
	RGB8(  0, 46,255), RGB8(255,238,  0), RGB8(  0,225,255), RGB8(253,132,255)
	
};

/**
 * @brief We'll Put the PlayerCharacter's tiles in VRAM.
 * Not every platform supports tile-flipping. We want To avoid wasting vram space with both left & right animations.
 * we'll keep tiles only for the direction we are facing.
 */
void UpdatePlayerVRAMTiles(void) NONBANKED{
    uint8_t _previous_bank = CURRENT_BANK;


    SWITCH_ROM(BANK(PlayerCharacterSprites));
   
    set_player_sprite_data (0,PlayerCharacterSprites_TILE_COUNT,PlayerCharacterSprites_tiles);

    SWITCH_ROM(_previous_bank);
}

void SetPlayerPalettes(void) NONBANKED{
    uint8_t _previous_bank = CURRENT_BANK;

        SWITCH_ROM(PLAYER_PALETTES_BANK);
    
    // Set up color palettes
    #if defined(SEGA)
            set_sprite_palette(baseProp, 1, PLAYER_PALETTES);
    #elif defined(GAMEBOY)
        if (_cpu == CGB_TYPE) {
            set_sprite_palette(OAMF_CGB_PAL0, 1, PLAYER_PALETTES);
        }
    #elif defined(NINTENDO_NES)
        set_sprite_palette(baseProp, 4, PLAYER_PALETTES);
    #endif


    SWITCH_ROM(_previous_bank);
}

void SetupPlayer(void) BANKED{

    // Player will start at 40,40
    // the playerX and playerY variables are scaled, so we shift to the left by 4
    playerX=40<<4;
    playerY=40<<4;

    playerXVelocity=0;
    playerYVelocity=0;
    
    UpdatePlayerVRAMTiles();


    SetPlayerPalettes();
 

}

uint8_t DrawPlayer(uint16_t playerRealX, uint16_t playerRealY, uint8_t frame) NONBANKED{

    uint8_t spritesUsed=0;
    uint8_t _previous_bank = CURRENT_BANK;


    // Get the player's position relative to the camera's position
    uint16_t playerCameraX = (playerRealX-camera_x)+DEVICE_SPRITE_PX_OFFSET_X;
    uint16_t playerCameraY= (playerRealY)+DEVICE_SPRITE_PX_OFFSET_Y;

    SWITCH_ROM(BANK(PlayerCharacterSprites));

    spritesUsed = move_metasprite_ex(PlayerCharacterSprites_metasprites[frame],0,baseProp,0,playerCameraX,playerCameraY);
 
    SWITCH_ROM(_previous_bank);

    return spritesUsed;
}

uint8_t UpdatePlayer(void) BANKED{
    
    // Use the run velocity if the B button is held
    // Animate the threeFrameCounter faster when B is held
    int16_t moveSpeed = (joypadCurrent & J_B) ?PLAYER_CHARACTER_RUN_VELOCITY:PLAYER_CHARACTER_WALK_VELOCITY;
    uint8_t threeFrameCounterSpeed = (joypadCurrent & J_B) ? PLAYER_CHARACTER_RUN_TWO_FRAME_COUNTER : PLAYER_CHARACTER_WALK_TWO_FRAME_COUNTER;

    threeFrameCounter+=threeFrameCounterSpeed;
    uint8_t threeFrameCounterValue = threeFrameCounter>>4;
    if(threeFrameCounterValue>=3){
        threeFrameCounter=0;
        threeFrameCounterValue=0;
    }

    uint8_t turning = FALSE;

    if(joypadCurrent &J_RIGHT){

        // If we are facing the other direction?
        if(playerXVelocity<0){

            // Just decrease the velocity, and save that we are turning
            playerXVelocity+=GROUND_FRICTION;

            // We are turning, IF we didn't just finish changing direction.
            if(playerXVelocity<0)turning=TRUE;
            else{
                
                facingRight=TRUE;
            }
        }else{
            playerXVelocity=moveSpeed;

            // Switch our vram data for the player
            if(!facingRight){
                facingRight=TRUE;
            }
            
        }
    }else if(joypadCurrent &J_LEFT){

        // If we are facing the other direction?
        if(playerXVelocity>0){

            // Just decrease the velocity, and save that we are turning
            playerXVelocity-=GROUND_FRICTION;

            // We are turning, IF we didn't just finish changing direction.
            if(playerXVelocity>0)turning=TRUE;
             else{
                
                facingRight=FALSE;
                
            }
        }else{
            playerXVelocity=-moveSpeed;

            // Switch our vram data for the player
            if(facingRight){
                facingRight=FALSE;
                
            }
            
        }
        
    }else{

          // Move the x velocity towards 0
        if (playerXVelocity > 0) {
          if (playerXVelocity >= GROUND_FRICTION) playerXVelocity -= GROUND_FRICTION;
          else playerXVelocity=0;
        }
        else if (playerXVelocity < 0) {
            if (playerXVelocity <= GROUND_FRICTION) playerXVelocity += GROUND_FRICTION;
            else playerXVelocity=0;
        }
    }

    uint16_t playerRealX = playerX>>4;
    uint16_t playerRealY = playerY>>4;

    uint8_t grounded = FALSE;

    // The Player Y is the top of the bounding box.
    // If the player starts to go above the top of the screen
    // then the unsigned integer will wrap. This will cause this loop
    // to fire for a long time until 'playerRealY+PLAYER_CHARACTER_BOUNDING_BOX_HEIGHT-1' wraps around to the bottom of the level.
    // For that reason, because we only scroll horizontally, make sure the player's y position isn't higher than the screen is tall
    if(playerRealY<DEVICE_SCREEN_PX_HEIGHT){

        // Prevent getting stuck in the ground
        while(IsTileSolid(playerRealX,playerRealY+PLAYER_CHARACTER_BOUNDING_BOX_HEIGHT-1)){
            playerY-=16;
            playerRealY = playerY>>4;
        }
    }

    /**
     * @brief Important Note: We need can't use the same x for horizontal collision as we do vertical.
     * For the horizontal collisions, we'll use player x + or - 5. 
     * For the vertical collisions, we'll use player x + or - 3.
     * If we use the same offset value for both, you'll see player getting stuck in the ground. 
     * This would be because both are firing & succeeding, and as a result: player's
     * x and y velocities are constantly being set to 0.
     */

    // If the player is moving horizontally
    if(playerXVelocity!=0){

        // If the player is moving to the right
        if(playerXVelocity>0){

            // The player sprite is sort of tall, we need to check in multiple places along the right edge
            // Subtract a little from the top & bottom edges so player doesn't get caught in ceilings/floors
            if(IsTileSolid(playerRealX+PLAYER_CHARACTER_BOUNDING_BOX_HALF_WIDTH,playerRealY+2)||IsTileSolid(playerRealX+PLAYER_CHARACTER_BOUNDING_BOX_HALF_WIDTH,playerRealY+PLAYER_CHARACTER_BOUNDING_BOX_HALF_HEIGHT)||IsTileSolid(playerRealX+PLAYER_CHARACTER_BOUNDING_BOX_HALF_WIDTH,playerRealY+(PLAYER_CHARACTER_BOUNDING_BOX_HEIGHT-2)))playerXVelocity=0;

        // If the player is moving to the left
        }else if(playerXVelocity<0){

            // The player sprite is sort of tall, we need to check in multiple places along the left edge
            // Subtract a little from the top & bottom edges so player doesn't get caught in ceilings/floors
            if(IsTileSolid(playerRealX-PLAYER_CHARACTER_BOUNDING_BOX_HALF_WIDTH,playerRealY+2)||IsTileSolid(playerRealX-PLAYER_CHARACTER_BOUNDING_BOX_HALF_WIDTH,playerRealY+PLAYER_CHARACTER_BOUNDING_BOX_HALF_HEIGHT)||IsTileSolid(playerRealX-PLAYER_CHARACTER_BOUNDING_BOX_HALF_WIDTH,playerRealY+(PLAYER_CHARACTER_BOUNDING_BOX_HEIGHT-2)))playerXVelocity=0;
        }
    }

    // If the player is moving downwards or still
    if(playerYVelocity>=0){

        // Check both sides of player's feet (left and right)
        // Subtract a little from the edge so player doesn't get caught in walls
        if(IsTileSolid(playerRealX+(PLAYER_CHARACTER_BOUNDING_BOX_HALF_WIDTH-2),playerRealY+PLAYER_CHARACTER_BOUNDING_BOX_HEIGHT)||IsTileSolid(playerRealX-(PLAYER_CHARACTER_BOUNDING_BOX_HALF_WIDTH-2),playerRealY+PLAYER_CHARACTER_BOUNDING_BOX_HEIGHT)){
            playerYVelocity=0;
            grounded=TRUE;
        }

    // If the player is moving upwards
    }else if(playerYVelocity<0){

       
        // Check both sides of player's head (left and right)
        // Subtract a little from the edge so player doesn't get caught in walls
        // To prevent getting stuck, move the player downward also and loop until there's no overlap
        while(IsTileSolid(playerRealX+(PLAYER_CHARACTER_BOUNDING_BOX_HALF_WIDTH-2),playerRealY)||IsTileSolid(playerRealX-(PLAYER_CHARACTER_BOUNDING_BOX_HALF_WIDTH-2),playerRealY)){
            playerYVelocity=0;
            playerY+=16;
            playerRealY = playerY>>4;
        }


    }

    uint8_t pressedA = (joypadCurrent & J_A && !(joypadPrevious & J_A));
    uint8_t pressedUp = (joypadCurrent & J_UP && !(joypadPrevious & J_UP));
    uint8_t pressedAOrUp = pressedA||pressedUp;

    // If we are grounded, and the A/Up button was JUST pressed
    if(grounded && pressedAOrUp){
        playerYVelocity=-PLAYER_CHARACTER_JUMP_VELOCITY;
        playerJumpIncrease=PLAYER_CHARACTER_INCREASE_JUMP_TIMER_MAX;
    }

    // If the player is in the air
    if(!grounded){

        // If we are in the air, increase the amount of time the player can increase the jump height
        if(playerJumpIncrease>0)playerJumpIncrease--;

        // If we are not holding A/Up, or if the amount of time we can increase our jump has ended
        if(!((joypadCurrent & J_A||joypadCurrent & J_UP))||playerJumpIncrease==0){

            // Apply gravity
            playerYVelocity+=GRAVTY;

            // Reset to zero here, so the player has to hold initally to increase jump height
            playerJumpIncrease=0;
        }

    // If the player is grounded, and moving downward
    }else if(playerYVelocity>=0){

        //  Stop the velocity now
        playerYVelocity=0;
    }

    // Apply the players velocity
    playerX+=playerXVelocity>>4;
    playerY+=playerYVelocity>>4;

    // Get the non-scaled version  of the player's position
    playerRealX = playerX>>4;
    playerRealY = playerY>>4;

    // if we've gone past the half-screen mark
    if(playerRealX>=(DEVICE_SCREEN_PX_WIDTH>>1)){
        uint16_t max = currentLevelWidth-DEVICE_SCREEN_PX_WIDTH;
        camera_x=playerRealX-(DEVICE_SCREEN_PX_WIDTH>>1);

        // Limit the camera position to avoid drawing offscreen/looping data
        if(camera_x>max)camera_x=max;
    }
    else camera_x=0;

    // Which of the player's metasprite frames should be shown?
    // If we are grounded:
    //   Turning        = Frame 5
    //   Standing Still = Frame 0
    //   Running        = Frame 0 - 2 (via threeFrameCounterValue variable)
    // If we are in the air:
    //   Rising         = Frame 3
    //   Falling        = Frame 4
    uint8_t frame = grounded ? (turning ? 5 :((playerXVelocity>>4)==0 ? 0 : threeFrameCounterValue)) : (playerYVelocity<0 ? 3 : 4);
    uint8_t directionOffset = facingRight ? 0 : 6;
    
    uint8_t spritesUsed = DrawPlayer(playerRealX,playerRealY,frame+directionOffset);

    // Increase the level if the player is at the end
    if(playerRealX>currentLevelWidth-32){
        nextLevel++;
    }

    return spritesUsed;
}