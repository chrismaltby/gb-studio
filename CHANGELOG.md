# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add ability to define constant values, compared to variables these don't take any extra memory when used in game
- Add ability to select all scenes with Ctrl/Cmd + A from Game World view
- Add plugin manager for installing plugins from the official plugin repository, accessible from the menu at `Plugins / Plugin Manager`
- Add support for theme, localization and project template plugins
- Add ability to right click a scene to "Run From Here" allowing quick preview of a specific scene. Optionally can only include the selected scenes for faster build previews in large projects.
- Add events "Load Projectile Into Slot" and "Launch Projectile In Slot" to allow more advanced control over setup and launch of projectiles and changing the loaded projectiles at run time
- Add ability to hover over tiles in debugger VRAM preview to see tile memory address information [@pau-tomas](https://github.com/pau-tomas)
- Add animation states to generated `game_globals.h` allowing use from engine code [@Mico27](https://github.com/Mico27)
- Add ability to change collision layer opacity in World view when collision tool is selected [@Q-Bert-Reynolds](https://github.com/Q-Bert-Reynolds)
- Add ability for engine plugins to define new, per scene, collision tile types in `engine.json` file [@Q-Bert-Reynolds]
- Add ability to show the raw collision tile values when editing collisions in world view
- Add ability to ctrl/cmd + click frames in Sprite Editor to toggle multi select or shift + click to select range
- Add right click context menu to frames in Sprite Editor allowing copy/paste/clone/delete to be performed on all selected frames
- Add ability to search and add scripts by name when adding events instead of needing to add a "Call Script" event and selecting the script manually from the dropdown each time [@pau-tomas](https://github.com/pau-tomas)
- Add ability to quickly create "Comment" events by typing the comment text in the Add Event search field and choosing "Comment" menu item [@pau-tomas](https://github.com/pau-tomas)
- Add text code `!Wait` to allow pausing dialogue until an amount of time/frames has elapsed or a selected button has been pressed
- Add setting to toggle GBC color correction. Disable color correction to closer match how colors will appear on modern hardware
- Add ability to read camera properties (tile/pixel position, deadzone and offset) within script values [@pau-tomas](https://github.com/pau-tomas)
- Add ability to mute audio of inbuilt emulator from menu "Window / Play Window / Mute Audio"
- Add ability to override "Color Only" setting per scene in color projects, allowing "Color Only" scenes in a mixed project or monochrome compatible scenes in a "Color Only" project. Right click on a scene and select "Color Mode Override"
- Add events "Pause Logic For Scene Type" and "Resume Logic For Scene Type" allowing manual control of if the scene's update function should be running or not. You can use this when running multi-threaded scripts (such as a cutscene with multiple actors moving at once) to prevent player input while the script is running.
- Add support for characters outside of the basic multilingual plane in font mappings (such as emoji) e.g. `"😊": 34`
- Add support for multiple character sequences to be replaced in font mappings e.g. `"EURO": 128`
- Add support for font mappings to output multiple character codes for a single input e.g. `"X": [72, 69, 76, 76, 79]`
- Add ability to click label to the right of ROM usage bar to toggle between showing ROM usage values as byte values rather than rounding to KiB/MiB
- Generate file `bank_usage.txt` when exporting ROM giving a breakdown of which assets were assigned to each memory bank and how many bytes were used
- Add support for running GB Studio on Linux ARM64 (including Raspberry Pi)
- Add "globals.i" file when exporting ROM containing all variable addresses. Allows integration with emulators such as [GodotBoy](https://godotengine.org/asset-library/asset/2920) for handling achievements and other game/rom interactions
- Add ability to edit scene type (Platformer/TopDown etc.) global settings from Scene sidebar by clicking Cog button rather than needing to go to Settings page.
- Add option to prevent backtracking in "Camera Move To Lock On Player" event to stop scroll from following player in selected directions
- Add event "Set Camera Lock To Player", with same functionality as the move to variant but which will be called before automatic screen fade in event
- Add new sprite animation types "Horizontal" and "Horizontal + Movement" for creating sprites which can only face left or right
- Add ability for engine plugins to define constants, accessible from GBVM scripts, to reduce need for magic numbers
- Added new features to Platformer scene type based on Platformer+ plugin. Functionality like dashing, double jump, coyote time, fall through, wall jumps, knockback are now included in the inbuilt Platformer, each feature is optional and if disabled will not affect your game's performance.
- Add ability for actors in Platformer scenes to be marked as "Solid" or "Platform" allowing moving platforms. Scene plugins can opt in to this also
- Add new event "Attach Script To Platformer Event Callback" allowing scripts to be triggered by events occuring within platformer scenes
- Add support for setting per scene camera bounds, constraining the min/max scrollable area
- Add a "Set Camera Bounds" event to allow scripts to adjust min/max scroll limits at runtime

### Changed

- Optimised performance of "Show Connections" calculations by moving most of the effort to a thottled Worker thread. This also improves script editing performance when Connections are visible.
- "Switch" event updated to allow use of constant values for each branch condition
- Optimised compilation of backgrounds by reusing tileset data where possible if common tilesets are used [@Mico27](https://github.com/Mico27)
- Moved `.gbsres` files for assets to the same folder as the asset files. Allows asset plugins to include `.gbsres` e.g sprite asset pack plugins can include animations
- Optimised script editor by throttling the processing that was occuring on every key press
- Update to latest [GBVM](https://github.com/chrismaltby/gbvm)
- Improved collision handling for ladders and one-way platforms in the Platformer scene type. Ladders now use the player's bottom edge for anchoring, and one-way platforms no longer snap the player to the platform when colliding from below [@Steinbeuge](https://github.com/Steinbeuge)
- Ladder collision tile now only visible on Platform scenes by default, edit `engine.json` to add per scene collision tile types
- New instances of prefabs use prefab's name by default
- Update "Wait" event to support using variable values for wait time [@pau-tomas](https://github.com/pau-tomas))
- Toggle multi selection of scenes action changed to ctrl/cmd + click to be more consistent with OS level defaults + new sprite editor frame selection
- Font PNGs that are 128px tall (16 tile rows) now map tiles starting from ASCII code 0 instead of 32, enabling support for drawing control characters (ASCII 0–31). To draw characters with codes less than 32 they must be escaped with `\005` e.g. to draw character code 7 use `\005\007` (note: this is octal so code 19 would be `\005\023`)
- Optimised code generation when using properties (actor tileX, camera deadzone etc.) in values
- Optimised Actor Move Relative code generation
- Updated "Actor Move To" and "Actor Move Relative" to allow specifying if Walls, Actors, or none or both should be used for collisions
- Change disabled event styling to use a red background, distinguishing them from comment events
- Updated Polish localisation. [@ReptiIe](https://github.com/ReptiIe)
- Updated Japanese localisation. [@tomo666](https://github.com/tomo666)
- Updated Spanish localisation. [@JimScope](https://github.com/JimScope)
- Updated German localisation. [@gonzoMD](https://github.com/gonzoMD) [@Sencaid](https://github.com/Sencaid)
- Updated to latest [GBDK-2020](https://github.com/gbdk-2020/gbdk-2020)

### Fixed

- Fix issue where errors in watched files could cause application to crash
- Fix issue where quickly clicking "Create Project" button during project creation could prevent new project from opening
- Fix issue where CLI tool was ignoring project's debugger enabled setting causing debugger comments to always be included in generated gbvm code
- Fix tileset preview in dropdowns for 16px tiles
- Fix issue where instanced prefabs were showing incorrect icons in actor select inputs
- Fix issue preventing engine plugins stored in subfolders from being included in project
- Fix bottom margins when using GB Printer [@untoxa](https://github.com/untoxa)
- Fix variable uses list which wasn't including variable "0"'s uses in text fields
- Fix issue where "Set Animation Frame" event wouldn't allow frame values greater than 25
- Fix issue causing "Dialogue Multiple Choice" event to cut off menu items early
- Fix issue where changing the dimensions of a sprite png image could cause the sprite editor's tile palette to display incorrectly
- Fix line numbers in code editor for GBVM scripts with more than 999 lines
- Fix issue preventing projects being created with the name "project"
- Fix issue without-of-bounds memory writes on 8-bit values in engine field initialisation [@michel-iwaniec](https://github.com/michel-iwaniec)
- Fix issue preventing checkbox type working in engine fields [@pau-tomas](https://github.com/pau-tomas)
- Fix UI palette text control code. Palette indices now go from 1 to 8, because zero byte is a string terminator [@untoxa](https://github.com/untoxa)
- Fix issue where migrating old projects could cause gbvm symbols to become empty, preventing build from completing (opening a broken project will now automatically fix this issue)
- Fix issue where sprites could end up with empty state id values
- Fix issue where script labels could may not match script behaviour when referring to deleted actors (dropdown would say Self, label would say Player, game would use Self)
- Fix issue where migrating older projects to the latest version would sometimes cause auto generated gbvm symbols to change
- Fix issue where project migrations were not being applied to prefab script overrides
- Fix issue where scene change and projectile load events within a scene init script couldn't occur before the auto fade in event
- Fix default template PNG assets to only contain valid colors as defined in the GB Studio documentation [@mxashlynn](https://github.com/mxashlynn)
- Fix "spawn cmd.exe" issue on Windows when "%SystemRoot%\system32" is missing from Path environment variable
- Fix issue where changing the size of a background image would cause the collision and color tiles to be reset
- Fix issue where clicking "Show Navigator" toolbar button would not cause "Show Navigator" option in menu to be checked
- Fix issue where font mappings were not being displayed in app text previews
- Fix overflow warning when using "Fixed Position" parallax layers
- Fix issue where referenced tilesets from event plugins were not always being included in the built project [@Mico27](https://github.com/Mico27)
- Fix issue where mask values were not being used correctly while painting collisions tiles [@Mico27](https://github.com/Mico27)

## [4.1.3] - 2024-09-16

### Changed

- Updated Spanish localisation. [@doomer6699](https://github.com/doomer6699)
- Improved error message that appears when project fails to open due to broken plugins

### Fixed

- Fix issue where adding a new song wouldn't warn about unsaved changes in current song
- Fix issue where adding a song with an already existing name wouldn't auto select the newly created song
- Fix issue where scene connection lines could get stuck in place if custom scripts that change scenes are called multiple times from the same scene
- Fix issue where "Replace Script" confirmation alert would appear when pasting sometimes even if the custom script hadn't been modified
- Fix issue preventing building projects containing a "Play Music" event but no music
- Fix issue where dialogue script events could cause horizontal scroll bars to appear in script editor when column was not wide enough to display all tabs
- Fix issue where errors causing the build process to end early where not being display correctly in the Build Log
- Fix issue preventing build when a scene includes a common tileset that has been deleted

## [4.1.2] - 2024-09-09

### Added

- Add ability to remove a single project from the recent files list by clicking "X" button that appears on hover

### Changed

- Update build log so the scripts with GBVM errors will display a link to edit the script which needs fixing.
- When trying to open a project that has been deleted it will be removed from the recent projects list
- Build process now runs in a Worker thread, meaning long builds will no longer cause the UI to become unresponsive

### Fixed

- Fix overflow of actor position that can occur when using "Move Relative" event near scene edges
- Fix issue causing crash when trying to preview an FX Hammer effect index that doesn't exist
- Fix issue building game when playing FX Hammer sound effect that doesn't exist (overflowed values will clamp to available range)
- Fix issue where migrate project confirmation dialog would appear behind project window on Linux
- Fix issue where "Display Dialogue" event would inconsistently pause between each dialogue in a multi dialogue sequence
- Fix issue where text scroll would not scroll first character of each line of text when using avatars

## [4.1.1] - 2024-09-04

### Added

- Add desktop icons for Linux deb and rpm packages [@wbrawner](https://github.com/wbrawner)

### Changed

- Update build log so the scripts that are too large to fit in GB memory will display a link to edit the script which needs reducing.
- Updated Spanish localisation. [@doomer6699](https://github.com/doomer6699)

### Fixed

- Fix issue where custom script gbvm symbols would not always match the ones you defined
- Fix issue where identical custom scripts would share the same gbvm symbol
- Fix wording on sound effect context menu. Now says "Delete Sound Effect" rather than "Delete Song"
- Fix variable uses list to include variables referenced in text and expressions
- Fix label in Switch event for branch when value is "0"

### Removed

- Removed "Optimise ROM For" setting as it would cause issues when changed from default value

## [4.1.0] - 2024-09-02

### Added

- Add ability to create reusable actor and trigger "prefabs"
- Add ability to set reusable "preset" values on "Display Dialogue" and "Launch Projectile" events
- Add "Draw Text" event allowing drawing text directly to background or overlay (based on "Display Background Text" plugin by [@pau-tomas](https://github.com/pau-tomas))
- Add "Set Overlay Scanline Cutoff" event allowing you to show overlays at the top of the screen
- Add "Close Non-Modal Dialogue" event, required if using "Close When" -> "Never" option in updated "Display Dialogue" event.
- Add "Mute Channel" event allowing control over which music channels are active or muted (based on "Mute Channel" plugin by [@pau-tomas](https://github.com/pau-tomas))
- Add "Set Dialogue Frame" event allowing the dialogue frame image to be dynamically replaced with any 24px x 24px tileset (based on "Set Dialogue Frame" plugin by [@pau-tomas](https://github.com/pau-tomas))
- Tilesets asset folder added to all sample projects [@pau-tomas](https://github.com/pau-tomas)
- Add `_stackPushVariable(variable)` and `_isIndirectVariable(variable)` helpers for use in plugins
- Add "View Script Uses" feature accessible from the script context menu, allowing you to see all places where a script has been used in your project
- Add ability to change compiler optimisation settings in Build Options section on Settings page [@patrickmollohan](https://github.com/patrickmollohan)
- Add event "Set Actor Collision Bounding Box" to modify collision shape
- Add event "Set Text Sound Effect" to set a sound effect to play as each dialogue text character is displayed
- When deleting scripts, you are now given the option to also delete all "Call Script" events that reference the script
- Add ROM usage monitor to Build Log showing how much free space is available before the next ROM size increase [@pau-tomas](https://github.com/pau-tomas)
- Add "Print Using GB Printer" event to send either the current Background or Overlay to a connected GB Printer. Game must be run on real hardware with a printer connected for this feature to work (based on "Print Screen Background" plugin by [@pau-tomas](https://github.com/pau-tomas))
- Add "Set Camera Property" event for changing camera deadzone and offset values
- Add "Actor Effects" event for playing effect animations on actors (based on "Actor FX" plugin by [@pau-tomas](https://github.com/pau-tomas))
- Add "Thread Start" and "Stop Thread" events allowing running scripts in the background.

### Changed

- Changed project file structure. The `.gbsproj` file will now contain very little information, instead each scene, actor, trigger, etc is individually stored in a `.gbsres` file in a `projects/` folder allowing for better support for version control + working in teams. Migration is automatic on first save after loading a project
- Update to latest [GBVM](https://github.com/chrismaltby/gbvm)
- Optimise subpixel calculations in Actor and Camera Move events by using bitwise shifting rather than multiplication/division
- Updated Polish localisation. [@ReptiIe](https://github.com/ReptiIe)
- Updated Japanese localisation. [@tomo666](https://github.com/tomo666)
- Updated French localisation. [@Pomdap](https://github.com/Pomdap)
- Updated Spanish localisation. [@doomer6699](https://github.com/doomer6699)
- Only the inbuilt scene types that were actually used in your game are now compiled, improving build time if only some scene types were used
- Improve build cancelling: Stops spawned processes immediately rather than waiting for in progress processes to complete
- Changing the engine field in a "Store Engine Field In Variable" event no longer resets the variable
- Build time now shown in seconds when < 60s and minutes+seconds when >= 60s
- Update Scene Pop events to allow setting Fade Speed as "Instant" [@pau-tomas](https://github.com/pau-tomas)
- "Launch Projectile" event fields organised into multiple tabs
- Update "Display Dialogue" event to include tabs with additional layout and behavior options (based on "Display Advanced Dialogue" plugin by [@pau-tomas](https://github.com/pau-tomas))
- Update "Set Sprite Palettes" event to allow restoring default palettes

### Fixed

- Fix localisation of collision mask input field
- Fix issue where using variables used within Not, Rnd(), Abs(), etc. in scripts were not being listed as parameters
- Fix Variable Uses list to include variables used in script value calculations
- Fix tilemap generation when number of unique tiles is above limits to match behaviour in v3.x
- Fix issue where custom movement speed input would become focused unnecessarily
- Fix issue causing broken rom header when project name contained no ascii characters
- Fix issue where sound effect preview button would sometimes not cause sound effect to play
- Fix issue where using reusing a script that would launch projectiles across multiple scenes could cause the wrong projectile to be launched
- Fix issue where passing values from one script to another wouldn't correctly pass by reference
- Fix issue where using parameters from one script while calling another wouldn't register the parameter in the parent script correctly
- Fix issue where modified player flags were not being reset when changing scenes
- Fix issue where "If Actor At Position" wasn't rounding to chosen units before comparing causing condition to fail when between tiles
- Fix issue where resetting palettes back to defaults from a script used in multiple scenes may not load the correct palettes
- Fix issue where timers were not suspending when executing modal dialogues and menus
- Fix issue where using "Start Actor's 'On Update' script" could change sprite draw order

## [4.0.2] - 2024-07-29

### Changed

- Optimised loading of large projects by upgrading to newer version of Normalizr
- Improved text contrast on world status bar (info for current scene + x/y coordinate of hovered tile)

### Fixed

- Fix spell check to use chosen application language where possible
- Fix stack error preventing use of rnd() within "if" statements
- Fix 'wait for input' text code responsiveness when using slower text speeds
- Fix inconsistent draw speeds when using "Set Text Animation Speed" (Speed 4 would alternate between fast and slow)

## [4.0.1] - 2024-07-22

### Added

- MAX_GLOBAL_VARS made available in `game_globals.h` for use in engine plugins [@kinostl](https://github.com/kinostl)
- Add ability to set "On Load" script in "Game Data Save" event allowing you to reinitialise runtime changes such as palettes, sprites or tile data which are not stored when saving a game
- Add Bahasa Indonesia localisation. [@kiraware](https://github.com/kiraware)
- Add option to toggle spell check using "Edit / Spelling and Grammar / Check Spelling While Typing" setting on menu

### Changed

- Updated Simplified Chinese localisation. [@wcxu21](https://github.com/wcxu21)
- Improve legibility of extra collision tiles by using a pixel font "Public Pixel" by GGBot [@kinostl](https://github.com/kinostl)
- Updated Polish localisation. [@ReptiIe](https://github.com/ReptiIe)
- Changed wording of batteryless save feature and added warning when feature is enabled to explain that only very specific cartridges will be supported
- Updated Japanese localisation. [@tomo666](https://github.com/tomo666)
- Optimise wait event CPU use when when waiting for 1-4 frames by using VM_IDLE
- Updated to latest [GBVM](https://github.com/chrismaltby/gbvm)

### Fixed

- Fix typo with white tile reference in engine UI [@kevinfoley](https://github.com/kevinfoley)
- Fix issue where text codes would only autocomplete only using localised names. `!Font`, `!Speed`, `!Instant` and `!Cursor` will no list results regardless of user's language setting
- Fix issue where rename button wouldn't appear for variables used in script values
- Fix issue where actors referenced within scripts were not always being linked correctly
- Fix issue where moving actors relatively off left or top of screen would cause coordinates to wrap, causing them to move in wrong direction
- Fix issue in Japanese localisation where dialogue and expression text editors would show caret at incorrect location
- Fix issue where save/load wouldn't work in game preview or web export when "Enable Batteryless Saving" was enabled, this setting is now ignored unless exporting a ROM file
- Fix issue where selecting the current field in engine field events caused the value to be lost
- Fix issue where changing script in Call Script event would keep references to previous script's args causing issues when nesting scripts
- Fix issue where commented conditional statements within custom scripts could cause "Unknown arg" errors
- Fix issue causing much higher CPU use when using "If" statements and expressions compared with version 3.2
- Fix issue when using IME input for languages such as Japanese, Chinese, Korean where rename and search functionality would finish early while text is still being composed [@tomo666](https://github.com/tomo666)
- Fix issue where pressing "Enter" when adding an unknown reference to a GBVM script would cause the application to crash

### Removed

- Removed "Replace Default For Scene Type" checkbox from "Set Player Sprite Sheet" event which hasn't worked since the early 3.0 releases and contained multiple issues even when "working". Recommended replacement is to use scripts in Scene "On Init" and Save Data "On Load" to initialise player sprites based on variables

## [4.0.0] - 2024-06-19

### Added

- Add ability to launch projectiles at a target actor [@patrickmollohan](https://github.com/patrickmollohan) [@pau-tomas](https://github.com/pau-tomas)
- Add angle selector input showing degrees for GBVM angle values [@pau-tomas](https://github.com/pau-tomas)
- Add support for atan2 function in math expressions [@pau-tomas](https://github.com/pau-tomas)
- Add magnitude field to camera shake event [@patrickmollohan](https://github.com/patrickmollohan)
- Add checkbox to toggle if new animation should loop when using Set Actor Animation State event [@pau-tomas](https://github.com/pau-tomas)
- Add shortcut to search scenes when in world mode by pressing `/`
- Add support from adding sound effects to a project by dragging files into project window (to match how this works for other asset types)
- Add native support for Macs with Apple silicon without needing Rosetta
- Add support for `<<` and `>>` operators in math expressions [@pau-tomas](https://github.com/pau-tomas)
- Add script debugger pane to World view, when game is run while this is open allows inspecting currently running scripts, setting breakpoints and updating live variable values
- Add 'Color Only' mode. Roughly doubles the amount of tiles available for backgrounds and sprites though game will no longer run on original GB (DMG) hardware
- Add event "Replace Tile At Position" and "Replace Tile From Sequence" to update background tiles, calling "Replace Tile From Sequence" repeatedly will cycle through animation frames
- Add new asset folder "Tilesets" for use in "Replace Tile" events
- Add ability for plugins to define additional scene types by including defined types (e.g. `"sceneTypes": [{"key": "RACING", "label": "Racing 2D"}]`) in `engine.json` [@pau-tomas](https://github.com/pau-tomas)
- Add ability for `Actor Move Relative`, `Actor Set Position Relative` and `If Actor At Position` to use variables as coordinate inputs
- Add ability for almost every script event input that supports variables to use advanced values, click the button to the left of the value input to select value types, and combine them with math operators
- Add ability to use variables within Menu and Choice events [@pau-tomas](https://github.com/pau-tomas)
- Add stack preview mode to debugger
- Add ability to set common tilesets between scenes, the common tiles will always be loaded in a consistent order between scenes sharing the same common tileset
- Add ability to set Fade Speed as "Instant" when switching scenes, combine this with use of common tilesets in both scenes to enable seamless scene switching
- Add ability to use variables, advanced values and expressions for coordinates in Change Scene event
- Add ability to "Preview as Monochrome" when using mixed color mode by toggling button at bottom left of World view
- Add ability to provide color PNGs for backgrounds and extract palettes automatically by either clicking "Auto Color" button in brush toolbar or using dropdown on Scene sidebar next to "Background Palettes" label
- Add ability to override tile data for auto colored backgrounds by providing a matching \*.mono.png in your assets/backgrounds folder containing a monochrome version of the background. When provided this file will be used for tiles data and the regular image will be used to extract the color palettes (useful for mixed color mode games when auto palettes isn't creating tile data as you'd like automatically)
- Add ability to edit waveforms in music editor using keyboard with ability to copy/paste [@pau-tomas](https://github.com/pau-tomas)
- Add ability to restore scene's default palettes in "Set Background Palettes" (especially useful when using auto palettes)
- Add ability to set filename when creating a new song in music editor
- Add context menus when right clicking on list items, or on scenes/actors/triggers in world view, or tiles on sprite editor view allowing renaming/deleting
- Add ability to multi select scenes by shift click + dragging on world view or shift clicking in scenes list. When multiple scenes are selected they can be moved at the same time
- Add ability to multi select script events by shift clicking the event's header. When multiple events are selected they can be moved, copied, grouped or deleted at the same time
- Add ability for scenes, scripts, palettes and image/music assets to be organised into folders by naming them with path separators (`/` or `\` supported) e.g naming a scene `ui/menu/Inventory` will place it in a folder `ui/menu`
- Generate `game_globals.h` at compile time allowing access to global variables from C code [@pau-tomas](https://github.com/pau-tomas)
- Add support for using random numbers in GBVM RPN instructions [@untoxa](https://github.com/untoxa)
- Add `Set Camera Position` event which can be used before scene fade in to instantly move camera to a new location
- Add `Script Lock` and `Script Unlock` events allowing pausing other scripts and scene updates until the script is completed or unlocked
- Add `Build Options` to "Settings" section with option to toggle if "Build Log" should be opened automatically on warnings
- Add `Show Navigator` button to World toolbar if navigator is closed
- Add ability to rename flags in Variable Flags Add/Clear/Set events [@pau-tomas](https://github.com/pau-tomas)
- Add ability for variables to be used for X/Y coordinates in replace tile events
- Add Russian localisation. [@Alexandr199514](https://github.com/Alexandr199514)
- Add support for `isqrt` and `rnd` functions in math expressions
- Add support for printf style tokens in text. `%D5$Variable` in text will output variable value with 5 characters and leading zeros e.g. `00042`, `%c$Variable` will output a character code based on variable value, `%t$Variable` will set text speed based on variable value, `%f$Variable` will change font based on variable value.
- Add ability to change text cursor position in dialogue with "Set Cursor Position To" and "Move Cursor Position By" commands accessible by typing `!Cursor`

### Changed

- Updated to latest [GBVM](https://github.com/chrismaltby/gbvm)
- Updated code generation to reduce access to stack [@pau-tomas](https://github.com/pau-tomas)
- Update Variable Uses sidebar to include any uses within Scripts [@pau-tomas](https://github.com/pau-tomas)
- Improved organisation of "Add Event" menu by grouping related event types
- Updated German localisation. [@gonzoMD](https://github.com/gonzoMD)
- Add Event Menu highlights matching text when searching
- Updated to latest [GBDK-2020](https://github.com/gbdk-2020/gbdk-2020)
- Dragging scenes now snaps to an 8px grid allowing easier alignment of scenes
- Camera speed events updated to use pixels per frame values like actor movement, allowing more precise speed control and speeds faster than 1px per frame
- Build information and warnings moved to "Build Log" section of Debugger
- Updated Japanese localisation. [@tomo666](https://github.com/tomo666)
- Allow event plugins to require("shared/lib/scriptValue/helpers") to access script value helpers
- Update sidebar layout to prioritise giving scripts full sidebar width
- Update sidebar to preserve scroll position when switching between scenes/actors/triggers/scripts
- Update music editor to display compressed version of channel mute/visibility controls when not enough room to display fully
- Keep preference for using Piano Roll or Tracker view when switching between songs in music editor rather than switching to Piano Roll view
- Button events renamed to be more consistent
- "Add Event" search updated to also include events that match group name when searching e.g. Searching 'Joypad' will include all Button events
- Darkened conditional event header colours in dark theme
- Patron list in credits now fetches most up to date list of members from GitHub if an internet connection is available
- Previous "Name in Credits" tier members on Patreon are now still shown even after their membership has finished (your support is still very much appreciated!)
- Update GBVM script view in debugger to show human readable labels
- Updated Spanish localisation. [@doomer6699](https://github.com/doomer6699)
- Updated Polish localisation. [@ReptiIe](https://github.com/ReptiIe)
- Update script branch labels to include the condition logic if there is enough vertical space
- Update script branch labels to stay on screen when scrolling through long scripts
- Sprite editor updated to allow canvas min width of 8px with 8px width increments
- When in collision tile drawing mode, actor sprite collision bounding boxes are now also visible
- Sprite editor frames list now shows frame number
- Improve layout of asset dropdowns when using folders
- Dialogue event titles now show names of used variables in preview
- Updated to [GBDK](https://github.com/gbdk-2020/gbdk-2020) version 4.3.0
- When using "Color Only" mode, GB rom file extension changed to ".gbc"
- Sprite editor frame numbers updated to start from frame "0" to match values used in "Set Animation Frame" event

### Fixed

- Fix localisation for default names of scenes, actors and triggers, new entities no longer hard coded to use English names
- Fix issue where clicking on a scene would sometimes not cause it to become selected
- Fix issue where dragging World using middle mouse button and releasing button with cursor outside of window would cause scrolling to still be enabled
- Fix issue where double clicking scene search input would cause window to become maximised on macOS
- Fix issue where pasting a "Call Script" event could sometimes incorrectly say script has been modified if project hadn't been saved and reloaded first
- Fix issue where creating a new pattern in music editor would sometimes cause the other patterns in the song to play at a lower octave
- Fix issue where variables in Dialogue and Math inputs could appear above script tabs
- Fix calculation of last parallax layer height in editor input [@pau-tomas](https://github.com/pau-tomas)
- Fix compiler warning when using some unary operators in While loop [@pau-tomas](https://github.com/pau-tomas)
- Fix issue where fonts referenced from plugins were not always being included in compiled game
- Fix issue where navigator split sizes would update every time a project was opened, causing unnecessary changes when project stored in version control system
- Fix issue where some slower camera speeds weren't actually slower
- Fix issue where setting "Show Connections" to "None" would prevent Player start position from being visible/draggable
- Fix issue where note lengths for wave instruments in .uge files were not being stored according to file specification. This may cause some .uge files created with older builds of GB Studio to not sound correct. If you need to fix any .uge files, you can use this [migrator tool](https://chrismaltby.github.io/gbs-uge-migrator/)
- Fix issue where navigator sidebar could sometimes not be wide enough to show Add and Search buttons in section headers
- Fix issue where document wasn't being flagged as modified until first change after migrating a project
- Fix issue migrating "Engine Field Update" events
- Fix issue where shift key no longer allowed line drawing for collisions and tile painting modes
- Fix issue where using recursive scripts could cause UI to lock up while calculating scene sprite tile count and when building game.
- Fix issue where custom scripts parameters were not always updating as parameters were updated
- Fix issue where "If Variable Has Flag" was always false [@pau-tomas](https://github.com/pau-tomas)
- Fix issue where selecting effect column in music editor tracker would cause application to freeze [@pau-tomas](https://github.com/pau-tomas)
- Fix issue preventing documentation being accessed from splash window
- Fix "Add Flags" event tooltips localisation.
- Fix issue where some sidebar inputs would appear above script tabs when scrolled
- Fix rumble support when using MBC5 cartridge [@pau-tomas](https://github.com/pau-tomas)
- Fix issue where empty project message would be positioned incorrectly if World view was scrolled or zoomed
- Fix issue where World view minimum size wasn't taking into account navigator sidebar or debugger pane causing unnecessary scroll bars
- Fix issue where Math Expression editor would incorrectly show spellcheck errors in function names
- Fix issue building game when Super GB Mode was enabled before setting Color Mode to "Color Only"
- Fix issue where using a plugin for a newer version of GB Studio would give an error saying the plugin was for an older version
- Fix title for "Call Script" events when no script has been selected
- Fix issue where remapping '\\' or 'n' in font would prevent line breaks from working
- Fix issue where dragging frames in sprite editor would swap frame positions rather than shift them
- Fix issue where searching through menus would use very low contrast text colours when using Dark theme
- Fix issue preventing palette names from being over 25 characters long
- Fix issue where sceneTypes in `engine.json` for plugins could cause duplicate scene types to appear
- Fix issue using using non-English named variables and text codes in dialogue.
- Fix issue where long branch labels would cause gaps in script editor
- Fix issue where right click context menu would appear when trying to right click to remove collisions. Context menu now only appears when using select tool
- Fix issue where text focus could get stuck in Build Log or GBVM script preview in debugger, preventing copy/paste from working
- Fix issue where restoring scene from stack after using camera move events would cause previous scene to load without being locked to player
- Fix issue where calling scripts to change sprites for multiple actors in a scene would only reserve tile memory for the first actor
- Fix issue where too many tiles were being reserved for sprite changes in "Color Only" mode causing sprite VRAM to overflow
- Fix issue where fonts referenced from GBVM scripts weren't being included in project
- Correct gbvm VM_IF and VM_IF_CONST docs for param N
- Fixed font alignment in asset dropdowns when using folders
- Remove videos from New Project templates in splash screen as they cause Windows to crash

### Removed

- Removed "Build & Run" section, all previous functionality is now available in "Build Log" section of Debugger

## [3.2.1] - 2024-02-27

### Fixed

- Fix sound effects previews in editor not matching how they sound in game [@pau-tomas](https://github.com/pau-tomas)
- Fix crash when typing "!S" into dialogue events
- Fix bug where engine plugins that include an engine.json with no fields causes all default engine settings to be hidden [@pau-tomas](https://github.com/pau-tomas)
- Fix issue where transferring data over linkcable would cause game to hang

## [3.2.0] - 2024-01-29

### Added

- Add ability to choose timer context in timer events allowing up to four timers to be used per scene [@patrickmollohan](https://github.com/patrickmollohan)
- Add event "If Current Scene Is" to allow conditionally running scripts based on the current scene [@patrickmollohan](https://github.com/patrickmollohan)
- Add ability to set background tile priority for Color games using Priorty tool in colorize section. Priority tiles appear above sprites
- Add support for UGE v6 to music editor [@pau-tomas](https://github.com/pau-tomas)
- Subpattern editor added to Instrument Editor [@pau-tomas](https://github.com/pau-tomas)
- Add warning when trying to reuse background from a logo scene [@pau-tomas](https://github.com/pau-tomas)
- Add descriptive README files to asset folders in new projects [@pau-tomas](https://github.com/pau-tomas)
- Add slope brush when drawing collisions
- Add magic brush when painting tiles and drawing collisions, updates all tiles matching the one clicked [@RichardULZ](https://github.com/RichardULZ)
- Add support for slopes to platform scenes [@Canight](https://github.com/Canite) [@gearfo](https://gearfo.itch.io/) [@Gumpy Function](https://www.gumpyfunction.com/)
- Add ability to make Analogue Pocket builds using CLI tool [@SalvatoreTosti](https://github.com/SalvatoreTosti)
- Add warning when using engine plugins built on older versions of GB Studio

### Changed

- Updated Simplified Chinese localisation. [@wcxu21](https://github.com/wcxu21)
- Updated Polish localisation. [@ReptiIe](https://github.com/ReptiIe)
- Update to latest [GBVM](https://github.com/chrismaltby/gbvm)
- Rename "Obj Palette" in sprite editor to "Monochrome Palette" to make its purpose clearer, now includes palette preview [@pau-tomas](https://github.com/pau-tomas)
- Allow actor fields that aren't named "actorId" or "otherActorId" to be in custom scripts [@patrickmollohan](https://github.com/patrickmollohan)
- Fix issue where editing a variable's name in sidebar would sometimes cause a different variable to become selected

### Fixed

- Fixed issue where piano roll would scroll vertically when switching patterns [@pau-tomas](https://github.com/pau-tomas)
- Fix issue where editing a custom script could cause variables to switch back to pass by reference
- Fix issue where loading a scene containing projectiles or dynamically modified sprites could cause graphical corruption [@untoxa](https://github.com/untoxa)
- Fix issue where script event title would show wrong local variable name for scenes [@pau-tomas](https://github.com/pau-tomas)
- Fix muting bug with FXH parser [@coffeevalenbat](https://github.com/coffeevalenbat)
- Fix issue where Animation State value for projectiles was being ignored
- Fix issue where falling on to ladder while holding dpad down could sometimes cause player to get stuck
- Fix bounds check for right screen edge when player isn't 16px wide
- Fix VM_REPLACE_TILE_XY to allow tiles larger than 255 for logo scene type

### Performance

- Performance improvements in ScriptEditorEventHelper, no longer rerenders all scenes when updating [@pau-tomas](https://github.com/pau-tomas)

## [3.1.0] - 2022-09-11

### Added

- Add VM_LOAD_TILESET and VM_OVERLAY_SET_MAP to gbvm [@untoxa](https://github.com/untoxa)
- Add VM_ACTOR_MOVE_CANCEL [@um3k](https://github.com/um3k)
- Allow using frames rather than seconds for wait/camera shake/attach timer script events
- Added events to Deactivate & Activate actors, similar to old hide/show but prevents update scripts from running on disabled actors
- Added ability to choose any referenced assets in GBVM script event forcing assets to be included within built project
- Added ability to rename the GBVM symbol used for generated data files, accessible from "View GBVM Symbols" in right sidebar menu + GBVM event references section
- Added syntax highlighting and line numbers to GBVM event code input
- Added event Actor Move Cancel to cancel any scripted movement currently running for a given actor [@um3k](https://github.com/um3k)
- Add sound effects file support reading WAV (.wav), VGM (.vgm, .vgz) and FXHammer (.sav) files from assets/sounds folder
- Add support for setting sound effects priority [@untoxa](https://github.com/untoxa)
- Add ability to generate Emulicious debugging files [@RichardULZ](https://github.com/RichardULZ)
- Add tooltips to Song Editor tools [@DeerTears](https://github.com/DeerTears)
- Added Piano Roll selection tool (also accessible by holding Shift) allowing multiple notes to be dragged at once [@pau-tomas](https://github.com/pau-tomas)
- Added copy paste support for notes in music editor with OpenMPT/hUGETracker compatible clipboard format [@pau-tomas](https://github.com/pau-tomas)
- Added ability to select multiple cells in tracker editor by holding shift while pressing arrow keys [@pau-tomas](https://github.com/pau-tomas)
- Added keyboard shortcut (Space bar) to toggle play/pause in music editor [@pau-tomas](https://github.com/pau-tomas)
- Add Idle event to wait for a single frame using VM_IDLE
- Add "Loop For" and "Loop While" events
- Add ability to pass number values as parameters when calling scripts [@pau-tomas](https://github.com/pau-tomas)
- Add ability to access global variables from within scripts [@pau-tomas](https://github.com/pau-tomas)
- Add ability to set script parameters to be passed by reference or by value (previously was always by reference)
- Add ability to use pixel values for actor and camera movement [@Y0UR-U5ERNAME](https://github.com/Y0UR-U5ERNAME)
- Add ability to view & change units used for time and distances inline within number and variable inputs
- Add event "If Actor Distance From Actor" to check if one actor is within a certain range of another [@juliusl](https://github.com/juliusl)
- Add event "Start Actor's 'On Update' Script" [@patrickmollohan](https://github.com/patrickmollohan)
- Add "Keep Running While Offscreen" option to actor "On Update" scripts
- Add ability to prevent projectiles being destroyed on collision and to prevent projectile animation from looping [@untoxa](https://github.com/untoxa)
- Add support for engine plugins, individual C or ASM files placed in `PROJECT_PATH/plugins/PLUGIN_NAME/engine/src/` replacing or adding partial parts of the game engine
- Add support for partial engine files in `PROJECT_PATH/assets/engine` missing files will be pulled from the default game engine
- Add support for calling C functions directly from GBVM with `VM_CALL_NATIVE`, in conjunction engine plugins allows creation of plugin events which call new native C functions
- Add compile time warning if too many unique projectiles are within a scene
- Add effect editor to music editor piano roll [@pau-tomas](https://github.com/pau-tomas)
- Add noise macro preview for music editor [@RichardULZ](https://github.com/RichardULZ)
- Display channel specific instrument names on instrument select dropdown [@pau-tomas](https://github.com/pau-tomas)
- Allow editing effects from tracker editor [@RichardULZ](https://github.com/RichardULZ)
- Allow transposing selected notes in tracker with Ctrl/Ctrl+Shift and Mousewheel or "+" / "-" keys [@RichardULZ](https://github.com/RichardULZ)
- Add sound effects preview from dropdowns [@pau-tomas](https://github.com/pau-tomas)
- Add tooltips to all script event labels (also used to auto generate documentation for new site)
- Add "Music House" to the color sample project with examples of music and sound effects [@pau-tomas](https://github.com/pau-tomas). Music and sound effects by Tronimal.
- Add new song template for UGE songs, with new default instruments. Song created by Tronimal.
- Add support for extending engine.json from plugins [@pau-tomas](https://github.com/pau-tomas)

### Changed

- Updated to latest [GBDK-2020](https://github.com/gbdk-2020/gbdk-2020)
- Updated to latest [GBVM](https://github.com/chrismaltby/gbvm)
- Save/restore RNG seed when saving/loading a game [@untoxa](https://github.com/untoxa)
- Updated Polish localisation. [@ReptiIe](https://github.com/ReptiIe)
- Optimised Switch event codegen to use VM_SWITCH instruction
- Optimised codegen to use a stack frame rather than push/pop
- Improved randomize [@untoxa](https://github.com/untoxa)
- Improved gbspack error when data is over bank size limits
- Update hUGEDriver [@untoxa](https://github.com/untoxa)
- Hide/show actor now ONLY hides/shows, update scripts & collisions are not affected (existing hide/show events migrated to deactivate/activate for compatibility)
- Updated Simplified Chinese localisation. [@wcxu21](https://github.com/wcxu21)
- Updated German localisation. [@attackemartin](https://github.com/attackemartin)
- List of "Variable Uses" now calculated in background thread to reduce pause while reading large projects
- Timer, input and music scripts set from within a custom script no longer allow the script parameters to be used as they were not working, global variables can now be used instead.
- Optimised actors_update() and vm_actor_move_to() to improve CPU usage
- Improve music editor copy/paste with ModPlug compatible clipboard [@RichardULZ](https://github.com/RichardULZ)

### Fixed

- Fixed Wait event in scene init scripts to happen after automatic fade in
- Fixed issue where animated camera lock would be off by 8x8px
- Fix vertical shoot em up scene type [@um3k](https://github.com/um3k)
- Fixed display of errors in game engine files while building
- Fix issue where activating an actor wouldn't trigger update script [@untoxa](https://github.com/untoxa)
- Fix issue where full magenta characters in font files didn't have zero width
- Fixed typo in Japanese localisation [@RYU-N2001](https://github.com/RYU-N2001)
- Updated 32-bit Windows app to use correct 32-bit GBDK-2020 (again) [@untoxa](https://github.com/untoxa)
- Fixed issue where relative actor movement on left or top edge of scene would wrap around scene [@um3k](https://github.com/um3k)
- Fix issue where soft reset could lead to UI tiles over scene tiles [@untoxa](https://github.com/untoxa)
- Fix issue where undoing from music editor would also undo global project changes [@pau-tomas](https://github.com/pau-tomas)
- Fix compiling noise macros for UGE songs [@pau-tomas](https://github.com/pau-tomas)
- Fix setting music editor preview start position to a different pattern [@pau-tomas](https://github.com/pau-tomas)
- Fix issue where projectiles launched at >224 degrees would be facing in wrong direction [@john-lay](https://github.com/john-lay)
- Restore previously playing music when loading game data
- Fix issue where new patterns added to songs in music editor would not be played until song was reloaded [@pau-tomas](https://github.com/pau-tomas)
- Fix an issue where fading out mid-scene would cause game to hang [@untoxa](https://github.com/untoxa)
- Fix copying trigger scripts [@pau-tomas](https://github.com/pau-tomas)
- Fix issue where selecting "Wait until finished" on sound effect events could cause broken scripts containing decimal wait values
- Fix selecting properties on "Self" such as position and direction [@pau-tomas](https://github.com/pau-tomas)
- Fix issue where renaming sprite files would lose any attached metadata
- Prevent user from creating projects ending with a period [@patrickmollohan](https://github.com/patrickmollohan)
- Fix issue where using multiple identical sound events in a project would store the data in the ROM duplicated once for every sound effect call
- Fix plat_jump_vel maximum value in engine.json [@patrickmollohan](https://github.com/patrickmollohan)
- Fix issue where a commented out actor update script would cause slow down while the actor is onscreen
- Fix issues with build caching which was requiring cache to be cleared regularly if variable references were changed
- Fix issue where Drag world mode and Paste event mode could become stuck if using Alt+Tab to switch windows while active
- Fix issue using single "$" and "#" characters in dialogue
- Fix issue when setting actor's position to another actor's position using properties [@patrickmollohan](https://github.com/patrickmollohan)
- Fix issue using actor properties from within custom scripts

### Removed

- Removed .CURRENT_SCRIPT_BANK for gbvm scripts as results were unreliable
- Removed deprecated dividing ratio and shift clock fields from noise instrument editor [@pau-tomas](https://github.com/pau-tomas)
- Removed loop option on music play event, doesn't work for hUGEDriver and was broken on GBTPlayer. Instead add an empty pattern with an infinite loop (using effect Bxx) to the tracks you want to not loop.

## [3.0.3]

### Added

- Added event to determine if device is running on SGB
- Added event to determine if device is a GBA
- Added ability to choose from two keyboard layout options for tracker [@pau-tomas](https://github.com/pau-tomas)
- Added ability to to set the start playback position in music editor by clicking bar above piano roll [@pau-tomas](https://github.com/pau-tomas)
- Add engine support for text sounds [@untoxa](https://github.com/untoxa)
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
- Update engine to latest hUGEDriver [@untoxa](https://github.com/untoxa)
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
- Fix music editor: Instrument name isn't editable [@pau-tomas](https://github.com/pau-tomas)
- Fix music editor: Ticks per row field updates aren't reflected when playing the song [@pau-tomas](https://github.com/pau-tomas)
- Fix music editor: Wave form changes are not updating for instrument preview [@pau-tomas](https://github.com/pau-tomas)
- Improved engine GBA detection [@untoxa](https://github.com/untoxa)
- Fix scroll jitter seen in top-down scenes [@untoxa](https://github.com/untoxa)
- Save executing ctxs when saving game data [@untoxa](https://github.com/untoxa)
- Fixed issue where scene may not fade in some cases where scene init script contained conditional events
- Fix keyboard accessibility for add/remove buttons in form fields [@rik-smeets](https://github.com/rik-smeets)
- Fixed issue causing Math event values > 128 to wrap as they were treated as signed 8-bit numbers [@Rebusmind](https://github.com/Rebusmind)
- Fixed clamp when adding/subtracting negative numbers
- Generate a new save hash when project changes to prevent crashes when loading invalid data [@untoxa](https://github.com/untoxa)
- Fix crashes when using too many sprite tiles by using GBDK-2020 sprite hiding function [@untoxa](https://github.com/untoxa)
- Fix rendering of garbage when no scene has loaded yet [@untoxa](https://github.com/untoxa)
- Fix overlay hide [@untoxa](https://github.com/untoxa)
- Fix issue where walking events was incorrectly replacing actorIds with $self$
- Fix issue with saving/loading patterns from UGE files [@pau-tomas](https://github.com/pau-tomas)
- Fixed issue where changing player sprite mid scene would write over actor tiles (still an issue using "Replace Default Sprite" with a larger than initial)
- Fix playing note preview when adding to wave channel [@pau-tomas](https://github.com/pau-tomas)
- Fixed some fields not being localised correctly (such as the top left Project View Button)
- Fixed issue where random numbers were being seeded every call preventing them from being very random

## [3.0.2]

### Added

- Added in-game crash handler screen [@untoxa](https://github.com/untoxa)
- Added support for 16-bit in flag events [@Rebusmind](https://github.com/Rebusmind)
- Compile files in parallel based on available CPU cores for system

### Changed

- Updated Portuguese localisation. [@toxworks](https://github.com/toxworks)
- Updated Simplified Chinese localisation. [@wcxu21](https://github.com/wcxu21)
- Optimised game engine input script checks [@untoxa](https://github.com/untoxa)
- Reimplemented GBSPack in pure JS as binary was incorrectly flagged by anti-virus software on Windows
- Updated French localisation. [@Toinane](https://github.com/Toinane)
- Player bounce event no longer deprecated
- Don't prevent jumping when overlapping actor in platform scenes

### Fixed

- Fixed some cases where assets would no longer live reload by switching to using chokidar glob syntax rather than regex filters [@RichardULZ](https://github.com/RichardULZ)
- Allow tilesets with zero length [@untoxa](https://github.com/untoxa)
- Fix issue where VM_LOCK was not affecting context switching [@untoxa](https://github.com/untoxa)
- Properly detect grouped property fields for events inside custom scripts [@pau-tomas](https://github.com/pau-tomas)
- Detect variables in math expression events within Custom Scripts [@pau-tomas](https://github.com/pau-tomas)
- Rebuilt GBDK for Mac to support macOS versions below 10.15 [@untoxa](https://github.com/untoxa)
- Hide sprites when overlay is fullscreen [@untoxa](https://github.com/untoxa)
- Make sequences of control codes in strings "instant" [@untoxa](https://github.com/untoxa)
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
- Fix issue where input scripts wouldn't override default button actions [@untoxa](https://github.com/untoxa)
- Fix issue where input scripts could fire while interact scripts were running (VM is locked)
- Fix issue where game would crash if more than 19 actors are used in a single scene

## [3.0.0]

- Moved to new [GBVM](https://github.com/chrismaltby/gbvm) based game engine (big thanks to [@untoxa](https://github.com/untoxa))
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
- Engine bank push pop functions replaced with \_\_banked for performance increase

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
- Add support for larger background images, up to 2040px in either dimension, maximum width \* height of image must be under 1,048,320
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
