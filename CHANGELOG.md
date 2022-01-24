# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.3]

### Added

- Added event to determine if device is running on SGB
- Added event to determine if device is a GBA
- Added ability to choose from two keyboard layout options for tracker [@pau-tomas](https://github.com/pau-tomas)
- Added ability to to set the start playback position in music editor by clicking bar above piano roll [@pau-tomas](https://github.com/pau-tomas)
- Add engine support for text sounds [untoxa](https://github.com/untoxa)
- Added ability to use values between -32768 and 32767 in variable events [@Rebusmind](https://github.com/Rebusmind)
- Added ability to clamp to 8-bit while using multiply
- Added ability to see where automatic Fade In event will appear in Scene "On Init" script with option to disable or change speed
- Added missing label in Actor Show event [@ReyAnthony](https://github.com/ReyAnthony)
- Add vertical scrolling in last parallax viewport is Speed=1 [@um3k](https://github.com/um3k)
- Add palette name to tile palette select based on current preview scene [@ReyAnthony](https://github.com/ReyAnthony)
- Added event to manually seed random number generator

### Changed

- Changed if color supported event to return false when game is DMG even if run on color device
- Changed wording from "Reenable" to "Enable" for toggling events/else [@codyjb](https://github.com/codyjb)
- Update engine to latest hUGEDriver [untoxa](https://github.com/untoxa)
- Changed default .uge template to be blank [MOL-IS-MOL](https://github.com/MOL-IS-MOL)
- Updated to latest GBDK-2020
- Improved Math Functions clamp to not require branching
- Updated Polish localisation. [@ReptiIe](https://github.com/ReptiIe)
- Updated Simplified Chinese localisation. [@wcxu21](https://github.com/wcxu21) 

### Fixed

- Fixed blurry emulator when running web export on desktop Safari [@pau-tomas](https://github.com/pau-tomas)
- Fix issue where replacing trigger OnLeave script would replace OnEnter [@pau-tomas](https://github.com/pau-tomas)
- Fix issue replacing math expression variables in custom events [@pau-tomas](https://github.com/pau-tomas)
- Fix issue where some events when used in init scripts would cause the script to wait until the scene had faded in before continuing
- Fix music editor: Instrument name isn't editable  [@pau-tomas](https://github.com/pau-tomas)
- Fix music editor: Ticks per row field updates aren't reflected when playing the song [@pau-tomas](https://github.com/pau-tomas)
- Fix music editor: Wave form changes are not updating for instrument preview [@pau-tomas](https://github.com/pau-tomas)
- Improved engine GBA detection [untoxa](https://github.com/untoxa)
- Fix scroll jitter seen in top-down scenes [untoxa](https://github.com/untoxa)
- Save executing ctxs when saving game data [untoxa](https://github.com/untoxa)
- Fixed issue where scene may not fade in some cases where scene init script contained conditional events
- Fix keyboard accessibility for add/remove buttons in form fields [@rik-smeets](https://github.com/rik-smeets)
- Fixed issue causing Math event values > 128 to wrap as they were treated as signed 8-bit numbers [@Rebusmind](https://github.com/Rebusmind)
- Fixed clamp when adding/subtracting negative numbers
- Generate a new save hash when project changes to prevent crashes when loading invalid data [untoxa](https://github.com/untoxa)
- Fix crashes when using too many sprite tiles by using GBDK-2020 sprite hiding function [untoxa](https://github.com/untoxa)
- Fix rendering of garbage when no scene has loaded yet [untoxa](https://github.com/untoxa)
- Fix overlay hide [untoxa](https://github.com/untoxa)
- Fix issue where walking events was incorrectly replacing actorIds with $self$
- Fix issue with saving/loading patterns from UGE files [@pau-tomas](https://github.com/pau-tomas)
- Fixed issue where changing player sprite mid scene would write over actor tiles (still an issue using "Replace Default Sprite" with a larger than initial)  
- Fix playing note preview when adding to wave channel [@pau-tomas](https://github.com/pau-tomas)
- Fixed some fields not being localised correctly (such as the top left Project View Button)
- Fixed issue where random numbers were being seeded every call preventing them from being very random

## [3.0.2]

### Added

- Added in-game crash handler screen [untoxa](https://github.com/untoxa)
- Added support for 16-bit in flag events [@Rebusmind](https://github.com/Rebusmind)
- Compile files in parallel based on available CPU cores for system

### Changed

- Updated Portuguese localisation. [@toxworks](https://github.com/toxworks)
- Updated Simplified Chinese localisation. [@wcxu21](https://github.com/wcxu21) 
- Optimised game engine input script checks [untoxa](https://github.com/untoxa)
- Reimplemented GBSPack in pure JS as binary was incorrectly flagged by anti-virus software on Windows
- Updated French localisation. [@Toinane](https://github.com/Toinane)
- Player bounce event no longer deprecated
- Don't prevent jumping when overlapping actor in platform scenes

### Fixed

- Fixed some cases where assets would no longer live reload by switching to using chokidar glob syntax rather than regex filters [@RichardULZ](https://github.com/RichardULZ) 
- Allow tilesets with zero length [untoxa](https://github.com/untoxa)
- Fix issue where VM_LOCK was not affecting context switching [untoxa](https://github.com/untoxa)
- Properly detect grouped property fields for events inside custom scripts [@pau-tomas](https://github.com/pau-tomas)
- Detect variables in math expression events within Custom Scripts [@pau-tomas](https://github.com/pau-tomas)
- Rebuilt GBDK for Mac to support macOS versions below 10.15 [untoxa](https://github.com/untoxa)
- Hide sprites when overlay is fullscreen [untoxa](https://github.com/untoxa)
- Make sequences of control codes in strings "instant" [untoxa](https://github.com/untoxa)
- Fixed error when saving wave length in music editor [@pau-tomas](https://github.com/pau-tomas)
- Fixed copy/paste on Ubuntu
- Fixed codegen for Link Close event [@pau-tomas](https://github.com/pau-tomas)
- Fixed issue where world view would snap to center of selected scene each time a change was made [@tustin2121](https://github.com/tustin2121)
- Fixed accidental movement of scenes/drawing when panning with the middle mouse button [@tustin2121](https://github.com/tustin2121)

## [3.0.1]

### Added

- Improved console errors for gbvm scripts [@pau-tomas](https://github.com/pau-tomas)
- Improved warning message when no .mod files are found and music engine is set to GBT Player [@pau-tomas](https://github.com/pau-tomas)
- Additional tracker editor keyboard shortcuts [@RichardULZ](https://github.com/RichardULZ) 
- Added error message if music editor fails to save due to read only permissions
- Added ability to toggle if input scripts should override default button actions

### Changed

- Updated Polish localisation. [@ReptiIe](https://github.com/ReptiIe)
- Blank project updated to use hUGEDriver by default
- Reduced padding on scene info
- Engine "define" fields now written to state_defines.h file
- Scene info now highlights actor count in orange if reached (but not over) scene limit
- Animation state name input now includes pencil button to work closer to variable renaming

### Fixed

- Fixed error when using clamp in math events [@pau-tomas](https://github.com/pau-tomas)
- Updated 32-bit Windows app to use correct 32-bit GBDK-2020
- Fixed error when building if any "Actor Set Sprite Sheet" events link to deleted sprites
- Fix issue when gbvm scripts use .ARG10 and above [@RichardULZ](https://github.com/RichardULZ) 
- Fix issue where music preview would stop working after window loses focus [@RichardULZ](https://github.com/RichardULZ) 
- Fix issue where new template music and font files would be read only by default on Windows
- Fix issue where migrated emotes and default font would be read only by default on Windows
- Fix setting fade in / fade out speed
- Fix for issue migrating projects with references to avatars that no longer exist
- Fix issue where input scripts wouldn't override default button actions [untoxa](https://github.com/untoxa)
- Fix issue where input scripts could fire while interact scripts were running (VM is locked)
- Fix issue where game would crash if more than 19 actors are used in a single scene

## [3.0.0]

- Moved to new [GBVM](https://github.com/chrismaltby/gbvm) based game engine (big thanks to [untoxa](https://github.com/untoxa))
- Added sprite editor with support for large sprites and multiple animation states
- Added ability to define idle animations, jump and climb animations for platform scenes and hover animations for point and click scenes.
- Added hUGEDriver music support
- Added music editor for .uge files (thank you to [pau-tomas](https://github.com/pau-tomas/) + [Daid](https://github.com/Daid/) and [Superdisk](https://github.com/SuperDisk) for the inspiration and support)
- Added parallax background support
- Added math expression events to simplify performing calculations
- Added support for multiple saves slots
- Added ability to create .pocket files for use on Analogue Pocket 
- Allow sprites and backgrounds to share vram, lets you use more sprite tiles on backgrounds with fewer tiles
- Increased the number of background palettes available per scene to 8
- Added ability to set 8 sprite palettes per scene, sprites can choose which palette to use per 8px x 16px tile
- Allow cancelling a build in progress
- Add support for Super GB border images
- Add ability to store 3 save slots
- Add ability to fire script when leaving a trigger
- Added ability to use additional custom emotes by adding images to assets/emotes.
- Updated “Add Event” menu to group events and allow setting favourites.
- Moved emulator to use [binjgb](https://github.com/binji/binjgb)

## [2.0.0-beta5]

### Added

- Add new Splash screen with animated template previews, easier access to documentation and credits easter egg (click the power light)
- Add live preview of how dialogue will appear in game when hovering over "Display Dialogue" events using ascii.png, frame.png and avatar sprites
- Add character count to dialogue event text input (52 characters max, or 48 if using an avatar)
- Add autocomplete and syntax highlighting for variables and speed codes in dialogue

- Add Engine Property Fields for platfomer physics, 2d grid size, and fade style in settings
- Add Event: Engine: Field Update for changing platformer physics mid game
- Add 16bit variables for engine property fields only
- Create Engine.json with ejected engines, to add your own custom engine properties

- Add Navigation side bar to left of the editor, Accessible with Tab key and full keyboard navigation
- Navigation sidebar lists: All scenes, actors/triggers within each scene, Custom Events, Global Variables
- Navigation Clicking a variable opens a variable editor, to rename the variable, and list all uses of that variable in your project
- Alt click a variable field in any event (if currently a global variable) to open the variable editor
- Drag navigator sidebar completely to the left to hide it, to reenable it use the menu item "View / Show Navigator"

- Add GBDK 2020 v4.0.1

### Changed

- Increased line limit in dialogue boxes to four lines
- Replaced Fade To Black event with Engine props Fade to black
- Custom Events are now listed in navigator sidebar only
- Updated to GBDK2020 v4.0.1 for massive performance increase, new ejected engine mandatory
- Engine bank push pop functions replaced with __banked for performance increase

### Fixed

- Fix issue where sidebar tabs could become hidden if translation wasn't able to fit in space available

## [2.0.0-beta4]

### Added

- Add ability to override only some of the scene palettes in a Set Background Palette event by using the new "Don't Modify" option
- Add preferences window allowing manual override of temporary files location
- Add warning if too many actors are clustered close together in scene (only 10 actors can be onscreen at once)
- Add ability for input scripts to be attached to multiple buttons at once [@patrickmollohan](https://github.com/patrickmollohan)

### Changed

- Updated text events to use monospace font making it easier to determine how text will appear in game
- Removed dependency of XCode/Command Line Tools being installed on MacOS by no longer using GNU Make during build
- Add ability to shake vertically and diagonally in Camera Shake event [@Xeyler](https://github.com/Xeyler) + [@patrickmollohan](https://github.com/patrickmollohan)
- Change UI of Timer and Attach Script events to include tabs for visual consistency [@pau-tomas](https://github.com/pau-tomas)
- Decrease min width of project window to 640px to allow working on smaller screen sizes [@patrickmollohan](https://github.com/patrickmollohan)

### Fixed

- Fix issue with calling javascript functions from events prevent text cropping from working as expected
- Fix issue with text cropping in menu events where it was possible for menu items to span multiple lines
- Fix issue with text cropped where variables and speed codes contributed more characters to string length than they should
- Fix issue where renaming assets in file system would cause uses of that asset in the project to become disconnected
- Fix copy/paste to keep actor references in events and to preserve local variable names
- Input scripts override default button behaviour again matching 1.2.0 functionality [@pau-tomas](https://github.com/pau-tomas)

## [2.0.0-beta3]

### Fixed

- Fix DE localisation
- Fix issue where changing a scene's background image would not update the scene's dimensions until the project was reloaded.
- Fix issue where editing custom events would reset instance of the event to be labelled as "EVENT_CALL_CUSTOM_EVENT" [@pau-tomas](https://github.com/pau-tomas)
- Fix unnecessary full recompiles when new local variables are added [@RichardULZ](https://github.com/RichardULZ) 
- Fix bug in Platformer scenes where player faces the wrong way after changing direction for a few frames [@um3k](https://github.com/um3k)
- Fix bug causing crash when selecting values in the property dropdown [@pau-tomas](https://github.com/pau-tomas)
- Fix bug where hidden pinned actors would sometimes become visible while scrolling

## [2.0.0-beta2]

### Added

- Add ability to change scene transitions to "Fade To Black" through global setting with new event to change dynamically [@RichardULZ](https://github.com/RichardULZ) 
- Add menu item and keyboard shortcut to switch project, opening the recent projects list [@patrickmollohan](https://github.com/patrickmollohan)
- Add option to persist player sprite changes between scenes (was previously always persisted) unchecking this will cause the sprite change to only be temporary for the current scene, useful for menus or switching genre
- Add event to check if current device supports color [@pau-tomas](https://github.com/pau-tomas)
- Add support for property fields within Custom Events [@pau-tomas](https://github.com/pau-tomas)
- Add ability to clamp Add & Subtract events to within 0 to 255 without wrapping [@Jarod-Lee](https://github.com/Jarod-Lee)
- Dutch localisation. [@Auroriax](https://github.com/Auroriax)

### Fixed

- Fix issue with project path selector choosing first file in project preventing people from creating new projects [@RichardULZ](https://github.com/RichardULZ) 
- Fix issues using image and music assets with uppercase file extensions [@zdurgan](https://github.com/zdurgan)
- Fix issues with "!!!!" being interpreted as a dialogue speed command [@RichardULZ](https://github.com/RichardULZ) 
- Fix collision events which were not firing in Top Down scenes unless player was moving [@pau-tomas](https://github.com/pau-tomas)
- Fix display of scene connections when scene switch events are used in collision or movement scripts [@pau-tomas](https://github.com/pau-tomas)
- Fix display of coloured sprites to use 3 colors from palette rather than 4 matching how they appear in game
- Fix issue where extra destination markers get drawn when switching between connected scenes
- Fix camera centering on player to match 1.2.0
- Fix screen tearing during fade transitions

### Changed

- Sample project updated to include music by [@RichardULZ](https://github.com/RichardULZ) 
- Improved error message when player sprite sheet isn't set [@pau-tomas](https://github.com/pau-tomas)
- Improve wording on Enable Color mode modal to make it clearer that the change can be reversed
- Add GBT player and Mod2GBT from custom branch [@RichardULZ](https://github.com/RichardULZ) 
- Add Ch4 Noise pitch support, rounded to `C, D#, F#, A#, C`
- Add Ch1-3 Portamento (Pitch bends) `1xx` & `2xx` up to 7F (127 +/-)
- Add Ch1-2,4 Volume/Envelope propriatary effect `9ve`, vol 0-F, envelope down 1-7, up 9-F, 0/8 no envelope
- Change `Cxx` preserve last set envelope from `9ve`, to set no envelope again, use `9v0`
- Fix `Dnn` at end of song/pattern reading invalid data
- Fix unnececary audio pops on some effects
- Fix unexpected noise from effect only (at song start)
- Fix ch4 incorrect volume with effect only
- Fix Note cut `EC0`
- Updated Brazilian Portuguese localisation. [@laetemn](https://github.com/laetemn)
- Updated German localisation. [@WAUthethird](https://github.com/WAUthethird)
- Updated Portuguese localisation. [@toxworks](https://github.com/toxworks)

## [2.0.0-beta1]

### Added

- Add full color support, each scene can contain up to six 4-color palette (24 colors per scene) and seven different sprite palettes.
- Add additional genres to Scene Type dropdown, "Platformer", "Shoot Em' Up", "Point and Click" and "Adventure", each one affects player handling in that scene. A single project can use any/all genres as required
- Add "On Update" script to actors which calls on each frame allowing movement to be controlled manually.
- Add checkbox to handle collision detection in "Move To" event
- Add choice on "Move To" to move horizontally first, vertically first or to use diagonal movement. Default is horizontal to match previous functionality
- Add event to stop any actors's "On Update" script
- Add event to dynamically switch color palettes used in a scene
- Add palettes section for editing and creating color palettes  
- Add scene search functionality to World editor toolbar, if only a single scene matches view will scroll to center on that scene
- Add button to jump from Dialogue Review section to corresponding scene in Game World 
- Add color labels for identifying and grouping scenes
- Add support for larger background images, up to 2040px in either dimension, maximum width * height of image must be under 1,048,320
- Increase number of allowed actors and triggers per scene to 30. Up to 10 actors will be visible on screen at the same time.
- Add ability to pin actors to screen to use as simple HUD elements
- Add event to switch any actor's sprite sheet dynamically
- Add event to toggle if an actor should animate while stationary
- Add event to bounce player while in platform scenes
- Add ability to create collisions tiles that only affect a single direction e.g. for platforms that you can jump through from below.
- Add ability to mark tiles as Ladders (only affects Platform scenes)
- Add choice of 8px or 16px brush sizes when drawing collisions or coloring background
- Add ability to draw lines when drawing collisions or coloring background by holding shift and clicking
- Image errors such as too many unique tiles, image too large etc. are now displayed underneath image dropdown in World editor
- Cache compiled files as much as possible to reduce time required for repeated builds
- Add projectile and attack events to add weapons to the player or actors
- Add collision groups to actors/attacks/projectiles with collision scripts to run when an actor collides with a specific group (only player to actor and projectile/attack to actor supported, actor to actor collisions not supported)
- Add ability to eject game engine, allowing per project overriding of any project source file
- Migrated compiler to use [GBDK 2020](https://github.com/Zal0/gbdk-2020)
- Copy/Paste also includes any referenced custom events allowing easier movement between projects
- Commit hash included in About Window allowing easier identication of which version you are currently using [@pau-tomas](https://github.com/pau-tomas)
- Improve text drawing animation and add ability to fast forward text boxes by holding a button [@RichardULZ](https://github.com/RichardULZ) / [@pau-tomas](https://github.com/pau-tomas)
- Add ability to dynamically change text draw speed mid text field using commands "!S0!" for instant draw and "!S5!" for speed = 5 etc
- Game engine completely rewritten to make less top down rpg genre specific
- New engine performance optimisation [@RichardULZ](https://github.com/RichardULZ) 
- Merge events where the only difference was values being hard coded or coming from a variable like "Move To" and "Move To Using Variables" by adding button next to input that allows switching between variable, value or a new property type. Also allows mix of hard coded and variable values in single event. Feature known internally as union types
- Custom events updated to support union types [@pau-tomas](https://github.com/pau-tomas)
- Add additional Animation Speed option "None". Setting this will prevent actor from animating at all. Static actors will now cycle through frames while moving unless this value is set.
- Add support for macOS full screen mode

### Fixed

- Fix bug where deleting a custom event definition that was used multiple times in a single script would only delete the first instance of the event
- Fixed Ctrl + Z and Middle click behavior on Windows [@RichardULZ](https://github.com/RichardULZ) 
- Fix custom events issue where some events wouldn't show their variables in the custom event parameters [@pau-tomas](https://github.com/pau-tomas)
- Lots of bug fixes / helping get the open beta build ready [@pau-tomas](https://github.com/pau-tomas) and [@RichardULZ](https://github.com/RichardULZ)
- Prevent actor sprites from overlapping dialogue boxes
- Fix issues when trying to use more than 256 sprites in a single game
- Fix issues when saving progress if project contained more than 256 scenes

### Changed

- Pushing actors now uses a 16px x 16px collision box rather than 16px x 8px, this will make Sokoban puzzles work better but could cause issues if you depended on the old behaviour
- Scene connections now by default only shows connections to/from the currently selected scene. The old default is available in "View/Show Connections/All"
- When not in color mode the Game World section will display images in the same palette as the emulator
- Event "Attach Script To Button" now doesn't persist between scenes by default, old functionality is still available using a new "persist" checkbox but new events that depend on sprite memory layout may have issues when persist is enabled (Projectiles/Attack/Actor Set Sprite Sheet) 
- Top Down scenes now use the last pressed direction button for current movement direction improving controls when using a keyboard

### Removed

- Remove "Double Speed Mode" settings checkbox, when Color is enabled this is now enabled automatically
- Remove actor "Movement Type" dropdown, replaced with "On Update" script. Existing actors set to Random Walk / Random Rotation will be migrated automatically

## [1.2.1]

### Added

- Allow variables to be used in choice and menu events. [@pau-tomas](https://github.com/pau-tomas)
- Switching scene background will keep current collisions if image hasn't had collisions set already. [@RichardULZ](https://github.com/RichardULZ)

### Changed

- Updated Portuguese localisation. [@toxworks](https://github.com/toxworks)
- Updated Brazilian Portuguese localisation. [@junkajii](https://github.com/junkajii)

### Fixed

- Fix bug where color palettes would appear in different shades to provided hex codes when viewed in game
- Fix bug where event buttons would become stuck in paste mode when switching windows while holding Alt key
- Fix bug where projects could be made with invalid filenames
- Fix bug where collisions couldn't be placed if "Show Collisions" setting was off.
- Fix bug where variable lists sometimes showed old names.
- Fix bug where game engine would occassionally be corrupted in Window 10 builds [@chrismaltby](https://github.com/chrismaltby) + [@RichardULZ](https://github.com/RichardULZ)
- Fix bug where overlays would prevent timer scripts from running [@RichardULZ](https://github.com/RichardULZ)
- Fix bug where opening menu would modify text draw speed. [@pau-tomas](https://github.com/pau-tomas)

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
