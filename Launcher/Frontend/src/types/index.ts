export interface ShopItem {
  id: number;
  gameItemId?: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: 'gem' | 'vote';
  iconUrl: string;
  category: string;
  tags?: string[];
  discount?: number;
  featured?: boolean;
  isUnique?: boolean;
}

export interface NewsItem {
  id: string;
  tag: string;
  title: string;
  desc: string;
  image: string;
  date: string;
  url?: string;
}

export interface PatchNoteItem {
  version: string;
  date: string;
  content: string;
  highlight?: boolean;
}

export interface ServerStatus {
  status: string;
  onlinePlayers: number;
  maxPlayers: number;
  uptime: string;
}

export interface LauncherConfig {
  realmlist: string;
  websiteUrl: string;
  registerUrl: string;
  latestVersion: string;
  downloadUrl: string;
}

export interface Character {
  name: string;
  race: number;
  class: number;
  level: number;
  gender: number;
}

export interface User {
  id: number;
  username: string;
  nickname?: string;
  aboutMe?: string;
  email: string;
  points: number;
  accessLevel: number;
  avatarUrl?: string;
  preferredStatus?: number;
  createdAt?: string;
  roleColor?: string;
}

export interface CartItem extends ShopItem {
  quantity: number;
}

export interface EmbedData {
    type: string;
    provider_name: string;
    title: string;
    author_name: string;
    thumbnail_url: string;
    url: string;
}

export interface CommunitySettings {
    id: number;
    serverName: string;
    iconUrl?: string;
    themeImageUrl?: string;
    defaultChannelId?: number;
    lastGlobalNotifyAt?: string;
}

export interface CommunityRole {
    id: number;
    name: string;
    color: string;
    isHoisted: boolean;
    permissions: number;
    sortOrder: number;
}

export interface Channel {
    id: number;
    name: string;
    description?: string;
    type: 'Chat' | 'Voice' | 'Forum';
    categoryId?: number;
    permissionOverrides?: ChannelPermissionOverride[];
}

export interface ChannelPermissionOverride {
    id: number;
    channelId: number;
    roleId: number;
    allow: number; // long in C# is number in TS (up to 2^53 safe integer)
    deny: number;
}

export interface Category {
    id: number;
    name: string;
    sortOrder: number;
}

export enum CommunityPermissions {
    None = 0,
    ViewChannels = 1 << 0,
    SendMessages = 1 << 1,
    ManageMessages = 1 << 2,
    ManageChannels = 1 << 3,
    ManageRoles = 1 << 4,
    MentionEveryone = 1 << 5,
    KickMembers = 1 << 6,
    BanMembers = 1 << 7,
    Administrator = 1 << 8,
    Connect = 1 << 9
}

export interface Reaction {
    userId: number;
    emoji: string;
    messageId?: number;
    postId?: number;
}

export interface Message {
    id: number;
    channelId: number;
    userId: number;
    content: string;
    createdAt: string;
    updatedAt?: string;
    isDeleted?: boolean;
    username?: string;
    nickname?: string;
    avatarUrl?: string;
    roleColor?: string;
    user?: {
        id: number;
        username: string;
        nickname?: string;
        avatarUrl?: string;
        accessLevel?: number;
    };
    embeds?: EmbedData[];
    isSending?: boolean;
    isError?: boolean;
    postId?: number;
    replyTo?: Message;
    reactions?: Reaction[];
}

export interface Post {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    lastActivityAt: string;
    author: {
        id: number;
        username: string;
        nickname?: string;
        avatarUrl?: string;
        accessLevel: number;
        roleColor?: string;
    };
    messageCount: number;
    attachmentUrls: string[];
    isUnread: boolean;
    lastReadAt: string;
    reactions: Reaction[];
}

export interface Member {
    id: number;
    username: string;
    nickname?: string;
    avatarUrl?: string;
    preferredStatus: number; // 0=Online, 1=Idle, 2=DND, 3=Offline
    accessLevel: number;
    roles: number[];
    roleColor?: string;
}
