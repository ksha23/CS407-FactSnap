package validate

import (
	"fmt"
	"github.com/asaskevich/govalidator"
	"strconv"
	"time"
)

const (
	MaxUsernameLength = 30

	MinTitleLength = 3
	MaxTitleLength = 120

	MinBodyLength = 3
	MaxBodyLength = 2200

	MinPollOptions      = 1
	MaxPollOptions      = 10
	MinPollOptionLength = 1
	MaxPollOptionLength = 100
)

func Title(str string) error {
	// min 3 chars
	if len(str) < MinTitleLength {
		return fmt.Errorf("%s must be at least %d characters long", str, MinTitleLength)
	}

	// max 120 chars
	if len(str) > MaxTitleLength {
		return fmt.Errorf("%s cannot exceed %d characters", str, MaxTitleLength)
	}

	return nil
}

func Body(str string) error {
	// min 3 chars
	if len(str) < MinBodyLength {
		return fmt.Errorf("%s must be at least %d characters long", str, MinBodyLength)
	}

	// max 2200 chars
	if len(str) > MaxBodyLength {
		return fmt.Errorf("%s cannot exceed %d characters", str, MaxBodyLength)
	}

	return nil
}

func Location(lat, lon float64) error {
	if !govalidator.IsLatitude(strconv.FormatFloat(lat, 'f', -1, 64)) {
		return fmt.Errorf("%f is not a valid latitude", lat)
	}
	if !govalidator.IsLongitude(strconv.FormatFloat(lon, 'f', -1, 64)) {
		return fmt.Errorf("%f is not a valid longitude", lon)
	}
	return nil
}

func URL(str string) error {
	if !govalidator.IsURL(str) {
		return fmt.Errorf("%s is not a valid URL", str)
	}
	return nil
}

func ExpiresAt(expiresAt time.Time) error {
	// must be after current time
	currTime := time.Now().UTC()

	if !currTime.Before(expiresAt.UTC()) {
		return fmt.Errorf("%s must be after current time", expiresAt)
	}

	return nil
}

func PollOptionLabels(optionLabels []string) error {
	// min 1 option
	if len(optionLabels) < MinPollOptions {
		return fmt.Errorf("must have at least %d options", MinPollOptions)
	}

	// max 10 options
	if len(optionLabels) > MaxPollOptions {
		return fmt.Errorf("cannot exceed %d options", MaxPollOptions)
	}

	// each label must be between 1-100 chars (inclusive)
	for _, label := range optionLabels {
		if len(label) < MinPollOptionLength {
			return fmt.Errorf("%s option label must be at least %d characters long", label, MinPollOptionLength)
		}
		if len(label) > MaxPollOptionLength {
			return fmt.Errorf("%s option label cannot exceed %d characters", label, MaxPollOptionLength)
		}
	}

	return nil
}
