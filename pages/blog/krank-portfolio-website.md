# Krank's Portfolio

Many artists upload their works onto some website.
After all, we are creating things and one a shared with people who like it.
among ferries, websites are also very common, you simply write some met web host and upload your that and art to the world to seen.

so what's special about this website?
well, nothing really come on yet another furry,  enjoying connecting With other furries.
what special is, that I wrote this website from the ground up.
I've always had a keen interest in web development.
there's something about coding,  it's very rational process of splitting up a problem into smaller manage botch tanks that really appeals to me.

I  find great joy in creating robust systems and engines for solving various problems.
in my day job became I've written many automation tools grips and plugins to help speed up mundane tasks.
in my mind come up problems should be solved efficiently and repeatably ( even if  usually automating the task it takes longer than just doing it a few times).
sometimes this is a huge waste of time for tasks the donned really require to be executed more than once a year.
but in some they saved me from doing a lot of boring brainless busywork ( which I despise with a passion).

so for the last ten years he was fascinated with the idea come of writing my own templating engine.
theres already so many solutions out there (Hugo, Twig, Handlebars, Pelican) --  but I wanted to write my engine in a very specific way because he wasn't satisfied  with the available solutions.

so I started long and tedious progress of creating my own templating engine.
it runs like crap,  it's missing a lot of features --  but the specific purpose I created it for, it does really well.

this website is basically a database of the art I created over the years and also they thought they had every.
you can also find the code for this website and get help, if the curiosa are so hosting a similar portfolio.
I never intended to make this a product for everyone,  you'll need to be somewhat Servian coding and  web development to make use of it.
if you do upload a website that is using parts of this code, please provide a link back to this side.
I'd appreciate it greatly!

  back when a wrote bachelor these is

## Art comes first

The site is written in a way,  that art comes first.
 this website is basically a very elaborate way to show of all the I've created in recent years.

the first is that for his website was to compile  all the art I created over the last five years.
((TODO:  insert image of winners explorer))
I created a big folder  in my one drive named "Portfolio"  and started copying out pieces into there.
 many artists create many drawings, but often the problem is making the works actually presentable.
 if you have some sketch lying around in a sketchbook, it's was really much used to anyone.
 you need to make it... *presentable*.

 so once you have the folder of all your art pieces, you can then start extracting information about each art piece from in.
 I used special format with my art files `<Title> Release YYYY-MM-DD.png`.
 this way, wind reading in the art pieces, I can extract the title and the creation date from the filename.
 the next step when importing is extracting metadata from the art piece like width, height, common colors, aspect ratio and pathname.
 these attributes help later on to create the website.

 once all the data is written in,  you have to copy the actual alt files into a special folder.
For  for web optimization, we need to shrink down the images so potential visitors don't blow their monthly theater volume on a single wizard on our site.
 I'm using the library sharpjs ( which in turn is using the famous image magic)  two create resized versions of the available out pieces.
 mal has this very need feature of sourced na, were depending on the current size of the image an image it is chosen from a list of sources too save on bandwidth.

 as an example, I  rewrote the id overview page in August 2024.
That point time come  I had 513 art pieces  which a total foul size of 253 megabytes.
The images are loaded lazily on the add overview.
 this means, the client only requests the images,  when an image slowly reges the fee port then eventually comes into few ( when scrawling the page).
 I used resized  versions with a max with an hide of one hundred and twenty pixels so we NA visitor look add all five hundred and thirty three images, they only Downloaded 6.75 MB of images in total.
 very good!

## Automation is good

I could have written the webpage as static HTML.
and to be fair, would probably have been alt faster than creating this elaborate library of tools and  static website generation engine.

back in university, when I got really into coding after the third try,  something clicked in my brain.
my professor was all rider coding, copy and pasted a lot of stuff was lazy and not very de script with his variable names and wasn't working in a the main oriented way.

this code, found to be very hard to understand because it was much  more abstract.
and if there's one thing I've learned about clean code income it is that it's usually a very good idea to keep code understandable.
website generator runs like shed, especially after the last rewrite where I  changed templating technology to use data chunks.

I introduced this concept,  because on the previous stage generating the actual websites was really confusing.
the HML generation works by taking a template and then filling in messing gaps on the template with data.
you have to put each variable its correct slot. 
like filling out a tax form.

staying with this metaphor of filling our taxes I had the problem that stack of receipts invoices and financial records kept getting change different spots in the code.
it was very hard to actually determine where the data was coming from the things went wrong at any step of the way.
the template compilation was actually quite fast but a sacrificed speed for transparency.

