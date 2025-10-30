import {z} from "zod";
import {Category, QuestionType} from "@/models/question";

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

export const QuestionFormSchema = z.object({
    title: z.string()
        .min(3, {message: "Must be at least 3 characters long"})
        .max(120, {message: "Cannot exceed 120 characters"}),
    body: z.string()
        .min(3, {message: "Must be at least 3 characters long"})
        .max(2200, {message: "Cannot exceed 2200 characters"})
        .optional()
        .nullable(),
    type: z.nativeEnum(QuestionType, {message: "Invalid question type"}),
    category: z.nativeEnum(Category, {message: "Invalid category"}),
    location: location,
    image_urls: z.array(url).optional().nullable(),
    summary: z.string().optional().nullable(),
})