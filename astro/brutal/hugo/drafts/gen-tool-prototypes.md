---
draft: true
date: 2023-08-26T13:30:00+03:00
title: "Prototypical Development of My Go Code Gen Tool"
cover: 
  image: /covers/awkward_gopher.jpg

tags:
 - Go
 - Code Generation
 - Prototypes
---

In [my last post](/posts/why-code-generation/) about code generation, I expressed
my general interest in leveraging the power of code generation as a form of 
metaprogramming.

Unfortunately, I didn't find an existing tool or library that did what I was looking
for. Briefly, all of the existing tools I found were "finished products"; The
tools usually use the standard go library tools like `go/ast` and 
`golang.org/x/tools/go/packages` directly, and are oriented towards doing
the one thing they need in order to create a CLI tool.

What I was looking for is some sort of abstraction and simplification of the 
standard tooling, to streamline the process of creating new CLI tools.

I'm not fundamentally against using the standard library directly. However, 
while trying to actually do that I noticed that there was an inherent problem with 
using it directly - it's meant to cover 100% of the language features. This leads,
to the API of the standard tools to be big, and requires you to learn a bunch of
stuff you might not actually need just in order to ignore them correctly.

I don't want to get too much further into the details of the complexity, but I
think it's rather obvious that using the standard tooling directly requires some
learning once you get your hands dirty and try to use them for the first time.

## Step 1 - Staring at the problem

However, **I'm not trying to cover 100% of usecases!**
My "flavor" of code generation is not very interested in what happens in runtime.
At least not to the extent that `go build` is interested in.
I'm interested in understanding the **data structures** in the code, and *not*
their **behavior**. For example, this is a part of code that I care about:

```go
import (
  "encoding/json"
)

type MyResource struct {
  *Metadata
  Spec MyResourceSpec
}

type Metadata struct {
  Namespace string
  Name string
}

type MyResourceSpec struct {
  SomeData string
  Children []MyResource
}
```

Now, these types might or might not have methods attached to them, but for the
purposes of (de)serialization, we don't really care about them.
In this example, the idea is that it would make sense to generate an OpenAPI v3
compliant yaml file for `MyResource`. This is what 
[kubebuilder.io](https://kubebuilder.io/) does, among many other things.

When you look at this piece of code, you "can see" the jsons that this struct
produce. I don't think we'll disagree that this is a valid json to the "schema"
represented by these three structs:

```json
{
  "metadata": { "name": "dror", "namespace": "human" },
  "spec": {
    "someData": "is a dog owner",
    "children": [{
      "metadata": { "name": "balfur", "namespace": "dog"},
      "spec": {}
    }]
  }
}
```

This schema is intuitive to us human developers, but as a piece of code it's not
as easy to parse and expose. I still don't have solutions, but let's look at some
of the problems:

First of all, my types are not defined in the order in which they need to be parsed.
`MyResource` is defined first, but `MyResource` depends on `MyResourceSpec`, so 
the latter needs to be parsed before `MyResource`. This is not handled for you
by the normal go tooling.
If you need the types in their topological order of definitions, you'll need
to calculate that. There are many helpers from the standard tools, but I can't 
say it's easy, especially once you start crossing package borders 
(consider the schema of `X` in `type X json.RawMessage`).

You probably noticed that the definition is recursive. 
`MyResource` is composed of `MyResourceSpec`, which has a slice of `MyResource`.
This means the schema object actually needs to be recursive as well.

How should pointers be handled? Are pointers a sign of an optional? This is
a patterns that is used (a lot), but I try to avoid it when I can. I prefer
the `ok` pattern, or structs like `sql.NullString`

With this in mind, I had enough understanding of the problem to write down some 
code.

## Step 2 - Prototype using brute force

I setup a small dev env for this project, added a Makefile, and started with a
simple package with a function called "`Load`", just like 
`golang.org/x/tools/go/packages`. I added a small example project (a file like
the one above), and a small unit test for it.

The idea was to use the test to run my code, and print-debug it. I even put an
actual breakpoint at the start, just to see how things look like.
I spent a few days trying to implement a basic visitor that just logs where it 
is passing.

After that, I needed a few more days to learn the extra tools, like `go/types`,
that are used by the normal go build tool. They're great, but they don't provide
abstractions. They're tools that compute something from the AST, which you can
use for your own computation. Meaning, they're libraries, not frameworks. 
Which is good, don't get me wrong! But I want a framework 😉

After four unsuccessful attempts to implement it (yep, four times I created a 
new pkg and started from scratch), I understood I need to think deeply
about how I walk the AST before trying to code it. Or, even better, let's just
copy what kubebuilder does! Right?! Should be easy enough!

## Step 3 - The "I had no idea it was this complicated" moment

There is is so much stuff there. I'm not saying there is too much. But there's
a lot. There are multiple abstractions for the same concrete type, each abstraction
fitting to a different type of computation.

So I dove in, trying to copy ideas and the algorithm rather than the whole code.
I try to simplify where I can, but then I understand why they made the thing
the way they did, so I end up having the same abstraction. So for about a week
I've been doing that, and my simplified version looks more complicated than the
original.

At this point, I have nothing working. Nothing to test. A few years ago I might
have panicked that it's been a month and I haven't gone anywhere. But I did.
At this point, I'm fairly confident I understand about 70-80% of the problems
I'm trying to solve. And that's the whole damn point of doing those prototypes.

To use them as tools to learn and throw away.

## Step 4 - Design a New Prototype, and Repeat from Step 2

So now what I'm trying to do is learn more about how 
[Paul Jolly's](https://twitter.com/_myitcv) 
[gogenerate](https://github.com/myitcv/x/tree/master/cmd/gogenerate) works,
just because he (co-)created so many good code-gen based tools, such as 
[sqlc](https://sqlc.dev/) and [CUE](https://cuelang.org/)

I will try to see how he handles dependencies, and try to brute force my way into 
doing the same thing, but for my needs.

# Conclusion

I wanted to document how I'm going about actually learning about code compilation.
