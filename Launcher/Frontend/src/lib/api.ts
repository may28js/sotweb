import axios from 'axios';

// Default to localhost for dev, but can be overridden by config.json
export let BASE_URL = import.meta.env.PROD ? 'https://shiguanggushi.xyz/api' : '/api'; 
// Default to /community-api in DEV to ensure it hits the correct Nginx proxy
export let COMMUNITY_BASE_URL = import.meta.env.PROD ? 'https://shiguanggushi.xyz/community-api' : '/community-api'; 

export const getAvatarUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    
    // Normalize slashes for consistency
    url = url.replace(/\\/g, '/');

    // In DEV mode, we are connected to the Remote DB which stores paths to files on the Remote Server.
    // However, our Local Backend doesn't have these files. 
    // So we must point to the Production Server for these static assets.
    if (import.meta.env.DEV) {
        return url.startsWith('/') ? `https://shiguanggushi.xyz${url}` : `https://shiguanggushi.xyz/${url}`;
    }
    
    // Use the current BASE_URL's origin or host (usually Website host for avatars)
    let host = '';
    if (BASE_URL.startsWith('http')) {
        try {
            const urlObj = new URL(BASE_URL);
            host = urlObj.origin;
        } catch (e) {
            host = '';
        }
    } else {
        host = ''; 
    }

    if (url.startsWith('/')) {
        return `${host}${url}`;
    }
    return `${host}/${url}`;
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loadAppConfig = async () => {
    try {
        const response = await fetch('/config.json');
        if (response.ok) {
            const config = await response.json();
            
            // Website API (News, Login, etc.)
            if (config.apiBaseUrl) {
                // In DEV, use proxy to avoid CORS and allow cookies/headers
                if (import.meta.env.DEV) {
                    BASE_URL = '/api';
                    api.defaults.baseURL = BASE_URL;
                } else {
                    BASE_URL = config.apiBaseUrl;
                    api.defaults.baseURL = BASE_URL;
                }
                console.log("Loaded API Base URL:", BASE_URL);
            }
            
            // Community API (Chat, Posts, etc.)
            // If communityApiBaseUrl is provided, use it. Otherwise fallback to apiBaseUrl
            if (config.communityApiBaseUrl) {
                // In DEV, use proxy to avoid CORS and allow cookies/headers
                if (import.meta.env.DEV) {
                    COMMUNITY_BASE_URL = '/community-api';
                } else {
                    COMMUNITY_BASE_URL = config.communityApiBaseUrl;
                }
                console.log("Loaded Community API Base URL:", COMMUNITY_BASE_URL);
            } else {
                COMMUNITY_BASE_URL = BASE_URL;
            }
        }
    } catch (error) {
        console.warn("Failed to load config.json, using default:", BASE_URL);
    }
};

// Interceptor to add token if available (though Launcher might handle auth differently via WebView2 bridge)
// For now, let's assume we store token in localStorage for the frontend part
api.interceptors.request.use((config) => {
    // If request URL starts with /Community or /Friends or /DirectMessages, use COMMUNITY_BASE_URL
    // But api instance already has a baseURL. We need to override it if needed.
    // Note: axios merges baseURL and url. If url is absolute, baseURL is ignored.
    
    if (config.url && (
        config.url.startsWith('/Community') || 
        config.url.startsWith('/Friends') || 
        config.url.startsWith('/DirectMessages') ||
        config.url.includes('/hubs/') // SignalR negotiation usually handled by HubConnectionBuilder, but just in case
    )) {
        // If COMMUNITY_BASE_URL is different from BASE_URL, we need to prepend it and remove leading slash
        // However, axios config.baseURL is already set to BASE_URL.
        // We can override baseURL for this request.
        config.baseURL = COMMUNITY_BASE_URL;
    }

    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
