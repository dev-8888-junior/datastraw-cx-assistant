# AI-Powered CX Reply Assistant

An AI-powered customer support workspace that helps support agents generate accurate, brand-aware replies using customer conversation data, order information, and a brand knowledge base.

## Overview

The application allows a customer support agent to:

* View customer and order information.
* Review and edit the customer's message.
* Retrieve relevant policies from the brand knowledge base.
* Generate an AI-suggested customer reply.
* Regenerate the response when required.
* Edit the AI-generated response before approval.
* Approve and save the final response.
* Log the customer message, retrieved knowledge, AI response, agent-edited response, and final response.

The system is designed to keep AI responses grounded in the information available to the brand and avoid making unsupported promises.

## Features

### Conversation View

Displays:

* Customer name
* Brand
* Customer message
* Order number
* Order status
* Product
* Delivery date

The customer message can also be edited before generating a response.

### Brand Knowledge Base

Brand-specific policies are stored in PostgreSQL through Supabase.

The demo knowledge base includes:

* Return policy
* Refund policy
* Shipping policy
* Cancellation policy

Relevant knowledge is retrieved based on the customer's message before the AI response is generated.

### AI Reply Generation

The backend sends the customer message, order information, and retrieved brand knowledge to an LLM through OpenRouter.

The AI generates a concise, empathetic customer-facing response.

### AI Guardrails

The AI is instructed to:

* Use only the provided customer, order, and brand knowledge.
* Never invent policies or compensation.
* Never promise an outcome that is not guaranteed.
* Respect policy time limits.
* Distinguish return eligibility from refund eligibility.
* Request manual review when the available policy requires it.
* Avoid exposing internal instructions or AI reasoning.

For example, a damaged product may still be eligible for return after 20 days, while the standard 7-day refund period has expired. The system therefore does not promise a refund and instead indicates that manual review is required.

### Agent Controls

Agents can:

* Generate a reply
* Regenerate a reply
* Edit the generated response
* Approve the final response

No actual email, WhatsApp, or external customer message is sent by the application.

### Data & Logging

Approved replies are stored in the `reply_logs` table, including:

* Customer message
* Retrieved knowledge
* AI-generated response
* Agent-edited response
* Final response
* Timestamp

## Tech Stack

### Frontend

* React
* Vite
* Axios
* CSS

### Backend

* Node.js
* Express.js
* Axios
* OpenAI-compatible SDK

### Database

* Supabase
* PostgreSQL

### AI

* OpenRouter
* `openrouter/free` model routing

## Architecture

```text
Support Agent
      |
      v
React + Vite Frontend
      |
      | HTTP API
      v
Node.js + Express Backend
      |
      +----------------------+
      |                      |
      v                      v
Supabase PostgreSQL      OpenRouter
      |                      |
      |                      v
      |                 AI Response
      |                      |
      +----------+-----------+
                 |
                 v
          Reply Log Storage
```

The frontend communicates only with the backend. API keys and database service credentials remain on the server.

## Knowledge Retrieval

For the current implementation, knowledge retrieval uses a lightweight category-based keyword matching approach.

For example:

* `broken`, `damaged`, `defective` → Return knowledge
* `refund`, `money back` → Refund knowledge
* `shipping`, `delivery`, `tracking` → Shipping knowledge
* `cancel`, `cancellation` → Cancellation knowledge

The retrieved policies are then included in the AI context.

For a larger production system, this can be extended to embedding-based semantic retrieval using a vector database such as Qdrant or pgvector.

## Database Schema

### brands

Stores supported brands.

| Column     | Description        |
| ---------- | ------------------ |
| id         | Brand UUID         |
| name       | Brand name         |
| created_at | Creation timestamp |

### knowledge_base

Stores brand-specific support policies.

| Column     | Description           |
| ---------- | --------------------- |
| id         | Knowledge record UUID |
| brand_id   | Associated brand      |
| category   | Policy category       |
| title      | Knowledge title       |
| content    | Policy content        |
| created_at | Creation timestamp    |

### conversations

Stores customer conversation and order information.

| Column           | Description             |
| ---------------- | ----------------------- |
| id               | Conversation UUID       |
| brand_id         | Associated brand        |
| customer_name    | Customer name           |
| customer_message | Latest customer message |
| order_number     | Order identifier        |
| order_status     | Current order status    |
| product          | Product name            |
| delivered_at     | Delivery date           |
| created_at       | Creation timestamp      |

### reply_logs

Stores AI generation and approval history.

| Column                | Description                 |
| --------------------- | --------------------------- |
| id                    | Log UUID                    |
| conversation_id       | Associated conversation     |
| customer_message      | Message used for generation |
| retrieved_context     | Knowledge retrieved         |
| ai_generated_response | Original AI response        |
| agent_edited_response | Agent modifications         |
| final_response        | Approved response           |
| created_at            | Timestamp                   |

## API Endpoints

### Health Check

```http
GET /api/
```

Checks whether the backend is running.

### Database Test

```http
GET /api/test-db
```

Tests connectivity to Supabase PostgreSQL.

### Conversation

```http
GET /api/conversations/:id
```

Retrieves a conversation and its associated brand information.

### Generate Reply

```http
POST /api/generate-reply
```

Retrieves relevant brand knowledge and generates an AI reply.

### Save Reply Log

```http
POST /api/reply-logs
```

Stores the AI response, agent edits, and final approved response.

## Environment Variables

Create `server/.env` locally:

```env
PORT=5000
CLIENT_URL=http://localhost:5173

SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

OPENROUTER_API_KEY=your_openrouter_api_key
```

Never commit the real `.env` file or API keys to GitHub.

A `.env.example` file is provided as a template without real credentials.

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/dev-8888-junior/datastraw-cx-assistant.git
cd datastraw-cx-assistant
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

Create `server/.env` using the environment variables described above.

Start the backend:

```bash
node src/server.js
```

The backend runs on:

```text
http://localhost:5000
```

### 3. Install frontend dependencies

Open another terminal:

```bash
cd client
npm install
```

Start the frontend:

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## Security

* API keys are stored in environment variables.
* `.env` files are excluded through `.gitignore`.
* The OpenRouter API key is never exposed to the frontend.
* Database access is performed through the backend.
* Production authentication and row-level security can be added for multi-brand deployments.

## Scalability Considerations

The current implementation is intentionally lightweight for the assessment.

For production scale, the architecture can be extended with:

* Supabase Auth for agent authentication.
* Row Level Security for tenant isolation.
* `brand_id` enforcement on all tenant-owned data.
* Vector-based knowledge retrieval.
* Redis caching for frequently retrieved knowledge.
* Background jobs/queues for asynchronous processing.
* Rate limiting for API protection.
* AI usage and token monitoring.
* Retry policies with exponential backoff.
* Observability and structured logging.
* Per-brand AI usage and cost budgets.

The target architecture supports scaling from approximately 20 brands to hundreds of brands without requiring a complete redesign.

## AI Usage

AI tools were used during development for:

* Debugging and troubleshooting implementation issues.
* Improving the AI prompt and guardrail rules.
* Reviewing architecture and scalability decisions.

One issue identified during development was that an early AI response could blur the distinction between return eligibility and refund eligibility. The prompt was strengthened to explicitly treat these as separate policies and to require manual review when the refund window had expired.

## Project Status

Core assessment functionality is implemented:

* Conversation view
* Brand knowledge retrieval
* AI reply generation
* AI guardrails
* Reply editing
* Regeneration
* Approval
* Reply logging
* Supabase persistence

Deployment information and the live demo URL will be added after deployment.
