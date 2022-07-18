"Enable Emulicious C debugging" will generate debug files for your rom, which you can use to step through code.

Requires emulicious https://emulicious.net/
vscode https://code.visualstudio.com/
and the Emulicious Debugger extension https://marketplace.visualstudio.com/items?itemName=emulicious.emulicious-debugger  

in VS Code, Configure emulicious debugger's "extension settings" and set the path, eg "/Applications/Emulicious"

Set your temporary folder in gbstudio to a convenient location in the prefrences (or here, since you found this file)
Open this gbstudio temporary folder in vscode, 

Generate a rom via the build or run buttons in gbstudio with "Enable Emulicious C debugging" checked

you can press F5 to launch emulicious with your rom and begin debugging
Or see other methods of running with emulicious in the extension's decription.

