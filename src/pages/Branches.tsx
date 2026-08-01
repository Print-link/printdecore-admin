import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Store, MapPin, Phone, Mail, Crown } from 'lucide-react';
import { branchService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Pagination } from '../components/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { iosInputCls } from '../components/ui/FormField';
import { getStoreOpenStatus } from '../utils/storeHours';
import toast from 'react-hot-toast';

export const Branches = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!openDropdownId) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      for (const ref of Object.values(dropdownRefs.current)) {
        if (ref && ref.contains(target)) return;
      }
      setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [openDropdownId]);

  const { data, isLoading } = useQuery({
    queryKey: ['branches', page, search],
    queryFn: () => branchService.getAll({ page, limit: 10, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches'] }); toast.success('Branch deleted'); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Failed to delete branch'); },
  });

  return (
    <Layout>
      <div>
        <PageHeader
          title="Branches"
          actions={<Button size="sm" onClick={() => navigate('/branches/new')}>Create Branch</Button>}
        />

        <div className="mb-3">
          <input
            type="text" placeholder="Search branches..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={`max-w-sm ${iosInputCls}`}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <>
            {data?.branches.length === 0 ? (
              <div className="bg-white rounded-ios shadow-ios px-4 py-16 text-center text-ios-gray">No branches yet</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {data?.branches.map((branch) => {
                  const open = getStoreOpenStatus(branch.operatingHours);
                  const isActive = branch.status === 'active' || !branch.status;
                  return (
                    <div
                      key={branch.id}
                      onClick={() => navigate(`/branches/${branch.id}`)}
                      className="group cursor-pointer bg-white rounded-ios shadow-ios border border-ios-gray5 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      {/* Storefront banner */}
                      <div className="relative h-28">
                        {branch.branchCoverImage ? (
                          <img src={branch.branchCoverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-brand/40 via-brand/15 to-ios-gray6 flex items-center justify-center">
                            <Store className="w-9 h-9 text-brand-hover/70" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/0 to-black/0" />

                        {branch.isMainBranch && (
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-brand text-ios-label text-[11px] font-semibold px-2 py-0.5 rounded-full shadow">
                            <Crown className="w-3 h-3" /> Flagship
                          </span>
                        )}

                        <div
                          className="absolute top-2 right-2 relative"
                          ref={(el) => { dropdownRefs.current[branch.id] = el; }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === branch.id ? null : branch.id)}
                            className="p-1.5 rounded-full bg-black/35 text-white hover:bg-black/50 backdrop-blur"
                            type="button"
                            aria-label="More actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openDropdownId === branch.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-ios shadow-ios border border-ios-gray5 py-1 z-10">
                              <button onClick={() => navigate(`/branches/${branch.id}/edit`)} className="w-full text-left px-3 py-1.5 text-sm text-ios-label hover:bg-ios-gray6">Edit</button>
                              <button onClick={() => { if (window.confirm('Delete this branch?')) deleteMutation.mutate(branch.id); setOpenDropdownId(null); }} className="w-full text-left px-3 py-1.5 text-sm text-ios-red hover:bg-ios-red/10">Delete</button>
                            </div>
                          )}
                        </div>

                        {open.isOpen !== null && (
                          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur px-2 py-0.5 rounded-full">
                            <span className={`w-1.5 h-1.5 rounded-full ${open.isOpen ? 'bg-ios-green animate-pulse' : 'bg-ios-red'}`} />
                            <span className="text-[11px] font-medium text-white">{open.isOpen ? 'Open now' : 'Closed'}</span>
                          </div>
                        )}
                      </div>

                      {/* Storefront info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-ios-label truncate">{branch.name}</h3>
                          <Badge variant={isActive ? 'success' : 'neutral'}>{branch.status || 'Active'}</Badge>
                        </div>
                        <p className="flex items-center gap-1 text-xs text-ios-secondary-label mt-1 truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {branch.location?.address || 'No address set'}
                        </p>

                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-ios-gray5 text-xs text-ios-secondary-label">
                          <span className="flex items-center gap-1 min-w-0">
                            <Phone className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{branch.phoneNumber || '-'}</span>
                          </span>
                          <span className="flex items-center gap-1 min-w-0">
                            <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{branch.branchEmailAddress || '-'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} />}
          </>
        )}
      </div>
    </Layout>
  );
};
