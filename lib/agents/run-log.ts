import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function startAgentRun(agentName: string, inputSummary?: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("agent_runs").insert({
    agent_name: agentName,
    status: "running",
    input_summary: inputSummary,
  }).select("id").single();

  return data?.id as string | undefined;
}

export async function finishAgentRun(id: string | undefined, status: "success" | "error", outputSummary?: string, errorMessage?: string) {
  if (!id) return;

  const supabase = createSupabaseAdminClient();
  await supabase.from("agent_runs").update({
    status,
    output_summary: outputSummary,
    error_message: errorMessage,
    finished_at: new Date().toISOString(),
  }).eq("id", id);
}
