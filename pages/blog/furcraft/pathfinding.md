# Pathfinding
Created on 21st April 2022

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
    

