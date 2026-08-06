import api from '../config/api';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  authorName: string;
  readTime: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const blogService = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; data: BlogPost[]; count: number }>('/blog');
    return response.data.data || [];
  },
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: BlogPost }>(`/blog/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<BlogPost>) => {
    const response = await api.post<{ success: boolean; data: BlogPost }>('/blog', data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<BlogPost>) => {
    const response = await api.put<{ success: boolean; data: BlogPost }>(`/blog/${id}`, data);
    return response.data.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/blog/${id}`);
    return response.data;
  },
};
