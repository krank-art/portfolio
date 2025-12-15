## Little Bear Village Game Concept

> 15th December 2025


Browser based tycoon game that has a chill game loop.
It's a game about setting up production chains, building bear settlements,  and progressing the game while *not* playing.

This game concept tries to bridge browser games (**macro-focus;** schedule big production tasks and wait)  and city building games (**micro-focus;** placing individual tiles without economic overview).

Basically in the gameplay loop there are two states:

1) The actual game view where the player sees the objects and buildings.
2) The simulation that is based on functions that can run independently of the game loop.

For example, the player sets up a lumberjack and a saw mill.
The lumberjack building has a specific radius in which the lumberjack will fell down trees.
The lumberjack building is connected by a path with the saw mill.
When the lumberjack has cut down a tree, the resulting log is carried to the sawmill by a carrier bear.

## Production chain as simulation graph

Instead of updating the bear position every frame, we can map it to a lerping function.
This mapping is important for **optimization**.
We want to be able to run a complex simulation with thousands of nodes.
Maybe the player can even build on multiple planets!

We do not want to update the state of all objects for all given maps.
Only if the player specifically looks at the units we need to render the current game state.
Upon placing buildings and creating production chains, game objects get hooked up to the **simulation graph**.

We want to design the game in a way where you can skip the simulation ahead in arbitrary time units.
For example the player starts building a lumberyard and a sawmill and then leaves the game for twelve hours.
When the player comes back to the game, we need to run the stimulation for a time period of twelve hours and it shouldn't take too long.

Storage should be vast but limited.
It would be a bit silly  if a player can accumulate two billion pieces of wood by simply not playing the game for two years.
Although to be honest it does sound funny, I'm thinking of Fry right now that had one billion on his bank account after a thousand years of collecting interest in Futurama.

If an external event happens, for example the path between the lumberjack building and the sawmill is obstructed, we need to plop out the bear carrier of the delivery function simplification and back into the **game object world**.

If players can progress on boring tasks by being abscent, we encourage them to come back.
"Oh, last time I logged on was 10 days ago, surely my moon palace is done now!"
Of course, focused players that work on increasing production should always be faster.
But this way, players can **utilize previous games** into their current one by exporting the production chains they created.
Efficient!

 a possible avenue for the gameplay could be to create one of the popular idle games.
 this is also something I encountered while  sim city: Build It for mobile.
 in later stages of the game you need to wait for like twelve hours for production to finish.

The big challenge with idle games is to design the gameplay mechanics in a way that they keep being engaging and not repetitive.
I think factorio handles this really well by slowly changing the gameplay focused naturally with the progress in the game.
You start automating individual components so you can focus on new stuff.
 occasionally the previously planned capacity will run out and you need to optimize the previous solution being able to build on what you have already created.
 so in the very first stage of the game come you manually mine and smelled iron in the furnace.
 then the next step is that de automate de production of intermediary products and then seller production chains.
 in the third stage you start building bats which build stuff for you ( zou build blueprints which debuts will follow to construct new stuff).
  the fourth stage is to endlessly optimize the current factory and control the flow from afar by looking into he map overview in controlling things like the spidertron.

 when I played factorio with the DLC space age this actually kept me engaged on a single save file for like 200 hours.
 eventually I did grow bored of it the, when the only goal was to endlessly optimize the current factory and get the best gear and most efficient results to pursue an arbitrary goal.

 really, like with most idle games and taken progression games, the journey is the important part were you always have the next goal in sight and move towards it.
 different tycoon games handle this pursue of goals differently.
 for example in rollo coasted taco an one in 2am you get to play different scenarios and need to achieve a specified goal in a specific timeframe.

 browser games like O-game handled this problem by supplying a MMO feature to their game.
 gamers each work on their project and can then  trade with each other or  attack each other's planets for nice booty.

 one inspiration for the game concept I'm thinking about is Onslow the settlers three and four.
 in these games you have queued little guys did keep walking around a new base.
 zou set up production chains and ate very and you train a small army to forcefully fight down the enemy player.
  the micromanagement and combat system is really simplistic and not the point of the game.
 instead defun part is to set up the production chains and slowly turn you small settlement into a sprawling village with powerful fighters trained at the academy.
 what I did not appreciate about this kind of game is that after playing for campaign missions, you notice that the rand gameplay loop is always the same.
 zou start by setting up a production taine to good lumber in stone, but you need to do this on every run.

 so I thought about, what if the settlements you build in previous sessions are actually available for you in the current sessions?
 that way there actually is some progression in the game playing mechanic and you do not need to always repeat the same five steps by setting up the basic production chains.
 it is kinda the same problem I notice while playing the industry giant gold edition.
 the game was fun to me for like twenty hours coming but when I had to do the same thing for three plays in aroma eventually grew bored of the gameplay mechanics.

 I think what would help the player with the gameplay decisions is to limit the size of each title where they can build a settlement

 I was just also thinking about minrecraft, which offers fun play stiles for a wide range of gamers
  there are the players just just want to create fancy builds by using only their hard work to come up with the necessary ingredients to build their own portal


