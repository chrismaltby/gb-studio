# GB Studio


[![CircleCI](https://circleci.com/gh/chrismaltby/gb-studio/tree/develop.svg?style=shield)](https://circleci.com/gh/chrismaltby/gb-studio/tree/develop)

Copyright (c) 2021 Chris Maltby, released under the [MIT license](https://opensource.org/licenses/MIT).

Twitter: [@maltby](https://www.twitter.com/maltby) 

Reddit: [/r/gbstudio](https://www.reddit.com/r/gbstudio)  
Discord: [Join Chat](https://discord.gg/bxerKnc)


GB Studio is a quick and easy to use retro adventure game creator for Game Boy available for Mac, Linux and Windows.
For more information see the [GB Studio](https://www.gbstudio.dev) site

![GB Studio](gbstudio.gif)

GB Studio consists of an [Electron](https://electronjs.org/) game builder application and a C based game engine using [GBDK](http://gbdk.sourceforge.net/), music is provided by [GBT Player](https://github.com/AntonioND/gbt-player)

## Installation

Download a release for your operating system from the [GB Studio Downloads](https://www.gbstudio.dev/download) page.

Or to run from source, clone this repo then:

- Install latest stable [NodeJS](https://nodejs.org/)
- Install [Yarn](https://yarnpkg.com/)

```bash
> cd gb-studio
> yarn
> npm start
```

## GB Studio CLI 

Install GB Studio from source as above then

```bash
> npm run make:cli
> yarn link
# From any folder you can now run gb-studio-cli
> gb-studio-cli -V
3.0.0
> gb-studio-cli --help
```

### Update the CLI

Pull the latest code and run make:cli again, yarn link is only needed for the first run.

```bash
> npm run make:cli
```

### CLI Examples

- **Export Project**

    ```bash
    > gb-studio-cli export path/to/project.gbsproj out/
    ```
    Export GBDK project from gbsproj to out directory

- **Export Data**
    ```bash
    > gb-studio-cli export -d path/to/project.gbsproj out/
    ```
    Export only src/data and include/data from gbsproj to out directory
- **Make ROM**
    ```bash
    > gb-studio-cli make:rom path/to/project.gbsproj out/game.gb
    ```
    Make a ROM file from gbsproj
- **Make Web**
    ```bash
    > gb-studio-cli make:web path/to/project.gbsproj out/
    ```
    Make a Web build from gbsproj

## Documentation

[GB Studio Documentation](https://www.gbstudio.dev/docs)

