import React from 'react';
import { type EmbedData } from '../types';

interface LinkPreviewCardProps {
    embeds: EmbedData[];
}

const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ embeds }) => {
    if (!embeds || embeds.length === 0) return null;

    const getEmbedUrl = (embed: EmbedData) => {
        if (embed.provider_name === 'YouTube') {
            // Extract Video ID
            const match = embed.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
            if (match && match[1]) {
                return `https://www.youtube.com/embed/${match[1]}?autoplay=0`;
            }
        } else if (embed.provider_name === 'Bilibili') {
             // Extract BV ID
             const match = embed.url.match(/BV[\w]+/);
             if (match) {
                 return `https://player.bilibili.com/player.html?bvid=${match[0]}&high_quality=1&danmaku=0&autoplay=0`;
             }
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-2 mt-2 max-w-[400px]">
            {embeds.map((embed, index) => {
                const embedUrl = getEmbedUrl(embed);

                return (
                    <div key={index} className="flex flex-col bg-[#2B2D31] border-l-4 border-[#1E1F22] rounded overflow-hidden">
                        <div className="p-2 flex flex-col gap-1">
                            <div className="text-xs text-[#949BA4] font-medium">{embed.provider_name}</div>
                            <a 
                                href={embed.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[#00A8FC] font-medium hover:underline text-sm truncate"
                            >
                                {embed.title}
                            </a>
                            <div className="text-xs text-[#949BA4]">{embed.author_name}</div>
                        </div>
                        
                        {embedUrl ? (
                            <div className="aspect-video w-full">
                                <iframe 
                                    src={embedUrl} 
                                    className="w-full h-full" 
                                    title={embed.title}
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                    referrerPolicy="no-referrer"
                                ></iframe>
                            </div>
                        ) : (
                            embed.thumbnail_url && (
                                <div className="aspect-video w-full overflow-hidden bg-black">
                                    <img src={embed.thumbnail_url} alt={embed.title} className="w-full h-full object-contain" />
                                </div>
                            )
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default LinkPreviewCard;
