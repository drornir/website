package example

import (
	"fmt"
	"io/fs"
	"log"
	"os/exec"
	"testing"

	"github.com/spf13/afero"
)

func isOnPath1(name string) string {
	fullPath, err := exec.LookPath(name)
	if err != nil {
		log.Fatal(err)
	}

	return fullPath
}

type realImpl struct{}

func (ri realImpl) LookPath(name string) (fullpath string, err error) {
	return exec.LookPath(name)
}

type lookPather interface {
	LookPath(name string) (fullpath string, err error)
}

func isOnPath(lp lookPather, name string) string {
	fullPath, err := lp.LookPath(name)
	if err != nil {
		log.Fatal(err)
	}

	return fullPath

}

func realUsage(name string) string {
	lp := realImpl{}

	return isOnPath(lp, name)
}

// package example_test

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
