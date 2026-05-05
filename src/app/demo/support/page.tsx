import Link from "next/link";

const faqs = [
  {
    question: "How do I add a new client?",
    answer: "Navigate to the Book of Business section and click the Add Client button. Fill in the required information including client details, policy information, and carrier selection. In demo mode, all data is simulated and resets on session end."
  },
  {
    question: "How does the renewal automation work?",
    answer: "Our renewal automation tracks policy expiration dates and sends automated reminders at 90, 60, and 30 days before renewal. In the demo, you can explore the full renewal pipeline interface and see how AI-driven notifications would function in production."
  },
  {
    question: "How do I interpret the Health Score?",
    answer: "The Health Score ranges from 0-100 and is calculated based on multiple factors including renewal timing, premium changes, carrier ratings, and client engagement. Green (70-100) indicates healthy accounts, Yellow (40-69) shows moderate risk, and Red (0-39) signals high-risk accounts requiring immediate attention."
  },
  {
    question: "How do I set up carrier integrations?",
    answer: "Go to Settings and Carrier Integrations to connect your carrier portals. We support direct API integrations with major carriers. Contact your carrier representative to obtain API credentials, then enter them in the integration settings to enable real-time policy syncing."
  },
  {
    question: "How do I invite team members?",
    answer: "Navigate to Settings and Team Management and click Invite Team Member. Enter their email address and assign a role (Admin, Agent, or Viewer). They will receive an invitation email to join your agency workspace."
  }
];

export default function DemoSupportPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8 font-body">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-secondary/10 rounded-[32px] flex items-center justify-center mx-auto shadow-inner border border-secondary/10">
          <span className="material-symbols-outlined text-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
        </div>
        <h1 className="text-5xl font-black text-on-surface italic font-headline tracking-tight">Concierge Support</h1>
        <p className="text-lg text-on-surface/60 font-medium max-w-2xl mx-auto italic">Access 24/7 technical and strategic assistance dedicated to your agency authority and portfolio protection.</p>
      </div>

      <div className="space-y-6">
        <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] px-2">Intelligence Briefing (FAQ)</p>
        <div className="grid gap-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-surface rounded-[32px] border border-black/5 shadow-sm overflow-hidden group hover:shadow-md transition-all">
              <div className="p-6 font-black text-on-surface italic font-headline text-lg border-b border-black/5 bg-slate-50/50 flex justify-between items-center group-hover:bg-slate-50 transition-colors">
                {faq.question}
                <span className="material-symbols-outlined text-on-surface/20 group-hover:text-primary transition-colors">help_outline</span>
              </div>
              <div className="p-8 text-on-surface/70 text-sm font-medium leading-relaxed italic">{faq.answer}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <a href="mailto:support@retainvault.com" className="bg-surface p-10 rounded-[32px] border border-black/5 text-center hover:shadow-2xl hover:scale-[1.02] transition-all group">
          <div className="w-16 h-16 bg-secondary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-secondary group-hover:text-white transition-all shadow-sm">
            <span className="material-symbols-outlined text-3xl text-secondary group-hover:text-white">email</span>
          </div>
          <p className="font-black text-on-surface italic font-headline text-xl mb-1 tracking-tight">Direct Priority</p>
          <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">24/7 Deployment Window</p>
        </a>
        <a href="#" className="bg-surface p-10 rounded-[32px] border border-black/5 text-center hover:shadow-2xl hover:scale-[1.02] transition-all group">
          <div className="w-16 h-16 bg-secondary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-secondary group-hover:text-white transition-all shadow-sm">
            <span className="material-symbols-outlined text-3xl text-secondary group-hover:text-white">calendar_today</span>
          </div>
          <p className="font-black text-on-surface italic font-headline text-xl mb-1 tracking-tight">Strategy Briefing</p>
          <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Schedule with Specialist</p>
        </a>
        <Link href="/demo" className="bg-surface p-10 rounded-[32px] border border-black/5 text-center hover:shadow-2xl hover:scale-[1.02] transition-all group cursor-pointer">
          <div className="w-16 h-16 bg-secondary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-secondary group-hover:text-white transition-all shadow-sm">
            <span className="material-symbols-outlined text-3xl text-secondary group-hover:text-white">hub</span>
          </div>
          <p className="font-black text-on-surface italic font-headline text-xl mb-1 tracking-tight">Return to Command Center</p>
          <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">Demo Dashboard</p>
        </Link>
      </div>
    </div>
  );
}
