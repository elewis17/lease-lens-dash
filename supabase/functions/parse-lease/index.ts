import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Only allow your app to call this function.
// Add your local dev URL and production domain(s) here.
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://<your-prod-domain>",      // e.g. https://lease-lens.app
  "https://<your-gh-pages-domain>",  // e.g. https://USERNAME.github.io/REPO
]);

function makeCors(origin: string | null) {
  const safeOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": safeOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ll-key",
  };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = makeCors(origin);

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require a shared secret header so random callers can’t use your function.
  const clientSecret = req.headers.get("x-ll-key");
  const EDGE_SHARED_SECRET = Deno.env.get("EDGE_SHARED_SECRET");
  if (!EDGE_SHARED_SECRET || clientSecret !== EDGE_SHARED_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Parsing lease document with AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a lease document parser. Extract key information from lease documents and return structured JSON. Focus on accuracy.`
          },
          {
            role: "user",
            content: `Extract the following information from this lease document and return ONLY a valid JSON object with these fields:
{
  "tenantName": "string",
  "landlordName": "string",
  "propertyAddress": "string",
  "unitNumber": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "monthlyRent": number,
  "securityDeposit": number,
  "lateFeeAmount": number,
  "gracePeriodDays": number,
  "noticeDays": number,
  "utilities": "string",
  "confidence": number (0-1)
}

Lease document text:
${text}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_lease_data",
              description: "Extract structured data from a lease document",
              parameters: {
                type: "object",
                properties: {
                  tenantName: { type: "string" },
                  landlordName: { type: "string" },
                  propertyAddress: { type: "string" },
                  unitNumber: { type: "string" },
                  startDate: { type: "string" },
                  endDate: { type: "string" },
                  monthlyRent: { type: "number" },
                  securityDeposit: { type: "number" },
                  lateFeeAmount: { type: "number" },
                  gracePeriodDays: { type: "number" },
                  noticeDays: { type: "number" },
                  utilities: { type: "string" },
                  confidence: { type: "number" }
                },
                required: ["tenantName", "propertyAddress", "startDate", "endDate", "monthlyRent"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_lease_data" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    console.log("AI response received");

    const toolCall = aiResponse.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const parsedData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error parsing lease:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
