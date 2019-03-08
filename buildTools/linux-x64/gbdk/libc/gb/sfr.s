	.area	_SFR (ABS)

	.org	0xFF00
_P1_REG::	; Joystick: 1.1.P15.P14.P13.P12.P11.P10 */ 
	.ds	1
	.org	0xFF01
_SB_REG::	; Serial IO data buffer */
	.ds	1
	.org	0xFF02
_SC_REG::	; Serial IO control register */
	.ds	1
	.org	0xFF04
_DIV_REG::	; Divider register */
	.ds	1
	.org	0xFF05
_TIMA_REG::	; Timer counter */
	.ds	1
	.org	0xFF06
_TMA_REG::	; Timer modulo */
	.ds	1
	.org	0xFF07
_TAC_REG::	; Timer control */
	.ds	1
	.org	0xFF0F
_IF_REG::	; Interrupt flags: 0.0.0.JOY.SIO.TIM.LCD.VBL */ 
	.ds	1
	.org	0xFF10
_NR10_REG::	; Sound register */
	.ds	1
	.org	0xFF11
_NR11_REG::	; Sound register */
	.ds	1
	.org	0xFF12
_NR12_REG::	; Sound register */
	.ds	1
	.org	0xFF13
_NR13_REG::	; Sound register */
	.ds	1
	.org	0xFF14
_NR14_REG::	; Sound register */
	.ds	1
	.org	0xFF16
_NR21_REG::	; Sound register */
	.ds	1
	.org	0xFF17
_NR22_REG::	; Sound register */
	.ds	1
	.org	0xFF18
_NR23_REG::	; Sound register */
	.ds	1
	.org	0xFF19
_NR24_REG::	; Sound register */
	.ds	1
	.org	0xFF1A
_NR30_REG::	; Sound register */
	.ds	1
	.org	0xFF1B
_NR31_REG::	; Sound register */
	.ds	1
	.org	0xFF1C
_NR32_REG::	; Sound register */
	.ds	1
	.org	0xFF1D
_NR33_REG::	; Sound register */
	.ds	1
	.org	0xFF1E
_NR34_REG::	; Sound register */
	.ds	1
	.org	0xFF20
_NR41_REG::	; Sound register */
	.ds	1
	.org	0xFF21
_NR42_REG::	; Sound register */
	.ds	1
	.org	0xFF22
_NR43_REG::	; Sound register */
	.ds	1
	.org	0xFF23
_NR44_REG::	; Sound register */
	.ds	1
	.org	0xFF24
_NR50_REG::	; Sound register */
	.ds	1
	.org	0xFF25
_NR51_REG::	; Sound register */
	.ds	1
	.org	0xFF26
_NR52_REG::	; Sound register */
	.ds	1
	.org	0xFF40
_LCDC_REG::	; LCD control */
	.ds	1
	.org	0xFF41
_STAT_REG::	; LCD status */
	.ds	1
	.org	0xFF42
_SCY_REG::	; Scroll Y */
	.ds	1
	.org	0xFF43
_SCX_REG::	; Scroll X */
	.ds	1
	.org	0xFF44
_LY_REG::	; LCDC Y-coordinate */
	.ds	1
	.org	0xFF45
_LYC_REG::	; LY compare */
	.ds	1
	.org	0xFF46
_DMA_REG::	; DMA transfer */
	.ds	1
	.org	0xFF47
_BGP_REG::	; BG palette data */
	.ds	1
	.org	0xFF48
_OBP0_REG::	; OBJ palette 0 data */
	.ds	1
	.org	0xFF49
_OBP1_REG::	; OBJ palette 1 data */
	.ds	1
	.org	0xFF4A
_WY_REG::	; Window Y coordinate */
	.ds	1
	.org	0xFF4B
_WX_REG::	; Window X coordinate */
	.ds	1
	.org	0xFF4D
_KEY1_REG::	; CPU speed */
	.ds	1
	.org	0xFF4F
_VBK_REG::	; VRAM bank */
	.ds	1
	.org	0xFF51
_HDMA1_REG::	; DMA control 1 */
	.ds	1
	.org	0xFF52
_HDMA2_REG::	; DMA control 2 */
	.ds	1
	.org	0xFF53
_HDMA3_REG::	; DMA control 3 */
	.ds	1
	.org	0xFF54
_HDMA4_REG::	; DMA control 4 */
	.ds	1
	.org	0xFF55
_HDMA5_REG::	; DMA control 5 */
	.ds	1
	.org	0xFF56
_RP_REG::	; IR port */
	.ds	1
	.org	0xFF68
_BCPS_REG::	; BG color palette specification */ 
	.ds	1
	.org	0xFF69
_BCPD_REG::	; BG color palette data */
	.ds	1
	.org	0xFF6A
_OCPS_REG::	; OBJ color palette specification */ 
	.ds	1
	.org	0xFF6B
_OCPD_REG::	; OBJ color palette data 
	.ds	1
	.org	0xFF70
_SVBK_REG::	; WRAM bank */
	.ds	1
	.org	0xFFFF
_IE_REG::	; Interrupt enable */ 
	.ds	1