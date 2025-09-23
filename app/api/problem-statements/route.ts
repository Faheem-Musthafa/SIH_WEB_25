import { NextRequest, NextResponse } from "next/server";
import problemStatementsData from "../../../app/data/problem-statements.json";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const complexity = searchParams.get("complexity");
    const search = searchParams.get("search");

    let filteredStatements = problemStatementsData.problemStatements;

    // Filter by category
    if (category && category !== "all") {
      filteredStatements = filteredStatements.filter(
        (statement) => statement.category === category
      );
    }

    // Filter by complexity
    if (complexity && complexity !== "all") {
      filteredStatements = filteredStatements.filter(
        (statement) => statement.complexity === complexity
      );
    }

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase();
      filteredStatements = filteredStatements.filter(
        (statement) =>
          statement.title.toLowerCase().includes(searchLower) ||
          statement.description.toLowerCase().includes(searchLower) ||
          statement.theme.toLowerCase().includes(searchLower) ||
          statement.domain.toLowerCase().includes(searchLower) ||
          statement.techStack.some((tech) =>
            tech.toLowerCase().includes(searchLower)
          )
      );
    }

    return NextResponse.json({
      categories: problemStatementsData.categories,
      problemStatements: filteredStatements,
      total: filteredStatements.length,
    });
  } catch (error) {
    console.error("Error fetching problem statements:", error);
    return NextResponse.json(
      { error: "Failed to fetch problem statements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { problemStatementId } = await request.json();

    // Find the problem statement
    const problemStatement = problemStatementsData.problemStatements.find(
      (ps) => ps.id === problemStatementId
    );

    if (!problemStatement) {
      return NextResponse.json(
        { error: "Problem statement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Problem statement retrieved successfully",
      problemStatement,
    });
  } catch (error) {
    console.error("Error retrieving problem statement:", error);
    return NextResponse.json(
      { error: "Failed to retrieve problem statement" },
      { status: 500 }
    );
  }
}
