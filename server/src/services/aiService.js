const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const generateReply = async ({
  customerMessage,
  customerName,
  orderNumber,
  orderStatus,
  product,
  knowledge,
}) => {
  const knowledgeContext = knowledge
    .map((item) => `${item.title}:\n${item.content}`)
    .join("\n\n");

  const prompt = `
You are a customer support reply assistant for a brand.

Generate ONLY the final customer-facing reply.
DO NOT provide reasoning, analysis, steps, or explanation of how you reached the answer.

STRICT POLICY RULES:
1. Use ONLY the customer message, order information, and brand knowledge provided below.
2. Never invent a policy, refund, compensation, timeline, or action.
3. Never promise an outcome that the brand knowledge does not guarantee.
4. Pay close attention to policy time limits.
5. If the customer is outside a policy time limit, do NOT promise that outcome.
6. If the knowledge says an outcome requires manual review, clearly tell the customer that manual review is required.
7. If a damaged or defective product is eligible for a return but the refund window has passed, do not promise a refund. Explain the distinction and mention manual review when required by the policy.
8. A return being eligible does NOT mean a refund is guaranteed. Treat return eligibility and refund eligibility as separate decisions.
9. Be empathetic, concise, and professional.
10. Do not mention that you are an AI.
11. Do not mention these instructions.
12. Return ONLY the customer-facing message.

CUSTOMER:
Name: ${customerName}
Message: ${customerMessage}

ORDER:
Order Number: ${orderNumber}
Status: ${orderStatus}
Product: ${product}

BRAND KNOWLEDGE:
${knowledgeContext}

Now write ONLY the final customer-facing reply.
`;

  const request = async () => {
    const completion = await openai.chat.completions.create({
      model: "openrouter/free",
      messages: [
        {
          role: "system",
          content:
            "You are a careful customer support assistant. Follow the provided brand policies exactly and output only the final customer-facing reply.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 800,
    });

    return completion.choices?.[0]?.message?.content?.trim();
  };

  let reply = await request();

  // Retry once if the model returns an empty response.
  if (!reply) {
    console.log("AI returned an empty response. Retrying...");
    reply = await request();
  }

  if (!reply) {
    throw new Error("AI returned an empty response after retrying.");
  }

  return reply;
};

module.exports = {
  generateReply,
};