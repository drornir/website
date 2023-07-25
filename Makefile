
# Image URL to use all building/pushing image targets
IMG ?= website:latest
# Root dir of the hugo project
DIR ?= dndev

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set)
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

# Setting SHELL to bash allows bash commands to be executed by recipes.
# Options are set to exit when a recipe line exits non-zero or a piped command fails.
SHELL = /usr/bin/env bash -o pipefail
.SHELLFLAGS = -ec

RANDOM=$(shell date +%s | shasum --algorithm 256 - | head -c 4)

.PHONY: all
all: build

##@ General

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
help: ## Display this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<command>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

.PHONY: run
run: ## run local hugo server.
	HUGO_ENV=production hugo server --source=$(DIR)

##@ Build

.PHONY: build
build:  ## TODO.
	@echo todo build cmd

##@ Deployment

.PHONY: dev
dev: ## run local hugo server with drafts.
	hugo server --source=$(DIR) --buildDrafts

NAME ?= untitled-$(RANDOM)
.PHONY: new-post
new-post: ## create new draft post.
	hugo new "posts/$(NAME).md" --source=$(DIR)

##@ Build Dependencies

.PHONY: update-theme
update-theme: ## Git pulls from the theme dir
	git submodule update --remote --merge

.PHONY: install-theme
install-theme: ## Clones the theme
	# git submodule add --depth=1 -- https://github.com/adityatelange/hugo-PaperMod $(DIR)/themes/PaperMod
	git submodule update --init --recursive
