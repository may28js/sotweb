
export type LinkType = 'channel' | 'post';

export interface StoryLink {
    type: LinkType;
    id: number;
    messageId?: number;
}

export const SCHEME = 'storyoftime://';

export const generateLink = (type: LinkType, id: number, messageId?: number): string => {
    let url = `${SCHEME}${type}/${id}`;
    if (messageId) {
        url += `/${messageId}`;
    }
    return url;
};

export const parseLink = (url: string): StoryLink | null => {
    if (!url.startsWith(SCHEME)) return null;

    const path = url.substring(SCHEME.length);
    const parts = path.split('/');

    if (parts.length < 2) return null;

    const type = parts[0] as LinkType;
    if (type !== 'channel' && type !== 'post') return null;

    const id = parseInt(parts[1], 10);
    if (isNaN(id)) return null;

    const result: StoryLink = { type, id };

    if (parts.length >= 3) {
        const msgId = parseInt(parts[2], 10);
        if (!isNaN(msgId)) {
            result.messageId = msgId;
        }
    }

    return result;
};

export const handleLinkClick = (url: string) => {
    const link = parseLink(url);
    if (link) {
        // Dispatch custom event for navigation
        const event = new CustomEvent('storyoftime-navigate', { detail: link });
        window.dispatchEvent(event);
        return true;
    }
    return false;
};
