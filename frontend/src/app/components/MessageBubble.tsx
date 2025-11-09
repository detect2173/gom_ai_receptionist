export default function MessageBubble({ sender, text }: { sender: string; text: string }) {
    const isUser = sender === "user";
    return (
        <div
            className={`flex ${isUser ? "justify-end" : "justify-start"} my-2`}
        >
            <div
                className={`px-3 py-2 rounded-lg max-w-[80%] ${
                    isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
                }`}
            >
                {text}
            </div>
        </div>
    );
}
