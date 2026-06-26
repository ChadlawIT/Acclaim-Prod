import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Building2, Briefcase, Users, FileText, Gavel, AlertTriangle, Megaphone, Shield,
  Home, Trophy, ExternalLink, Calendar, Heart, Activity, ScrollText, Scale,
  Stethoscope, Car, UserCog, Globe, MapPin, Clock, RefreshCw,
} from "lucide-react";
import chadwickLawrenceLogo from "@assets/CL_long_logo_1768312503635.png";
import { apiRequest } from "@/lib/queryClient";

interface Service {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  category: string;
}

const BUSINESS_SERVICES: Service[] = [
  {
    title: "Business Property",
    description: "Commercial property transactions, leases, portfolio management and disposals.",
    href: "https://www.chadwicklawrence.co.uk/business-services/property/",
    icon: <Building2 className="h-5 w-5 text-[#2e3192]" />,
    category: "business",
  },
  {
    title: "Corporate & Contracts",
    description: "Practical, cost-effective advice for business transactions, mergers and commercial contracts.",
    href: "https://www.chadwicklawrence.co.uk/business-services/corporate-and-contracts/",
    icon: <Briefcase className="h-5 w-5 text-[#2e3192]" />,
    category: "business",
  },
  {
    title: "Recovery & Insolvency",
    description: "Realistic commercial solutions for business and personal financial difficulties and insolvency.",
    href: "https://www.chadwicklawrence.co.uk/business-services/corporate-recovery-insolvency/",
    icon: <AlertTriangle className="h-5 w-5 text-[#2e3192]" />,
    category: "business",
  },
  {
    title: "Employment Law",
    description: "Employment law, health & safety compliance, HR support and tribunal litigation for employers.",
    href: "https://www.chadwicklawrence.co.uk/business-services/employment-law/",
    icon: <Users className="h-5 w-5 text-[#2e3192]" />,
    category: "business",
  },
  {
    title: "Intellectual Property",
    description: "Protect your business's ideas, brand, data assets and confidential information.",
    href: "https://www.chadwicklawrence.co.uk/business-services/intellectual-property/",
    icon: <FileText className="h-5 w-5 text-[#2e3192]" />,
    category: "business",
  },
  {
    title: "Litigation",
    description: "Proactive, value-driven dispute resolution and commercial litigation support.",
    href: "https://www.chadwicklawrence.co.uk/business-services/litigation-in-business/",
    icon: <Gavel className="h-5 w-5 text-[#2e3192]" />,
    category: "business",
  },
  {
    title: "Media Law & Reputation",
    description: "Protect and manage your business's media presence, reputation and brand integrity.",
    href: "https://www.chadwicklawrence.co.uk/business-services/media-law-and-reputation/",
    icon: <Megaphone className="h-5 w-5 text-[#2e3192]" />,
    category: "business",
  },
  {
    title: "Regulatory Services",
    description: "Navigate regulatory investigations, compliance obligations and enforcement proceedings.",
    href: "https://www.chadwicklawrence.co.uk/business-services/regulatory-services-solicitors/",
    icon: <Shield className="h-5 w-5 text-[#2e3192]" />,
    category: "business",
  },
  {
    title: "Social Housing",
    description: "Specialist legal support for housing associations and social housing management.",
    href: "https://www.chadwicklawrence.co.uk/business-services/social-housing-management/",
    icon: <Home className="h-5 w-5 text-[#2e3192]" />,
    category: "business",
  },
  {
    title: "Sports Law",
    description: "Specialist legal advice for players, clubs, agents and sporting organisations.",
    href: "https://www.chadwicklawrence.co.uk/business-services/sports-law/",
    icon: <Trophy className="h-5 w-5 text-[#2e3192]" />,
    category: "business",
  },
];

