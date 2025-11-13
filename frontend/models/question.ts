import { User } from "@/models/user";
import {Location} from "@/models/location";
import {PageFilterType} from "@/services/axios-client";

export enum ContentType {
  POLL = "Poll",
  NONE = "None",
}

export enum Category {
  RESTAURANT = 'Restaurant',
  STORE = 'Store',
  TRANSPORTATION = 'Transportation',
  EVENT = 'Event',
  GENERAL = 'General',
}

export type QuestionContent = {
  type: ContentType,
  data: any,
}

export type PollOption = {
  id: string;
  is_selected: boolean;
  label: string;
  num_votes: number;
}

export type Poll = {
  id: string;
  question_id: string;
  options: PollOption[];
  num_total_votes: number;
  created_at: string;
  expired_at: string;
}

export type Question = {
  id: string;
  author: User;
  title: string;
  body?: string;
  category: Category;
  content: QuestionContent;
  location: Location;
  responses_amount: number;
  image_urls?: string[];
  is_owned: boolean;
  created_at: string;
  edited_at: string;
  expired_at: string;
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
  content_type: ContentType;
}

export type CreateQuestionRes = {
  question_id: string;
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

export type CreatePollRes = {
  poll_id: string;
}

// VOTE POLL
export type VotePollReq = {
  question_id: string;
  poll_id: string;
  option_id?: string;
}

// GET QUESTIONS IN RADIUS FEED
export type GetQuestionsInRadiusFeedReq = {
  location: Location;
  radius_miles: number;
  limit: number;
  offset: number;
  page_filter_type: PageFilterType;
  page_filter_value: string;
}

export type GetQuestionsInRadiusFeedRes = {
  questions: Question[];
}
