import React from 'react';
import type { Channel, User } from '../types';

interface SocialContextType {
    channels: Channel[];
    user: User | null;
}

export const SocialContext = React.createContext<SocialContextType>({
    channels: [],
    user: null
});

export const useSocialContext = () => React.useContext(SocialContext);
