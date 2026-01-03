import api from "./api";

export interface GameServerSettings {
    // MySQL Settings
    host: string;
    port: number;
    username: string;
    password?: string;
    authDatabase: string;
    charactersDatabase: string;

    // SOAP Settings
    soapHost: string;
    soapPort: number;
    soapUsername: string;
    soapPassword?: string;

    // SSH Settings
    sshHost: string;
    sshPort: number;
    sshUsername: string;
    sshPassword?: string;
    worldServiceName: string;
    authServiceName: string;
}

export const getGameServerSettings = async (): Promise<GameServerSettings> => {
    const response = await api.get<GameServerSettings>("/settings/game");
    return response.data;
};

export const updateGameServerSettings = async (settings: GameServerSettings): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>("/settings/game", settings);
    return response.data;
};
