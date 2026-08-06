import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MoreVertical, Printer, ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { printerListingService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { FormField, iosInputCls } from '../components/ui/FormField';
import type { PrinterListing } from '../types';

// One entry per image in the picker: either an already-uploaded URL (edit mode)
// or a freshly picked File with a local object-URL preview.
interface ImageEntry {
  url?: string;
  file?: File;
  preview: string;
}

const MAX_IMAGES = 8;

export const PrinterListings = () => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<PrinterListing | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      for (const ref of Object.values(dropdownRefs.current)) {
        if (ref && ref.contains(target)) return;
      }
      setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [openMenuId]);

  const { data, isLoading } = useQuery({
    queryKey: ['printer-listings'],
    queryFn: () => printerListingService.getAll({ limit: 100 }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['printer-listings'] });

  const createMutation = useMutation({
    mutationFn: (form: FormData) => printerListingService.create(form),
    onSuccess: () => { invalidate(); toast.success('Printer listed'); closeForm(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create listing'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: FormData }) => printerListingService.update(id, form),
    onSuccess: () => { invalidate(); toast.success('Listing updated'); closeForm(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update listing'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => printerListingService.delete(id),
    onSuccess: () => { invalidate(); toast.success('Listing deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete listing'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => {
      const form = new FormData();
      form.append('isActive', String(isActive));
      return printerListingService.update(id, form);
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update listing'),
  });

  const openCreate = () => { setEditingListing(null); setIsFormOpen(true); };
  const openEdit = (listing: PrinterListing) => { setEditingListing(listing); setIsFormOpen(true); setOpenMenuId(null); };
  const closeForm = () => { setIsFormOpen(false); setEditingListing(null); };

  return (
    <Layout>
      <div>
        <button onClick={() => navigate('/printer-sales')} className="flex items-center gap-1 text-sm font-medium text-brand-hover hover:opacity-70 mb-3">
          <ArrowLeft className="w-4 h-4" /> Orders
        </button>
        <PageHeader
          title="Printer Listings"
          subtitle="Printers and equipment listed for sale on the mobile app"
          actions={<Button size="sm" onClick={openCreate}>Add Printer</Button>}
        />

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : !data?.listings.length ? (
          <div className="bg-white rounded-ios shadow-ios px-4 py-16 text-center text-ios-gray">
            No printers listed yet
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {data.listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-ios shadow-ios border border-ios-gray5 overflow-hidden">
                <div className="relative h-36 bg-ios-gray6">
                  {listing.images[0] ? (
                    <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Printer className="w-9 h-9 text-ios-gray3" />
                    </div>
                  )}
                  {listing.images.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/50 backdrop-blur text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                      +{listing.images.length - 1} more
                    </span>
                  )}
                  <div className="absolute top-2 right-2" ref={(el) => { dropdownRefs.current[listing.id] = el; }}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === listing.id ? null : listing.id)}
                      className="p-1.5 rounded-full bg-black/35 text-white hover:bg-black/50 backdrop-blur"
                      type="button"
                      aria-label="More actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenuId === listing.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white rounded-ios shadow-ios border border-ios-gray5 py-1 z-10">
                        <button onClick={() => openEdit(listing)} className="w-full text-left px-3 py-1.5 text-sm text-ios-label hover:bg-ios-gray6">Edit</button>
                        <button
                          onClick={() => { if (window.confirm(`Delete "${listing.name}"?`)) deleteMutation.mutate(listing.id); setOpenMenuId(null); }}
                          className="w-full text-left px-3 py-1.5 text-sm text-ios-red hover:bg-ios-red/10"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-ios-label">GHS {listing.price.toLocaleString()}</p>
                    <Switch checked={listing.isActive} onChange={() => toggleActiveMutation.mutate({ id: listing.id, isActive: !listing.isActive })} />
                  </div>
                  <p className="text-sm font-medium text-ios-label mt-0.5 truncate">{listing.name}</p>
                  <p className="text-xs text-ios-secondary-label mt-1 line-clamp-2">{listing.description || 'No description'}</p>

                  <div className="flex items-center gap-1.5 flex-wrap mt-3">
                    <Badge variant={listing.quantity > 0 ? 'neutral' : 'danger'}>
                      {listing.quantity > 0 ? `${listing.quantity} in stock` : 'Out of stock'}
                    </Badge>
                    {listing.tags.map((tag) => (
                      <Badge key={tag} variant="warning">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <PrinterListingForm
          isOpen={isFormOpen}
          listing={editingListing}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onClose={closeForm}
          onSubmit={(form) => {
            if (editingListing) updateMutation.mutate({ id: editingListing.id, form });
            else createMutation.mutate(form);
          }}
        />
      </div>
    </Layout>
  );
};

function PrinterListingForm({
  isOpen,
  listing,
  isSaving,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  listing: PrinterListing | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (form: FormData) => void;
}) {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reseed the picker whenever a different listing is opened (or the modal opens for create).
  useEffect(() => {
    if (!isOpen) return;
    setImages((listing?.images || []).map((url) => ({ url, preview: url })));
  }, [isOpen, listing]);

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`You can attach up to ${MAX_IMAGES} images`);
      return;
    }
    const picked = Array.from(files).slice(0, remaining).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...picked]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const entry = prev[index];
      if (entry.file) URL.revokeObjectURL(entry.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const form = new FormData();
    form.append('name', fd.get('name') as string);
    form.append('price', fd.get('price') as string);
    form.append('quantity', fd.get('quantity') as string);
    form.append('description', (fd.get('description') as string) || '');
    form.append(
      'tags',
      JSON.stringify(
        String(fd.get('tags') || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      )
    );
    form.append(
      'specs',
      JSON.stringify(
        String(fd.get('specs') || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );

    const existingImages = images.filter((i) => i.url).map((i) => i.url as string);
    form.append('existingImages', JSON.stringify(existingImages));
    images.filter((i) => i.file).forEach((i) => form.append('images', i.file as File));

    onSubmit(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={listing ? 'Edit Printer Listing' : 'Add Printer Listing'} size="large">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={`Images (${images.length}/${MAX_IMAGES})`}>
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={img.preview} className="relative w-20 h-20 rounded-ios overflow-hidden border border-ios-gray5 group">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-ios border-2 border-dashed border-ios-gray4 hover:border-brand-hover bg-ios-gray6 flex flex-col items-center justify-center gap-1 text-ios-gray"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-[10px] font-medium">Add</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => addFiles(e.target.files)}
            className="hidden"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <FormField label="Printer Name">
              <input type="text" name="name" required defaultValue={listing?.name} className={iosInputCls} placeholder="e.g. HP LaserJet Pro M425dn" />
            </FormField>
          </div>
          <FormField label="Price (GHS)">
            <input type="number" name="price" min="0" step="0.01" required defaultValue={listing?.price} className={iosInputCls} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Quantity in stock">
            <input type="number" name="quantity" min="0" step="1" required defaultValue={listing?.quantity ?? 1} className={iosInputCls} />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Tags (comma-separated)">
              <input type="text" name="tags" defaultValue={listing?.tags.join(', ')} className={iosInputCls} placeholder="Laser Printer, Used" />
            </FormField>
          </div>
        </div>

        <FormField label="Description">
          <textarea name="description" rows={3} defaultValue={listing?.description || ''} className={iosInputCls} placeholder="Condition, notable features, what's included…" />
        </FormField>

        <FormField label="Specifications (one per line)">
          <textarea
            name="specs"
            rows={4}
            defaultValue={listing?.specs.join('\n')}
            className={iosInputCls}
            placeholder={'Print speed: up to 35 ppm\nDuplex printing\nEthernet + USB connectivity'}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : listing ? 'Save Changes' : 'Add Printer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
