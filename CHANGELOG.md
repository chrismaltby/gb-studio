# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Fix bug where collisions couldn't be placed if "Show Collisions" setting was off.
- Fix bug where variable lists sometimes show show old names.
- Fix bug where opening menu would modify text draw speed. [@pau-tomas](https://github.com/pau-tomas)
- Switching scene background will keep current collisions if image hasn't had collisions set already. [@RichardULZ](https://github.com/RichardULZ)
- Updated Brazilian Portuguese localisation. [@junkajii](https://github.com/junkajii)
- Allow variables to be used in choice and menu events. [@pau-tomas](https://github.com/pau-tomas)

## [1.2.0]

# Added

- Add OnInit script to each actor.
- Add preview in dropdowns for scenes, actors and sprite sheets.
- Add ability to paste events by holding Alt while clicking event buttons.
- Add language select to view menu.
- Generate backups of previous version before saving.
- Sidebar supports two column layout when wide enough.
- Each actor/trigger/scene given four local variables.
- Add ability to remap keyboard controls.
- Add ability to set custom HTML header in web builds.
- Add custom cursors depending on tool state.
- Alternating row colors while scripting.
- Add ability to disable events.
- Add ability to disable else branch in conditional events.
- Add ability to use any variable in text (no longer only first 100).
- Add event to disable/enable collisions per actor.
- Add Switch event.
- Add Settings section grouping project settings together and adding settings for custom keyboard controls and custom HTML header.
- Add support for GameBoy Color palettes. [@fydo](https://github.com/fydo)
- Add support for GameBoy Color double CPU mode. [@pau-tomas](https://github.com/pau-tomas) [@RichardULZ](https://github.com/RichardULZ)
- Add menu event. [@pau-tomas](https://github.com/pau-tomas)
- Add 'Self' to actor selector. [@pau-tomas](https://github.com/pau-tomas)
- Add custom events functionality. [@pau-tomas](https://github.com/pau-tomas)
- Add avatars to text dialogue. [@pau-tomas](https://github.com/pau-tomas)
- Add support for bit flag variables in scripting. [@pau-tomas](https://github.com/pau-tomas)
- Add Comments in scripting. [@ManuGamesDev](https://github.com/ManuGamesDev)
- Add sound effects. [@gregtour](https://github.com/gregtour)
- Add timer events. [@gregtour](https://github.com/gregtour)
- Add Gamepad support [@bbbbbr](https://github.com/bbbbbr)
- Add events to save and restore actor direction using variables. [@ManuGamesDev](https://github.com/ManuGamesDev)
- German localisation. [@WAUthethird](https://github.com/WAUthethird)
- Spanish localisation. [@WAUthethird](https://github.com/WAUthethird)
- Norwegian localisation. [@thomas-alrek](https://github.com/thomas-alrek)
- Italian localisation. [@marcosecchi](https://github.com/marcosecchi)
- Latin American Spanish localisation. [@foobraco](https://github.com/foobraco)
- Polish localisation. [@MajkelKorczak](https://github.com/MajkelKorczak)
- Korean localisation. [@juni070127](https://github.com/juni070127)
- Japanese localisation. [@cubicstyle](https://github.com/cubicstyle)
- Scots localisation. [@Cobradabest](https://github.com/Cobradabest)

### Changed

- Update Windows 32-bit to use GBDK 2.96.
- Prevent actors from leaving scene edges.
- Refactor to handle larger project files.
- Rebuilt event system allowing easier community contributions.
- Update Windows 64-bit to use GBDK 2.96. [@gregtour](https://github.com/gregtour)
- Updated Brazilian Portuguese localisation. [@junkajii](https://github.com/junkajii)
- Updated Portuguese localisation. [@toxworks](https://github.com/toxworks)
- Improve emulator audio. [@RichardULZ](https://github.com/RichardULZ)
- Improve keyboard controls in event search. [@allie](https://github.com/allie)
- Improve template.mod music file. [@RichardULZ](https://github.com/RichardULZ)

### Fixed

- Fixed MBC1 support.
- Fix issues flushing sava data on Windows
- Fix issue where copy / pasting scenes would break actor connections in scripts
- Fix collisions at bottom edge of screen.
- Ignore invalid PNG images when loading project.
- Release held buttons when emulator loses focus.
- Fix for issue with cursor position moving while editing dialogue [@MattTuttle](https://github.com/MattTuttle)
- Fix GBTplayer ch4 pan fx [@RichardULZ](https://github.com/RichardULZ)
- Fix bug when Actor Invoke is used with conditional statement [@RichardULZ](https://github.com/RichardULZ)
- Fixed issue where multi-frame static actors would animate while moving [@RichardULZ](https://github.com/RichardULZ)
- CameraMoveTo speed fixes [@RichardULZ](https://github.com/RichardULZ)

## [1.1.0] - 2019-05-18

### Added

- Support for animating sprites by cycling between frames of animation.
- Ability to use variables in text by using new variable id placeholders "You have $01$ gold".
- Events for Saving and Loading your game.
- Event for attaching scripts to button inputs.
- Extra actor commands for setting relative position, check facing direction. [@thomas-alrek](https://github.com/thomas-alrek)
- Math commands, random numbers, add, subtract, multiply and divide variables with each other other and much more. [@thomas-alrek](https://github.com/thomas-alrek)
- Events for pushing and popping scenes from a stack allowing nested menus to be created returning back to your initial position when closed. [@thomas-alrek](https://github.com/thomas-alrek)
- Event to invoke a script from another actor. [@thomas-alrek](https://github.com/thomas-alrek)
- Pan around world viewer using Alt + click, middle click or by clicking and dragging in the space between scenes.
- Ability to control zoom using pinch gestures or Ctrl + Mouse Wheel [@thomas-alrek](https://github.com/thomas-alrek)
- Drag and drop actors and triggers between scenes.
- Ability to type text directly into Add Event search and have it create a new Display Text module with the text you entered.
- Event for controlling text open, draw and close animation speeds. [@RichardULZ](https://github.com/RichardULZ)
- All script events are now collapsable and can be renamed.
- Dark mode theme selection to Windows and Linux.
- Ability to select GameBoy cartridge type.
- Ability to control movement and animation speed of actors.
- Support for copy and paste for scenes, actors, triggers and scripts.
- Event groups allowing you to better organise your scripts.
- Notes fields to project, scenes, actors and triggers. [@thomas-alrek](https://github.com/thomas-alrek)
- Splash page now has a list of recently opened projects.
- Editor sidebar now resizable. [@thomas-alrek](https://github.com/thomas-alrek)
- Support for 32-bit Windows.
- Support for localisation of the app (now accepting pull requests for all languages).
- Chinese localisation. [@InchouRyu](https://github.com/InchouRyu)
- Brazilian Portuguese localisation [@junkajii](https://github.com/junkajii)
- Portuguese localisation [@toxworks](https://github.com/toxworks)

### Changed

- Display text event now supports up to 3 lines of text.
- Warnings when image assets don't follow specifications are now more noticeable in build phase.

### Fixed

- Fixed audio bugs in emulator where sound would pop as emulator opened and closed.
- Fixed vsync tearing. [@RichardULZ](https://github.com/RichardULZ)
- Input handling fixes on Windows build.
- Lots of other bug fixes.

## [1.0.0] - 2019-04-17

Initial GB Studio Public Release
