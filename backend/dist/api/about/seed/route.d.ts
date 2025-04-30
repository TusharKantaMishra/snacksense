import { NextResponse } from 'next/server';
export declare function GET(): Promise<NextResponse<{
    message: string;
    count: any;
}> | NextResponse<{
    error: string;
    details: string;
    stack: string | undefined;
}>>;
