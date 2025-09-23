"use client";

import React, { useState } from "react";

interface ExportOptionsProps {
  onClose?: () => void;
}

export default function ExportOptions({ onClose }: ExportOptionsProps) {
  const [format, setFormat] = useState("excel");
  const [sheets, setSheets] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        format,
        sheets,
      });

      const url = `/api/dashboard/export?${params.toString()}`;

      // Create a temporary link and click it to download the file
      const link = document.createElement("a");
      link.href = url;
      link.download = `sih-internals-export-${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (onClose) onClose();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-effect rounded-2xl max-w-md w-full p-6 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export Options
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <svg
                className="w-5 h-5"
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
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={format === "excel"}
                  onChange={(e) => setFormat(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    format === "excel" ? "border-blue-500" : "border-gray-300"
                  }`}
                >
                  {format === "excel" && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <div>
                    <div className="font-medium">Excel (.xlsx)</div>
                    <div className="text-xs text-gray-500">
                      Best for data analysis with multiple sheets
                    </div>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === "csv"}
                  onChange={(e) => setFormat(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    format === "csv" ? "border-blue-500" : "border-gray-300"
                  }`}
                >
                  {format === "csv" && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📄</span>
                  <div>
                    <div className="font-medium">CSV (.csv)</div>
                    <div className="text-xs text-gray-500">
                      Compatible with most spreadsheet applications
                    </div>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === "json"}
                  onChange={(e) => setFormat(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    format === "json" ? "border-blue-500" : "border-gray-300"
                  }`}
                >
                  {format === "json" && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔧</span>
                  <div>
                    <div className="font-medium">JSON (.json)</div>
                    <div className="text-xs text-gray-500">
                      For developers and API integration
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Data Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Data to Include
            </label>
            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="sheets"
                  value="all"
                  checked={sheets === "all"}
                  onChange={(e) => setSheets(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    sheets === "all" ? "border-green-500" : "border-gray-300"
                  }`}
                >
                  {sheets === "all" && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <div>
                    <div className="font-medium">Complete Dataset</div>
                    <div className="text-xs text-gray-500">
                      Participants, teams, analytics & summary
                    </div>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="sheets"
                  value="participants"
                  checked={sheets === "participants"}
                  onChange={(e) => setSheets(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    sheets === "participants"
                      ? "border-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {sheets === "participants" && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  <div>
                    <div className="font-medium">Participants Only</div>
                    <div className="text-xs text-gray-500">
                      Individual registration data
                    </div>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="sheets"
                  value="teams"
                  checked={sheets === "teams"}
                  onChange={(e) => setSheets(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    sheets === "teams" ? "border-green-500" : "border-gray-300"
                  }`}
                >
                  {sheets === "teams" && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <div>
                    <div className="font-medium">Teams Only</div>
                    <div className="text-xs text-gray-500">
                      Team formation and problem statements
                    </div>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="sheets"
                  value="analytics"
                  checked={sheets === "analytics"}
                  onChange={(e) => setSheets(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    sheets === "analytics"
                      ? "border-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {sheets === "analytics" && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📈</span>
                  <div>
                    <div className="font-medium">Analytics Only</div>
                    <div className="text-xs text-gray-500">
                      Statistics and insights
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Export Preview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">Export Preview</h4>
            <div className="text-sm text-blue-700">
              <div>
                Format:{" "}
                <span className="font-medium">{format.toUpperCase()}</span>
              </div>
              <div>
                Data:{" "}
                <span className="font-medium">
                  {sheets === "all"
                    ? "Complete Dataset"
                    : sheets === "participants"
                      ? "Participants Only"
                      : sheets === "teams"
                        ? "Teams Only"
                        : "Analytics Only"}
                </span>
              </div>
              <div className="mt-2 text-xs text-blue-600">
                {format === "excel" &&
                  "📊 Multiple sheets with auto-fitted columns"}
                {format === "csv" &&
                  "📄 Comma-separated values for easy import"}
                {format === "json" && "🔧 Structured data with nested objects"}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Exporting...
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export Data
                </>
              )}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