Oleg Bobrov has written an article about [mediocre gameplay depth in management games](https://www.gamedeveloper.com/design/what-should-we-do-with-mediocre-gameplay-depth-in-management-games-).
In the article he goes on about how many management type gains are pretty boring because you always do the same thing.
For example, the most interesting part for many people in city skylines is not the aspect of building the city  but solving the traffic problems that arise with many people moving through the city at the same time.
 when actually placing down the city you just assigned regions place down the utility buildings and then you watch it grow he always do the same steps to achieve the goal.

this is also why I grew bored with some of my favorite tycoon games.
In the settlers IV for for example, yu always setup the same production cycle in each mission.
This is fun the first three times bet after while it becomes quite boring to always throw the same solution at the same problem.

The gist of the article is that developers should implement simulation mechanics that naturally lead to interesting gameplay situations.
The idea I had in that moment for the bear game I wanted to create, is asking myself what do bears actually enjoy.

 bats are usually solitary creatures, defied with other bas for a territory they control.
 they roam around in forest areas and near urbanized sites.
they hunt and gather, they need to feed on much as possible to survive the impending hybernation.

 so naturally the idea I had come up bears and food would go quite well together.
 we can add a fun experimentation part, where people can experience by creating the different ingredients.
 this was the most fun aspect for me when playing the legend of zelda the breath of Ewald, just combining seemingly random ingredients and coming up with increasingly fancy dishes.

Lets say for example that we want to create lasagna:
We need pasta, ground beef, tomatoes, onion, celery, cheese ( this is a simplified ingredient list).
That gives us multiple production chains we can setup.

Pasta:
| Input         | Work station | Output           |
| ------------- | ------------ | ---------------- |
|               | Wheat fields | Durum wheat      |
| Durum wheat   | Mill         | Flour (semolina) |
| Flour + water | Mixer        | Dough            |
| Dough         | Roller       | Pasta            |

Ground beef:
| Input         | Work station | Output      |
| ------------- | ------------ | ----------- |
| Wheat + Water | Cow stable   | Cow         |
| Cow           | Butcher      | Beef        |
| Pork          | Mill         | Ground beef |

We could change the games goal that you need to acquire as much tasty food as possible so that the current bear population lives through the winter.
This way we add some pressure/urgency so the player cannot just slack off and do nothing all day.

Interesting gameplay mechanic I can think of is if the bears start  turning things into food, that they are not supposed to.
 suppose we have a stable and we need to catch wild animals in order to breed them and later butcher them for their meat.
 zou can catch wild cows and pigs and chickens.
 but you could also put bears into you stables and breed bears and butcher them, turning your society into a cannibal one.
Theoretically this would lead to mayhem  because the bears start acquiring taste for each other and start diminish themselves.

It would also be a fun mechanic to have bears that actually have relationships with other bears.
there are the straight bears the gay bears and the nonbinary bears.
you can also kill/delete bears,  which lowers a hidden meter called the "bear standing".
 this best standing describes how much the bas agree with the current play style of the player.
 if you play like an altar crud or if you do not treat your bears welcome this meter will go lower and lower.
 thoughts of the bears will appear where they think "our benevolence creator is not so benevolent after all".
 if you do this too much, then bears will start protesting and go rogue and not be commendable by the player anymore.

 I also had the idea of a day and night cycle, the mine that the bears work for sixteen hours day and then they rest for 8 hours a day.
 bet will actually start families  and live together in little houses.
 these houses need a constant supply of food and allot more during the hard winter months.
 if bears do get enough food they will produce offspring.

 the bars are loving creatures and usually when they spend time together and they are somewhat compatible they will fall in love eventually and move in together.
 I thought about how to best implement the socializing mechanic and I think it would be a derivation of other mechanics.
 for example, the bask can only meet during the day when they are working  or if they are unemployed.
 if the paths of two career bears cross, they start talking with each other ( social interaction happens).
 if a career bear walks to a lumberjack the courier and a lumberjack will talk with  each other.
 the other mechanic is that base currently do not have a job start clumping together.
 this is actually a fun mechanic where it's advisable that bas first spent some time together while they're young to forma relationship and then later start a job  because there they are potentially isolated and do not have as many opportunities to socialize.

 barrels do have an intelligence rating and not every barrel is fit for every job.

 I thought about how to make the game more interesting and the thing a valid approach would be to just make it more unhinged.
 how about the various machines require some energy form in order for them to run.
 an early version would be a generator where they can just fire coal and wood.
 there is the green alternatives with wind turbines and in  the late game you can even build a nuclear power plant.
 but if the bells are too stupid to operate in nuclear power plan it could potentially lead to catastrophic failure.

 on the other hand it would be a fun mechanic if pas slowly reach the ranks of veterans if they do a task more antes add bonus on the production output of building.
 imagine that the sama where a worker has worked for three real life hours, he then gets a production bonus of 20%.
 the game is special in the sense that the bears cannot die through aging.
 on a different note, if there is a overpopulation of bars, then the player needs to get rid of them.
 the player has control on how much food the bears get, the bears require a minimum to survive they have a limit on how much they need to be happy and the highest limit is for them they need to create offspring.

 by thinking of all these mechanics I still have the macroeconomic simulation in mind.
 each feature that gets implemented should have a  functional programming representation in the simulation.

 if I want to make an idle game that also respects the passing of offline time, we essentially need to make two states of gameplay.

 their simulation starts playing the moment the player creates the safe file and always runs.
 if the player is currently playing the game comer than the simulation is update at a fixed time interval.
 if the player stops playing the game, then opens it again fifteen hours later,  we will run the simulation for the past fifteen hours and  the player will have the feeling that the game has progressed in their absence.
 we could take this a step further and try implementing a animal crossing type calendar thing.
 we want the player to play the game with not much energy and then occasionally check back on how the bows are doing.
 at the same time, we do not want to have all the known bars gone the next time they check back into the world.
 brothers some changes by these simulations are pause till the player starts playing the game again.

 he imagined the situation very the nuclear power plant is operated by a bunch of stupid bears.
 this increases the change of failure to the initial 0% to a specific percentage value.
 now when the simulation is run for an extended time. Like fifteen scam it could occur that a catastrophic failure happens.
 it would be a bit shitty to just blow up the world of the player in their absence, when the simulation catches up to the current state  and then beyond that.
 it would also be site to  stash the catastrophic buildup  and the moment the player opens the game and enters the gameplay stayed again just explode the nuclear power plant immediately.
 there needs to be a grace. Where the player can react and if the conditions are right they can diffuse a potentially dangerous situation.
 to diffuse the dangerous situation the player would have need to have made some preparations, like with the nuclear powerplant if things are already this bad it will just explode.
 but maybe the player can mitigate the explosion so it is smaller ( like playing concrete walls about a section of the reactor).

```
  R  Forest stock
 R0  Initial forest stock
  r  logs/s
tau  travel delay

Forest stock: 
  R(t) = max(R0 - rt, 0)

Depletion Time:
  T = R0 / r

Production lumberjack:
  p(t) = { r  0 <= t < T
         { 0  t >= T

Delivery into sawmill:
  d(t) = p(t - tau)
         { 0  t < tau
  d(t) = { r  tau <= t < T
         { 0  t >= T + tau 

location     action         dt   product
----------------------------------------
Lumberjack   cutting tree   1s   log
Jack->mill   delivery       3s   log
sawmill      cutting wood   3s   planks

so i do need a queue

Lumberjack walks to tree         (1s)
Cuts down tree                   (1s)
  Forest lumber count 2082 --> 2081
Lumberjack walks back with log   (1s)
  Lumber house log count 0 --> 1
Carrier picks up log             (1s)
Carrier walks to sawmill         (3s)
Carrier drops off log            (1s)
  Sawmill log count 0 --> 1
Sawmill starts cutting immediate (0s)
  Sawmill log count 1 --> 0
Saw mill cuts up log into planks (3s)
  Sawmill planks count 0 --> 1

Time forest count went down to plank count
1 + 1 + 3 + 1 + 0 + 3 = 9 seconds
```

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mrow>
    <mi>R</mi><mo>(</mo><mi>t</mi><mo>)</mo>
    <mo>=</mo>
    <mrow>
      <mi>max</mi>
      <mo>(</mo>
      <msub><mi>R</mi><mn>0</mn></msub>
      <mo>&#x2212;</mo>
      <mi>r</mi><mo>&#x2062;</mo><mi>t</mi>
      <mo>,</mo>
      <mn>0</mn>
      <mo>)</mo>
    </mrow>
  </mrow>
  <mrow>
    <mo>&#xA0;</mo>
    <mi>T</mi><mo>*</mo>
    <mo>=</mo>
    <msub><mi>R</mi><mn>0</mn></msub><mo>/</mo><mi>r</mi>
  </mrow>
  
  <!-- Production -->
  <mrow>
    <mi>p</mi><mo>(</mo><mi>t</mi><mo>)</mo>
    <mo>=</mo>
    <mrow>
      <mo>{</mo>
      <mtable>
        <mtr><mtd><mi>r</mi></mtd><mtd><mn>0</mn>&le;<mi>t</mi>&lt;<mi>T</mi><mo>*</mo></mtd></mtr>
        <mtr><mtd><mn>0</mn></mtd><mtd><mi>t</mi>&ge;<mi>T</mi><mo>*</mo></mtd></mtr>
      </mtable>
      <mo>}</mo>
    </mrow>
  </mrow>

  <!-- Delivery -->
  <mrow>
    <mi>d</mi><mo>(</mo><mi>t</mi><mo>)</mo>
    <mo>=</mo>
    <mi>p</mi><mo>(</mo><mi>t</mi><mo>&#x2212;</mo><tau/></mo><mo>)</mo>
  </mrow>
  <mrow>
    <mi>d</mi><mo>(</mo><mi>t</mi><mo>)</mo>
    <mo>=</mo>
    <mrow>
      <mo>{</mo>
      <mtable>
        <mtr><mtd><mn>0</mn></mtd><mtd><mi>t</mi>&lt;<tau/></mtd></mtr>
        <mtr><mtd><mi>r</mi></mtd><mtd><tau/>&le;<mi>t</mi>&lt;<mi>T</mi><mo>*</mo>+<tau/></mtd></mtr>
        <mtr><mtd><mn>0</mn></mtd><mtd><mi>t</mi>&ge;<mi>T</mi><mo>*</mo>+<tau/></mtd></mtr>
      </mtable>
      <mo>}</mo>
    </mrow>
  </mrow>
</math>

## Inspirations

MyColony, The Settlers III and IV, Factorio
