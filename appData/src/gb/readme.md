# Simple VM for script-driven game boy games
Features:
- human readable assembler-like scripts
- rom banks support
- multi-threading

Notes:
- threads share same memory
- context's stack grows ahead

Instead of 100 words:
![scheme](/scheme.png)

Game structures overlaying:
![scheme](/scheme2.png)
