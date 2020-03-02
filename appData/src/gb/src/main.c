#include "main.h"
#include "Core_Main.h"
#include "Platform.h"
#include "Scroll.h"
#include "TopDown.h"
#include "game.h"

Void_Func_Void startFuncs[] = {0, Start_TopDown, Start_Platform};

Void_Func_Void updateFuncs[] = {0,
                                Update_TopDown,
                                Update_Platform,
                                Update_TopDown,
                                Update_Platform,
                                Update_TopDown,
                                Update_Platform};

UBYTE stateBanks[] = {0, 18, 18};

int main() { core_start(); }
