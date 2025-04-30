import { NextResponse } from 'next/server';
export declare function GET(): Promise<NextResponse<{
    message: string;
    data: any;
}> | NextResponse<{
    error: string;
}>>;