const PERSONAL_SERVICES: Service[] = [
  {
    title: "Residential Property",
    description: "Buying, selling and remortgaging — clear upfront costs and plain English advice at every step.",
    href: "https://www.chadwicklawrence.co.uk/personal-services/personal-property-services/",
    icon: <Home className="h-5 w-5 text-[#ba1b6e]" />,
    category: "personal",
  },
  {
    title: "Family Law",
    description: "Divorce, child arrangements, financial settlements, cohabitation agreements and domestic abuse support.",
    href: "https://www.chadwicklawrence.co.uk/personal-services/family-law/",
    icon: <Heart className="h-5 w-5 text-[#ba1b6e]" />,
    category: "personal",
  },
  {
    title: "Wills & Probate",
    description: "Will drafting, probate administration, lasting powers of attorney, trusts and succession planning.",
    href: "https://www.chadwicklawrence.co.uk/personal-services/wills-probate/",
    icon: <ScrollText className="h-5 w-5 text-[#ba1b6e]" />,
    category: "personal",
  },
  {
    title: "Personal Injury",
    description: "No Win, No Fee claims for road traffic accidents, workplace injuries and slips or trips.",
    href: "https://www.chadwicklawrence.co.uk/personal-services/personal-injury/",
    icon: <Activity className="h-5 w-5 text-[#ba1b6e]" />,
    category: "personal",
  },
  {
    title: "Medical Negligence",
    description: "No Win, No Fee claims for surgical errors, misdiagnosis, GP negligence and birth injuries.",
    href: "https://www.chadwicklawrence.co.uk/personal-services/medical-negligence/",
    icon: <Stethoscope className="h-5 w-5 text-[#ba1b6e]" />,
    category: "personal",
  },
  {
    title: "Employment Law",
    description: "Redundancy, unfair dismissal, discrimination claims, tribunal representation and settlement agreements.",
    href: "https://www.chadwicklawrence.co.uk/personal-services/employment-law/",
    icon: <UserCog className="h-5 w-5 text-[#ba1b6e]" />,
    category: "personal",
  },
  {
    title: "Dispute Resolution",
    description: "Debt recovery, contract disputes, professional negligence, property disagreements and GDPR breaches.",
    href: "https://www.chadwicklawrence.co.uk/personal-services/dispute-resolution/",
    icon: <Scale className="h-5 w-5 text-[#ba1b6e]" />,
    category: "personal",
  },
  {
    title: "Road Traffic & Motoring Law",
    description: "Expert defence for drink driving, speeding, disqualification and other motoring offences.",
    href: "https://www.chadwicklawrence.co.uk/personal-services/road-traffic-motoring-law/",
    icon: <Car className="h-5 w-5 text-[#ba1b6e]" />,
    category: "personal",
  },
  {
    title: "Media Law & Reputation",
    description: "Online reputation management, defamation, harassment and social media attack response.",
    href: "https://www.chadwicklawrence.co.uk/personal-services/media-law-and-reputation/",
    icon: <Globe className="h-5 w-5 text-[#ba1b6e]" />,
    category: "personal",
  },
];

function trackEvent(eventType: string, linkTitle?: string, linkHref?: string, linkCategory?: string) {
  apiRequest("POST", "/api/cl-analytics", { eventType, linkTitle, linkHref, linkCategory }).catch(() => {});
}

