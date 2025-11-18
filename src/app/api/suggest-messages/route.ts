import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Must use Edge runtime for streaming
// export const runtime = "edge";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

export async function POST(req: Request) {
  try {
    const prompt =
      "Create a list of three open-ended and engaging questions formatted as a single string. Each question should be separated by '||'. These questions are for an anonymous social messaging platform, like Qooh.me, and should be suitable for a diverse audience. Avoid personal or sensitive topics, focusing instead on universal themes that encourage friendly interaction. For example, your output should be structured like this: 'What’s a hobby you’ve recently started?||If you could have dinner with any historical figure, who would it be?||What’s a simple thing that makes you happy?'. Ensure the questions are intriguing, foster curiosity, and contribute to a positive and welcoming conversational environment.";

    // 1️⃣ STREAM RESPONSE USING GEMINI
    const result = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // 2️⃣ CREATE A READABLE STREAM FOR NEXT.JS
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result) {
          const text = chunk.text ?? ""; // text from Gemini chunk
          console.log(text+"\n")
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(stream);
  } catch (err) {
    console.error("Gemini API Error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
