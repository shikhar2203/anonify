import {z} from 'zod';

export const messageSchema = z.object({
    content: z
        .string()
        .min(1, {message: 'Content must be atleast 1 character'})
        .max(300, {message: 'Content must be no more than 300 characters'})
})