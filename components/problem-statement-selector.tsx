"use client";

import React, { useState, useEffect } from "react";
import problemStatementsData from "../app/data/problem-statements.json";

type ProblemStatement = {
  id: string;
  title: string;
  category: string;
  theme: string;
  description: string;
  complexity: string;
  domain: string;
  organization: string;
  techStack: string[];
  expectedOutcome: string;
  prizes: {
    winner: string;
    runnerUp1: string;
    runnerUp2: string;
  };
};

type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
};

interface ProblemStatementSelectorProps {
  value: string;
  onChange: (key: string, value: string) => void;
  field: any;
}

const ProblemStatementSelector: React.FC<ProblemStatementSelectorProps> = ({
  value,
  onChange,
  field,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [complexityFilter, setComplexityFilter] = useState<string>("all");

  const categories: Category[] = problemStatementsData.categories;
  const problemStatements: ProblemStatement[] =
    problemStatementsData.problemStatements;

  // Filter problem statements based on category, search, and complexity
  const filteredProblems = problemStatements.filter((problem) => {
    const matchesCategory =
      selectedCategory === "all" || problem.category === selectedCategory;
    const matchesSearch =
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesComplexity =
      complexityFilter === "all" || problem.complexity === complexityFilter;

    return matchesCategory && matchesSearch && matchesComplexity;
  });

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Low":
        return "text-green-600 bg-green-50 border-green-200";
      case "Medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "High":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getCategoryColor = (color: string) => {
    const colors = {
      blue: "from-blue-500 to-blue-600",
      gray: "from-gray-500 to-gray-600",
      green: "from-green-500 to-green-600",
      purple: "from-purple-500 to-purple-600",
      indigo: "from-indigo-500 to-indigo-600",
    };
    return colors[color as keyof typeof colors] || "from-gray-500 to-gray-600";
  };

  const selectedProblem = problemStatements.find((p) => p.id === value);

  return (
    <div className="space-y-6">
      {/* Selected Problem Display */}
      {selectedProblem && (
        <div className="glass-effect rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                  Selected
                </span>
                <span className="text-sm font-medium text-gray-600">
                  {selectedProblem.id}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                {selectedProblem.title}
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                {selectedProblem.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  {selectedProblem.theme}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getComplexityColor(selectedProblem.complexity)}`}
                >
                  {selectedProblem.complexity}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange(field.key, "")}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {!selectedProblem && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search problem statements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={complexityFilter}
              onChange={(e) => setComplexityFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Complexities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">
              Filter by Category
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    selectedCategory === category.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Problem Statements Grid */}
      {!selectedProblem && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Available Problem Statements ({filteredProblems.length})
            </h4>
          </div>

          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {filteredProblems.map((problem) => (
              <div
                key={problem.id}
                className="glass-effect rounded-xl border border-white/20 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => onChange(field.key, problem.id)}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-500">
                          {problem.id}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getComplexityColor(problem.complexity)}`}
                        >
                          {problem.complexity}
                        </span>
                      </div>
                      <h5 className="font-semibold text-primary group-hover:text-blue-600 transition-colors">
                        {problem.title}
                      </h5>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDetails(
                            showDetails === problem.id ? null : problem.id
                          );
                        }}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        {showDetails === problem.id ? "Hide" : "Details"}
                      </button>
                    </div>
                  </div>

                  {/* Theme and Organization */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800">
                      {problem.theme}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                      {problem.domain}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {problem.description}
                  </p>

                  {/* Tech Stack Preview */}
                  <div className="flex flex-wrap gap-1">
                    {problem.techStack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700"
                      >
                        {tech}
                      </span>
                    ))}
                    {problem.techStack.length > 3 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        +{problem.techStack.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Detailed View */}
                  {showDetails === problem.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 animate-in fade-in-50">
                      <div>
                        <h6 className="text-sm font-semibold text-gray-700 mb-1">
                          Organization
                        </h6>
                        <p className="text-sm text-gray-600">
                          {problem.organization}
                        </p>
                      </div>

                      <div>
                        <h6 className="text-sm font-semibold text-gray-700 mb-1">
                          Expected Outcome
                        </h6>
                        <p className="text-sm text-gray-600">
                          {problem.expectedOutcome}
                        </p>
                      </div>

                      <div>
                        <h6 className="text-sm font-semibold text-gray-700 mb-1">
                          Technology Stack
                        </h6>
                        <div className="flex flex-wrap gap-1">
                          {problem.techStack.map((tech) => (
                            <span
                              key={tech}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-700"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h6 className="text-sm font-semibold text-gray-700 mb-1">
                          Prize Money
                        </h6>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-center">
                            <div className="font-semibold text-yellow-800">
                              Winner
                            </div>
                            <div className="text-yellow-600">
                              {problem.prizes.winner}
                            </div>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                            <div className="font-semibold text-gray-800">
                              1st Runner-up
                            </div>
                            <div className="text-gray-600">
                              {problem.prizes.runnerUp1}
                            </div>
                          </div>
                          <div className="bg-orange-50 border border-orange-200 rounded p-2 text-center">
                            <div className="font-semibold text-orange-800">
                              2nd Runner-up
                            </div>
                            <div className="text-orange-600">
                              {problem.prizes.runnerUp2}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Select Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(field.key, problem.id);
                      }}
                    >
                      Select This Problem Statement
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProblems.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">🔍</div>
              <p className="text-gray-600 font-medium">
                No problem statements found
              </p>
              <p className="text-gray-500 text-sm">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemStatementSelector;
