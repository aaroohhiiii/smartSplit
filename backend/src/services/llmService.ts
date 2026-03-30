import fs from "fs";
import path from "path";

interface BillParsingResult {
  items: Array<{
    name: string;
    amount: number;
    category: string;
  }>;
  totalAmount: number;
  taxAmount: number;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Parse bill image/PDF using Groq API with Vision capabilities
 * Supports JPEG, PNG, PDF files
 */
export const parseBillWithGroq = async (fileBuffer: Buffer, filePath: string): Promise<BillParsingResult> => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable not set");
  }

  // Convert to base64
  const base64Data = fileBuffer.toString("base64");

  // Determine media type
  const ext = path.extname(filePath).toLowerCase();
  let mediaType = "image/jpeg";
  if (ext === ".png") mediaType = "image/png";
  if (ext === ".pdf") mediaType = "application/pdf";

  const prompt = `You are an expert at parsing restaurant/food delivery bills and receipts. 
Analyze this bill/receipt image and extract the following information in JSON format:

{
  "items": [
    {
      "name": "Item name",
      "amount": numeric_amount_in_currency,
      "category": "veg|non_veg|alcohol|shared"
    }
  ],
  "totalAmount": numeric_total_before_tax,
  "taxAmount": numeric_tax_amount
}

Guidelines for categorization:
- "veg": Vegetarian items (paneer, vegetables, bread, rice, etc.)
- "non_veg": Non-vegetarian items (chicken, meat, fish, seafood, eggs, etc.)
- "alcohol": Alcoholic beverages (beer, wine, whiskey, etc.)
- "shared": Common items like water, soft drinks, or service charges

Important:
1. Extract ONLY the food/drink items, NOT service charges or tips
2. If service charge exists, include it as part of the totalAmount
3. Return ONLY valid JSON, no markdown or extra text
4. If you cannot parse the bill clearly, return reasonable estimates based on what you can see
5. All amounts should be numeric values`;

  try {
    console.log("[GROQ] Starting bill parsing...");
    console.log("[GROQ] File path:", filePath);
    console.log("[GROQ] Media type:", mediaType);
    console.log("[GROQ] Base64 length:", base64Data.length);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
     body: JSON.stringify({
  model: "meta-llama/llama-4-scout-17b-16e-instruct", // Using vision-capable model
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mediaType};base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        temperature: 0.3, // Low temperature for consistent extraction
        max_tokens: 1024,
      }),
    });

    console.log("[GROQ] Response status:", response.status);

    if (!response.ok) {
      const error = await response.json() as unknown;
      console.error("[GROQ] API error response:", error);
      const errorMessage = typeof error === 'object' && error !== null && 'error' in error && typeof (error as any).error?.message === 'string' ? (error as any).error.message : "Unknown error";
      throw new Error(`Groq API error: ${errorMessage}`);
    }

    let data: GroqResponse;
    try {
      data = await response.json() as GroqResponse;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new Error(`Failed to parse Groq API response: ${err.message || "Unknown error"}`);
    }
    console.log("[GROQ] API response received");
    
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from Groq API");
    }

    console.log("[GROQ] Content received:", content.substring(0, 100));

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Groq response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("[GROQ] Parsed JSON successfully");

    // Validate and sanitize response
    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error("Invalid items array in response");
    }

    // Ensure all amounts are numbers
    const items = parsed.items.map((item: any) => ({
      name: String(item.name || "Unknown Item"),
      amount: Math.max(0, Number(item.amount) || 0),
      category: String(item.category || "shared").toLowerCase(),
    }));

    const totalAmount = Math.max(0, Number(parsed.totalAmount) || 0);
    const taxAmount = Math.max(0, Number(parsed.taxAmount) || 0);

    console.log("[GROQ] Bill parsing successful. Items:", items.length);

    return {
      items,
      totalAmount,
      taxAmount,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    throw new Error(`Groq API error: ${err.message || "Unknown error"}`);
  }
};

/**
 * Validate bill parsing result
 */
export const validateBillParsing = (result: BillParsingResult): string[] => {
  const errors: string[] = [];

  if (!result.items || result.items.length === 0) {
    errors.push("No items found in bill");
  }

  if (result.totalAmount <= 0) {
    errors.push("Invalid total amount");
  }

  if (result.taxAmount < 0) {
    errors.push("Invalid tax amount");
  }

  // Check for items with zero or negative amounts
  result.items.forEach((item, idx) => {
    if (item.amount <= 0) {
      errors.push(`Item ${idx + 1} has invalid amount`);
    }
    if (!item.name) {
      errors.push(`Item ${idx + 1} has no name`);
    }
  });

  return errors;
};
