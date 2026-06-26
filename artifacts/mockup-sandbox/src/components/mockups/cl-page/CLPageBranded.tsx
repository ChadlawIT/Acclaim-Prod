import {
  Building2, Briefcase, Users, FileText, Gavel, AlertTriangle, Megaphone, Shield,
  Home, Trophy, ExternalLink, Calendar, Heart, Activity, ScrollText, Scale,
  Stethoscope, Car, UserCog, Globe,
} from "lucide-react";

const CL_NAVY = "#2e3192";
const CL_PINK  = "#ba1b6e";

interface Service {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  category: string;
}

const BUSINESS_SERVICES: Service[] = [
  { title: "Business Property", description: "Commercial property transactions, leases, portfolio management and disposals.", href: "#", icon: <Building2 className="h-5 w-5" style={{ color: CL_NAVY }} />, category: "business" },
  { title: "Corporate & Contracts", description: "Practical, cost-effective advice for business transactions, mergers and commercial contracts.", href: "#", icon: <Briefcase className="h-5 w-5" style={{ color: CL_NAVY }} />, category: "business" },
  { title: "Recovery & Insolvency", description: "Realistic commercial solutions for business and personal financial difficulties and insolvency.", href: "#", icon: <AlertTriangle className="h-5 w-5" style={{ color: CL_NAVY }} />, category: "business" },
  { title: "Employment Law", description: "Employment law, health & safety compliance, HR support and tribunal litigation for employers.", href: "#", icon: <Users className="h-5 w-5" style={{ color: CL_NAVY }} />, category: "business" },
  { title: "Intellectual Property", description: "Protect your business's ideas, brand, data assets and confidential information.", href: "#", icon: <FileText className="h-5 w-5" style={{ color: CL_NAVY }} />, category: "business" },
  { title: "Litigation", description: "Proactive, value-driven dispute resolution and commercial litigation support.", href: "#", icon: <Gavel className="h-5 w-5" style={{ color: CL_NAVY }} />, category: "business" },
  { title: "Media Law & Reputation", description: "Protect and manage your business's media presence, reputation and brand integrity.", href: "#", icon: <Megaphone className="h-5 w-5" style={{ color: CL_NAVY }} />, category: "business" },
  { title: "Regulatory Services", description: "Navigate regulatory investigations, compliance obligations and enforcement proceedings.", href: "#", icon: <Shield className="h-5 w-5" style={{ color: CL_NAVY }} />, category: "business" },
  { title: "Social Housing", description: "Specialist legal support for housing associations and social housing management.", href: "#", icon: <Home className="h-5 w-5" style={{ color: CL_NAVY }} />, category: "business" },
  { title: "Sports Law", description: "Specialist legal advice for players, clubs, agents and sporting organisations.", href: "#", icon: <Trophy className="h-5 w-5" style={{ color: CL_NAVY }} />, category: "business" },
];

const PERSONAL_SERVICES: Service[] = [
  { title: "Residential Property", description: "Buying, selling and remortgaging — clear upfront costs and plain English advice at every step.", href: "#", icon: <Home className="h-5 w-5" style={{ color: CL_PINK }} />, category: "personal" },
  { title: "Family Law", description: "Divorce, child arrangements, financial settlements, cohabitation agreements and domestic abuse support.", href: "#", icon: <Heart className="h-5 w-5" style={{ color: CL_PINK }} />, category: "personal" },
  { title: "Wills & Probate", description: "Will drafting, probate administration, lasting powers of attorney, trusts and succession planning.", href: "#", icon: <ScrollText className="h-5 w-5" style={{ color: CL_PINK }} />, category: "personal" },
  { title: "Personal Injury", description: "No Win, No Fee claims for road traffic accidents, workplace injuries and slips or trips.", href: "#", icon: <Activity className="h-5 w-5" style={{ color: CL_PINK }} />, category: "personal" },
  { title: "Medical Negligence", description: "No Win, No Fee claims for surgical errors, misdiagnosis, GP negligence and birth injuries.", href: "#", icon: <Stethoscope className="h-5 w-5" style={{ color: CL_PINK }} />, category: "personal" },
  { title: "Employment Law", description: "Redundancy, unfair dismissal, discrimination claims, tribunal representation and settlement agreements.", href: "#", icon: <UserCog className="h-5 w-5" style={{ color: CL_PINK }} />, category: "personal" },
  { title: "Dispute Resolution", description: "Debt recovery, contract disputes, professional negligence, property disagreements and GDPR breaches.", href: "#", icon: <Scale className="h-5 w-5" style={{ color: CL_PINK }} />, category: "personal" },
  { title: "Road Traffic & Motoring Law", description: "Expert defence for drink driving, speeding, disqualification and other motoring offences.", href: "#", icon: <Car className="h-5 w-5" style={{ color: CL_PINK }} />, category: "personal" },
  { title: "Media Law & Reputation", description: "Online reputation management, defamation, harassment and social media attack response.", href: "#", icon: <Globe className="h-5 w-5" style={{ color: CL_PINK }} />, category: "personal" },
];

