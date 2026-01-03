import api from './api';
import { Product, PurchaseResponse } from '../types/store';

export const getProducts = async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/store/products');
    return response.data;
};

export const purchaseProduct = async (productId: number, quantity: number = 1): Promise<PurchaseResponse> => {
    // Note: Backend requires characterName, but it's currently not passed. 
    // We should probably prompt for it or get it from context.
    // For now, extending for quantity.
    const response = await api.post<PurchaseResponse>(`/store/purchase/${productId}?quantity=${quantity}`);
    return response.data;
};