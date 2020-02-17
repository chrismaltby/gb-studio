#include "game.h"
#include "main.h"
#include "Scroll.h"
#include "Core_Main.h"
#include "TopDown.h"
#include "Platform.h"

Void_Func_Void startFuncs[] = {
    0,
    Start_TopDown,
    Start_Platform
};

Void_Func_Void updateFuncs[] = {
    0,
    Update_TopDown,
    Update_Platform
};

UBYTE stateBanks[] = {
  0, 18, 18
};

int main()
{
  core_start();
}
