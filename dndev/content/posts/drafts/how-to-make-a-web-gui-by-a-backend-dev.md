---
draft: true
title: "How To Make an interactive GUI - for the backend devs"
date: 2023-07-28T21:00:00+03:00
---

I know some Go devs that don't know how to get started with writing
a simple web GUI for their backend. They're not dumb. They can write all 
the other parts of the software. But when they need to output data, they only
know how to produce data in simple structs (JSON, XML). Nothing you can take 
and interact it like a normal human.

Why did this happen? It's just that they don't really want or have the time to
start learning React, Redux and NextJS. 
They only kind of, maybe, have some basic knowledge about javascript. And when they
read online, you get one of two approaches:

- Learn plain html/css/js and do string templating
- Welcome to the JS ecosystem, which is actually TS, which is actually TSX...

Both options are overwhelming.

But there are many small, obscure libraries and mini-frameworks that were
built with a backend developer who just wants to interact with humans easily.

I'll try to sketch out a few ideas for you to get started with. You can mix and
match between the example, since n the base of them all is a shared set of assumptions:

### The server drives the client

Since the early days of HTML, the assumption was that the server will produce
the complete, final HTML dynamically, according to the the parameters of the 
HTTP request and the internal state of the server.

### JS is used only as glue code

Again, we're going back in time to the principals that were the base of the invention
of the thing we're working with. This time, we look back at the early days of JS,
when its purpose was to serve as a small scripting language you can embed inside your
html. We **will** use JavaScript, but we won't manage global state and a shadow DOM :)

### Interop with more complex GUI

Meaning, you should be able to embed complex GUI Components alongside 
the framework, so you can use use third part code for example.
It's not supposed to be easy to do so, just possible.


## Options

### My ACTUAL suggestion: Wordpress / NextJS / Ruby on Rails...

Just use a framework, honestly. This article is more about getting into 
doing it yourself and learning from this process. If you really just need a 
website for your business, use one of the many solutions out there. Spend money
on a good UI framework if you need to.

But, for tinkering with cool new tech, let's go over other options.

### HTMX







### Hugo (Go + html + vanilla)

#### backend 

This site is written in [hugo](https://gohugo.io).  Hugo was built in Go,
but it doesn't require you to know Go. It's a static site generator, which is only
good for you if you can statically generate all the content on your site.
It's very easy to deploy. I deploy it using GCP Cloud Build, triggering whenever 
I commit to `main` branch on github.

I will note that it's not impossible to make it work like a dynamic website. You
can run the hugo binary on your project on `dev` mode, and it will watch for changes
in your files and recompile on the fly. But I wouldn't use it if I knew in advance
that my site is dynamic.

It's aimed for blog sites, but it's also just a nice framework for building a server
for you, and you just go in and write plain html snippets, sprinkled with some code 
templating using double curly braces (`{{}}`).

#### frontend

Hugo doesn't do much in terms of *assisting* us with writing html and JS easier.
But it also doesn't stop us.

For example, in my `website/layouts/partials` folder, I can create a file called
`extend_head.html` and it will be injected by Hugo in the `<head>` part of the html.
I can use it to load or hard-code as much JS as I want.

Here's an example for getting and storing the amount of views this page has gotten:

```html
<script>
function fetchViews() {
  const pageID = document.location.pathname
  const r = await fetch(`/api/views?page=${encodeURIComponent(pageID)}`)
  return r.json().views
}

let views = 0
try {
  view = await fetchViews()
} catch (e) {
  console.error(e)
}
</script>
```

Of course, there needs to be some stateful application at the other end of that 
`fetch` call, but I assume you know how to create a backend like that.

There's a problem with the above script - it's not very reactive. When the value 
changes, it's not notifying the components that should display this number that
the value has changed. It's solved with basic polling, so it might not be that 
big of a problem. If you need more than basic reactivity, there are other options.

### 


