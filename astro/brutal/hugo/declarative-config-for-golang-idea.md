---
title: "A Declarative Config for Golang"
date: "2023-07-25T20:00:00+03:00"

tags:
  - Go
  - Config
  - Code Generation
  - Containers
  - Kubernetes
  - Twelve Factor App
---

## A Declarative Configuration lib for Go

I'm thinking about building a Go package (and CLI) to let me just declare a _schema of a config_,
and use code generation on top of that to declare how I want to Marshal and Unmarshal it
into anything that makes sense.

I want to try to make a case in favor of writing it before I actually roll up my
sleeves and write it. Let me know on [my socials](/) if I convinced you or not 🙏

### What does it need to do?

At the core of it, I want to make it faster for me to configure the apps I write.
Specifically, I want to make it easier for me to extract "consts" into configuration.
"**Configuration**" is not an easy problem, and the [12 Factor App](https://12factor.net)
has a [chapter](https://12factor.net/config) on it. You should really check it out.

I'll give you the tl;dr of what is written there: "just do it in env vars".
I agree. Making everything configurable by an env var IS THE WAY TO GO. It
ensures your configuration is fine grained, easy to (de)serialize, language-agnostic
and compatible with literally everything. But there's a "But"...

Giving fine-grained handles on everything makes organizing things messy.
So what people usually do is allow loading configuration from files, and letting
the user override values specified in the config file using env vars (or flags).
This combination allows our users to bundle common parameters in a file,
but override specific values using env vars. You can see example implementations
of this everywhere. Some notable examples of system that assume this are:

- [spf13/viper](https://github.com/spf13/viper) + [cobra](https://github.com/spf13/cobra)
- Kubernetes: Pods, ConfigMaps and Secrets (I'll explain more later)
- [Backstage](https://backstage.io)'s `app-config.yaml` style, which allows directly injecting files and ENV

---

So how should our `lib` should feel like?

Here's some tangible example:

```go 
//go:generate lib-cli [...]
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
  envUnmarshaler := Config{}.F3().Env().DefaultUnmarshaler

  var c Config
  if err := envUnmarshaler(&c); err != nil {
    return Config{}, fmt.Errorf("loading config from env: %w", err)
  }

  return c, nil
}
```

As you can see, the idea is to have the **user defined** `Config` struct 
"drive" the rest of the functionality around it, using some code generation.

#### Documentation for Free

As a young junior dev, my boss told me one of the best advices I got:

> "If it's not in a doc, it doesn't exist" - Eddy K

The first and maybe the most important feature is documentation of what are
the parameters you can pass to this program. So I want this lib to print out 
the schema of the parameters you can pass. It's useful for `--help`,
for embedding that in your `README.md`, in the "Getting Started"
part of your docs... Literally everywhere. Evidently, it's what we 
as developers all care about the most.

To me, this is a worthwhile feature onto itself - having all
the parameters you can pass to the program centralized in a single file
that you can just look at is very useful. It's simple and accessible.

But if I'm already taking the time to parse the struct into text,
I might as well also generate some code, right?

#### (Un)MarshalXXX like API

So, now that our users know which parameters we support, we need to actually support them.
For that, I want a system of `Unmarshaler`s that know how to take a certain format and
Unmarshal it into that `Config` type. In the above example, I only showed the `env`
Unmarshaler, but the plan is to at least add support for `pflag` and `yaml-file`
Unmarshalers.

With these three, I can now implement what we really want: We can compose them
such that each value in `Config` will be filled according to the priority of 
"pflag" > "env" > "config-file" > "default". If you're not familiar with this, this
exactly how `viper`+`cobra` work.

## But why yet another package? 

The grand idea is to be able to replace solutions like 
[viper](https://github.com/spf13/viper), with something more declarative.

I don't mean to sound ungrateful, as viper and cobra are very good tools and I
enjoy using them. But something always felt off. A bit too much in my way.

Not all software problem should be solved declaratively. Nor should we go for 
abstractions and generalizations as the first tool. At least, not in Go.

For me, Go is a nice language, but **the philosophy** of it is why I actually like 
working with it. In Go, we're not afraid to repeat ourselves. I'm a happy 
`if err != nil` user 😘.

But manually maintaining code to just load some strings into my app is what 
Googlers would call "toil". It's manual work that can be automated.
And manual work is bugs, and generally boring to do.
Unfortunately, even with viper+cobra and the cobra cli, I still find myself
manually writing commands or edit the code manually to keep it up to date.

And don't get me wrong, I love the philosophy behind Go. There's great
power in writing simple, predictable code to drive your business logic.
It really pains me to see cool code that uses all the latest features
being the center of the app. For complex problems, I prefer simple code.

But for simple problems, I want to automate the shit out of them.

For this kind of things, Go tries to nudge us towards a declarative way of working:

### go:generate

`go:generate` is part of the language. And for Go, adding a whole
feature to the language is not something they do easily.
It was created as a response to C++ macros, at least that's how I understood it.
Instead of having a separate language for macros **built in** inside the language, Go suggests
you just write them as normal code that accepts your code as argument.

And it makes sense! Reading ASTs and producing useful text out if it is just another 
type of program. And if you don't want to write the tool in Go, just don't. Go generate
will just run your binary, it doesn't assume anything else.

### encoding/json

The json package is the best example of how to create a declarative API.
It's the best example not because of how good it is (it IS good, it's just not my point).
It's the best example because *everyone is using it*, which means it makes sense in a way.
If you don't know how it works, you define a type (like our `Config` above), 
and the json package infers what kind of json you expect to receive.

```go
var c Config
if err := json.Unmarshal(&c); err != nil {return err}
```

In other words, it uses the value `c` in two ways: 

1. It inspects the type of `c` with reflection, in order to understand the 
   schema of the json you're serializing, and 
2. Uses `c` as the carrier of the value that was represented by the input json

So what we have here is reflection at runtime, and it works and it's great, 
since it's very self contained and the API is well defined. But the first step
doesn't really need to happen at runtime, does it?

Combining `go generate` and the pattern used in `json`, we can take "step 1"
(meaning, inspecting the type of `c`) and do it at compile time instead of runtime.

I'm not inventing anything new: you can see how these two concepts are combined
in practice today in `ffjson`:
[github.com/pquerna/ffjson](https://github.com/pquerna/ffjson).

---

So, why write a package for that? Because I feel like The current solutions 
require too much cognitive load on me when I write apps and scripts. I want 
to minimize the time I spend on defining **how** to pass values to my app,
and more time on which values I need.

End of the day, I do believe that I would make more configurable programs 
if I spent less time documenting and parsing the configuration. And by that I mean
I'm just usually lazy and defer extracting things to a configuration just because it's
a distraction. I want to flip the equation and make it as fast to add a new field to
may configuration as it is to add a const.

And over time, I find that configuration is not as static or simple as 
they were a few years ago, which means **even more** overhead for each value I should
extract to configuration. The overhead usually comes when we need to deal with
real life - K8s standards, InfoSec, Observability requirements... life 🤷‍♂️

### "Cloud Native" Constraints

Let's take k8s as an example.

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

Here's a big mess of using all the different techniques: (well, not CSI driver but still a mess)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  containers:
    - name: server
      image: my-server:0.1.0
      env:
        - name: GITHUB_USERNAME
          value: drornir
        - name: GITHUB_PASSWORD
          valueFrom:
            secretKeyRef: 
              name: env-secret
              key: GITHUB_PASSWORD
        - name: PATH_TO_CONFIG_JSON
          value: /workdir/configs/config.json
      volumeMounts:
        - name: my-secret-volume
          mountPath: /workdir/secrets
          readOnly: true
        - name: my-config-volume
          mountPath: /workdir/configs
          readOnly: true
  volumes:
    - name: my-secret-volume
      secret:
        secretName: files-secret
    - name: my-config-volume
      configMap:
        name: my-confmap
---
apiVersion: v1
kind: Secret
metadata:
  name: env-secret
data:
  GITHUB_PASSWORD: <text in base64> # pass123456
  database.json: <json in base64>   # {"user": "root", "password": "123", "host": "..."}
---
apiVersion: v1
kind: Secret
metadata:
  name: files-secret
data:
  database.json: <json in base64>
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-confmap
data:
  config.json: |
    {"my": "json"}
```

It will create the following:

```shell
$ cd /workdir

$ env | grep GITHUB
GITHUB_USERNAME=drornir
GITHUB_PASSWORD=pass123456

$ cat secrets/database.json
{"user": "root", "password": "123", "host": "..."}

$ cat $PATH_TO_CONFIG_JSON
{"my": "json"}
```

## Enough Rumination

Unsurprisingly, I convinced myself. But I'm looking for feedback. Is this actually a real problem?
Is configuration really as tedious as I make it to be? Will sprinkling some DX on will improve the usability
of my code? Is it even that important to add all of this "sugar" on top of just loading some strings?
As I said, I think it does, but what do you think?

Also, am I missing some awesome existing library that already does all of this?

Appreciate any feedback on [this tweet](https://twitter.com/drornir/status/1683924287693152258) 
(or 𝕏 or whatever) or [DM me somewhere](/) 🙏 😘

