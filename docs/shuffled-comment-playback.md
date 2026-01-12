# Shuffled comment playback
Written on 2025-06-26

> **WIP:** 
> I need to rethink this, so the orchestrator has a pool of animation players at hand.
> If the orchestrator dump the FPS speed too much, they should reduce the pool size dynamically.
> For that we can calculate the rolling FPS (last 10 frames).
> 
> **WIP2:**
> I have implemented this but in a simplified form now. In currently visible comments, take one
> at random and play animation. Try to avoid last played comment.

 we have list of elements that  are in an animation pool.
 only one item gets animated at a time.
 this item also has to be in view,  there's no point in animating something offscreen.
 the playback of the item is semi random:
we form a pool of indices,  pick one index at random and play the  animation
 this animated index then gets removed from the pool.
 if the pool is empty, we refill it with the indices  and start anew.

animations are only started after the previous animation has finished and  the specified wait time has passed.

we also need to handle if the user start scrolling the screen.
this changes the current pool of items that need to be animated.

## Example

```
  v viewport
+-----------------+
|   [ #1      ]   |
|   [ #2      ]   |
|   [ #3      ]   |
+---[ #4 ---- ]---+
    [ #5      ]
    [ #6      ] <-- list of items
    [ #7      ]
    [ #8      ]
    [ #9      ]
    [ #10     ]
```

We load a page and we need to animate [1, 2, 3, 4].
[5, 6, 7, 8, 9, 10] are outside the viewport and not of our concern yet.

The script checks the viewport (unchanged), then randomly picks \[3] and starts animating, which leaves us [1, 2, 4].
The animation finishes, then it chooses again \[4],  which leaves [1, 2].
The animation finishes, then it chooses again \[1],  which leaves \[2].
The animation finishes, then it chooses again \[2],  which leaves \[] (empty pool).

The script checks the viewport (unchanged),  then looks at the size of the pool.
It is empty, so the pool is filled with the indices of the currently visible items, which gives us [1, 2, 3, 4].
The script randomly picks \[4] and starts animating, which leaves us [1, 2, 3].
Before the animation finishes though, the user scrolls the viewport downwards.

```
    [ #1      ]    
    [ #2      ]    
+---[ #3 ---- ]---+
|   [ #4      ]   |
|   [ #5      ]   |
|   [ #6      ]   |
+---[ #7 ---- ]---+
    [ #8      ]
    [ #9      ]
    [ #10     ]
```

The animation finishes, and the script checks the  items visible in the viewport.
The indices in the pool are updated to reflect the changes:
[1, 2, 3] becomes [3, 5, 6, 7].
Note that \[4] is not readded, because we already played it before  and the pool has not been exhausted again.

Internally we need to keep track of two lists:
1) All items currently visible in the viewport: [3, 4, 5, 6, 7].
2) The current animation pool (or animation queue): [3, 5, 6, 7].

 so every time the viewport is checked for visible elements, we need to intersect the  induces of visible items with the animation pool.
 let's call the available indices "buffet".
 like with many buffets, certain dishes are more popular.
 but this buffet in particular only gets refilled when every single item has been consumed.

```
previous pool:     [1, 2, 3]
played animations:          [4]
previous buffet:   [1, 2, 3, 4]
current buffet:          [3, 4, 5, 6, 7]
new pool:                [3,    5, 6, 7]
```

 so to determine the new pool, the steps are:
1) Determine played animations: `previousBuffet - previousPool = [1, 2, 3, 4] - [1, 2, 3] = [4]`
2) Get indices of items currently in viewport: `currentBuffet = [3, 4, 5, 6, 7]`
3) Remove animations played previously from current buffet to get pool: `currentBuffet - played = [3, 4, 5, 6, 7] - [4] = [3, 5, 6, 7]`