function ServiceCard({ service, accent }: { service: Service; accent: "navy" | "pink" }) {
  const col = accent === "navy" ? CL_NAVY : CL_PINK;
  return (
    <div
      className="group block p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer"
      style={{ borderColor: "#e5e7eb" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = col)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
    >
      <div className="flex items-start space-x-3">
        <div
          className="p-2 rounded-lg flex-shrink-0 transition-colors"
          style={{ background: `${col}18` }}
        >
          {service.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-sm" style={{ color: col }}>{service.title}</h4>
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" style={{ color: `${col}55` }} />
          </div>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{service.description}</p>
        </div>
      </div>
    </div>
  );
}

export default function CLPageBranded() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Gradient Header (new branded treatment) ── */}
      <div
        className="rounded-t-xl overflow-hidden shadow-md"
        style={{ background: `linear-gradient(135deg, ${CL_NAVY} 0%, ${CL_PINK} 100%)` }}
      >
        {/* Logo strip */}
        <div className="flex items-center justify-between px-6 py-5">
          <div className="bg-white rounded-xl px-5 py-3 shadow-md">
            <img src="/cl-logo.png" alt="Chadwick Lawrence" className="h-10 object-contain" />
          </div>
          <div className="text-right text-white">
            <p className="text-sm font-semibold opacity-90">Yorkshire's Legal People</p>
            <p className="text-xs opacity-60 mt-0.5">Over 170 years of tradition</p>
          </div>
        </div>

        {/* Category pills in header */}
        <div className="flex gap-px bg-white/20 border-t border-white/20">
          {[
            { label: "Business Services", count: BUSINESS_SERVICES.length },
            { label: "Personal Services", count: PERSONAL_SERVICES.length },
            { label: "Events & Seminars", count: null },
            { label: "Contact",           count: null },
          ].map(({ label, count }) => (
            <div key={label} className="flex-1 bg-white/10 hover:bg-white/20 transition-colors px-4 py-3 text-center cursor-pointer">
              <div className="text-xs text-white/60 font-medium">{label}</div>
              {count !== null && <div className="text-base font-bold text-white mt-0.5">{count}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Body card ── */}
      <div className="bg-white rounded-b-xl shadow-md overflow-hidden">
        <div className="px-6 py-8 space-y-8">

          {/* Intro */}
          <p className="text-gray-700 leading-relaxed">
            Chadwick Lawrence remains true to its position as Yorkshire's Legal People, with straightforward,
            personable advice from a team that is as passionate about the region as the businesses and individuals
            they advise. With offices across West Yorkshire and over 170 years of tradition, they offer a
            comprehensive range of legal services for both businesses and private clients.
          </p>

          {/* Business Services */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1 w-8 rounded-full" style={{ background: CL_NAVY }} />
              <h3 className="text-lg font-bold" style={{ color: CL_NAVY }}>Business Services</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Legal support for businesses of all sizes — from transactions and employment to litigation and beyond.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {BUSINESS_SERVICES.map(s => <ServiceCard key={s.title} service={s} accent="navy" />)}
            </div>
            <div className="mt-4">
              <a href="#" className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: CL_NAVY }}>
                View all business services on chadwicklawrence.co.uk
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Personal Services */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1 w-8 rounded-full" style={{ background: CL_PINK }} />
              <h3 className="text-lg font-bold" style={{ color: CL_PINK }}>Personal Services</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Expert legal advice for individuals — whether you're buying a home, facing a dispute or protecting your family's future.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {PERSONAL_SERVICES.map(s => <ServiceCard key={s.title} service={s} accent="pink" />)}
            </div>
            <div className="mt-4">
              <a href="#" className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: CL_PINK }}>
                View all personal services on chadwicklawrence.co.uk
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Events */}
          <div
            className="p-6 rounded-lg text-white"
            style={{ background: `linear-gradient(to right, ${CL_PINK}, ${CL_NAVY})` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.2)" }}>
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Free Training, Events & Seminars</h3>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>Join free sessions delivered by experienced legal professionals</p>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.9)" }}>
              At Chadwick Lawrence, we believe that access to clear, reliable legal information is vital.
              Our free seminars cover employment law, social housing, and other key business topics.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              style={{ background: "white", color: CL_NAVY }}
            >
              <Calendar className="h-4 w-4" />
              View Upcoming Events
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Contact */}
          <div className="p-6 rounded-lg text-white" style={{ background: CL_NAVY }}>
            <h3 className="text-lg font-semibold mb-3">Get in Touch</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>Freephone</p>
                <span className="text-white font-medium">0800 015 0340</span>
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>Email</p>
                <span className="text-white font-medium">info@chadlaw.co.uk</span>
              </div>
            </div>
            <div className="mt-4 pt-4 flex items-center justify-end" style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}>
              <img src="/cl-logo.png" alt="Chadwick Lawrence" className="h-8 object-contain brightness-0 invert" />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