function ServiceCard({ service, accentColor }: { service: Service; accentColor: string }) {
  return (
    <a
      href={service.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("link_click", service.title, service.href, service.category)}
      className={`group block p-4 border rounded-lg hover:shadow-md transition-all ${
        accentColor === "blue"
          ? "hover:border-[#2e3192]"
          : "hover:border-[#ba1b6e]"
      }`}
    >
      <div className="flex items-start space-x-3">
        <div
          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
            accentColor === "blue"
              ? "bg-[#2e3192]/10 group-hover:bg-[#2e3192]/20"
              : "bg-[#ba1b6e]/10 group-hover:bg-[#ba1b6e]/20"
          }`}
        >
          {service.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={`font-semibold text-sm ${
                accentColor === "blue" ? "text-[#2e3192]" : "text-[#ba1b6e]"
              }`}
            >
              {service.title}
            </h4>
            <ExternalLink
              className={`h-3.5 w-3.5 flex-shrink-0 transition-colors ${
                accentColor === "blue"
                  ? "text-[#2e3192]/40 group-hover:text-[#2e3192]"
                  : "text-[#ba1b6e]/40 group-hover:text-[#ba1b6e]"
              }`}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
            {service.description}
          </p>
        </div>
      </div>
    </a>
  );
}

interface Seminar {
  category: string;
  date: string;
  time: string;
  name: string;
  description?: string;
  location: string;
  infoUrl: string | null;
  bookUrl: string;
}

export default function ChadwickLawrence() {
  useEffect(() => {
    trackEvent("page_view");
  }, []);

  const { data: seminars = [], isLoading: seminarsLoading } = useQuery<Seminar[]>({
    queryKey: ["/api/cl-seminars"],
    staleTime: 0,
    gcTime: 0,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-white dark:bg-gray-900 border-b rounded-t-lg">
          <div className="flex items-center justify-center py-2">
            <img
              src={chadwickLawrenceLogo}
              alt="Chadwick Lawrence - Yorkshire's Legal People"
              className="h-16 object-contain"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">

          {/* Intro */}
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Chadwick Lawrence remains true to its position as Yorkshire's Legal People, with straightforward,
            personable advice from a team that is as passionate about the region as the businesses and individuals
            they advise. With offices across West Yorkshire and over 170 years of tradition, they offer a
            comprehensive range of legal services for both businesses and private clients.
          </p>

          {/* Business Services */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1 w-8 rounded-full bg-[#2e3192]" />
              <h3 className="text-lg font-bold text-[#2e3192]">Business Services</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Legal support for businesses of all sizes — from transactions and employment to litigation and beyond.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {BUSINESS_SERVICES.map((s) => (
                <ServiceCard key={s.href} service={s} accentColor="blue" />
              ))}
            </div>
            <div className="mt-4">
              <a
                href="https://www.chadwicklawrence.co.uk/business-services/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("link_click", "View all business services", "https://www.chadwicklawrence.co.uk/business-services/", "business")}
                className="inline-flex items-center gap-2 text-sm text-[#2e3192] font-medium hover:underline"
              >
                View all business services on chadwicklawrence.co.uk
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Personal Services */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1 w-8 rounded-full bg-[#ba1b6e]" />
              <h3 className="text-lg font-bold text-[#ba1b6e]">Personal Services</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Expert legal advice for individuals — whether you're buying a home, facing a dispute or protecting your family's future.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {PERSONAL_SERVICES.map((s) => (
                <ServiceCard key={s.href} service={s} accentColor="pink" />
              ))}
            </div>
            <div className="mt-4">
              <a
                href="https://www.chadwicklawrence.co.uk/personal-services/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("link_click", "View all personal services", "https://www.chadwicklawrence.co.uk/personal-services/", "personal")}
                className="inline-flex items-center gap-2 text-sm text-[#ba1b6e] font-medium hover:underline"
              >
                View all personal services on chadwicklawrence.co.uk
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Events — live from chadwicklawrence.co.uk */}
          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#ba1b6e] to-[#2e3192] text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Free Training, Events & Seminars</h3>
                    <p className="text-xs text-white/75 mt-0.5">Live from chadwicklawrence.co.uk · refreshed hourly</p>
                  </div>
                </div>
                <a
                  href="https://www.chadwicklawrence.co.uk/seminars/business-services-seminars/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("link_click", "View All Events", "https://www.chadwicklawrence.co.uk/seminars/business-services-seminars/", "events")}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                >
                  View all
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Seminar rows */}
            {seminarsLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-sm">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Fetching upcoming events…
              </div>
            ) : seminars.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                No upcoming events listed at the moment.
                <div className="mt-3">
                  <a
                    href="https://www.chadwicklawrence.co.uk/seminars/business-services-seminars/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent("link_click", "Check CL website for events", "https://www.chadwicklawrence.co.uk/seminars/business-services-seminars/", "events")}
                    className="inline-flex items-center gap-1 text-[#2e3192] hover:underline text-sm"
                  >
                    Check the CL website for updates
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {seminars.map((s, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    {/* Date/time + category */}
                    <div className="flex-shrink-0 min-w-[130px]">
                      {s.date && s.date !== "TBC" ? (
                        <div className="text-xs font-semibold text-[#2e3192] dark:text-blue-300">{s.date}</div>
                      ) : (
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                          style={s.category === "social-housing"
                            ? { background: "#e8f5e9", color: "#2e7d32" }
                            : { background: "#e8eaf6", color: "#2e3192" }}>
                          {s.category === "social-housing" ? "Social Housing" : "Employment"}
                        </span>
                      )}
                      {s.time && s.time !== "TBC" && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Clock className="h-3 w-3" />
                          {s.time}
                        </div>
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-snug">{s.name}</span>
                        {s.date && s.date !== "TBC" && (
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                            style={s.category === "social-housing"
                              ? { background: "#e8f5e9", color: "#2e7d32" }
                              : { background: "#e8eaf6", color: "#2e3192" }}>
                            {s.category === "social-housing" ? "Social Housing" : "Employment"}
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">{s.description}</p>
                      )}
                      {s.location && s.location !== "TBC" && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <MapPin className="h-3 w-3" />
                          {s.location}
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-start pt-0.5">
                      {s.infoUrl && (
                        <a
                          href={s.infoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackEvent("link_click", `More info: ${s.name}`, s.infoUrl!, "events")}
                          className="text-xs text-[#2e3192] hover:underline font-medium whitespace-nowrap"
                        >
                          More info
                        </a>
                      )}
                      <a
                        href={s.bookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent("link_click", `Book: ${s.name}`, s.bookUrl, "events")}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors whitespace-nowrap"
                        style={{ background: "#ba1b6e" }}
                      >
                        Book now
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="p-6 bg-[#2e3192] rounded-lg text-white">
            <h3 className="text-lg font-semibold mb-3">Get in Touch</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-200 text-sm mb-1">Freephone</p>
                <a
                  href="tel:08000150340"
                  onClick={() => trackEvent("link_click", "Freephone 0800 015 0340", "tel:08000150340", "contact")}
                  className="text-white font-medium hover:underline"
                >
                  0800 015 0340
                </a>
              </div>
              <div>
                <p className="text-gray-200 text-sm mb-1">Email</p>
                <a
                  href="mailto:info@chadlaw.co.uk"
                  onClick={() => trackEvent("link_click", "Email info@chadlaw.co.uk", "mailto:info@chadlaw.co.uk", "contact")}
                  className="text-white font-medium hover:underline"
                >
                  info@chadlaw.co.uk
                </a>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-end">
              <img
                src={chadwickLawrenceLogo}
                alt="Chadwick Lawrence"
                className="h-8 brightness-0 invert"
              />
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
