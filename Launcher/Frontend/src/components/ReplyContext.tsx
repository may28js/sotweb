import React from 'react';
import { type Message } from '../types';
import { getAvatarUrl } from '../lib/api';
import { Image as ImageIcon } from 'lucide-react';

interface ReplyContextProps {
    replyTo: Message;
    onClick?: (messageId: number) => void;
}

const ReplyContext: React.FC<ReplyContextProps> = ({ replyTo, onClick }) => {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) {
            onClick(replyTo.id);
        }
    };

    // Determine content to display
    let contentDisplay = null;

    if (replyTo.content) {
        contentDisplay = (
            <span className="truncate max-w-[300px] text-[#b5bac1] hover:text-white transition-colors">
                {replyTo.content}
            </span>
        );
    } else if ((replyTo.attachmentUrls && replyTo.attachmentUrls.length > 0) || (replyTo.pendingFiles && replyTo.pendingFiles.length > 0)) {
        contentDisplay = (
            <span className="flex items-center gap-1 text-[#b5bac1] hover:text-white transition-colors italic">
                <span>点击查看附件</span>
                <ImageIcon size={14} />
            </span>
        );
    } else {
        contentDisplay = (
            <span className="text-[#b5bac1] italic">
                消息已删除或无法显示
            </span>
        );
    }

    return (
        <div 
            className="flex items-center gap-1.5 text-xs cursor-pointer select-none opacity-80 hover:opacity-100 transition-opacity"
            onClick={handleClick}
        >
            {/* Small Avatar */}
            <img 
                src={getAvatarUrl(replyTo.user?.avatarUrl)} 
                className="w-4 h-4 rounded-full" 
                alt="avatar"
            />
            
            {/* Username */}
            <span 
                className="font-medium hover:underline"
                style={{ color: replyTo.user?.roleColor || '#ffffff' }}
            >
                {replyTo.user?.nickname || replyTo.user?.username || 'Unknown'}
            </span>

            {/* Content Preview */}
            {contentDisplay}
        </div>
    );
};

export default ReplyContext;
