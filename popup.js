// Mute all errors in the popup.
window.onerror = function(message, source, lineno, colno, error) {
  return true; // Prevent error logging.
};
window.addEventListener('unhandledrejection', function(event) {
  event.preventDefault(); // Prevent unhandled promise rejection logs.
});
console.error = function() {}; // Override console.error to suppress error logs.

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleBtn");
  const statusText = document.getElementById("statusText");
  const statusIcon = document.getElementById("statusIcon");
  const timerOptions = document.getElementById("timerOptions");

  // Formatting adjustments:

  // Make the overall popup less wide, add padding, and round the corners.
  document.body.style.width = "260px";
  document.body.style.margin = "0 auto"; // center the box
  document.body.style.padding = "10px";  // space around content
  document.body.style.borderRadius = "30px"; // round the corners

  // Remove any border, outline, or shadow from the middle section.
  // (Assuming the "middle section" is the timerOptions container.)
  timerOptions.style.border = "none";
  timerOptions.style.outline = "none";
  timerOptions.style.boxShadow = "none";
  timerOptions.style.borderRadius = "0";

  // Slightly enlarge the enabled/disabled text.
  statusText.style.fontSize = "18px";
  // Ensure no unwanted border/outline on the status text.
  statusText.style.border = "none";
  statusText.style.outline = "none";
  statusText.style.boxShadow = "none";
  // Allow newlines to create line breaks.
  statusText.style.whiteSpace = "pre-line";

  // Enlarge the logo and push it farther from the top.
  statusIcon.style.width = "100px";
  statusIcon.style.height = "100px";
  statusIcon.style.marginTop = "0px";

  // Ensure the toggle button at the bottom has some space from the bottom.
  toggleBtn.style.marginBottom = "20px";

  // Load current state (default: enabled, no timer)
  chrome.storage.local.get({ extensionEnabled: true, extensionDisableUntil: 0 }, (data) => {
    updateUI(data.extensionEnabled, data.extensionDisableUntil);
  });

  // Toggle button event listener
  toggleBtn.addEventListener("click", () => {
    chrome.storage.local.get({ extensionEnabled: true, extensionDisableUntil: 0 }, (data) => {
      if (data.extensionEnabled) {
        // When currently enabled, show timer options for disable
        timerOptions.style.display = "block";
      } else {
        // When disabled, re-enable immediately (override any timer)
        chrome.storage.local.set({ extensionEnabled: true, extensionDisableUntil: 0 }, () => {
          updateUI(true, 0);
        });
      }
    });
  });

  // Attach event listeners to each timer option button
  document.querySelectorAll(".timerOption").forEach(button => {
    button.addEventListener("click", function() {
      let duration = button.getAttribute("data-duration");
      let disableUntil;
      const now = Date.now();
      if (duration === "3") {
        disableUntil = now + 3 * 3600000; // 3 hours in ms
      } else if (duration === "tomorrow") {
        let tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        disableUntil = tomorrow.getTime();
      } else if (duration === "week") {
        disableUntil = now + 7 * 24 * 3600000; // 7 days in ms
      } else if (duration === "forever") {
        disableUntil = -1; // Sentinel for forever
      }
      chrome.storage.local.set({ extensionEnabled: false, extensionDisableUntil: disableUntil }, () => {
        updateUI(false, disableUntil);
        timerOptions.style.display = "none";
      });
    });
  });

  // Update the UI based on the stored state and disable timer
  function updateUI(isEnabled, disableUntil) {
    if (isEnabled) {
      toggleBtn.textContent = "Turn OFF";
      toggleBtn.style.backgroundColor = "#ff0000";
      toggleBtn.style.color = "#fff";
      statusText.textContent = "Enabled";
      statusText.style.color = "green";
      statusIcon.src = chrome.runtime.getURL("icons/enabledCanada.png");
      timerOptions.style.display = "none";
    } else {
      // Auto re-enable if timer expired (for timed disables)
      if (disableUntil !== -1 && disableUntil <= Date.now()) {
        chrome.storage.local.set({ extensionEnabled: true, extensionDisableUntil: 0 }, () => {
          updateUI(true, 0);
        });
        return;
      }
      toggleBtn.textContent = "Turn ON";
      toggleBtn.style.backgroundColor = "#ccc";
      toggleBtn.style.color = "#000";
      let timeText = "";
      if (disableUntil === -1) {
        timeText = "Forever";
      } else {
        let remainingMs = disableUntil - Date.now();
        let remainingHours = Math.floor(remainingMs / 3600000);
        let remainingMinutes = Math.floor((remainingMs % 3600000) / 60000);
        timeText = `${remainingHours}h ${remainingMinutes}m remaining`;
      }
      // "Disabled:" on the first line and the delay time on the next line in 8pt font.
      statusText.innerHTML = `Disabled<br><span style="font-size:12pt;">${timeText}</span>`;
      statusText.style.color = "red";
      statusIcon.src = chrome.runtime.getURL("icons/disabledCanada.png");
    }
  }

  // === NEW CODE: "Reset" button now clears the domain disable list in chrome.storage.local ===
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      // Overwrite with empty object to re-enable popups on all domains
      chrome.storage.local.set({ disablePopupDomains: {} }, () => {
        // Removed the alert. Nothing else has changed.
      });
    });
  }
});
