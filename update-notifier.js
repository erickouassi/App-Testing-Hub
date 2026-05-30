class UpdateNotifier extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });

    const wrapper = document.createElement("div");
    wrapper.classList.add("notifier");
    wrapper.innerHTML = `
      <span class="message">A new version is available</span>
      <button class="update-btn">Update</button>
    `;

    const style = document.createElement("style");
    style.textContent = `
      .notifier {
        position: fixed;
        bottom: -70px;
        left: 50%;
        transform: translateX(-50%);
        background: #0078ff;
        color: #fff;
        padding: 12px 18px;
        border-radius: 8px;
        display: flex;
        gap: 12px;
        align-items: center;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transition: bottom 0.35s ease, opacity 0.35s ease;
        opacity: 0;
        z-index: 99999;
      }

      .notifier.show {
        bottom: 20px;
        opacity: 1;
      }

      .update-btn {
        background: #fff;
        color: #0078ff;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
      }

      .update-btn:hover {
        background: #e6e6e6;
      }
    `;

    shadow.appendChild(style);
    shadow.appendChild(wrapper);

    this.wrapper = wrapper;
    this.updateBtn = wrapper.querySelector(".update-btn");
  }

  connectedCallback() {
    this.message =
      this.getAttribute("message") || "A new version is available";
    this.wrapper.querySelector(".message").textContent = this.message;

    this.updateBtn.addEventListener("click", () => this.applyUpdate());

    // Listen for custom event from service worker
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });

    this.listenForUpdates();
  }

  async listenForUpdates() {
    if (!("serviceWorker" in navigator)) return;

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;

    if (registration.waiting) {
      this.show(registration.waiting);
      return;
    }

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          this.show(newWorker);
        }
      });
    });
  }

  show(worker) {
    this.worker = worker;
    this.wrapper.classList.add("show");
  }

  applyUpdate() {
    if (!this.worker) return;
    this.worker.postMessage({ type: "SKIP_WAITING" });
  }
}

customElements.define("update-notifier", UpdateNotifier);
