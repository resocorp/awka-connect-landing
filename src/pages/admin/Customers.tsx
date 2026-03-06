import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomers, activateCustomer, suspendCustomer } from "@/lib/api";
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
import { Search, Play, Pause, Eye, RefreshCw } from "lucide-react";
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

export default function Customers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [activateDialog, setActivateDialog] = useState<any>(null);
  const [months, setMonths] = useState("1");

  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ["customers", statusFilter, search],
    queryFn: () => getCustomers({ status: statusFilter === "all" ? undefined : statusFilter, search: search || undefined }),
  });

  const activateMutation = useMutation({
    mutationFn: ({ id, months }: { id: string; months: number }) => activateCustomer(id, months),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setActivateDialog(null);
      toast({ title: "Customer activated successfully" });
    },
    onError: (err: Error) => toast({ title: "Activation failed", description: err.message, variant: "destructive" }),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => suspendCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer suspended" });
    },
    onError: (err: Error) => toast({ title: "Suspend failed", description: err.message, variant: "destructive" }),
  });

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
                <TableHead className="hidden md:table-cell">Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No customers found</TableCell>
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
