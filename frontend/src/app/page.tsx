'use client';

import ChatBox from './components/ChatBox';

export default function HomePage() {
    return (
        <main
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f7f7f7',
                fontFamily: 'system-ui, sans-serif',
            }}
        >
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                🤖 GOM AI Receptionist
            </h1>
            <ChatBox />
        </main>
    );
}
