# GB Studio

[![Github Actions Status](https://github.com/chrismaltby/gb-studio/actions/workflows/main.yml/badge.svg?branch=develop)](https://github.com/chrismaltby/gb-studio/actions?query=branch%3Adevelop)

Copyright (c) 2024 Chris Maltby, released under the [MIT license](https://opensource.org/licenses/MIT).

Patreon: [gbstudiodev](https://www.patreon.com/gbstudiodev)  
Twitter: [@maltby](https://www.twitter.com/maltby)  
Reddit: [/r/gbstudio](https://www.reddit.com/r/gbstudio)  
Discord: [Join Chat](https://discord.gg/bxerKnc)

GB Studio is a quick and easy to use retro adventure game creator for Game Boy available for Mac, Linux and Windows.
For more information see the [GB Studio](https://www.gbstudio.dev) site

![GB Studio](gbstudio.gif)

GB Studio consists of an [Electron](https://electronjs.org/) game builder application and a C based game engine using [GBDK](http://gbdk.sourceforge.net/).

## Installation

Download a release for your operating system from the [GB Studio Downloads](https://www.gbstudio.dev/download) page.

Or to run from source, clone this repo then:

- Install [NodeJS](https://nodejs.org/) (required version is given in [.nvmrc](.nvmrc))

```bash
> cd gb-studio
> corepack enable
> yarn
> npm start
```

GB Studio currently uses Node 21.7.1. If you have [NVM](https://github.com/nvm-sh/nvm) installed you can use the included `.nvmrc` to switch to the supported Node version. 

```bash
> cd gb-studio
> nvm use
```

## GB Studio CLI 

Install GB Studio from source as above then

```bash
> npm run make:cli
> yarn link
# From any folder you can now run gb-studio-cli
> $(yarn bin gb-studio-cli) -V
4.1.2
> $(yarn bin gb-studio-cli) --help
```

### Update the CLI

Pull the latest code and run make:cli again, yarn link is only needed for the first run.

```bash
> npm run make:cli
```

### CLI Examples

- **Export Project**

    ```bash
    > $(yarn bin gb-studio-cli) export path/to/project.gbsproj out/
    ```
    Export GBDK project from gbsproj to out directory

- **Export Data**
    ```bash
    > $(yarn bin gb-studio-cli) export -d path/to/project.gbsproj out/
    ```
    Export only src/data and include/data from gbsproj to out directory
- **Make ROM**
    ```bash
    > $(yarn bin gb-studio-cli) make:rom path/to/project.gbsproj out/game.gb
    ```
    Make a ROM file from gbsproj

- **Make Pocket**
    ```bash
    > $(yarn bin gb-studio-cli) make:pocket path/to/project.gbsproj out/game.pocket
    ```
    Make a Pocket file from gbsproj

- **Make Web**
    ```bash
    > $(yarn bin gb-studio-cli) make:web path/to/project.gbsproj out/
    ```
    Make a Web build from gbsproj

## Documentation

[GB Studio Documentation](https://www.gbstudio.dev/docs)

## Note For Translators

If you'd like to help contribute new language localisations to GB Studio you can do so by submitting pull requests adding or updating the JSON files found here https://github.com/chrismaltby/gb-studio/tree/develop/src/lang

If you're looking to update an existing translation with content that is missing, there is a handy script that lists keys found in the English localisation that are not found and copies them to your localisation

```bash
npm run missing-translations lang
# e.g. npm run missing-translations de
# e.g. npm run missing-translations en-GB
```
