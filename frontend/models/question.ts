import { User } from "@/models/user";
import {Location} from "@/models/location";

export enum QuestionType {
  POLL = "poll",
}

export enum Category {
  RESTAURANT = 'restaurant',
  STORE = 'store',
  TRANSPORTATION = 'transportation',
  EVENT = 'event',
  GENERAL = 'general',
}

export type Question = {
  id: string;
  type?: QuestionType;
  category: Category;
  author: User;
  title: string;
  body?: string;
  location: Location;
  image_urls?: string[];
  summary?: string;
  created_at: string;
  edited_at: string;
};

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
