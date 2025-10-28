import { User } from "@/models/user";

export enum QuestionType {
  WAIT_TIME = 'wait_time',
  AVAILABILITY = 'availability',
  RULE = 'rule',
  WEATHER = 'weather',
  STATUS = 'status',
}

export enum Category {
  RESTAURANT = 'restaurant',
  STORE = 'store',
  TRANSPORTATION = 'transportation',
  EVENT = 'event',
  GENERAL = 'general',
}

export type Location = {
  latitude: number;
  longitude: number;
};

export type Question = {
  id: string;
  type: QuestionType;
  author: User;
  title: string;
  body?: string | null;
  location: Location;
  image_urls?: string[];
  category?: Category;
  summary?: string | null;
  created_at: string;
  edited_at: string;
};

export type CreateQuestionParams = {
  questionType: QuestionType;
  category: Category;
  title: string;
  body?: string;
  location: Location;
  imageUrls?: string[];
};

export type GetQuestionsParams = {
  latitude: string;
  longitude: string;
  radius: number;
};
