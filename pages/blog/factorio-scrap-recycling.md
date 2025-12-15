# Factorio Scrap Recycling

> 15th December 20225

God I love playing Factorio so much.

I suppose playing it is more fun than reading about it. 
But I wanna write down the scraps of knowledge I gathered.
On this article here, I talk about **Fulgora**, the trash planet.
You have very little space so it's actually more efficient to recycle trash *on-site* and then transport the products to the main base.

| Item                  | per Scrap |    yield |    stack |
| --------------------- | --------: | -------: | -------: |
| Iron gear wheel       |       20% |    33.3% |      100 |
| Solid fuel            |        7% |    11.7% |       50 |
| Concrete              |        6% |      10% |      100 |
| Ice                   |        5% |     8.3% |       50 |
| Stone                 |        4% |     6.7% |       50 |
| Steel plate           |        4% |     6.7% |      100 |
| Battery               |        4% |     6.7% |      200 |
| Copper cable          |        3% |       5% |      200 |
| Advanced circuit      |        3% |       5% |      200 |
| Processing unit       |        2% |     3.3% |      100 |
| Low density structure |        1% |     1.7% |       50 |
| Holmium ore           |        1% |     1.7% |       50 |
| **Total**             |   **60%** | **100%** | **1250** |

train wagon has 32 slots

scrap stack is 50 items, so 1,600 items per wagon

the scrap results average stack size is 104.167, so 3333.333 items per wagon

since yield is 60%, we can put 5555.555 scrap per wagon (on average) when processing first

that means storing recycled products gives us 3.472 times the storage of a single cart (or 247% more).

since stacks will not fill up perfectly as expected, we only expect 200% more.

since iron gears make up 1/3 of the yield, we will have one wagon dedicated entirely to them.

here is the yield with iron gears excluded:

| Item (without gears)  | per Scrap |    yield |         |
| --------------------- | --------: | -------: | ------- |
| Solid fuel            |        7% |    17.5% | ■■■■■■■ |
| Concrete              |        6% |      15% | ■■■■■■  |
| Ice                   |        5% |    12.5% | ■■■■■   |
| Stone                 |        4% |      10% | ■■■■    |
| Steel plate           |        4% |      10% | ■■■■    |
| Battery               |        4% |      10% | ■■■■    |
| Copper cable          |        3% |     7.5% | ■■■     |
| Advanced circuit      |        3% |     7.5% | ■■■     |
| Processing unit       |        2% |       5% | ■■      |
| Low density structure |        1% |     2.5% | ■       |
| Holmium ore           |        1% |     2.5% | ■       |
| **Total**             |   **40%** | **100%** |         |

If you research scrap recycling enough, there actually comes a point where transporting scrap becomes viable again.
Still, it is handy to outsource part of the scrap processing mechanism, it's crowded enough already.
