import { FormKitConfig } from "./FormKitConfig.js";

export const FormKit = {
  init(formSelector, statusSelector) {
    const form = document.querySelector(formSelector);
    const status = statusSelector ? document.querySelector(statusSelector) : null;

    if (!form) return console.error("❌ FormKit: form not found");

    console.log("🟢 FormKit initialized on:", formSelector);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.submit(form, status);
    });
  },

  async submit(form, statusEl) {
    console.log("📨 Form submission triggered");

    // Honeypot protection
    if (form.website?.value !== "") {
      console.warn("🛑 Honeypot triggered — bot blocked");
      if (statusEl) statusEl.textContent = "❌ Submission rejected.";
      return;
    }

    // Extract only allowed fields
    const formData = new FormData(form);
    const data = {};

    FormKitConfig.fields.forEach((field) => {
      data[field] = formData.get(field);
    });

    console.log("🧾 Payload being sent:", data);

    if (statusEl) statusEl.textContent = "Sending...";

    // Reference to submit button
    const submitBtn = form.querySelector(".form-submit-btn");

    try {
      const res = await fetch(FormKitConfig.endpoint, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });

      console.log("🌐 Worker response status:", res.status);

      const json = await res.json().catch(() => {
        console.error("❌ Failed to parse JSON from Worker");
        throw new Error("Invalid JSON returned from backend");
      });

      console.log("📥 Parsed Worker JSON:", json);

      if (json.status === "success") {
        console.log("✅ Submission successful");
        form.reset();

        // 🔥 Success animation on button
        if (submitBtn) {
          submitBtn.textContent = "✅ Feed Registered!";
          submitBtn.style.backgroundColor = "#28a745"; // green
          submitBtn.style.transition = "background-color 0.3s ease";
          submitBtn.disabled = true;

          setTimeout(() => {
            submitBtn.textContent = "🚀 Register Feed";
            submitBtn.style.backgroundColor = "";
            submitBtn.disabled = false;
          }, 4000);
        }

        if (statusEl) statusEl.textContent = "Feed submitted!";
      } else {
        if (statusEl) statusEl.textContent = "Error submitting feed.";
        console.error("❌ Backend returned error:", json);
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      if (statusEl) statusEl.textContent = "Network error.";
      if (submitBtn) {
        submitBtn.textContent = "❌ Network Error";
        submitBtn.style.backgroundColor = "#dc3545"; // red
        setTimeout(() => {
          submitBtn.textContent = "🚀 Register Feed";
          submitBtn.style.backgroundColor = "";
        }, 4000);
      }
    }
  }
};

  const style = document.createElement("style");
  style.textContent = `
    .submit-content h2 {
      font-size: 1.35rem;
      font-weight: 600;
      margin-top: 28px;
      margin-bottom: 12px;
      color: var(--text);
    }

    .submit-content p,
    .submit-content li {
      line-height: 1.6;
      color: var(--text);
      opacity: 0.9;
      font-size: 0.95rem;
      margin-bottom: 14px;
    }

    .submit-content ul {
      padding-left: 20px;
    }

    .step-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px 20px;
      margin-bottom: 16px;
    }

    .step-number {
      display: inline-block;
      background: var(--accent);
      color: #fff;
      font-weight: bold;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 0.8rem;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    /* --- INTERACTIVE FORM DESIGN --- */
    .submission-form-wrapper {
      margin-top: 16px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
    }

    .form-group-row {
      display: flex;
      flex-direction: row;
      gap: 12px;
      margin-bottom: 12px;
    }

    .form-input-field {
      flex: 1;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 10px 14px;
      border-radius: 6px;
      font-family: inherit;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-input-field:focus {
      border-color: var(--accent);
    }

    /* Checkbox row */
    .form-checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .form-checkbox-row input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .form-checkbox-row label {
      font-size: 0.9rem;
      color: var(--text);
      opacity: 0.9;
      cursor: pointer;
    }

    .form-submit-btn {
      margin: 0;
      white-space: nowrap;
    }

    .form-status-msg {
      margin-top: 10px;
      font-size: 0.85rem;
      font-weight: 500;
      display: none;
    }

    .form-status-msg.success {
      color: #059669;
      display: block;
    }

    .form-status-msg.error {
      color: #dc2626;
      display: block;
    }

    /* Mobile */
    @media (max-width: 580px) {
      .form-group-row {
        flex-direction: column;
        gap: 8px;
      }
      .form-submit-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `;
  document.head.appendChild(style);