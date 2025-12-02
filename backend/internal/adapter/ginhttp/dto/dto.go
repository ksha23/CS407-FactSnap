package dto

import (
	"bytes"
	"strings"
)

type Request interface {
	Validate() error
}

type ValidationErrs map[string]error

func (m ValidationErrs) Error() string {
	buff := bytes.NewBufferString("")

	for field, reason := range m {
		buff.WriteString(field)
		buff.WriteString(": ")
		buff.WriteString(reason.Error())
		buff.WriteString("\n")
	}

	return strings.TrimSpace(buff.String())
}
