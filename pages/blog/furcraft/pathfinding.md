---
linkTitle: Pathfinding
---

# Pathfinding

> **Krank,** created 21st April 2022, updated 7th November 2023

* Units should be able to navigate through a complex terrain.
* This is usually implemented in RTS games using a *NavMesh*.
* The level geometry is used to generate a graph that represents the area on which units can move.
* Usually, a A* algorithm is used for path finding in this graph.
* This path calculation must run quickly and reliably.
* Normally one speaks here of **global navigation** and **local navigation**.
* Global navigation describes the path, that a unit must travel from a starting point to an end point in the map.
* Local navigation describes that units should dodge allied units to avoid collisions.
* The *NavMesh* itself changes over the course of a game.
* When buildings are placed, units can no longer pass through a certain area.
* As optimization, the navmesh should be split into chunks.
* When the level geometry changes, then only the affected chunks have to be rebuilt.


## NavMesh

### Terrain types

* The polygons, that make up a NavMesh, can have different properties.
* In an RTS game, there may be units that can only move on different surfaces.
* If an infantry unit is walking on a path and then comes to a river crossing, it cannot pass.
* If the unit has the additional attribute "amphibious", then it can move through the river crossing without problems.
* Different land types would be, as example: 
  * land
  * shallow water
  * deep water
  * lava
  * cliffs
  * underground
  * buildings
  * path blockers


### Shortcuts

* A Navmesh can also contain special edges that connect distant polygons.
* Theoretically, the player can build a teleporter, which the units can then take into account in their path calculation.
* The edge that represents the entry point and the exit point of the teleporter can be infinitely narrow.
* In this case it is not important how wide the unit is, it is only important that it can touch the teleporter entrance.


### Directed surfaces

* Edges in a navigation graph can be directed.
* In practice, when a unit enters the area, it can only move in one direction.
* As example, imagine a unit sliding down a ramp. It can go down but no longer move up.
* The question is comma how this direction can then be represented in the navigation graph
* Normally in the *NavMesh* graphs, everything is solved by the connection between vertices (edges).
* This would mean that a target path has to move through the surface in a certain direction.


### Data structure

* A NavMesh graph is normally represented by a cyclic graph.


## Agents

### Agent size

* Agents (or units) that use the NavMesh can have different diameters.
* For example, a tank unit has a wider footprint than an infantry unit.
* There seem to be different methods to take these sizes into account.
* The simplest method is to rerun the NavMesh creation algorithm for each unit size.
* This is kinda problematic, because the calculation effort quickly ramps up for each size variation.


### Agent grouping

* In Starcraft 2 you can move any number of units at the same time.
* Depending on the size of the group, the formation of the units behaves differently
* If you select units in a small radius and send them forward, they will keep their formation.
* If you select units from a large radius, then the units all group up at the destination.
* Units shouldn't run around when they have to wait a moment to go through a tight corridor (funneling).
* This is kinda a complex problem, because the units have to decide: 
  "Is it faster to wait for the others or to move around?"


### Pushing away friendly units

* Friendly or neutral units can be pushed away by actively moving units.
* As example, if a group of units has gathered in front of the camp exit, they must be pushed away so that the moving unit can leave the camp.
* However, this should only works with friendly units; enemy units cannot be moved.
* Otherwise enemy units could be pushed into a more advantageous position to deal with.


### Destination not reachable

* If a unit plans a path to a destination, but the destination is not reachable, then the unit should get as close as possible to the destination.


### Recalculating path

* If a unit is currently on its way to a destination and comes across a blockage, then the unit should calculate a new path independently.
* The *NavigationManager* should know, which routes are currently planned.
* If the graph of the *NavMesh* is now updated at a certain location, then all intersecting paths should be notified.
* The path should be deleted and the unit should calculate a new path.


### Blocked path by friendly units

* In Starcraft 2 you can set units to hold position.
* This means that these units do not move away, even if they are attacked or nudged by a friendly unit.
* If now a unit wants to move through them, it's slowly jerking forward and very slowly pushing the standing unit out of the way.


### Turn radius

* [Path following with turning radius and obstacle avoidance - Game Development Stack Exchange](https://gamedev.stackexchange.com/questions/188046/path-following-with-turning-radius-and-obstacle-avoidance)
* Turn radius:
  * If you have a car, it has a certain turn radius: [Understanding your Car's Steering & Power Steering ! - YouTube](https://www.youtube.com/watch?v=em1O8mz7sF0)
  * This is also called the [Ackermann Steering Geometry](https://en.wikipedia.org/wiki/Ackermann_steering_geometry).
  * The turn radius of a car is actually not at the center of the car, but at the height of the rear axle. The wheels at the front axle turn to make the car turn around.
  * If you look at a forklift, the front axle is rigid and the wheels at the back axle are rotated.
    * If the forklift has loaded a crate, the turn radius is in about the center, which works perfectly with every other unit in the pathfinding...
    * ... well except a forklift has a turn radius, or else it would flip over.
  * So for simplicity's sake, assume that the rotation point is always in the center of the object.
  * Vehicles with center turning and turn radius = 0:
    * Infantery units (any bipedal or quadpedal unit)
    * Bipedal walking vehicles (see [Thor from Starcraft 2](https://liquipedia.net/starcraft2/Thor_(Legacy_of_the_Void)))
    * Tanks
    * Airplanes (on ground)
    * Forklifts (because the front axle is rigid and the fork is about as long as the wheelbase)
    * Shopping carts (back axle is rigid, but if a person is pushing it, the model is kinda centered at the real axle)
    * Sack barrow
    * Bulldozer
    * Excavator
  * Vehicles with center turning and turn radius != 0:
    * Truck crane (with 4 axles and front + back steering)
    * Airplanes (in air)
    * Spaceships
    * Ships (ships have a lot of drag because of their mass and fluidity of the water)
    * Trains (because of their two [Bogies](https://en.wikipedia.org/wiki/Bogie) per cart)
    * Skate boards
    * Roller (because center turning point like Caterpillar CS56B)
    * Wheel loader (because center turning point)
    * Harvester (because center turning point)
  * Vehicles with offset turning and turn radius != 0:
    * Cars (turn around rear axle)
    * Trucks (trailers are a whole other can of worms)
    * Bikes
    * Bulldogs (like [Tractor Show - Traktoriáda Horní Planá 2018](https://www.youtube.com/watch?v=DP59jSKJoGk))
    * Any vehicle with a trailer
