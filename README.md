# GB Studio 2 Beta


[![CircleCI](https://circleci.com/gh/chrismaltby/gb-studio/tree/develop.svg?style=shield)](https://circleci.com/gh/chrismaltby/gb-studio/tree/develop)

Copyright (c) 2020 Chris Maltby, released under the [MIT license](https://opensource.org/licenses/MIT).

Twitter: [@maltby](https://www.twitter.com/maltby) 

Reddit: [/r/gbstudio](https://www.reddit.com/r/gbstudio)  
Discord: [Join Chat](https://discord.gg/bxerKnc)


GB Studio is a quick and easy to use retro adventure game creator for Game Boy available for Mac, Linux and Windows.
For more information see the [GB Studio](https://www.gbstudio.dev) site

![GB Studio](gbstudio.gif)

GB Studio consists of an [Electron](https://electronjs.org/) game builder application and a C based game engine using [GBDK](http://gbdk.sourceforge.net/), music is provided by [GBT Player](https://github.com/AntonioND/gbt-player)

## Beta builds

These builds reflects the latest changes from the `v2beta` branch and are updated automatically. It is recommended to make a backup of your project before using any of these versions.

#### macOS

[![MacOS](https://img.shields.io/static/v1.svg?label=&message=64%20bit&color=blue&logo=apple&style=for-the-badge&logoColor=white)](https://circleci.com/api/v1.1/project/github/chrismaltby/gb-studio/latest/artifacts/0/builds/gb-studio-v2beta-darwin_x86_64.zip?branch=v2beta&filter=successful)

#### Linux

[![DEB](https://img.shields.io/static/v1.svg?label=&message=deb&color=blue&logo=Ubuntu&style=for-the-badge&logoColor=white)](https://circleci.com/api/v1.1/project/github/chrismaltby/gb-studio/latest/artifacts/0/builds/gb-studio-v2beta-linux_x86_64.deb?branch=v2beta&filter=successful)
[![RPM](https://img.shields.io/static/v1.svg?label=&message=RPM&color=blue&logo=linux&style=for-the-badge&logoColor=white)](https://circleci.com/api/v1.1/project/github/chrismaltby/gb-studio/latest/artifacts/0/builds/gb-studio-v2beta-linux_x86_64.rpm?branch=v2beta&filter=successful)

#### Windows

[![Windows_x86_64](https://img.shields.io/static/v1.svg?label=&message=64%20bit&color=blue&logo=windows&style=for-the-badge&logoColor=white)](https://circleci.com/api/v1.1/project/github/chrismaltby/gb-studio/latest/artifacts/0/builds/gb-studio-v2beta-windows_x86_64.zip?branch=v2beta&filter=successful)
[![Windows_x86](https://img.shields.io/static/v1.svg?label=&message=32%20bit&color=blue&logo=windows&style=for-the-badge&logoColor=white)](https://circleci.com/api/v1.1/project/github/chrismaltby/gb-studio/latest/artifacts/0/builds/gb-studio-v2beta-windows_x86.zip?branch=v2beta&filter=successful)


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

```
> npm run make:cli

> yarn link

# From any folder you can now run gb-studio-cli
> gb-studio-cli -V
2.0.0-beta5

> gb-studio-cli --help
```

### Update the CLI

Pull the latest code and run make:cli again, yarn link is only needed for the first run.

```
> npm run make:cli
```

### CLI Examples

- **Export Project**

    ```
    gb-studio-cli export path/to/project.gbsproj out/
    ```
    Export GBDK project from gbsproj to out directory

- **Export Data**
    ```
    gb-studio-cli export -d path/to/project.gbsproj out/
    ```
    Export only src/data and include/data from gbsproj to out directory
- **Make ROM**
    ```
    gb-studio-cli make:rom path/to/project.gbsproj out/game.gb
    ```
    Make a ROM file from gbsproj
- **Make Web**
    ```
    gb-studio-cli make:web path/to/project.gbsproj out/game.gb
    ```
    Make a Web build from gbsproj

## Documentation

Documentation is not yet available for the v2 beta, for previous builds refer to the following:

[GB Studio Documentation](https://www.gbstudio.dev/docs)

