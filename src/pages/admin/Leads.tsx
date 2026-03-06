import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLeads, updateLead, generatePaymentLink } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, CreditCard, Calendar, RefreshCw, Send } from "lucide-react";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "survey_scheduled", label: "Survey Scheduled" },
  { value: "payment_pending", label: "Payment Pending" },
  { value: "payment_confirmed", label: "Payment Confirmed" },
  { value: "provisioning", label: "Provisioning" },
  { value: "active", label: "Active" },
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  survey_scheduled: "bg-yellow-100 text-yellow-700",
  payment_pending: "bg-orange-100 text-orange-700",
  payment_confirmed: "bg-green-100 text-green-700",
  provisioning: "bg-purple-100 text-purple-700",
  active: "bg-emerald-100 text-emerald-700",
};

export default function Leads() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [paymentDialog, setPaymentDialog] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [surveyDialog, setSurveyDialog] = useState<any>(null);
  const [surveyDate, setSurveyDate] = useState("");
  const [surveyNotes, setSurveyNotes] = useState("");
  const [statusChangeId, setStatusChangeId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ["leads", statusFilter, search],
    queryFn: () => getLeads({ status: statusFilter === "all" ? undefined : statusFilter, search: search || undefined }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead updated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => generatePaymentLink(id, amount),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setPaymentDialog(null);
      if (data.payment_url) {
        const smsNote = data.sms_sent ? " SMS sent to customer." : "";
        toast({ title: "Payment link generated", description: `Link ready.${smsNote}` });
        window.open(data.payment_url, "_blank");
      }
    },
    onError: (err: Error) => toast({ title: "Payment error", description: err.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      updateLead(id, { status, ...(notes ? { notes } : {}) }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setSelectedLead(updated);
      setStatusChangeId(null);
      setNewStatus("");
      setNewNotes("");
      toast({ title: "Status updated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleScheduleSurvey = () => {
    if (!surveyDialog || !surveyDate) return;
    updateMutation.mutate({
      id: surveyDialog.id,
      data: {
        status: "survey_scheduled",
        survey_date: new Date(surveyDate).toISOString(),
        notes: surveyNotes || undefined,
      },
    });
    setSurveyDialog(null);
    setSurveyDate("");
    setSurveyNotes("");
  };

  const handlePaymentLink = () => {
    if (!paymentDialog || !paymentAmount) return;
    paymentMutation.mutate({ id: paymentDialog.id, amount: Number(paymentAmount) });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead: any) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{lead.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell capitalize">{lead.plan_requested}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-700"}>
                        {lead.status?.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {lead.created_at ? format(new Date(lead.created_at), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View details"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(lead.status === "new" || lead.status === "survey_scheduled") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Schedule survey"
                            onClick={() => setSurveyDialog(lead)}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        )}
                        {(lead.status === "new" || lead.status === "survey_scheduled" || lead.status === "payment_pending") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={lead.status === "payment_pending" ? "Resend payment link" : "Send payment link"}
                            onClick={() => {
                              setPaymentDialog(lead);
                              setPaymentAmount(lead.payment_amount || "15000");
                            }}
                          >
                            {lead.status === "payment_pending" ? <Send className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => { setSelectedLead(null); setStatusChangeId(null); setNewStatus(""); setNewNotes(""); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Name:</span> <strong>{selectedLead.name}</strong></div>
                <div><span className="text-muted-foreground">Email:</span> {selectedLead.email}</div>
                <div><span className="text-muted-foreground">Phone:</span> {selectedLead.phone}</div>
                <div><span className="text-muted-foreground">Plan:</span> <span className="capitalize">{selectedLead.plan_requested}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {selectedLead.address || "—"}</div>
                <div><span className="text-muted-foreground">Status:</span>{" "}
                  <Badge className={STATUS_COLORS[selectedLead.status] || ""}>
                    {selectedLead.status?.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div><span className="text-muted-foreground">Source:</span> {selectedLead.source}</div>
                {selectedLead.gps_lat && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">GPS:</span> {selectedLead.gps_lat}, {selectedLead.gps_long}
                  </div>
                )}
                {selectedLead.survey_date && (
                  <div><span className="text-muted-foreground">Survey:</span> {format(new Date(selectedLead.survey_date), "PPP p")}</div>
                )}
                {selectedLead.payment_ref && (
                  <div className="col-span-2"><span className="text-muted-foreground">Payment Ref:</span> <code className="text-xs">{selectedLead.payment_ref}</code></div>
                )}
                {selectedLead.payment_amount && (
                  <div><span className="text-muted-foreground">Amount:</span> ₦{Number(selectedLead.payment_amount).toLocaleString()}</div>
                )}
                {selectedLead.notes && (
                  <div className="col-span-2"><span className="text-muted-foreground">Notes:</span> {selectedLead.notes}</div>
                )}
              </div>

              {/* Manual status change */}
              <div className="border-t pt-3">
                <p className="font-medium mb-2 text-muted-foreground">Change Pipeline Status</p>
                {statusChangeId === selectedLead.id ? (
                  <div className="space-y-2">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.filter(o => o.value !== "all").map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Notes (optional)"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!newStatus || statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: selectedLead.id, status: newStatus, notes: newNotes || undefined })}
                      >
                        {statusMutation.isPending ? "Saving..." : "Apply"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setStatusChangeId(null); setNewStatus(""); setNewNotes(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => { setStatusChangeId(selectedLead.id); setNewStatus(selectedLead.status); }}>
                    Move stage
                  </Button>
                )}
              </div>

              {/* Quick actions */}
              <div className="border-t pt-3 flex flex-wrap gap-2">
                {(selectedLead.status === "new" || selectedLead.status === "survey_scheduled") && (
                  <Button size="sm" variant="outline" onClick={() => { setSurveyDialog(selectedLead); setSelectedLead(null); }}>
                    <Calendar className="h-3.5 w-3.5 mr-1" /> Schedule Survey
                  </Button>
                )}
                {(selectedLead.status === "new" || selectedLead.status === "survey_scheduled" || selectedLead.status === "payment_pending") && (
                  <Button size="sm" variant="outline" onClick={() => { setPaymentDialog(selectedLead); setPaymentAmount(selectedLead.payment_amount || "15000"); setSelectedLead(null); }}>
                    {selectedLead.status === "payment_pending" ? <Send className="h-3.5 w-3.5 mr-1" /> : <CreditCard className="h-3.5 w-3.5 mr-1" />}
                    {selectedLead.status === "payment_pending" ? "Resend Payment Link" : "Send Payment Link"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Survey Dialog */}
      <Dialog open={!!surveyDialog} onOpenChange={() => setSurveyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Survey for {surveyDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Survey Date</Label>
              <Input type="datetime-local" value={surveyDate} onChange={(e) => setSurveyDate(e.target.value)} />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input value={surveyNotes} onChange={(e) => setSurveyNotes(e.target.value)} placeholder="e.g. Customer prefers morning" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSurveyDialog(null)}>Cancel</Button>
            <Button onClick={handleScheduleSurvey} disabled={!surveyDate}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Link Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={() => setPaymentDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentDialog?.status === "payment_pending" ? "Resend" : "Send"} Payment Link — {paymentDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="e.g. 15000"
              />
            </div>
            <div className="rounded-md bg-muted px-3 py-2 text-sm space-y-1">
              <div>Phone: <strong>{paymentDialog?.phone || "—"}</strong></div>
              <div>Plan: <span className="capitalize">{paymentDialog?.plan_requested}</span></div>
              <div>Email: {paymentDialog?.email}</div>
              {paymentDialog?.payment_ref && <div className="text-xs text-muted-foreground">Previous ref: {paymentDialog.payment_ref}</div>}
            </div>
            <p className="text-xs text-muted-foreground">A new payment link will be generated and sent via SMS to the customer's phone number.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(null)}>Cancel</Button>
            <Button onClick={handlePaymentLink} disabled={paymentMutation.isPending || !paymentAmount}>
              {paymentMutation.isPending ? "Sending..." : paymentDialog?.status === "payment_pending" ? "Resend Link via SMS" : "Generate & Send via SMS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
