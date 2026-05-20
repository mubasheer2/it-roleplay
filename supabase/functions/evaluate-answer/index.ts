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
    const { role, scenario, answer, difficulty, roundNumber, chatHistory } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isEarlyRound = roundNumber <= 2;
    const systemPrompt = `You are a friendly IT mentor evaluating answers in the "IT Play Roles" training game.

Player role: ${role}
Difficulty: ${difficulty}
Round: ${roundNumber}

EVALUATION RULES:
${isEarlyRound ? `- This is an EARLY round. Be ENCOURAGING and GENEROUS. Even partial answers should score 5+.
- Accept simple answers. Don't expect technical jargon from beginners.
- If user shows any correct thinking, reward it generously.
- Explain concepts in SIMPLE language, like teaching a friend.
- Focus on teaching, not testing.` : roundNumber <= 4 ? `- This is a MID round. Balance encouragement with technical accuracy.
- Expect some technical knowledge but still be supportive.
- Provide clear explanations with practical examples.` : `- This is an ADVANCED round. Be strict and realistic.
- Expect detailed, professional-grade answers.
- Use technical terminology in feedback.
- Hold high standards.`}
- Support Hindi, English, and Hinglish responses.
- Keep "best_solution" steps SHORT and CLEAR (max 6 steps).
- Make feedback friendly and actionable, not intimidating.

RESPOND IN THIS EXACT JSON FORMAT (no markdown, just raw JSON):
{
  "score": <number 0-10>,
  "verdict": "<one of: Excellent|Good|Average|Needs Improvement|Incorrect>",
  "correct_points": ["<what user got right, be specific>"],
  "wrong_points": ["<what user missed, explained simply>"],
  "best_solution": ["<step 1 - short and clear>", "<step 2>", "<step 3>", ...],
  "tip": "<one friendly, practical tip relevant to this scenario>",
  "follow_up_scenario": ${isEarlyRound ? '"<encouraging message telling user what to try next time, in simple words>"' : '"<if score >= 7, a harder follow-up scenario. If score < 7, a helpful hint to try again.>"'}
}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(chatHistory || []),
      {
        role: "user",
        content: `SCENARIO: ${scenario}\n\nUSER'S ANSWER: ${answer}\n\nEvaluate this answer.`,
      },
    ];

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
          messages,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI evaluation failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse JSON from the AI response
    let evaluation;
    try {
      // Try to extract JSON from the response (sometimes wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      evaluation = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      evaluation = {
        score: 5,
        verdict: "Average",
        correct_points: ["Partial understanding shown"],
        wrong_points: ["Could not fully evaluate - please provide more detail"],
        best_solution: ["Please try again with a more detailed response"],
        tip: "Be specific about the tools and commands you would use.",
        follow_up_scenario: null,
      };
    }

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-answer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
