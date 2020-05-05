#include "main.h"

#include "Adventure.h"
#include "Core_Main.h"
#include "Platform.h"
#include "Scroll.h"
#include "Shmup.h"
#include "TopDown.h"
#include "game.h"

const Void_Func_Void startFuncs[] = {0, Start_TopDown, Start_Platform, Start_Adventure,
                                     Start_Shmup};
const Void_Func_Void updateFuncs[] = {0, Update_TopDown, Update_Platform, Update_Adventure,
                                      Update_Shmup};
const UBYTE stateBanks[] = {0, 5, 5, 5, 5};

int main() { core_start(); }
