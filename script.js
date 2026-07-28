/* =========================================================================
   TECH CORPS AI — script.js
   Shared behavior for every page. Sections:
     1. Navigation (mobile menu toggle, active link highlight)
     2. Chatbot (chatbot.html only — the rest of the file no-ops elsewhere)
   ========================================================================= */

/* -------------------------------------------------------------------------
   1. NAVIGATION
   ------------------------------------------------------------------------- */

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  // Highlight the nav link that matches the current page.
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const linkPage = link.getAttribute("href");
    if (linkPage === currentPage) {
      link.classList.add("active");
    }
  });
}

/* -------------------------------------------------------------------------
   2. CHATBOT
   ------------------------------------------------------------------------- */

/**
 * getAIResponse(userMessage)
 * ---------------------------------------------------------------------
 * THIS is the single function to replace when a real AI API is wired up.
 *
 * Right now it looks at keywords in the user's message and returns one of
 * a few placeholder responses, formatted the way the real assistant will
 * eventually format its answers (Summary / Key Insights / Risk Factors /
 * Success Factors / Recommendations / Confidence).
 *
 * To connect a real API later:
 *   1. Make this function `async`.
 *   2. Replace the body with a fetch() call to your AI API
 *      (OpenAI, Google Gemini, Anthropic, etc). Do NOT hardcode an API
 *      key here — call your own backend/serverless endpoint, which holds
 *      the key, instead of calling the AI provider directly from the browser.
 *   3. Keep the return shape the same: a string of HTML that
 *      appendMessage() can drop straight into a bubble.
 *   4. Everywhere this function is called, the caller already `await`s it
 *      (see sendMessage()), so switching to async requires no other changes.
 *
 * Example of what step 2 will eventually look like:
 *
 *   async function getAIResponse(userMessage) {
 *     const response = await fetch("/api/chat", {
 *       method: "POST",
 *       headers: { "Content-Type": "application/json" },
 *       body: JSON.stringify({
 *         message: userMessage,
 *         // studentData will come from Google Sheets once that's connected
 *         context: studentData,
 *       }),
 *     });
 *     const data = await response.json();
 *     return data.reply;
 *   }
 */
