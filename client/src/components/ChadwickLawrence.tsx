import { useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Building2, Briefcase, Users, FileText, Gavel, AlertTriangle, Megaphone, Shield,
  Home, Trophy, ExternalLink, Calendar, Heart, Activity, ScrollText, Scale,
  Stethoscope, Car, UserCog, Globe
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

export default function ChadwickLawrence() {
  useEffect(() => {
    trackEvent("page_view");
  }, []);

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

          {/* Events */}
          <div className="p-6 bg-gradient-to-r from-[#ba1b6e] to-[#2e3192] rounded-lg text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Free Training, Events & Seminars</h3>
                <p className="text-sm text-white/80">Join free sessions delivered by experienced legal professionals</p>
              </div>
            </div>
            <p className="text-white/90 text-sm mb-4">
              At Chadwick Lawrence, we believe that access to clear, reliable legal information is vital.
              Our free seminars cover employment law, social housing, and other key business topics.
              Browse upcoming events to find sessions that can help you and your business.
            </p>
            <a
              href="https://www.chadwicklawrence.co.uk/seminars/business-services-seminars/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("link_click", "View Upcoming Events", "https://www.chadwicklawrence.co.uk/seminars/business-services-seminars/", "events")}
              className="inline-flex items-center gap-2 bg-white text-[#2e3192] px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors text-sm"
            >
              <Calendar className="h-4 w-4" />
              View Upcoming Events
              <ExternalLink className="h-4 w-4" />
            </a>
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
