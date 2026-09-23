import { Link } from "react-router-dom";

export default function EventNotFound() {
  return (
    <div
      style={{
        padding: "120px 6vw",
        textAlign: "center",
        fontFamily: "Inter, sans-serif",
        background: "#F8F4E9",
        minHeight: "100vh",
        color: "#1B2A4A",
      }}
    >
      <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "3rem", margin: 0 }}>
        Event not found
      </h1>
      <p style={{ marginTop: 16, opacity: 0.7 }}>
        This event may have been removed or the link is incorrect.
      </p>
      <Link
        to="/"
        style={{
          display: "inline-block",
          marginTop: 24,
          padding: "12px 26px",
          background: "#1B2A4A",
          color: "#F8F4E9",
          textDecoration: "none",
          borderRadius: 2,
        }}
      >
        ← Back to home
      </Link>
    </div>
  );
}