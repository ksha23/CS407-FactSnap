import { User } from "@/models/user";

export type Response = {
    id: string;
    question_id: string;
    author: User;
    body: string;
    is_owned: boolean;
    image_urls?: string[]
    created_at: string;
    edited_at: string;
}

// DTOs

// CREATE RESPONSE
export type CreateResponseReq = {
    question_id: string;
    body: string;
    image_urls?: string[];
}

export type CreateResponseRes = {
    response: Response;
}

// EDIT RESPONSE
export type EditResponseReq = {
    response_id: string;
    question_id: string; // THIS IS ONLY USED BY TANSTACK
    body: string;
}

export type EditResponseRes = {
    response: Response;
}

// GET RESPONSES BY QUESTION ID
export type GetResponsesByQuestionIdRes = {
    responses: Response[];
}

// GET RESPONSE BY ID
export type GetResponseByIdRes = {
    response: Response;
}

// GET QUESTION SUMMARY
export type GetQuestionSummaryRes = {
    summary: string;
}