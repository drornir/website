---
title: "I rewrote a PHP script in Go"
date: "2024-01-07T13:30:00+03:00"
cover:
  image: covers/ben-griffiths-gAe1pHGc6ms-unsplash.jpg # TODO ![Alt text](../../../../static/covers/)

tags:
  - Story
  - Work
  - PHP
  - Go
---

> Photo by
> [Ben Griffiths](https://unsplash.com/@benofthenorth?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash)
> on
> [Unsplash](https://unsplash.com/photos/blue-elephant-plush-toy-on-black-laptop-computer-gAe1pHGc6ms?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash)
  
---

was like 3-4 years ago

## SEO had an old php script

It was running on a windows server that was not maintained by our infra team.
It posed a security risk if I remember correctly. 

## Management said to shut it down, so I asked to take a few days to rewrite it

## The Input was a csv from another tool

## The Output was another CSV, which is an aggregation of the input

So what seems to be a server, was just a pure function over the input (so it is 
stateless and that is very convenient)

## I blindly TDD'ed it in three days

## took the function and connected it as an endpoint to an existing service API

## So, why did I do all of that?

We had a bottleneck of creating new services in our microservices infra.
Getting a new deployment from the infra team took more than two weeks,
so rewriting it in Go means I could save the time of waiting for a new service 
infra.

## Why am I telling you this?

Because this story is just one of many experiences I had that lead me to
believe that investing in developer experience actually increases our ability
to put our efforts where they count. Instead of wasting time on rewriting
a php script, we should have been spinning up small a PHP container to run that 
script.