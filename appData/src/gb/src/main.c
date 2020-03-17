#include "main.h"

#include "Core_Main.h"
#include "Platform.h"
#include "Scroll.h"
#include "TopDown.h"
#include "game.h"

const Void_Func_Void startFuncs[] = {0, Start_TopDown, Start_Platform};
const Void_Func_Void updateFuncs[] = {0, Update_TopDown, Update_Platform};
const UBYTE stateBanks[] = {0, 18, 18};

int main() { core_start(); }
