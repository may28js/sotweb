export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    stock: number;
    category: string;
    gameItemId: number;
    isUnique?: boolean;
}

export interface PurchaseResponse {
    message: string;
    newBalance: number;
}