---
layout: blog
linkTitle: Generate readable transcripts for YouTube
---

# Generate readable transcripts for YouTube
> **Krank.** 14 October 2023

I wrote a tool to download the transcript of any YouTube video and turn the raw output into human-readable sentences: https://github.com/krank-art/extract-youtube-transcript.

It gives you a **readable** overview of longer YouTube videos.
There are also pages like https://youtubetranscript.com/, but they only have access to the user-provided or raw transcripts.

I wrote this project to make a point about rambling.
I got really annoyed with a lifestyle YouTuber who kept on rambling about productivity and not actually providing any productive information.


## Usage

**See the full notes on installation and usage in the [readme](https://github.com/krank-art/extract-youtube-transcript/blob/master/readme.md).**

```bsh
$ python main.py -v 6wkVGQ8swBg -r
```

* `-v, --video`:  
  **Required.** 11 digits presenting YouTube video id. 
  Can be optionally prefixed with an additional `?` to prevent leading dashes getting the video id interpreted as argument.
* `-l, --languages`:  
  Optional. Comma-separated list of languages to download languages of, e.g. `en,de`. 
  Note that the model can only process `en`, `de`, `fr` and `it`, but you can also try applying it to other languages.
* `-r, --raw`:  
  Optional, Flag. Print output directly onto the terminal.
* `-m, --preserve-markup`:  
  Optional, Flag. Preserve markup like italics and bold in subtitle (untested).

> **Info:** If a video id starts with a dash `-` or double dashes `--`, it gets interpreted as CLI argument.  
> You can prefix any video id with a `?` question mark to prevent this.  


## How it works

* The project uses an unofficial YouTube API to get the transcript of a YouTube video: [youtube-transcript-api](https://pypi.org/project/youtube-transcript-api/).
* The next step is to use a model to add punctuation automatically: [fullstop-punctuation-multilang-large](https://huggingface.co/oliverguhr/fullstop-punctuation-multilang-large)
* Output is then written into a text file or to console.
* Keep in mind that at the current time, the script fails if the transcript for the video is disabled (no automatically generated nor manually edited transcript).


## Examples

### GDC talk
Failing to Fail: The Spiderweb Software Way 
https://www.youtube.com/watch?v=stxVBJem3Rs
```
$ python main.py -v stxVBJem3R -r

[...]
I was wondering: if you were starting out today, would you use a your own 
engine again or would you choose some of the existing engines?

I'd probably make my my own engine because I'm a total code.

[...]

It has saved our butts so many time.

[...]

You'll find some hungry get out of college.

You hand them a basket of our earth dollars and you say: here's my mess, make 
it work.

And then they disappear and they come back and your engine works, they have 
money and something to put on a resume.

You have a working a machine that spits out dollars and you both get on with 
your lives.

But you can only do it if you have the source code, so that that is much more 
than you ask, but it's definitely yeah.

Yeah, because I think it's fun.

My engines suck, but I like writing them.
[...]
```


### Arin's Gambling Problem

GameGrumps: Arin Bets It All On 23 [Arin's Gambling Problem]
https://www.youtube.com/watch?v=hauYZzZZzhY
```
$ python main.py -v hauYZzZZzhY -r

[...]
I'm going all the way.
I'm going all the way, all the way.
Whoa, we go.
New your bets.
You [ __ ] piece of garbage, [ __ ], *ss, p***s, licker, wicked p***s.
No, no, don't you dare.
Don't you dare not on 23.
That's my number.
Stop with this.
No, you don't understand.
This is so hard to on and the fortress hits, hits hard.
It's never gonna hit.
It makes my p***s go doki-doki.
For four thousand three hundred four thousand six hundred twenty, double dollars.
Here we go close.
I'm so close.
[...]
```
