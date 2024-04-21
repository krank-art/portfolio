

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


