templating engine

The templating engine handles the HTML part of the website.
Roughly speaking, the website is made up of different HTML components.

A component is a building block which can include other components.

A page is an HTML component which represents a page in the website.

most templating engines also have the concept of layouts.
a layout is a special component, that defines the HTML framework of a single page.

 the website especial in a way comer that hamlets dynamically generated for the data.

 the website is written to represent the drawn works.
 each drawing is represented as media item.

 the website basically has a readonly database, which is utilized when generating the static HTML

 components also need to support ability to have slots.

 a salad is basically an area common in which arbitrary HTML code can be inserted.

 this is very important useful when dealing with


 pipeline for generating the website

1.  Loading the information from the media Jason file.
2.  building up a queue of HTL pages cooter need to be generated.
3.  


 data

 when actually rendering the GML of page comer the data for the current page gets fed into the templating engine.

 the data is basically an an object with a prototyping chain.

the website requests an item from the data.

 if the property cannot be found in the current context the next context  the layer is evaluated.

Future outlook


## Basic concepts

### Component


template
props
data

```
<my-header links="[
  {link: '', title: '' },
  {link: '', title: '' },
  {link: '', title: '' },
]"/>
```

```html
<template>
</template>

<style lang="scss">

</style>

<script>
  export default {
    props: {

    }
  }

</script>
```