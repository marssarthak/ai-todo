"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Bot,
  X,
  Maximize2,
  Minimize2,
  Send,
  User,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Suggestions for common questions
const SUGGESTIONS = [
  { id: 1, text: "How can I prioritize my tasks?" },
  { id: 2, text: "Give me a productivity tip" },
  { id: 3, text: "How do I maintain focus?" },
  { id: 4, text: "Time management advice?" },
  { id: 5, text: "Help me organize my day" },
];

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [userStreakCount, setUserStreakCount] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Use Vercel AI SDK's useChat hook with error handling
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
    reload,
  } = useChat({
    api: "/api/chat/assistant",
    onError: (err) => {
      console.error("Chat error details:", {
        message: err.message,
        name: err.name,
        cause: err.cause,
        // Use any to access status property that might be present
        status: (err as any).status,
      });
      setError(
        "Sorry, there was an error connecting to the assistant. Please try again."
      );
    },
    onResponse: (response) => {
      // Log response details for debugging
      if (!response.ok) {
        console.error("Response not OK:", {
          status: response.status,
          statusText: response.statusText,
        });
      }
      // No return needed - just logging for debugging
    },
  });

  // Debug logs
  useEffect(() => {
    if (messages.length > 0) {
      console.log("Latest message:", messages[messages.length - 1]);
    }
  }, [messages]);

  // Clear error when chat opens/closes
  useEffect(() => {
    setError(null);
  }, [open]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input field when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const toggleChat = () => {
    setOpen(!open);
    // Reset expanded state when closing
    if (open) setExpanded(false);
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      const form = document.getElementById("chat-form") as HTMLFormElement;
      form?.requestSubmit();
    }, 100);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    setError(null);
    handleSubmit(e);
  };

  const handleRetry = () => {
    setError(null);
    reload();
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={toggleChat}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg flex items-center justify-center bg-primary hover:bg-primary/90",
            open && "bg-destructive hover:bg-destructive/90"
          )}
        >
          {open ? (
            <X className="h-6 w-6" />
          ) : (
            <div className="relative">
              <Bot className="h-6 w-6" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-amber-500" />
            </div>
          )}
          <span className="sr-only">{open ? "Close" : "Open"} Assistant</span>
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed z-40 right-4 bottom-20"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ ease: "easeOut", duration: 0.2 }}
          >
            <Card
              className={cn(
                "w-[350px] shadow-xl border-primary/10 bg-card overflow-hidden",
                expanded && "sm:w-[600px] sm:h-[650px]"
              )}
            >
              {/* Header */}
              <CardHeader className="bg-primary/5 p-3 pb-3 flex flex-row justify-between items-center space-y-0 border-b">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Bot className="h-6 w-6 text-primary" />
                    <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-1.5">
                      Productivity Assistant
                      <Badge
                        variant="outline"
                        className="h-5 text-xs bg-primary/10 hover:bg-primary/20 text-primary border-none flex gap-1 items-center"
                      >
                        <Zap className="h-3 w-3" />
                        <span>AI</span>
                      </Badge>
                    </CardTitle>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={toggleExpanded}
                  >
                    {expanded ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {expanded ? "Minimize" : "Maximize"}
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={toggleChat}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea
                className={cn("px-3", expanded ? "h-[490px]" : "h-[300px]")}
              >
                <CardContent className="pt-4">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 mb-4 text-sm">
                      {error}
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs flex-1 border-destructive/30 hover:bg-destructive/20"
                          onClick={() => setError(null)}
                        >
                          Dismiss
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={handleRetry}
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="flex flex-col gap-4 items-center justify-center h-full py-12">
                      <div className="relative h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-6 w-6 text-primary" />
                        <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-amber-500" />
                      </div>
                      <div className="text-center space-y-1.5">
                        <h3 className="text-base font-medium">AI Assistant</h3>
                        <p className="text-sm text-muted-foreground">
                          Ask me anything about productivity, task management,
                          or time management!
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center max-w-xs mt-2">
                        {SUGGESTIONS.map((suggestion) => (
                          <Button
                            key={suggestion.id}
                            variant="outline"
                            size="sm"
                            className="h-auto py-1.5 px-2.5 text-xs border-primary/20 bg-primary/5"
                            onClick={() =>
                              handleSuggestionClick(suggestion.text)
                            }
                          >
                            {suggestion.text}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex gap-2 mt-4",
                            message.role === "user" && "justify-end"
                          )}
                        >
                          {message.role !== "user" && (
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="relative h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                          )}
                          <div
                            className={cn(
                              "rounded-lg py-2 px-3 max-w-[85%] text-sm",
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            {message.content}
                          </div>
                          {message.role === "user" && (
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="relative h-8 w-8 rounded-full bg-primary/80 flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-2 mt-4">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="relative h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                          <div className="rounded-lg py-2 px-3 bg-muted max-w-[85%]">
                            <motion.div
                              className="flex items-center space-x-1"
                              initial={{ opacity: 0.5 }}
                              animate={{ opacity: 1 }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "easeInOut",
                              }}
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-foreground/50"></div>
                              <div className="h-1.5 w-1.5 rounded-full bg-foreground/50"></div>
                              <div className="h-1.5 w-1.5 rounded-full bg-foreground/50"></div>
                            </motion.div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </CardContent>
              </ScrollArea>

              {/* Input */}
              <CardFooter className="pt-2 pb-3 px-3 border-t bg-card">
                <form
                  id="chat-form"
                  onSubmit={handleFormSubmit}
                  className="flex gap-2 w-full"
                >
                  <Textarea
                    ref={inputRef}
                    className={cn(
                      "min-h-10 max-h-32 resize-none pl-3 pr-12 py-2.5 text-sm rounded-lg flex-1",
                      expanded && "w-full"
                    )}
                    placeholder="Type your message..."
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleFormSubmit(e);
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-full flex-shrink-0"
                    disabled={isLoading || !input.trim()}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                </form>
              </CardFooter>

              {/* Streak Badge */}
              {/* {userStreakCount > 0 && (
                <div className="absolute top-12 right-0">
                  <Badge className="bg-amber-500 text-white hover:bg-amber-600 mr-3">
                    <Flame className="h-3.5 w-3.5 mr-1" /> {userStreakCount} day
                    streak!
                  </Badge>
                </div>
              )} */}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Flame icon component
function Flame(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
