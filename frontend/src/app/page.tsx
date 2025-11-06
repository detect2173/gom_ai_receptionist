"use client";

import { useEffect, useState } from 'react';

export default function Home() {
    const [message, setMessage] = useState('Loading...');

    useEffect(() => {
        fetch('http://127.0.0.1:8000/')
            .then((res) => res.json())
            .then((data) => setMessage(data.message))
            .catch(() => setMessage('Error connecting to backend'));
    }, []);

    return (
        <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
            <h1>🤖 GOM AI Receptionist</h1>
            <p>Backend says: {message}</p>
        </main>
    );
}
