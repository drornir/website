---
title: "How do you do intefaces in Go?"
date: "2024-02-14T20:00:00+02:00"
cover:
  image: covers/audio-plugins.jpg

tags:
  - Go
  - Interface
---

## I'm not going to waste your time

The bottom line is this - **you define the interface next to the consumer of the interface, and not next to the implementation.**

If you understand that or already know that, I have nothing else to add.

Well, maybe except "make them small".

In the rest of this post I'll try to explain what I mean, and why I think it's the correct way to use interfaces

## Let's get to it 



