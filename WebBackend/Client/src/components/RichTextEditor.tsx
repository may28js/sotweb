'use client';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { useMemo, useRef, useCallback, useState } from 'react';
import { X, Check, ArrowRightFromLine } from 'lucide-react';
import api from '@/lib/api';

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(
  async () => {
    const { default: RQ, Quill } = await import('react-quill-new');
    
    // Register custom HTML5 Video Blot
    const BlockEmbed = Quill.import('blots/block/embed') as any;
    
    // 1. Override default Video blot (iframe) to ensure consistent behavior
    class VideoBlot extends BlockEmbed {
      static create(value: string) {
        const node = super.create();
        node.setAttribute('src', value);
        node.setAttribute('frameborder', '0');
        node.setAttribute('allowfullscreen', 'true');
        node.setAttribute('class', 'ql-video'); // Ensure class is present for styling
        return node;
      }
      
      static value(node: any) {
        return node.getAttribute('src');
      }
    }
    VideoBlot.blotName = 'video';
    VideoBlot.tagName = 'iframe';
    Quill.register(VideoBlot);

    // 2. Register HTML5 Video Blot (video tag)
    class Html5VideoBlot extends BlockEmbed {
      static create(value: string) {
        const node = super.create();
        node.setAttribute('src', value);
        node.setAttribute('controls', 'true');
        node.setAttribute('class', 'ql-video'); // Use same class for consistent styling
        node.setAttribute('style', 'max-width: 100%; height: auto; display: block; margin: 0 auto;');
        return node;
      }
      
      static value(node: any) {
        return node.getAttribute('src');
      }
    }
    Html5VideoBlot.blotName = 'html5video';
    Html5VideoBlot.tagName = 'video';
    Quill.register(Html5VideoBlot);

    // 3. Register Indent Style (Attributor)
    const Parchment = Quill.import('parchment') as any;
    let IndentAttributor;

    // Try standard Parchment approach (Quill 1.x / early 2.x)
    if (Parchment.Attributor && Parchment.Attributor.Style) {
         IndentAttributor = new Parchment.Attributor.Style('indent', 'text-indent', {
            scope: Parchment.Scope.BLOCK,
            whitelist: ['2em']
        });
    } else {
        // Fallback for Quill 2.x where Attributors might be structured differently
        try {
            // In Quill 2.0 (and react-quill-new), standard attributors are registered.
            // We can try to use a registered attributor to get the class
            
            // Cleanest approach for Quill 2+
            // Quill 2.0 uses registry for formats.
            // Let's try to see if we can get the 'style' attributor class via imports that WORK
            // 'attributors/style/align' is commonly available
            
            const Align = Quill.import('attributors/style/align');
            // Align is an instance of StyleAttributor
            if (Align && Align.constructor) {
                const StyleAttributorClass = Align.constructor as any;
                 IndentAttributor = new StyleAttributorClass('indent', 'text-indent', {
                    scope: Parchment.Scope.BLOCK,
                    whitelist: ['2em']
                });
            } else {
                 // If that fails, let's try just 'attributors/style' which might be the base class
                 // Note: The previous error "Cannot import attributors/attribute/style" suggests that path is wrong.
                 
                 // Let's try 'attributors/style/background'
                 const Background = Quill.import('attributors/style/background');
                 if (Background && Background.constructor) {
                     const StyleAttributorClass = Background.constructor as any;
                     IndentAttributor = new StyleAttributorClass('indent', 'text-indent', {
                        scope: Parchment.Scope.BLOCK,
                        whitelist: ['2em']
                    });
                 }
            }

        } catch (e) {
            console.warn('Failed to resolve Quill Style Attributor', e);
        }
    }
    
    if (IndentAttributor) {
        Quill.register(IndentAttributor, true);
    }
    
    return RQ;
  },
  { ssr: false }
) as any;

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
}

