# Unit Components
Created on 21st April 2022

* Units should have modular extendable behaviour (aka components):
* Global Systems:
  * **Renderer:** Renders the object to the screen, based on global/local lighting and a material.
  * **RagdollPhysics:** Simulates physics bodies (ragdolls) in the GameWorld.
  * **ControlGroups:** Create groups of units and add previously grouped units to selection.
  * **GameWorld:** Represents the GameWorld as a 3D space with objects usually being aligned to the terrain.
  * **NavMesh:** Represents the nav mesh, in which multiple agents move along paths at the same time.

```
Component         Affected Systems        Description
========================================================================================================================
Model             - Renderer              - Adds model map (key-value pairs) with at least one entry 
                  - RagdollPhysics        3D or 2.5D representation in world
                                          optional ragdoll model which gets used after death of a unit
------------------------------------------------------------------------------------------------------------------------
Transform         - GameWorld             Adds position, rotation and scale (X/Y/Z each) in game world (aka stage)
------------------------------------------------------------------------------------------------------------------------
Pathfinder        - NavMesh               Adds a pathing collider (a movable pathing collider should always be circular)
------------------------------------------------------------------------------------------------------------------------
Commander         - PathFinder (move)     - Makes objects receive orders like "move", "attack" or "build"
                  - Attacker (attack)     - Enables order chaining
                  - Builder (build)       - Communicates only with other components to formulate orders
                  - Harvester (harvest)
                  - AbilityManager (any)
------------------------------------------------------------------------------------------------------------------------
Selector          - Selection             - Adds a selector collider to make objects hoverable and clickable; 
                  - ControlGroups         - Makes units selectable (add and remove from Selection)
------------------------------------------------------------------------------------------------------------------------
Mover             - PathFinder            - Enables pathfinding, movement, speed, rate of turn, drag, acceleration, 
                                            decceleration
                                          - Ideally this also simulates complex movement like moving with turn radius
------------------------------------------------------------------------------------------------------------------------
Attacker                                  Enables attacking other units with a health or mana manager
------------------------------------------------------------------------------------------------------------------------
HealthManager                             Adds a hitable collider (hitable area)
------------------------------------------------------------------------------------------------------------------------
ManaManager:      
------------------------------------------------------------------------------------------------------------------------
AbilityManager:   
------------------------------------------------------------------------------------------------------------------------
UpgradeManager:   
------------------------------------------------------------------------------------------------------------------------
LinkageManager:   Links units together, e.g. trains (each train segment is a "sub unit")
------------------------------------------------------------------------------------------------------------------------
Transporter:      
------------------------------------------------------------------------------------------------------------------------
HeroManager:      
------------------------------------------------------------------------------------------------------------------------
Spawner:          Trainer?
------------------------------------------------------------------------------------------------------------------------
Builder:          
------------------------------------------------------------------------------------------------------------------------
Harvester:
------------------------------------------------------------------------------------------------------------------------
Trader:           
------------------------------------------------------------------------------------------------------------------------
Morpher:          
------------------------------------------------------------------------------------------------------------------------
ItemManager:      
------------------------------------------------------------------------------------------------------------------------
InventoryManager: 
------------------------------------------------------------------------------------------------------------------------
CostManager:      Adds constant costs to unit
------------------------------------------------------------------------------------------------------------------------
InfoManager:      Adds meta information like name, id, 
------------------------------------------------------------------------------------------------------------------------
SoundManager:     
```
