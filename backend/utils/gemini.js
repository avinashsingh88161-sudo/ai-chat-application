import "dotenv/config";
import dns from "dns";

// Fix Windows DNS SRV/API lookup issues
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const MODELS = [
  "gemini-2.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  "gemma-4-31b-it",
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const streamGeminiAIAPIResponse = async (contents, onChunk) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in .env file");
  }

  const formattedContents =
    typeof contents === "string"
      ? [{ role: "user", parts: [{ text: contents }] }]
      : contents;

  let lastError = null;

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Stream AI] Calling model: ${model} (attempt ${attempt})...`);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: formattedContents,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errMsg =
            errorData.error?.message || `HTTP error ${response.status}`;
          throw new Error(errMsg);
        }

        let fullText = "";
        let buffer = "";

        for await (const chunk of response.body) {
          buffer += Buffer.from(chunk).toString("utf-8");
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const json = JSON.parse(line.slice(6));
                const textPart =
                  json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textPart) {
                  fullText += textPart;
                  if (onChunk) {
                    onChunk(textPart);
                  }
                }
              } catch (e) {
                // Ignore partial JSON parse errors
              }
            }
          }
        }

        if (fullText.trim().length > 0) {
          console.log(`[Stream AI] Successfully streamed with model: ${model}`);
          return fullText;
        }

        throw new Error(`Empty response generated from ${model}`);
      } catch (err) {
        console.warn(
          `[Stream AI Warning] Model ${model} attempt ${attempt} failed (${err.message})`
        );
        lastError = err;

        // Auto-pause if hit by temporary Google rate-limit or high-demand spike
        if (
          err.message.includes("demand") ||
          err.message.includes("quota") ||
          err.message.includes("429") ||
          err.message.includes("503")
        ) {
          await wait(1200);
        }
      }
    }
  }

  console.error("All Gemini streaming models failed:", lastError?.message);
  throw lastError || new Error("Failed to get response from AI model.");
};

export const getGeminiAIAPIResponse = async (contents) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in .env file");
  }

  const formattedContents =
    typeof contents === "string"
      ? [{ role: "user", parts: [{ text: contents }] }]
      : contents;

  let lastError = null;

  for (const model of MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: formattedContents,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `HTTP error ${response.status}`
        );
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to get response from AI model.");
};

export default getGeminiAIAPIResponse;
