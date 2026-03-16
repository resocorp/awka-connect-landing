import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings, getPlans, createPlan, updatePlan, deletePlan, getWhatsAppStatus, getWhatsAppQR } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Save, Plus, Pencil, Trash2, Wifi, CreditCard, MessageSquare, CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Settings (Radius, SMS, etc.) ──
  const { data: settings = {} } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [radiusForm, setRadiusForm] = useState({
    radius_api_url: "",
    radius_api_user: "",
    radius_api_pass: "",
  });
  const [waForm, setWaForm] = useState({
    wa_customer_template: "",
    wa_admin_template: "",
    wa_payment_template: "",
    wa_admin_numbers: "",
  });

  useEffect(() => {
    if (settings.radius_api_url !== undefined) {
      setRadiusForm({
        radius_api_url: settings.radius_api_url || "",
        radius_api_user: settings.radius_api_user || "",
        radius_api_pass: settings.radius_api_pass || "",
      });
    }
    setWaForm({
      wa_customer_template: settings.wa_customer_template || "",
      wa_admin_template: settings.wa_admin_template || "",
      wa_payment_template: settings.wa_payment_template || "",
      wa_admin_numbers: settings.wa_admin_numbers || "",
    });
  }, [settings]);

  const settingsMutation = useMutation({
    mutationFn: (data: Record<string, string>) => updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Settings saved" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // ── WhatsApp sidecar status (polls every 10 s) ──
  const { data: waStatus, refetch: refetchWaStatus } = useQuery({
    queryKey: ["whatsapp-status"],
    queryFn: getWhatsAppStatus,
    refetchInterval: 10000,
    retry: false,
  });

  const { data: waQR, refetch: refetchQR } = useQuery({
    queryKey: ["whatsapp-qr"],
    queryFn: getWhatsAppQR,
    enabled: waStatus?.hasQR === true,
    refetchInterval: waStatus?.hasQR ? 20000 : false,
    retry: false,
  });

  // ── Plans ──
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: getPlans });
  const [planDialog, setPlanDialog] = useState<any>(null);
  const [planForm, setPlanForm] = useState({ name: "", price: "", radius_srvid: "", radius_acctype: "0" });

  const createPlanMutation = useMutation({
    mutationFn: (data: any) => createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setPlanDialog(null);
      toast({ title: "Plan created" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setPlanDialog(null);
      toast({ title: "Plan updated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast({ title: "Plan deactivated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openNewPlan = () => {
    setPlanForm({ name: "", price: "", radius_srvid: "", radius_acctype: "0" });
    setPlanDialog({ mode: "create" });
  };

  const openEditPlan = (plan: any) => {
    setPlanForm({
      name: plan.name,
      price: String(plan.price),
      radius_srvid: String(plan.radius_srvid || ""),
      radius_acctype: String(plan.radius_acctype || 0),
    });
    setPlanDialog({ mode: "edit", id: plan.id });
  };

  const handleSavePlan = () => {
    const payload = {
      name: planForm.name,
      price: Number(planForm.price),
      radius_srvid: planForm.radius_srvid ? Number(planForm.radius_srvid) : null,
      radius_acctype: Number(planForm.radius_acctype),
      is_active: true,
    };
    if (planDialog.mode === "create") {
      createPlanMutation.mutate(payload);
    } else {
      updatePlanMutation.mutate({ id: planDialog.id, data: payload });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="radius">
        <TabsList>
          <TabsTrigger value="radius" className="gap-2"><Wifi className="h-4 w-4" /> Radius Manager</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2"><MessageSquare className="h-4 w-4" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="plans" className="gap-2"><CreditCard className="h-4 w-4" /> Plans</TabsTrigger>
        </TabsList>

        {/* Radius Settings */}
        <TabsContent value="radius">
          <Card>
            <CardHeader>
              <CardTitle>Radius Manager Configuration</CardTitle>
              <CardDescription>DMA Radius Manager API credentials. These override .env values.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div>
                  <Label>API URL</Label>
                  <Input
                    value={radiusForm.radius_api_url}
                    onChange={(e) => setRadiusForm({ ...radiusForm, radius_api_url: e.target.value })}
                    placeholder="https://portal1.phsweb.ng/api/sysapi.php"
                  />
                </div>
                <div>
                  <Label>API Username</Label>
                  <Input
                    value={radiusForm.radius_api_user}
                    onChange={(e) => setRadiusForm({ ...radiusForm, radius_api_user: e.target.value })}
                    placeholder="api"
                  />
                </div>
                <div>
                  <Label>API Password</Label>
                  <Input
                    type="password"
                    value={radiusForm.radius_api_pass}
                    onChange={(e) => setRadiusForm({ ...radiusForm, radius_api_pass: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  onClick={() => settingsMutation.mutate(radiusForm)}
                  disabled={settingsMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {settingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Settings */}
        <TabsContent value="whatsapp">
          <div className="space-y-4">
            {/* Connection Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  WhatsApp Connection
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { refetchWaStatus(); refetchQR(); }}>
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </CardTitle>
                <CardDescription>Status of the Baileys WhatsApp sidecar (port 3002).</CardDescription>
              </CardHeader>
              <CardContent>
                {!waStatus ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking connection...
                  </div>
                ) : waStatus.status === "connected" ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle2 className="h-5 w-5" /> Connected — WhatsApp is active
                  </div>
                ) : waStatus.status === "qr_pending" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-orange-600 text-sm font-medium">
                      <AlertCircle className="h-5 w-5" /> Scan QR code to pair WhatsApp
                    </div>
                    {waQR?.qr ? (
                      <div className="border rounded-lg p-3 inline-block bg-white">
                        <img src={waQR.qr} alt="WhatsApp QR Code" className="w-48 h-48" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading QR code...
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">Open WhatsApp → Settings → Linked Devices → Link a Device, then scan above.</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                    <AlertCircle className="h-5 w-5" />
                    {waStatus.status === "logged_out" ? "Logged out — delete auth_info_baileys/ on VPS and restart sidecar" : "Disconnected — ensure phsweb-whatsapp PM2 process is running"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Templates Card */}
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Notifications</CardTitle>
                <CardDescription>Configure message templates and admin numbers. Use {'{name}'}, {'{phone}'}, {'{email}'}, {'{plan}'}, {'{address}'} as placeholders.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-w-lg">
                  <div>
                    <Label>Admin Alert WhatsApp Numbers</Label>
                    <Input
                      value={waForm.wa_admin_numbers}
                      onChange={(e) => setWaForm({ ...waForm, wa_admin_numbers: e.target.value })}
                      placeholder="+2348012345678, +2349087654321"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Comma-separated numbers that receive alerts when a new lead signs up.</p>
                  </div>
                  <div>
                    <Label>Customer Confirmation Message</Label>
                    <Textarea
                      value={waForm.wa_customer_template}
                      onChange={(e) => setWaForm({ ...waForm, wa_customer_template: e.target.value })}
                      rows={3}
                      placeholder="Hi {name}, thanks for signing up with PHSWEB Internet!..."
                    />
                  </div>
                  <div>
                    <Label>Admin Alert Message</Label>
                    <Textarea
                      value={waForm.wa_admin_template}
                      onChange={(e) => setWaForm({ ...waForm, wa_admin_template: e.target.value })}
                      rows={3}
                      placeholder="New lead: {name} ({phone}) - {plan} plan. Address: {address}"
                    />
                  </div>
                  <div>
                    <Label>Payment Link Message</Label>
                    <Textarea
                      value={waForm.wa_payment_template}
                      onChange={(e) => setWaForm({ ...waForm, wa_payment_template: e.target.value })}
                      rows={3}
                      placeholder="Hi {name}, your payment link is ready. Amount: NGN {amount}. Pay here: {payment_url}"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Use {`{name}`}, {`{amount}`}, {`{payment_url}`}, {`{reference}`}, {`{plan}`}.</p>
                  </div>
                  <Button
                    onClick={() => settingsMutation.mutate(waForm)}
                    disabled={settingsMutation.isPending}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {settingsMutation.isPending ? "Saving..." : "Save WhatsApp Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plans */}
        <TabsContent value="plans">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Service Plans</CardTitle>
                <CardDescription>Manage internet service plans mapped to Radius Manager.</CardDescription>
              </div>
              <Button onClick={openNewPlan} className="gap-2">
                <Plus className="h-4 w-4" /> Add Plan
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price (₦)</TableHead>
                    <TableHead>Radius srvid</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No plans yet</TableCell>
                    </TableRow>
                  ) : (
                    plans.map((plan: any) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium capitalize">{plan.name}</TableCell>
                        <TableCell>₦{Number(plan.price).toLocaleString()}</TableCell>
                        <TableCell>{plan.radius_srvid ?? "—"}</TableCell>
                        <TableCell>{plan.radius_acctype}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditPlan(plan)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => {
                              if (confirm(`Deactivate plan "${plan.name}"?`)) {
                                deletePlanMutation.mutate(plan.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Create/Edit Dialog */}
      <Dialog open={!!planDialog} onOpenChange={() => setPlanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{planDialog?.mode === "create" ? "New Plan" : "Edit Plan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plan Name</Label>
              <Input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g. home" />
            </div>
            <div>
              <Label>Price (₦)</Label>
              <Input type="number" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} placeholder="15000" />
            </div>
            <div>
              <Label>Radius Service ID (srvid)</Label>
              <Input type="number" value={planForm.radius_srvid} onChange={(e) => setPlanForm({ ...planForm, radius_srvid: e.target.value })} placeholder="1" />
            </div>
            <div>
              <Label>Account Type (acctype)</Label>
              <Input type="number" value={planForm.radius_acctype} onChange={(e) => setPlanForm({ ...planForm, radius_acctype: e.target.value })} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialog(null)}>Cancel</Button>
            <Button onClick={handleSavePlan} disabled={!planForm.name || !planForm.price}>
              {planDialog?.mode === "create" ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
