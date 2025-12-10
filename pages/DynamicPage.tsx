
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Helmet } from 'react-helmet-async';
import { config } from '../config';

export const DynamicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(false);
      try {
        if (!slug) throw new Error("No slug");
        const data = await api.getPage(slug);
        if (data) {
          setPage(data);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary shadow-glow"></div>
    </div>
  );

  if (error || !page) return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="text-center">
            <i className="fas fa-file-excel text-4xl text-gray-600 mb-4"></i>
            <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
            <p className="text-gray-400 mb-6">The page "{slug}" does not exist in your backend.</p>
            <Link to="/" className="text-primary hover:underline">Go Home</Link>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent pb-20 pt-32">
      <Helmet>
        <title>{page.title} | {config.siteName}</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto px-6">
        {/* Dynamic Title */}
        <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic mb-8 border-l-4 border-primary pl-6" 
            dangerouslySetInnerHTML={{ __html: page.title }} 
        />
        
        {/* Dynamic Content */}
        <div className="bg-dark-900/50 p-8 rounded-2xl border border-white/5 shadow-2xl">
            {/* 'prose' class comes from Tailwind Typography plugin, but we style manually since we didn't include the plugin in CDN */}
            <div 
                className="prose-custom text-gray-300 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: page.content }} 
            />
        </div>
      </div>

      {/* Basic Styles for WP Content (Since we use raw HTML) */}
      <style>{`
        .prose-custom h1, .prose-custom h2, .prose-custom h3 { color: white; font-weight: 800; margin-top: 1.5em; margin-bottom: 0.5em; }
        .prose-custom h2 { font-size: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
        .prose-custom h3 { font-size: 1.25rem; color: #06b6d4; }
        .prose-custom p { margin-bottom: 1rem; }
        .prose-custom ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .prose-custom ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
        .prose-custom a { color: #06b6d4; text-decoration: underline; }
        .prose-custom img { border-radius: 0.75rem; border: 1px solid rgba(255,255,255,0.1); margin: 1.5rem 0; }
        .prose-custom blockquote { border-left: 4px solid #06b6d4; padding-left: 1rem; color: #94a3b8; font-style: italic; }
      `}</style>
    </div>
  );
};
