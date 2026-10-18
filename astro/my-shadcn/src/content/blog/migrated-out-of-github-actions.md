---
title: I migrated out of GitHub Actions
description: Why we left GitHub Actions for Buildkite, and how I built a Python interface for our CI/CD pipelines.
date: 2026-10-17
cover:
  image: /covers/cat-to-kite-chatgpt.webp
  alt: A black cat transforming into folded paper shapes and a green kite
tags:
  - GitHub
  - CI/CD
  - Buildkite
  - Code Generation
  - Dev Tools
---

_Cover illustration created by ChatGPT._

> The post is split into "Why" and "How". Each section stands on its own, so feel free to skip.

I recently migrated our CI/CD in SignalPET from Github Actions to Buildkite. I never liked their style of creating and managing pipelines but for reasons out of my control I always ended up forced to work with it. Luckily for me Github managed to make the platform so unstable I could justify taking two weeks to migrate us off, and do it the way I always wanted to.

Now, when I know my developers are very happy about it I feel I can confidently share my reasoning on why to do it, and share my now proven opinion on how to write CI/CD pipelines in practice.

# Why

## GitHub Actions sucks

### Unstable

In August there were two major outages that I can remember. Besides that, over the whole month there were slowdowns and networking issues that were fixed with a rerun.

If I remember correctly, I was checking the real GitHub status page and it showed 88% uptime.

Obviously this is unacceptable on its own in terms of SLAs expected of any company of any size, even small startups launching a product in beta.

Besides the inability to use the system, our Actions usage went up 3x. While unverified, I couldn't find an explanation for this other than GitHub billing us for their workers being stuck.

### Slow

Their workers are slow.

Their Docker builds are slow.

Loading and uploading cache is slow.

Cloning is slow! The one thing you would think GitHub would be able to optimize in Actions would be cloning from GitHub! But from my experience, cloning on GitHub workers is slower than cloning locally (from Israel!), on EC2, or on Buildkite.

But really, everything is slow. Even before cloning, you need to wait for a worker to be available, which sometimes takes a nontrivial amount of time.

The Actions model is based on installing all the dependencies at runtime, with their actions. The convention is `setup-<tool>` actions. It's the standard golden path to do every tool installation, and its caching did little to help us between runs. If I want the tools I use on every job to be there from the start, the only way to do that is running my own GitHub Actions workers cluster with my own custom prebuilt Docker image.

In theory, installing some tools every time is not _that_ bad. The real issue I had is that GitHub's workers' networking is so unstable that, a lot of the time, installing tools broke or slowed the pipeline enough to have a significant impact.

### Actions DSL

You're basically expected to write YAML with their `${{}}` thing. It's not a static template or a real language; it's some hybrid. And it's a really poor tool when you need to do conditionals. For some reason they never implemented a ternary conditional.

Composed actions run post scripts. Post scripts are usually implemented with redundant work that nobody needs. My primary example is actions like AWS login that run logout on its post script.

Here's something very useful you CAN'T do: a composite action that clones the repo and logs you into AWS and ECR. Standard stuff for the most common use case of GitHub Actions: building and pushing a container.

Welp, nope, can't have that. When the composite action finishes, it just logs you out of AWS, so too bad for you :shrug:. So every GitHub workflow file starts with the same boilerplate, repeating low-level stuff like the ARN of the role to assume.

## GitLab was better

We actually moved off of GitLab about a year ago. I'm not going to go into the pros and cons of the whole move, but in terms of the CI UX it was a definite downgrade.

GitLab has, natively and conveniently, a feature that allows you to mark a step to wait for manual invocation. Not the whole workflow, just a single job within the DAG. We used that to deploy code from a PR into a test environment.

They also allowed you to rerun a step multiple times. If another developer deployed their code to the same test environment, you could rerun your deploy after they finished and reset the environment to your version.

It feels insane that I need to explain this as a feature, but GitHub doesn't have it in the way we needed. GitHub lets you rerun a specific job after the workflow finishes. But you can't rerun it while the workflow is still running, and with our manual approval gate, the workflow was never _not_ running.

