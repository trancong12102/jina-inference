//go:build tools
// +build tools

package tools

import (
	_ "github.com/google/wire/cmd/wire"
	_ "github.com/vektra/mockery/v2"
	_ "gotest.tools/gotestsum"
)
