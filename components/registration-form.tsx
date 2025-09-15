"use client";

import type React from "react";

import useSWR from "swr";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { DynamicField } from "./dynamic-field";
import { GoogleSignInButton, SignOutButton } from "./auth-buttons";
import NotificationBell from "./notification-bell";
import { signIn } from "next-auth/react";
import confetti from "canvas-confetti";

type FieldDef = {
  key: string;
  label: string;
  type: "text" | "select";
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

type SectionDef = {
  id: string;
  title: string;
  description?: string;
  fields: FieldDef[];
};

type Schema = {
  title: string;
  description?: string;
  fields?: FieldDef[]; // backward compatibility
  sections?: SectionDef[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function RegistrationForm() {
  const [schema, setSchema] = useState<Schema | null>(null);
  const {
    data: me,
    mutate: mutateMe,
    error: meError,
    isLoading: loadingMeRaw,
  } = useSWR(() => "/api/participant", fetcher);
  const [form, setForm] = useState<Record<string, string>>({});
  const [teamMode, setTeamMode] = useState<"create" | "join">("create");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [pending, start] = useTransition();
  const sessionEmail = me?.sessionUser?.email as string | undefined;
  const [showCongrats, setShowCongrats] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  // WhatsApp community prompt visibility
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(true);
  // Secondary prompt after team completion
  const [showWhatsAppTeamPrompt, setShowWhatsAppTeamPrompt] = useState(true);
  const LOCAL_KEY = "sih-reg-state-v1";

  useEffect(() => {
    import("../app/data/registration-schema.json").then((m) =>
      setSchema(m as any)
    );
  }, []);

  useEffect(() => {
    if (me?.participant?.fields) {
      setForm((prev) => ({ ...prev, ...me.participant.fields }));
    }
  }, [me?.participant]);

  // ...existing code...

  // Move this effect below totalSteps declaration

  // Restore local state (before sign-in allowed only limited restoration)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.form) setForm(parsed.form);
        if (typeof parsed.step === "number") setCurrentStep(parsed.step);
        if (parsed.teamMode)
          setTeamMode(parsed.teamMode === "none" ? "create" : parsed.teamMode);
        if (parsed.teamName) setTeamName(parsed.teamName);
        if (parsed.inviteCode) setInviteCode(parsed.inviteCode);
      }
    } catch {}
  }, []);

  // Persist state
  useEffect(() => {
    const data = { form, step: currentStep, teamMode, teamName, inviteCode };
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    } catch {}
  }, [form, currentStep, teamMode, teamName, inviteCode]);

  const sections = useMemo<SectionDef[]>(() => {
    if (!schema) return [];
    if (schema.sections && schema.sections.length) return schema.sections;
    if (schema.fields && schema.fields.length) {
      return [
        {
          id: "main",
          title: "Details",
          description: "Provide required details",
          fields: schema.fields,
        },
      ];
    }
    return [];
  }, [schema]);

  const totalSteps = 1 /* sign-in */ + sections.length + 1; /* team formation */

  // ...existing code...

  function updateField(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [totalSteps]);
  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  async function saveParticipant() {
    if (!sessionEmail) return;

    const r1 = await fetch("/api/participant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: form }),
    });
    if (!r1.ok) {
      const j = await r1.json().catch(() => ({}));
      setError(j.error || "Failed to save participant");
      return false;
    }
    setError(null);
    mutateMe();
    return true;
  }

  const {
    data: teamStatus,
    mutate: mutateTeam,
    isLoading: loadingTeamRaw,
  } = useSWR(sessionEmail ? "/api/team/status" : null, fetcher, {
    refreshInterval: 8000,
  });

  useEffect(() => {
    // Jump to team view if user has a team (this overrides localStorage restoration)
    if (teamStatus?.team && sessionEmail) {
      setCurrentStep(totalSteps - 1);
    }
  }, [teamStatus?.team, sessionEmail, totalSteps]);

  // Override localStorage step restoration if user has a team
  useEffect(() => {
    if (teamStatus?.team) {
      // If user has a team, force them to team view regardless of localStorage
      setCurrentStep(totalSteps - 1);
    } else {
      // Only restore from localStorage if user doesn't have a team
      try {
        const raw = localStorage.getItem(LOCAL_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.step === "number") {
            setCurrentStep(parsed.step);
          }
        }
      } catch {}
    }
  }, [teamStatus, totalSteps]);
  const loadingParticipant =
    typeof loadingMeRaw === "boolean" ? loadingMeRaw : !me && !meError;
  const loadingTeam =
    typeof loadingTeamRaw === "boolean"
      ? loadingTeamRaw
      : sessionEmail && !teamStatus;
  const isLeader =
    !!teamStatus?.team && teamStatus.team.leaderUserId === sessionEmail;

  async function submitTeamActions() {
    setError(null);
    if (teamMode === "create") {
      if (!teamName.trim()) {
        setError("Team name is required");
        return false;
      }
      const r2 = await fetch("/api/team/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim() }),
      });
      const j2 = await r2.json();
      if (!r2.ok) {
        setError(j2.error || "Failed to create team");
        return false;
      }
      setInfo("Team created successfully! 🎉");
      // Trigger confetti for team creation
      setTimeout(() => {
        try {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          setTimeout(
            () =>
              confetti({
                particleCount: 80,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
              }),
            150
          );
          setTimeout(
            () =>
              confetti({
                particleCount: 80,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
              }),
            300
          );
        } catch {}
      }, 100);
      await mutateTeam();
    } else if (teamMode === "join") {
      if (!inviteCode.trim()) {
        setError("Invite code required");
        return false;
      }
      const r3 = await fetch("/api/team/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      });
      const j3 = await r3.json();
      if (!r3.ok) {
        setError(j3.error || "Failed to join team");
        return false;
      }
      setInfo("Joined team successfully! 🎉");
      // Trigger confetti for team joining
      setTimeout(() => {
        try {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          setTimeout(
            () =>
              confetti({
                particleCount: 80,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
              }),
            150
          );
          setTimeout(
            () =>
              confetti({
                particleCount: 80,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
              }),
            300
          );
        } catch {}
      }, 100);
      await mutateTeam();
    }
    await mutateTeam();
    return true;
  }

  async function handlePrimary(e: React.FormEvent) {
    e.preventDefault();
    if (currentStep === 0) {
      if (!sessionEmail) {
        return;
      }
      goNext();
      return;
    }
    // field steps
    const fieldStepsEndIndex = 1 + sections.length - 1;
    if (currentStep >= 1 && currentStep <= fieldStepsEndIndex) {
      if (!sessionEmail) {
        setError("Sign in required");
        return;
      }
      start(async () => {
        const ok = await saveParticipant();
        if (ok) goNext();
      });
      return;
    }
    // team formation step
    if (currentStep === totalSteps - 1) {
      start(async () => {
        const ok1 = await saveParticipant();
        if (!ok1) return;
        const ok2 = await submitTeamActions();
        if (!ok2) return;
        setShowCongrats(true);
        goNext();
      });
    }
  }

  const progressPercent = (currentStep / (totalSteps - 1)) * 100;

  const fieldStepsStart = 1;
  const fieldStepsEnd = fieldStepsStart + sections.length - 1;

  const isTeamStep = currentStep === totalSteps - 1;
  const isDone =
    showCongrats &&
    currentStep === totalSteps &&
    (teamStatus.members?.length || 1) >= 6;
  const teamLocked = isTeamStep && !!teamStatus?.team;

  // Persist / restore dismissal of WhatsApp prompt
  useEffect(() => {
    try {
      if (localStorage.getItem("sih-wa-dismissed") === "1") {
        setShowWhatsAppPrompt(false);
      }
      if (localStorage.getItem("sih-wa-dismissed-team") === "1") {
        setShowWhatsAppTeamPrompt(false);
      }
    } catch {}
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="glass-effect rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-white/20">
        {/* Header Section - Mobile Optimized */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gradient mb-2">
              {schema?.title || "Registration"}
            </h2>
            {schema?.description && (
              <p className="text-gray-700 text-sm leading-relaxed">
                {schema.description}
              </p>
            )}
          </div>
          
          {/* Auth Section - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm">
            {sessionEmail && (
              <>
                <span className="text-gray-700 font-medium truncate max-w-[200px] sm:max-w-none">
                  {sessionEmail}
                </span>
                <SignOutButton />
              </>
            )}
            {!sessionEmail && currentStep > 0 && <GoogleSignInButton />}
          </div>
        </div>

        {/* Enhanced Progress Bar - Mobile Optimized */}
        <div className="mb-6 sm:mb-8 relative">
          <div className="h-2 sm:h-3 w-full overflow-hidden rounded-full bg-gradient-to-r from-gray-100 to-gray-200 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-500 ease-out shadow-lg relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-600">
            <span>Step {Math.min(currentStep + 1, totalSteps)}</span>
            <span className="hidden sm:inline">{totalSteps} Total Steps</span>
            <span className="sm:hidden">{Math.min(currentStep + 1, totalSteps)}/{totalSteps}</span>
          </div>
        </div>

        <form onSubmit={handlePrimary} className="space-y-4 sm:space-y-6">
          {/* Enhanced Feedback Messages - Mobile Optimized */}
          {error && (
            <div className="animate-in fade-in-50 slide-in-from-top-2 rounded-xl sm:rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-3 sm:p-4 shadow-sm">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-white"
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
                <div className="flex-1 min-w-0">
                  <p className="text-red-800 font-medium text-sm break-words">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {info && !error && (
            <div className="animate-in fade-in-50 slide-in-from-top-2 rounded-xl sm:rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 shadow-sm">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-white"
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
                <div className="flex-1 min-w-0">
                  <p className="text-green-800 font-medium text-sm break-words">{info}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInfo(null)}
                  className="text-green-500 hover:text-green-700 text-sm font-medium flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {!error && loadingParticipant && currentStep > 0 && (
            <div className="animate-in fade-in-50 slide-in-from-top-2 rounded-xl sm:rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                <p className="text-blue-800 font-medium text-sm">
                  Loading your saved data...
                </p>
              </div>
            </div>
          )}

          {/* Step Content - Mobile Optimized */}
          {currentStep === 0 && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 slide-in-from-bottom-4">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-primary mb-2 sm:mb-3">
                  Welcome to SIH 2025
                </h3>
                <p className="text-gray-700 text-base sm:text-lg px-4">
                  Sign in with Google to begin your registration journey.
                </p>
              </div>

              {!sessionEmail && (
                <div className="flex justify-center">
                  <GoogleSignInButton />
                </div>
              )}

              {sessionEmail && (
                <div className="rounded-xl sm:rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 text-center shadow-sm">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-white"
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
                  <p className="text-green-800 font-medium text-sm sm:text-base">Signed in as</p>
                  <p className="text-green-700 font-semibold text-base sm:text-lg break-all px-2">
                    {sessionEmail}
                  </p>
                </div>
              )}

              {!sessionEmail && (
                <div className="text-center">
                  <p className="text-amber-600 text-sm font-medium bg-amber-50 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-amber-200">
                    ⚠️ You must sign in to continue with registration
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep >= fieldStepsStart && currentStep <= fieldStepsEnd && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 slide-in-from-bottom-4">
              {(() => {
                const section = sections[currentStep - fieldStepsStart];
                if (!section) return null;
                return (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                        <svg
                          className="w-6 h-6 sm:w-8 sm:h-8 text-white"
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
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-primary mb-2">
                        {section.title}
                      </h3>
                      {section.description && (
                        <p className="text-gray-700 text-sm sm:text-base px-4">{section.description}</p>
                      )}
                    </div>
                    <div className="grid gap-4 sm:gap-6">
                      {section.fields.map((f) => (
                        <DynamicField
                          key={f.key}
                          field={f}
                          value={form[f.key] || ""}
                          onChange={updateField}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {isTeamStep && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 slide-in-from-bottom-4">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-white"
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
                <h3 className="text-lg sm:text-xl font-semibold text-primary mb-2">
                  Team Formation
                </h3>
                <p className="text-gray-700 text-sm sm:text-base px-4">
                  Create a new team or join using an invite code. This step is
                  required.
                </p>
              </div>

              {loadingTeam && (
                <div className="glass-effect rounded-xl sm:rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center gap-4 shadow-lg">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-700 font-medium text-sm sm:text-base">
                    Loading team status...
                  </p>
                </div>
              )}

              {!loadingTeam && teamStatus?.team ? (
                <div className="glass-effect rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-white/20">
                  <div className="space-y-4 sm:space-y-6">
                    {/* Team Header - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 text-white"
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
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-primary">
                            Your Team
                          </h3>
                          <p className="text-secondary font-medium text-sm sm:text-base truncate">
                            {teamStatus.team.name}
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Buttons - Mobile Responsive */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        {isLeader ? (
                          <>
                            <NotificationBell />
                            <button
                              type="button"
                              onClick={async () => {
                                if (
                                  confirm(
                                    "Delete this team? This cannot be undone."
                                  )
                                ) {
                                  await fetch("/api/team/status", {
                                    method: "DELETE",
                                  });
                                  setTeamMode("create");
                                  setTeamName("");
                                  setInviteCode("");
                                  await mutateTeam();
                                }
                              }}
                              className="btn-secondary text-red-600 hover:bg-red-50 border-red-200 text-sm"
                            >
                              Delete Team
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm("Exit this team?")) {
                                const r = await fetch("/api/team/leave", {
                                  method: "POST",
                                });
                                if (r.ok) {
                                  setInfo("Exited team");
                                  await mutateTeam();
                                } else {
                                  setError("Failed to exit team");
                                }
                              }
                            }}
                            className="btn-secondary text-amber-600 hover:bg-amber-50 border-amber-200 text-sm"
                          >
                            Exit Team
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Invite Code Section - Mobile Optimized */}
                    {(teamStatus.members?.length || 1) < 6 && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                          <h4 className="text-sm font-semibold text-blue-800">
                            Invite Code
                          </h4>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  teamStatus.team.inviteCode
                                );
                                setCopied(true);
                                setInfo("Invite code copied");
                                setTimeout(() => setCopied(false), 1500);
                              } catch {
                                setError("Failed to copy code");
                              }
                            }}
                            className="btn-secondary text-sm w-full sm:w-auto"
                          >
                            {copied ? "Copied!" : "Copy Code"}
                          </button>
                        </div>
                        <div className="font-mono text-center text-base sm:text-lg font-bold text-blue-700 bg-white/70 py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl select-all break-all">
                          {teamStatus.team.inviteCode}
                        </div>
                      </div>
                    )}

                    {/* Team Complete Section - Mobile Optimized */}
                    {(teamStatus.members?.length || 1) >= 6 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 text-white"
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
                            <h4 className="font-semibold text-green-800 text-sm sm:text-base">
                              Team Complete!
                            </h4>
                            <p className="text-green-600 text-xs sm:text-sm">
                              Maximum capacity reached (6/6 members)
                            </p>
                          </div>
                        </div>
                        <div className="border-t border-green-200 pt-4">
                          <p className="text-green-700 font-medium mb-3 text-sm sm:text-base">
                            🚀 Next Step: Choose Your Problem Statement
                          </p>
                          <a
                            href="https://sih.gov.in/sih2025PS"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary inline-flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                          >
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
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                            View SIH 2025 Problem Statements
                          </a>
                        </div>
                      </div>
                    )}

                    {/* WhatsApp Community Section - Mobile Optimized */}
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-emerald-200">
                      <h4 className="font-semibold text-emerald-800 mb-2 text-sm sm:text-base">
                        Stay Connected
                      </h4>
                      <p className="text-emerald-700 text-xs sm:text-sm mb-4 leading-relaxed">
                        Join our WhatsApp community for critical updates,
                        resources, and coordination tips as you prepare your
                        submission.
                      </p>
                      <a
                        href="https://chat.whatsapp.com/Hb81DgrYqn8ApptdhZb3sv"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 inline-flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2a10 10 0 00-8.94 14.5L2 22l5.7-1.99A10 10 0 1012 2zm0 2a8 8 0 110 16 7.96 7.96 0 01-3.65-.88l-.26-.14-3.38 1.18 1.16-3.3-.17-.28A8 8 0 0112 4zm4.24 9.71c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.18-.7-.62-1.18-1.38-1.32-1.62-.14-.24-.02-.36.1-.48.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.42-.54-.42-.14 0-.3 0-.46 0-.16 0-.42.06-.64.3-.22.24-.86.84-.86 2.04 0 1.2.88 2.36 1 2.52.12.16 1.72 2.62 4.16 3.68.58.26 1.04.42 1.4.54.58.18 1.1.16 1.52.1.46-.06 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
                        </svg>
                        Join WhatsApp Group
                      </a>
                    </div>

                    {/* Team Members - Mobile Optimized */}
                    <div>
                      <h4 className="font-semibold text-primary mb-3 text-sm sm:text-base">
                        Team Members ({teamStatus.members?.length || 1}/6)
                      </h4>
                      <div className="space-y-3">
                        {(teamStatus.members || [])
                          .sort((a: any, b: any) => {
                            const aIsLeader =
                              teamStatus.team.leaderUserId === a.email;
                            const bIsLeader =
                              teamStatus.team.leaderUserId === b.email;
                            if (aIsLeader && !bIsLeader) return -1;
                            if (!aIsLeader && bIsLeader) return 1;
                            return 0;
                          })
                          .map((m: any) => {
                            const leader =
                              teamStatus.team.leaderUserId === m.email;
                            return (
                              <div
                                key={m.email}
                                className="glass-effect rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-white font-semibold text-sm sm:text-base">
                                        {m.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-primary text-sm sm:text-base truncate">
                                        {m.name}
                                      </p>
                                      <p className="text-gray-600 text-xs sm:text-sm">
                                        {m.gender}
                                      </p>
                                    </div>
                                  </div>
                                  {leader && (
                                    <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
                                      Lead
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                !loadingTeam && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* WhatsApp Prompt - Mobile Optimized */}
                    <div className="glass-effect rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-green-50/50">
                      <h4 className="font-semibold text-emerald-800 mb-2 text-sm sm:text-base">
                        Join Our WhatsApp Community
                      </h4>
                      <p className="text-emerald-700 text-xs sm:text-sm mb-4 leading-relaxed">
                        Stay updated with announcements, resources, and networking
                        opportunities for SIH 2025 participants while you form
                        your team.
                      </p>
                      <a
                        href="https://chat.whatsapp.com/Hb81DgrYqn8ApptdhZb3sv"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 inline-flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2a10 10 0 00-8.94 14.5L2 22l5.7-1.99A10 10 0 1012 2zm0 2a8 8 0 110 16 7.96 7.96 0 01-3.65-.88l-.26-.14-3.38 1.18 1.16-3.3-.17-.28A8 8 0 0112 4zm4.24 9.71c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.18-.7-.62-1.18-1.38-1.32-1.62-.14-.24-.02-.36.1-.48.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.42-.54-.42-.14 0-.3 0-.46 0-.16 0-.42.06-.64.3-.22.24-.86.84-.86 2.04 0 1.2.88 2.36 1 2.52.12.16 1.72 2.62 4.16 3.68.58.26 1.04.42 1.4.54.58.18 1.1.16 1.52.1.46-.06 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
                        </svg>
                        Join WhatsApp Group
                      </a>
                    </div>

                    {/* Team Options - Mobile Responsive Grid */}
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => setTeamMode("create")}
                        className={`glass-effect rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left transition-all duration-300 hover:shadow-xl border ${
                          teamMode === "create"
                            ? "border-blue-500 ring-2 ring-blue-500/50 bg-blue-50/50"
                            : "border-white/20 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-primary text-sm sm:text-base">
                              Create Team
                            </h4>
                            <p className="text-blue-600 text-xs sm:text-sm">Leader</p>
                          </div>
                        </div>
                        <p className="text-gray-700 text-xs sm:text-sm mb-4">
                          Start a new team as leader & share code with members.
                        </p>
                        {teamMode === "create" && (
                          <input
                            className="w-full rounded-lg sm:rounded-xl border border-blue-200 px-3 py-2 sm:px-4 sm:py-3 text-sm bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter team name"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setTeamMode("join")}
                        className={`glass-effect rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left transition-all duration-300 hover:shadow-xl border ${
                          teamMode === "join"
                            ? "border-indigo-500 ring-2 ring-indigo-500/50 bg-indigo-50/50"
                            : "border-white/20 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                              />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-primary text-sm sm:text-base">
                              Join Team
                            </h4>
                            <p className="text-indigo-600 text-xs sm:text-sm">Member</p>
                          </div>
                        </div>
                        <p className="text-gray-700 text-xs sm:text-sm mb-4">
                          Use an invite code from a team leader.
                        </p>
                        {teamMode === "join" && (
                          <input
                            className="w-full rounded-lg sm:rounded-xl border border-indigo-200 px-3 py-2 sm:px-4 sm:py-3 text-sm bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-wider font-mono"
                            placeholder="INVITE CODE"
                            value={inviteCode}
                            onChange={(e) =>
                              setInviteCode(e.target.value.toUpperCase())
                            }
                          />
                        )}
                      </button>

                      <a
                        href="/team-discovery"
                        className="glass-effect rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left transition-all duration-300 hover:shadow-xl border border-white/20 hover:border-purple-300 group sm:col-span-2 lg:col-span-1"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-primary text-sm sm:text-base">
                              Find Teams
                            </h4>
                            <p className="text-purple-600 text-xs sm:text-sm">Discovery</p>
                          </div>
                        </div>
                        <p className="text-gray-700 text-xs sm:text-sm mb-4">
                          Browse available teams & teammates.
                        </p>
                        <div className="flex items-center gap-2 text-purple-600 group-hover:text-purple-700">
                          <span className="text-xs sm:text-sm font-medium">
                            Explore Teams
                          </span>
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </div>
                      </a>
                    </div>
                  </div>
                )
              )}

              <div className="text-center">
                <p className="text-amber-800 text-xs sm:text-sm leading-relaxed bg-amber-50/70 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-amber-200">
                  ⚠️ Teams must have exactly 6 members and include at least 2
                  female participant.
                </p>
              </div>
            </div>
          )}

          {isDone && (
            <div className="animate-in fade-in-50 slide-in-from-bottom-2 glass-effect rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50 shadow-lg">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
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
                  <h3 className="text-base sm:text-lg font-semibold text-green-800">
                    Registration Complete! 🎉
                  </h3>
                  <p className="text-green-700 text-sm sm:text-base">
                    You can revisit to modify details before the deadline.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Navigation Buttons - Mobile Optimized */}
          {!isDone && !teamLocked && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 sm:pt-6 border-t border-white/20">
              <button
                type="button"
                onClick={goBack}
                disabled={currentStep === 0 || pending}
                className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed order-2 sm:order-1"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back
              </button>

              <div className="flex items-center justify-center gap-3 text-sm text-gray-600 order-1 sm:order-2">
                <span>
                  Step {Math.min(currentStep + 1, totalSteps)} of {totalSteps}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                        i <= currentStep
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {sessionEmail != null && (
                <button
                  type="submit"
                  disabled={
                    pending ||
                    (currentStep === 0 && !sessionEmail) ||
                    (isTeamStep && teamMode === "create" && !teamName.trim()) ||
                    (isTeamStep && teamMode === "join" && !inviteCode.trim())
                  }
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed order-3 sm:order-3"
                >
                  {currentStep === 0 && !sessionEmail ? null : pending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : currentStep === totalSteps - 1 ? (
                    "Finish Registration"
                  ) : (
                    "Continue"
                  )}
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
