---
date: 2023-07-31T23:00:00+03:00
title: "`gonew` - the official Golang scaffolder is in alpha"
cover:
  image: covers/awkward_gopher.jpg

tags:
  - Go
  - News
  - Makefile
---

[Russ Cox](https://github.com/rsc),
from the maintainers of Go, [released](https://github.com/golang/go/discussions/61669)
a new prototype for the a new standard Go tool:

`gonew`

---

From the [blog post](https://go.dev/blog/gonew), you can see it doesn't do much,
which feels very at home for Go:

```shell
$ go install golang.org/x/tools/cmd/gonew@latest
```

And then you can point to any go project on the web, and basically rename it:

```shell
$ gonew golang.org/spf13/cobra example.com/my-cli
$ cd ./my-cli
```

---

Obviously, cobra is not a good candidate to use as a template. But copying cobra
shows you that you get way more than just the code. You get the whole dev experience!

Just as an example - I think I'll use `gonew` to have a basic Makefile with useful tools
I always manually copy paste.

On that note, here's an example makefile that will be part of something new:

```makefile
SHELL:=/bin/bash

BASE_NAME=joe

BINARY=${BINARY:-BASE_NAME}

default: help

# The help target prints out all targets with their descriptions organized
# beneath their categories. The categories are represented by '##@' and the
# target descriptions by '##'. The awk commands is responsible for reading the
# entire set of makefiles included in this invocation, looking for lines of the
# file as xyz: ## something, and then pretty-format the target and help. Then,
# if there's a line with ##@ something, that gets pretty-printed as a category.
# More info on the usage of ANSI control characters for terminal formatting:
# https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_parameters
# More info on the awk command:
# http://linuxcommand.org/lc3_adv_awk.php

.PHONY: help
help: ## shows this message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<command>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ General

.PHONY: run
run: generate build ## full build and run binary
	./bin/${BINARY}

.PHONY: build
build: generate fmt test ## full build including generate, test, go get
	go mod tidy
	mkdir -p bin
	go build -o bin/${BINARY} ./cmd

.PHONY: generate
generate: ## run go generate
	go generate ./...

.PHONY: clean
clean: ## cleans some of the things
	$(shell rm ./bin/*)

##@ Health

.PHONY: checks
checks: lint vuln ## runs all the tests (prefer go test for small stuff)
	go test ./...

.PHONY: lint
lint: ## staticcheck
	staticcheck ./...

.PHONY: vuln
vuln: ## govulncheck
	govulncheck -test ./...

.PHONY: fmt
fmt: ## goimports
	goimports - ./...

##@ Setup

.PHONY: setup
setup: setup-tools ## setup dev env
	mkdir -p bin
	go mod download

.PHONY: setup-tools
setup-tools: ## install dev deps
	go install golang.org/x/tools/cmd/goimports@latest
	go install honnef.co/go/tools/cmd/staticcheck@latest
	go install golang.org/x/vuln/cmd/govulncheck@latest
	go install github.com/pquerna/ffjson@latest
	go install golang.org/x/tools/cmd/stringer@latest
	go install github.com/campoy/jsonenums@latest
```
