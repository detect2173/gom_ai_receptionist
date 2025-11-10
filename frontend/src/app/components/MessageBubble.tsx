'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

interface MessageBubbleProps {
    text: string;
    isAI?: boolean;
}

export default function MessageBubble({ text, isAI = false }: MessageBubbleProps) {
    const [displayHTML, setDisplayHTML] = useState<string>('');

    useEffect(() => {
        setDisplayHTML(formatMessage(text));
    }, [text]);

    /** Formats message text, converts to HTML, and styles known links */
    function formatMessage(raw: string): string {
        let s = raw;

        // Style used for ALL links in bubbles (inline so it can’t be purged/overridden)
        const linkStyle =
            'style="color:#3B82F6;text-decoration:underline;font-weight:600"';

        // Friendly aliases to your canonical links
        s = s.replace(
            /\bGreat Owl Marketing\b/gi,
            `<a href="https://greatowlmarketing.com" target="_blank" rel="noopener noreferrer" ${linkStyle}>Great Owl Marketing</a>`
        );

        s = s.replace(
            /\bHootbot\b/gi,
            `<a href="https://m.me/593357600524046" target="_blank" rel="noopener noreferrer" ${linkStyle}>Meet Hootbot</a>`
        );

        s = s.replace(
            /\bbook (?:a )?(?:30 ?-?minute|30 ?min|thirty ?minute) call\b/gi,
            `<a href="https://calendly.com/greatowlmarketing/30min" target="_blank" rel="noopener noreferrer" ${linkStyle}>Book a 30-Minute Call</a>`
        );

        s = s.replace(
            /\bPay Now\b/gi,
            `<a href="https://buy.stripe.com/fZ6oH2nU2j83PreF00x200" target="_blank" rel="noopener noreferrer" ${linkStyle}>Pay Now</a>`
        );

        const html = marked.parse(s);
        return DOMPurify.sanitize(html);
    }

    // Hard fallback background (so you SEE a bubble even if CSS classes are stripped)
    const bubbleStyle: React.CSSProperties = isAI
        ? {
            background:
                'linear-gradient(180deg, rgba(59,130,246,1) 0%, rgba(6,182,212,1) 100%)', // sky-500 -> cyan-500
            color: '#fff',
            borderRadius: 16,
            padding: '12px 16px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.25)',
        }
        : {
            background: '#111827', // neutral-900
            color: '#fff',
            borderRadius: 16,
            padding: '12px 16px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.25)',
        };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`my-2 flex ${isAI ? 'justify-start' : 'justify-end'}`}
        >
            {/* Tailwind classes for when Tailwind is active; inline style guarantees fallback */}
            <div
                className={`max-w-[80%] text-sm leading-relaxed ${
                    isAI ? 'rounded-2xl' : 'rounded-2xl'
                }`}
                style={bubbleStyle}
                dangerouslySetInnerHTML={{ __html: displayHTML }}
            />
        </motion.div>
    );
}
