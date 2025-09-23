"use client";
import React, { useEffect, useState } from "react";
import BroadcastForm from "@/components/broadcast-form";
import EmailTestPanel from "@/components/email-test-panel";
import ExportOptions from "@/components/export-options";
import { useSession, signIn, signOut } from "next-auth/react";
import type { Session } from "next-auth";
import Image from "next/image";

export default function DashboardPage() {
  const { data: sessionRaw, status } = useSession();
  // Patch session type to include isAdmin
  const session = sessionRaw as Session & { user?: { isAdmin?: boolean } };
  const [participants, setParticipants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Team helper functions
  const getTeamMembers = (team: any) => {
    const members: any[] = [];

    // Add leader
    if (team.leaderUserId) {
      const leader = participants.find(
        (p: any) => p.email === team.leaderUserId
      );
      if (leader && typeof leader === "object") {
        members.push(Object.assign({}, leader, { role: "Leader" }));
      }
    }

    // Add members (excluding the leader to avoid duplication)
    if (team.memberUserIds && team.memberUserIds.length > 0) {
      team.memberUserIds.forEach((memberId: string) => {
        // Only add if this member is not the leader
        if (memberId !== team.leaderUserId) {
          const member = participants.find((p: any) => p.email === memberId);
          if (member && typeof member === "object") {
            members.push(Object.assign({}, member, { role: "Member" }));
          }
        }
      });
    }

    return members;
  };

  const toggleTeamExpansion = (teamName: string) => {
    setExpandedTeam(expandedTeam === teamName ? null : teamName);
  };

  const fetchData = async () => {
    if (!session || !session.user?.isAdmin) return;
    try {
      setError(null);
      setLoading(true);
      const [pRes, tRes] = await Promise.all([
        fetch("/api/dashboard/participants", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/dashboard/teams", {
          cache: "no-store",
          credentials: "include",
        }),
      ]);
      if (!pRes.ok) throw new Error("Failed to fetch participants");
      if (!tRes.ok) throw new Error("Failed to fetch teams");
      const participantsData = await pRes.json();
      const teamsData = await tRes.json();
      setParticipants(participantsData.participants || []);
      setTeams(teamsData.teams || []);
      setLastUpdated(new Date());
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  // Show login form if not authenticated or not admin
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || !session.user?.isAdmin) {
    if (typeof window !== "undefined") {
      window.location.href = "/api/auth/signin?callbackUrl=/dashboard";
    }
    return null;
  }

  // Calculate statistics
  const stats = {
    totalParticipants: participants.length,
    totalTeams: teams.length,
    completeTeams: teams.filter((t: any) => {
      // Count leader (if exists) + members (excluding leader to avoid double counting)
      const leaderCount = t.leaderUserId ? 1 : 0;
      const memberCount = t.memberUserIds
        ? t.memberUserIds.filter((id: string) => id !== t.leaderUserId).length
        : 0;
      const totalMembers = leaderCount + memberCount;
      return totalMembers === 6;
    }).length,
    incompleteTeams: teams.filter((t: any) => {
      const leaderCount = t.leaderUserId ? 1 : 0;
      const memberCount = t.memberUserIds
        ? t.memberUserIds.filter((id: string) => id !== t.leaderUserId).length
        : 0;
      const totalMembers = leaderCount + memberCount;
      return totalMembers > 0 && totalMembers < 6;
    }).length,
    emptyTeams: teams.filter((t: any) => {
      const leaderCount = t.leaderUserId ? 1 : 0;
      const memberCount = t.memberUserIds
        ? t.memberUserIds.filter((id: string) => id !== t.leaderUserId).length
        : 0;
      const totalMembers = leaderCount + memberCount;
      return totalMembers === 0;
    }).length,
    participantsInTeams: participants.filter((p: any) => p.teamStatus?.hasTeam)
      .length,
    participantsWithoutTeams: participants.filter(
      (p: any) => !p.teamStatus?.hasTeam
    ).length,
    averageTeamSize:
      teams.length > 0
        ? Math.round(
            (teams.reduce((acc: number, t: any) => {
              const leaderCount = t.leaderUserId ? 1 : 0;
              const memberCount = t.memberUserIds
                ? t.memberUserIds.filter((id: string) => id !== t.leaderUserId)
                    .length
                : 0;
              const totalMembers = leaderCount + memberCount;
              return acc + totalMembers;
            }, 0) /
              teams.length) *
              10
          ) / 10
        : 0,
    teamCompletionRate:
      teams.length > 0
        ? Math.round(
            (teams.filter((t: any) => {
              const leaderCount = t.leaderUserId ? 1 : 0;
              const memberCount = t.memberUserIds
                ? t.memberUserIds.filter((id: string) => id !== t.leaderUserId)
                    .length
                : 0;
              const totalMembers = leaderCount + memberCount;
              return totalMembers === 6;
            }).length /
              teams.length) *
              100
          )
        : 0,
    participantRegistrationRate:
      participants.length > 0
        ? Math.round(
            (participants.filter((p: any) => p.teamStatus?.hasTeam).length /
              participants.length) *
              100
          )
        : 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="SIH 2025"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <div>
                  <h1 className="text-lg font-bold text-gradient">
                    Admin Dashboard
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    SIH 2025 Registration Management
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium">{session.user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>

              <button
                onClick={fetchData}
                disabled={loading}
                className="btn-secondary p-3"
                title="Refresh Data"
              >
                <svg
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>

              <button
                onClick={() => setShowExportOptions(true)}
                className="btn-primary"
              >
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export
              </button>

              <button
                onClick={() => signOut()}
                className="btn-secondary text-destructive border-destructive/20 hover:bg-destructive/10"
                title="Logout"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero Stats Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gradient">
                Registration Overview
              </h2>
              <p className="text-muted-foreground mt-2">
                {lastUpdated ? (
                  <>Last updated: {lastUpdated.toLocaleString()}</>
                ) : (
                  <>Real-time registration data</>
                )}
              </p>
            </div>
            {participants.length === 0 && teams.length === 0 && !loading && (
              <div className="glass-effect rounded-lg px-4 py-3 border border-amber-200/50 bg-amber-50/50">
                <div className="flex items-center gap-2 text-amber-700">
                  <svg
                    className="h-5 w-5"
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
                  <span className="text-sm font-medium">
                    No registration data found
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Modern Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-effect rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Participants
                  </p>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {stats.totalParticipants}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs text-muted-foreground">
                      Active registrations
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-effect rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Teams
                  </p>
                  <p className="text-3xl font-bold text-secondary-foreground mt-2">
                    {stats.totalTeams}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">
                      Avg {stats.averageTeamSize} members
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-secondary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-effect rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Complete Teams
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {stats.completeTeams}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {stats.teamCompletionRate}% completion rate
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-green-600"
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
              </div>
            </div>

            <div className="glass-effect rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Team Participation
                  </p>
                  <p className="text-3xl font-bold text-indigo-600 mt-2">
                    {stats.participantsInTeams}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {stats.participantRegistrationRate}% joined teams
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Navigation Tabs */}
        <div className="mb-8">
          <nav className="glass-effect rounded-2xl p-2">
            <div className="flex gap-2">
              {[
                { id: "overview", name: "Overview", icon: "📊" },
                { id: "participants", name: "Participants", icon: "👥" },
                { id: "teams", name: "Teams", icon: "🏆" },
                { id: "broadcast", name: "Broadcast", icon: "📢" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Progress Analytics */}
            <div className="glass-effect rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-sm">📈</span>
                </div>
                Registration Progress
              </h3>

              <div className="space-y-6">
                {/* Team Completion */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">Team Completion</span>
                    <span className="text-sm font-bold">
                      {stats.completeTeams} / {stats.totalTeams}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${stats.teamCompletionRate}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {stats.teamCompletionRate}% teams completed (6/6 members)
                  </div>
                </div>

                {/* Participant Registration */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">
                      Team Participation
                    </span>
                    <span className="text-sm font-bold">
                      {stats.participantsInTeams} / {stats.totalParticipants}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${stats.participantRegistrationRate}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {stats.participantRegistrationRate}% participants joined
                    teams
                  </div>
                </div>

                {/* Team Status Distribution */}
                <div className="pt-4 border-t border-border/50">
                  <div className="text-sm font-medium text-muted-foreground mb-4">
                    Team Status Distribution
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center glass-effect rounded-lg p-3">
                      <div className="text-lg font-bold text-green-600">
                        {stats.completeTeams}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Complete
                      </div>
                    </div>
                    <div className="text-center glass-effect rounded-lg p-3">
                      <div className="text-lg font-bold text-amber-600">
                        {stats.incompleteTeams}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        In Progress
                      </div>
                    </div>
                    <div className="text-center glass-effect rounded-lg p-3">
                      <div className="text-lg font-bold text-gray-600">
                        {stats.participantsWithoutTeams}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        No Team
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-effect rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-sm">⚡</span>
                </div>
                Quick Actions
              </h3>

              <div className="space-y-4">
                <button
                  onClick={() => setActiveTab("broadcast")}
                  className="w-full glass-effect rounded-xl p-4 text-left card-hover group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <span className="text-xl">📢</span>
                    </div>
                    <div>
                      <div className="font-medium">Send Broadcast Email</div>
                      <div className="text-sm text-muted-foreground">
                        Notify all participants with updates
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowExportOptions(true)}
                  className="block w-full glass-effect rounded-xl p-4 text-left card-hover group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <span className="text-xl">📊</span>
                    </div>
                    <div>
                      <div className="font-medium">
                        Export Registration Data
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Download complete registration dataset
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("teams")}
                  className="w-full glass-effect rounded-xl p-4 text-left card-hover group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <span className="text-xl">🏆</span>
                    </div>
                    <div>
                      <div className="font-medium">Manage Teams</div>
                      <div className="text-sm text-muted-foreground">
                        View and organize team registrations
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "broadcast" && (
          <div className="space-y-8">
            <div className="glass-effect rounded-2xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gradient flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <span className="text-lg">📢</span>
                  </div>
                  Broadcast Communication
                </h2>
                <p className="text-muted-foreground mt-2">
                  Send important updates to all registered participants
                </p>
              </div>
              <BroadcastForm />
            </div>

            <EmailTestPanel />
          </div>
        )}

        {activeTab === "participants" && (
          <div className="glass-effect rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-2xl font-bold text-gradient flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <span className="text-lg">👥</span>
                </div>
                Participants ({participants.length})
              </h2>
              <p className="text-muted-foreground mt-2">
                Complete list of registered participants
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border/50">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Team Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {participants.map((p: any, index: number) => (
                    <tr
                      key={p.email}
                      className={`${index % 2 === 0 ? "bg-card" : "bg-muted/20"} hover:bg-accent/50 transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {p.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {p.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {p.gender || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {p.fields?.phone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {p.fields?.department || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {p.fields?.year || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {p.teamStatus?.hasTeam ? (
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                p.teamStatus.role === "Leader"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {p.teamStatus.role}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {p.teamStatus.teamName}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
                            No team yet
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "teams" && (
          <div className="glass-effect rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-2xl font-bold text-gradient flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <span className="text-lg">🏆</span>
                </div>
                Teams ({teams.length})
              </h2>
              <p className="text-muted-foreground mt-2">
                Click on any team to view detailed member information
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border/50">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Team Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Invite Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Leader
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {teams.map((t: any, index: number) => {
                    // Calculate actual member count (leader + members, avoiding double counting)
                    const leaderCount = t.leaderUserId ? 1 : 0;
                    const actualMemberCount = t.memberUserIds
                      ? t.memberUserIds.filter(
                          (id: string) => id !== t.leaderUserId
                        ).length
                      : 0;
                    const memberCount = leaderCount + actualMemberCount;
                    const isComplete = memberCount === 6;
                    const isExpanded = expandedTeam === t.name;
                    const teamMembers = getTeamMembers(t);

                    return (
                      <React.Fragment key={t.name}>
                        <tr
                          className={`cursor-pointer transition-all duration-200 ${
                            index % 2 === 0
                              ? "bg-card hover:bg-accent/30"
                              : "bg-muted/20 hover:bg-accent/40"
                          } ${isExpanded ? "bg-primary/10 hover:bg-primary/15" : ""}`}
                          onClick={() => toggleTeamExpansion(t.name)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-3">
                              <svg
                                className={`h-4 w-4 transition-transform duration-200 text-muted-foreground ${
                                  isExpanded ? "transform rotate-90" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                              <span>{t.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            <span className="font-mono bg-muted/50 rounded-lg px-3 py-1 text-xs">
                              {t.inviteCode}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {t.leaderUserId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">
                                {memberCount}/6
                              </span>
                              <div className="w-20 bg-muted rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    isComplete
                                      ? "bg-gradient-to-r from-green-500 to-green-600"
                                      : "bg-gradient-to-r from-blue-500 to-blue-600"
                                  }`}
                                  style={{
                                    width: `${(memberCount / 6) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                isComplete
                                  ? "bg-green-100 text-green-800"
                                  : memberCount > 0
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {isComplete
                                ? "Complete"
                                : memberCount > 0
                                  ? "In Progress"
                                  : "Empty"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-muted-foreground">
                            {isExpanded
                              ? "Click to collapse"
                              : "Click to expand"}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="px-0 py-0">
                              <div className="bg-accent/20 border-t border-border/50 px-8 py-6">
                                <h4 className="text-lg font-semibold mb-4">
                                  Team Members ({teamMembers.length})
                                </h4>
                                {teamMembers.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {teamMembers.map(
                                      (member: any, memberIndex: number) => (
                                        <div
                                          key={`${member.email}-${memberIndex}`}
                                          className="glass-effect rounded-xl p-4 card-hover"
                                        >
                                          <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium">
                                              {member.name}
                                            </span>
                                            <span
                                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                member.role === "Leader"
                                                  ? "bg-blue-100 text-blue-800"
                                                  : "bg-green-100 text-green-800"
                                              }`}
                                            >
                                              {member.role}
                                            </span>
                                          </div>
                                          <div className="space-y-2 text-xs text-muted-foreground">
                                            <div>
                                              <span className="font-medium">
                                                Email:
                                              </span>{" "}
                                              {member.email}
                                            </div>
                                            <div>
                                              <span className="font-medium">
                                                Phone:
                                              </span>{" "}
                                              {member.fields?.phone || "N/A"}
                                            </div>
                                            <div>
                                              <span className="font-medium">
                                                Department:
                                              </span>{" "}
                                              {member.fields?.department ||
                                                "N/A"}
                                            </div>
                                            <div>
                                              <span className="font-medium">
                                                Year:
                                              </span>{" "}
                                              {member.fields?.year || "N/A"}
                                            </div>
                                            <div>
                                              <span className="font-medium">
                                                Gender:
                                              </span>{" "}
                                              {member.gender || "N/A"}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center py-12">
                                    <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                      <svg
                                        className="h-8 w-8 text-muted-foreground"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                      </svg>
                                    </div>
                                    <h3 className="text-lg font-medium mb-2">
                                      No members yet
                                    </h3>
                                    <p className="text-muted-foreground">
                                      This team doesn't have any members yet.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Export Options Modal */}
      {showExportOptions && (
        <ExportOptions onClose={() => setShowExportOptions(false)} />
      )}
    </div>
  );
}
