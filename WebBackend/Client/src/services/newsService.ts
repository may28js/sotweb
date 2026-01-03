import api from "./api";
import { News } from "../types/news";

export const getNews = async (): Promise<News[]> => {
  const response = await api.get<News[]>("/news");
  return response.data;
};

export const getNewsById = async (id: number): Promise<News> => {
  const response = await api.get<News>(`/news/${id}`);
  return response.data;
};

export const createNews = async (news: Omit<News, "id" | "createdAt">): Promise<News> => {
  const response = await api.post<News>("/news", news);
  return response.data;
};