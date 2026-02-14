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
  LineChart,
  Line,
} from 'recharts';

// Gold theme colors
const GOLD_PRIMARY = '#D4AF37';
const GOLD_SECONDARY = '#F4D03F';
const GOLD_LIGHT = '#F9E79F';
const BLACK = '#1A1A1A';
const WHITE = '#FFFFFF';
const GRAY = '#6B7280';

const COLORS = [GOLD_PRIMARY, GOLD_SECONDARY, GOLD_LIGHT, '#E5E7EB'];

interface UserStatsChartProps {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
}

export const UserStatsChart = ({ users }: UserStatsChartProps) => {
  const data = [
    { name: 'Active', value: users.active, fill: GOLD_PRIMARY },
    { name: 'Inactive', value: users.inactive, fill: GRAY },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: WHITE,
            border: `2px solid ${GOLD_PRIMARY}`,
            borderRadius: '8px',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

interface OverviewBarChartProps {
  users: { total: number; active: number; inactive: number };
  clerks: { total: number; active: number; inactive: number };
  clients: { total: number; active: number; inactive: number };
}

export const OverviewBarChart = ({ users, clerks, clients }: OverviewBarChartProps) => {
  const data = [
    {
      name: 'Users',
      Total: users.total,
      Active: users.active,
      Inactive: users.inactive,
    },
    {
      name: 'Clerks',
      Total: clerks.total,
      Active: clerks.active,
      Inactive: clerks.inactive,
    },
    {
      name: 'Clients',
      Total: clients.total,
      Active: clients.active,
      Inactive: clients.inactive,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          stroke={BLACK}
          style={{ fontSize: '12px', fontWeight: 500 }}
        />
        <YAxis stroke={BLACK} style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: WHITE,
            border: `2px solid ${GOLD_PRIMARY}`,
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar dataKey="Total" fill={GOLD_PRIMARY} radius={[8, 8, 0, 0]} />
        <Bar dataKey="Active" fill={GOLD_SECONDARY} radius={[8, 8, 0, 0]} />
        <Bar dataKey="Inactive" fill={GRAY} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

interface PrintJobsChartProps {
  printJobs: {
    total: number;
    pending: number;
    completed: number;
  };
}

export const PrintJobsChart = ({ printJobs }: PrintJobsChartProps) => {
  const data = [
    { name: 'Pending', value: printJobs.pending, fill: '#F59E0B' },
    { name: 'Completed', value: printJobs.completed, fill: GOLD_PRIMARY },
  ];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis type="number" stroke={BLACK} style={{ fontSize: '12px' }} />
        <YAxis
          dataKey="name"
          type="category"
          stroke={BLACK}
          style={{ fontSize: '12px', fontWeight: 500 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: WHITE,
            border: `2px solid ${GOLD_PRIMARY}`,
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="value" fill={GOLD_PRIMARY} radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

interface StatusDistributionChartProps {
  users: { total: number; active: number; inactive: number };
  clerks: { total: number; active: number; inactive: number };
  clients: { total: number; active: number; inactive: number };
}

export const StatusDistributionChart = ({
  users,
  clerks,
  clients,
}: StatusDistributionChartProps) => {
  const data = [
    { name: 'Users', Active: users.active, Inactive: users.inactive },
    { name: 'Clerks', Active: clerks.active, Inactive: clerks.inactive },
    { name: 'Clients', Active: clients.active, Inactive: clients.inactive },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          stroke={BLACK}
          style={{ fontSize: '12px', fontWeight: 500 }}
        />
        <YAxis stroke={BLACK} style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: WHITE,
            border: `2px solid ${GOLD_PRIMARY}`,
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar dataKey="Active" fill={GOLD_PRIMARY} radius={[8, 8, 0, 0]} />
        <Bar dataKey="Inactive" fill={GRAY} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

