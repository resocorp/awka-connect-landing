import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings, getPlans, createPlan, updatePlan, deletePlan } from "@/lib/api";
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
import { Save, Plus, Pencil, Trash2, Wifi, CreditCard, MessageSquare } from "lucide-react";

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
  const [smsForm, setSmsForm] = useState({
    sms_customer_template: "",
    sms_admin_template: "",
    sms_payment_template: "",
    admin_alert_phones: "",
  });

  useEffect(() => {
    if (settings.radius_api_url !== undefined) {
      setRadiusForm({
        radius_api_url: settings.radius_api_url || "",
        radius_api_user: settings.radius_api_user || "",
        radius_api_pass: settings.radius_api_pass || "",
      });
    }
    setSmsForm({
      sms_customer_template: settings.sms_customer_template || "",
      sms_admin_template: settings.sms_admin_template || "",
      sms_payment_template: settings.sms_payment_template || "",
      admin_alert_phones: settings.admin_alert_phones || "",
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
          <TabsTrigger value="sms" className="gap-2"><MessageSquare className="h-4 w-4" /> SMS</TabsTrigger>
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

        {/* SMS Settings */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>Configure SMS templates and admin alert numbers. Use {'{name}'}, {'{phone}'}, {'{email}'}, {'{plan}'}, {'{address}'} as placeholders.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-w-lg">
                <div>
                  <Label>Admin Alert Phone Numbers</Label>
                  <Input
                    value={smsForm.admin_alert_phones}
                    onChange={(e) => setSmsForm({ ...smsForm, admin_alert_phones: e.target.value })}
                    placeholder="+2348012345678, +2349087654321"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Comma-separated phone numbers that receive alerts when a new lead signs up.</p>
                </div>
                <div>
                  <Label>Customer Confirmation SMS</Label>
                  <Textarea
                    value={smsForm.sms_customer_template}
                    onChange={(e) => setSmsForm({ ...smsForm, sms_customer_template: e.target.value })}
                    rows={3}
                    placeholder="Hi {name}, thanks for signing up with PHSWEB Internet!..."
                  />
                </div>
                <div>
                  <Label>Admin Alert SMS</Label>
                  <Textarea
                    value={smsForm.sms_admin_template}
                    onChange={(e) => setSmsForm({ ...smsForm, sms_admin_template: e.target.value })}
                    rows={3}
                    placeholder="New lead: {name} ({phone}) - {plan} plan..."
                  />
                </div>
                <div>
                  <Label>Payment Link SMS</Label>
                  <Textarea
                    value={smsForm.sms_payment_template}
                    onChange={(e) => setSmsForm({ ...smsForm, sms_payment_template: e.target.value })}
                    rows={3}
                    placeholder="Hi {name}, your payment link is ready. Amount: NGN {amount}. Pay here: {payment_url}"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Sent when admin generates/resends a payment link. Use {`{name}`}, {`{amount}`}, {`{payment_url}`}, {`{reference}`}, {`{plan}`}.</p>
                </div>
                <Button
                  onClick={() => settingsMutation.mutate(smsForm)}
                  disabled={settingsMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {settingsMutation.isPending ? "Saving..." : "Save SMS Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
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
