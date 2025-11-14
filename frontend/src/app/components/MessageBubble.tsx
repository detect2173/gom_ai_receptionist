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

    // 🧠 Smart, order-aware formatter
    async function formatMessage(raw: string): Promise<string> {
        let s = raw;
        const linkStyle =
            'style="color:#38BDF8;text-decoration:underline;font-weight:600"';

        // Replace longer, more specific terms first
        const replacements: [RegExp, string][] = [
            [
                /\bBook (?:a )?(?:30 ?-?minute|30 ?min|thirty ?minute) call\b/gi,
                `<a href="https://calendly.com/greatowlmarketing/30min" target="_blank" rel="noopener noreferrer" ${linkStyle}>Book a 30-Minute Call</a>`,
            ],
            [
                /\bMeet Hootbot\b/gi,
                `<a href="https://m.me/593357600524046" target="_blank" rel="noopener noreferrer" ${linkStyle}>Meet Hootbot</a>`,
            ],
            [
                /\bHootbot\b/gi,
                `<a href="https://m.me/593357600524046" target="_blank" rel="noopener noreferrer" ${linkStyle}>Hootbot</a>`,
            ],
            [
                /\bPay Now\b/gi,
                `<a href="https://buy.stripe.com/fZ6oH2nU2j83PreF00x200" target="_blank" rel="noopener noreferrer" ${linkStyle}>Pay Now</a>`,
            ],
            [
                /\bGreat Owl Marketing\b/gi,
                `<a href="https://greatowlmarketing.com" target="_blank" rel="noopener noreferrer" ${linkStyle}>Great Owl Marketing</a>`,
            ],
        ];

        // Apply replacements sequentially
        for (const [regex, replacement] of replacements) {
            s = s.replace(regex, replacement);
        }

        const html = await marked.parse(s);
        return DOMPurify.sanitize(html);
    }

    useEffect(() => {
        (async () => {
            const formatted = await formatMessage(text);
            setDisplayHTML(formatted);
        })();
    }, [text]);

    const bubbleStyle: React.CSSProperties = isAI
        ? {
            background:
                'linear-gradient(180deg, rgba(14,165,233,1) 0%, rgba(37,99,235,1) 100%)',
            color: '#fff',
            borderRadius: 18,
            padding: '12px 16px',
            boxShadow: '0 0 16px rgba(59,130,246,0.35)',
        }
        : {
            background: '#1f2937',
            color: '#fff',
            borderRadius: 18,
            padding: '12px 16px',
            boxShadow: '0 0 10px rgba(0,0,0,0.25)',
        };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`my-2 flex ${isAI ? 'justify-start' : 'justify-end'}`}
        >
            <div
                className="max-w-[80%] text-sm leading-relaxed rounded-2xl"
                style={bubbleStyle}
                dangerouslySetInnerHTML={{ __html: displayHTML }}
            />
        </motion.div>
    );
}
