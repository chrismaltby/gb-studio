# gbdkjs-example-boilerplate

> GBDKJS Example Boilerplate

![Screenshot](screenshot.png?raw=true)

## GBDK.js Project

Visit the [gbdkjs.com](https://www.gbdkjs.com) website for more information.

[GBDK.js Documentation](https://www.gbdkjs.com/docs/)

## Dependencies

- [Emscripten](http://kripken.github.io/emscripten-site/)
- [GBDK](http://gbdk.sourceforge.net/) ([Mac Build](https://www.gbdkjs.com/downloads/gbdk-mac.zip))

Install both and make sure `emcc` and `lcc` are in your `$PATH`.

[More information](https://www.gbdkjs.com/docs/installation/) at the GBDK.js site.

## Build

```shell
git clone git@github.com:gbdkjs/gbdkjs-example-boilerplate.git;
cd gbdkjs-example-boilerplate;
npm install;
```

### Game Boy ROM

```shell
make rom;
open build/gb/game.gb;
```

### Emscripten 

```shell
make web;
live-server build/web;
```
