const express = require('express');
const router = express.Router();
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { PineconeStore } = require('@langchain/pinecone');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { TavilySearchResults } = require('@langchain/tavily');
const { createToolCallingAgent, AgentExecutor } = require('langchain/agents');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { HumanMessage, AIMessage } = require('@langchain/core/messages');
const { initPinecone } = require('../config/pinecone');

// System prompt instructing Gemini to act as Tink, the empathetic AI assistant
const SYSTEM_TEMPLATE = `You are "Tink", an empathetic, supportive, and knowledgeable AI mental health assistant for the MindCare app. 
Your goal is to provide emotional support, listen to the user, and answer questions based on verified knowledge.

CRITICAL INSTRUCTIONS:
1. Always be compassionate, validating, and non-judgmental.
2. If asked about the MindCare app (features, tracking, how it works), use the provided context from the retrieval tool first.
3. If the user asks a factual question (e.g., statistics, current events, recent therapies), use the Tavily Search tool to find accurate information.
4. Provide structured, high-quality responses. Avoid hallucinations—if you don't know something, say so or use the search tool.
5. You are an AI assistant, NOT a licensed medical professional. If a user threatens self-harm or deep depression, gently suggest they seek professional help or talk to a trusted person. Keep responses relatively concise for a mobile app.

App Context or Retrieved Context:
{context}
`;

// Helper: Convert frontend history format [{text: "", isUser: true}] to LangChain message format
const formatHistory = (history) => {
  return history.map(msg =>
    msg.isUser ? new HumanMessage(msg.text) : new AIMessage(msg.text)
  );
};

// @route   POST /api/chat
// @desc    Process a chat message using Gemini pro, LangChain, Pinecone, and Tavily
// @access  Public
router.post('/', async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ errors: [{ msg: 'Message is required' }] });
  }

  try {
    // 1. Initialize Gemini Model
    const llm = new ChatGoogleGenerativeAI({
      modelName: "gemini-pro",
      temperature: 0.4,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // 2. Initialize Embeddings for Vector Search
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // 3. Initialize Pinecone Vector Store (RAG)
    let vectorStore;
    let context = "The MindCare app helps students track their mental health, predict burnout, and maintain a profile of their concerns.";

    try {
      const pineconeIndex = initPinecone();
      vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        textKey: 'text'
      });
      // Retrieve top 2 relevant documents if Pinecone is configured correctly
      const results = await vectorStore.similaritySearch(message, 2);
      if (results && results.length > 0) {
        context = results.map(r => r.pageContent).join('\n---\n');
      }
    } catch (pineconeErr) {
      console.warn("Pinecone not fully configured or failed. Falling back to default app context.", pineconeErr.message);
    }

    // 4. Initialize Tools (Tavily)
    let tools = [];
    if (process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY !== 'your_tavily_api_key_here') {
      const searchTool = new TavilySearchResults({
        maxResults: 2,
        apiKey: process.env.TAVILY_API_KEY,
      });
      tools.push(searchTool);
    }

    // 5. Create Agent Prompt
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_TEMPLATE],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);

    // Format chat history
    const chatHistory = formatHistory(history || []);

    // 6. Execute Chain/Agent
    let responseText = "";

    if (tools.length > 0) {
      // Use AgentExecutor if tools are available
      const agent = await createToolCallingAgent({ llm, tools, prompt });
      const agentExecutor = new AgentExecutor({ agent, tools });

      const result = await agentExecutor.invoke({
        input: message,
        chat_history: chatHistory,
        context: context
      });
      responseText = result.output;
    } else {
      // Direct LLM invocation if no tools
      const chain = prompt.pipe(llm);
      const result = await chain.invoke({
        input: message,
        chat_history: chatHistory,
        context: context
      });
      responseText = result.content;
    }

    // 7. Return to frontend
    res.json({ reply: responseText });

  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ errors: [{ msg: 'Failed to process chat message' }] });
  }
});

module.exports = router;
