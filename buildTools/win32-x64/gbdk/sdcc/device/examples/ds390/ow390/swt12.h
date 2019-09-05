typedef struct tagSRAM
{
	uchar Supply;
	uchar Chan_B;
	uchar Chan_A;
	uchar Chan_Sel;
	uchar Sour_Sel;
	uchar Polarity;
} SwitchProps;

int ReadSwitch12(int,int);
int SetSwitch12(int,uchar *,SwitchProps*);
int SwitchStateToString12(int,char *);
