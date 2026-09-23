import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../api/axios";
import { useTeam } from "../../context/TeamContext";

const SCANNER_ID = "qr-scanner-region";

export default function ScanModal({ onClose, onSuccess }) {
  const { refresh } = useTeam();
  const [mode, setMode] = useState("camera");
  const [manualCode, setManualCode] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const scannerRef = useRef(null);

  /* Start camera scanner when mode === "camera" */
  useEffect(() => {
    if (mode !== "camera" || status === "success") return;

    const html5 = new Html5Qrcode(SCANNER_ID, { verbose: false });
    scannerRef.current = html5;

    let cancelled = false;

    html5
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (cancelled) return;
          cancelled = true;
          const code = extractCode(decodedText);
          stopScanner().then(() => redeem(code));
        },
        () => {}
      )
      .then(() => setStatus("scanning"))
      .catch((err) => {
        setStatus("error");
        setMessage("Camera error: " + err.message);
      });

    return () => {
      cancelled = true;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {}
  };

  const extractCode = (text) => {
    try {
      if (text.includes("/")) {
        const parts = text.split("/").filter(Boolean);
        return decodeURIComponent(parts[parts.length - 1]);
      }
    } catch {}
    return text.trim();
  };

  const redeem = async (code) => {
    if (!code) {
      setStatus("error");
      setMessage("Empty code");
      return;
    }

    setStatus("redeeming");
    setMessage(`Redeeming ${code}…`);

    try {
      const { data } = await api.post("/qrcodes/redeem", { code });
      await refresh();
      setStatus("success");
      setMessage(`"${data.task.title}" submitted for review.`);
      setTimeout(() => onSuccess?.(), 1400);
    } catch (e) {
      setStatus("error");
      setMessage(e.response?.data?.message || "Could not redeem.");
    }
  };

  const switchToManual = async () => {
    await stopScanner();
    setStatus("idle");
    setMessage("");
    setMode("manual");
  };

  const submitManual = (e) => {
    e.preventDefault();
    redeem(manualCode.trim());
  };

  const reset = async () => {
    await stopScanner();
    setStatus("idle");
    setMessage("");
    setManualCode("");
    if (mode === "camera") {
      setMode("camera");
    }
  };

  return (
    <div className="scan-modal-overlay" onClick={onClose}>
      <style>{css}</style>
      <div className="scan-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sm-close" onClick={onClose}>
          ×
        </button>

        <p className="sm-eyebrow">Checkpoint Scanner</p>
        <h2>Scan QR code</h2>

        {mode === "camera" && status !== "success" && (
          <>
            <div id={SCANNER_ID} className="sm-scanner" />
            {status === "redeeming" && (
              <div className="sm-status info">{message}</div>
            )}
            {status === "error" && (
              <>
                <div className="sm-status error">{message}</div>
                <button className="sm-btn ghost" onClick={reset}>
                  ↻ Try again
                </button>
              </>
            )}
            <button className="sm-btn ghost" onClick={switchToManual}>
              Enter code manually
            </button>
          </>
        )}

        {mode === "manual" && status !== "success" && (
          <form onSubmit={submitManual}>
            <label>Checkpoint code</label>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="CHAPEL-001"
              autoFocus
              required
              disabled={status === "redeeming"}
            />
            {status === "error" && (
              <div className="sm-status error">{message}</div>
            )}
            <div className="sm-actions">
              <button
                type="button"
                className="sm-btn ghost"
                onClick={() => setMode("camera")}
                disabled={status === "redeeming"}
              >
                ← Camera
              </button>
              <button
                type="submit"
                className="sm-btn primary"
                disabled={status === "redeeming"}
              >
                {status === "redeeming" ? "Redeeming…" : "Redeem"}
              </button>
            </div>
          </form>
        )}

        {status === "success" && (
          <div className="sm-success">
            <div className="sm-success-icon">✓</div>
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const css = `
.scan-modal-overlay{
  position:fixed; inset:0; z-index:100;
  background:rgba(27,42,74,0.65);
  display:flex; align-items:center; justify-content:center;
  padding:20px;
  backdrop-filter:blur(3px);
  -webkit-backdrop-filter:blur(3px);
}
.scan-modal{
  background:#FFFDF8;
  border-radius:8px;
  max-width:440px; width:100%;
  max-height:92vh; overflow-y:auto;
  padding:32px;
  position:relative;
  font-family:'Inter',sans-serif;
  color:#1B2A4A;
  box-shadow:0 30px 80px rgba(27,42,74,0.3);
  text-align:center;
}
.sm-close{
  position:absolute; top:10px; right:12px;
  width:32px; height:32px;
  border:none; background:transparent;
  font-size:1.5rem; cursor:pointer;
  color:#5a6380; line-height:1;
}
.sm-close:hover{ color:#b23b3b; }

.sm-eyebrow{
  font-size:0.75rem; font-weight:600;
  color:#B8912F; letter-spacing:0.08em;
  text-transform:uppercase; margin:0 0 4px;
}
.scan-modal h2{
  font-family:'Cormorant Garamond', serif;
  font-size:1.55rem; font-weight:600;
  margin:0 0 18px;
}

.sm-scanner{
  width:100%; max-width:320px; margin:0 auto 14px;
  border-radius:6px; overflow:hidden;
  background:#000;
  min-height:240px;
}
.sm-scanner video{ border-radius:6px; }

.sm-status{
  padding:10px 14px;
  border-radius:3px;
  font-size:0.9rem;
  margin:10px 0 12px;
  text-align:center;
}
.sm-status.error{ background:#fff2f0; color:#b23b3b; border:1px solid #f0c8c2; }
.sm-status.info{ background:#F8F4E9; color:#8a6d10; border:1px solid rgba(184,145,47,0.3); }

.scan-modal label{
  display:block; font-size:0.82rem;
  font-weight:500; margin-bottom:6px;
  color:#3a4560; text-align:left;
}
.scan-modal input{
  width:100%; padding:12px 14px;
  border:1px solid rgba(27,42,74,0.14);
  border-radius:3px;
  font-family:'Courier New', monospace;
  font-size:1.05rem;
  letter-spacing:0.06em;
  margin-bottom:14px;
  text-align:center;
  text-transform:uppercase;
}
.scan-modal input:focus{
  outline:none; border-color:#B8912F;
  box-shadow:0 0 0 3px rgba(184,145,47,0.12);
}

.sm-actions{
  display:flex; gap:10px; justify-content:space-between;
}
.sm-btn{
  padding:10px 20px;
  border-radius:3px;
  border:1px solid rgba(27,42,74,0.18);
  background:transparent; color:#1B2A4A;
  font-family:inherit; font-size:0.9rem;
  cursor:pointer; transition:.15s;
}
.sm-btn:hover:not(:disabled){ background:#F8F4E9; }
.sm-btn.primary{ background:#1B2A4A; color:#F8F4E9; border-color:#1B2A4A; }
.sm-btn.primary:hover:not(:disabled){ background:#6E2C2C; border-color:#6E2C2C; }
.sm-btn.ghost{ background:transparent; }
.sm-btn:disabled{ opacity:0.6; cursor:wait; }

.sm-success{ padding:20px 0; }
.sm-success-icon{
  width:70px; height:70px; border-radius:50%;
  background:#E3F3E5; color:#2e7d32;
  display:flex; align-items:center; justify-content:center;
  font-size:2rem; font-weight:600;
  margin:0 auto 16px;
}
.sm-success p{ color:#3a4560; font-size:0.95rem; margin:0; }
`;