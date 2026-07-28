import React, { useState, useEffect } from 'react';
import { FileText, Download, BookOpen, Wrench, ExternalLink, MapPin, Library, Copy, Check, FolderOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DocumentMetadata {
  id: string;
  filename: string;
  displayName: string;
  description: string | null;
  category: 'general_information' | 'templates' | 'technical_information';
  fileSize: number;
  storagePath: string;
  url: string;
}

export const AdditionalInformationPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [pathCopied, setPathCopied] = useState(false);

  const TECHNICAL_DRAWINGS_PATH = 'Q:\\Enea\\007 Landscape\\001 Planung\\002 CAD\\011 Drawing Standards\\03_AutoCAD';

  const copyPath = async () => {
    await navigator.clipboard.writeText(TECHNICAL_DRAWINGS_PATH);
    setPathCopied(true);
    setTimeout(() => setPathCopied(false), 2500);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const docs: DocumentMetadata[] = data.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        displayName: doc.display_name,
        description: doc.description,
        category: doc.category,
        fileSize: doc.file_size || 0,
        storagePath: doc.storage_path,
        url: supabase.storage.from('documents').getPublicUrl(doc.storage_path).data.publicUrl
      }));

      setDocuments(docs);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentsByCategory = (category: 'general_information' | 'templates' | 'technical_information') => {
    return documents.filter(doc => doc.category === category);
  };

  const renderDocumentCard = (doc: DocumentMetadata, colorClasses: any) => (
    <a
      key={doc.id}
      href={doc.url}
      download
      className={`group relative bg-gradient-to-br ${colorClasses.bg} rounded-lg border-2 ${colorClasses.border} transition-all p-6 shadow-sm hover:shadow-md`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-16 h-16 ${colorClasses.icon} rounded-lg flex items-center justify-center transition-colors`}>
          <FileText className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {doc.displayName}
          </h3>
          {doc.description && (
            <p className="text-sm text-gray-600 mb-4">
              {doc.description}
            </p>
          )}
          <div className={`flex items-center gap-2 ${colorClasses.text} font-medium`}>
            <Download className="w-5 h-5" />
            <span>Download PDF</span>
          </div>
        </div>
      </div>
    </a>
  );

  const generalInfoDocs = getDocumentsByCategory('general_information').reverse();
  const templateDocs = getDocumentsByCategory('templates');
  const technicalDocs = getDocumentsByCategory('technical_information');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Additional Information</h1>
          <p className="text-gray-700">
            Access guides, templates, and technical documentation for professional landscape design
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-4">Loading documents...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="bg-white rounded-lg border border-gray-300 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">General Information</h2>
                  <p className="text-gray-600 text-sm">
                    Comprehensive planting guides for professional landscape design
                  </p>
                </div>
              </div>

              {generalInfoDocs.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium mb-2">
                    No documents available yet
                  </p>
                  <p className="text-gray-500 text-sm">
                    General information documents will be available here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generalInfoDocs.map((doc) => {
                    const colorClasses = {
                      bg: 'from-cyan-50 to-blue-50',
                      border: 'border-cyan-300 hover:border-cyan-500',
                      icon: 'bg-cyan-500 group-hover:bg-cyan-600',
                      text: 'text-cyan-600 group-hover:text-cyan-700'
                    };
                    return renderDocumentCard(doc, colorClasses);
                  })}
                </div>
              )}
            </section>

            <section className="bg-white rounded-lg border border-gray-300 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                  <Library className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Library</h2>
                  <p className="text-gray-600 text-sm">
                    Access the Enea book and resource library
                  </p>
                </div>
              </div>

              <a
                href="https://www.libib.com/u/eneabibliothek"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-6 bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-300 hover:border-sky-500 rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-sky-500 group-hover:bg-sky-600 rounded-lg flex items-center justify-center transition-colors">
                    <Library className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Enea Library
                    </h3>
                    <p className="text-sm text-gray-600">
                      Browse and access the complete Enea book and reference collection
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-6 h-6 text-sky-600 group-hover:text-sky-700 flex-shrink-0" />
              </a>
            </section>

            <section className="bg-white rounded-lg border border-gray-300 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Templates</h2>
                  <p className="text-gray-600 text-sm">
                    Professional templates for landscape planning and documentation
                  </p>
                </div>
              </div>

              {templateDocs.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium mb-2">
                    Coming Soon
                  </p>
                  <p className="text-gray-500 text-sm">
                    Templates for project documentation, planting plans, and material specifications will be available here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templateDocs.map((doc) => {
                    const colorClasses = {
                      bg: 'from-emerald-50 to-green-50',
                      border: 'border-emerald-300 hover:border-emerald-500',
                      icon: 'bg-emerald-500 group-hover:bg-emerald-600',
                      text: 'text-emerald-600 group-hover:text-emerald-700'
                    };
                    return renderDocumentCard(doc, colorClasses);
                  })}
                </div>
              )}
            </section>

            <section className="bg-white rounded-lg border border-gray-300 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Technical Information</h2>
                  <p className="text-gray-600 text-sm">
                    Technical specifications, installation guidelines, and maintenance protocols
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 rounded-lg shadow-sm p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Technical Drawings</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        AutoCAD drawing standards and templates on the network drive
                      </p>
                      <div className="flex items-center gap-2 bg-white border border-orange-200 rounded-lg px-3 py-2 mb-4">
                        <code className="text-xs text-gray-700 flex-1 truncate font-mono">
                          {TECHNICAL_DRAWINGS_PATH}
                        </code>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          onClick={copyPath}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            pathCopied
                              ? 'bg-green-500 text-white'
                              : 'bg-orange-500 hover:bg-orange-600 text-white'
                          }`}
                        >
                          {pathCopied ? (
                            <>
                              <Check className="w-4 h-4" />
                              Pfad kopiert!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Pfad kopieren
                            </>
                          )}
                        </button>
                        <span className="text-xs text-gray-500">
                          Dann <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">Win+E</kbd> offnen und <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">Strg+V</kbd> in die Adressleiste einfugen
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {technicalDocs.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {technicalDocs.map((doc) => {
                      const colorClasses = {
                        bg: 'from-orange-50 to-amber-50',
                        border: 'border-orange-300 hover:border-orange-500',
                        icon: 'bg-orange-500 group-hover:bg-orange-600',
                        text: 'text-orange-600 group-hover:text-orange-700'
                      };
                      return renderDocumentCard(doc, colorClasses);
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-lg border border-gray-300 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Cantonal Regulations</h2>
                  <p className="text-gray-600 text-sm">
                    Official websites of Swiss cantons for local building and landscape regulations
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Aargau', url: 'https://www.pflanzen-im-nachbarrecht.ch/AG/' },
                  { name: 'Appenzell Ausserrhoden', url: 'https://www.pflanzen-im-nachbarrecht.ch/AR/' },
                  { name: 'Appenzell Innerrhoden', url: 'https://www.pflanzen-im-nachbarrecht.ch/AI/' },
                  { name: 'Basel-Landschaft', url: 'https://www.pflanzen-im-nachbarrecht.ch/BL/' },
                  { name: 'Basel-Stadt', url: 'https://www.pflanzen-im-nachbarrecht.ch/BS/' },
                  { name: 'Bern', url: 'https://www.pflanzen-im-nachbarrecht.ch/BE/' },
                  { name: 'Fribourg', url: 'https://www.pflanzen-im-nachbarrecht.ch/FR/' },
                  { name: 'Genève', url: 'https://www.pflanzen-im-nachbarrecht.ch/GE/' },
                  { name: 'Glarus', url: 'https://www.pflanzen-im-nachbarrecht.ch/GL/' },
                  { name: 'Graubünden', url: 'https://www.pflanzen-im-nachbarrecht.ch/GR/' },
                  { name: 'Jura', url: 'https://www.pflanzen-im-nachbarrecht.ch/JU/' },
                  { name: 'Luzern', url: 'https://www.pflanzen-im-nachbarrecht.ch/LU/' },
                  { name: 'Neuchâtel', url: 'https://www.pflanzen-im-nachbarrecht.ch/NE/' },
                  { name: 'Nidwalden', url: 'https://www.pflanzen-im-nachbarrecht.ch/NW/' },
                  { name: 'Obwalden', url: 'https://www.pflanzen-im-nachbarrecht.ch/OW/' },
                  { name: 'Schaffhausen', url: 'https://www.pflanzen-im-nachbarrecht.ch/SH/' },
                  { name: 'Schwyz', url: 'https://www.pflanzen-im-nachbarrecht.ch/SZ/' },
                  { name: 'Solothurn', url: 'https://www.pflanzen-im-nachbarrecht.ch/SO/' },
                  { name: 'St. Gallen', url: 'https://www.pflanzen-im-nachbarrecht.ch/SG/' },
                  { name: 'Thurgau', url: 'https://www.pflanzen-im-nachbarrecht.ch/TG/' },
                  { name: 'Ticino', url: 'https://www.pflanzen-im-nachbarrecht.ch/TI/' },
                  { name: 'Uri', url: 'https://www.pflanzen-im-nachbarrecht.ch/UR/' },
                  { name: 'Valais', url: 'https://www.pflanzen-im-nachbarrecht.ch/VS/' },
                  { name: 'Vaud', url: 'https://www.pflanzen-im-nachbarrecht.ch/VD/' },
                  { name: 'Zug', url: 'https://www.pflanzen-im-nachbarrecht.ch/ZG/' },
                  { name: 'Zürich', url: 'https://www.pflanzen-im-nachbarrecht.ch/ZH/' },
                ].map((canton) => (
                  <a
                    key={canton.name}
                    href={canton.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <span className="text-gray-900 font-medium">{canton.name}</span>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </a>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
