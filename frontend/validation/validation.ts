import {z} from "zod";

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

export const SignUpFormSchema = z.object({
    email: z.string().email(),
    password: password,
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords did not match',
    path: ['confirmPassword'],
});