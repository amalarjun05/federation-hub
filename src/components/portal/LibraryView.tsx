import { BookOpen, FileText, Mail, FileSpreadsheet, ExternalLink, UploadCloud, Download, Image as ImageIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { ActionButton } from "./ActionButton";

const TOOLS = [
  { 
    id: 'invoice', 
    name: "AKEF Invoice Maker", 
    desc: "Generate professional invoices", 
    icon: FileSpreadsheet, 
    color: "text-accent",
    bgColor: "bg-accent/10",
    link: "https://akef-invoice.vercel.app" 
  },
  { 
    id: 'email_craft', 
    name: "Email Designer Studio", 
    desc: "Professional email designer", 
    icon: Mail,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    link: "https://email-designer-studio.vercel.app/"
  }
];

const ASSETS = [
  { id: 1, name: "AKEF Logo Pack", type: "ZIP", desc: "Official Logos (PNG, SVG, AI)" },
  { id: 2, name: "Letterhead Template", type: "DOCX", desc: "For official correspondence" },
  { id: 3, name: "Sponsorship Deck 2025", type: "PPTX", desc: "Standard pitch for sponsors" },
  { id: 4, name: "ID Card Template", type: "PSD", desc: "Photoshop file for member IDs" },
];

const DOCUMENTS = [
  { id: 1, name: "AKEF Constitution 2025.pdf", category: "Legal", size: "2.4 MB", date: "Dec 2024" },
  { id: 2, name: "Esports Event Guidelines v3.docx", category: "Operations", size: "1.1 MB", date: "Nov 2024" },
  { id: 3, name: "Brand Assets & Logos.zip", category: "Marketing", size: "15 MB", date: "Oct 2024" },
  { id: 4, name: "District Committee Structure.pdf", category: "HR", size: "500 KB", date: "Sep 2024" },
  { id: 5, name: "Budget Template FY 2025-26.xlsx", category: "Finance", size: "256 KB", date: "Dec 2024" },
  { id: 6, name: "Event Proposal Format.docx", category: "Events", size: "180 KB", date: "Nov 2024" },
];

export function LibraryView() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="text-primary" /> Resource Library
        </h2>
        <ActionButton variant="secondary">
          <UploadCloud size={16} /> Upload Document
        </ActionButton>
      </div>

      {/* Tools Section */}
      <section>
        <h3 className="text-lg font-semibold text-foreground mb-4">Official Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool, i) => (
            <GlassCard 
              key={tool.id} 
              hover
              onClick={() => window.open(tool.link, '_blank')}
              className="group animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${tool.bgColor} rounded-xl flex items-center justify-center border border-border group-hover:border-primary/50 transition-colors`}>
                  <tool.icon size={24} className={tool.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground group-hover:text-primary flex items-center gap-2 transition-colors">
                    {tool.name}
                    <ExternalLink size={12} className="text-muted-foreground" />
                  </h4>
                  <p className="text-xs text-muted-foreground">{tool.desc}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Brand Assets Section */}
      <section>
        <h3 className="text-lg font-semibold text-foreground mb-4">Brand Assets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ASSETS.map((asset, i) => (
            <GlassCard 
              key={asset.id} 
              hover 
              className="group animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <ImageIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-foreground group-hover:text-purple-400 transition-colors truncate">
                    {asset.name}
                  </h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{asset.desc}</p>
                  <StatusBadge variant="outline" size="sm" className="mt-2">
                    {asset.type}
                  </StatusBadge>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Documents Section */}
      <section>
        <h3 className="text-lg font-semibold text-foreground mb-4">Document Library</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOCUMENTS.map((doc, i) => (
            <GlassCard 
              key={doc.id} 
              hover 
              className="group animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
            >
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <FileText size={32} className="text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
                  <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors" title={doc.name}>
                    {doc.name}
                  </h4>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-3 mt-4">
                  <StatusBadge variant="outline" size="sm">{doc.category}</StatusBadge>
                  <div className="flex items-center gap-2">
                    <span>{doc.size}</span>
                    <button className="p-1 hover:text-primary transition-colors">
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}
