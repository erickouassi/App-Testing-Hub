if ("serviceWorker" in navigator) {
  // Wait until the initial layout paint cycles complete perfectly
  window.addEventListener("load", function() {
    const registerSW = () => {
      navigator.serviceWorker
        .register("/serviceWorker.js")
        .then(res => console.log("🤖 [PWA] Service Worker registered successfully"))
        .catch(err => console.error("❌ [PWA] Service Worker registration failed:", err));
    };

    // Use idle execution window if supported by device, else drop back to soft timeout delay
    if ("requestIdleCallback" in window) {
      requestIdleCallback(registerSW);
    } else {
      setTimeout(registerSW, 1000);
    }
  });
}