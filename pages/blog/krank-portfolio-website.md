# Krank's Portfolio Website

> Written 2025, revised 2026 January

***Why do it the easy way, when you can do it the hard way?***

<aside class="toc marginalia" tabindex="0">

**Table of content**

- [Motivation](#motivation)
- [Implementation](#implementation)
  - [Website](#website)
  - [Static site generator (SSG)](#static-site-generator-ssg)
  - [Artworks and content](#artworks-and-content)
- [Concepts](#concepts)
  - [Single File Components](#single-file-components)
- [Project Structure](#project-structure)
- [Further thoughts](#further-thoughts)
  - [Structured data is cool](#structured-data-is-cool)
  - [Progressive enhancement](#progressive-enhancement)
  - [Fear of the mundane](#fear-of-the-mundane)
  - [Static through crawler](#static-through-crawler)
  - [File size optimization](#file-size-optimization)
- [Naughty art](#naughty-art)
- [Tools](#tools)
- [about the nature of publishing](#about-the-nature-of-publishing)

</aside>

In this article I want to go through the implementations and ideas that went into building this website.
I am creative and I love web design, so I can achieve two things at the same time: 
Have fun working on a website **and** showcase my other works!

Looking at this article and the website itself, it should be apparent that I like **structure** in my work.
You can see this especially with the **static site generator** that is the brains of this website.
The actual art, the lovely comments by friends and the artistic intent are the **soul**.

During my time working on the website, there often has been this feeling of it **not being good enough**, that most features are underdeveloped, the style is too boring or that I must upload more artworks.
Like many of my projects it has become a neverending story, which I've fiddled with on and off for years now.
But the cool thing about art is, that people from the outside cannot see the expectations the artist compares themselves to.
They can enjoy the website as-is!

I doubt that many people are going to read my ramblings, but if you have found your way here: Welcome!
Welcome to City 17! <!-- Half Life 2 intro reference -->


## Motivation

Why did I create my **own** website?
Originally because I had planned a visit to a local furry meetup.
My idea was that if I neatly present my art, I can connect with people there and find friends.
I put in a lot of effort into the first build of this website and finally the day came when I went to the meetup.

And... I did not get to show my website.
The meetup went alright, I was very nervous.
I did strike up some conversations with people, but in this instance it was difficult to talk with people (maybe furries are just plain bad at socializing 🤷).
People were a lot more into fursuiting there than drawing.
I did learn something cool about how protogen suits work by a fursuit maker, she was great!

Ever since I worked on my website occasionally, mostly when I need a sink for my creative and problem solving energy.
My day job can get a little bit stale at times, so it's fun to work on technical challenges as a balance.
And would you look at that, it has been 2.5 years already!

Of course there are other bonuses of having your own website, which I will go through here:

<aside class="marginalia">

I do realize that this itemized text looks like straight from ChatGPT.
Don't worry, I'd rather have my own badly written *wordslob* (😂)
</aside>

* **Catalogueing.** \
  My art folders has become a bit confusing over the last six years and I don't even know what's hidden in there.
  There is a lot of value in preparing something nicely so it can be understood at a glance.
  Lots of respect for curators, documentation writers and presenters!
* **Presentation.** \
  Do you know what the difference is between a villain and a **super**villain? 
  Presentation! <!-- Megamind reference -->
  I'd say that about 50% of the desired viewing experience comes from framing.
  There are so many cool mediums you can use:
  Social media, movies, zines, exhibitions, stickers... **personal websites**. 
* **Technical challenges.** \
  I'm fascinated with how HTML components can be written and reused.
  I always wanted to write a templating engine that is made up of simple building blocks that together form a complex website.
  Not to mention all the other aspects of web development!
* **Artistic outlet.** \
  Due to health reasons I cannot draw much anymore.
  This made me *very* sad in the past, being with other artists and seeing them draw but just not being able to do it myself.<!--
  There is actually an absurd amount of "competition" in the furry community when it comes to drawing.-->
  So me working on my website is an artistic outlet.
  Also I can use all my past works as inertia for the little new stuff I create at a time.
* **Alternative to social media.** \
  Sharing your art is an integral part of being an artist.
  The feeling of "Good job! Let's hang this onto the fridge" is what many of us strive for.
  I try to spend only little time on social media, worrying about likes and posting artwork.
  A few times in the past I wasn't drawing for myself, but rather in anticipation of what people might like.
  And then those posts flopped.
  That messed me up a lot.
  So this website allows me to publish my artwork completely on my own terms.
* **Finding friends.** \
  This one is a little bit embarrassing.
  The first version of my portfolio I published before attending my first furry meetup.
  I was hoping that putting my art out there would impress people and that they want to my friends.
  Through drawing I made quite a lot of online friends over the years!

<!--
bdb

*    how did I create the website
*  lessons learned
-->

And to be meta, here are the reasons why I'm writing this **blog post**:

* **Pride.** \
  I spent a lot of time, thought and energy on this project.
  I am proud of all the technical solutions and artworks I've created over the years.
  This is my very own place where I have full control on how I present my works.
  So this blog post is some nice promotion.
* **Documentation.** \
  Explaining to myself and others how the actual website works.
  Maybe someone can gain some wisdom on how to create their own.
  And it also helps updating me the website in the future.
* **Writing.** \
  Writing in native language is very fun to me.
  But I also always wanted to write something in English.
  This topic is near and dear to my heart and a good choice to write about.


## Implementation

There is something about coding that tickles my brain in a good way.
It's a very rational process of splitting up a problem into smaller manageable chunks.
When coding, you're essentially creating gears, sprockets, springs and frames.
These components can then be put together into anything, like a watch.
Or an [electro-mechanical computer controlling nuclear bombs](http://www.righto.com/2024/08/minuteman-guidance-computer.html).
Just this once tho, they create a furry art portfolio website.

<aside class="marginalia">

By the way, "portfolio" is just saying "art folder" in a fancy way.
When applying to a design school or for an art job, you have to provide a portfolio with selected works showing that you know your shit.
</aside>

This portfolio website is made up of three parts:

1. The website
2. The static site generator
3. The artworks and content


### Website



### Static site generator (SSG)

Back in August 2023 I started writing this website.
I could have chosen any of the many available static site generators like [Hugo](https://gohugo.io/), [Jekyll](https://jekyllrb.com/) or [Pelican](https://getpelican.com/).
Could have, yes, but I have very specific expectations on how my website should be constructed.
So instead of doing the sensible approach and lowering my expectations, I went full-on "but I dont wanna!".
I created my own tools that are tailored to processing lots of art and output a website as deployable as possible.

A static site generator is a program that generates HTML files, which can be served on any webserver.
All browsers actually only interpret HTML files for elements on a page.
Usually the content is built dynamically on the server or (in recent years) on the client.
A bog standard example would be a PHP webserver that queries a MySQL database for all posts and then sends the finished HTML to the page visitor.
For a static site, this makes you very dependent on the specific server technology.
(Also I really don't like PHP lol, but this horse has been beaten so much, only dust particles remain.)

Well too bad though, my hosting provider only offers PHP as the backend technology. 
Because I am too cheap to step up the pricing tier.
PHP also keeps dominating the space of server-side programming languages with 75%, next come Ruby (6.2%), ASP.NET (5.4%) and Java (5.0%) (see [w3techs survey](https://w3techs.com/technologies/overview/programming_language/), last checked 2025-01-29).
So I will run into this problem again and again.
That's why the website must be built preemptively!

### Artworks and content

When I first started writing this website, I had to compile all the art I created over the last five years. 
As designer I learned that *presentation* makes up about half of your artistic value.
So I created a folder in OneDrive named "Portfolio" and started copying art pieces into it.
I feel so fancy~ 💅✨

<!--TODO: Insert image of windows explorer? -->

<aside class="marginalia">

You will not find any art files on my [Github repository](https://github.com/krank-art/portfolio) because [Github has a soft limit of 1 GB and a hard limit of 5 GB per repository](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github#repository-size-limits).
My art files alone are at 253 MB, which is well below the limit, but these are binary files so any change gets saved in the git history.
Also no, [Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage) is not a workaround, you only get [1 GB of storage](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-storage-and-bandwidth-usage) for free.
</aside>

The very first step was **staging**.
Here is my process for preparing the art files:

<!--
 you also need to go through all of your raw files, export new drawings,  give them uniform the dimensions.

Artists create many drawings... but often when meeting someone you do not have that exact drawing at hand you want to show.
Like a sketch in a sketchbook, where you first have to pull out the sketchbook and browse to the specific page.
You need to make it... *presentable*.
-->

1. Go through my screenshots and find out what drawings I created on [Anondraw](https://www.anondraw.com/).
   > In the early years of my digital art phase, I used this site exclusively.
   > Drawing together on a giant collaborative artboard really resonated with me.
   > The drawing tools are quite basic, like there are no layers or pressure sensitivity.
2. Extracted the drawings from Anondraw and create local folders. 
3. If you used any other drawing software (like [Photoshop](https://www.adobe.com/products/photoshop.html), [Clip Studio Paint](https://www.clipstudio.net/), [Krita](https://krita.org/)), you can do final adjustments on the artwork before exporting a PNG.
4. Upscale the images with [waifu2x](https://github.com/lltcggie/waifu2x-caffe/releases) if they are too small. 
   > The model in this tool was specifically trained on stylized illustrations.
   > It predates newer AI models and is unable to generate new images from scratch.
   > This is purely for upscaling and denoising, can recommend!
5. Tweak the image to improve quality:
   1. Clean up drawings by removing unrelated content and messy lines.
   2. Optionally finish coloring/painting (not recommended because you will get stuck if you do this for everything).
   3. [Adjust curves](https://docs.krita.org/en/reference_manual/filters/adjust.html#color-adjustment-curves) so faint lineart drawings are readable.
   4. Give drawings uniform pixel dimensions, e.g. `711 x 1321` --> `720 x 1280`.
      > Using *good numbers* for your image dimensions is good practice.
      > I'm a big fan of [highly composite numbers](https://en.wikipedia.org/wiki/Highly_composite_number), like multiples of 120 (720, 960, 1080, 1200, ...) or of 2 (512, 1024, ...) or of screen dimensions (1080, 1280, 1920, 2160, 3840).
      > They guarantee that you do not end up with weird pixel values when some transformation happens, like scaling down the image for a thumbnail.
   5. Make sure that the image has a somewhat common aspect ratio like 1:1, 2:1, 2:3, 4:5, 3:5, or 16:9.
      > Having uniform aspect ratios does help you.
      > If you take a photo, those usually are 3:2.
      > Most picture frames are 1:1, 3:2 or 4:3,  if you want to print and frame your artwork.
      > Instagram only allows you to upload works in 1:1, 5:4 or 16:9.
   6. Scale down the image or save as JPEG if the file size is bigger than 2 MB.
      > We are creating a website after all. 
      > If we send huge files to visitors, it takes ages to load and we use up a lot of internet traffic (this is a big deal on mobile).
      > Furthermore it slows down the whole artwork pipeline when creating the website.
      > I recommend using [paint.NET](https://www.getpaint.net/), the export window shows you the resulting file size nicely.
      > 
      > As a rule of thumb,  if you have more stylized images or graphic design, use PNG (lossless).
      > If you have a lot of detail and noise use JPEG (lossy, recommended quality rate between 75-90%).
6. Change the file name to follow the pattern of `<Title> Release YYYY-MM-DD.png`.
7. Copy the file into `/static/art`  as preparation for importing.

<!-- add megamind meme about presentation -->

The next step is **importing**.
Once you have a folder of all your art pieces, you can start extracting information from them.
I used a special naming format: `<Title> Release YYYY-MM-DD.png`.
`<Title>` consists of `<domain> <further description>`, like drawings about bunnies are named *Bunny Hug*, *Bunny Sad*, *Bunny Bear*, etc.
This helps a lot when sorting the art files by name.
From this structured file name I can then extract the title and the creation date.
I also extract metadata like width, height, [common colors](https://vibrant.dev/), aspect ratio and pathname.

All of this information then gets saved in `media-art.json`.
This file lists all artworks with **generated** properties (like file name, width, common colors)  and **user-specified** properties (title, description, tags).
The user specified properties are never overwritten and rather integrated upon reimport.


## Concepts

* Data Chunk
* Model
* component
* page

The process to generate the website is quite easy.
We take a template and fill in data.
he templating engine uses data churns


### Single File Components

Pages are built up from components and text.
Pages can have a layout which they inherit from.

![A chocolate cream cake sitting on a plate](/static/blog/page-structure.png)

The most important layout file is `default.hbs`.
It provides the boiler plate for the whole HTML pages.
There are three special  interpolations here, `&#123;&#123;&#123;style&#125;&#125;&#125;`, `&#123;&#123;&#123;content&#125;&#125;&#125;`, and `&#123;&#123;&#123;script&#125;&#125;&#125;`.
Style and script get inlined onto the page.
The HTML string of a sub component gets evaluated and then inserted at `&#123;&#123;&#123;content&#125;&#125;&#125;`.
It is a special interpolation when  a page inherits from a layout.


```html
<template>
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <!-- Meta tags omitted for brevity -->
      <title>&#123;&#123; pageTitle &#125;&#125;</title>
      <link rel="stylesheet" type="text/css" href="/bundle.css">
      <style>&#123;&#123;&#123; style &#125;&#125;&#125;</style>
    </head>
    <body>
      &#123;&#123;&#123; content &#125;&#125;&#125;
      <script type="text/javascript" src="/bundle.js"></script>
      <script>&#123;&#123;&#123; script &#125;&#125;&#125;</script>
    </body>
  </html>
</template>
<style></style>
<script></script>
```

 a layout can also inherit from a different layout.
 this is necessary because we do not want to  maintain the boilerplate like metate peached I'd learned including inline style for each individual layout.
 the special interpolation <!-- `&#123;&#123;&#123;content&#125;&#125;&#125;` --> gets evaluated for each layout step.

<!--
This is valid markup and causes the layout engine to crash
```html
<template>
  <main>
    &#123;&#123;> page-header&#125;&#125;
    <div class="blog-nav-body">
      <slot name="aside">Sidebar</slot>
    </div>
    <div class="container-blog blog-main">
      <slot name="main">Main</slot>
      &#123;&#123;&#123;content&#125;&#125;&#125;
      &#123;&#123;> page-footer&#125;&#125;
    </div>
  </main>
</template>
<style></style>
<script>
  export default {
    layout: "default",
  }
</script>
```
-->

 this is also a special layout.
  notice how we have support for individual slots ( also called blocks or regions in different applications).
 this is necessary so we actually have multiple regions inheriting page can insert its content to.
 in this case the layout aside is debases for all pages the have navigation section to the left and the main body to the right.
 this also includes the layout for the blog.
 here we can see an application where the slots are then filled with  the content of the current blog page.

<!--
This is valid markup and causes the layout engine to crash
```html
<template>
  <template for="aside">
    &#123;&#123;> page-list items=blogPages&#125;&#125;
  </template>
  <template for="main">
    <div class="blog-text">
      &#123;&#123;&#123;content&#125;&#125;&#125;
    </div>
  </template>
</template>
-->

<style></style>

<script>
  // Retrieving the blog page hierarchy was simplified for demonstration purposes
  const blogPages = path.tree.filter(page => page.path === "blog");
  export default {
    layout: "aside",
    blogPages: blogPages,
  }
</script>
```

 when we are executing the  script per layer, we are actually providing few custom variables as context to the module.
 in this case we provide the path object which during the hamel built step gathers information on what pages are actually  gonna be built at the end.
 this is very helpful information because we can then pass these blog pages into de lad himself to automatically create the page navigation.

Notice how  again we are using the special interpolation content to insert the evaluated markdown into the slot.
 this is actually again a special page type because all  block pages originate as markdown documents.
 this comes with some limitations currently, because markdown is interpreted as is and doesn't accept any handlebar interpolation.
 but this could be extended to support other page types content like a different lightweight murk up language or some custom file type two insert as HTML.
 imagine providing code listings as examples for the page which in turn then get embedded in a code view that supports actions like copy ran or provides anchors to each line of the code.

Pages are actually *Single File Components*.
This is a concept borrowed from [Vue.js](https://vuejs.org/guide/scaling-up/sfc.html).
A file is a self contained component with templating, styling and JavaScript.
Here is an example explaining each part:

<!--
This is valid markup and causes the layout engine to crash
```html
<template>
  <main class="container">
    &#123;&#123;> page-header&#125;&#125;
    <h1>Welcome to &#123;&#123; websiteTitle &#125;&#125;!</h1>
  </main>
</template>

<style>
  body {
    background-color: #222;
    color: white;
  }
</style>

<script>
  export default {
    layout: "default",
    title: "About",
    websiteTitle: "Krank's Homepage",
  };
</script>
```
--> 

This SFC groups together the different layers to make editing more clean.
For templating we use [Handlebars](https://handlebarsjs.com/).
It's a simple templating language that is somewhat obsolete by now.
Handlebars provides the following features:

<!--
This is valid markup and causes the layout engine to crash

* Interpolations `&#123;&#123;myVariable&#125;&#125;`
*  if else conditional flow `&#123;&#123;#if isActive&#125;&#125;...&#123;&#123;/if&#125;&#125;`
*   looping `&#123;&#123;#each items&#125;&#125;...&#123;&#123;/each&#125;&#125;`
*   Comments `&#123;&#123;! This comment will not show up in the output&#125;&#125;`
* Helper functions `&#123;&#123;uppercase lastname&#125;&#125;`
* HTML escaping `&#123;&#123;&#123;specialChars&#125;&#125;&#125;`
* Components ( called "partials") `&#123;&#123;> page-header&#125;&#125;`
-->


many of these templating languages seem to be very similar. usually they have these features:
* layouts
* `&#123;% blocks %&#125;`
* `&#123;# include file.abc #&#125;`
* `&#123;&#123; interpolation &#125;&#125;` (escaped)
* `&#123;&#123; interpolation &#125;&#125;` (raw)
* `&#123;# if ... &#125;` (flow control)
* `&#123;# each ...&#125;` (iterators)
* `&#123;&#123; value | uppercase | kebab &#125;&#125;` (filters)
* `&#123;&#123; myHelper(value) &#125;&#125;` (helpers)


 what is missing

* Blocks ( named regions that can be replaced when inheriting a component)
* template inheritance
  * [Jinja](https://jinja.palletsprojects.com/en/stable/) does a good job with this, see [Template Inheritance](https://jinja.palletsprojects.com/en/stable/templates/#template-inheritance).
* Arbitrary code execution

Handlebars is a minimalistic templating language by design, with all the logic offset to the data providing layer.
This was done due to security and simplicity.
Imagine working with user provided data  and then just willy-nilly executing it without any checks.
To actually use logic in your templates, you need to use helper functions.
This makes it very cumbersome though because every little transformation of data needs to be a function.
And also I'm not working with any user data here, everything happens in the backend through the developer.

[EJS](https://ejs.co/) does a very good job at this, but it's not perfect either.
It's features set and syntax is  relatively simple.
And I don't like that you have to provide all variables, if something is missing an exception gets thrown.
The best templating language I saw so far was [Blade](https://laravel.com/docs/11.x/blade#raw-php).
They have a very robust templating syntax and also allow the developer to execute raw code (PHP in this case).

By providing the `<script>` section in the SFCs I tried to mitigate this issue.
 upon evaluating the component, the data blog gets executed with the current context and then its resulting data is added to the current data chunk.
 a data chung is just structure data, to which slices of data are added instead of  mutating the  data that is already there.

I introduced this concept because it was not transparent at all where data is coming from.
This made debugging the templating system an absolute nightmare.
Evaluating and generating the final HTML was really confusing.

During the actual compilation step, the data chunk is flattened into a simple data object and  is then supplied to handlebars to fill in the final template.

<!--
the HML generation works by taking a template and then filling in messing gaps on the template with data.
you have to put each variable its correct slot. 
like filling out a tax form.

I could have written the webpage as static HTML.
and to be fair, would probably have been alt faster than creating this elaborate library of tools and  static website generation engine.

back in university, when I got really into coding after the third try,  something clicked in my brain.
my professor was all rider coding, copy and pasted a lot of stuff was lazy and not very de script with his variable names and wasn't working in a the main oriented way.

this code, found to be very hard to understand because it was much  more abstract.
and if there's one thing I've learned about clean code income it is that it's usually a very good idea to keep code understandable.
website generator runs like shed, especially after the last rewrite where I  changed templating technology to use data chunks.
-->

staying with this metaphor of filling our taxes I had the problem that stack of receipts invoices and financial records kept getting change different spots in the code.
it was very hard to actually determine where the data was coming from the things went wrong at any step of the way.
the template compilation was actually quite fast but a sacrificed speed for transparency.

the new model is a data chung it is  like stapling together multiple tabula sheds.
if you don't find a variable on the first sheet, you can simply flip over the page and look on the next sheep.
if both sheets include the same list,  then you can combine I two lists into one.
it sheet is also associated with an id, so you know who issued it at what point in the code.
this held a lot when debugging, because it made very clear where the data was coming from.

<!--
## Motivation

 I wrote this website because I wasn't happy with the available tools for static site generation
Their multiple tools that allow this,  but none  are based on nodejs
 if pages about no jars, they usually are serve ide rendered
 I wanted my output to be as portable as possible, so the output should be static HTML.
-->


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


## Further thoughts

While writing this blog post I had a lot of thoughts that touch on the website, but do not fit neatly into the current reading structure.
None of them seem particularly deep or developed, but I wanted to collect them here instead of just tossing them out.

### Structured data is cool

<!--
so what's special about this website?
well, nothing really come on yet another furry,  enjoying connecting With other furries.
what special is, that I wrote this website from the ground up.
I've always had a keen interest in web development.
-->

In my day job, I've written many automation tools and plugins to help speed up mundane tasks.
I'm a designer and in our job we have a singular, monolithic project that has been going on for ten years.
There are over 2000 artboards, many control elements and variants.
There was a very high cost of updating many artboards upon a single change.
Just imagine: you change the color of a button and then you have to *manually* go through all artboards and to *manually* update each button and then *manually* update each artboard to synchronize the changes. 
Ugh.

My design colleague saw the need for a structured approach.
While I started my job there, he laid the groundwork and built up the majority of a [design library](https://www.sketch.com/docs/libraries/) in [Sketch](https://www.sketch.com/).
Slowly but surely we replaced the static design elements with linked components from the library.
Now every time you want to update a artboard, you just have to update all the symbol instances used in the artboard.

Sketch also provides a [very well thought out and beautiful API](https://developer.sketch.com/reference/api/) to interact with the design documents.
Sketch is written in Objective C, but the API itself uses NodeJS.
This data-structured approach made it an absolute joy to develop tools for batch-editing artboards or generating new symbols for the library in all kinds of theme variants.
During my time at the company I have written a utility plugin that even has it's own UI panels -- implemented with a web view and [Vue.js](https://vuejs.org/).
Super cool!

This experience showed me that a well structured data source can generate all kinds of cool stuff.
And this also rings very true for *this* website project.
As of writing, this website hosts over 500 individual art pieces.
The naive approach would have been to create individual pages for each art file.
Upfront it would have been significantly faster, but would've also made every single change an absolute nightmare.

<!--
was necessary to introduce some kind of structured library.
My colleague built it up  a lot of the library, while a pervaded automation tools to speed up the process.

It's very rewarding to build tools that save you hours of  mindless clicking of buttons.
Tho more often than not, programmers spend more time on creating automation tools  then on the task itself.

I find great joy in creating robust systems and engines for solving various problems.
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
-->


### Progressive enhancement

For me the ideal templating framework is Vue.js, because it has a very elegant syntax and is component based.
Unfortunately Vue.js is dependent on JavaScript, either the website gets built on a NodeJS server (server side rendering) or built on the client (client side rendering). 
This goes against my philosophy of keeping the website as portable as possible (no NodeJS).
And building the website on the client goes against the philosophy of [Progressive Enhancement](https://en.wikipedia.org/wiki/Progressive_enhancement).

I read the book [Adaptive Web Design](https://adaptivewebdesign.info/) by Aaron Gustafson, and a lot messages resonated with me.
Progressive Enhancement is basically about building a website with robust individual layers.
First comes content (HTML), which is the most important.
Then you get styling (CSS).
On top comes JavaScript, which adds additional functionality (like interacting with the main menu).
The thought is to make the website more robust, so e.g. the JavaScript fails and the website is still usable.

There are web **apps** of course where JavaScript is integral to the experience, like an [online drawing site](https://skribbl.io/) or [HTML5 games](https://www.newgrounds.com/). 
But in my eyes a simple web **page** should not require JavaScript to display text.
If there is any exception in the JavaScript code (e.g. the developer made an oopsie-doodle), some parts of the website will simply fail to appear.
Maybe even the user decides to block JavaScript (lol what a goofball).

It's probably not that big'a deal, but among other things I try to use semantically correct HTML elements.
*Correctly* using semantic elements improves the [accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) of a web page, which is helpful for everyone.
Ironically enough, the [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/) has multiple examples were control elements only work with full use of JavaScript.


### Fear of the mundane

I have this pet peeve of doing repetitive and boring tasks.
Often the time-efficient solution would be to [Just Do It™](https://www.youtube.com/watch?v=ZXsQAXx_ao0), but I prefer to come up with some automated tool that can do it for me.
For example I tagged all 513 art images and I HATED IT. 
Ugh.
In this case there was no smart solution and I had to manually go through each individual image.
Tho I created a Tag Helper for the browser, which helped a lot with typing in tags and saving them in the correct format.
Huzzah! 
Total work time successfully reduced from 15 hours to ... 14 hours.

And it's really weird, I waste my time a lot during the day.
But for some reason when it comes to work, absolutely dread when I have to be dumb and mindless.
During university I had a few apprenticeships and those turned very boring very fast.
I supposed you only really start valuing your time when you sell it to someone else.


### Static through crawler


In hindsight I should have just built a dynamic  website and then integrated a crawler, that goes through all pages and saves the website as static HML files.
This is exactly what happens when you run the [`generate` command in Nuxt](https://nuxt.com/docs/api/commands/generate).
Oh well, better luck next time.

A lot of tools are specifically tailored to this, for example [`wget`](https://www.gnu.org/software/wget/manual/wget.html).
The crawler works by going through all HTML files, saving links and references to other pages and resources, crawling them next and repeat.
At the end you get a directory of all **reachable** pages and files.
You can then upload it onto a webserver and host it.

It's a very sensible approach, because you can use any server technology you want.
My own site engine generates and writes each output file by hand.


*  I do know, id would have been pretty interesting to use a crawl I, probably awesome drawbacks like you have to update result lings and in land links on the pages comer but on the other hand you are much more free in you using dynamic server technology.
* For me the has always been difficult to keep the balance between technical engineering and artistic expression.
*  I dearly you can combined both, having website that looks beautiful and also is technologically very sound.
*  in my day profession, a work as design though and there you usually are incentivizes to make pretty images  and not to vary about the technological deeper layer.
*  for me the problem is that have always been interested in the artistic and technological side of projects.
*  usually though,  nobody actually cares about the implementation unless it goes wrong.
*  that's precisely the reason why it decided to stop trying to program again, because am we to focused on making it technologically nice instead of making a fun game.
*  for my bachelor thesis I ran into this precise problem.


### File size optimization

Once all the data is read in, you have to copy the actual art files into the `/dist` folder.
For optimization, we use [source sets](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/srcset) on our images.
That means we take the original image and shrink it down to decrease filesize
That way the visitor only downloads an image that fits onto their current screen.
need to shrink down the images so potential visitors don't blow their monthly theater volume on a single wizard on our site.
 I'm using the library sharpjs ( which in turn is using the famous image magic)  two create resized versions of the available out pieces.
 mal has this very need feature of sourced na, were depending on the current size of the image an image it is chosen from a list of sources too save on bandwidth.

 as an example, I  rewrote the id overview page in August 2024.
That point time come  I had 513 art pieces  which a total foul size of 253 megabytes.
The images are loaded lazily on the add overview.
 this means, the client only requests the images,  when an image slowly reges the fee port then eventually comes into few ( when scrawling the page).
 I used resized  versions with a max with an hide of one hundred and twenty pixels so we NA visitor look add all five hundred and thirty three images, they only Downloaded 6.75 MB of images in total.
 very good!

<!--
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
-->


## Naughty art




## Tools

Comprehensive list of all the tools I use for different tasks
* Krita, paint.NET, Aseprite, mspaint
* waifu2x
* VS Code, github, ChatGPT
* NodeJS, scss, rollup
* Hetzner


##  about the nature of publishing

I've started and dropped many coding projects and never published them.
Lots of things were learned but I have nothing to show for it.
Actually publishing something forces you to bring it to a presentable state.
