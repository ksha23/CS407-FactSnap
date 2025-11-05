import {z} from "zod";
import {Category, ContentType} from "@/models/question";


// Go time.Duration pattern: sequences like "1h", "30m", "15s", "200ms"
const goDurationRegex = /^(\d+(\.\d+)?(ns|us|µs|ms|s|m|h))+$/;


export function parseToHours(duration: string): number | null {
    const match = duration.match(/^(\d+(\.\d+)?)([a-zµ]+)$/)
    if (!match) return null
    const value = parseFloat(match[1])
    const unit = match[3]
    switch (unit) {
        case "h":
            return value
        case "m":
            return value / 60
        case "s":
            return value / 3600
        case "ms":
            return value / 3_600_000
        case "us":
        case "µs":
            return value / 3_600_000_000
        case "ns":
            return value / 3_600_000_000_000
        default:
            return null
    }
}

const password = z.string()
    .min(8,
        {message: "Must be at least 8 characters long"}
    )
    .regex(/[A-Z]/,
        {message: "Must include at least 1 uppercase letter"}
    )
    .regex(/[a-z]/,
        {message: "Must include at least 1 lowercase letter"}
    )
    .regex(/[0-9]/,
        {message: "Must include at least 1 number"}
    )
    .regex(/[\W_]/,
        {message: "Must include at least 1 special character"}
    )

const location = z.object({
    latitude: z.number(),
    longitude: z.number(),
    name: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
})

const url = z.string().url({message: "Must be a URL"})

const poll_option = z.string()
    .min(1, {message: "Must be at least 1 character long"})
    .max(100, {message: "Cannot exceed 100 characters"})

export const SignUpFormSchema = z.object({
    email: z.string().email(),
    password: password,
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords did not match',
    path: ['confirmPassword'],
});

export const SignInFormSchema = z.object({
    email: z.string().email().nonempty({message: "Email cannot be empty"}),
    password: z.string().nonempty({message: "Password cannot be empty"}),
})

export const CreatePollFormSchema = z.object({
    content_type: z.literal(ContentType.POLL),
    option_labels: z.array(z.string())
        .min(1, {message: "Must include at least 1 option"})
        .max(10, {message: "Cannot exceed 10 options"})
        .refine((labels) => {
            // ensure each label is at least 1 character
            for (const label of labels) {
                if (label.length < 1) {
                    return false
                }
            }
            return true
        }, {message: "Each option must be at least 1 character"})
        .refine((labels) => {
            // ensure each label is at most 100 character
            for (const label of labels) {
                if (label.length > 100) {
                    return false
                }
            }
            return true
        }, {message: "Each option must not exceed 100 characters"}),
})

export const CreateQuestionNoneContent = z.object({
    content_type: z.literal(ContentType.NONE)
})

export const CreateQuestionContentSchema = z.discriminatedUnion("content_type", [
    CreatePollFormSchema,
    CreateQuestionNoneContent,
])

export const CreateQuestionFormSchema = z.object({
    title: z.string()
        .min(3, {message: "Must be at least 3 characters long"})
        .max(120, {message: "Cannot exceed 120 characters"}),
    body: z.string()
        .min(3, {message: "Must be at least 3 characters long"})
        .max(2200, {message: "Cannot exceed 2200 characters"})
        .optional()
        .nullable(),
    category: z.nativeEnum(Category, {message: "Invalid category"}),
    location: location,
    image_urls: z.array(url).optional().nullable(),
    duration: z.string().refine((duration) => {
        if (!goDurationRegex.test(duration)) {
            return false;
        }
        const hours = parseToHours(duration)
        return hours !== null && hours >= 1 && hours <= 24
    }, {
        message: "Duration must be between 1h and 24h"
    })
}).extend({
    content: CreateQuestionContentSchema
})

