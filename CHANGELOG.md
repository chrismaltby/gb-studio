# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Norwegian localisation. [@thomas-alrek](https://github.com/thomas-alrek)
- CameraMoveTo speed fixes [@RichardULZ](https://github.com/RichardULZ)
- Fix for issue with multiframe actors animating when moving [@RichardULZ](https://github.com/RichardULZ)
- Fix for issue with cursor position moving while editing dialogue [@MattTuttle](https://github.com/MattTuttle)
- Add support for GameBoy Color palettes [@fydo](https://github.com/fydo)
- Add Settings section grouping project settings together and adding settings for custom keyboard controls and custom HTML header
- Fix issue where copy / pasting scenes would break actor connections in scripts

## [1.1.0]

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
