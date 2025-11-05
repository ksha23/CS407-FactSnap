import { User } from "@/models/user";
import {Location} from "@/models/location";

export enum ContentType {
  POLL = "poll",
  NONE = "none",
}

export enum Category {
  RESTAURANT = 'restaurant',
  STORE = 'store',
  TRANSPORTATION = 'transportation',
  EVENT = 'event',
  GENERAL = 'general',
}

export type QuestionContent = {
  Type: ContentType,
  Data: any,
}

export type Question = {
  id: string;
  author: User;
  title: string;
  body?: string;
  category: Category;
  content: QuestionContent;
  location: Location;
  image_urls?: string[];
  is_owned: boolean;
  created_at: string;
  edited_at: string;
  expires_at: string;
};

// DTOs

// CREATE QUESTION
export type CreateQuestionReq = {
  title: string;
  body?: string;
  category: Category;
  location: Location;
  image_urls?: string[];
  duration: string;
}

export type CreateQuestionRes = {
  question: Question;
}

// GET QUESTION BY ID
export type GetQuestionByIdRes = {
  question: Question;
}

// CREATE POLL
export type CreatePollReq = {
  question_id: string;
  option_labels: string[];
}

// export type CreateQuestionParams = {
//   questionType: QuestionType;
//   category: Category;
//   title: string;
//   body?: string;
//   location: Location;
//   imageUrls?: string[];
// };
//
// export type GetQuestionsParams = {
//   latitude: string;
//   longitude: string;
//   radius: number;
// };
