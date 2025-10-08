package ptr

// To returns a pointer to the passed value
func To[T interface{}](t T) *T {
	return &t
}

// ToOrNil returns a pointer to the passed value, or nil, if the passed value is a zero value.
// If the passed value has `IsZero() bool` method (for example, time.Time instance),
// it is used to determine if the value is zero
func ToOrNil[T comparable](t T) *T {
	if z, ok := any(t).(interface{ IsZero() bool }); ok {
		if z.IsZero() {
			return nil
		}
		return &t
	}

	var zero T
	if t == zero {
		return nil
	}
	return &t
}

// Deref returns the value from the passed pointer or the zero value if the pointer is nil
func Deref[T any](t *T) T {
	if t == nil {
		var zero T
		return zero
	}
	return *t
}