const RichTextEditor = ({ content, onChange, editable = true }: RichTextEditorProps) => {
  const quillRef = useRef<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const savedRange = useRef<any>(null);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
          const res = await api.post('/upload/image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          // Ensure we use the full URL if needed, or relative if proxy works
          // Assuming response.data.url is like "/uploads/filename.jpg"
          const url = res.data.url;
          
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', url);
        } catch (error) {
          console.error('Image upload failed:', error);
          alert('图片上传失败，请检查文件大小或网络连接。');
        }
      }
    };
  }, []);

  const videoHandler = useCallback(() => {
    const quill = quillRef.current.getEditor();
    const range = quill.getSelection();
    savedRange.current = range;
    setIsVideoModalOpen(true);
  }, []);

  const insertVideo = () => {
    if (videoUrl && quillRef.current) {
      const quill = quillRef.current.getEditor();
      // Restore cursor position or default to end
      const index = savedRange.current ? savedRange.current.index : (quill.getLength() || 0);
      
      let finalUrl = videoUrl.trim();

      // 1. Handle iframe code: extract src
      const iframeSrcMatch = finalUrl.match(/<iframe.*?src=["'](.*?)["']/);
      if (iframeSrcMatch && iframeSrcMatch[1]) {
        finalUrl = iframeSrcMatch[1];
      }

      // Clean up potential backticks or whitespace from copy-paste
      finalUrl = finalUrl.replace(/[`]/g, '').trim();

      // Decode HTML entities (common in copy-pasted iframe codes)
      finalUrl = finalUrl.replace(/&amp;/g, '&');

      // 2. Handle YouTube Watch URL conversion
      // Match: https://www.youtube.com/watch?v=ID or https://youtu.be/ID
      const youtubeMatch = finalUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      if (youtubeMatch && youtubeMatch[1]) {
        finalUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
      }
      
      // Check if it's a direct video file
      const isDirectVideo = finalUrl.match(/\.(mp4|webm|ogg|mov)$/i);
      
      if (isDirectVideo) {
        quill.insertEmbed(index, 'html5video', finalUrl);
      } else {
        // Default video (iframe)
        quill.insertEmbed(index, 'video', finalUrl);
      }
      
      // Move cursor after the inserted video
      quill.setSelection(index + 1);
    }
    setIsVideoModalOpen(false);
    setVideoUrl('');
    savedRange.current = null;
  };

  const indentHandler = useCallback(() => {
    if (!quillRef.current) return;
    const quill = quillRef.current.getEditor();
    const range = quill.getSelection();
    if (!range) return;

    // Check current format
    const formats = quill.getFormat(range);
    
    // Toggle indent: if already 2em, remove it; otherwise set it
    if (formats.indent === '2em') {
      quill.format('indent', false);
    } else {
      quill.format('indent', '2em');
    }
  }, []);

  const sectionHeaderHandler = useCallback(() => {
    if (!quillRef.current) return;
    const quill = quillRef.current.getEditor();
    const range = quill.getSelection();
    if (!range) return;

    const formats = quill.getFormat(range);
    
    // Toggle Section Header (H3)
    // If currently H3, turn it off (back to normal)
    // If not H3, apply H3 AND remove indentation AND apply color
    if (formats.header === 3) {
      quill.format('header', false);
      quill.format('color', false); // Remove color when untoggling
    } else {
      quill.format('header', 3);
      // Ensure no indentation for headers as per requirement ("顶格")
      quill.format('indent', false);
      // Explicitly set color to Golden
      quill.format('color', 'rgb(218, 165, 32)');
    }
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['indent-button', 'section-header-button'], // Custom buttons
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
        video: videoHandler,
        'indent-button': indentHandler,
        'section-header-button': sectionHeaderHandler
      }
    }
  }), [imageHandler, videoHandler, indentHandler, sectionHeaderHandler]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'indent', // Add 'indent' to allowed formats
    'link', 'image', 'video', 'html5video'
  ];

  const attachQuillRefs = useCallback((el: any) => {
    if (el) {
      quillRef.current = el;
      try {
        const quill = el.getEditor();
        const toolbar = quill.getModule('toolbar');
        // Manually bind handlers to ensure they are attached
        toolbar.addHandler('image', imageHandler);
        toolbar.addHandler('video', videoHandler);
        toolbar.addHandler('indent-button', indentHandler); // Bind indent handler
        toolbar.addHandler('section-header-button', sectionHeaderHandler);

        // Manually insert icon for custom button if not present
        // React-Quill creates <button class="ql-indent-button"></button>
        // We need to inject an SVG or icon into it.
        // Wait for DOM to be ready
        setTimeout(() => {
          // Indent Button
          const btn = document.querySelector('.ql-indent-button');
          if (btn && !btn.innerHTML) {
            // Or better SVG representing indent first line
            btn.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="10" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
                <polyline points="3 6 6 6"></polyline>
              </svg>
            `;
            // Add tooltip
            btn.setAttribute('title', '首行缩进');
          }
          
          // Section Header Button
          const btnHeader = document.querySelector('.ql-section-header-button');
          if (btnHeader && !btnHeader.innerHTML) {
             // Create an 'H3' icon or a 'T' icon with golden color
             // Let's use a "Type" icon with color
             btnHeader.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 7V4h16v3"></path>
                  <path d="M9 20h6"></path>
                  <path d="M12 4v16"></path>
                </svg>
             `;
             // Apply golden color to the svg inside
             (btnHeader as HTMLElement).style.color = 'rgb(218, 165, 32)';
             btnHeader.setAttribute('title', '段落标题');
          }

        }, 0);

      } catch (err) {
        console.warn('Failed to attach handlers:', err);
      }
    }
  }, [imageHandler, videoHandler, indentHandler, sectionHeaderHandler]);

  return (
    <div className="bg-[#272727] text-gray-200 rounded h-full flex flex-col relative overflow-hidden">
      <style jsx global>{`
        .quill {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .ql-toolbar {
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          background: #1a1a1a;
          color: #e5e7eb;
        }
        .ql-container {
          flex: 1;
          overflow: hidden;
          border: none !important;
          font-family: inherit;
          font-size: 1rem;
        }
        .ql-editor {
          height: 100%;
          overflow-y: auto;
          color: #d1d5db; /* prose-invert body */
          background-color: #272727;
          padding: 2rem 1.5rem;
          font-family: "Microsoft YaHei", sans-serif;
          font-size: 1.125rem; /* prose-lg 18px */
          line-height: 1.7777778; /* prose-lg */
        }
        
        /* Limit content width to match frontend max-w-[1220px] with padding */
        .ql-editor > * {
          max-width: 1116px; /* 18px * 62 chars = 1116px. Exact grid multiple to minimize gaps */
          margin-left: auto;
          margin-right: auto;
          font-family: "Microsoft YaHei", sans-serif;
          font-size: 18px;
          line-height: 2.0;
          color: #dfd4b4;
        }
        
        /* Reduce Paragraph Margin to simulate single line break feel */
        .ql-editor p {
          margin-bottom: 0; /* Or a small value like 0.5em if strictly single line break is not desired */
          padding-bottom: 0;
        }
        
        /* Custom Section Header Style (H3) */
        .ql-editor h3 {
          font-size: 24px;
          color: rgb(218, 165, 32);
          font-weight: bold;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          text-indent: 0 !important; /* Force no indent */
          padding-left: 0 !important;
          line-height: 1.4;
        }

        .ql-editor.ql-blank::before {
          color: rgba(255,255,255,0.3);
          font-style: italic;
          /* Center placeholder too if needed, but it's absolute positioned usually. 
             Quill's placeholder handling might need check. 
             Usually it's attached to the editor container. 
             We might leave it or try to center it. 
             Let's leave it for now, it's just a hint. */
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 1124px;
          padding-left: 1.5rem; /* Match editor padding if it wasn't centered */
          /* Actually ql-blank::before is usually absolute left: 15px. 
             If we center content, we should try to align placeholder. 
             But strictly speaking, user asked for text width. */
        }
        
        /* Toolbar Theme Override */
        .ql-snow .ql-stroke {
          stroke: #9ca3af !important;
        }
        .ql-snow .ql-fill {
          fill: #9ca3af !important;
        }
        .ql-snow .ql-picker {
          color: #9ca3af !important;
        }
        .ql-snow .ql-picker-options {
          background-color: #2a2a2a !important;
          border-color: rgba(255,255,255,0.1) !important;
          color: #e5e7eb !important;
        }
        
        /* Active/Hover States */
        .ql-snow .ql-picker-item:hover {
          color: #fbbf24 !important;
        }
        .ql-snow.ql-toolbar button:hover .ql-stroke,
        .ql-snow.ql-toolbar button.ql-active .ql-stroke,
        .ql-snow .ql-picker-label:hover .ql-stroke,
        .ql-snow .ql-picker-label.ql-active .ql-stroke {
          stroke: #fbbf24 !important;
        }
        .ql-snow.ql-toolbar button:hover .ql-fill,
        .ql-snow.ql-toolbar button.ql-active .ql-fill,
        .ql-snow .ql-picker-label:hover .ql-fill,
        .ql-snow .ql-picker-label.ql-active .ql-fill {
          fill: #fbbf24 !important;
        }

        /* Content Styles (mimicking prose-invert prose-lg) */
        .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4 {
          color: #ffffff;
          font-weight: bold;
          line-height: 1.1;
        }
        .ql-editor h1 {
          font-size: 2.25em;
          margin-top: 0;
          margin-bottom: 0.833em;
        }
        .ql-editor h2 {
          font-size: 1.5em;
          margin-top: 1.666em;
          margin-bottom: 0.833em;
        }
        .ql-editor h3 {
          font-size: 1.25em;
          margin-top: 1.666em;
          margin-bottom: 0.666em;
        }
        .ql-editor p {
          margin-top: 1.333em;
          margin-bottom: 1.333em;
        }
        .ql-editor a {
          color: #fbbf24;
          text-decoration: underline;
        }
        .ql-editor blockquote {
          font-weight: 500;
          font-style: italic;
          color: #d1d5db;
          border-left-width: 0.25rem;
          border-left-color: #fbbf24;
          quotes: "\\201C""\\201D""\\2018""\\2019";
          margin-top: 1.666em;
          margin-bottom: 1.666em;
          padding-left: 1em;
          background: rgba(251, 191, 36, 0.05);
          padding: 0.5em 1em;
        }
        .ql-editor ul, .ql-editor ol {
          margin-top: 1.333em;
          margin-bottom: 1.333em;
          padding-left: 1.625em;
        }
        .ql-editor li {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .ql-editor img {
          margin-top: 2em;
          margin-bottom: 2em;
        }
        
        /* Scrollbar */
        .ql-editor::-webkit-scrollbar {
          width: 8px;
        }
        .ql-editor::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .ql-editor::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }
        .ql-editor::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>

      <ReactQuill
        ref={attachQuillRefs}
        theme="snow"
        value={content}
        onChange={onChange}
        modules={modules}
        formats={formats}
        className="h-full"
      />

      {/* Video Input Modal */}
      {isVideoModalOpen && (
        <div className="absolute top-12 left-0 right-0 z-20 mx-4 p-4 bg-[#2a2a2a] border border-white/10 shadow-lg rounded-lg flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">插入视频</h3>
            <button 
              onClick={() => setIsVideoModalOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="请输入视频链接 (支持 .mp4 直链、YouTube 链接或 iframe 代码)"
              className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-yellow-500 placeholder:text-gray-600"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  insertVideo();
                }
              }}
              autoFocus
            />
            <button
              onClick={insertVideo}
              className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded transition-colors flex items-center gap-1 text-sm"
            >
              <Check size={14} /> 确认
            </button>
          </div>
          <p className="text-xs text-gray-500">
            提示：支持 .mp4 直链、YouTube 链接 (watch/embed/youtu.be) 或 iframe 嵌入代码。
          </p>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
