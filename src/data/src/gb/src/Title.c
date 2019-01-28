#include "Title.h"
#include "BankManager.h"

void TitleInit_b();
void TitleUpdate_b();

UBYTE title_bg_timer = 0;
BYTE title_inter_i = 0;

void TitleInit()
{
  PUSH_BANK(title_bank);
  TitleInit_b();
  POP_BANK;
}

void TitleCleanup()
{
  PUSH_BANK(title_bank);
  TitleCleanup_b();
  POP_BANK;
}

void TitleUpdate()
{
  PUSH_BANK(title_bank);
  TitleUpdate_b();
  POP_BANK;
}

void TitleLCDHandle()
{
  if (LYC_REG == 0) {
    SCX_REG = title_bg_timer << 1;
    LYC_REG = 0xF;
  } else if (LYC_REG == 0xF) {
    SCX_REG = title_bg_timer;
    LYC_REG = 0x17;
  } else if (LYC_REG == 0x17) {
    SCX_REG = 0;
    LYC_REG = 0x4F;
  } else if (LYC_REG == 0x4F) {
    SCX_REG = title_bg_timer;
    LYC_REG = 0x5F;
  } else if (LYC_REG == 0x5F) {
    SCX_REG = title_bg_timer << 1;
    LYC_REG = 0x6E;
  } else if (LYC_REG == 0x6E) {
    SCX_REG = title_bg_timer << 2;
    LYC_REG = 0x7E;
  } else if (LYC_REG == 0x7E) {
    SCX_REG = title_bg_timer << 1;
  }
}
