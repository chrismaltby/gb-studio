#include "game.h"
#include "main.h"
#include "Scroll.h"
#include "Core_Main.h"
#include "TopDown.h"

Void_Func_Void startFuncs[] = {
    Start_TopDown
};

Void_Func_Void updateFuncs[] = {
    Update_TopDown
};

UBYTE stateBanks[] = {
  18
};

int main()
{
  core_start();
}
