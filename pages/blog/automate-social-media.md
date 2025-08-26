# Automate Social Media
Written on 2025-08-05

So far this only is an idea peace but not actually realized.

**I had met my first boyfriend through social media.**
It wasn't planned, it kind of just happened.
He reposted a couple of artworks of mine, I reached out to him via private messages.
From there things developed on its own peace.
While the relationship didn't last long, it showed me the greatest benefit of using social media: **connecting with people.**

The downside is, social media has also caused me suffering.
With my unique set of mental hangups, especially the like numbers, the comparison with others, the unpredictability and the mismatch between effort and response has made me feel worse.
When I get too invested, I tie too much of my personal worth to the platform.
This comparison is inherently built into the system, but I'm as particularly sensitive to it.

So my clutch idea to solve this is to automate posting on various social media platforms.
This way I'm shielded from the addicting cycle of posting and  acknowledgement.
But I can still connect with people by creating art.
It's a way to trick the algorithm.


## Proposal

Last year I bought a small mini PC to use as personal web crawler  and for other Linux projects.
It's a [NiPoGi AK1PLUS](https://www.amazon.com/dp/B0C1GV3QK8) with Intel N100, 16GB DDR4, 512GB NVMe SSD for 200€.
After installing Ubuntu 24, I was left with a reasonably powerful mini PC.

With this machine I want to utilize existing APIs  and if none are available, automate the UI with [puppeteer](https://pptr.dev/).
The final workflow would be to 1) prepare posts in advance  on the local machine, 2) run a cron job  daily to post on the various social media sites, 3) push  a notification on my phone if everything went all right.

As of right now, my website has [512 art posts](./art).
It is more of a personal archive than really a portfolio to show of my works.
The artworks are also annotated with tags, description and metadata.
All this data can be reused to post on social media.
It's a very nice backlog I can use if I am slow on new artworks (which I am lol).



