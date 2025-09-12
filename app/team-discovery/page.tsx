"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

interface Team {
  _id: string;
  name: string;
  inviteCode: string;
  leaderUserId: string;
  memberUserIds: string[];
  memberCount?: number;
  availableSpots?: number;
  description?: string;
  skillsNeeded?: string[];
  problemStatement?: string;
  createdAt: string;
}

export default function TeamDiscoveryPage() {
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestedTeams, setRequestedTeams] = useState<Set<string>>(new Set());
  const [userHasTeam, setUserHasTeam] = useState(false);
  const [checkingTeamStatus, setCheckingTeamStatus] = useState(true);

  // Get all available skills for filter
  const allSkills = useMemo(() => {
    const skills = teams.flatMap((team) => team.skillsNeeded || []);
    return Array.from(new Set(skills)).sort();
  }, [teams]);

  // Fetch teams and requests data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, requestsRes] = await Promise.all([
        fetch("/api/team-discovery/teams"),
        fetch("/api/user/join-requests"),
      ]);

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData.teams || []);
      } else {
        throw new Error("Failed to fetch teams");
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        const requestedTeamIds = new Set<string>(
          requestsData.requestedTeamIds || []
        );
        setRequestedTeams(requestedTeamIds);
      }
    } catch (error) {
      setError("Failed to load team discovery data. Please try again later.");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle join request
  const handleJoinRequest = async (teamId: string) => {
    if (!session?.user?.email) {
      setError("You must be signed in to request to join a team.");
      return;
    }

    if (requestedTeams.has(teamId)) {
      return; // Already requested
    }

    try {
      const response = await fetch("/api/team-discovery/join-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId,
          userEmail: session.user.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRequestedTeams((prev) => new Set([...prev, teamId]));
        setError("");
      } else {
        setError(data.error || "Failed to send join request");
      }
    } catch (error) {
      setError("Failed to send join request. Please try again.");
      console.error("Error sending join request:", error);
    }
  };

  // Filter teams based on search and skill filter
  const filteredTeams = useMemo(() => {
    const teamsArray = Array.isArray(teams) ? teams : [];

    return teamsArray.filter((team) => {
      const matchesSearch =
        !searchQuery.trim() ||
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (team.description &&
          team.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (team.skillsNeeded &&
          team.skillsNeeded.some((skill) =>
            skill.toLowerCase().includes(searchQuery.toLowerCase())
          ));

      const matchesSkill =
        selectedSkill === "all" ||
        (team.skillsNeeded && team.skillsNeeded.includes(selectedSkill));

      return matchesSearch && matchesSkill;
    });
  }, [teams, searchQuery, selectedSkill]);

  // Check team status effect
  useEffect(() => {
    const checkTeamStatus = async () => {
      if (!session?.user?.email) {
        setCheckingTeamStatus(false);
        return;
      }

      try {
        const response = await fetch("/api/team/status");
        if (response.ok) {
          const data = await response.json();
          setUserHasTeam(!!data.team);
        }
      } catch (error) {
        console.error("Failed to check team status:", error);
      } finally {
        setCheckingTeamStatus(false);
      }
    };

    if (status === "authenticated") {
      checkTeamStatus();
    } else if (status === "unauthenticated") {
      setCheckingTeamStatus(false);
    }
  }, [session?.user?.email, status]);

  // Fetch data effect
  useEffect(() => {
    if (session?.user?.email && !userHasTeam && !checkingTeamStatus) {
      fetchData();
    }
  }, [session?.user?.email, userHasTeam, checkingTeamStatus]);

  // Authentication guard
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full glass-effect rounded-2xl p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gradient mb-4">
            Join the Discovery
          </h2>
          <p className="text-muted-foreground mb-8">
            Sign in to explore teams and find your perfect collaborators for SIH
            2025.
          </p>
          <button
            onClick={() => signIn("google")}
            className="btn-primary w-full"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
          <Link
            href="/"
            className="block mt-6 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Show loading while checking team status
  if (checkingTeamStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking your team status...</p>
        </div>
      </div>
    );
  }

  // Show message if user already has a team
  if (userHasTeam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md mx-auto text-center">
          <div className="glass-effect rounded-2xl p-8">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gradient mb-4">
              You're All Set! 🎉
            </h2>
            <p className="text-muted-foreground mb-8">
              You're already part of a team! Team discovery is for participants
              who haven't joined a team yet.
            </p>
            <div className="space-y-4">
              <Link href="/" className="btn-primary w-full">
                Return to Home
              </Link>
              <p className="text-sm text-muted-foreground">
                Need to manage your team? Check your registration dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team discovery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="SIH 2025"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <div className="hidden sm:block">
                  <div className="text-lg font-bold text-gradient">
                    SIH 2025
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Team Discovery
                  </div>
                </div>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold truncate">Find Your Team</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Discover teams looking for amazing collaborators
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/" className="btn-secondary text-sm">
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="hidden sm:inline">Back to Registration</span>
                <span className="sm:hidden">Back</span>
              </Link>
              {session?.user && (
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium truncate max-w-32">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-32">
                    {session.user.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Search and Filters Section */}
        <div className="mb-8">
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search Bar */}
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  Search Teams
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by team name, description, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-background/50 placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Skill Filter */}
              <div className="lg:w-64">
                <label className="block text-sm font-medium mb-2">
                  Filter by Skill
                </label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="block w-full py-3 px-3 border border-border rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="all">All Skills</option>
                  {allSkills.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gradient">
                    Available Teams
                  </h2>
                  <p className="text-muted-foreground">
                    {filteredTeams.length}{" "}
                    {filteredTeams.length === 1 ? "team" : "teams"} looking for
                    members
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  Available spots
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 glass-effect rounded-xl p-4 border-l-4 border-destructive bg-destructive/5">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-destructive mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => {
            const memberCount =
              team.memberCount || team.memberUserIds?.length || 0;
            const spotsAvailable =
              team.availableSpots !== undefined
                ? team.availableSpots
                : 6 - memberCount;
            const isRequested = requestedTeams.has(team._id);
            const isFull = spotsAvailable === 0;

            return (
              <div
                key={team._id}
                className="glass-effect rounded-2xl p-6 card-hover group"
              >
                {/* Team Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                      {team.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Led by {team.leaderUserId.split("@")[0]}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        spotsAvailable > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {spotsAvailable > 0 ? `${spotsAvailable} spots` : "Full"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {team.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                {/* Team Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="glass-effect rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-primary">
                      {memberCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                  <div className="glass-effect rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">
                      {spotsAvailable}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Open Spots
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Team Progress</span>
                    <span>{memberCount}/6</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(memberCount / 6) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Skills Needed */}
                {team.skillsNeeded && team.skillsNeeded.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Skills Needed
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {team.skillsNeeded.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {team.skillsNeeded.length > 3 && (
                        <span className="inline-flex px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                          +{team.skillsNeeded.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Join Button */}
                <button
                  onClick={() => handleJoinRequest(team._id)}
                  disabled={isFull || !session?.user?.email || isRequested}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isRequested
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : isFull
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "btn-primary hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  {isRequested
                    ? "✓ Request Sent"
                    : isFull
                      ? "Team Full"
                      : "Request to Join"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTeams.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <svg
                className="h-12 w-12 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gradient mb-2">
              No Teams Found
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery || selectedSkill !== "all"
                ? "Try adjusting your search criteria or filters to find more teams."
                : "No teams are currently looking for members. Check back later or create your own team!"}
            </p>
            {(searchQuery || selectedSkill !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSkill("all");
                }}
                className="btn-secondary mt-4"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
