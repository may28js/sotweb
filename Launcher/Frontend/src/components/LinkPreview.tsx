import React, { useEffect, useState } from 'react';
import type { StoryLink } from '../lib/links';
import { useSocialContext } from './SocialContext';
import type { Post } from '../types';
import { Hash, MessageSquare } from 'lucide-react';
import { api } from '../lib/api';

interface LinkPreviewProps {
    link: StoryLink;
    rawUrl: string;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ link, rawUrl }) => {
    const { channels } = useSocialContext();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(false);

    // Fetch post data if it's a post link
    useEffect(() => {
        const controller = new AbortController();

        if (link.type === 'post' && link.id) {
            setLoading(true);
            api.get<Post>(`/Community/posts/${link.id}`, { signal: controller.signal })
                .then(res => {
                    if (!controller.signal.aborted) {
                        setPost(res.data);
                    }
                })
                .catch(err => {
                    if (err.code !== "ERR_CANCELED") {
                        console.error("Failed to fetch post for preview", err);
                    }
                })
                .finally(() => {
                    if (!controller.signal.aborted) {
                        setLoading(false);
                    }
                });
        }

        return () => {
            controller.abort();
        };
    }, [link.type, link.id]);

    const handleNavigate = (e: React.MouseEvent) => {
        e.preventDefault();
        const event = new CustomEvent('storyoftime-navigate', { detail: link });
        window.dispatchEvent(event);
    };

    // Discord-like link style
    const containerClass = "inline-flex items-center gap-0.5 bg-[#2b2d31] hover:bg-[#2b2d31]/80 text-[#B5BAC1] hover:text-white px-1.5 py-0.5 rounded text-[13px] transition-colors cursor-pointer align-bottom mx-0.5 no-underline font-medium select-none max-w-full overflow-hidden whitespace-nowrap align-middle";

    if (link.type === 'channel') {
        const channel = channels.find(c => c.id === link.id);
        
        // If channel not found, fallback to raw link
        if (!channel) {
             return <a href={rawUrl} onClick={handleNavigate} className="text-[#00A8FC] hover:underline cursor-pointer">{rawUrl}</a>;
        }

        const Icon = (channel.type === 'Forum') ? MessageSquare : Hash;
        
        return (
            <span onClick={handleNavigate} className={containerClass} title={`${channel.name} ${link.messageId ? '› 消息' : ''}`}>
                <Icon className="w-3.5 h-3.5 opacity-70 mr-0.5" />
                <span className="truncate max-w-[150px]">{channel.name}</span>
                {link.messageId && (
                     <>
                        <span className="opacity-60 text-[10px] mx-0.5">›</span>
                        <span className="flex items-center justify-center">
                           <MessageSquare className="w-3 h-3 opacity-90" />
                        </span>
                     </>
                )}
            </span>
        );
    }

    if (link.type === 'post') {
        // If loading, show a loading placeholder or raw url
        if (loading) return <span className="text-xs text-gray-500 animate-pulse">Loading...</span>;
        
        // If post not found after fetch, fallback
        if (!post) {
            return <a href={rawUrl} onClick={handleNavigate} className="text-[#00A8FC] hover:underline cursor-pointer">{rawUrl}</a>;
        }

        const channel = channels.find(c => c.id === post.channelId);
        
        return (
            <span onClick={handleNavigate} className={containerClass} title={`${channel?.name || 'Unknown'} › ${post.title}`}>
                 {channel && (
                    <>
                        <MessageSquare className="w-3.5 h-3.5 opacity-70 mr-0.5" />
                        <span className="truncate max-w-[100px]">{channel.name}</span>
                        <span className="opacity-60 text-[10px] mx-0.5">›</span>
                    </>
                 )}
                 <MessageSquare className="w-3.5 h-3.5 opacity-70 mr-0.5" />
                 <span className="truncate max-w-[200px]">{post.title}</span>
            </span>
        );
    }

    return null;
};

export default LinkPreview;
