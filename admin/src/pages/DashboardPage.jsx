import { Link } from "react-router-dom";

export default function DashboardPage() {
  return (
    <div>
      <h2>Overzicht</h2>
      <div className="card">
        <p>Welkom in het CMS-beheerpaneel. Kies links een onderdeel om te beheren.</p>
        <p>
          <Link to="/themes" className="btn">
            Thema's beheren
          </Link>{" "}
          <Link to="/pages" className="btn">
            Pagina's beheren
          </Link>
        </p>
      </div>
    </div>
  );
}
