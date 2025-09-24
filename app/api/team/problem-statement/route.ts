import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectMongoose } from "../../../../lib/mongoose";
import Team from "../../../../models/team";
import problemStatementsData from "../../../data/problem-statements.json";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoose();

    // Find the team where user is leader or member
    const team = await Team.findOne({
      $or: [
        { leaderUserId: session.user.email },
        { memberUserIds: session.user.email },
      ],
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get problem statement details if selected
    let problemStatementDetails = null;
    if (team.problemStatement) {
      if (team.problemStatement.startsWith("CUSTOM_")) {
        // Handle custom problem statement
        problemStatementDetails = {
          id: team.problemStatement,
          title: "Custom Problem Statement",
          description: "Custom problem statement created by the team",
          category: "Custom",
          isCustom: true,
        };
      } else {
        problemStatementDetails = problemStatementsData.problemStatements.find(
          (ps: any) => ps.id === team.problemStatement
        );
      }
    }

    return NextResponse.json({
      team: {
        id: team._id,
        name: team.name,
        problemStatement: team.problemStatement,
        problemStatementDetails,
        isLeader: team.leaderUserId === session.user.email,
      },
    });
  } catch (error) {
    console.error("Error fetching team problem statement:", error);
    return NextResponse.json(
      { error: "Failed to fetch team problem statement" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { problemStatementId } = await request.json();

    if (!problemStatementId) {
      return NextResponse.json(
        { error: "Problem statement ID is required" },
        { status: 400 }
      );
    }

    // Validate problem statement exists (or is custom)
    let problemStatement = null;
    if (problemStatementId.startsWith("CUSTOM_")) {
      // Custom problem statement - no need to validate against predefined list
      problemStatement = {
        id: problemStatementId,
        title: "Custom Problem Statement",
        category: "Custom",
        isCustom: true,
      };
    } else {
      problemStatement = problemStatementsData.problemStatements.find(
        (ps: any) => ps.id === problemStatementId
      );

      if (!problemStatement) {
        return NextResponse.json(
          { error: "Invalid problem statement ID" },
          { status: 400 }
        );
      }
    }

    await connectMongoose();

    // Find the team where user is the leader
    const team = await Team.findOne({
      leaderUserId: session.user.email,
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found or you are not the team leader" },
        { status: 404 }
      );
    }

    // Update team's problem statement
    team.problemStatement = problemStatementId;
    await team.save();

    return NextResponse.json({
      message: "Problem statement updated successfully",
      team: {
        id: team._id,
        name: team.name,
        problemStatement: team.problemStatement,
        problemStatementDetails: problemStatement,
      },
    });
  } catch (error) {
    console.error("Error updating team problem statement:", error);
    return NextResponse.json(
      { error: "Failed to update problem statement" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoose();

    // Find the team where user is the leader
    const team = await Team.findOne({
      leaderUserId: session.user.email,
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found or you are not the team leader" },
        { status: 404 }
      );
    }

    // Remove problem statement selection
    team.problemStatement = null as any;
    await team.save();

    return NextResponse.json({
      message: "Problem statement selection removed successfully",
      team: {
        id: team._id,
        name: team.name,
        problemStatement: null,
      },
    });
  } catch (error) {
    console.error("Error removing team problem statement:", error);
    return NextResponse.json(
      { error: "Failed to remove problem statement" },
      { status: 500 }
    );
  }
}
