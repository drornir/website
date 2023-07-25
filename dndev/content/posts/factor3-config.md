---
title: "Factor 3 - Declare a Config"
date: 2023-07-23T21:00:00+03:00
draft: true
author: Dror nir
avatar: /profile.png
tags:
  - Go
  - Config
  - Code Generation
  - YAML
  - Twelve Factor App
---

## Declarative Configuration in Go

I'm trying to build a Go package (and CLI) to let me just declare a _schema of a config_,
and use code generation on top of that to declare how I want to Marshal and Unmarshal it
into anything that makes sense.

At the core of it, I want to make it faster for me to create configurable apps.
Config is not an easy problem, and the [12 Factor App](https://12factor.net)
Has a chapter on it. It's chapter 3, so I'm calling this idea `factor3`.

So what does `factor3` aim to do?

Here's some tangible example:

```go 
//go:generate factor3 [...]
type Config struct {
  Github struct {
    Username string
    Password string
  }
}

func PrintSchema(c Config) {
  schema := c.F3().Schema // F3 was created with code generation
  fmt.Printf("%s\n", schema.Env().Usage.Shell())
  /*
  GITHUB_USERNAME=<string>
  GITHUB_PASSWORD=<string>
  */
}

func LoadFromEnv() (Config, error) {
  envUnmarshaler := c.F3().Env().DefaultUnmarshaler

  var c Config
  if err := envUnmarshaler(&c); err != nil {
    return Config{}, fmt.Errorf("loading config from env: %w", err)
  }

  return c, nil
}
```

As you can see, the idea is to have the **user defined** `Config` struct 
"drive" the rest of the functionality around it, using some code generation.

### Documentation for Free

> "If it's not in the doc, it doesn't exist" - Eddy K

The first and maybe the most important feature is documentation of what are
the parameters you can pass to this program. As a wise man once told me:
"If it's not in the doc, it doesn't exist". So in order for it to exist,
I want factor3 to print out the schema of the parameters you can pass. 

And while we're at it, I can also make sure to put it in a `go doc`
compatible comment.

### (Un)MarshalXXX like API

So, now that our users know which parameters we support, we need to actually support them.
For that, I want a system of `Unmarshaler`s that know how to take a certain format and
Unmarshal it into that `Config` type. In this example, I only showed the `env`
Unmarshaler, but the plan is to at least add support for `pflag` and `yaml-file`
Unmarshalers.

With these three, I can now implement what we really want: We can compose them
such that each value in `Config` will be filled according to the priority of 
"pflag" > "env" > "config-file" > "default". If you're not familiar with this, this
exactly how `viper`+`cobra` work, and basically any other mature cli app.

## But why yet another package? 

The grand idea is to be able to replace solutions like 
[viper](https://github.com/spf13/viper), with something more declarative.

I don't mean to sound ungrateful, as viper and cobra are very good tools and I
enjoy using them. But something always felt off. A bit too much in my way.

Not all software problem should be solved declaratively. Nor should we go for 
abstractions and generalizations where they are not certain. At least, not in Go.
For me, Go is a nice language, but the philosophy of it is why I actually like 
working in this ecosystem. In Go, we're not afraid to repeat ourselves.

But manually maintaining code to just load some strings into my app is what 
Googlers would call "toil". It's manual work that is error prone. And we're doing
it again and again whenever we write a new Go app.
Unfortunately, even with viper+cobra and the cobra cli, we still need this manual 
maintenance to keep it up to date.

And don't get me wrong, I love the philosophy behind Go. There's great
power in writing simple, predictable code to drive your business logic.
It really pains me to see cool code that uses all the latest features
being the center of the app. For complex problems, I prefer simple code.

But that's not the case with "auxiliary" stuff. With the "easy" stuff.
For this kind of things, Go tries to nudge us toward declarative ways of working:

### go:generate

`go:generate` is part of the language. It was created as a response to C++ macros:
instead of having a separate language for macros built in inside the language, Go suggests
you just write them as normal code.

And it makes sense! Reading ASTs and producing useful text out if it is just another 
type of program. And if you don't want to write the tool in Go, just don't. Go generate
will just run your binary, it doesn't assume anything else.

### encoding/json

The json package is the best example of how to create a declarative API.
If you don't know how it works, you define a type (like our `Config` above), 
and the json package infers what kind of json you expect to receive.

```go
var c Config
if err := json.Unmarshal(&c); err != nil {return err}
```

In other words, it uses the value `c` in two ways: 

1. It inspects the type of `c` with reflection
2. Uses `c` as the value to be filled

So what we have here is reflection at runtime, and it works and it's great, 
since it's very self contained and the API is well defined. But the first step
doesn't really need to happen at runtime, does it?

Combining `go generate` and the pattern used in `json`, we can take "step 1"
(meaning, inspecting the type of `c`) and do it at compile time instead of runtime.

And you can see how these two concepts are combined in practice today in `ffjson`: 
[github.com/pquerna/ffjson](https://github.com/pquerna/ffjson)

---

So, why write a package for that? Because I feel like The current solutions 
require to much cognitive load on me when I write apps and scripts. I want 
to minimize the time I spend on defining **how** to pass values to my app,
and more time on which values I need.

End of the day, I do believe that I would make more configurable programs 
if I spent less time documenting and parsing the configuration.

And over time, I find that configuration is not as static or simple as 
they were a few years ago.

## "Cloud Native" Constraints

In Kubernetes, there are multiple ways to pass configuration to a Pod. All have good
reasons to exist, which makes our lives a bit more difficult when we write a Go server
that will run on K8s:

- `env`: we can pass data as a plain env variable. We can treat it as immutable, 
  as a change of the value usually triggers a redeployment of the container.
  `env` supports getting the values from secrets or configmaps, but for secrets
  it is considered unsafe to do, from an InfoSec point of view. K8s Secrets are usually easy to hack.
- Volume Mounting: So, for secret values, we prefer to mount their contents as files.
  In order to get that file into the Pod, there are existing solutions like 
  [Secrets Store CSI Driver](https://github.com/kubernetes-sigs/secrets-store-csi-driver).
  What you usually do in this type of setup is that you mount the secret to some (possibly random) path, 
  and pass that path as an env value. Or, you know, hard code the path.
- Hybrid: There's a pattern of (ab?)using ConfigMaps, which are simple maps of strings to strings,
  and using them as like a mini file system. What I mean by that is that the keys are names of files 
  (e.g `config.yaml`), and the values are contents of files.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cm
data:
  config.json: |
    {"my": "json"}
  config.yaml: |
    my: yaml
```
