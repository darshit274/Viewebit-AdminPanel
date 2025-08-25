import api from './api';

export interface ImportUploadResponse {
  success: boolean;
  data: {
    import_id: string;
    status: string;
    message: string;
  };
  message?: string;
}

export interface ImportStatusResponse {
  success: boolean;
  data: {
    id: string;
    import_status: 'uploaded' | 'validating' | 'validated' | 'importing' | 'completed' | 'failed';
    total_rows: number;
    successful_imports: number;
    failed_imports: number;
    validation_errors?: any[];
    import_errors?: any[];
    import_summary?: any;
    category?: { id: number; name: string };
    admin?: { id: string; name: string; email: string };
    created_at: string;
    updated_at: string;
  };
}

export interface ImportPreviewResponse {
  success: boolean;
  data: {
    total_valid_questions: number;
    total_errors: number;
    preview_questions: Array<{
      question_text: string;
      question_text_gujarati?: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      option_a_gujarati?: string;
      option_b_gujarati?: string;
      option_c_gujarati?: string;
      option_d_gujarati?: string;
      correct_answer: string;
      explanation?: string;
      explanation_gujarati?: string;
      marks: number;
    }>;
    validation_errors: Array<{
      row: number;
      field: string;
      error: string;
    }>;
  };
}

export interface ImportHistoryResponse {
  success: boolean;
  data: Array<{
    id: string;
    filename: string;
    original_filename: string;
    file_type: 'excel' | 'csv';
    import_status: string;
    total_rows: number;
    successful_imports: number;
    failed_imports: number;
    category?: { id: number; name: string };
    created_at: string;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class QuestionImportService {
  // Download template file
  async downloadTemplate(format: 'excel' | 'csv'): Promise<Blob> {
    const response = await api.get(`/admin/questions/import/template/${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Upload file for import
  async uploadFile(
    file: File, 
    categoryId: number, 
    testSeriesId?: number
  ): Promise<ImportUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category_id', categoryId.toString());
    if (testSeriesId) {
      formData.append('test_series_id', testSeriesId.toString());
    }

    const response = await api.post('/admin/questions/import/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Get import status
  async getImportStatus(importId: string): Promise<ImportStatusResponse> {
    const response = await api.get(`/admin/questions/import/status/${importId}`);
    return response.data;
  }

  // Get import preview
  async getImportPreview(importId: string): Promise<ImportPreviewResponse> {
    const response = await api.get(`/admin/questions/import/preview/${importId}`);
    return response.data;
  }

  // Confirm import
  async confirmImport(importId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/admin/questions/import/confirm/${importId}`);
    return response.data;
  }

  // Get import history
  async getImportHistory(
    page = 1, 
    limit = 10, 
    categoryId?: number
  ): Promise<ImportHistoryResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (categoryId) {
      params.append('category_id', categoryId.toString());
    }

    const response = await api.get(`/admin/questions/import/history?${params}`);
    return response.data;
  }

  // Helper method to download template and trigger browser download
  async downloadTemplateFile(format: 'excel' | 'csv'): Promise<void> {
    try {
      const blob = await this.downloadTemplate(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `question_import_template.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to download ${format} template`);
    }
  }
}

export const questionImportService = new QuestionImportService();
export default questionImportService;