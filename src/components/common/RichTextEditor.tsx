import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

// TinyMCE core & theme
import 'tinymce/tinymce';
import 'tinymce/themes/silver';
import 'tinymce/icons/default';

// TinyMCE plugins (all your used plugins)
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/code';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/media';
import 'tinymce/plugins/table';
import 'tinymce/plugins/help';
import 'tinymce/plugins/wordcount';
import 'tinymce/plugins/paste';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  error?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter explanation...',
  height = 300,
  disabled = false,
  error
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorChange = (content: string) => {
    onChange(content);
  };

  const handleImageUpload = (blobInfo: any, progress: (percent: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('image', blobInfo.blob(), blobInfo.filename());

      fetch(`${import.meta.env.VITE_API_URL}/admin/upload/image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
        }
      })
        .then(response => {
          if (!response.ok) throw new Error('Image upload failed');
          return response.json();
        })
        .then(result => {
          if (result.success && result.data.url) resolve(result.data.url);
          else reject('Image upload failed');
        })
        .catch(error => {
          console.error('Image upload error:', error);
          reject('Image upload failed');
        });
    });
  };

  const editorConfig = {
    height,
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'paste'
    ],
    toolbar: `
      undo redo | blocks |
      bold italic underline strikethrough |
      fontfamily fontsize forecolor backcolor |
      alignleft aligncenter alignright alignjustify |
      bullist numlist outdent indent |
      removeformat | image link | code fullscreen
    `,
    content_style: `
      body {
        font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        padding: 8px;
      }
    `,
    placeholder,
    branding: false,
    statusbar: false,
    resize: false,
    paste_data_images: true,
    images_upload_handler: handleImageUpload,
    images_upload_base_path: '/uploads/',
    automatic_uploads: true,
    file_picker_types: 'image',
    file_picker_callback: (callback: any, value: any, meta: any) => {
      if (meta.filetype === 'image') {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');

        input.onchange = function () {
          const file = (this as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = function () {
              callback(reader.result, { alt: file.name });
            };
            reader.readAsDataURL(file);
          }
        };

        input.click();
      }
    },
    setup: (editor: any) => {
      editor.on('init', () => {
        if (disabled) editor.mode.set('readonly');
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className={`border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'}`}>
        <Editor
          apiKey={import.meta.env.VITE_TINYMCE_API_KEY} // make sure to set in production env
          onInit={(evt, editor) => (editorRef.current = editor)}
          value={value}
          init={editorConfig}
          onEditorChange={handleEditorChange}
          disabled={disabled}
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default RichTextEditor;
