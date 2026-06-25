import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function sendClientError(payload: object) {
  fetch('/api/debug/client-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  }).catch(() => {});
}

window.addEventListener('error', (evt) => {
  const err = evt.error;
  sendClientError({
    type: 'error',
    message: evt.message,
    filename: evt.filename,
    lineno: evt.lineno,
    colno: evt.colno,
    errorStr: String(err),
    errorType: err ? Object.prototype.toString.call(err) : 'null',
    stack: err && err.stack ? err.stack : null,
  });
});

window.addEventListener('unhandledrejection', (evt) => {
  const reason = evt.reason;
  sendClientError({
    type: 'unhandledrejection',
    message: String(reason),
    errorStr: String(reason),
    errorType: reason ? Object.prototype.toString.call(reason) : 'null',
    stack: reason && reason.stack ? reason.stack : null,
  });
});

createRoot(document.getElementById("root")!).render(<App />);