the new model is a data chung it is  like stapling together multiple tabula sheds.
if you don't find a variable on the first sheet, you can simply flip over the page and look on the next sheep.
if both sheets include the same list,  then you can combine I two lists into one.
it sheet is also associated with an id, so you know who issued it at what point in the code.
this held a lot when debugging, because it made very clear where the data was coming from.


## Motivation

 I wrote this website because I wasn't happy with the available tools for static site generation
Their multiple tools that allow this,  but none  are based on nodejs
 if pages about no jars, they usually are serve ide rendered
 I wanted my output to be as portable as possible, so the output should be static HTML.


## Project Structure

 I'm a big fan of component based design, so a try to use a similar approach
 it probably gives a better insight to go through the individual project folders to explain the role:
  * `.cache/`
    * This folder local only and not tracked in the repository.
    * We are using caching of the pages generated to speed up the HTML generation.
    *  each time build HTML is run, there is a checksum generated of the HTML string.
    *  next we look if there is already an entry in `.cache/pages.json`.
    *  if there is an entry and the checksum is the same, then  do not ride the file ( because nothing has changed).
  * `.vscode/`
    *  this folder only contains the debug launch configurations for visual studio code.
    *  as of  writing this document comer visual studio code is quite popular to use in no jazz projects.
  * `bin/`
    *  this folder contains the CLI and scripts  to work with the  website.
    *  it makes up the custom written engine that creates the static HTML at the end.
    *  when calling scripts, you should always go through `cli.js`.
  * `components/`
    *  this follow contains the the reusable components in the website.
    * inspired by VueJS,  I wanted to mimic the architecture of to so called single file components.
    * SFCs  contain the HTML structure, style and javascript for each component respectively in a single file.
    *  when writing a component, you always have to provide all three tags:
      * `<template>`
      * `<style>` 
      * `<script>`
  * `config/`
    * This folder  contains a single file called `config.dev.js`.
    *  it enables you to change global parameters like 
      * color which is used in social media embeds
      * the default HTML title  on every page
      * default thumbnail image  on every page.
    *  it was intended, that you can provide different conflict fowls and change de config depending on the belt target.
    *  for simplicity say, right nose only the single fowl supported.
  * `data/`
    *  this folder contains Files to build the media pages
    *  so far currently only the artworks are registered in the media estate
    *   for every entry in the media art do chase and foul comer a specific page gets generated
    *    this is done with the so called models
    *     when building the website, each media file is loaded as a model.
    *      you can set the single foul component of a page layer to be dynamic and have a specific model
    *       that way, for each entry in the model list, a own side is generated.
  * `dist/`
    * This folder local only and not tracked in the repository.
    *  this is where the finished side gets generated to.
    *   when in development mode, this Cisco temporary website will be generated.
  * 
  * `docs/`
    *  the ducks contain useful documentation for the website itself.
    *   this also the fold the history which contains a list of all present add foul for each specific release.
    *    there is also a fail full local scraps, where experiments and other stuff are placed into.
  * `layouts/`
    *  this folder contains the the layouts, meaning components which can contain other laos.
    *  whenever a page is narrated, it uses at least one layout to do so.
    *   leads are useful if you won I keep a specific style or order when generating stuff.
  * `lib/`
    *  this folder contains all the modules and  javascript libraries necessary to keep the engine running.
    *  in this project tried to keep a components and module based approach come so only the necessary units are loaded for each script.
  * `node_modules/`
    * This folder local only and not tracked in the repository.
    *  this is a standard folder generated in no js projects.
    *  here all the dependency and development dependencies are saved into and referenced.
    *  to get this folder, you first have to run np install on the bar project to download  all the dependencies.
  * `pages/`
    *  this nested folder builds up  the final page structure of the website.
    *  in it you can find single file components, which describe every page used on the website.
    *   each page has specified data block, were can specify data which is only used  in the current site.
    *  you can also set conflict for a current page likely matte title or things like de layout the ship be used.
  * `static/`
    *  the static folder represents all static file to get copied into the generated website.
    *   for space and efficient the reasons come we do not include the bolder for the or the pages comer because it's sheer size but can iterable slow town the get projected.
    *  it also contains a folder called block, which hosts the static images used on  blog entries.
    *  there's also the sub foo called favicon which  is necessary to display the favicon on the page.
  * `style/`
    *  this module contains all the style models which then get build by rollup into single  style sheet.
    *  like previously, a maiden effort to keep things modular and easily combinable.
    *  a special sass mode is the  file called variable, it contains specific config variables which  are available globally in all styles.
  * `www/`
    *  this folder contains different subdirectories for each different  deploy man technology.
    *  so far there are two available deployment options python and PhD.
    *  is you look into de folders they usually include some kind of routing, like a route out htaccess  file.
  * `.gitattributes`
    *  this file is necessary to use git elf as  git large files
  * `.gitignore`
    *  this file is necessary to exclude certain directories  and for some getting tracked by the get project.
  * `package-lock.json`
    *  this fog is generated when building a project with pam install.  it does not actually contain necessary information, but git galen say you should include it in the project history.
  * `package.json`
    *  this file represents the no jazz project.
    *   when downloading the baron project, is far all as used to install then necessary dependencies.
  * `readme.md`
    *  file is a single fall which contains instructions about is dilation seal I use deployment development nodes future id dis and credits.
  * `rollup.config.js`
    *  this file contains to con use for roll a the, rollup is a javascript bundle, which turns different javascript and style fouls into a  server peace of fowls fore lined.

