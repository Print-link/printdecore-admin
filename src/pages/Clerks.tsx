import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clerkService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Pagination } from '../components/Pagination';
import '../styles/pages.css';
import '../styles/table.css';
import '../styles/forms.css';

export const Clerks = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['clerks', page, search, statusFilter],
    queryFn: () =>
      clerkService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        isActive: statusFilter ? statusFilter === 'active' : undefined,
      }),
  });

  return (
    <Layout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Clerks Management</h1>
          </div>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search clerks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="filter-input"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Admin</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {data?.clerks.map((clerk, index) => {
                    const admin = typeof clerk.adminId === 'object' ? clerk.adminId : null;
                    return (
                      <tr key={clerk._id} className="table-row">
                        <td className="table-cell">{clerk.name}</td>
                        <td className="table-cell">{clerk.email}</td>
                        <td className="table-cell">
                          {admin ? admin.name || admin.email : '-'}
                        </td>
                        <td className="table-cell">
                          <span className={`status-badge ${clerk.isActive ? 'active' : 'inactive'}`}>
                            {clerk.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="table-cell">
                          {new Date(clerk.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {data?.pagination && (
              <Pagination
                currentPage={data.pagination.currentPage}
                totalPages={data.pagination.totalPages}
                totalItems={data.pagination.totalItems}
                itemsPerPage={data.pagination.itemsPerPage}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
};
