import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { blogService, type BlogPost } from '../services/superAdminService';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { ListGroup, ListRow } from '../components/ui/ListGroup';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { FormField, iosInputCls } from '../components/ui/FormField';
import toast from 'react-hot-toast';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function BlogPosts() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Form state
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    category: 'General',
    tags: '',
    status: 'draft' as 'draft' | 'published',
    authorName: 'Printdecore',
    readTime: '',
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: blogService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<BlogPost>) => blogService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Blog post created');
      closeModal();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to create post'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BlogPost> }) =>
      blogService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Blog post updated');
      closeModal();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to update post'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Blog post deleted');
      setDeleteId(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to delete post'),
  });

  const openCreate = () => {
    setEditingPost(null);
    setForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: '',
      category: 'General',
      tags: '',
      status: 'draft',
      authorName: 'Printdecore',
      readTime: '',
    });
    setIsModalOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      coverImage: post.coverImage || '',
      category: post.category,
      tags: (post.tags || []).join(', '),
      status: post.status,
      authorName: post.authorName,
      readTime: post.readTime || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPost(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<BlogPost> = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt || undefined,
      content: form.content,
      coverImage: form.coverImage || undefined,
      category: form.category,
      tags: form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      status: form.status,
      authorName: form.authorName,
      readTime: form.readTime || undefined,
    };

    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const togglePublish = (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    updateMutation.mutate({ id: post.id, data: { status: newStatus } });
  };

  const filteredPosts = posts.filter((p: BlogPost) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const publishedCount = posts.filter((p: BlogPost) => p.status === 'published').length;
  const draftCount = posts.filter((p: BlogPost) => p.status === 'draft').length;

  return (
    <Layout>
      <div>
        <PageHeader
          title="Blog Posts"
          subtitle={`${publishedCount} published, ${draftCount} drafts`}
          actions={<Button size="sm" onClick={openCreate}>+ New Post</Button>}
        />

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-brand text-ios-label'
                  : 'bg-ios-gray6 text-ios-secondary-label hover:bg-ios-gray5'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 text-xs opacity-70">
                ({f === 'all' ? posts.length : f === 'published' ? publishedCount : draftCount})
              </span>
            </button>
          ))}
        </div>

        {/* Posts List */}
        {isLoading ? (
          <div className="text-center py-20 text-ios-secondary-label">Loading...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-ios shadow-ios">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-lg font-bold text-ios-label mb-1">
              No blog posts yet
            </h3>
            <p className="text-sm text-ios-secondary-label mb-6">
              Create your first blog post to start sharing content on the site.
            </p>
            <Button onClick={openCreate}>Create First Post</Button>
          </div>
        ) : (
          <ListGroup>
            {filteredPosts.map((post: BlogPost) => (
              <ListRow
                key={post.id}
                leading={
                  post.coverImage ? (
                    <img src={post.coverImage} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-brand-hover" />
                    </div>
                  )
                }
                title={post.title}
                subtitle={`${post.category} · /${post.slug}`}
                trailing={
                  <>
                    <Badge variant={post.status === 'published' ? 'success' : 'warning'}>{post.status}</Badge>
                    <Switch checked={post.status === 'published'} onChange={() => togglePublish(post)} />
                    <Button size="sm" variant="ghost" onClick={() => openEdit(post)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteId(post.id)}>Delete</Button>
                  </>
                }
              />
            ))}
          </ListGroup>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingPost ? 'Edit Blog Post' : 'New Blog Post'}
          size="large"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Title *">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      title: e.target.value,
                      slug: editingPost ? form.slug : slugify(e.target.value),
                    });
                  }}
                  required
                  className={iosInputCls}
                />
              </FormField>
              <FormField label="Slug *">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                  className={iosInputCls}
                />
              </FormField>
            </div>

            <FormField label="Excerpt">
              <input
                type="text"
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Short summary shown on cards"
                className={iosInputCls}
              />
            </FormField>

            <FormField label="Content *">
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
                rows={10}
                className={`${iosInputCls} resize-y`}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Cover Image URL">
                <input
                  type="text"
                  value={form.coverImage}
                  onChange={(e) =>
                    setForm({ ...form, coverImage: e.target.value })
                  }
                  placeholder="https://..."
                  className={iosInputCls}
                />
              </FormField>
              <FormField label="Category">
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className={iosInputCls}
                >
                  <option value="General">General</option>
                  <option value="Industry Tips">Industry Tips</option>
                  <option value="Print Guides">Print Guides</option>
                  <option value="Business">Business</option>
                  <option value="Product Updates">Product Updates</option>
                  <option value="Vendor Stories">Vendor Stories</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField label="Tags (comma-separated)">
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="printing, tips, ghana"
                  className={iosInputCls}
                />
              </FormField>
              <FormField label="Read Time">
                <input
                  type="text"
                  value={form.readTime}
                  onChange={(e) =>
                    setForm({ ...form, readTime: e.target.value })
                  }
                  placeholder="5 min read"
                  className={iosInputCls}
                />
              </FormField>
              <FormField label="Status">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as 'draft' | 'published',
                    })
                  }
                  className={iosInputCls}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </FormField>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingPost
                    ? 'Update Post'
                    : 'Create Post'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <Modal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          title="Delete Blog Post"
        >
          <p className="text-sm text-ios-secondary-label mb-6">
            Are you sure you want to delete this post? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
