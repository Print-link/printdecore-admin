import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import {
  UserStatsChart,
  OverviewBarChart,
  PrintJobsChart,
  StatusDistributionChart,
} from '../components/Charts';
import '../styles/pages.css';
import '../styles/charts.css';

export const Dashboard = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error-message">Error loading dashboard stats</div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="error-message">No data available</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Overview of your system statistics</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="chart-grid">
          <div className="chart-container">
            <h3 className="chart-title">User Distribution</h3>
            <UserStatsChart users={stats.users} />
          </div>

          <div className="chart-container">
            <h3 className="chart-title">Print Jobs Status</h3>
            <PrintJobsChart printJobs={stats.printJobs} />
          </div>

          <div className="chart-container chart-full-width">
            <h3 className="chart-title">Overview Statistics</h3>
            <OverviewBarChart
              users={stats.users}
              clerks={stats.clerks}
              clients={stats.clients}
            />
          </div>

          <div className="chart-container chart-full-width">
            <h3 className="chart-title">Active vs Inactive Status</h3>
            <StatusDistributionChart
              users={stats.users}
              clerks={stats.clerks}
              clients={stats.clients}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};