async function getAIResponse(userMessage) {
  const message = userMessage.toLowerCase();

  // --- Off-topic / out-of-scope guardrails -------------------------------
  const refusalTriggers = [
    { test: /\b(name|address|phone|ssn|social security|specific student|student's? (record|file|id))\b/, reply: refusalResponse("private student information") },
    { test: /\b(diagnos|medicat|therap|prescri|symptom|mental health)\b/, reply: refusalResponse("medical advice") },
    { test: /\b(lawsuit|sue|legal advice|contract|liability|attorney)\b/, reply: refusalResponse("legal advice") },
  ];
  for (const trigger of refusalTriggers) {
    if (trigger.test.test(message)) {
      return trigger.reply;
    }
  }

  // --- Topic-matched placeholder responses --------------------------------
  if (message.includes("factor") && message.includes("retention")) {
    return structuredResponse({
      summary: "A few patterns show up consistently across cohorts that stayed engaged through program completion.",
      insights: [
        "Attendance in the first three weeks is the strongest early signal of later retention.",
        "Students paired with a mentor in month one show noticeably higher completion.",
      ],
      risks: ["Long gaps between sessions (10+ days) tend to precede drop-off."],
      successes: ["Consistent early attendance", "Active mentor pairing", "Peer group participation"],
      recommendations: ["Flag students after 2 missed sessions, not after 4.", "Prioritize mentor pairing in week one."],
      confidence: "Moderate — based on placeholder sample data. Confidence will reflect real dataset size once connected.",
    });
  }

  if (message.includes("at-risk") || message.includes("at risk") || (message.includes("support") && message.includes("student"))) {
    return structuredResponse({
      summary: "This is a placeholder view of how at-risk flags will be surfaced once real attendance and survey data are connected.",
      insights: [
        "Students with two or more consecutive absences are typically flagged first.",
        "A drop in satisfaction survey scores often precedes an attendance drop.",
      ],
      risks: ["Declining attendance trend", "Low recent satisfaction score", "No mentor contact in 2+ weeks"],
      successes: ["Students with a recent mentor check-in rarely appear on this list."],
      recommendations: ["Reach out to flagged students within 48 hours.", "Offer a brief check-in survey rather than a formal review."],
      confidence: "Placeholder data — real confidence scoring arrives with the live dataset.",
    });
  }

  if (message.includes("attendance")) {
    return structuredResponse({
      summary: "Here's a placeholder read on attendance trends — this will reflect real Google Sheets data once connected.",
      insights: ["Attendance typically dips mid-program, around week 5–6.", "Weekday sessions show higher attendance than weekend sessions."],
      risks: ["Mid-program scheduling conflicts", "Fatigue after the initial onboarding period"],
      successes: ["Attendance recovers when a check-in outreach happens before week 5."],
      recommendations: ["Send a light-touch reminder before the week 5 dip.", "Consider a short mid-program refresh activity."],
      confidence: "Low-moderate — illustrative only, pending real data.",
    });
  }

  if (message.includes("summarize") || message.includes("summary") || message.includes("engagement data")) {
    return structuredResponse({
      summary: "This is a placeholder engagement summary. Once connected to Google Sheets, this will reflect actual program data.",
      insights: ["Engagement is generally highest in the first month.", "Mentor-paired students show more consistent participation."],
      risks: ["Engagement naturally softens without regular touchpoints."],
      successes: ["Group activities correlate with higher reported satisfaction."],
      recommendations: ["Keep touchpoints frequent through the middle of the program, not just at the start."],
      confidence: "Placeholder — for demonstration purposes only.",
    });
  }

  if (message.includes("recommend")) {
    return structuredResponse({
      summary: "Here are placeholder program recommendations, formatted the way the live assistant will present them.",
      insights: ["Recommendations will be generated from real attendance, survey, and mentor data once connected."],
      risks: ["Acting on placeholder data isn't a substitute for real analysis — treat this as a preview of the format."],
      successes: ["The structure below (Summary, Insights, Risks, Successes, Recommendations, Confidence) will stay consistent."],
      recommendations: ["Increase mentor touchpoints mid-program.", "Introduce a short survey at week 5 to catch early disengagement."],
      confidence: "N/A — placeholder response.",
    });
  }

  // --- Default / fallback --------------------------------------------------
  return structuredResponse({
    summary: "I'm not connected to live program data yet, but here's a preview of how I'll respond once I am.",
    insights: ["Try asking about retention factors, at-risk students, attendance, or recommendations."],
    risks: [],
    successes: [],
    recommendations: ["Use one of the suggested prompts below to see a sample response."],
    confidence: "N/A — placeholder response.",
  });
}

/**
 * refusalResponse(topic)
 * Builds the polite redirect used for out-of-scope requests
 * (private student info, medical advice, legal advice, off-topic chat).
 */
function refusalResponse(topic) {
  return `<p>I'm built specifically to help TECH CORPS staff analyze program retention and engagement — I'm not able to help with ${topic}.</p>
  <p>If that's what you need, please route it to the right TECH CORPS staff contact or professional. In the meantime, I'm happy to help with attendance trends, engagement patterns, or retention recommendations — try one of the suggested prompts below.</p>`;
}

/**
 * structuredResponse(data)
 * Renders the assistant's standard response shape: Summary, Key Insights,
 * Risk Factors, Success Factors, Recommendations, Confidence. Sections
 * with no content are skipped.
 */
function structuredResponse(data) {
  let html = `<h4>Summary</h4><p>${data.summary}</p>`;

  if (data.insights && data.insights.length) {
    html += `<h4>Key Insights</h4><ul>${data.insights.map((i) => `<li>${i}</li>`).join("")}</ul>`;
  }
  if (data.risks && data.risks.length) {
    html += `<h4>Risk Factors</h4><ul>${data.risks.map((i) => `<li>${i}</li>`).join("")}</ul>`;
  }
  if (data.successes && data.successes.length) {
    html += `<h4>Success Factors</h4><ul>${data.successes.map((i) => `<li>${i}</li>`).join("")}</ul>`;
  }
  if (data.recommendations && data.recommendations.length) {
    html += `<h4>Recommendations</h4><ul>${data.recommendations.map((i) => `<li>${i}</li>`).join("")}</ul>`;
  }
  if (data.confidence) {
    html += `<h4>Confidence</h4><p>${data.confidence}</p>`;
  }
  return html;
}

/**
 * escapeHTML(str)
 * Escapes user input before it's inserted into the page, so a message
 * can never be interpreted as HTML/script.
 */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * appendMessage(role, htmlContent)
 * Adds one chat bubble to the log and scrolls it into view.
 * role is either "user" or "ai".
 */
function appendMessage(role, htmlContent) {
  const log = document.getElementById("chatLog");
  if (!log) return;

  const wrapper = document.createElement("div");
  wrapper.className = `msg msg-${role}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = role === "ai" ? "AI" : "You";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = htmlContent;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  log.appendChild(wrapper);

  log.scrollTop = log.scrollHeight;
  return wrapper;
}

/**
 * showTypingIndicator() / removeTypingIndicator()
 * Shows a small "AI is thinking" bubble while getAIResponse() runs —
 * useful now for the placeholder delay, and still useful later once a
 * real API call takes a moment to respond.
 */
function showTypingIndicator() {
  const wrapper = appendMessage("ai", `<div class="typing-dots"><span></span><span></span><span></span></div>`);
  wrapper.id = "typingIndicator";
}

function removeTypingIndicator() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

/**
 * sendMessage(text)
 * Handles one full round trip: show the user's message, show a typing
 * indicator, get the (placeholder, later real) AI response, then swap
 * the indicator for the actual reply.
 */
async function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  appendMessage("user", escapeHTML(trimmed));

  const input = document.getElementById("chatInput");
  if (input) input.value = "";

  showTypingIndicator();

  // Small delay so the typing indicator is visible — mirrors the latency
  // a real API call will have, so no UI changes are needed later.
  await new Promise((resolve) => setTimeout(resolve, 650));

  const reply = await getAIResponse(trimmed);
  removeTypingIndicator();
  appendMessage("ai", reply);
}

function initChatbot() {
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  if (!form || !input) return; // Not on the chatbot page — nothing to do.

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });

  // Suggested prompt chips fill the input and send immediately.
  document.querySelectorAll(".prompt-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      sendMessage(chip.textContent);
    });
  });
}

/* -------------------------------------------------------------------------
   INIT
   ------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initChatbot();
});