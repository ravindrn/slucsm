import Swal from "sweetalert2";

/* ---------- Shared theme ---------- */
const PALETTE = {
  ink: "#1B2A4A",
  ivory: "#F8F4E9",
  gold: "#B8912F",
  maroon: "#6E2C2C",
  paper: "#FFFDF8",
  line: "rgba(27,42,74,0.14)",
};

/* Custom class so CSS below targets only our dialogs */
const BASE_CLASS = {
  popup: "sw-popup",
  title: "sw-title",
  htmlContainer: "sw-text",
  confirmButton: "sw-confirm",
  cancelButton: "sw-cancel",
  actions: "sw-actions",
  icon: "sw-icon",
};

/* Inject theme once */
const STYLE_ID = "slucsm-swal-theme";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .sw-popup {
      background: ${PALETTE.paper} !important;
      border-radius: 14px !important;
      padding: 32px 32px 24px !important;
      box-shadow: 0 30px 80px rgba(27,42,74,0.35) !important;
      font-family: 'Inter', sans-serif !important;
      color: ${PALETTE.ink} !important;
      max-width: 460px !important;
      border-top: 6px solid ${PALETTE.gold} !important;
      overflow: hidden;
    }
    .sw-title {
      font-family: 'Cormorant Garamond', serif !important;
      font-size: 1.6rem !important;
      font-weight: 600 !important;
      color: ${PALETTE.ink} !important;
      margin: 6px 0 10px !important;
      padding: 0 !important;
    }
    .sw-text {
      font-size: 0.95rem !important;
      color: #3a4560 !important;
      line-height: 1.6 !important;
      margin: 0 0 22px !important;
      white-space: pre-line;
    }
    .sw-actions {
      display: flex !important;
      gap: 10px !important;
      justify-content: flex-end !important;
      margin: 22px 0 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }
    .sw-confirm,
    .sw-cancel {
      padding: 10px 22px !important;
      border-radius: 6px !important;
      font-family: inherit !important;
      font-size: 0.92rem !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      transition: .15s !important;
      margin: 0 !important;
      border: 1px solid transparent !important;
      box-shadow: none !important;
    }
    .sw-confirm {
      background: ${PALETTE.ink} !important;
      color: ${PALETTE.ivory} !important;
      border-color: ${PALETTE.ink} !important;
    }
    .sw-confirm:hover {
      background: ${PALETTE.maroon} !important;
      border-color: ${PALETTE.maroon} !important;
    }
    .sw-confirm.sw-danger {
      background: #b23b3b !important;
      border-color: #b23b3b !important;
    }
    .sw-confirm.sw-danger:hover {
      background: #8a2828 !important;
      border-color: #8a2828 !important;
    }
    .sw-cancel {
      background: transparent !important;
      color: ${PALETTE.ink} !important;
      border-color: ${PALETTE.line} !important;
    }
    .sw-cancel:hover {
      background: ${PALETTE.ivory} !important;
    }
    .sw-icon {
      margin: 0 auto 4px !important;
      border-color: ${PALETTE.gold} !important;
      color: ${PALETTE.gold} !important;
    }
    .sw-icon.sw-icon-error { border-color: #b23b3b !important; color: #b23b3b !important; }
    .sw-icon.sw-icon-warning { border-color: ${PALETTE.gold} !important; color: ${PALETTE.gold} !important; }
    .sw-icon.sw-icon-success { border-color: #2e7d32 !important; color: #2e7d32 !important; }
    .sw-icon.sw-icon-info { border-color: #2c5da0 !important; color: #2c5da0 !important; }
    .swal2-input {
      font-family: inherit !important;
      border: 1px solid ${PALETTE.line} !important;
      border-radius: 6px !important;
      padding: 10px 14px !important;
      font-size: 0.95rem !important;
      margin: 10px 0 0 !important;
    }
    .swal2-input:focus {
      border-color: ${PALETTE.gold} !important;
      box-shadow: 0 0 0 3px rgba(184,145,47,0.15) !important;
    }
    @media (max-width: 520px) {
      .sw-popup { padding: 26px 22px 20px !important; }
      .sw-title { font-size: 1.35rem !important; }
      .sw-actions { flex-direction: column-reverse !important; }
      .sw-confirm, .sw-cancel { width: 100% !important; }
    }
  `;
  document.head.appendChild(style);
}

/* ============================================================
   CONFIRM
   Usage: const ok = await confirmDialog({ title, text, danger, confirmText, cancelText })
   ============================================================ */
export async function confirmDialog({
  title = "Are you sure?",
  text = "",
  icon = "question",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
} = {}) {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    buttonsStyling: false,
    customClass: {
      ...BASE_CLASS,
      confirmButton: `sw-confirm${danger ? " sw-danger" : ""}`,
      icon: `sw-icon sw-icon-${icon}`,
    },
    reverseButtons: true,
    focusCancel: danger,
    allowOutsideClick: true,
    allowEscapeKey: true,
  });
  return result.isConfirmed;
}

/* ============================================================
   PROMPT
   Usage: const val = await promptDialog({ title, text, placeholder, defaultValue })
   Returns the entered string, or null if cancelled.
   ============================================================ */
export async function promptDialog({
  title = "Enter a value",
  text = "",
  placeholder = "",
  defaultValue = "",
  confirmText = "OK",
  cancelText = "Cancel",
} = {}) {
  const result = await Swal.fire({
    title,
    text,
    input: "text",
    inputValue: defaultValue,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    buttonsStyling: false,
    customClass: BASE_CLASS,
    reverseButtons: true,
    inputValidator: (value) => {
      if (!value || !value.trim()) return "This field is required";
      return null;
    },
  });
  return result.isConfirmed ? result.value : null;
}

/* ============================================================
   ALERT (styled, replaces window.alert when you want it inline)
   ============================================================ */
export async function alertDialog({
  title = "Notice",
  text = "",
  icon = "info",
  confirmText = "OK",
} = {}) {
  await Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: confirmText,
    buttonsStyling: false,
    customClass: {
      ...BASE_CLASS,
      icon: `sw-icon sw-icon-${icon}`,
    },
  });
}