import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Briefcase, Users, FileText, Gavel, AlertTriangle, Megaphone, Shield,
  Home, Trophy, ExternalLink, Calendar, Heart, Activity, ScrollText, Scale,
  Stethoscope, Car, UserCog, Globe, MapPin, Clock, RefreshCw, X, Share2, Send, CheckCircle2,
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

interface EventBlock {
  type: 'heading' | 'paragraph' | 'list';
  text?: string;
  items?: string[];
}

const bookingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email address required'),
  organisation: z.string().min(1, 'Organisation is required'),
  phone: z.string().min(1, 'Telephone number is required'),
  notes: z.string().optional(),
});
type BookingFormValues = z.infer<typeof bookingSchema>;

const shareSchema = z.object({
  recipientName: z.string().min(1, 'Name is required'),
  recipientEmail: z.string().email('Valid email address required'),
  recipientPhone: z.string().min(1, 'Telephone number is required'),
  recipientOrganisation: z.string().min(1, 'Organisation is required'),
  recipientJobTitle: z.string().min(1, 'Job title is required'),
});
type ShareFormValues = z.infer<typeof shareSchema>;

export default function ChadwickLawrence() {
  useEffect(() => {
    trackEvent("page_view");
  }, []);

  const { toast } = useToast();
  const [selectedSeminar, setSelectedSeminar] = useState<Seminar | null>(null);
  const [bookingSeminar, setBookingSeminar] = useState<Seminar | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [sharingSeminar, setSharingSeminar] = useState<Seminar | null>(null);
  const [sharingConfirmedRecipient, setSharingConfirmedRecipient] = useState<string | null>(null);

  const { data: seminars = [], isLoading: seminarsLoading } = useQuery<Seminar[]>({
    queryKey: ["/api/cl-seminars"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  const { data: eventDetails = [], isLoading: eventLoading } = useQuery<EventBlock[]>({
    queryKey: ["/api/cl-event", selectedSeminar?.infoUrl],
    enabled: !!selectedSeminar?.infoUrl,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      if (!selectedSeminar?.infoUrl) return [];
      const res = await fetch(`/api/cl-event?url=${encodeURIComponent(selectedSeminar.infoUrl)}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: currentUser } = useQuery<{ id: string; firstName: string; lastName: string; email: string }>({
    queryKey: ["/api/user"],
  });

  const { data: userOrganisations } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ["/api/user/organisations"],
  });

  const bookingForm = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { name: '', email: '', organisation: '', phone: '', notes: '' },
  });

  const shareForm = useForm<ShareFormValues>({
    resolver: zodResolver(shareSchema),
    defaultValues: { recipientName: '', recipientEmail: '', recipientPhone: '', recipientOrganisation: '', recipientJobTitle: '' },
  });

  useEffect(() => {
    if (bookingSeminar) {
      bookingForm.reset({
        name: currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : '',
        email: currentUser?.email || '',
        organisation: userOrganisations?.[0]?.name || '',
        phone: '',
        notes: '',
      });
    }
  }, [bookingSeminar, userOrganisations]);

  useEffect(() => {
    if (!sharingSeminar) shareForm.reset();
  }, [sharingSeminar]);

  const bookingMutation = useMutation({
    mutationFn: (formData: BookingFormValues) =>
      apiRequest('POST', '/api/cl-book', { ...formData, seminar: bookingSeminar }),
    onSuccess: () => {
      setBookingConfirmed(true);
    },
    onError: () => {
      toast({ title: 'Something went wrong', description: 'Please try again or contact us directly.', variant: 'destructive' });
    },
  });

  const shareMutation = useMutation({
    mutationFn: (formData: ShareFormValues) =>
      apiRequest('POST', '/api/cl-share', {
        ...formData,
        seminar: sharingSeminar,
        senderName: currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : 'A portal user',
        senderEmail: currentUser?.email || '',
      }),
    onSuccess: (_data, variables) => {
      setSharingConfirmedRecipient(variables.recipientName);
    },
    onError: () => {
      toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' });
    },
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
                        <button
                          onClick={() => { trackEvent("link_click", `More info: ${s.name}`, s.infoUrl!, "events"); setSelectedSeminar(s); }}
                          className="text-xs text-[#2e3192] hover:underline font-medium whitespace-nowrap"
                          data-testid={`button-seminar-more-info-${i}`}
                        >
                          More info
                        </button>
                      )}
                      <button
                        onClick={() => { trackEvent("link_click", `Book: ${s.name}`, s.bookUrl, "events"); setBookingSeminar(s); }}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors whitespace-nowrap"
                        style={{ background: "#ba1b6e" }}
                        data-testid={`button-seminar-book-${i}`}
                      >
                        Book now
                      </button>
                      <button
                        onClick={() => setSharingSeminar(s)}
                        className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                        data-testid={`button-seminar-share-${i}`}
                      >
                        <Share2 className="h-3 w-3" />
                        Share
                      </button>
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

      {/* Event detail dialog */}
      <Dialog open={!!selectedSeminar} onOpenChange={(open) => { if (!open) setSelectedSeminar(null); }}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {/* Header */}
          <div
            className="px-6 py-5"
            style={{ background: "linear-gradient(135deg, #2e3192 0%, #ba1b6e 100%)" }}
          >
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-semibold leading-snug pr-6">
                {selectedSeminar?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedSeminar && (
              <span
                className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium"
                style={selectedSeminar.category === "social-housing"
                  ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                  : { background: "rgba(255,255,255,0.2)", color: "#fff" }}
              >
                {selectedSeminar.category === "social-housing" ? "Social Housing" : "Employment Law"}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto max-h-[60vh] space-y-4">
            {/* Key details row */}
            {selectedSeminar && (
              <div className="flex flex-wrap gap-4 text-sm">
                {selectedSeminar.date && selectedSeminar.date !== "TBC" && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <Calendar className="h-4 w-4 text-[#2e3192]" />
                    <span>{selectedSeminar.date}</span>
                    {selectedSeminar.time && selectedSeminar.time !== "TBC" && (
                      <span className="text-gray-400">· {selectedSeminar.time}</span>
                    )}
                  </div>
                )}
                {selectedSeminar.location && selectedSeminar.location !== "TBC" && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <MapPin className="h-4 w-4 text-[#ba1b6e]" />
                    <span>{selectedSeminar.location}</span>
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-800" />

            {/* While loading: show the list-page description as a preview */}
            {eventLoading && (
              <>
                {selectedSeminar?.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedSeminar.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-400 py-1">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading full event details…
                </div>
              </>
            )}

            {/* Structured content fetched from the CL event page */}
            {!eventLoading && eventDetails.map((block, idx) => {
              if (block.type === 'heading') {
                return (
                  <h3 key={idx} className="text-sm font-semibold text-[#2e3192] dark:text-blue-300 pt-2 first:pt-0">
                    {block.text}
                  </h3>
                );
              }
              if (block.type === 'list') {
                return (
                  <ul key={idx} className="list-disc pl-5 space-y-1.5">
                    {block.items?.map((item, j) => (
                      <li key={j} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {block.text}
                </p>
              );
            })}

            {/* Fallback if fetch returned nothing */}
            {!eventLoading && eventDetails.length === 0 && selectedSeminar?.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {selectedSeminar.description}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedSeminar?.bookUrl && (
                <button
                  onClick={() => { if (selectedSeminar) { trackEvent("link_click", `Book (modal): ${selectedSeminar.name}`, selectedSeminar.bookUrl, "events"); setBookingSeminar(selectedSeminar); setSelectedSeminar(null); } }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white transition-colors"
                  style={{ background: "#ba1b6e" }}
                  data-testid="button-seminar-book-modal"
                >
                  Book now
                </button>
              )}
              <button
                onClick={() => { if (selectedSeminar) { setSharingSeminar(selectedSeminar); setSelectedSeminar(null); } }}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                data-testid="button-seminar-share-modal"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
              {selectedSeminar?.infoUrl && (
                <a
                  href={selectedSeminar.infoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => selectedSeminar && trackEvent("link_click", `View on CL: ${selectedSeminar.name}`, selectedSeminar.infoUrl!, "events")}
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View on CL website
                </a>
              )}
            </div>
            <img
              src={chadwickLawrenceLogo}
              alt="Chadwick Lawrence"
              className="h-7 opacity-40 dark:invert"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Booking Dialog ────────────────────────────────────────────── */}
      <Dialog open={!!bookingSeminar} onOpenChange={(open) => { if (!open) { setBookingSeminar(null); setBookingConfirmed(false); } }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <div style={{ background: "linear-gradient(135deg, #2e3192 0%, #ba1b6e 100%)" }} className="px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-semibold leading-snug pr-6">
                {bookingSeminar?.name}
              </DialogTitle>
            </DialogHeader>
            <p className="text-white/75 text-xs mt-1.5 font-medium tracking-wide uppercase">
              Free training session · Chadwick Lawrence
            </p>
          </div>
          {bookingConfirmed ? (
            <div className="px-6 py-10 text-center">
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-50 dark:bg-green-900/20">
                  <CheckCircle2 className="h-9 w-9 text-green-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Booking Enquiry Received</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                Thank you! A member of the seminar team will be in touch with you shortly.
              </p>
              <Button
                onClick={() => { setBookingSeminar(null); setBookingConfirmed(false); }}
                className="text-white px-6"
                style={{ background: "#2e3192", border: 'none' }}
              >
                Close
              </Button>
            </div>
          ) : (
          <form
            onSubmit={bookingForm.handleSubmit((data) => bookingMutation.mutate(data))}
            className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="b-name" className="text-xs font-medium">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input id="b-name" {...bookingForm.register('name')} placeholder="Your full name" data-testid="input-booking-name" />
                {bookingForm.formState.errors.name && (
                  <p className="text-red-500 text-xs">{bookingForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-email" className="text-xs font-medium">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input id="b-email" type="email" {...bookingForm.register('email')} placeholder="your@email.com" data-testid="input-booking-email" />
                {bookingForm.formState.errors.email && (
                  <p className="text-red-500 text-xs">{bookingForm.formState.errors.email.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="b-org" className="text-xs font-medium">
                  Organisation <span className="text-red-500">*</span>
                </Label>
                <Input id="b-org" {...bookingForm.register('organisation')} placeholder="Your organisation" data-testid="input-booking-organisation" />
                {bookingForm.formState.errors.organisation && (
                  <p className="text-red-500 text-xs">{bookingForm.formState.errors.organisation.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-phone" className="text-xs font-medium">
                  Telephone <span className="text-red-500">*</span>
                </Label>
                <Input id="b-phone" {...bookingForm.register('phone')} placeholder="Your phone number" data-testid="input-booking-phone" />
                {bookingForm.formState.errors.phone && (
                  <p className="text-red-500 text-xs">{bookingForm.formState.errors.phone.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-notes" className="text-xs font-medium">Additional Information</Label>
              <Textarea
                id="b-notes"
                {...bookingForm.register('notes')}
                placeholder="Any questions, specific requirements, or number of attendees…"
                rows={3}
                data-testid="textarea-booking-notes"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setBookingSeminar(null)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                data-testid="button-booking-cancel"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={bookingMutation.isPending}
                className="text-white text-sm font-semibold px-5 gap-2"
                style={{ background: "#ba1b6e", border: 'none' }}
                data-testid="button-booking-submit"
              >
                {bookingMutation.isPending
                  ? <><RefreshCw className="h-4 w-4 animate-spin" /> Sending…</>
                  : <><Send className="h-4 w-4" /> Send Booking Request</>}
              </Button>
            </div>
          </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Share Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!sharingSeminar} onOpenChange={(open) => { if (!open) { setSharingSeminar(null); setSharingConfirmedRecipient(null); } }}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div style={{ background: "linear-gradient(135deg, #2e3192 0%, #ba1b6e 100%)" }} className="px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-semibold leading-snug pr-6">
                Share this seminar
              </DialogTitle>
            </DialogHeader>
            <p className="text-white/75 text-xs mt-1 line-clamp-1">{sharingSeminar?.name}</p>
          </div>
          {sharingConfirmedRecipient ? (
            <div className="px-6 py-10 text-center">
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-50 dark:bg-green-900/20">
                  <CheckCircle2 className="h-9 w-9 text-green-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Seminar Shared!</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                Thank you! The seminar has been shared with <strong>{sharingConfirmedRecipient}</strong>. We hope they find it useful.
              </p>
              <Button
                onClick={() => { setSharingSeminar(null); setSharingConfirmedRecipient(null); }}
                className="text-white px-6"
                style={{ background: "#2e3192", border: 'none' }}
              >
                Close
              </Button>
            </div>
          ) : (
          <form
            onSubmit={shareForm.handleSubmit((data) => shareMutation.mutate(data))}
            className="px-6 py-5 space-y-4"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Enter the details of the person you'd like to share this with. They'll receive an email from Chadwick Lawrence with the seminar information on your behalf.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="s-name" className="text-xs font-medium">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input id="s-name" {...shareForm.register('recipientName')} placeholder="Their full name" data-testid="input-share-name" />
                {shareForm.formState.errors.recipientName && (
                  <p className="text-red-500 text-xs">{shareForm.formState.errors.recipientName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-email" className="text-xs font-medium">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input id="s-email" type="email" {...shareForm.register('recipientEmail')} placeholder="their@email.com" data-testid="input-share-email" />
                {shareForm.formState.errors.recipientEmail && (
                  <p className="text-red-500 text-xs">{shareForm.formState.errors.recipientEmail.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="s-phone" className="text-xs font-medium">
                  Telephone <span className="text-red-500">*</span>
                </Label>
                <Input id="s-phone" {...shareForm.register('recipientPhone')} placeholder="Their phone number" data-testid="input-share-phone" />
                {shareForm.formState.errors.recipientPhone && (
                  <p className="text-red-500 text-xs">{shareForm.formState.errors.recipientPhone.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-job" className="text-xs font-medium">
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <Input id="s-job" {...shareForm.register('recipientJobTitle')} placeholder="Their job title" data-testid="input-share-job-title" />
                {shareForm.formState.errors.recipientJobTitle && (
                  <p className="text-red-500 text-xs">{shareForm.formState.errors.recipientJobTitle.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-org" className="text-xs font-medium">
                Organisation <span className="text-red-500">*</span>
              </Label>
              <Input id="s-org" {...shareForm.register('recipientOrganisation')} placeholder="Their company or organisation" data-testid="input-share-organisation" />
              {shareForm.formState.errors.recipientOrganisation && (
                <p className="text-red-500 text-xs">{shareForm.formState.errors.recipientOrganisation.message}</p>
              )}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setSharingSeminar(null)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                data-testid="button-share-cancel"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={shareMutation.isPending}
                className="text-white text-sm font-semibold px-5 gap-2"
                style={{ background: "#2e3192", border: 'none' }}
                data-testid="button-share-submit"
              >
                {shareMutation.isPending
                  ? <><RefreshCw className="h-4 w-4 animate-spin" /> Sending…</>
                  : <><Share2 className="h-4 w-4" /> Share Seminar</>}
              </Button>
            </div>
          </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
