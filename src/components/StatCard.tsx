import '../styles/cards.css';

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
}

export const StatCard = ({ title, value, subtitle }: StatCardProps) => (
  <div className="stat-card">
    <h3 className="stat-card-title">{title}</h3>
    <p className="stat-card-value">{value}</p>
    {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
  </div>
);

