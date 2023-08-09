---
draft: true
title: "Code Generation in Go"
date: 2023-07-28T21:00:00+03:00
tags:
  - Go
  - Code Generation
---

# Draft

I want to say why I think we *should* be doing code generation the way Go does it. I don't think Go's
approach is new or particularly unique. But it's just a good example I know.

I came to understand I will always prefer writing statically typed, compiled programming. If I have
all the types and sweet sweet compile time checks, I don't really need to learn the language 
or the pkg/sdk I'm using. I let autocomplete and the compiler to just tell me when I'm wrong. 

But I feel like I need to write a lot of non-trivial boilerplate all the time.
For example, writing and maintaining `json` tags on a struct is manual, somewhat fragile work.
I prefer just declaring "do this in camelCase" instead of manually camelCasing everything. 
Also serializing an SQL query and deserializing the response into and from a struct 
is basically the same thing as with the json tags. 

I learnt that dealing with runtime reflection is not something to do without care. I agree, but
I think sometimes people take this warning and stay away from reflection, instead of learning it 
more. But I think it's missing the point of the original warning - we need reflection sometimes,
so we better know how to do it proper.

So I want to start doing it proper. I think code generation (pre-compile time) proves to be
a successful strategy in most if not all popular programming languages. I've been wanting to write 
a complex program where I use `go:generate` to produce everything that is not the core business logic
of the app. Meaning, in plain terms, solve easy problems with code generation, and hard problems with 
good ol' plain Go. 

And it's not like I'm inventing something here. `go:generate` exists, so obviously most of the 
community knows about it. There are also good projects that utilize it heavy like k8s and kubebuilder.
I think that **using** these tools is very easy and straight-forward. But not as much as ***authoring***
one of them. And I haven't even started talking about other languages like C, C++, C#, Rust, Java...

So I want to create a tool that will help me create code generation tools. What I mean by that is that 
I want to create a wrapper around the standard library `go/*` packages, that is opinionated towards
making it easier to write binaries to use in `//go:generate` comments. 
That means mainly helpers around reading code and parsing it to something easy.

Generating the actual generated code is not that hard once you've parsed the Go code. 
> The secret is to use string templating, and not
  [trying to construct an AST](https://github.com/dave/jennifer).

In fact, reading the code is the only real problem. And I haven't found any existing tool that tries 
to solve this problem.

So I guess I'll write it :)

#### My Early Years

I only used macros in Uni, when I learnt C. This obviously means I never
Did production grade macros, but the idea always made sense to me, and I 
wanted to do more with it.

I really liked C. It was not the best language, but I liked it better than 
python and Java/C# (which were the only languages I knew at the time).
I was in Uni, so I wasn't worried about productivity (which is what I mostly worry
about since I left Uni).

I was "worried" about understanding what is really going on under the hood
after I give my text file to the compiler. All these high level languages worked,
but they abstract too much for me to understand back then.

However, in C land, there were no features. There wasn't a virtual machine, not much
type related features (remember that my context was python and Java), and all the
rope you wanted to hang yourself with.

I learnt so much from writing C. We were required to write a Chess game with a desktop
GUI, from scratch. No DOM to manipulate, no components, no scaffolder.
We literally started with something like 

```c
int main(...) {
  int exit = 0;
  while (exit == 0) {
    ...
  } 
}
```

By the end of the semester, we had a working desktop game, with a custom
implementation of a rendering engine, a chess AI (min/max) engine, and some other libs.

Most of it was done with zero maintainability in mind, so we copy pasted a lot of code
with minor tweaks. We didn't need to refactor it since it was just a project with a grade,
but it left me thinking how would I go about refactoring this, if I needed to.

I didn't have many tools in my toolbox back then, but I just learnt Java's OOP,
and I believed it was great! I really did! Shows how young I was :)

So, obviously, the way to refactor was to abuse the type system. 
I would have used generics for things that made sense: We implemented
"max", "sum" and other common functions again and again, with different types.
Obviously in Java we would just use some generic class for everything.

But then I learnt that C developers were way ahead of me. And the way I learnt C 
solves this problem is by using **build time "macros"**.

