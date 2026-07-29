/* =========================================================================
   TECH CORPS AI — script.js
   Shared behavior for every page. Sections:
     1. Navigation (mobile menu toggle, active link highlight)
     2. Chatbot (chatbot.html only — the rest of the file no-ops elsewhere)
   ========================================================================= */

/* -------------------------------------------------------------------------
   0. UPLOADED DATA STORE
   ---------------------------------------------------------------------
   Holds whatever spreadsheet the user has uploaded on the chatbot page,
   parsed into a plain array of row objects (the same shape a Google
   Sheets API response will eventually hand us — see initUploader() and
   the "Future Google Sheets Integration" note in getAIResponse()).
   ------------------------------------------------------------------------- */

let studentData = null;   // array of row objects, or null if nothing uploaded
let dataSummary = null;   // computed stats about studentData, or null

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

  // If a spreadsheet has been uploaded, build a line of real, computed
  // numbers to fold into whichever canned response matches below. This is
  // the seam where "real analysis" and "placeholder wording" meet — once
  // a real AI API is connected, dataSummary (or the raw studentData rows)
  // gets sent to it instead of being turned into a single sentence here.
  const dataLine = buildDataGroundedLine();

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
        dataLine,
        "Attendance in the first three weeks is the strongest early signal of later retention.",
        "Students paired with a mentor in month one show noticeably higher completion.",
      ].filter(Boolean),
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
        dataLine,
        "Students with two or more consecutive absences are typically flagged first.",
        "A drop in satisfaction survey scores often precedes an attendance drop.",
      ].filter(Boolean),
      risks: ["Declining attendance trend", "Low recent satisfaction score", "No mentor contact in 2+ weeks"],
      successes: ["Students with a recent mentor check-in rarely appear on this list."],
      recommendations: ["Reach out to flagged students within 48 hours.", "Offer a brief check-in survey rather than a formal review."],
      confidence: "Placeholder data — real confidence scoring arrives with the live dataset.",
    });
  }

  if (message.includes("attendance")) {
    return structuredResponse({
      summary: "Here's a placeholder read on attendance trends — this will reflect real Google Sheets data once connected.",
      insights: [dataLine, "Attendance typically dips mid-program, around week 5–6.", "Weekday sessions show higher attendance than weekend sessions."].filter(Boolean),
      risks: ["Mid-program scheduling conflicts", "Fatigue after the initial onboarding period"],
      successes: ["Attendance recovers when a check-in outreach happens before week 5."],
      recommendations: ["Send a light-touch reminder before the week 5 dip.", "Consider a short mid-program refresh activity."],
      confidence: "Low-moderate — illustrative only, pending real data.",
    });
  }

  if (message.includes("summarize") || message.includes("summary") || message.includes("engagement data")) {
    return structuredResponse({
      summary: "This is a placeholder engagement summary. Once connected to Google Sheets, this will reflect actual program data.",
      insights: [dataLine, "Engagement is generally highest in the first month.", "Mentor-paired students show more consistent participation."].filter(Boolean),
      risks: ["Engagement naturally softens without regular touchpoints."],
      successes: ["Group activities correlate with higher reported satisfaction."],
      recommendations: ["Keep touchpoints frequent through the middle of the program, not just at the start."],
      confidence: "Placeholder — for demonstration purposes only.",
    });
  }

  if (message.includes("recommend")) {
    return structuredResponse({
      summary: "Here are placeholder program recommendations, formatted the way the live assistant will present them.",
      insights: [dataLine, "Recommendations will be generated from real attendance, survey, and mentor data once connected."].filter(Boolean),
      risks: ["Acting on placeholder data isn't a substitute for real analysis — treat this as a preview of the format."],
      successes: ["The structure below (Summary, Insights, Risks, Successes, Recommendations, Confidence) will stay consistent."],
      recommendations: ["Increase mentor touchpoints mid-program.", "Introduce a short survey at week 5 to catch early disengagement."],
      confidence: "N/A — placeholder response.",
    });
  }

  // --- Default / fallback --------------------------------------------------
  return structuredResponse({
    summary: studentData
      ? "I have your uploaded data loaded. Try asking about retention factors, at-risk students, attendance, or recommendations and I'll reference it."
      : "I'm not connected to live program data yet, but here's a preview of how I'll respond once I am.",
    insights: [dataLine, "Try asking about retention factors, at-risk students, attendance, or recommendations."].filter(Boolean),
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
   3. SPREADSHEET UPLOAD
   ---------------------------------------------------------------------
   Lets staff upload a CSV or Excel file (a Google Sheet works too, once
   it's exported — Google Sheets isn't fetchable directly without signing
   the site up for Google OAuth, which is out of scope for a static
   GitHub Pages site). Parsing happens entirely in the browser using
   SheetJS, so no backend or API key is needed for this part.

   This is the first half of the "Google Sheets → JavaScript → AI API →
   Website" pipeline described in the project plan: this file covers
   JavaScript parsing today. Swapping a live Google Sheets API call in
   later only means replacing how `studentData` gets populated — every
   function below that reads `studentData` stays the same.
   ------------------------------------------------------------------------- */

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB, generous for a CSV/XLSX of attendance data

/**
 * computeDataSummary(rows)
 * Given an array of row objects (one per spreadsheet row), returns basic
 * stats: row count, column names, and the average of any column that's
 * mostly numeric (e.g. an "Attendance %" or "Satisfaction" column).
 * This is intentionally simple — a real AI API will eventually do the
 * actual analysis; this just gives the placeholder something true to say.
 */
function computeDataSummary(rows) {
  if (!rows || !rows.length) return null;

  const columns = Object.keys(rows[0]);
  const numericAverages = {};

  columns.forEach((col) => {
    const numericValues = rows
      .map((row) => parseFloat(row[col]))
      .filter((value) => !Number.isNaN(value));

    // Only treat a column as "numeric" if most rows actually parsed as a number.
    if (numericValues.length >= rows.length * 0.6) {
      const average = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
      numericAverages[col] = Math.round(average * 10) / 10;
    }
  });

  return { rowCount: rows.length, columns, numericAverages };
}

/**
 * buildDataGroundedLine()
 * Turns dataSummary into one plain-language sentence for getAIResponse()
 * to fold into its placeholder answers. Returns null if nothing's been
 * uploaded yet.
 */
function buildDataGroundedLine() {
  if (!dataSummary) return null;

  const averageParts = Object.entries(dataSummary.numericAverages).map(
    ([column, average]) => `average ${column} of ${average}`
  );

  if (!averageParts.length) {
    return `Your uploaded file has ${dataSummary.rowCount} rows across columns: ${dataSummary.columns.join(", ")}.`;
  }

  return `From your uploaded file (${dataSummary.rowCount} rows): ${averageParts.join(", ")}.`;
}

/**
 * handleUploadedFile(file)
 * Parses a File object with SheetJS, stores the result in studentData /
 * dataSummary, updates the status UI, and lets the assistant announce it
 * in the chat log.
 */
async function handleUploadedFile(file) {
  const errorEl = document.getElementById("uploadError");
  errorEl.hidden = true;

  if (typeof XLSX === "undefined") {
    showUploadError("Couldn't load the spreadsheet reader. Check your connection and try again.");
    return;
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    showUploadError("That file is larger than 5MB. Try trimming it down or exporting fewer columns.");
    return;
  }

  const validExtensions = [".csv", ".xlsx", ".xls"];
  const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
  if (!hasValidExtension) {
    showUploadError("Please upload a .csv, .xlsx, or .xls file.");
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) {
      showUploadError("That file loaded but doesn't seem to have any rows in it.");
      return;
    }

    studentData = rows;
    dataSummary = computeDataSummary(rows);
    showUploadStatus(file.name, dataSummary);

    // Let the assistant acknowledge the upload right in the chat log.
    appendMessage(
      "ai",
      `<p>Got it — I've loaded <strong>${escapeHTML(file.name)}</strong> (${dataSummary.rowCount} rows, columns: ${dataSummary.columns.map(escapeHTML).join(", ")}).</p><p>Ask me about retention, attendance, or at-risk students and I'll reference this data.</p>`
    );
  } catch (error) {
    console.error("Spreadsheet parsing error:", error);
    showUploadError("Couldn't read that file. Double-check it's a valid CSV or Excel file and try again.");
  }
}

function showUploadStatus(filename, summary) {
  const zone = document.getElementById("uploadZone");
  const status = document.getElementById("uploadStatus");
  const filenameEl = document.getElementById("uploadFilename");
  const metaEl = document.getElementById("uploadMeta");

  filenameEl.textContent = filename;
  metaEl.textContent = `${summary.rowCount} rows • ${summary.columns.length} columns`;
  status.hidden = false;
  zone.hidden = true;
}

function showUploadError(message) {
  const errorEl = document.getElementById("uploadError");
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearUpload() {
  studentData = null;
  dataSummary = null;

  const zone = document.getElementById("uploadZone");
  const status = document.getElementById("uploadStatus");
  const fileInput = document.getElementById("fileInput");

  status.hidden = true;
  zone.hidden = false;
  if (fileInput) fileInput.value = "";
}

function initUploader() {
  const zone = document.getElementById("uploadZone");
  const fileInput = document.getElementById("fileInput");
  const removeBtn = document.getElementById("uploadRemove");
  if (!zone || !fileInput) return; // Not on the chatbot page.

  zone.addEventListener("click", () => fileInput.click());
  zone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      handleUploadedFile(fileInput.files[0]);
    }
  });

  // Drag-and-drop support.
  ["dragenter", "dragover"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.remove("drag-over");
    });
  });

  zone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) handleUploadedFile(file);
  });

  if (removeBtn) {
    removeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      clearUpload();
    });
  }
}

/* -------------------------------------------------------------------------
   INIT
   ------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initChatbot();
  initUploader();
});