import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { role, difficulty, roundNumber } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Progressive difficulty: rounds 1-2 are beginner-friendly, then ramp up
    const complexityGuide: Record<number, { label: string; urgency: string; systems: number; hint: string }> = {
      1: { label: "very simple, single obvious issue, easy to diagnose", urgency: "Low", systems: 1, hint: "Make symptoms very obvious and the cause clear. Use everyday language." },
      2: { label: "simple, one clear problem with a straightforward fix", urgency: "Low", systems: 1, hint: "Slightly more technical but still beginner-friendly." },
      3: { label: "moderate, involves 2 systems with some investigation needed", urgency: "Medium", systems: 2, hint: "Player should need to check logs or metrics." },
      4: { label: "moderate-hard, multi-service with some ambiguity", urgency: "High", systems: 2, hint: "Requires checking multiple data sources." },
      5: { label: "hard, multi-service cascading issue with real production pressure", urgency: "High", systems: 3, hint: "Requires systematic diagnosis." },
      6: { label: "critical, production-wide outage affecting customers", urgency: "Critical", systems: 3, hint: "Multiple simultaneous failures." },
      7: { label: "extreme, cascading failures across infrastructure", urgency: "Critical", systems: 4, hint: "Expert-level diagnosis required." },
    };
    const level = complexityGuide[Math.min(roundNumber, 7)] || complexityGuide[7];

    const systemPrompt = `You are a scenario generator for an IT operations training game. Generate a realistic crisis scenario matching the player's current level.

Role: ${role}
Difficulty: ${difficulty}
Round: ${roundNumber} of 7+
Level: ${level.label}
Hint for generation: ${level.hint}

IMPORTANT RULES:
- Round 1-2: Use simple, everyday language. Avoid jargon. The problem and solution should be fairly obvious.
- Round 3-4: Introduce some technical terms. Problem needs a bit of investigation.
- Round 5+: Full technical complexity. Multiple systems. Expert terminology.
- Keep descriptions SHORT and CLEAR (2-3 sentences max).
- Make symptoms SPECIFIC and actionable (e.g., "Users get 502 Bad Gateway" not vague "system issues").

Generate EXACTLY this JSON (no markdown, no extra text):
{
  "company": "<fictional company name>",
  "title": "<short crisis title, max 6 words>",
  "description": "<2-3 sentence description of what's happening, level-appropriate language>",
  "symptoms": ["<specific symptom 1>", "<specific symptom 2>", "<specific symptom 3>"],
  "urgency": "${level.urgency}",
  "systems_affected": ["<system 1>"${level.systems > 1 ? ', "<system 2>"' : ""}${level.systems > 2 ? ', "<system 3>"' : ""}]
}

Round ${roundNumber}: ${level.label}.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Generate the scenario now." },
          ],
          temperature: 0.9,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please wait." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("Scenario generation failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let scenario;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      scenario = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      scenario = {
        company: "TechCorp",
        title: "System Outage",
        description: "A critical production issue has been detected. Users are reporting errors.",
        symptoms: ["500 errors", "Slow response times", "Failed logins"],
        urgency: "High",
        systems_affected: ["API Gateway", "Database"],
      };
    }

    return new Response(JSON.stringify(scenario), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-scenario error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
