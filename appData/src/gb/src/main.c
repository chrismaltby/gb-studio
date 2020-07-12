#include "main.h"

#include "Core_Main.h"
#include "states/Adventure.h"
#include "states/Platform.h"
#include "states/Shmup.h"
#include "states/TopDown.h"
#include "states/PointNClick.h"
#include <gb/bgb_emu.h>

const Void_Func_Void startFuncs[] = {0, Start_TopDown, Start_Platform, Start_Adventure,
                                     Start_Shmup, Start_PointNClick};
const Void_Func_Void updateFuncs[] = {0, Update_TopDown, Update_Platform, Update_Adventure,
                                      Update_Shmup, Update_PointNClick};
const UBYTE stateBanks[] = {0, 5, 5, 5, 5, 5};

int main() {
    core_start();
    return 0;
}
