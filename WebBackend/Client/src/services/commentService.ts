import api from './api';
import { Comment, CreateCommentDto } from '../types/comment';

export const getCommentsByNewsId = async (newsId: number): Promise<Comment[]> => {
    try {
        const response = await api.get<Comment[]>(`/Comments/News/${newsId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch comments', error);
        return [];
    }
};

export const createComment = async (data: CreateCommentDto): Promise<Comment | null> => {
    try {
        const response = await api.post<Comment>('/Comments', data);
        return response.data;
    } catch (error) {
        console.error('Failed to create comment', error);
        throw error;
    }
};

export const deleteComment = async (id: number): Promise<boolean> => {
    try {
        await api.delete(`/Comments/${id}`);
        return true;
    } catch (error) {
        console.error('Failed to delete comment', error);
        return false;
    }
};
