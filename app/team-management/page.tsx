"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface JoinRequest {
  _id: string;
  teamId: string;
  teamName: string;
  userEmail: string;
  userName: string;
  userDetails: {
    department?: string;
    year?: string;
    phone?: string;
    skills?: string[];
  };
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface Team {
  _id: string;
  name: string;
  inviteCode: string;
  leaderUserId: string;
  memberUserIds: string[];
  description?: string;
  skillsNeeded?: string[];
  problemStatement?: string;
}

export default function TeamManagementPage() {
  const { data: session, status } = useSession();
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetchTeamData();
      fetchJoinRequests();
    }
  }, [status, session]);

  const fetchTeamData = async () => {
    try {
      const response = await fetch("/api/team/status");
      if (response.ok) {
        const data = await response.json();
        if (data.team) {
          setUserTeam(data.team);
        }
      }
    } catch (error) {
      console.error("Error fetching team data:", error);
    }
  };

  const fetchJoinRequests = async () => {
    try {
      const response = await fetch("/api/team/join-requests");
      if (response.ok) {
        const data = await response.json();
        setJoinRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching join requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (
    requestId: string,
    action: "accept" | "reject"
  ) => {
    setProcessingRequest(requestId);
    try {
      const response = await fetch("/api/team/manage-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        // Refresh the requests and team data
        await Promise.all([fetchJoinRequests(), fetchTeamData()]);
      } else {
        alert(data.error || "Failed to process request");
      }
    } catch (error) {
      console.error("Error processing request:", error);
      alert("An error occurred while processing the request");
    } finally {
      setProcessingRequest(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-6 shadow-lg"></div>
            <p className="text-secondary text-lg font-medium">
              Loading your team management...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="glass-effect p-12 rounded-3xl text-center max-w-md mx-4 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
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
              Authentication Required
            </h1>
            <p className="text-secondary mb-8">
              Please sign in to manage your team and handle join requests.
            </p>
            <Link href="/" className="btn-primary w-full">
              Go to Registration
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!userTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="glass-effect p-12 rounded-3xl text-center max-w-md mx-4 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary mb-4">
              No Team Found
            </h1>
            <p className="text-secondary mb-8">
              You are not currently leading a team. Create or join a team to
              access management features.
            </p>
            <Link href="/" className="btn-primary w-full">
              Go to Registration
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">
                Team Management
              </h1>
              <p className="text-secondary text-lg">
                Manage your team and handle join requests
              </p>
            </div>
            <Link href="/" className="btn-secondary">
              <svg
                className="w-4 h-4 mr-2"
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
            </Link>
          </div>
        </div>

        {/* Team Info Card */}
        <div className="glass-effect rounded-3xl shadow-2xl mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-8 py-6 border-b border-white/20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
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
              <h2 className="text-2xl font-semibold text-primary">
                Your Team: {userTeam.name}
              </h2>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group">
                <dt className="text-sm font-medium text-secondary mb-2 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  Team Name
                </dt>
                <dd className="text-lg font-semibold text-primary group-hover:text-blue-600 transition-colors">
                  {userTeam.name}
                </dd>
              </div>
              <div className="group">
                <dt className="text-sm font-medium text-secondary mb-2 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  Invite Code
                </dt>
                <dd className="text-lg font-mono bg-gradient-to-r from-green-100 to-blue-100 px-4 py-2 rounded-xl font-semibold text-primary border border-green-200/50 group-hover:shadow-md transition-all cursor-pointer select-all">
                  {userTeam.inviteCode}
                </dd>
              </div>
              <div className="group">
                <dt className="text-sm font-medium text-secondary mb-2 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  Members
                </dt>
                <dd className="text-lg font-semibold text-primary group-hover:text-purple-600 transition-colors">
                  <span className="text-2xl">
                    {userTeam.memberUserIds?.length || 0}
                  </span>
                  <span className="text-secondary ml-1">/6 members</span>
                </dd>
              </div>
            </div>

            {/* Problem Statement Section */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-primary">
                    Problem Statement
                  </h3>
                </div>
                <Link
                  href="/problem-selection"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {userTeam.problemStatement
                    ? "Change Problem Statement"
                    : "Select Problem Statement"}
                </Link>
              </div>

              {userTeam.problemStatement ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-white"
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
                    <div>
                      <p className="text-green-800 font-semibold">
                        Problem Statement Selected
                      </p>
                      <p className="text-green-600 text-sm font-mono">
                        {userTeam.problemStatement}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-white"
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
                    <div>
                      <p className="text-amber-800 font-semibold">
                        No Problem Statement Selected
                      </p>
                      <p className="text-amber-600 text-sm">
                        Choose a problem statement for your team to work on
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Join Requests Section */}
        <div className="glass-effect rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500/10 to-red-500/10 px-8 py-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-primary">
                  Join Requests
                </h2>
              </div>
              <div className="bg-gradient-to-r from-amber-100 to-red-100 px-4 py-2 rounded-full">
                <span className="text-amber-700 font-semibold">
                  {joinRequests.length} pending
                </span>
              </div>
            </div>
          </div>
          <div className="p-8">
            {joinRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg
                    className="w-10 h-10 text-blue-500"
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
                <h3 className="text-xl font-medium text-primary mb-3">
                  No Join Requests
                </h3>
                <p className="text-secondary text-lg max-w-md mx-auto">
                  You don't have any pending join requests at the moment. Share
                  your invite code to get team members!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {joinRequests.map((request) => (
                  <div
                    key={request._id}
                    className="glass-effect rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border border-white/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                            <span className="text-white font-semibold text-lg">
                              {request.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-primary">
                              {request.userName}
                            </h3>
                            <p className="text-secondary">
                              {request.userEmail}
                            </p>
                          </div>
                          <span className="ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 border border-amber-200">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Pending
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          {request.userDetails.department && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-100">
                              <dt className="text-xs font-medium text-blue-600 mb-1">
                                Department
                              </dt>
                              <dd className="text-sm font-semibold text-blue-900">
                                {request.userDetails.department}
                              </dd>
                            </div>
                          )}
                          {request.userDetails.year && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl border border-green-100">
                              <dt className="text-xs font-medium text-green-600 mb-1">
                                Year
                              </dt>
                              <dd className="text-sm font-semibold text-green-900">
                                {request.userDetails.year}
                              </dd>
                            </div>
                          )}
                          {request.userDetails.phone && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-xl border border-purple-100">
                              <dt className="text-xs font-medium text-purple-600 mb-1">
                                Phone
                              </dt>
                              <dd className="text-sm font-semibold text-purple-900">
                                {request.userDetails.phone}
                              </dd>
                            </div>
                          )}
                          {request.userDetails.skills &&
                            request.userDetails.skills.length > 0 && (
                              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-xl border border-amber-100">
                                <dt className="text-xs font-medium text-amber-600 mb-1">
                                  Skills
                                </dt>
                                <dd className="text-sm font-semibold text-amber-900">
                                  {request.userDetails.skills.join(", ")}
                                </dd>
                              </div>
                            )}
                        </div>

                        <div className="flex items-center text-xs text-secondary">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3a4 4 0 118 0v4m-4 8.5l-2.5-2.5M8 21l4-4 4 4M3 5h18M5 5v16a2 2 0 002 2h10a2 2 0 002-2V5"
                            />
                          </svg>
                          Requested on{" "}
                          {new Date(request.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-3 ml-6">
                        <button
                          onClick={() => handleRequest(request._id, "accept")}
                          disabled={processingRequest === request._id}
                          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          {processingRequest === request._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 mr-2"
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
                              Accept
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRequest(request._id, "reject")}
                          disabled={processingRequest === request._id}
                          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          {processingRequest === request._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-700 border-t-transparent"></div>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              Reject
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
