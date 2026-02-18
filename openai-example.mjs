import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.responses.create({
  model: "gpt-4.1",
  input: "Summarize my last 10 orders and tell me what to optimize.",
});

console.log(response.output_text);
