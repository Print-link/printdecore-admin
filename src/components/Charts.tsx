import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = { primary: '#111827', secondary: '#6B7280', accent: '#3B82F6', light: '#D1D5DB' };

interface StatGroup {
  total: number;
  active: number;
  inactive: number;
}

export const UserStatsChart = ({ users }: { users: StatGroup }) => {
  const data = [
    { name: 'Active', value: users.active, fill: COLORS.primary },
    { name: 'Inactive', value: users.inactive, fill: COLORS.light },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
          outerRadius={100}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const OverviewBarChart = ({ users, clerks, clients }: { users: StatGroup; clerks: StatGroup; clients: StatGroup }) => {
  const data = [
    { name: 'Users', Total: users.total, Active: users.active, Inactive: users.inactive },
    { name: 'Clerks', Total: clerks.total, Active: clerks.active, Inactive: clerks.inactive },
    { name: 'Clients', Total: clients.total, Active: clients.active, Inactive: clients.inactive },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="name" style={{ fontSize: '12px' }} />
        <YAxis style={{ fontSize: '12px' }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Total" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
        <Bar dataKey="Active" fill={COLORS.accent} radius={[6, 6, 0, 0]} />
        <Bar dataKey="Inactive" fill={COLORS.light} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const PrintJobsChart = ({ printJobs }: { printJobs: { total: number; pending: number; completed: number } }) => {
  const data = [
    { name: 'Pending', value: printJobs.pending },
    { name: 'Completed', value: printJobs.completed },
  ];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis type="number" style={{ fontSize: '12px' }} />
        <YAxis dataKey="name" type="category" style={{ fontSize: '12px' }} />
        <Tooltip />
        <Bar dataKey="value" fill={COLORS.primary} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const StatusDistributionChart = ({ users, clerks, clients }: { users: StatGroup; clerks: StatGroup; clients: StatGroup }) => {
  const data = [
    { name: 'Users', Active: users.active, Inactive: users.inactive },
    { name: 'Clerks', Active: clerks.active, Inactive: clerks.inactive },
    { name: 'Clients', Active: clients.active, Inactive: clients.inactive },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="name" style={{ fontSize: '12px' }} />
        <YAxis style={{ fontSize: '12px' }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Active" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
        <Bar dataKey="Inactive" fill={COLORS.light} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
