---
title: "Factor3 (v0) - a code gen for configuring your Go app"
date: "2024-01-08T15:00:00+02:00"
cover:
  image: covers/peter-herrmann-IukQrXhSvPY-unsplash.jpg
tags:
  - Code Generation
  - Metaprogramming
  - Go
  - Factor3
---

Photo by [Peter Herrmann](https://unsplash.com/@tama66?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash)
on [Unsplash](https://unsplash.com/photos/grayscale-photo-of-metal-pipe-IukQrXhSvPY?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash)

---

I wrote a small toy for loading configuration easily from multiple sources.

I was thinking a lot about it, even wrote a whole
[post](/posts/declarative-config-for-golang-idea).

[Here's a link to it](https://github.com/drornir/factor3)

## The Problem

I wanted a 100% opinionated library that would let me define a Go struct with the
expected values and let it generate code that loads configuration from multiple
sources, simultaneously:

1. The default configuration will be defined in a yaml file
2. The values in the config file can be overridden by environment variables,
3. and those environment variables can be overridden by passing flags in the
   commandline.

The idea was to make a declarative API that takes care of the repetitive
boilerplate around defining a configuration API to a CLI app.

It's supposed to conform to the 12 Factor App 
[Config section](https://12factor.net/config), without needing
the user to worry about it too much.

I constrained myself to using code generation for two distinct reasons:

- Code generation is metaprogramming done right
  [in my opinion](/posts/why-code-generation), and this required some metaprogramming
- I wanted to dive deeper into parsing code and code generation in general

So I started my new side project.

![Awkward Gopher](/covers/awkward_gopher.jpg)

## Introducing [drornir/factor3](https://github.com/drornir/factor3/tree/v0.1.1) v0.1

I'm starting out small and slowly building features.
This is me saying that it is bad in its current state and I wouldn't recommend
using it. It doesn't have enough features yet, and is generally poorly designed
for extensibility.

_but_...

It still works!

---

[The readme](https://github.com/drornir/factor3/blob/v0.1.1/README.md) shows a basic usage, 
but I'll try to briefly go over it here:

```go
package main

//go:generate factor3 generate

import (
	"log"
	"os"

	factor3 "github.com/drornir/factor3/pkg/runtime"
)

//factor3:generate --filename config.yaml --env-prefix MY_APP
type Config struct {
	//factor3:pflag port
	Port string
}

func main() {
	var c Config
	if err := factor3.Load(&c, os.Args[1:]); err != nil {
		log.Fatal(err)
	}
	// ... c is ready
}
```

Above is the code for a minimal app that only accepts a port as a string.

Note a few relevant lines:

- `//go:generate factor3 generate` needs to be somewhere once in each package.
- `//factor3:generate --filename config.yaml --env-prefix MY_APP` signals to
  `factor3` that you want to generate code for this type.
  the flags like `--filename` are a way to pass configuration to factor3
  that is applicable only for this specific type
- `//factor3:pflag port` - flags support is opt-in. Most apps don't really
  need a commandline flag for all the options. Annotating a struct field
  with `pflag <name> [short]` will add and bind a flag using `spf13/pflag`.

Our example expects a yaml file to be at the path `config.yaml` relative
to root of the project. In this example, we have a small yaml:

```yaml
port: "8080"
```

It also accepts an env var `MY_APP_PORT`. Notice the flag `--env-prefix MY_APP`
in the example.

From inside the app (in `main()` in the example), we can use the
runtime function (or just call `c.Factor3Load(os.Args[1:])`)
to parse the file, env and flags and bind them to this `c`.

> if you don't use flags you can pass `nil` to `Factor3Load`.

## Bottom Line,

It works, so I'm releasing it as it is and will continue to add features.
My next TODO item is to support nested structs:

```go
type Config struct {
  DB struct {
    User string
    Password string
  }
}
```
