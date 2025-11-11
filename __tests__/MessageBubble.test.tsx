/**
 * @fileoverview Tests for MessageBubble component
 * Verifies branded links render correctly and sanitize HTML safely.
 */

import React from "react";
import {render, screen} from "@testing-library/react";
import "@testing-library/jest-dom";
import MessageBubble from "@/app/components/MessageBubble";


describe("MessageBubble", () => {
    const baseText = `
    Welcome to Great Owl Marketing!  
    You can Meet Hootbot, Pay Now, or Book a 30 minute call anytime.
  `;

    it("renders Great Owl Marketing link", async () => {
        render(<MessageBubble text={baseText} isAI/>);
        const link = await screen.findByRole("link", {name: /Great Owl Marketing/i});
        expect(link).toHaveAttribute("href", "https://greatowlmarketing.com");
    });

    it("renders Meet Hootbot link", async () => {
        render(<MessageBubble text={baseText} isAI/>);
        const link = await screen.findByRole("link", {name: /Meet Hootbot/i});
        expect(link).toHaveAttribute("href", "https://m.me/593357600524046");
    });

    it("renders Pay Now link", async () => {
        render(<MessageBubble text={baseText} isAI/>);
        const link = await screen.findByRole("link", {name: /Pay Now/i});
        expect(link).toHaveAttribute("href", "https://buy.stripe.com/fZu6oH2nU2j83PreF00x200");
    });

    it("renders Book a 30 minute call link", async () => {
        render(<MessageBubble text={baseText} isAI/>);
        const link = await screen.findByRole("link", {name: /Book a 30 minute call/i});
        expect(link).toHaveAttribute("href", "https://calendly.com/phineasjholdings-info/30min");
    });

    it("sanitizes HTML content", async () => {
        const unsafe = `Click <script>alert('xss')</script> here.`;
        render(<MessageBubble text={unsafe} isAI/>);
        expect(screen.getByText(/Click/)).toBeInTheDocument();
        // Ensure the script tag is sanitized out
        expect(document.querySelector("script")).toBeNull();
    });
});
