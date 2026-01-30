"use client";

import { useEffect, useState } from 'react';

interface Author {
    id: number;
    name: string;
    email: string;
}

export default function AuthorsList() {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/authors')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res.json();
            })
            .then((data: Author[]) => {
                if (!Array.isArray(data)) {
                    throw new Error('Invalid response format');
                }
                setAuthors(data);
            })
            .catch(err => {
                console.error('Failed to fetch authors:', err);
                setError('Failed to load authors');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) return <span>Loading authors...</span>;
    if (error) return <span>{error}</span>;
    if (authors.length === 0) return <span>No authors found.</span>;

    return (
        <span>
            Authors: {authors.map(a => a.name).join(', ')}
        </span>
    );
}
