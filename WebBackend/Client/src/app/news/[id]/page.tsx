'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getNewsById } from '../../../services/newsService';
import { News } from '../../../types/news';
import { MOCK_NEWS, getMockThumbnail } from '../../../data/mockNews';
import { Calendar, User, ArrowLeft, Clock, MessageSquare, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../../context/AuthContext';
import { getCommentsByNewsId, createComment, deleteComment } from '../../../services/commentService';
import { Comment } from '../../../types/comment';

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [newsItem, setNewsItem] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Comment state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchNewsItem = async () => {
      if (!params.id) return;
      
      try {
        const id = Number(params.id);
        // Try to fetch real data
        try {
            const data = await getNewsById(id);
            if (data) {
                // Add fallback thumbnail if missing
                if (!data.thumbnail) {
                    data.thumbnail = getMockThumbnail(data.id);
                }
                setNewsItem(data);
            } else {
                throw new Error("News item not found");
            }
        } catch (e) {
            // Fallback to mock if API fails or ID not found in backend
            console.log("Using mock data for news detail");
            const mockNews = MOCK_NEWS.find(n => n.id === id) || MOCK_NEWS[0];
            setNewsItem({ 
                ...mockNews, 
                id: id, 
                title: mockNews.id === id ? mockNews.title : `News Article ${id}`,
                thumbnail: getMockThumbnail(id)
            });
        }
      } catch (err) {
        console.error('Failed to fetch news item', err);
        router.push('/news');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsItem();
  }, [params.id, router]);

  // Fetch comments when news item is loaded
  useEffect(() => {
    if (newsItem && newsItem.id) {
        const fetchComments = async () => {
            const data = await getCommentsByNewsId(newsItem.id);
            setComments(data);
        };
        fetchComments();
    }
  }, [newsItem]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !newsItem || !user) return;

    setSubmitting(true);
    try {
        const newComment = await createComment({
            newsId: newsItem.id,
            content: commentContent
        });

        if (newComment) {
            setComments([newComment, ...comments]);
            setCommentContent('');
        }
    } catch (error) {
        console.error("Failed to submit comment", error);
        alert("评论发布失败，请重试。");
    } finally {
        setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("确定要删除这条评论吗？")) return;

    try {
        const success = await deleteComment(commentId);
        if (success) {
            setComments(comments.filter(c => c.id !== commentId));
        } else {
            alert("删除失败。");
        }
    } catch (error) {
        console.error("Failed to delete comment", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!newsItem) {
    return null; // or error state
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#1a1a1a] relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{ backgroundImage: "url('/demo-assets/home/general-page-bg.avif')" }}
        ></div>
      </div>

      <div className="relative z-10 flex-grow pt-36 pb-12">
        <div className="max-w-[1220px] mx-auto px-4 sm:px-6">
          
          <div className="bg-[#272727] border border-white/10 rounded-sm overflow-hidden shadow-2xl">
            {/* Hero Image for Article */}
            <div className="relative h-64 md:h-96 w-full">
                <Image 
                    src={newsItem.thumbnail || '/demo-assets/news/24.jpeg'}
                    alt={newsItem.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/demo-assets/news/24.jpeg';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#272727] via-[#272727]/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 px-6 pt-6 pb-3 md:px-10 md:pt-10 md:pb-5 w-full">
                    <div className="flex items-center gap-4 mb-4">
                        <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider border ${
                            newsItem.type === 'Update' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                            newsItem.type === 'Event' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                            newsItem.type === 'Maintenance' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                            'border-blue-500/30 text-blue-400 bg-blue-500/10'
                        }`}>
                            {newsItem.type}
                        </span>
                        <div className="flex items-center text-gray-300 text-sm font-medium">
                            <Calendar className="h-4 w-4 mr-2 text-yellow-500" />
                            {new Date(newsItem.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                        {newsItem.title}
                    </h1>
                </div>
            </div>

            <div className="px-6 pb-6 pt-4 md:px-12 md:pb-12 md:pt-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-8 mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <User className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-white">发布者：<span className="text-yellow-500">{newsItem.author}</span></p>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">社区经理</p>
                        </div>
                    </div>
                    <div className="flex items-center text-gray-500 text-xs uppercase tracking-wider font-bold">
                        <Clock className="h-4 w-4 mr-2" />
                        {new Date(newsItem.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                {/* Content */}
                <div 
                    className="prose prose-invert prose-yellow max-w-[1116px] mx-auto prose-lg prose-headings:font-bold prose-a:text-yellow-500 hover:prose-a:text-yellow-400"
                    dangerouslySetInnerHTML={{ __html: newsItem.content }}
                >
                </div>

                {/* Custom Styles for Rich Text Content */}
                <style jsx global>{`
                    .prose .ql-video {
                        width: 100%;
                        max-width: 900px;
                        aspect-ratio: 16 / 9;
                        height: auto;
                        margin: 2rem auto;
                        display: block;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 4px;
                    }
                    .prose img {
                        border-radius: 8px;
                        margin-top: 2rem;
                        margin-bottom: 2rem;
                        border: none;
                        box-shadow: none;
                        display: block;
                        margin-left: auto;
                        margin-right: auto;
                        max-width: 100%;
                        height: auto;
                    }
                    .prose p {
                        line-height: 2.0;
                        font-size: 16px;
                        color: #dfd4b4;
                        margin-bottom: 0;
                        margin-top: 0;
                    }
                    /* Custom H3 Style for Section Headers */
                    .prose h3 {
                        font-size: 24px !important;
                        color: rgb(218, 165, 32) !important;
                        font-weight: bold;
                        margin-top: 1.5em;
                        margin-bottom: 0.5em;
                        text-indent: 0 !important;
                        padding-left: 0 !important;
                        line-height: 1.4;
                    }
                    .prose blockquote {
                        border-left: 4px solid #f59e0b;
                        background-color: rgba(245, 158, 11, 0.1);
                        padding: 1rem 1.5rem;
                        margin: 1.5rem 0;
                        color: #f3f4f6;
                        border-radius: 0 4px 4px 0;
                        font-style: normal;
                    }
                    .prose blockquote p {
                        color: inherit;
                        margin: 0;
                    }
                `}</style>

                {/* Comments Section */}
                <div className="mt-16">
                    <div className="flex items-center space-x-2 mb-8">
                        <MessageSquare className="h-6 w-6 text-yellow-500" />
                        <h2 className="text-2xl font-bold text-white">评论 ({comments.length})</h2>
                    </div>

                    <div className="space-y-4">
                        {comments.length === 0 ? (
                            <p className="text-gray-400">暂无评论。来做第一个评论的人吧！</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-sm hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                                     <div className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10 sm:h-12 sm:w-12 bg-white/5 border border-white/10 flex items-center justify-center">
                                        {comment.avatar ? (
                                            <Image src={comment.avatar} alt={comment.username} fill className="object-cover" />
                                        ) : (
                                            <span className="text-yellow-500 font-bold text-lg">{comment.username.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-yellow-500 font-bold text-sm sm:text-base">{comment.username}</span>
                                                <span className="text-gray-500 text-xs">{new Date(comment.createdAt).toLocaleString('zh-CN')}</span>
                                            </div>
                                            {/* Delete button (only visible to owner or admin) */}
                                            {user && (user.id === comment.userId.toString() || user.accessLevel >= 1) && (
                                                <button 
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="删除评论"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-gray-300 text-sm sm:text-base leading-relaxed break-words">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination - Placeholder for now as we load all comments */}
                    {comments.length > 10 && (
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5 pt-6">
                            <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                                显示全部 {comments.length} 条评论
                            </div>
                        </div>
                    )}

                    {/* Comment Form */}
                    {user ? (
                        <form className="bg-white/5 p-4 sm:p-6 rounded-sm flex items-start gap-4 mt-8 border border-white/5 shadow-inner" onSubmit={handleSubmitComment}>
                             <div className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10 sm:h-12 sm:w-12 bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                                <span className="text-yellow-500 font-bold text-lg">{user.username.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex flex-col flex-grow min-w-0">
                                <div className="flex items-center space-x-2 text-sm mb-3">
                                    <span className="text-yellow-400 font-semibold truncate">{user.username}</span>
                                </div>
                                <div className="flex flex-col space-y-3">
                                    <textarea 
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        placeholder="写下你的评论..." 
                                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-sm p-3 text-sm sm:text-base text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-yellow-500/50 transition-colors focus:ring-1 focus:ring-yellow-500/20" 
                                        rows={3} 
                                        maxLength={1000}
                                        disabled={submitting}
                                    ></textarea>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                        <span className="text-xs sm:text-sm text-gray-500">最多 1000 字符</span>
                                        <button 
                                            type="submit" 
                                            disabled={submitting || !commentContent.trim()}
                                            className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold px-6 py-2 rounded-sm transition-colors duration-200 text-sm flex items-center"
                                        >
                                            <Send className="h-4 w-4 mr-2" />
                                            {submitting ? '发送中...' : '发送评论'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-sm text-center">
                            <p className="text-gray-300 mb-4">请登录后参与评论</p>
                            <Link href="/auth" className="inline-block px-6 py-2 bg-yellow-500 text-black font-bold rounded-sm hover:bg-yellow-400 transition-colors">
                                登录 / 注册
                            </Link>
                        </div>
                    )}
                </div>
                
                <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">
                    <Link href="/news" className="text-gray-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider flex items-center">
                        <ArrowLeft className="h-4 w-4 mr-2" /> 返回新闻列表
                    </Link>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
