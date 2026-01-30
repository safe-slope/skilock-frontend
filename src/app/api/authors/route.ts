import { NextResponse } from 'next/server';

export async function GET() {
    const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
    const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

    if (!STRAPI_URL || !STRAPI_TOKEN) {
        console.error('Missing Strapi environment variables');
        return NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 }
        );
    }

    try {
        const response = await fetch(
            `${STRAPI_URL}/api/authors?sort=name:asc&pagination[pageSize]=100`,
            {
                headers: {
                    Authorization: `Bearer ${STRAPI_TOKEN}`,
                },
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            console.error('Strapi response not OK:', response.status);
            return NextResponse.json(
                { error: 'Failed to fetch authors' },
                { status: 502 }
            );
        }

        const data = await response.json();

        if (!Array.isArray(data?.data)) {
            console.error('Unexpected Strapi response:', data);
            return NextResponse.json(
                { error: 'Invalid data format' },
                { status: 500 }
            );
        }

        const authors = data.data.map((author: any) => ({
            id: author.id,
            name: author.name,
            email: author.email,
        }));

        return NextResponse.json(authors);
    } catch (err) {
        console.error('Unhandled error fetching authors:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
