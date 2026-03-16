import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers, getCustomerStats, activateCustomer, suspendCustomer, syncCustomerStatuses } from "@/lib/api";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Play, Pause, Eye, RefreshCw, ArrowUpDown, Download, FileSpreadsheet, Users, UserCheck, UserX, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "suspended", label: "Suspended" },
  { value: "churned", label: "Churned" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  expired: "bg-orange-100 text-orange-700",
  suspended: "bg-red-100 text-red-700",
  churned: "bg-gray-100 text-gray-700",
};

type SortField = "name" | "owner" | "plan" | "status" | "expires_at";
type SortDir = "asc" | "desc";

export default function Customers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [activateDialog, setActivateDialog] = useState<any>(null);
  const [months, setMonths] = useState("1");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data: rawCustomers = [], isLoading, refetch } = useQuery({
    queryKey: ["customers", statusFilter, search],
    queryFn: () => getCustomers({ status: statusFilter === "all" ? undefined : statusFilter, search: search || undefined }),
  });

  const { data: stats } = useQuery({
    queryKey: ["customer-stats"],
    queryFn: () => getCustomerStats(),
  });

  const customers = useMemo(() => {
    return [...rawCustomers].sort((a: any, b: any) => {
      let aVal = "";
      let bVal = "";
      if (sortField === "name") {
        aVal = `${a.firstname || ""} ${a.lastname || ""}`.toLowerCase();
        bVal = `${b.firstname || ""} ${b.lastname || ""}`.toLowerCase();
      } else if (sortField === "owner") {
        aVal = (a.owner || "").toLowerCase();
        bVal = (b.owner || "").toLowerCase();
      } else if (sortField === "plan") {
        aVal = (a.plans?.name || "").toLowerCase();
        bVal = (b.plans?.name || "").toLowerCase();
      } else if (sortField === "status") {
        aVal = a.status || "";
        bVal = b.status || "";
      } else if (sortField === "expires_at") {
        aVal = a.expires_at || "";
        bVal = b.expires_at || "";
      }
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rawCustomers, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function exportCSV() {
    const rows = customers.map((c: any) => ({
      Name: `${c.firstname || ""} ${c.lastname || ""}`.trim(),
      Email: c.email || "",
      Phone: c.phone || "",
      Plan: c.plans?.name || "",
      Owner: c.owner || "",
      Status: c.status || "",
      Expires: c.expires_at ? format(new Date(c.expires_at), "yyyy-MM-dd") : "",
    }));
    const header = Object.keys(rows[0] || {}).join(",");
    const lines = rows.map((r: any) => Object.values(r).map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportExcel() {
    const rows = customers.map((c: any) => ({
      Name: `${c.firstname || ""} ${c.lastname || ""}`.trim(),
      Email: c.email || "",
      Phone: c.phone || "",
      Plan: c.plans?.name || "",
      Owner: c.owner || "",
      Status: c.status || "",
      Expires: c.expires_at ? format(new Date(c.expires_at), "yyyy-MM-dd") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, `customers-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  }

  const syncMutation = useMutation({
    mutationFn: () => syncCustomerStatuses(),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      toast({ title: `Sync complete: ${data.synced} updated, ${data.failed} failed` });
    },
    onError: (err: Error) => toast({ title: "Sync failed", description: err.message, variant: "destructive" }),
  });

  const activateMutation = useMutation({
    mutationFn: ({ id, months }: { id: string; months: number }) => activateCustomer(id, months),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      setActivateDialog(null);
      toast({ title: "Customer activated successfully" });
    },
    onError: (err: Error) => toast({ title: "Activation failed", description: err.message, variant: "destructive" }),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => suspendCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      toast({ title: "Customer suspended" });
    },
    onError: (err: Error) => toast({ title: "Suspend failed", description: err.message, variant: "destructive" }),
  });

  const summaryCards = [
    { key: "all", label: "Total", value: stats?.total ?? 0, icon: Users, color: "bg-blue-50 text-blue-700 border-blue-200", iconColor: "text-blue-500" },
    { key: "active", label: "Active", value: stats?.active ?? 0, icon: UserCheck, color: "bg-green-50 text-green-700 border-green-200", iconColor: "text-green-500" },
    { key: "expired", label: "Expired", value: stats?.expired ?? 0, icon: Clock, color: "bg-orange-50 text-orange-700 border-orange-200", iconColor: "text-orange-500" },
    { key: "churned", label: "Churned", value: stats?.churned ?? 0, icon: AlertTriangle, color: "bg-gray-50 text-gray-700 border-gray-200", iconColor: "text-gray-500" },
    { key: "suspended", label: "Suspended", value: stats?.suspended ?? 0, icon: UserX, color: "bg-red-50 text-red-700 border-red-200", iconColor: "text-red-500" },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const isSelected = statusFilter === card.key;
          return (
            <Card
              key={card.key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? `ring-2 ring-offset-1 ${card.color}` : "hover:border-gray-300"
              }`}
              onClick={() => setStatusFilter(isSelected ? "all" : card.key)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`rounded-full p-2 ${isSelected ? card.color : "bg-muted"}`}>
                  <Icon className={`h-5 w-5 ${isSelected ? card.iconColor : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters + Actions toolbar */}
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
        <Button variant="outline" size="icon" title="Refresh" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          title="Sync status from Radius"
          className="gap-1"
          disabled={syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
        >
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          Sync
        </Button>
        <Button variant="outline" size="sm" className="gap-1" onClick={exportCSV} disabled={customers.length === 0}>
          <Download className="h-4 w-4" /> CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-1" onClick={exportExcel} disabled={customers.length === 0}>
          <FileSpreadsheet className="h-4 w-4" /> Excel
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                  <span className="flex items-center gap-1">Name <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell cursor-pointer select-none" onClick={() => toggleSort("plan")}>
                  <span className="flex items-center gap-1">Plan <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="hidden xl:table-cell cursor-pointer select-none" onClick={() => toggleSort("owner")}>
                  <span className="flex items-center gap-1">Owner <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("status")}>
                  <span className="flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer select-none" onClick={() => toggleSort("expires_at")}>
                  <span className="flex items-center gap-1">Expires <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No customers found</TableCell>
                </TableRow>
              ) : (
                customers.map((cust: any) => (
                  <TableRow key={cust.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{cust.firstname} {cust.lastname}</p>
                        <p className="text-xs text-muted-foreground">{cust.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{cust.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell capitalize">{cust.plans?.name || "—"}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm">{cust.owner || "—"}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[cust.status] || "bg-gray-100 text-gray-700"}>
                        {cust.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {cust.expires_at ? format(new Date(cust.expires_at), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="View" onClick={() => setSelectedCustomer(cust)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(cust.status === "expired" || cust.status === "suspended") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Activate"
                            className="text-green-600"
                            onClick={() => setActivateDialog(cust)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {cust.status === "active" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Suspend"
                            className="text-red-600"
                            onClick={() => {
                              if (confirm(`Suspend ${cust.firstname} ${cust.lastname}?`)) {
                                suspendMutation.mutate(cust.id);
                              }
                            }}
                          >
                            <Pause className="h-4 w-4" />
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

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Name:</span> <strong>{selectedCustomer.firstname} {selectedCustomer.lastname}</strong></div>
                <div><span className="text-muted-foreground">Email:</span> {selectedCustomer.email}</div>
                <div><span className="text-muted-foreground">Phone:</span> {selectedCustomer.phone}</div>
                <div><span className="text-muted-foreground">Plan:</span> <span className="capitalize">{selectedCustomer.plans?.name || "—"}</span></div>
                <div><span className="text-muted-foreground">Owner:</span> {selectedCustomer.owner || "—"}</div>
                <div><span className="text-muted-foreground">Radius User:</span> {selectedCustomer.radius_username}</div>
                <div><span className="text-muted-foreground">Status:</span>{" "}
                  <Badge className={STATUS_COLORS[selectedCustomer.status] || ""}>{selectedCustomer.status}</Badge>
                </div>
                <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {selectedCustomer.address || "—"} {selectedCustomer.city || ""}</div>
                {selectedCustomer.activated_at && (
                  <div><span className="text-muted-foreground">Activated:</span> {format(new Date(selectedCustomer.activated_at), "PPP")}</div>
                )}
                {selectedCustomer.expires_at && (
                  <div><span className="text-muted-foreground">Expires:</span> {format(new Date(selectedCustomer.expires_at), "PPP")}</div>
                )}
                {selectedCustomer.gps_lat && (
                  <div className="col-span-2"><span className="text-muted-foreground">GPS:</span> {selectedCustomer.gps_lat}, {selectedCustomer.gps_long}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Activate Dialog */}
      <Dialog open={!!activateDialog} onOpenChange={() => setActivateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate {activateDialog?.firstname} {activateDialog?.lastname}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will extend the customer's Radius Manager expiry and mark them as active.
            </p>
            <div>
              <Label>Duration (months)</Label>
              <Input type="number" min="1" max="12" value={months} onChange={(e) => setMonths(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateDialog(null)}>Cancel</Button>
            <Button onClick={() => activateMutation.mutate({ id: activateDialog.id, months: Number(months) })} disabled={activateMutation.isPending}>
              {activateMutation.isPending ? "Activating..." : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
