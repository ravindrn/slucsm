import { Link } from "react-router-dom";

const css = `
.event-page-nav{
  --ink:#1B2A4A;
  --ivory:#F8F4E9;
  --gold:#B8912F;
  --maroon:#6E2C2C;
  --paper:#FFFDF8;
  --line:rgba(27,42,74,0.14);

  position:sticky; top:0; z-index:20;
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 6vw;
  border-bottom:1px solid var(--line);
  background:rgba(248,244,233,0.94);
  backdrop-filter:blur(6px);
  -webkit-backdrop-filter:blur(6px);
  font-family:'Inter',sans-serif;
  color:var(--ink);
}
.event-page-nav .brand{
  display:flex; align-items:center; gap:10px;
  text-decoration:none;
  color:var(--ink);
  font-family:'Cormorant Garamond',serif;
  font-size:1.3rem;
  font-weight:600;
}
.event-page-nav .brand-logo{
  width:38px; height:38px; border-radius:50%; object-fit:contain;
  border:1.4px solid var(--gold);
  background:var(--paper);
}
.event-page-nav .back-link{
  text-decoration:none;
  font-size:0.92rem;
  color:var(--ink);
  opacity:0.8;
  transition:opacity .2s, color .2s;
}
.event-page-nav .back-link:hover{
  opacity:1;
  color:var(--maroon);
}
`;

export default function EventNav({ backTo = "/#events", backLabel = "← Back to Events" }) {
  return (
    <>
      <style>{css}</style>
      <header className="event-page-nav">
        <Link to="/" className="brand">
          <img src="/slucsmLogo.png" alt="SLUCSM Logo" className="brand-logo" />
          <span>SLUCSM</span>
        </Link>
        <Link to={backTo} className="back-link">{backLabel}</Link>
      </header>
    </>
  );
}