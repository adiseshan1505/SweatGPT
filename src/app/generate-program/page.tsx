"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

async function sendMessage(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return result.response.text();
}

const GenerateProgramPage = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState("");
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const { user } = useUser();

  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { content: input, role: "user", userId: user?.id };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const aiReply = await sendMessage(input);
    const aiMessage = { content: aiReply, role: "assistant" };
    setMessages((prev) => [...prev, aiMessage]);
    setCurrentPlan(aiReply);
    setShowFeedbackPrompt(true);
  };

  const handleYes = async () => {
  try {
    await fetch("/api/save-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user?.id, plan: currentPlan }),
    });
    alert("Plan saved to your profile!");
  } catch (error) {
    console.error(error); 
    alert("Failed to save plan.");
  }
  setShowFeedbackPrompt(false);
};


  const handleNo = () => {
    setShowFeedbackPrompt(false);
  };

  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden pb-6 pt-24">
      <div className="container mx-auto px-4 h-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono">
            <span>Generate Your </span>
            <span className="text-primary uppercase">Fitness Program</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Chat with our AI assistant, Arnold.AI to create your personalized plan
          </p>
        </div>

        <Card className="bg-card/90 backdrop-blur-sm border border-border overflow-hidden relative mb-6 p-6">
          <div className="space-y-4" ref={messageContainerRef}>
            {messages.map((msg, index) => (
              <div key={index} className="message-item animate-fadeIn">
                <div className="font-semibold text-xs text-muted-foreground mb-1">
                  {msg.role === "assistant" ? " SweatGPT.AI" : "You"}:
                </div>
                <p className="text-foreground whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
          {showFeedbackPrompt && (
            <div className="mt-4 flex gap-3">
              <Button onClick={handleYes} className="bg-green-600 text-white">Yes, Save Plan</Button>
              <Button variant="outline" onClick={handleNo}>No, I want changes</Button>
            </div>
          )}
        </Card>

        <div className="flex gap-2">
          <input
            className="flex-1 border p-2 rounded bg-background text-foreground"
            placeholder="Ask something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend}>Send</Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateProgramPage;