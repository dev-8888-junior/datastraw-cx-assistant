const supabase = require("../supabase");

const getRelevantKnowledge = async (brandId, customerMessage) => {
  const { data, error } = await supabase
    .from("knowledge_base")
    .select("id, category, title, content")
    .eq("brand_id", brandId);

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return [];
  }

  const message = customerMessage.toLowerCase();

  const keywords = {
    return: ["return", "broken", "damaged", "defective"],
    refund: ["refund", "money back", "reimbursement"],
    shipping: ["shipping", "delivery", "delivered", "tracking"],
    cancellation: ["cancel", "cancellation"],
  };

  const relevantCategories = [];

  for (const category in keywords) {
    const matches = keywords[category].some((keyword) =>
      message.includes(keyword)
    );

    if (matches) {
      relevantCategories.push(category);
    }
  }

  const relevantKnowledge = data.filter((item) =>
    relevantCategories.includes(item.category)
  );

  return relevantKnowledge;
};

module.exports = {
  getRelevantKnowledge,
};