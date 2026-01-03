export interface Comment {
    id: number;
    content: string;
    createdAt: string;
    newsId: number;
    userId: number;
    username: string;
    avatar?: string;
}

export interface CreateCommentDto {
    newsId: number;
    content: string;
}
