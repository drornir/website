---
draft: true
title: Untitled rant
---

The web frontend world needs to split into two distinct schools.
By "school" I mean

> *An institution for instruction in a skill or business.* - [wordink](https://www.wordnik.com/words/school)

Because there are two types of programs that run in the browser.

I'll call them "sites" and "apps".

I'll try to define them through a programmer's point of view. Or at least mine :).
By that, I mean that when I right web stuff, I probably have some idea of the thing
I'm trying to build, and I need to start choosing the right tools for my thing.

Usually (and hopefully), the thing that I'm building has a set of intrinsic constraints
that affect the architecture. In my life, all projects required some sort of a client-server
architecture. Not surprising, I know.

For "normies", a client should come with a GUI. And that GUI should be easy to 
install. For "non-normies", you can (and should) add a cli. But end of the day,
we're all on the spectrum of normality :). GUIs are essential if you want to 
display a large amount of information, in a non trivial way.

So yeah, we probably need to write a GUI. But how? Well, usually a web based GUI
is just the best approach. I know it's a controversial take if you're not a javascript
developer, but hear me out: Everybody has a browser. Little children know that 
clicking or tapping on the green popup that says "Confirm" will do the thing that
you wanted to do in the first place.

Most GUIs are build from tables that can be filtered and reordered, wrapped in some
text explaining things, some buttons on the left side to navigate out of the page,
and some buttons on the right to navigate deeper into the items displayed on the page.
Now, maybe instead of the table, you present the data somehow differently. Maybe
is just more text, or maybe it's an audio or video file. Maybe it's a cool vector
animation that's computed at runtime. Very cool, btw! But usually you would still 
contain that within a square box, have a menu on the left and some buttons to click
to interact with the content.

Mind you, I'm making a generalizations. I know exceptions exist, but most things kinda look like that.

It might be a chicken and the egg problem, but HTML really makes it easy to write 
GUIs that look and behave like that.

---

Ok, so choosing HTML5 is pretty easy. Most applications today run on HTML5.
I'm writing this in vscode, which is an electron-based application. You are reading 
this in a browser (right?), which is another HTML based application.

So HTML5 can do a lot of things, but as you probably know, there is much variance
between those applications. This blog is just one html file sent of HTTP.
It ships with some js but honestly I'm just writing a markdown file and 
[hugo](https://gohugo.io/) takes care of the rest.

But, again, I'm writing this in vscode. So you technically *can* do whatever
you want with javascript, and be decently productive with it.

But there's a fundamental difference between these two GUIs. This blog is just
a plain website, just displaying text with links around it. Nothing interactive really
happens here. You can technically just use `curl` in order to use my website.

However, vscode is completely different. Without the interactive part, vscode is
useless. It's not just presenting data to me, it's adding much more value on top of that.

Going back to my original point, this level of interactivity is what, in my opinion,
makes the first distinction of a "site" from an "app": Sites are meant primarily 
for consumption of data, and apps are meant primarily for authoring something.


