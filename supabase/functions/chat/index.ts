import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSafeErrorMessage, isValidationError, getCorsHeaders } from "../_shared/security.ts";

// Input validation schemas (inline to avoid import issues in edge functions)
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  messageType: 'health' | 'wellness';
}

function validateChatRequest(data: unknown): ChatRequest {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const obj = data as Record<string, unknown>;
  
  // Validate messageType
  if (!obj.messageType || !['health', 'wellness'].includes(obj.messageType as string)) {
    throw new Error('Invalid messageType: must be "health" or "wellness"');
  }
  
  // Validate messages array
  if (!Array.isArray(obj.messages) || obj.messages.length === 0) {
    throw new Error('Messages must be a non-empty array');
  }
  
  if (obj.messages.length > 50) {
    throw new Error('Too many messages: maximum 50 allowed');
  }
  
  const validRoles = ['user', 'assistant', 'system'];
  const validatedMessages: ChatMessage[] = [];
  
  for (const msg of obj.messages) {
    if (!msg || typeof msg !== 'object') {
      throw new Error('Each message must be an object');
    }
    
    const msgObj = msg as Record<string, unknown>;
    
    if (!msgObj.role || !validRoles.includes(msgObj.role as string)) {
      throw new Error('Invalid message role: must be "user", "assistant", or "system"');
    }
    
    if (typeof msgObj.content !== 'string') {
      throw new Error('Message content must be a string');
    }
    
    // Limit content length to prevent abuse
    if (msgObj.content.length > 5000) {
      throw new Error('Message content too long: maximum 5000 characters');
    }
    
    validatedMessages.push({
      role: msgObj.role as 'user' | 'assistant' | 'system',
      content: msgObj.content.trim()
    });
  }
  
  return {
    messages: validatedMessages,
    messageType: obj.messageType as 'health' | 'wellness'
  };
}

// Basic sanitization for AI input
function sanitizeForAI(content: string): string {
  // Remove potential prompt injection patterns
  return content
    .replace(/\{[^}]*\}/g, '') // Remove JSON-like structures
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .trim()
    .slice(0, 5000); // Enforce max length
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Validate and parse input
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      throw new Error("Invalid JSON body");
    }
    
    const { messages, messageType } = validateChatRequest(rawBody);
    
    console.log(`Chat request from user ${user.id}: ${messages.length} messages, type: ${messageType}`);

    // Rate limiting check
    const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      _user_id: user.id,
      _action: 'ai_chat',
      _max_requests: 30,
      _window_minutes: 60
    });

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
      // Continue without rate limiting if check fails (graceful degradation)
    } else if (rateLimitCheck && !rateLimitCheck.allowed) {
      console.log(`Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ error: "You've sent too many messages. Please wait a few minutes before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construct system prompt to return structured JSON
    const systemPrompts = {
      health: `You are a health advisor for CareForAll. You MUST respond with a valid JSON object in this exact format:

{
  "summary": "A brief 1-2 sentence summary of the health concern and general advice",
  "remedies": [
    "First specific remedy or solution",
    "Second remedy or solution",
    "Third remedy or solution"
  ],
  "precautions": "Important precautions to keep in mind (1-2 sentences)",
  "consultDoctor": "When the user should see a doctor (1-2 sentences)"
}

Rules:
- Keep each remedy to ONE clear sentence
- Provide 3-5 remedies maximum
- Be practical and actionable
- Include home remedies and lifestyle tips
- ONLY output the JSON object, nothing else`,
      wellness: `You are a mental wellness companion for CareForAll. You MUST respond with a valid JSON object in this exact format:

{
  "summary": "A brief empathetic 1-2 sentence acknowledgment and overview",
  "remedies": [
    "First coping strategy or technique",
    "Second coping strategy",
    "Third technique"
  ],
  "precautions": "Important self-care reminders (1-2 sentences)",
  "consultDoctor": "When professional help may be beneficial (1-2 sentences)"
}

Rules:
- Keep each strategy to ONE clear sentence
- Provide 3-5 strategies maximum
- Be warm and supportive
- Include practical techniques they can try now
- ONLY output the JSON object, nothing else`
    };

    // Sanitize user messages before sending to AI
    const sanitizedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.role === 'user' ? sanitizeForAI(msg.content) : msg.content
    }));

    // Call Lovable AI with tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompts[messageType] },
          ...sanitizedMessages,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_health_guidance",
              description: "Provide structured health guidance with summary, remedies, precautions, and when to consult a doctor",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Brief 1-2 sentence summary" },
                  remedies: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "List of 3-5 specific remedies or solutions"
                  },
                  precautions: { type: "string", description: "Important precautions" },
                  consultDoctor: { type: "string", description: "When to see a doctor" }
                },
                required: ["summary", "remedies", "precautions", "consultDoctor"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_health_guidance" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error("AI API error");
    }

    const aiData = await aiResponse.json();
    console.log("AI response received successfully");
    
    let structuredResponse;
    
    // Check if response has tool calls
    if (aiData.choices[0].message.tool_calls) {
      const toolCall = aiData.choices[0].message.tool_calls[0];
      structuredResponse = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse content as JSON
      const content = aiData.choices[0].message.content;
      try {
        structuredResponse = JSON.parse(content);
      } catch {
        // If parsing fails, create a simple structured response
        structuredResponse = {
          summary: content,
          remedies: [],
          precautions: "Please consult a healthcare provider for personalized advice.",
          consultDoctor: "If symptoms persist or worsen, please see a doctor."
        };
      }
    }

    // Save messages to database (store structured response as JSON string)
    const userMessage = messages[messages.length - 1].content;
    const assistantContent = JSON.stringify(structuredResponse);
    
    await supabase.from("chat_messages").insert([
      {
        user_id: user.id,
        message_type: messageType,
        role: "user",
        content: userMessage,
      },
      {
        user_id: user.id,
        message_type: messageType,
        role: "assistant",
        content: assistantContent,
      },
    ]);

    return new Response(JSON.stringify({ message: assistantContent, structured: structuredResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in chat function:", error);
    const safeMessage = getSafeErrorMessage(error, "chat");
    const statusCode = isValidationError(error) ? 400 : 500;
    
    return new Response(
      JSON.stringify({ error: safeMessage }),
      {
        status: statusCode,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
