import type { StepAction } from "@/types/pattern";

export const STEP_ACTIONS: { value: StepAction; label: string; description: string }[] = [
  { value: "NOTIFY", label: "通知", description: "メールやSlackで通知を送信" },
  { value: "VALIDATE", label: "検証", description: "入力データを検証" },
  { value: "TRANSFORM", label: "変換", description: "データを変換・加工" },
  { value: "WEBHOOK", label: "Webhook", description: "外部APIを呼び出し" },
  { value: "CONDITION", label: "条件分岐", description: "条件に基づいて処理を分岐" },
  { value: "DELAY", label: "遅延", description: "指定時間待機" },
];
