"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [overview, setOverview] = useState("");
  const [requirements, setRequirements] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!overview.trim()) {
      setError("プロジェクト概要を入力してください");
      return;
    }

    setIsLoading(true);
    setError("");
    setRequirements("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overview }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "エラーが発生しました");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("ストリームの読み込みに失敗しました");

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setRequirements((prev) => prev + decoder.decode(value));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(requirements);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setOverview("");
    setRequirements("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">要件定義ジェネレーター</h1>
          <p className="text-sm text-gray-500 mt-0.5">プロジェクト概要を入力するだけで、AIが要件定義書を自動生成します</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!requirements ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクト概要
            </label>
            <textarea
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder={`例：\nクリエイターと企業のマッチングプラットフォームを運営しています。担当者の工数削減のため、企業の課題概要を入力すると要件定義書が自動生成されるWebアプリを作りたいです。`}
              className="w-full h-52 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-800 placeholder-gray-400"
              disabled={isLoading}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={isLoading || !overview.trim()}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    生成中...
                  </span>
                ) : "要件定義を生成"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">要件定義書</h2>
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {copied ? "コピーしました" : "コピー"}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  新規作成
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700">
                <ReactMarkdown>{requirements}</ReactMarkdown>
              </div>
              {isLoading && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  生成中...
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
