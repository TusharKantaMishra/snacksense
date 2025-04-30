import { NextRequest, NextResponse } from 'next/server';
interface IngredientData {
    name: string;
    scientificName?: string;
    quantity?: string;
    percentage?: string;
    type?: string;
}
export declare function POST(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    productName: string | null;
    servingSize: string | null;
    ingredients: IngredientData[];
    additionalInfo: Record<string, string>;
    format: string;
}>>;
export {};
