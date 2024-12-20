---
title: Why Code Generation?
date: 2023-07-31T20:55:00+03:00
cover:
  image: /covers/inaki-del-olmo-Trn2-DwoEr0-unsplash.jpg
tags:
  - Code Generation
  - Metaprogramming
  - Go
  - Abstract
---

Photo by [Iñaki del Olmo](https://unsplash.com/@inakihxz?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)
on [Unsplash](https://unsplash.com/photos/Trn2-DwoEr0?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)

## Code Generation is a form of Metaprogramming

From the early days of the C programming language, to today's cutting edge
languages, some sort of meta programming technique is used.

By "meta programming", I mean any form of programming that adds functionality
to the code you write, without actually writing that extra functionality.
According to [Wikipedia](https://en.wikipedia.org/wiki/Metaprogramming):

> _Metaprogramming [...] means a program can be designed to read, generate, analyze
> or transform other programs, and even modify itself while running._

I always had a love-hate relationship with metaprogramming. On the one hand,
it's really powerful. It can save a lot of time from writing boilerplate code,
and also make it safer and more reliable to do so.

On the other hand, using meta programming everywhere makes your code very hard
to read, since there's basically not much to read. Your code doesn't really look
like how normal code in that language should look like.
Metaprogramming inherently adds a layer of abstraction that you need to learn.

With great power comes great responsibility. So how can we do meta programming
safer and better? Let's examine some problems that might happen with metaprogramming:

## The Two Major Risks with Metaprogramming

### At Runtime

The first example that always comes to my mind is Ruby on Rails, or generally
the MVC frameworks. But I worked with ruby so let's talk about it.

A big part of RoR was that you define a "model", which is a ruby class that inherits
from the framework. RoR's classes (that you inherit from) inspect your **_custom_**
**fields** and **methods** in order to infer an SQL table schema, JSON schema,
and even fully usable (although basic) html pages with forms and stuff.

Most of the logic was computed at runtime by RoR. This means that reading the source
code wasn't very useful. The RoR base classes source code looked to me more like
a language compiler than an HTTP server. When looking at the stack trace, you rarely
got useful information. RoR classes don't actually implement methods. For example,
functions like `.find_post_by_id(id)` are generated at runtime from the fact that
your `Post` class has a field called `id`. So, going back to the stack trace - I won't
see in the trace a function that is called `.find_post_by_id(id)`. I would see something like
`.invoke(func_name)`. Not helpful.

Since then, I avoid reflection at runtime, if possible.

### Too much DSL

Domain Specific Language (DSL) means, plainly, that you write a new programming language
that is very good for a small set of problems. You could say that every programming
language is a form of DSL, and you would be technically right. Every language that is so
called "general purpose" was created to with the goal of writing programs in a specific way.

However, when we say DSL, we usually mean that you write some custom made, very very
narrowly scoped API that would only apply for the people you work with.

This might sound amazing, but usually it doesn't turn up as well as you would hope.
Basic things like syntax highlighting in you IDE or "Go To Definition" don't work anymore.
You could write it yourself, but usually you'll be too busy maintaining the DSL itself,
as your users would need more and more features. Features that, obviously, already exist
in your original programming language.

And did you write good docs? :P

So, there's no avoiding writing _some sort_ of a DSL when you code. Your function names,
idioms and general approach to stuff are technically a DSL you're adding. So the idea
is not to strictly avoid doing some sort of DSL. The goal is just to minimize the surface
area of the DSL, and rely on existing, widespread idioms.

## So why risk doing metaprogramming?

It's fast and reliable. Done right, it can make development 10x more reliable
and 10x faster to read and write.

It automates boring stuff, and the boring stuff is where humans do most of the
bugs that end up in production.

If you know Rails and you have the discipline not to abuse it, it's a very good,
reliable, tested system with a huge community. And developing in Rails is faaaasstt!

## Code Generation Happens Early

I'm not saying all generated code is good. But I think code generation as a form
of programming is the easiest to get right.

The idea is that code generation is restricted to run before you compile your program.
You can do the craziest, wildest things when you try to generate the code, but at the end of
the process, the output is not abstract. The code generated can (optimally) be read like
any other piece of code you wrote manually.

Constraining yourself to do meta programming in code generation also means your fancy
reflection code is never run in production. This means the code that generates code
doesn't have to be particularly robust. Testing the outputs of the code generation
is probably sufficient.

Yeah, you could generate code at runtime and hot-reload it or something. But
I'm suggesting not to do that. The idea with doing code generation is to take on the
restriction of only doing metaprogramming if you can do it _before_ **build time**.

## How does it look like?

Let's look at serializing structs to JSON in Go.

The standard library offers a reflection based solution. It's pretty robust and easy
to use, but like any reflection based functionality, reading the source code of
`json.Unmarshal`, for example, is hard.

Let's say you just want to understand how you would unmarshal into a string.

Here's a taste of what you're going to need to look at: ([ref](https://cs.opensource.google/go/go/+/refs/tags/go1.20.6:src/encoding/json/decode.go;l=171))

```go
func (d *decodeState) unmarshal(v any) error {
	rv := reflect.ValueOf(v)
	if rv.Kind() != reflect.Pointer || rv.IsNil() {
		return &InvalidUnmarshalError{reflect.TypeOf(v)}
	}

	d.scan.reset()
	d.scanWhile(scanSkipSpace)
	// We decode rv not rv.Elem because the Unmarshaler interface
	// test must be applied at the top level of the value.
	err := d.value(rv)
	if err != nil {
		return d.addErrorContext(err)
	}
	return d.savedError
}

///...

// value consumes a JSON value from d.data[d.off-1:], decoding into v, and
// reads the following byte ahead. If v is invalid, the value is discarded.
// The first byte of the value has been read already.
func (d *decodeState) value(v reflect.Value) error {
	switch d.opcode {
	default:
		panic(phasePanicMsg)

	case scanBeginArray:
		if v.IsValid() {
			if err := d.array(v); err != nil {
				return err
			}
		} else {
			d.skip()
		}
		d.scanNext()

	case scanBeginObject:
		if v.IsValid() {
			if err := d.object(v); err != nil {
				return err
			}
		} else {
			d.skip()
		}
		d.scanNext()

	case scanBeginLiteral:
		// All bytes inside literal return scanContinue op code.
		start := d.readIndex()
		d.rescanLiteral()

		if v.IsValid() {
			if err := d.literalStore(d.data[start:d.readIndex()], v, false); err != nil {
				return err
			}
		}
	}
	return nil
}
```

This pretty much how a normal language parse is written. You have a scanner and you
look for tokens.

That's a lot, and we haven't even started looking at `string` specific code.

Instead, with code generation, we can precompute and give the user a nice, debuggable
piece of code.

I'll use a small example that only implements the JSON interface for "enums", but
there's a full implementation called [ffjson](https://github.com/pquerna/ffjson)
if you want to see a one.

So for this example I'll use [campoy](https://github.com/campoy)'s
[jsonenums](https://github.com/campoy/jsonenums) tool, alongside
[stringer](https://pkg.go.dev/golang.org/x/tools/cmd/stringer).

If you know `stringer`, `jsonenums` is the same but it implements `json.Marshaler` and `json.Unmarshaler`
statically.

For example, running `go generate` on the following file will produce the one in the bottom:

```go
//go:generate stringer -type=ValueType -linecomment
//go:generate jsonenums -type=ValueType
type ValueType uint

const (
	ValueTypeString ValueType = iota + 1 // <string>
	ValueTypeNumber                      // <number>
)
```

In the above snippet, we instruct `stringer` to override the string representation
to be `<string>` instead of `ValueTypeString`.

`jsonenums` uses the `Stringer` interface if you've implemented it. Meaning that
the json representation of `ValueTypeString` is `"<string>"`.

But I think the code is clear enough that you could have understood it by yourself:

```go
// Code generated by jsonenums -type=ValueType; DO NOT EDIT.

package config

import (
	"encoding/json"
	"fmt"
)

var (
	_ValueTypeNameToValue = map[string]ValueType{
		"ValueTypeString": ValueTypeString,
		"ValueTypeNumber": ValueTypeNumber,
	}

	_ValueTypeValueToName = map[ValueType]string{
		ValueTypeString: "ValueTypeString",
		ValueTypeNumber: "ValueTypeNumber",
	}
)

func init() {
	var v ValueType
	if _, ok := interface{}(v).(fmt.Stringer); ok {
		_ValueTypeNameToValue = map[string]ValueType{
			interface{}(ValueTypeString).(fmt.Stringer).String(): ValueTypeString,
			interface{}(ValueTypeNumber).(fmt.Stringer).String(): ValueTypeNumber,
		}
	}
}

// MarshalJSON is generated so ValueType satisfies json.Marshaler.
func (r ValueType) MarshalJSON() ([]byte, error) {
	if s, ok := interface{}(r).(fmt.Stringer); ok {
		return json.Marshal(s.String())
	}
	s, ok := _ValueTypeValueToName[r]
	if !ok {
		return nil, fmt.Errorf("invalid ValueType: %d", r)
	}
	return json.Marshal(s)
}

// UnmarshalJSON is generated so ValueType satisfies json.Unmarshaler.
func (r *ValueType) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return fmt.Errorf("ValueType should be a string, got %s", data)
	}
	v, ok := _ValueTypeNameToValue[s]
	if !ok {
		return fmt.Errorf("invalid ValueType %q", s)
	}
	*r = v
	return nil
}
```

I think just the fact that I feel ok pasting to full generated code here means
it's not too much. I also feel like it's good enough in terms of readability.

It feels right, you know?

## Conclusion

By writing these article I've convinced myself enough that investing time and
energy in practicing code generation is worth it. I see a lot of robust, complex
systems (e.g kubernetes in go, and rust in general) built using compile time
code generation. Both experts and novices use code generation successfully.

I feel like my time with Go for the last several years taught me that meta programming
is usually not what you want. I never used generics in production yet. It just never came up :)

But I can't ignore the benefits any longer 😎
