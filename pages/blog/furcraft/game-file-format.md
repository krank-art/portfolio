# Game File Format

* Each mission that gets played should be loaded from a special custom map.
* A custom map file contains all information necessary to play a game:
  * **Meta data:** Map name, map author, map description, map version, map id, *dependencies*, map locales, map file definition version
  * **Game rules:** player count, player teams, camera bounds, resources definition
  * **Stages (?):** One or more playable stages (like going from exterior map into a building)
  * **Terrain:** Cliffs, water, elevation level, local height, ground texture, natural landmarks
  * **Preplaced units:** Player units, enemy forces, neutral units (critters, capturable buildings, rescuable units, collectable items)
  * **Doodads:** Level decoration like stones, buildings, vegetation, fire effects, monuments
  * **Destructables:** Special doodads that can be destroyed (crates, barrels, gates) or harvested (trees, gold ore patch)
  * **Terrain modifiers:** Unpassable terrain (due to path blockers), scorched earth
  * **Regions:** Areas in the map with ambient effects (rain, mist, snow), a soundscape (crickets, whooshing meadows) or trigger zone
  * **Cameras:** Cameras and camera paths for ingame cinematics
  * **Triggers:** Custom logic for map (map initialization, story triggers, cinematic control, win/lose condition, advanced unit behaviour)
  * **Unit definitions:** units and buildings definitions;
  * **Item definitions:** item definitions;
  * **Buff definitions:** buff definitions;
  * **Doodad definitions:** doodad definitions;
  * **Destructable definitions:** destructable definitions;
  * **Upgrade definitions:** upgrade definitions
  * **Tileset definitions:**
  * **Sound definitions:**
  * **Model definitions:**
  * **Texture definitions:**
  * **UI definitions:**
  * **AI definition:** 
  * **Imported files:** textures, models, sounds
  * **Strings:** All strings and text used can be saved in a special strings file for each language (i18n)
  * **Preview image:** Preview image of map (auto-generated or user-provided)
  * **Dependencies:** Other maps that can be required as dependencies to share units, triggers or doodads between maps
* The file format of a custom map should be accessible with simple tools for better debugging and modding support.
* Some programs nowadays essentially use compressed JSON to store information (e.g. Sketch with `.sketch`) or compressed XML (e.g. Word with `.docx`).
* A custom game map can also be edited and saved as an *opened archive* (uncompressed folder structure); 
  the intention is that you can save the folder structure as git repository
* File structure proposition:
  ```bash
  map.json              # Required. Map name, map author, map description, map version, map id, dependencies, locales, 
                        #   file format version, preview image, script dependencies, script dev dependencies, etc.
  map-lock.json         # Optional (generated from package.json). Includes dependency tree; should be committed in git
  editor.json           # Optional (generated from World Editor). Position of work camera and state of UI panels; 
                        #   should NOT be committed in git
  editor-config.json    # Optional. Settings like "removeUnusedImportsOnSave", "disableStages" (if intention is to make
                        #   a content library instead of a map)
  imports.json          # Optional. Settings for each imported asset; If "removeUnusedImportsOnSave" is `true` and there
                        #   are imported objects not registered in this file, they get removed on saving in Editor
  definitions/          # Optional. Custom object definitions
    rules.json          # Player count, player teams, camera bounds, resource definitions (gold, wood, oil, etc.), 
                        #   armor and weapon types, supply limit, etc.
    units.json          # Defined units and buildings; position, size, health points, attack list, build cost, custom data;
                        #   If multiple definitions for a unit exist, the properties are overwritten in a cascading 
                        #   fashion; this should enable users to override specific properties of already defined units
    items.json          # Defined items; position, size, model, name, build cost
    buffs.json          # Defined buffs; buffs and debuffs, scale modifier, tint modifier, effect
    doodads.json        # Defined doodads; position, size, model, model variations, name, collision size
    destructables.json  # Defined doodads; position, size, model, model variations, name, collision size, health points
    upgrades.json       # Defined upgrades; 
    ai.json             # Defined AI; build order, behaviour flags (teleports, noMercy, repairsBuildings, etc.)
    tilesets.json       # Defined tilesets; texture mapping (9-sliced texture), tile ordering, cliff type, cliff texture
    effects.json        # Defined particle effects; e.g. flame, explosion, red orb, selection circle on ground
    sounds.json         # Defined sounds; pitch, type (2d sound, 3d world sound, 3d viewport sound), volume, variations
    models.json         # Defined models; model type (raw or combined); also imported animation and model variations
    textures.json       # Defined textures; textures, icons, sprites, 9-sliced textures, shader materials
  ui/                   # Optional. UI design definitions
    main.xml            # Default UI while ingame (composed of smaller UI elements like menubar.xml and command-bar.xml)
    menu.xml            # Defined look and animations of main menu (shown when hitting esc)
    minimap.xml         # Defined look and animations of minimap, minimap colors, minimap icons
  dependencies/         # Optional. Loaded modules of map (cross-dependencies among modules are not allowed)
    super-awesome-map/  # Example dependency 1: Loaded map to access it's unit definitions, stages, UI, etc.
    utility-library/    # Example dependency 2: Script library
  stages/               # Optional. Stages (playboards) of map; only one stage can be displayed at a time
    stage-001/          # Example stage 1: Custom map with custom content created
      stage.json        # Stage width, stage height, camera bounds, initially active camera
      terrain.json      # Level geometry and tileset palette definition; each tile corner has an elevation level, 
                        #   local height, ground texture; each subtile (tile = 4x4 subtiles) can have one or more 
                        #   modifiers like "unpassable" or "scorched"
      objects.json      # Units, buildings, items, cameras --> position in the map, custom properties per type
      doodads.json      # Doodads, destructables (trees, gold patches) --> position in the map, destructables have 
                        #   life points and can drop items
      regions.json      # Regions in map; represented as combined 2D areas
      paths.json        # Paths in map; represented as splines
      preview.png       # Auto-generated preview image (minimap image) from level geometry
    stage-002/          # Example stage 2: Custom melee map, that only has terrain
      stage.json        # See property under example stage 1.
      preview.png       # See property under example stage 1.
  scripts/              # Optional. Custom scripts to control the map; JS as scripting API
    node_modules/       # Optional. It should be allowed to add arbitrary Node dependencies; should be in `.gitignore`
    package.json        # Optional. NPM package definition; any JS module can be added (but maybe sandbox the scripting 
                        #   API (Node) due to security concerns? We don't want any malicious JS code run in the map)
    package-lock.json   # Optional. NPM package lock file
    globals.js          # Example script file 1: Global variables or maybe a singleton class
    meele-triggers.js   # Example script file 2: Meele triggers when playing a meele match
    custom-ability.js   # Example script file 3: Custom ability that has an advanced scripted effect when run.
  imports/              # Optional. Raw imported files to create custom models, sounds and textures
    cool-model.fbx      # Example import 1: Some unit model as FBX
    cool-model.obj      # Example import 2: Some unit model as OBJ
    grunt_pissed_3a.wav # Example import 3: Sound effect when a unit is pissed
    ambient.mp3         # Example import 4: Ambient soundtrack that plays at a shore
  ```


