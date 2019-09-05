extern char *globalStringSpace;

extern int TiniOpen(char *argPort, int argBaud);
extern int TiniBaudRate(int baud);
extern int TiniReset(int toBootLoader);
extern int TiniRead(char*, int);
extern int TiniWrite(char*, int);
extern int TiniWait(char promptChar);
extern int TiniWriteAndWait(char *buffer, int n, char promptChar);
extern void TiniFlush(void);
extern void TiniDrain(void);
extern void TiniConnect(int baud);
extern void TiniClose(void);

extern int LoadHexFile(char *path);
extern int SaveHexFile(char *path);
