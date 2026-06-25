import React, { useState } from "react";
import { 
  ArrowLeft, 
  Info, 
  UploadCloud, 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  X,
  CheckCircle2,
  Building2,
  User,
  PoundSterling,
  CalendarDays,
  FileBadge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import "./_group.css";

export function Redesign() {
  const [debtorType, setDebtorType] = useState<"individual" | "business" | null>(null);
  const [individualOrBusiness, setIndividualOrBusiness] = useState<"individual" | "business" | null>(null);
  
  const [attachments, setAttachments] = useState([
    { id: 1, name: "Invoice-4471.pdf", size: "248 KB", type: "pdf" },
    { id: 2, name: "Signed-Contract.docx", size: "1.2 MB", type: "doc" },
    { id: 3, name: "Statement-of-Account.xlsx", size: "856 KB", type: "xls" },
    { id: 4, name: "Site-photo.jpg", size: "3.4 MB", type: "img" },
  ]);

  const removeAttachment = (id: number) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="h-6 w-6 text-red-500" />;
      case 'doc': return <FileText className="h-6 w-6 text-blue-500" />;
      case 'xls': return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
      case 'img': return <FileImage className="h-6 w-6 text-gray-500" />;
      default: return <FileBadge className="h-6 w-6 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col space-y-4">
          <Button variant="ghost" className="w-fit -ml-4 text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Submit a New Case</h1>
            <p className="text-slate-500 mt-2 text-lg">
              Provide the details below to begin the debt recovery process.
            </p>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 text-blue-900 shadow-sm">
          <div className="mt-0.5">
            <Info className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">What happens after submission?</h3>
            <p className="text-sm text-blue-800 mt-1 leading-relaxed">
              Once submitted, your case will be securely routed to our recovery team for an initial review. 
              We will verify the details, perform conflict checks, and set up the matter in our system. 
              You will receive a confirmation email and the case will appear on your dashboard within 1-2 business days.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="space-y-8">
          
          {/* Section 1: Your Details */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <div className="h-1 w-full bg-[hsl(var(--acclaim-teal))]"></div>
            <CardHeader className="bg-white pb-4">
              <CardTitle className="flex items-center text-xl text-slate-800">
                <User className="h-5 w-5 mr-2 text-[hsl(var(--acclaim-teal))]" />
                Your Details
              </CardTitle>
              <CardDescription>
                Details of the person submitting this case.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="claimant">
                    Submitting on behalf of claimant <span className="text-red-500">*</span>
                  </Label>
                  <Select defaultValue="acclaim">
                    <SelectTrigger id="claimant" className="bg-white">
                      <SelectValue placeholder="Select organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acclaim">Acclaim Ltd</SelectItem>
                      <SelectItem value="northern">Northern Recoveries Ltd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="your-name">Your Name <span className="text-red-500">*</span></Label>
                  <Input id="your-name" placeholder="e.g. Jane Doe" defaultValue="Jane Doe" className="bg-white" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="your-email">Your Email Address <span className="text-red-500">*</span></Label>
                  <Input id="your-email" type="email" placeholder="jane@example.com" defaultValue="jane.doe@acclaim.co.uk" className="bg-white" />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="your-phone">Your Contact Number <span className="text-slate-400 font-normal ml-1">(Optional)</span></Label>
                  <Input id="your-phone" type="tel" placeholder="e.g. 0113 456 7890" className="bg-white w-full md:w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Debtor Details */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <div className="h-1 w-full bg-[hsl(var(--acclaim-teal))]"></div>
            <CardHeader className="bg-white pb-4">
              <CardTitle className="flex items-center text-xl text-slate-800">
                <Building2 className="h-5 w-5 mr-2 text-[hsl(var(--acclaim-teal))]" />
                Debtor Details
              </CardTitle>
              <CardDescription>
                Information about the individual or organisation that owes the debt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-2">
              
              {/* Type of Debtor */}
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                <Label className="text-base">Type of Debtor <span className="text-red-500">*</span></Label>
                <RadioGroup 
                  defaultValue="business" 
                  onValueChange={(val) => setDebtorType(val as any)}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-md border border-slate-200 flex-1 hover:border-[hsl(var(--acclaim-teal))] cursor-pointer transition-colors has-[:checked]:border-[hsl(var(--acclaim-teal))] has-[:checked]:bg-[hsl(var(--acclaim-teal))/2]">
                    <RadioGroupItem value="individual" id="type-ind" />
                    <Label htmlFor="type-ind" className="cursor-pointer font-medium w-full">Individual</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-md border border-slate-200 flex-1 hover:border-[hsl(var(--acclaim-teal))] cursor-pointer transition-colors has-[:checked]:border-[hsl(var(--acclaim-teal))] has-[:checked]:bg-[hsl(var(--acclaim-teal))/2]">
                    <RadioGroupItem value="business" id="type-bus" />
                    <Label htmlFor="type-bus" className="cursor-pointer font-medium w-full">Business / Organisation</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Business specific fields (shows if business) */}
              <div className={`space-y-6 ${debtorType === 'individual' ? 'hidden' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="org-name">Organisation Name <span className="text-red-500">*</span></Label>
                    <Input id="org-name" placeholder="Enter the registered company name" className="bg-white" defaultValue="Acme Services Ltd" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trading-name">Trading Name <span className="text-slate-400 font-normal ml-1">(Optional)</span></Label>
                    <Input id="trading-name" placeholder="If different from above" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-num">Company Number <span className="text-slate-400 font-normal ml-1">(Optional)</span></Label>
                    <Input id="company-num" placeholder="e.g. 12345678" className="bg-white" defaultValue="11223344" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Principal Details Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-800">Principal of Business Details</h3>
                  <p className="text-sm text-slate-500 mt-1">Provide the details of the main contact or business owner.</p>
                </div>
                
                <div className="space-y-3">
                  <Label>Is this debtor an individual or business? <span className="text-red-500">*</span></Label>
                  <Select onValueChange={(val) => setIndividualOrBusiness(val as any)}>
                    <SelectTrigger className="bg-white w-full md:w-1/2">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual / Sole Trader</SelectItem>
                      <SelectItem value="business">Limited Company / Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className={`p-5 rounded-lg border transition-all duration-300 ${!individualOrBusiness ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}>
                  {!individualOrBusiness && (
                    <div className="flex items-center gap-2 mb-4 text-amber-600 bg-amber-50 px-3 py-2 rounded-md text-sm border border-amber-100">
                      <Info className="h-4 w-4" />
                      Please select whether the debtor is an individual or business to continue.
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="space-y-2 sm:col-span-3">
                      <Label htmlFor="salutation" className={!individualOrBusiness ? "text-slate-400" : ""}>
                        Salutation <span className="text-red-500">*</span>
                      </Label>
                      <Select disabled={!individualOrBusiness}>
                        <SelectTrigger id="salutation" className={!individualOrBusiness ? "bg-slate-50" : "bg-white"}>
                          <SelectValue placeholder="Title" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mr">Mr</SelectItem>
                          <SelectItem value="mrs">Mrs</SelectItem>
                          <SelectItem value="miss">Miss</SelectItem>
                          <SelectItem value="ms">Ms</SelectItem>
                          <SelectItem value="dr">Dr</SelectItem>
                          <SelectItem value="prof">Prof</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-4">
                      <Label htmlFor="fname" className={!individualOrBusiness ? "text-slate-400" : ""}>
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input id="fname" disabled={!individualOrBusiness} className={!individualOrBusiness ? "bg-slate-50" : "bg-white"} placeholder="e.g. John" />
                    </div>
                    <div className="space-y-2 sm:col-span-5">
                      <Label htmlFor="lname" className={!individualOrBusiness ? "text-slate-400" : ""}>
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input id="lname" disabled={!individualOrBusiness} className={!individualOrBusiness ? "bg-slate-50" : "bg-white"} placeholder="e.g. Smith" />
                    </div>
                    
                    {/* Only show trading name here if it's a business */}
                    <div className={`space-y-2 sm:col-span-12 ${individualOrBusiness !== 'business' ? 'hidden' : ''}`}>
                      <Label htmlFor="prin-trading">Trading Name <span className="text-red-500">*</span></Label>
                      <Input id="prin-trading" className="bg-white" placeholder="Trading as" />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-800">Debtor Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="addr1">Address Line 1 <span className="text-red-500">*</span></Label>
                    <Input id="addr1" className="bg-white" placeholder="Street address, building name" defaultValue="123 Example Street" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="addr2">Address Line 2 <span className="text-slate-400 font-normal ml-1">(Optional)</span></Label>
                    <Input id="addr2" className="bg-white" placeholder="Suite, unit, floor, etc." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City / Town <span className="text-red-500">*</span></Label>
                    <Input id="city" className="bg-white" defaultValue="Leeds" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county">County <span className="text-slate-400 font-normal ml-1">(Optional)</span></Label>
                    <Input id="county" className="bg-white" defaultValue="West Yorkshire" />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="postcode">Postcode <span className="text-red-500">*</span></Label>
                    <Input id="postcode" className="bg-white" defaultValue="LS1 2AB" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-800">Debtor Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="main-phone">Main Telephone <span className="text-slate-400 font-normal ml-1">(Optional)</span></Label>
                    <Input id="main-phone" type="tel" className="bg-white" defaultValue="0113 987 6543" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alt-phone">Alternative Telephone <span className="text-slate-400 font-normal ml-1">(Optional)</span></Label>
                    <Input id="alt-phone" type="tel" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="main-email">Main Email <span className="text-slate-400 font-normal ml-1">(Optional)</span></Label>
                    <Input id="main-email" type="email" className="bg-white" defaultValue="accounts@acmeservices.co.uk" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alt-email">Alternative Email <span className="text-slate-400 font-normal ml-1">(Optional)</span></Label>
                    <Input id="alt-email" type="email" className="bg-white" />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Section 3: Debt Details */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <div className="h-1 w-full bg-[hsl(var(--acclaim-teal))]"></div>
            <CardHeader className="bg-white pb-4">
              <CardTitle className="flex items-center text-xl text-slate-800">
                <PoundSterling className="h-5 w-5 mr-2 text-[hsl(var(--acclaim-teal))]" />
                Debt Details
              </CardTitle>
              <CardDescription>
                Provide particulars regarding the outstanding amount and invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-2">
              
              <div className="space-y-2">
                <Label htmlFor="debt-details">Details of Debt <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="debt-details" 
                  className="bg-white min-h-[100px]" 
                  placeholder="Describe the nature of the debt (e.g., unpaid consulting services rendered in June 2023)..."
                  defaultValue="Unpaid invoices for IT consultancy services provided between March and May 2023. Multiple chasers sent with no response."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Total Debt Due to You as of Today <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Select defaultValue="gbp">
                      <SelectTrigger className="w-[100px] bg-white">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gbp">GBP (£)</SelectItem>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input id="amount" type="number" step="0.01" className="bg-white flex-1" defaultValue="4550.00" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms of Payment <span className="text-red-500">*</span></Label>
                  <Select defaultValue="days">
                    <SelectTrigger id="terms" className="bg-white">
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Number of Days</SelectItem>
                      <SelectItem value="other">Other Payment Terms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days">Number of Days <span className="text-slate-400 font-normal ml-1">(Optional)</span></Label>
                  <Input id="days" type="number" className="bg-white" defaultValue="30" />
                </div>
              </div>

              <Separator />

              {/* Invoice Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-slate-800">Invoice Details</h3>
                
                <div className="space-y-3">
                  <Label className="text-base">Does the debt relate to a single invoice? <span className="text-red-500">*</span></Label>
                  <RadioGroup defaultValue="no" className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="inv-yes" />
                      <Label htmlFor="inv-yes" className="font-medium cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="inv-no" />
                      <Label htmlFor="inv-no" className="font-medium cursor-pointer">No, multiple invoices</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="inv-date">Invoice Date <span className="text-slate-400 font-normal ml-1">(Optional)</span></Label>
                    <div className="relative">
                      <Input id="inv-date" type="date" className="bg-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="first-overdue">First Overdue Invoice Date <span className="text-red-500">*</span></Label>
                    <Input id="first-overdue" type="date" className="bg-white" defaultValue="2023-04-15" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-overdue">Last Overdue Invoice Date <span className="text-red-500">*</span></Label>
                    <Input id="last-overdue" type="date" className="bg-white" defaultValue="2023-06-15" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional">Additional Information <span className="text-slate-400 font-normal ml-1">(Optional)</span></Label>
                  <Textarea 
                    id="additional" 
                    className="bg-white" 
                    placeholder="Any other relevant details regarding the invoices or debt..."
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Section 4: Supporting Documents (REDESIGN FOCUS) */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <div className="h-1 w-full bg-[hsl(var(--acclaim-teal))]"></div>
            <CardHeader className="bg-white pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center text-xl text-slate-800">
                    <FileBadge className="h-5 w-5 mr-2 text-[hsl(var(--acclaim-teal))]" />
                    Supporting Documents
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    Upload any relevant contracts, invoices, or correspondence to support your case.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100">Max 25MB per file</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              
              {/* Dropzone */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-blue-50/50 hover:border-[hsl(var(--acclaim-blue))/40] transition-colors cursor-pointer group p-10 flex flex-col items-center justify-center text-center">
                <div className="h-14 w-14 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
                  <UploadCloud className="h-7 w-7 text-slate-500 group-hover:text-[hsl(var(--acclaim-blue))] transition-colors" />
                </div>
                <h4 className="text-lg font-medium text-slate-800 mb-1">Drag & drop files here or browse</h4>
                <p className="text-sm text-slate-500 mb-4">You can upload multiple files at once</p>
                <Button variant="outline" className="bg-white">Browse Files</Button>
                
                <div className="mt-6 text-xs text-slate-400 max-w-lg leading-relaxed">
                  Supported formats: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF, HEIC, XLS, XLSX, CSV, ZIP, RAR, MP4, MOV, AVI, WEBM, MKV, M4V, 3GP
                </div>
              </div>

              {/* Outlook-style Attachment List */}
              {attachments.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                    Attached Files <Badge className="ml-2 bg-slate-200 text-slate-700 hover:bg-slate-200">{attachments.length}</Badge>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                    {attachments.map((file) => (
                      <div 
                        key={file.id} 
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-[hsl(var(--acclaim-teal))/40] transition-colors group"
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="shrink-0 p-2 bg-slate-50 rounded-md">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-slate-700 truncate block" title={file.name}>
                              {file.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {file.size}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeAttachment(file.id)}
                          className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          title="Remove attachment"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 pb-12">
            <Button variant="outline" className="px-6 py-6 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium">
              Cancel
            </Button>
            <Button className="px-8 py-6 bg-[hsl(var(--acclaim-teal))] hover:bg-[hsl(var(--acclaim-teal))/90] text-white font-medium text-base shadow-sm">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Submit Case
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
