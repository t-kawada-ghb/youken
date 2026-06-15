import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `あなたは優秀なプロダクトマネージャー兼システムアーキテクトです。
ユーザーから提供されるプロジェクトの概要をもとに、詳細な要件定義書を作成してください。

以下の構成で要件定義書を作成してください：

## 1. プロジェクト概要
- 背景・現状の課題
- プロジェクトの目的
- 対象ユーザー

## 2. スコープ
- 対象範囲（In Scope）
- 対象外（Out of Scope）

## 3. 機能要件
各機能について「機能名」「説明」「優先度（高/中/低）」を記載

## 4. 非機能要件
- パフォーマンス要件
- セキュリティ要件
- 可用性・信頼性
- 拡張性・保守性

## 5. 制約条件・前提条件

## 6. 成功指標（KPI）

## 7. リスクと対策

## 8. 想定スケジュール（フェーズ分け）

マークダウン形式で、具体的かつ実用的な内容を記載してください。`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "APIキーが設定されていません。環境変数 ANTHROPIC_API_KEY を確認してください。" },
      { status: 500 }
    );
  }

  try {
    const { overview } = await req.json();

    if (!overview || typeof overview !== "string" || overview.trim() === "") {
      return NextResponse.json(
        { error: "プロジェクト概要を入力してください" },
        { status: 400 }
      );
    }

    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `以下のプロジェクト概要をもとに要件定義書を作成してください。\n\n${overview}`,
        },
      ],
    });

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(
              new TextEncoder().encode(chunk.delta.text)
            );
          }
        }
        controller.close();
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error generating requirements:", error);
    return NextResponse.json(
      { error: "要件定義の生成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