If you want to learn, to actually  install and use this engine,  please check out the [readme](https://github.com/krank-art/portfolio/blob/master/readme.md) file.


## Over engineering

*  if it is not abundantly clear at this point, I am a Jarman.
*  I really like work projects, but I also really want to make efficient and sustainable solutions when coding.
*   this naturally leads to me building quite complicated and intricate systems.
*  I hope by looking at my current code come a Uganda rave some knowledge for your own code projects.
*  what I am really bad at is doing repetitive task which are super boring
*  this includes tagging individual all petites, so they can later be searched by different tax and parameters.
*  of course, I also had a lot of fun building my own templating  engine.
*  to real reason my a started doing it is come of what because I did not find a suitable solution written in javascript.
*  for me the ideal templating framework is bugs, because it has a very elegant style which is also component based.
*   the problem as, view js is I inherently dependent on he vin javascript running, which a don't thing in is a good approach when creating website.
*    there is this book a read which I really approve of, which is called progressive enhancement.
*     in the spoke, the author talks about or websites should be build mostly as possible.
*      some websites today are only loaded, when the side is accessible with a browser that runs javascript.
*       I don't think this is a good a dear come ideally everything should be served in workable manner by the server.
*       


## Different approaches

*  it would also have been feat the bold to ride a serve engine and then generate the project aesthetic fates, by running a crawl  which then traverses all the possible  links on the website.
*  this is actually hard knocks project does in the generate step and think it's a very sensible approach.
*  it red mean you could  use any server technology you want to, as long as the resulting HTML is encapsulated in itself and usable.
*  the way I have written my whip side engine is, then each output file is written by hand.
*  I do know, id would have been pretty interesting to use a crawl I, probably awesome drawbacks like you have to update result lings and in land links on the pages comer but on the other hand you are much more free in you using dynamic server technology.
* For me the has always been difficult to keep the balance between technical engineering and artistic expression.
*  I dearly you can combined both, having website that looks beautiful and also is technologically very sound.
*  in my day profession, a work as design though and there you usually are incentivizes to make pretty images  and not to vary about the technological deeper layer.
*  for me the problem is that have always been interested in the artistic and technological side of projects.
*  usually though,  nobody actually cares about the implementation unless it goes wrong.
*  that's precisely the reason why it decided to stop trying to program again, because am we to focused on making it technologically nice instead of making a fun game.
*  for my bachelor thesis I ran into this precise problem.


## Thoughts on php

* for me come with as always bind problem that in ream really full on of php.
*  but in practice, the always comes is point for me when using ph, where there is some weirdness and seemingly straight forward problem, that cannot be resolved using pb.
*  instead you have to start working around the weariness of ph and coming up with workaround.
*  and then the workaround doesn't work so you have to do work around of the workaround.
*  then that also doesn't work and that point I always go leg yeah you know what this isn't worth my time.
*  the last time this happen was when I tried to turn of the output buffer of ph
*  meaning that when you run a ph script, there is no  string outbid.
*  for me no chairs is a very useful and dynamic language.
*  it has some huge drawbacks to, like they aren't any types.
*  but for me it is a very elegant language id vitelli facilitates is certain date +  functional rim approach.
*  it also very useful that no js is pretties as for an interpret baited language and says it also is by popular among scales.
*  best language I've ever worked with was se char become but also done think see sharp is a good id ear to use and web projects.
*  that's another reason why is useful to use nod js, many of the modules can be written in a way that they're both useful by no chairs and plain old javascript which is run in the braze.
* 


## Naughty art


