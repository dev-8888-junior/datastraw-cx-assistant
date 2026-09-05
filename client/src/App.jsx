import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CONVERSATION_ID =
  "fb4cb8f3-ae55-4b19-8e50-b9323596063d";

function App() {
  const [conversation, setConversation] = useState(null);
  const [customerMessage, setCustomerMessage] = useState("");
  const [reply, setReply] = useState("");
  const [originalReply, setOriginalReply] = useState("");
  const [knowledge, setKnowledge] = useState([]);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/conversations/${CONVERSATION_ID}`
        );

        setConversation(response.data.conversation);
        setCustomerMessage(
          response.data.conversation.customer_message
        );
      } catch (error) {
        console.error(error);
        setError("Failed to load conversation.");
      } finally {
        setLoadingConversation(false);
      }
    };

    fetchConversation();
  }, []);

  const generateReply = async () => {
    if (!conversation) return;

    const currentMessage = customerMessage;

    if (!currentMessage.trim()) {
      setError("Customer message cannot be empty.");
      return;
    }

    try {
      setGenerating(true);
      setApproved(false);
      setError("");

      const response = await axios.post(
        `${API_URL}/generate-reply`,
        {
          brandId: conversation.brand_id,
          customerMessage: currentMessage,
          customerName: conversation.customer_name,
          orderNumber: conversation.order_number,
          orderStatus: conversation.order_status,
          product: conversation.product,
        }
      );

      setReply(response.data.reply);
      console.log(
        "AI REPLY FROM BACKEND:",
        response.data.reply
      );
      setOriginalReply(response.data.reply);
      setKnowledge(response.data.knowledge);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.error ||
          "Failed to generate AI reply."
      );
    } finally {
      setGenerating(false);
    }
  };

  const approveReply = async () => {
    if (!conversation || !reply) return;

    try {
      setApproving(true);
      setError("");

      const retrievedContext = knowledge
        .map(
          (item) =>
            `${item.title}: ${item.content}`
        )
        .join("\n\n");

      const response = await axios.post(
        `${API_URL}/reply-logs`,
        {
          conversationId: conversation.id,
          customerMessage: customerMessage,
          retrievedContext,
          aiGeneratedResponse: originalReply,
          agentEditedResponse:
            reply !== originalReply ? reply : null,
          finalResponse: reply,
        }
      );

      if (response.data.success) {
        setApproved(true);
      }
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.error ||
          "Failed to approve and save the reply."
      );
    } finally {
      setApproving(false);
    }
  };

  if (loadingConversation) {
    return (
      <div className="loading">
        Loading conversation...
      </div>
    );
  }

  if (error && !conversation) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>AI-Powered CX Reply Assistant</h1>
          <p>Customer Support Workspace</p>
        </div>

        <div className="brand">
          {conversation?.brands?.name}
        </div>
      </header>

      <main className="main">
        <section className="conversation-panel">
          <div className="panel-header">
            <div>
              <h2>Conversation</h2>
              <p>Customer support request</p>
            </div>
          </div>

          <div className="customer-info">
            <div>
              <span>Customer</span>
              <strong>
                {conversation?.customer_name}
              </strong>
            </div>

            <div>
              <span>Order</span>
              <strong>
                {conversation?.order_number}
              </strong>
            </div>
          </div>

          <div className="message customer-message">
            <div className="message-label">
              Customer Message
            </div>

            <textarea
              className="customer-message-input"
              value={customerMessage}
              onChange={(event) =>
                setCustomerMessage(event.target.value)
              }
            />
          </div>

          <div className="order-card">
            <h3>Order Information</h3>

            <div className="order-grid">
              <div>
                <span>Status</span>
                <strong>
                  {conversation?.order_status}
                </strong>
              </div>

              <div>
                <span>Product</span>
                <strong>
                  {conversation?.product}
                </strong>
              </div>

              <div>
                <span>Delivered</span>
                <strong>
                  {conversation?.delivered_at}
                </strong>
              </div>
            </div>
          </div>

          <button
            className="generate-button"
            onClick={generateReply}
            disabled={generating}
          >
            {generating
              ? "Generating..."
              : "Generate Reply"}
          </button>

          {error && (
            <div className="inline-error">
              {error}
            </div>
          )}
        </section>

        <section className="reply-panel">
          <div className="panel-header">
            <div>
              <h2>AI Suggested Reply</h2>
              <p>Generated using brand knowledge</p>
            </div>
          </div>

          {reply ? (
            <>
              <textarea
                className="reply-box"
                value={reply}
                onChange={(event) => {
                  setReply(event.target.value);
                  setApproved(false);
                }}
              />

              <div className="reply-actions">
                <button
                  onClick={generateReply}
                  disabled={
                    generating || approving
                  }
                >
                  {generating
                    ? "Generating..."
                    : "Regenerate"}
                </button>

                <button
                  className="approve-button"
                  onClick={approveReply}
                  disabled={
                    approving || approved
                  }
                >
                  {approving
                    ? "Saving..."
                    : approved
                    ? "Approved ✓"
                    : "Approve"}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">✦</div>

              <h3>No reply generated yet</h3>

              <p>
                Click "Generate Reply" to create a
                response using the brand knowledge base.
              </p>
            </div>
          )}

          {knowledge.length > 0 && (
            <div className="knowledge-section">
              <h3>Retrieved Brand Knowledge</h3>

              {knowledge.map((item) => (
                <div
                  className="knowledge-card"
                  key={item.id}
                >
                  <span>{item.category}</span>

                  <strong>{item.title}</strong>

                  <p>{item.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;