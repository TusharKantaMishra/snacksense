import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
export declare function GET(): Promise<NextResponse<{
    id: string;
    title: string;
    subtitle: string;
    content: string;
    section: "mission" | "story" | "how-it-works";
    order: number;
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}[]>>;
export declare function POST(request: Request): Promise<NextResponse<any>>;
export declare function PUT(request: Request): Promise<NextResponse<any>>;
