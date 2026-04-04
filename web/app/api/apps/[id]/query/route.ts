import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { runAgentTurn, buildSystemPrompt, type Message } from "@/lib/agent/runner";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await supabase
    .from("users")
    .select("id, role")
    .eq("email", session.user!.email!)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Members need explicit app access
  if (user.role === "member") {
    const { data: membership } = await supabase
      .from("app_members")
      .select("app_id")
      .eq("app_id", params.id)
      .eq("user_id", user.id)
      .single();

    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { datasetId, question, history } = (await req.json()) as {
    datasetId: string;
    question: string;
    history?: Message[];
  };

  if (!datasetId || !question?.trim()) {
    return NextResponse.json(
      { error: "datasetId and question are required" },
      { status: 400 }
    );
  }

  // Fetch the selected dataset
  const { data: dataset } = await supabase
    .from("app_datasets")
    .select("gcp_project_id, dataset_id")
    .eq("id", datasetId)
    .eq("app_id", params.id)
    .single();

  if (!dataset) return NextResponse.json({ error: "Dataset not found" }, { status: 404 });

  // Fetch entity files list for system prompt
  const { data: files } = await supabase
    .from("app_files")
    .select("file_path, category")
    .eq("app_id", params.id)
    .order("file_path");

  const datasetRef = {
    projectId: dataset.gcp_project_id,
    datasetId: dataset.dataset_id,
  };

  const systemPrompt = buildSystemPrompt(datasetRef, files ?? []);
  const messages: Message[] = [...(history ?? []), { role: "user", content: question }];

  const result = await runAgentTurn(messages, {
    appId: params.id,
    datasetRef,
    accessToken: session.accessToken,
    systemPrompt,
  });

  return NextResponse.json({
    answer: result.finalText,
    clarification: result.clarification,
    history: messages,
  });
}
