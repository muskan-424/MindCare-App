const express = require('express');
const router = express.Router();
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { PineconeStore } = require('@langchain/pinecone');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { TavilySearch } = require('@langchain/tavily');
const { createToolCallingAgent, AgentExecutor } = require('@langchain/classic/agents');
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

// Helper: Convert frontend history format [{text: "", isUser: true}] to LangChain message format (ensure no undefined)
const formatHistory = (history) => {
  return (history || []).map(msg => {
    const text = (msg && msg.text != null) ? String(msg.text) : '';
    return msg && msg.isUser ? new HumanMessage(text) : new AIMessage(text);
  });
};

// Fallback: call Gemini REST API directly when LangChain throws (e.g. "reading 'replace'" bug)
async function fallbackGeminiDirect(apiKey, userMessage) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `You are Tink, a supportive mental health assistant for MindCare. Be brief and kind. User said: ${userMessage}` }],
        }],
        generationConfig: { maxOutputTokens: 512, temperature: 0.4 },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    if (res.status === 404) continue;
    return null;
  }
  return null;
}

// @route   POST /api/chat
// @desc    Process a chat message using Gemini pro, LangChain, Pinecone, and Tavily
// @access  Public
router.post('/', async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ errors: [{ msg: 'Message is required' }] });
  }

  try {
    // 1. Initialize Gemini Model (Safeguard against undefined API keys causing 'replace' crashes)
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "missing_api_key_placeholder";
    const llm = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.5-flash",
      temperature: 0.4,
      apiKey: apiKey,
    });

    // 2. Initialize Embeddings for Vector Search
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: apiKey,
    });

    // 3. Initialize Pinecone Vector Store (RAG)
    let vectorStore;
    let context = "The MindCare app helps students track their mental health, predict burnout, and maintain a profile of their concerns.";

    try {
      if (process.env.PINECONE_API_KEY && process.env.PINECONE_API_KEY !== 'your_pinecone_api_key_here') {
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
      }
    } catch (pineconeErr) {
      console.warn("Pinecone not fully configured or failed. Falling back to default app context.", pineconeErr.message);
    }

    // 4. Initialize Tools (Tavily)
    let tools = [];
    try {
      if (process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY !== 'your_tavily_api_key_here') {
        const searchTool = new TavilySearch({
          maxResults: 2,
          apiKey: process.env.TAVILY_API_KEY,
        });
        tools.push(searchTool);
      }
    } catch (tavilyErr) {
      console.warn("Tavily initialization failed.", tavilyErr.message);
    }

    // 5. Create Agent Prompt
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_TEMPLATE],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);

    // Format chat history (safe strings only)
    const chatHistory = formatHistory(history || []);
    const safeContext = (context != null && typeof context === 'string') ? context : '';
    const safeInput = (message != null && typeof message === 'string') ? message : String(message || '');

    // 6. Execute Chain/Agent
    let responseText = '';

    if (tools.length > 0) {
      const agent = await createToolCallingAgent({ llm, tools, prompt });
      const agentExecutor = new AgentExecutor({ agent, tools });
      const result = await agentExecutor.invoke({
        input: safeInput,
        chat_history: chatHistory,
        context: safeContext,
      });
      responseText = (result && (typeof result.output === 'string' ? result.output : result.output?.trim?.())) || '';
    } else {
      const chain = prompt.pipe(llm);
      const result = await chain.invoke({
        input: safeInput,
        chat_history: chatHistory,
        context: safeContext,
      });
      const content = result?.content;
      responseText = typeof content === 'string' ? content : (Array.isArray(content) ? content.map(c => typeof c === 'string' ? c : (c && c.text) || '').join('') : '');
    }

    if (!responseText.trim()) {
      responseText = await fallbackGeminiDirect(apiKey, safeInput) || "I'm here, but I couldn't generate a reply right now. Try again in a moment.";
    }

    // 7. Return to frontend
    res.json({ reply: responseText.trim() || "I'm here with you. How can I help?" });

  } catch (err) {
    console.error('Chat error:', err.message);

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    const isLangChainBug = err.message && (err.message.includes("reading 'replace'") || err.message.includes('undefined'));

    // When LangChain throws (e.g. .replace on undefined), try direct Gemini REST so chat still works
    if (isLangChainBug && apiKey && apiKey !== 'missing_api_key_placeholder') {
      try {
        const fallbackReply = await fallbackGeminiDirect(apiKey, (req.body && req.body.message) || 'Hello');
        if (fallbackReply) {
          return res.json({ reply: fallbackReply });
        }
      } catch (fallbackErr) {
        console.warn('Chat fallback failed:', fallbackErr.message);
      }
    }

    let errorMsg = "I'm so sorry, my AI brain seems to be offline right now. ";
    if (err.message.includes('API key not valid') || err.message.includes('403')) {
      errorMsg += "It looks like my Google API Key isn't configured correctly on the server!";
    } else if (err.message.includes('quota') || err.message.includes('429')) {
      errorMsg += "It looks like we've hit our API rate limits for today!";
    } else {
      errorMsg += `(Error details: ${err.message})`;
    }
    res.json({ reply: errorMsg });
  }
});

module.exports = router;