At the very basic level, C macros are simple string replacements.
For example,

```c
#define min(A, B) ((A) < (B) ? (A): (B))

#define MakeRenderFunc(T) int render_T(T comp) { /* <generic code> */ }

MakeRenderFunc(ComponentA)
// int render_ComponentA(ComponentA comp) { /* <generic code> */ }
MakeRenderFunc(ComponentB)
// int render_ComponentB(ComponentB comp) { /* <generic code> */ }
MakeRenderFunc(ComponentC)
// int render_ComponentC(ComponentC comp) { /* <generic code> */ }
```

Note that the `/* <generic code> */` part can also be built with generic macros.

Obviously this kind of generics implementation is contrived and awkward, but I
think it shows the point of how much power can be achieved with simple string 
manipulation over your source code, before you actually send it to be compiled regularly.

But, is this really a valid implementation of Generics? Uni me would say no.
Generics in Java also work at ***runtime***, so C is not as good.

Ho boy was I wrong.

#### Junior Full Stack Developer

JavaScript. JavaScript everywhere. 

> Insert GIF

My first job as a student was building applications in javascript everything.
It was called the "MEAN Stack", for Mongo, Express, Angular1 and NodeJS.
I'll just come out and say it - I wasn't good. We were creating apps
that had so many performance issues and bugs that they were really unusable.

And I used "generics" everywhere: I wasn't using TS or anything fancy like that.
So every function is generic, and I could abuse reflection all I want.

I had the "cleanest" code ever. Everything was divided into small functions and
I used "functional style" programming everywhere. I was the king of the one liners.

But then the bugs came in, and I had nothing to do. I didn't know how to
put a breakpoint in a callback, and even if I could, sometimes the callbacks
wouldn't fire and I wouldn't know why. Eventually we found and fixed the bugs
but we wasted a bunch of time looking for them.

And then the client wanted a change, which seemed pretty trivial from the outside,
but it meant changing so much of my code because I didn't plan ahead for this option.
My generic code wouldn't fit the new stuff, because I made some (what I thought were)
harmless assumptions. So we did patches over patches, making to code brittle each time.

This projects were usually a failure. The customers felt scammed, as they very explicitly 
told us. And I honestly don't know if were scamming or just very unprofessional.

Anyway, then I then graduated and went to work in a real company.
We had a (newly declared) legacy system written in ruby (on rails of course).

Again, I had no types. At this point I was frustrated from not having types,
but still optimistic. I thought I just didn't *do it right*. I didn't write
dynamic-typed OOP code how *I should have been*. Or so I was told by books like 
"[Practical OO Design in Ruby](https://www.poodr.com/)", Clean Code etc., and 
blog posts and such.

So, to make it shorter, I was hopeful but very soon disappointed.
Even this big company (well we were like 30 devs but still), all working on the same
project (what we would call today a monolith), still deal with the same fundamental problems
when I was at my previous job - people started off with something that seems like a very good 
design and abstractions, and within a few months the abstractions are too restrictive, and
the things the code assumes to be invariants in the system are no longer true. But it's too 
hard to refactor out. People tried and failed.

So what's going on? How would you scale a code base?

Neither dynamic or typed languages (that I knew) produced easy to read code
that was also easy to maintain, or keep somewhat DRY. I was already done with "DRY everything"
by now, but I couldn't disagree that writing the function "min" for every type individually 
didn't make much sense.

And then, finally I started writing Go. I'm fortunate to have made a 
[blog post](https://tech.minutemedia.com/dynamic-ducks-vs-static-gophers/) about it, at the time.
The gist of it is that I was really happy working with Go's type system. 
It didn't have generics, but it had reflection where you would usually find generics in Java, or basically
any function in JS or ruby. 

But reflection is worse than generics, no? Well, I think so. But how much worse is it really?
Is it really significantly better? No, I don't think so. My reasoning is a bit simplistic, maybe:
meta-programming, generics and raw reflection just work really nicely in Go, as long as you apply then only where
it actually make a difference.

###


---

# Real