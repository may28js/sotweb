
// --- Community Types ---

export const CommunityPermissions = {
    None: 0,
    ViewChannels: 1 << 0,
    SendMessages: 1 << 1,
    ManageMessages: 1 << 2,
    ManageChannels: 1 << 3,
    ManageRoles: 1 << 4,
    MentionEveryone: 1 << 5,
    KickMembers: 1 << 6,
    BanMembers: 1 << 7,
    Administrator: 1 << 8,
    Connect: 1 << 9
} as const;
export type CommunityPermissions = number;

export interface User {
    id: number;
    username: string;
    nickname?: string;
    avatarUrl?: string;
    email?: string;
    accessLevel: number;
    preferredStatus?: number; // 0=online, 1=idle, 2=dnd, 3=offline
    points: number;
    roles?: number[]; // IDs
    communityRoles?: UserCommunityRole[];
    lastReadGlobalNotifyAt?: string;
    bio?: string;
    joinDate?: string;
    aboutMe?: string;
    createdAt?: string;
    roleColor?: string;
}

export interface UserCommunityRole {
    userId: number;
    communityRoleId: number;
    communityRole?: CommunityRole;
}

export interface CommunityRole {
    id: number;
    name: string;
    color: string;
    permissions: number;
    sortOrder: number;
    isHoisted: boolean;
    accessLevel?: number;
}

export interface ChannelPermissionOverride {
    id: number;
    channelId: number;
    roleId: number;
    allow: number;
    deny: number;
}

export interface Channel {
    id: number;
    name: string;
    type: 'Chat' | 'Forum' | 'Voice';
    categoryId?: number;
    sortOrder: number;
    permissionOverrides?: ChannelPermissionOverride[];
    lastActivityAt?: string;
    hasUnread?: boolean;
    unreadCount?: number;
    lastReadMessageId?: number;
    lastReadAt?: string;
    description?: string;
}

export interface Category {
    id: number;
    name: string;
    sortOrder: number;
    channels: Channel[];
}

export interface CommunitySettings {
    id: number;
    serverName: string;
    iconUrl?: string;
    themeImageUrl?: string;
    defaultChannelId?: number;
    lastGlobalNotifyAt: string;
}

export interface Message {
    id: number;
    channelId: number;
    userId: number;
    content: string;
    createdAt: string;
    updatedAt?: string;
    user?: User;
    attachmentUrls?: string[];
    embeds?: EmbedData[];
    replyToId?: number;
    replyTo?: Message;
    reactions?: Reaction[];
    postId?: number;
    
    // Optimistic UI
    isSending?: boolean;
    isError?: boolean;
    pendingFiles?: any[];
}

export interface Reaction {
    messageId: number;
    userId: number;
    emoji: string;
}

export interface Post {
    id: number;
    channelId: number;
    authorId: number;
    title: string;
    content: string;
    createdAt: string;
    updatedAt?: string;
    lastActivityAt: string;
    viewCount: number;
    replyCount: number;
    messageCount?: number;
    author?: User;
    attachmentUrls?: string[];
    embeds?: EmbedData[];
    isPinned: boolean;
    isLocked: boolean;
    hasUnread?: boolean;
    unreadCount?: number;
    lastReadMessageId?: number;
}

export interface EmbedData {
    type: 'link' | 'video' | 'photo' | 'rich';
    url: string;
    title?: string;
    description?: string;
    siteName?: string;
    site_name?: string;
    thumbnailUrl?: string;
    thumbnail_url?: string;
    providerName?: string;
    provider_name?: string;
    authorName?: string;
    author_name?: string;
    html?: string;
    width?: number;
    height?: number;
}

export interface Member extends User {
    joinedAt?: string;
}

// --- Store / Launcher Types ---

export interface ShopItem {
    id: number;
    name: string;
    description: string;
    price: number;
    iconUrl?: string;
    category: string;
    isUnique?: boolean;
    originalPrice?: number;
    currency?: string;
    discount?: number;
    featured?: boolean;
}

export interface CartItem extends ShopItem {
    quantity: number;
}

export interface NewsItem {
    id: string;
    title: string;
    desc: string;
    date: string;
    tag: string;
    image: string;
    content?: string;
}

export interface PatchNoteItem {
    version: string;
    date: string;
    changes?: string[];
    content?: string;
    highlight?: boolean;
}

export interface LauncherConfig {
    apiBaseUrl?: string;
    enableMockData?: boolean;
    version?: string;
    realmlist?: string;
    websiteUrl?: string;
    registerUrl?: string;
    latestVersion?: string;
    downloadUrl?: string;
}

export interface ServerStatus {
    id?: number;
    name?: string;
    isOnline?: boolean;
    onlineCount?: number;
    status?: string;
    maxPlayers?: number;
    uptime?: string;
}

export interface Character {
    guid: number;
    name: string;
    race: number;
    class: number;
    gender: number;
    level: number;
}
