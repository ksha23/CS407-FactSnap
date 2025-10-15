package obj

// IsZero returns true if the given val is a zero value. False otherwise.
// If the given value has `IsZero() bool` method (e.g., time.Time), then
// that will be used instead.
func IsZero[T comparable](val T) bool {
	if z, ok := any(val).(interface{ IsZero() bool }); ok {
		return z.IsZero()
	}

	var zero T
	return val == zero
}
