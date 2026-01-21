import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, getSafeErrorMessage } from "../_shared/security.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Rate limiting check
    const { data: rateLimitCheck } = await supabase.rpc('check_rate_limit', {
      _user_id: user.id,
      _action: 'extract_medicine',
      _max_requests: 10,
      _window_minutes: 60
    });
    
    if (rateLimitCheck && !rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: getSafeErrorMessage(new Error("API configuration error"), "medicine extraction") }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
            content: `You are a medical assistant that extracts medicine information from prescription images or medicine packaging photos. 
Extract all medicine names, dosages, and instructions visible in the image.
Always return structured data using the provided tool.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please extract all medicine names, dosages, and instructions from this image. If you cannot read the image clearly, return what you can identify."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_medicines",
              description: "Extract medicine information from the image",
              parameters: {
                type: "object",
                properties: {
                  medicines: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Medicine name" },
                        dosage: { type: "string", description: "Dosage amount (e.g., 500mg, 10ml)" },
                        instructions: { type: "string", description: "Usage instructions if visible" },
                        frequency: { type: "string", description: "How often to take (e.g., twice daily, once at bedtime)" }
                      },
                      required: ["name"]
                    }
                  },
                  confidence: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Confidence level of the extraction"
                  },
                  notes: {
                    type: "string",
                    description: "Any additional notes or warnings"
                  }
                },
                required: ["medicines", "confidence"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_medicines" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ error: "Failed to process image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const extracted = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify(extracted),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ medicines: [], confidence: "low", notes: "Could not extract medicine information from image" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("extract-medicine error:", error);
    return new Response(
      JSON.stringify({ error: getSafeErrorMessage(error, "medicine extraction") }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
