import api from "./api";

export interface DashboardUserDto {
    id: number;
    username: string;
    email: string;
    createdAt: string;
}

export interface DashboardStats {
    totalUsers: number;
    totalNews: number;
    totalComments: number;
    totalOrders: number;
    recentUsers: DashboardUserDto[];
}

export interface ServerStatus {
    status: string;
    cpuUsage: number;
    memoryUsage: number;
    onlinePlayers: number;
    maxPlayers: number;
    uptime: string;
}

export interface OnlineHistory {
    time: string;
    players: number | null;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>("/dashboard/stats");
    return response.data;
};

export const getServerStatus = async (): Promise<ServerStatus> => {
    const response = await api.get<ServerStatus>("/dashboard/server/status");
    return response.data;
};

export const getOnlineHistory = async (period: string = '24h'): Promise<OnlineHistory[]> => {
    const response = await api.get<OnlineHistory[]>(`/dashboard/server/history?period=${period}`);
    return response.data;
};

export const controlServer = async (action: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>("/dashboard/server/control", { action });
    return response.data;
};
