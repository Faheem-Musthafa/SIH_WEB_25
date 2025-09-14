"use client";

import { useState } from "react";

export default function BroadcastForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const form = e.currentTarget;
    const subject = (form.elements.namedItem("subject") as HTMLInputElement)
      .value;
    const messageText = (
      form.elements.namedItem("message") as HTMLTextAreaElement
    ).value;

    if (!subject.trim() || !messageText.trim()) {
      setMessage({
        type: "error",
        text: "Please fill in both subject and message fields.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/dashboard/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message: messageText }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text:
            result.message ||
            `Broadcast sent successfully to ${result.count} participants!`,
        });
        form.reset();
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to send broadcast. Please try again.",
        });

        if (result.suggestion) {
          setMessage((prev) => ({
            ...prev!,
            text: `${prev!.text} ${result.suggestion}`,
          }));
        }
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`p-4 rounded-md border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === "success" ? (
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input
          type="text"
          name="subject"
          placeholder="Email Subject"
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
          disabled={isLoading}
        />
        <textarea
          name="message"
          placeholder="Email Message"
          className="min-h-28 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-white font-medium transition-colors ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          }`}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Sending...
            </>
          ) : (
            <>📧 Send Email Broadcast</>
          )}
        </button>
      </form>
    </div>
  );
}