So to retry a failed or stuck deploy, you first had to cancel **the whole** workflow and rerun it from scratch. And if you just wanted to rerun a successful deploy without rebuilding the whole Docker image, that wasn't an option for us either.

Even cancelling wasn't reliable: we hit a bug with workflows that ran multiple levels of nested workflows. I'd click "Cancel workflow," GitHub would accept the request, and the workflow would just keep running.

## So Now What?

I can really go off on how GitHub Actions is a worse product and infrastructure than anything else, including building your own. The **only** thing it has is that it's integrated into GitHub. This product does not stand on its own. And since even the worst CI/CD product is capable of doing a reasonable job building and publishing an npm package, the fact that it's already there is enough for people to use it.

This started a snowball effect: everyone on GitHub starts with a GitHub Action and then just rolls with it.

However, I'm of the opinion that before adding your third workflow, or if you need to optimize _anything_ in your pipeline, you should immediately migrate out of GitHub Actions.

We migrated to Buildkite because I needed specific features like manually invoked steps, and I liked their approach to generating the workflow on the fly.

Whatever you choose, just choose and migrate. My way of migrating might be overly complex for your use case, but if you don't want to deal with it, just tell Claude to migrate you to something else and you'll be fine and happier (or at least not as sad).

I took the opportunity to do it "properly": choose the best platform and make the best abstraction on top of it.

I (Claude) searched and researched the options, aggregated them in a wiki, and then compared them to my requirements:

1. No YAML: I knew I wanted to stop maintaining YAMLs, as if that ever made any sense at any point in time. This meant writing code to interact with the platform and define pipelines.
2. The manual invocation and reruns from GitLab were something I had to have again. I like to meet people where they are, and my people were missing that feature so much. And I couldn't have it in some roundabout way. I wanted the platform to have a proper native representation of it in the UI. We used GitHub's manual approvals for deployments to environments, and it was really, really bad.
3. The core work my pipelines do didn't need to change. How deploys work, how builds work: all of this was working reasonably, and I didn't want to change that. This mattered even more because whatever new CI/CD system I chose might be bad and I'd need to migrate again. While I appreciate opinionated systems forcing you into the correct way of doing things, I didn't want the platform to block me from doing things in our existing not-so-great-but-works way.
4. It should be a CI/CD platform and not a generic pipeline platform. While every pipeline platform can be a CI/CD platform, I wanted a tool that optimizes for fast Docker builds, artifact caching, unit testing, and GitHub and Slack integrations. In the pay vs. build choice, I wanted to pay for features. In other words, I didn't want to use Argo Workflows.
5. Uptime, SOC2 and compliance stuff.
6. Something that is actively maintained.

## Buildkite

I won't go into the whole research process; it's a bit tedious. The bottom line was that manual invocation and reruns are not as widespread as I thought, and Buildkite was the only viable option that actually supported them.

Unfortunately, every system I didn't immediately rule out for some other reason relied on YAML to define pipelines. I accepted my fate and activated Plan B: write Python to generate the YAMLs. Given that, Buildkite shined with its ability to incrementally add steps to the pipeline while it runs. I didn't need more than one increment, but it opened the door to treating YAML as a "compile target" instead of the main interface I use to define pipelines.

