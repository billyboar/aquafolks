package domain

import "errors"

var (
	ErrNotFound      = errors.New("resource not found")
	ErrUnauthorized  = errors.New("unauthorized")
	ErrInvalidInput  = errors.New("invalid input")
	ErrAlreadyExists = errors.New("resource already exists")
)
