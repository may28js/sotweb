import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { handleLinkClick, parseLink } from '../lib/links';
import LinkPreview from './LinkPreview';
import { Spoiler } from './Spoiler';
import { cn, parseColorToRgba, escapeRegExp } from '../lib/utils';
import { type CommunityRole } from '../types';

interface MessageContentProps {
    content: string;
    className?: string;
    roles?: CommunityRole[];
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, className, roles }) => {
    if (!content) return null;

    // Pre-process content to handle:
    // 1. Spoilers: ||text|| -> [text](spoiler:void)
    // 2. Custom Protocol Links: storyoftime://... -> <storyoftime://...> (to ensure they are treated as links)
    // 3. Mentions: @everyone, @Role -> [text](mention:...)
    
    // Note: We use a simple replacement. Be careful with code blocks, but for now this suffices.
    let processedContent = content;

    // Handle Spoilers
    processedContent = processedContent.replace(/\|\|([\s\S]*?)\|\|/g, '[$1](spoiler:void)');

    // Handle @everyone
    processedContent = processedContent.replace(/@everyone/g, '[@everyone](mention:everyone)');

    // Handle @Role
    if (roles && roles.length > 0) {
        // Create a single regex pattern for all roles to avoid nested replacement issues
        // Sort by length desc to match longest names first
        const sortedRoles = [...roles].sort((a, b) => b.name.length - a.name.length);
        
        // Escape role names and join with |
        const pattern = sortedRoles.map(role => escapeRegExp(role.name)).join('|');
        const regex = new RegExp(`@(${pattern})`, 'g');

        processedContent = processedContent.replace(regex, (match, roleName) => {
            const role = roles.find(r => r.name === roleName);
            if (role) {
                return `[@${roleName}](mention:role:${role.id})`;
            }
            return match;
        });
    }

    // Handle storyoftime links that are NOT already in markdown link format
    processedContent = processedContent.replace(/(?<![\]\(\<])(storyoftime:\/\/[^\s\)]+)/g, '<$1>');

    // Helper to parse color to rgba
    // Removed local definition, imported from utils

    const components = React.useMemo(() => ({
        // Override link rendering
        a: ({node, href, children, ...props}: any) => {
            if (!href) return <a {...props}>{children}</a>;

            // Handle Spoilers
            if (href === 'spoiler:void') {
                return <Spoiler>{children}</Spoiler>;
            }

            // Handle Mentions
            if (href === 'mention:everyone') {
                return (
                    <span className="bg-[#faa61a1a] text-[#faa61a] hover:bg-[#faa61a33] rounded px-0.5 cursor-pointer font-medium transition-colors select-text">
                        {children}
                    </span>
                );
            }

            if (href.startsWith('mention:role:')) {
                const roleId = parseInt(href.split(':')[2]);
                const role = roles?.find(r => r.id === roleId);
                if (role && role.color) {
                    // Parse colors directly to RGBA strings
                    // 1. Text color (alpha 1)
                    const textColor = parseColorToRgba(role.color, 1) || role.color;
                    // 2. Background color (alpha 0.1) - standard state
                    const bgColor = parseColorToRgba(role.color, 0.1) || 'rgba(255,255,255,0.1)';
                    // 3. Hover background color (alpha 0.3)
                    const hoverBgColor = parseColorToRgba(role.color, 0.3) || 'rgba(255,255,255,0.2)';

                    return (
                        <span 
                            className="rounded px-0.5 cursor-pointer font-medium transition-colors select-text inline-block align-baseline"
                            style={{ 
                                color: textColor,
                                backgroundColor: bgColor,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = hoverBgColor;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = bgColor;
                            }}
                        >
                            {children}
                        </span>
                    );
                }
            }

            // Handle storyoftime:// links
            if (href.startsWith('storyoftime://')) {
                 const link = parseLink(href);
                 if (link) {
                     return (
                         <span className="inline-flex align-middle">
                             <LinkPreview link={link} rawUrl={href} />
                         </span>
                     );
                 }
                 return (
                    <a 
                        href={href} 
                        onClick={(e) => { 
                            e.preventDefault(); 
                            handleLinkClick(href); 
                        }} 
                        className="text-blue-400 hover:underline cursor-pointer break-all" 
                        title="跳转到内容"
                    >
                        {children}
                    </a>
                 );
            }
            
            // Default External Links
            return (
                <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-400 hover:underline break-all" 
                    {...props}
                >
                    {children}
                </a>
            );
        },
        // Custom styling for other elements to match Discord
        p: ({children}: any) => <div className="mb-1 last:mb-0">{children}</div>,
        blockquote: ({children}: any) => (
            <div className="flex my-1">
                <div className="w-1 bg-[#4f545c] rounded-l mr-2 shrink-0"></div>
                <blockquote className="text-[#dcddde] max-w-full opacity-90">{children}</blockquote>
            </div>
        ),
        code: ({node, className, children, ...props}: any) => {
             const match = /language-(\w+)/.exec(className || '')
             const isInline = !match && !String(children).includes('\n');
             return isInline ? (
                <code className="bg-[#2b2d31] rounded px-1.5 py-0.5 font-mono text-[85%] text-[#dcddde]" {...props}>
                    {children}
                </code>
            ) : (
                <div className="bg-[#2b2d31] border border-[#1e1f22] rounded p-2 my-1 overflow-x-auto font-mono text-sm text-[#dcddde]">
                    <code className={className} {...props}>
                        {children}
                    </code>
                </div>
            )
        },
        // Handle pre tag for code blocks
        pre: ({children}: any) => <pre className="m-0 bg-transparent">{children}</pre>,
        ul: ({children}: any) => <ul className="list-disc pl-6 mb-1">{children}</ul>,
        ol: ({children}: any) => <ol className="list-decimal pl-6 mb-1">{children}</ol>,
    }), [roles]);

    return (
        <div className={cn("markdown-content", className)}>
            <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkBreaks]}
                urlTransform={(url) => url} // Disable default protocol filtering to allow spoiler:void
                components={components}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};

export const MemoizedMessageContent = React.memo(MessageContent);
