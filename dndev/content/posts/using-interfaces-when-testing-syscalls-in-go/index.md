---
title: "How to test Go functions that make syscalls?"
date: "2024-02-14T20:00:00+02:00"
cover:
  image: covers/golang-renee.png 

tags:
  - Go
  - Interface
  - Test
  - Mock
---

## I'm not going to waste your time

You can find a similar explanation at [this github repo from schollii](https://github.com/schollii/go-test-mock-exec-command). 

The idea is simple, yet it might be tedious. You need to define an interface, and use that interface instead of 
calling `os.Getenv`, `exec.LookPath` and any other syscall making function you're using.

Then, you implement this interface with actually calling these function. For testing, you implement the interface
with some mock you create or generate.

## Let's get to it 


Let's look at a simple program that makes sure a certain binary is available on the `PATH`

```go
func isOnPath(name string) string {
	fullPath, err := exec.LookPath(name)
	if err != nil {
		log.Fatal(err)
	}

	return fullPath
}
```

How would we test it? Using interfaces of course!

The main problem with testing this code is that `exec.LookPath` is a global function that our `isOnPath` function
depends on. In order to test it, we need to modify our global environment (global in the scope of the go program, not the
whole computer). In practice, it relies on system calls, meaning `isOnPath` depends on the whole machine that is running the tests. Trying to use `os.Setenv` as a way to solve it, might cause race conditions between different test cases.

So we want a way to have an isolated, per-test environment emulation. Let's look at mock implementation of this:

```go
import "io/fs"


type mockImpl struct {
	path []string
	fs   fs.FS
}

func (mi mockImpl) LookPath(name string) (fullpath string, err error) {
	for _, p := range mi.path {
		fullpath := fmt.Sprintf("%s/%s", p, name)
		if _, err := mi.fs.Open(fullpath); err != nil {
			continue
		} else {
			return fullpath, nil
		}
	}

	return "", fmt.Errorf("%q wasn't found in path", name)
}
```

This is not a good implementation for real use, but the principles are the same - we emulate the state by running our own
"state" (with `path` and `fs` here), and implement the original functionality accordingly.

Let's create another implementation that is a **real** implementation:

```go
type realImpl struct{}

func (ri realImpl) LookPath(name string) (fullpath string, err error) {
	return exec.LookPath(name)
}
```

Now we have to implementations, but how do we use them? Interfaces! we define an inteface **Next to where we use it**:

```go
type lookPather interface {
  LookPath(name string) (fullpath string, err error) {
}


func isOnPath(lp lookPather, name string) {
  fullPath, err := lp.LookPath(name)
  ...
}
```

We defined a new interface `lookPather`, and we're using it instead of calling `exec.LookPath` directly.

Now we can "inject" our two implementations, as they both satisfy the `lookerPather` interface:

```go 
func realUsage(name string) string {
	lp := realImpl{}

	return isOnPath(lp, name)
}
```

For testing, we can run create a unique `mockImpl` per test run:

```go
func Test_isOnPath(t *testing.T) {
	type files struct {
		dirs  []string
		files []string
	}

	type env map[string]string

	tests := []struct {
		name      string
		searchFor string
		// for filling the inmem filesystem
		files files
		// for filling the mock path
		path []string
	}{
		{
			name:      "test name",
			searchFor: "my-bin",
			files: files{
				dirs:  []string{"/some/path"},
				files: []string{"/some/path/my-bin"},
			},
			path: []string{"/some/path", "/other/path"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fs := afero.NewMemMapFs()

			for _, dir := range tt.files.dirs {
				_ = fs.MkdirAll(dir)
			}
			for _, file := range tt.files.files {
				_ = fs.Create(file)
			}

			// NOW WE CAN INITIALIZE THE MOCK
			lp := mockImpl{
				path: tt.path,
				fs:   fs,
			}

			// ...
			isOnPath(lp, tt.searchFor)
			// ...
		})
	}
}
```

The important part here is 

```go
// ...
isOnPath(lp, tt.searchFor) 
// ...

```

Let's go back to the principle of defining the interface next to the implementation.
In our example, we defined the interface in the same package as the function we are passing the interface to.
However, everything is private, so it makes sense we defined it in the same package. We also put the implementations there,
so what's the point?

Well, we didn't actually put the implementations in the package. Not both of them. `realImpl` is indeed defined
in the same package of the interface, but `mockImpl` can also be defined in the **testing package**, meaning it's outside of the 
compiled version. So it is ineeded outside!

So in our example, we had both the interface and the real implementation on the same package, but another implementation
(the mock one) was defined outside the package. Let's look at how the placement of the interface definition scales to 
public interfaces, enabling us to share code with other packages, and even projects, with the full power that interfaces
give us.

