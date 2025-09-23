"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import ProblemStatementSelector from "../../components/problem-statement-selector";
import { GoogleSignInButton } from "../../components/auth-buttons";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProblemSelectionPage() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    data: teamStatus,
    mutate: mutateTeam,
    isLoading: loadingTeam,
    error: teamError,
  } = useSWR(session?.user?.email ? "/api/team/status" : null, fetcher);

  const [selectedProblemStatement, setSelectedProblemStatement] =
    useState<string>("");

  useEffect(() => {
    if (teamStatus?.team?.problemStatement) {
      setSelectedProblemStatement(teamStatus.team.problemStatement);
    }
  }, [teamStatus]);

  const handleProblemStatementChange = (key: string, value: string) => {
    setSelectedProblemStatement(value);
  };

  const handleSave = async () => {
    if (!selectedProblemStatement) {
      setError("Please select a problem statement");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/team/problem-statement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problemStatementId: selectedProblemStatement,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to save problem statement");
        return;
      }

      setSuccess("Problem statement saved successfully! 🎉");
      await mutateTeam();
    } catch (error) {
      setError("Failed to save problem statement. Please try again.");
      console.error("Error saving problem statement:", error);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="glass-effect rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="glass-effect rounded-2xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-primary mb-4">
            Problem Statement Selection
          </h1>
          <p className="text-gray-700 mb-6">
            Please sign in to select your team's problem statement for SIH 2025.
          </p>
          <GoogleSignInButton />
        </div>
      </div>
    );
  }

  if (loadingTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="glass-effect rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Loading team information...</p>
        </div>
      </div>
    );
  }

  if (teamError || !teamStatus?.team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="glass-effect rounded-2xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-primary mb-4">
            No Team Found
          </h1>
          <p className="text-gray-700 mb-6">
            You need to be part of a team to select a problem statement. Please
            complete your registration and join or create a team first.
          </p>
          <a href="/" className="btn-primary inline-flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go to Registration
          </a>
        </div>
      </div>
    );
  }

  const isTeamLeader = teamStatus.team.leaderUserId === session.user?.email;
  const teamMembers = teamStatus.members || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="glass-effect rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient mb-2">
                Problem Statement Selection
              </h1>
              <p className="text-gray-700">
                Choose the problem statement your team wants to work on for SIH
                2025
              </p>
            </div>
            <a href="/" className="btn-secondary flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Registration
            </a>
          </div>

          {/* Team Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-primary">
                  Team: {teamStatus.team.name}
                </h3>
                <p className="text-blue-600 text-sm">
                  {teamMembers.length}/6 members •{" "}
                  {isTeamLeader ? "Team Leader" : "Member"}
                </p>
              </div>
            </div>

            {!isTeamLeader && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 text-sm">
                  ⚠️ Only the team leader can select or change the problem
                  statement. Please coordinate with your team leader.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Problem Statement Selection */}
        <div className="glass-effect rounded-2xl p-6 border border-white/20">
          {/* Success/Error Messages */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <p className="text-red-800 font-medium text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium ml-auto"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-green-800 font-medium text-sm">{success}</p>
                <button
                  onClick={() => setSuccess(null)}
                  className="text-green-500 hover:text-green-700 text-sm font-medium ml-auto"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Problem Statement Selector */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                Select Problem Statement
              </h3>
              <p className="text-gray-700 text-sm mb-4">
                Choose a problem statement that aligns with your team's skills
                and interests. This selection will be used for your SIH 2025
                submission.
              </p>
            </div>

            <ProblemStatementSelector
              field={{
                key: "problemStatement",
                label: "Problem Statement",
                type: "problem-selector",
                required: true,
              }}
              value={selectedProblemStatement}
              onChange={handleProblemStatementChange}
            />

            {/* Save Button */}
            {isTeamLeader && (
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving || !selectedProblemStatement}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save Problem Statement
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="glass-effect rounded-2xl p-6 mt-8 border border-white/20">
          <h3 className="text-lg font-semibold text-primary mb-4">
            Additional Resources
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <a
              href="https://sih.gov.in/sih2025PS"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800">
                  Official SIH 2025 Problem Statements
                </h4>
                <p className="text-blue-600 text-sm">
                  View complete list on SIH website
                </p>
              </div>
            </a>

            <a
              href="https://chat.whatsapp.com/Hb81DgrYqn8ApptdhZb3sv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2a10 10 0 00-8.94 14.5L2 22l5.7-1.99A10 10 0 1012 2zm0 2a8 8 0 110 16 7.96 7.96 0 01-3.65-.88l-.26-.14-3.38 1.18 1.16-3.3-.17-.28A8 8 0 0112 4zm4.24 9.71c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.18-.7-.62-1.18-1.38-1.32-1.62-.14-.24-.02-.36.1-.48.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.42-.54-.42-.14 0-.3 0-.46 0-.16 0-.42.06-.64.3-.22.24-.86.84-.86 2.04 0 1.2.88 2.36 1 2.52.12.16 1.72 2.62 4.16 3.68.58.26 1.04.42 1.4.54.58.18 1.1.16 1.52.1.46-.06 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-green-800">
                  WhatsApp Community
                </h4>
                <p className="text-green-600 text-sm">
                  Join for updates and discussions
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
