import axios from 'axios';
import {
  User,
  Category,
  CategoryWithNominees,
  Nominee,
  CreateNominee,
  Vote,
  MediaUpload,
  VotingResults,
  AuthTokens,
  LoginCredentials,
  RegisterData,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const response = await api.post('/auth?action=token', {
      username: credentials.username,
      password: credentials.password
    });
    return response.data.data;
  },

  register: async (userData: RegisterData): Promise<User> => {
    const response = await api.post('/auth?action=register', userData);
    return response.data.data.user;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth?action=me');
    return response.data.data.user;
  },
};

export const categories = {
  getAll: async (year?: number, activeOnly: boolean = true): Promise<CategoryWithNominees[]> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (!activeOnly) params.append('active_only', 'false');

    const response = await api.get(`/categories?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<CategoryWithNominees> => {
    const response = await api.get(`/categories?id=${id}`);
    return response.data.data;
  },

  create: async (category: Omit<Category, 'id' | 'is_active' | 'created_at'>): Promise<Category> => {
    const response = await api.post('/categories/', category);
    return response.data.data;
  },

  update: async (id: string, category: Partial<Category>): Promise<Category> => {
    const response = await api.put(`/categories?id=${id}`, category);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories?id=${id}`);
  },
};

export const nominees = {
  getAll: async (categoryId?: string, activeOnly: boolean = true): Promise<Nominee[]> => {
    const params = new URLSearchParams();
    if (categoryId) params.append('category_id', categoryId);
    if (!activeOnly) params.append('active_only', 'false');

    const response = await api.get(`/nominees?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<Nominee> => {
    const response = await api.get(`/nominees?id=${id}`);
    return response.data.data;
  },

  create: async (nominee: CreateNominee): Promise<Nominee> => {
    const response = await api.post('/nominees/', nominee);
    return response.data.data;
  },

  update: async (id: string, nominee: Partial<Nominee>): Promise<Nominee> => {
    const response = await api.put(`/nominees?id=${id}`, nominee);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/nominees?id=${id}`);
  },
};

export const votes = {
  create: async (nomineeId: string, categoryId: string): Promise<Vote> => {
    const response = await api.post('/votes/', {
      nominee_id: nomineeId,
      category_id: categoryId
    });
    return response.data.data;
  },

  getMyVotes: async (): Promise<Vote[]> => {
    const response = await api.get('/votes?action=my');
    return response.data.data;
  },

  getResults: async (categoryId?: string): Promise<VotingResults[]> => {
    const params = categoryId ? `&category_id=${categoryId}` : '';
    const response = await api.get(`/votes?action=results${params}`);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/votes?id=${id}`);
  },
};

export const media = {
  upload: async (file: File, description?: string): Promise<MediaUpload> => {
    // Import supabase client dynamically to avoid circular dependencies
    const { supabase } = await import('../utils/supabaseClient');

    // Get current user's token for authentication
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;

    // Get user ID from token (decode JWT)
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const userId = tokenPayload.user_id;
    const storagePath = `uploads/${userId}/${fileName}`;

    // Upload directly to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error('Failed to upload file to storage');
    }

    // Create metadata record via API
    const mediaType = file.type.startsWith('image/') ? 'photo' : 'video';
    const response = await api.post('/media?action=create_metadata', {
      filename: fileName,
      original_filename: file.name,
      file_path: uploadData.path,
      media_type: mediaType,
      file_size: file.size,
      description: description || '',
    });

    return response.data.data;
  },

  getMyUploads: async (): Promise<MediaUpload[]> => {
    const response = await api.get('/media?action=my');
    return response.data.data;
  },

  getAllUploads: async (status?: string): Promise<MediaUpload[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/media${params}`);
    return response.data.data;
  },

  getPendingUploads: async (): Promise<MediaUpload[]> => {
    const response = await api.get('/media?action=pending');
    return response.data.data;
  },

  review: async (mediaId: string, status: 'approved' | 'rejected', adminNotes?: string): Promise<any> => {
    const response = await api.post('/media?action=review', {
      media_id: mediaId,
      status,
      admin_notes: adminNotes
    });
    return response.data.data;
  },

  adminDelete: async (mediaId: string): Promise<void> => {
    await api.delete(`/media?id=${mediaId}`);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/media?id=${id}`);
  },
};

export default api;
