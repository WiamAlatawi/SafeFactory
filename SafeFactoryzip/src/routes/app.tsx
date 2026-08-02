import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Workspace · SafeFactory" },
      { name: "description", content: "SafeFactory workspace for predictive maintenance intelligence." },
      { property: "og:title", content: "SafeFactory Workspace" },
      { property: "og:description", content: "Predict, diagnose and prioritize maintenance across your fleet." },
    ],
  }),
  component: AppShell,
});