## Dependencies

* To facilitate reusability, other maps can be included as dependency for the current map.
* The only required property in a game file is `Meta data`, every other property is optional.
* This should help map creators create reusable script libraries, unit definitions, environment packs, campaign bases, etc.
* This means there has to be a central *map package repository* and a *map package manager*.
* The loading order for each property is 1) base game (a special package), 2) package or 3) per-map.
* Tree shaking is necessary, so only actually used properties of dependencies get imported and executed
  (do we need a *map build tool* for that? I'm not sure, but we would need the difference between *dev* and *production*)


## Inspiration

### Warcraft III `.w3x` Custom Maps

* File format of `.w3m` files (map files of WarCraft III), see [unofficial `.w3m` docs](https://wc3maps.com/InsideTheW3M.html) by Zépir oo.
  * Warcraft III uses `.w3m` and `.w3x` files. (also called "scenarios for Warcraft III World Editor")
  * Essentially a MPQ file (MPQ seems to be an archive format like `.zip`).
  * File Structure inside the quasi MPQ `.w3x`: 
    ```bash
    (listfile)            # (internal file for MPG)
    (signature)           # (internal file for MPG)
    (attributes)          # (internal file for MPG)
    war3map.w3e           # environment (tileset); header: which tileset to use, data: height, ground level, texture,   
                          #   flags (like "Ramp" or "Water") for each tilepoint; a tileset is made up of 4 tilepoints, 
                          #   so a 256x256 map has 257x257 tilepoints
    war3map.w3i           # info map file; contains some info displayed when a game is started like map name, map author,
                          #   map description, player count, camera bounds, playable area of map, map flags like 
                          #   "hide minimap in preview screen", "use custom forces", "use custom abilities", etc.
    war3map.wtg           # trigger name file; includes categories, variables and triggers used for scripting
    war3map.wct           # custom text trigger file; custom trigger structures and their name, I'm not sure what it means
    war3map.wts           # trigger string data file; special trigger strings `TRIGSTR_***`, but I'm not sure what it means
    war3map.j             # JASS2 script file; controls custom behaviour of scenarios; raw text file
    war3map.shd           # shadow map file; each tile is divided into 4x4 and then has the value "shadow" or "no shadow"
    war3mapMap.blp        # minimap image; is `.blp` format (Blip, which prolly means "BLIzzard Picture"), similar to jpeg
    war3mapMap.b00        # ???
    war3mapMap.tga        # ???
    war3mapPreview.tga    # preview image; displayed when hosting the game
    war3map.mmp           # menu minimap; this is prolly the ingame minimap with player colors, gold mine icons, etc.
    war3mapPath.tga       # old path map file (used by WarCraft 3 Beta Versions <= 1.21), use `war3map.wpm` instead;
                          #   `.tga` is a raster image format, in this case 16-Bit RGBA-TGA; the tiles in the map are split
                          #   into 4x4 and then the color channels are used to apply path flags: RR (no walk), GG (no fly),
                          #   BB (no build) and AA (blight, the black stuff of the Undead)
    war3map.wpm           # path map file (supersedes `war3mapPath.tga); each tile in the map is split into 4x4 and then
                          #   multiple flags are applied per chunk: "walk/no walk", "fly/no fly", "build/no build",
                          #   "blight/no blight", "water/no water", 2 flags are unused, 1 is unknown
    war3map.doo           # doodads map file; defines position, rotation, scale, variant, flags and lifepoints for doodads 
                          #   like trees, levers and decorative elements like stones, grass, waterfall, etc; also includes 
                          #   the number of currently placed doodads (there is a hard limit in the game); doodad flags
                          #   are essentially "visible/invisible", "solid/non-solid"
    war3mapUnits.doo      # units and items file; contains definitions and positions of all placed units and items of the 
                          #   map; each unit and item is described by their position (X/Y/Z), rotation, scale(X/Y/Z),
                          #   player number, hitpoints, mana points, hero level, gold amount, etc.
    war3map.w3r           # trigger regions file; includes all regions and their position, name, index, weather effect,
                          #   ambient sound and region color
    war3map.w3c           # camera file; includes all cameras and their target, offset, rotation, distance, field of view,
                          #   clipping and cinematic name
    war3map.w3s           # sounds definition file; includes all sounds with sound ID, sound file path, EAX effects (drums,
                          #   combat, spells, not sure what this is), sound flags ("loop", "3D sound", "stop when out of
                          #   range", "music"), fade in, fade out, volume, pitch, channel ("general", "unit selection", 
                          #   "unit movement", "combat", "error", "user interface", etc.) and a few more
    war3map.w3u           # custom units file; includes two tables: original units table (default units by Blizzard) and
                          #   user-generated units table (custom units by map designer); the other custom files prolly
                          #   follow the same pattern, the unofficial docs are hard to understand here.
    war3map.w3t           # custom items file;
    war3map.w3a           # custom abilities file;
    war3map.w3b           # custom destructables file;
    war3map.w3d           # custom doodads file;
    war3map.w3h           # custom buffs file (this file is not listed in the outline, but mentioned later in
                          #   https://wc3maps.com/InsideTheW3M.html)
    war3map.w3q           # custom upgrades file;
    war3map.wai           # artifical intelligence file (this file is not listed in the outline, but mentioned later in
                          #   https://wc3maps.com/InsideTheW3M.html); AI includes name, race (Custom, Human, Orc, Undead,
                          #   Night Elf), option flags (Melee, RandomPaths, TargetHeroes, RepairStructres, HaveNoMercy,
                          #   IgnoreInjured, SlowHarvesting, SmartArtillery, TakeItems, etc.), starter units (gold worker,
                          #   wood worker, base building, mine building), training order, skill selection order, build
                          #   priorities, harvest priorities, target priorities, attack groups, attack waves, attack time
    war3mapMisc.txt       # gameplay constants (file format like `.ini` files); contains data of gameplay constants screen
    war3mapSkin.txt       # game interface changes (file format like `.ini` files), this prolly means a customized game UI;
                          #   contains changes made in game interface screen
    war3mapExtra.txt      # extra map properties (file format like `.ini` files); contains all changes of the last tab in 
                          #   the map properties screen, where external data sources and custom skys are referenced.
    war3map.imp           # imported file list; list of all custom imported files and their path to it
    war3mapImported\*.*   # imported files; includes custom files by the map designer, e.g. "war3mapImported\mysound.wav"
                          #   any imported files, that are not listed in `war3map.imp`, will get deleted on saving in the
                          #   world editor
    ```
* File format of `.sketch` files, see [Sketch Developer - File Format](https://developer.sketch.com/file-format/):
  ```bash
  meta.json       # contains metadata about the document (a list of pages and artboards, Sketch version, fonts used, etc.)
  document.json   # contains common data for all pages of the document (shared styles, linking page id to json file, etc.)
  user.json       # contains user metadata (canvas viewport, zoom level for each page, if uploaded to Sketch Cloud, etc.)
  pages/          # contains a `UUID.json` file for each page in the document; each file describes a layer tree of the page
    29ff939d-2d77-459e-bef9-1442b29f06b7.json
    7bd9903c-898d-4172-a0ea-1967fb9e90d1.json
    c38188af-7c2e-446e-ab86-c8db1768f77a.json
  images/         # contains all images in raw resolution that are used inside the document
    3b9c2493-2f78-49a1-bbad-f7cfc5dc83b3.png
    23fcece6-52a0-4c25-bd66-1bb28e267bc0.png
    d5f1627d-1b25-4211-8ea9-4b9b76a5eea8.jpeg
  previews/       # contains a preview image for the last page edited by the user
  ```