import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { connectMongoose } from "@/lib/mongoose";
import Participant from "@/models/participant";
import Team from "@/models/team";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import problemStatementsData from "../../../data/problem-statements.json";

export async function GET(request: NextRequest) {
  const sessionRaw = await getServerSession(authOptions);
  const session = sessionRaw as { user?: { isAdmin?: boolean } };
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "excel"; // excel, csv, json
  const sheets = searchParams.get("sheets") || "all"; // all, participants, teams, analytics

  await connectMongoose();
  const participantsRaw = await Participant.find({}, { _id: 0, __v: 0 }).lean();
  const teamsRaw = await Team.find({}, { _id: 0, __v: 0 }).lean();

  // Create comprehensive team mapping
  const userTeamMap = new Map();
  const teamDetailsMap = new Map();

  teamsRaw.forEach((team: any) => {
    const teamDetails = {
      name: team.name,
      inviteCode: team.inviteCode,
      leaderUserId: team.leaderUserId,
      memberCount: (team.memberUserIds || []).length + 1, // +1 for leader
      isComplete: (team.memberUserIds || []).length + 1 >= 6,
      problemStatement: team.problemStatement || "Not Selected",
      problemStatementTitle: getProblemStatementTitle(team.problemStatement),
      createdAt: (team as any).createdAt,
      description: team.description || "",
      skillsNeeded: (team.skillsNeeded || []).join(", "),
    };

    teamDetailsMap.set(team.name, teamDetails);

    // Add leader to map
    if (team.leaderUserId) {
      userTeamMap.set(team.leaderUserId, {
        ...teamDetails,
        role: "Leader",
        hasTeam: true,
      });
    }

    // Add members to map
    if (team.memberUserIds && Array.isArray(team.memberUserIds)) {
      team.memberUserIds.forEach((userId: string) => {
        userTeamMap.set(userId, {
          ...teamDetails,
          role: "Member",
          hasTeam: true,
        });
      });
    }
  });

  function getProblemStatementTitle(id: string | null) {
    if (!id) return "Not Selected";
    const problem = problemStatementsData.problemStatements.find(
      (p: any) => p.id === id
    );
    return problem ? problem.title : `Unknown (${id})`;
  }

  // Collect all distinct dynamic field keys
  const dynamicKeys = new Set<string>();
  for (const p of participantsRaw) {
    if (p.fields && typeof p.fields === "object") {
      for (const k of Object.keys(p.fields)) dynamicKeys.add(k);
    }
  }
  const orderedDynamicKeys = Array.from(dynamicKeys).sort();

  // Enhanced participants data
  const participants = participantsRaw.map((p) => {
    const teamInfo = userTeamMap.get(p.userId) || {
      name: "",
      role: "",
      hasTeam: false,
      memberCount: 0,
      isComplete: false,
      problemStatement: "Not Selected",
      problemStatementTitle: "Not Selected",
    };

    const base: any = {
      // Basic Info
      name: p.name,
      email: p.email,
      gender: p.gender,
      userId: p.userId,
      registrationDate: (p as any).createdAt,
      lastUpdated: (p as any).updatedAt,

      // Team Info
      teamName: teamInfo.name || "No Team",
      teamRole: teamInfo.role || "No Role",
      hasTeam: teamInfo.hasTeam ? "Yes" : "No",
      teamSize: teamInfo.memberCount || 0,
      teamComplete: teamInfo.isComplete ? "Yes" : "No",
      problemStatement: teamInfo.problemStatement,
      problemStatementTitle: teamInfo.problemStatementTitle,

      // Dynamic fields
      ...Object.fromEntries(
        orderedDynamicKeys.map((k) => [k, p.fields?.[k] ?? ""])
      ),
    };

    return base;
  });

  // Enhanced teams data
  const teams = teamsRaw.map((t: any) => {
    const memberEmails: string[] = [];
    const memberNames: string[] = [];

    // Get leader info
    const leader = participantsRaw.find((p) => p.email === t.leaderUserId);
    if (leader) {
      memberEmails.push(`${leader.email} (Leader)`);
      memberNames.push(`${leader.name} (Leader)`);
    }

    // Get member info
    if (t.memberUserIds && Array.isArray(t.memberUserIds)) {
      t.memberUserIds.forEach((userId: string) => {
        const member = participantsRaw.find((p) => p.email === userId);
        if (member) {
          memberEmails.push(member.email);
          memberNames.push(member.name);
        }
      });
    }

    const problemStatement = problemStatementsData.problemStatements.find(
      (p: any) => p.id === t.problemStatement
    );

    return {
      teamName: t.name,
      inviteCode: t.inviteCode,
      leaderEmail: t.leaderUserId,
      leaderName: leader?.name || "Unknown",
      memberCount: memberEmails.length,
      isComplete: memberEmails.length >= 6 ? "Yes" : "No",
      completionStatus: `${memberEmails.length}/6`,
      problemStatementId: t.problemStatement || "Not Selected",
      problemStatementTitle: problemStatement?.title || "Not Selected",
      problemStatementCategory: problemStatement?.category || "N/A",
      problemStatementComplexity: problemStatement?.complexity || "N/A",
      createdDate: (t as any).createdAt,
      description: t.description || "",
      skillsNeeded: (t.skillsNeeded || []).join(", "),
      memberEmails: memberEmails.join(", "),
      memberNames: memberNames.join(", "),
    };
  });

  // Analytics data
  const analytics = generateAnalytics(participants, teams);

  // Summary statistics
  const summary = {
    totalParticipants: participants.length,
    totalTeams: teams.length,
    participantsWithTeams: participants.filter((p) => p.hasTeam === "Yes")
      .length,
    participantsWithoutTeams: participants.filter((p) => p.hasTeam === "No")
      .length,
    completeTeams: teams.filter((t) => t.isComplete === "Yes").length,
    incompleteTeams: teams.filter((t) => t.isComplete === "No").length,
    teamsWithProblemStatements: teams.filter(
      (t) => t.problemStatementId !== "Not Selected"
    ).length,
    teamsWithoutProblemStatements: teams.filter(
      (t) => t.problemStatementId === "Not Selected"
    ).length,
    exportDate: new Date().toISOString(),
    exportFormat: format,
  };

  if (format === "json") {
    const jsonData = {
      summary,
      participants:
        sheets === "all" || sheets === "participants"
          ? participants
          : undefined,
      teams: sheets === "all" || sheets === "teams" ? teams : undefined,
      analytics:
        sheets === "all" || sheets === "analytics" ? analytics : undefined,
    };

    return NextResponse.json(jsonData, {
      headers: {
        "Content-Disposition": `attachment; filename="sih-internals-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  }

  if (format === "csv") {
    let csvContent = "";

    if (sheets === "all" || sheets === "participants") {
      csvContent += "PARTICIPANTS\n";
      csvContent += convertToCSV(participants) + "\n\n";
    }

    if (sheets === "all" || sheets === "teams") {
      csvContent += "TEAMS\n";
      csvContent += convertToCSV(teams) + "\n\n";
    }

    if (sheets === "all" || sheets === "analytics") {
      csvContent += "ANALYTICS\n";
      csvContent += convertToCSV(analytics) + "\n\n";
    }

    csvContent += "SUMMARY\n";
    csvContent += convertToCSV([summary]);

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="sih-internals-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  // Excel format (default)
  const wb = XLSX.utils.book_new();

  // Add Summary sheet first
  const summarySheet = XLSX.utils.json_to_sheet([summary]);
  XLSX.utils.book_append_sheet(wb, summarySheet, "📊 Summary");

  if (sheets === "all" || sheets === "participants") {
    const pSheet = XLSX.utils.json_to_sheet(participants);
    // Auto-fit columns
    const cols = Object.keys(participants[0] || {}).map(() => ({ wch: 15 }));
    pSheet["!cols"] = cols;
    XLSX.utils.book_append_sheet(wb, pSheet, "👥 Participants");
  }

  if (sheets === "all" || sheets === "teams") {
    const tSheet = XLSX.utils.json_to_sheet(teams);
    // Auto-fit columns
    const cols = Object.keys(teams[0] || {}).map(() => ({ wch: 15 }));
    tSheet["!cols"] = cols;
    XLSX.utils.book_append_sheet(wb, tSheet, "🏆 Teams");
  }

  if (sheets === "all" || sheets === "analytics") {
    const aSheet = XLSX.utils.json_to_sheet(analytics);
    XLSX.utils.book_append_sheet(wb, aSheet, "📈 Analytics");
  }

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `sih-internals-export-${new Date().toISOString().split("T")[0]}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function generateAnalytics(participants: any[], teams: any[]) {
  const analytics = [];

  // Gender distribution
  const genderStats = participants.reduce((acc, p) => {
    acc[p.gender] = (acc[p.gender] || 0) + 1;
    return acc;
  }, {});

  Object.entries(genderStats).forEach(([gender, count]) => {
    analytics.push({
      category: "Gender Distribution",
      metric: gender,
      value: count,
      percentage: `${(((count as number) / participants.length) * 100).toFixed(1)}%`,
    });
  });

  // Department distribution
  const deptStats = participants.reduce((acc, p) => {
    const dept = p.department || "Not Specified";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  Object.entries(deptStats).forEach(([dept, count]) => {
    analytics.push({
      category: "Department Distribution",
      metric: dept,
      value: count,
      percentage: `${(((count as number) / participants.length) * 100).toFixed(1)}%`,
    });
  });

  // Year distribution
  const yearStats = participants.reduce((acc, p) => {
    const year = p.year || "Not Specified";
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});

  Object.entries(yearStats).forEach(([year, count]) => {
    analytics.push({
      category: "Year Distribution",
      metric: `Year ${year}`,
      value: count,
      percentage: `${(((count as number) / participants.length) * 100).toFixed(1)}%`,
    });
  });

  // Team completion status
  analytics.push({
    category: "Team Status",
    metric: "Complete Teams (6 members)",
    value: teams.filter((t) => t.isComplete === "Yes").length,
    percentage: `${((teams.filter((t) => t.isComplete === "Yes").length / teams.length) * 100).toFixed(1)}%`,
  });

  analytics.push({
    category: "Team Status",
    metric: "Incomplete Teams",
    value: teams.filter((t) => t.isComplete === "No").length,
    percentage: `${((teams.filter((t) => t.isComplete === "No").length / teams.length) * 100).toFixed(1)}%`,
  });

  // Problem statement selection
  analytics.push({
    category: "Problem Statements",
    metric: "Teams with Problem Statements",
    value: teams.filter((t) => t.problemStatementId !== "Not Selected").length,
    percentage: `${((teams.filter((t) => t.problemStatementId !== "Not Selected").length / teams.length) * 100).toFixed(1)}%`,
  });

  // Registration timeline (last 7 days)
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const recentRegistrations = participants.filter(
    (p) => new Date(p.registrationDate) >= last7Days
  ).length;

  analytics.push({
    category: "Registration Timeline",
    metric: "Registrations (Last 7 days)",
    value: recentRegistrations,
    percentage: `${((recentRegistrations / participants.length) * 100).toFixed(1)}%`,
  });

  return analytics;
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(","));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape commas and quotes in CSV
      return typeof value === "string" &&
        (value.includes(",") || value.includes('"'))
        ? `"${value.replace(/"/g, '""')}"`
        : value;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}
