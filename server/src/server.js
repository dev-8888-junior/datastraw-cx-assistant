const express = require("express");
const cors = require("cors");
require("dotenv").config();

const supabase = require("./supabase");
const { getRelevantKnowledge } = require("./services/knowledgeService");
const { generateReply } = require("./services/aiService");

const app = express();

app.use(cors());
app.use(express.json());

// Basic API test
app.get("/api/", (req, res) => {
  res.json({
    message: "Datastraw CX Assistant API is running",
  });
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("brands")
      .select("*");

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      brands: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Test knowledge base retrieval
app.get("/api/test-knowledge", async (req, res) => {
  try {
    const brandId = "6187b85d-a30b-4d46-8614-ec6d5f2de7b0";

    const customerMessage =
      "My order was delivered but the bottle is broken. What can I do?";

    const knowledge = await getRelevantKnowledge(
      brandId,
      customerMessage
    );

    res.json({
      success: true,
      knowledge,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Generate AI customer support reply
app.post("/api/generate-reply", async (req, res) => {
  try {
    const {
      brandId,
      customerMessage,
      customerName,
      orderNumber,
      orderStatus,
      product,
    } = req.body;

    if (!brandId || !customerMessage) {
      return res.status(400).json({
        success: false,
        error: "brandId and customerMessage are required",
      });
    }

    const knowledge = await getRelevantKnowledge(
      brandId,
      customerMessage
    );

    const reply = await generateReply({
      customerMessage,
      customerName,
      orderNumber,
      orderStatus,
      product,
      knowledge,
    });

    res.json({
      success: true,
      reply,
      knowledge,
    });
  } catch (error) {
    console.error("Generate reply error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get a conversation with customer, order, and brand information
app.get("/api/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        customer_name,
        customer_message,
        order_number,
        order_status,
        product,
        delivered_at,
        brand_id,
        brands (
          id,
          name
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      conversation: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
// Save approved AI reply to reply_logs
app.post("/api/reply-logs", async (req, res) => {
  try {
    const {
      conversationId,
      customerMessage,
      retrievedContext,
      aiGeneratedResponse,
      agentEditedResponse,
      finalResponse,
    } = req.body;

    if (
      !conversationId ||
      !customerMessage ||
      !aiGeneratedResponse ||
      !finalResponse
    ) {
      return res.status(400).json({
        success: false,
        error:
          "conversationId, customerMessage, aiGeneratedResponse, and finalResponse are required",
      });
    }

    const { data, error } = await supabase
      .from("reply_logs")
      .insert([
        {
          conversation_id: conversationId,
          customer_message: customerMessage,
          retrieved_context: retrievedContext,
          ai_generated_response: aiGeneratedResponse,
          agent_edited_response: agentEditedResponse || null,
          final_response: finalResponse,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      log: data,
    });
  } catch (error) {
    console.error("Save reply log error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});