They even distribute an auto-generated SDK from an OpenAPI spec that gives me a typed structure for code generation. It felt like generating the pipeline was the golden path, not something you need to patch on top of normal usage (I'm looking at you, GitHub).

And I'll share something from the end of the migration: it turns out Buildkite is pretty fast! The pipelines that hurt the most finished 2x to 5x faster. I didn't change runner size or caching. I had a whole plan of sending Docker builds to depot.dev after I finished the initial migration, but it just feels unnecessary now.

> Another nice thing with Buildkite is that there's an easy way to self-host the workers on AWS. If it matters to you, I assume you already understand why it's a good option to have.

# How

## Escaping YAML

I can't stress enough how tired I am of writing code and building systems inside YAMLs. Don't get me wrong, YAML, JSON, and TOML are great for structuring input to systems in a language-agnostic way. And I know a lot of people don't like YAML, and [I get it](https://news.ycombinator.com/item?id=36745212), but with strict parsing and abstaining from [cool features](https://yaml-multiline.info/) I think it's pretty great as a readable format that can also be easily parsed and encoded in programming languages.

My problem starts with products that basically build a programming language on top of it. I won't go into the whole argument here, but the gist is that programming languages already exist and there are so many tools built around them.

So I started a new Python project and started coding. Why Python? Honestly, I don't know. It's just there, it's fine, and everybody understands it as long as you don't use too many cool features of the language.

## Treating it like a compiler

Usually when I start a project, I deliberately spread my focus across several things so I don't focus too much on the wrong thing.

1. The public interface - what I expect my users to know, and what I plan to abstract.
2. The underlying system and constraints - in this case, what features Buildkite has that I can use or have to work around.
3. My core business logic - the stuff in the middle between the two other parts above. Usually it's choosing design patterns.

In this case, (1) is basically: "Tell me where the source code is, where the Dockerfile is, where your Helm chart, values, and optional tests are, and I'll take it from there." (2) is the Buildkite SDK (the one generated from the OpenAPI spec) and the Buildkite docs.

For (3), because I'm converting from a high-level abstraction to a low-level format, it made sense to think of it as a sort of compiler. It made sense to borrow the idea of an intermediate representation (IR) because I wanted some abstraction over Buildkite in case I need to switch CI/CD platforms. Or, in compiler terms, in case I want to implement a new compilation target without changing the input.

## Building it from the bottom up

So now I have a plan: start with a low-level IR in Python classes that represents a basic DAG of shell commands. Each vertex in the DAG is assumed to run on a separate machine. The shell commands within a vertex run in the same shell.

Each such vertex also has operational configuration like:

- Should it log in to AWS?
- To ECR?
- Which machine size should it use?
- Slack notifications on failure or success?
- Inject secrets?
- Paths to cache?
- Retry?
- Etc.

In my eyes, every CI/CD platform has those, and if not, I would implement them myself somehow.

I also added some smaller building blocks like the manual invocation and a generic simple boolean logic query builder.

Once I had about 50% of the features in the IR, I wrote a function that transforms it into actual Buildkite YAML.

The resulting path is `Config` and `Service` → `WorkflowBuilder` → an IR DAG → Buildkite YAML.

I then started building abstractions and helpers on top of that for concrete features I needed. For example, for Docker, I created a `DockerBuild` class that accepts what the Docker build command needs plus a working directory, and all it does is convert itself into a vertex in the IR. `DockerBuild` is essentially a pure function from high level inputs like `name`, `commit_sha`, `file`, `use_turbo_cache` etc. into a generic vertex whose command is a multiline Bash script.
Then you can take that vertex and put it in your DAG like any other command vertex.

Visually it looks something like this:

```python
d = DockerBuild(
    name="my-service",
    file="Dockerfile.prod",
    working_directory="my-wd",
    use_turbo_cache=True,
    args={"MY_VAR" : "1"},
    commit_sha=config.git.commit_sha,
    branch=config.git.branch,
    # ...
)
v = d.into_vertex()
print(v.command())
```

This is roughly what will be printed:

```bash
turbo-cache-server start --port 1234
(cd my-wd
  NAME=registry.example.com/my-service
  docker buildx build . --file Dockerfile.prod \
    --tag $NAME:gitsha-3ef514 \
    --tag $NAME:branch-feat-example \
    --build-arg MY_VAR=1 \
    --build-arg TURBO_PORT=1234 \
    --cache-from $NAME:cache-branch-main \
    --cache-from $NAME:cache-branch-feat-example \
    --cache-to   $NAME:cache-branch-feat-example
)
```

> I'm intentionally not accurate in how I actually implemented things. I'm skipping details and making things look simpler than the real implementation in order to highlight the core ideas.

Then I took another step because I was starting to reach the public interface layer. `DockerBuild` needed to know things like the Docker tag to push to, but I didn't want to bother my users with it. The tag can (and should) be calculated from the current Git SHA, which is available to me through Buildkite.

So I created a `Config` abstraction for all the inputs to the `pipeline_gen` script, and a static method, `DockerBuild.fromConfig(c: Config, ...)`, that extracted some data from the `Config` and instantiated a new `DockerBuild`. That, in turn, can be converted to an IR vertex, added to the IR DAG, and converted to Buildkite YAML.

Again, I needed to go up an abstraction level: I needed a `HelmDeploy` abstraction, and a similar `HelmDeploy.fromConfig(...)`.

And another abstraction: `Service` is a composition of (at least) `DockerBuild` and `HelmDeploy`, where the build comes before the deploy. It actually has several `HelmDeploy` steps, one for each test environment (or staging or prod), and the manual invocation vertices (not needed for stage and prod).

Here's what that looks like at the public interface:

```python
SERVICE = Service(
    name="my_service",
    paths=(
        "my_service/**/*",
        *NODE_ROOT_PATHS,
    ),
    images=(
        Image(
            name="my_service",
            dockerfile="my_service/Dockerfile",
            turbo_cache=True,
            args={
                "NODE_ENV": "production",
            },
        ),
    ),
    charts=(Chart(name="my-service", dir="my_service/chart", wait_instances=("my-service",)),),
)


@pr_workflow
def my_service_pr(conf: config.PrConfig) -> Workflow:
    b = WorkflowBuilder.new_for_pr(conf, SERVICE)
    b.add_step(
        js_unit_tests_db_mysql(SERVICE, package="@signalpet@my_service", pnpm_command="exec turbo run test --env-mode=loose --continue"),
        required_pr_check=True,
    )
    return b.to_workflow()
```

The `Workflow` returned here represents a subgraph of the IR. The builder wires up the steps and their dependencies, so the code defining a service doesn't need to deal with individual vertices.

## Finalizing the DX

I had the public interface I wanted: `Service`. Each actual service in our company describes its inputs with a `Service` and defines a workflow that uses it, and we're set!

For registration, I used the standard decorator pattern that every Python framework uses, with the most basic decorator ever: `@pr_workflow` adds the workflow function to a global list. On program start, I loop over the registered workflows and connect their subgraphs to the main DAG.

After the loop, I print the Buildkite YAML and exit:

```python
print(to_buildkite_pipeline(dag).to_yaml())
```

At this point I had an MVP that only built and deployed, and I'd implemented only one simple service.

Incrementally, I added convenience methods for:

- Unit tests, such as installing Node, pnpm, and running pnpm install and Turbo with an S3-based Turbo cache (and similar setups for other languages).
- Slack notifications
- Docker Compose for databases used in end-to-end tests
- Specifying nodes as required to pass before merging a PR (aka `mark_as_required`)

We also had some cool GitHub Actions that could post and respond to GitHub comments on the PR, which I (Claude) ported to Python and used as normal shell commands.

That covered all the GitHub workflows that deployed services. They worked way faster and didn't pollute the GitHub checks with every little job I created.

## Kept some on Github

I still kept some things in GitHub. First, I still have a few dollars a month in GitHub Actions credits, so I might as well use them. Second, they're not high value, and I felt it was more beneficial to move on to the next project. We're a startup, so I follow the 80/20 rule and move on.

# Profit

As I mentioned before, I had a whole plan of moving the docker builds to depot for having optimized docker build times. I didn't need to. I got so many cache hits and things I didn't expect to be affected started running so fast I just left it as it is. Because github was so slow I had all the possible caching layers you could think - turborepo server, npm and pip package caching, docker buildkit cache and possibly more I forget.

Really, it's been great out of the box. Highly recommend.

---

_I used AI to help edit this article._

# Comments

Discuss this post on [Bluesky](https://bsky.app/profile/did:plc:lk2y42l2lnl6ibupyezyy6l6/post/3my3u6usxjk2i) or [LinkedIn](https://lnkd.in/p/dzewe3GP).
