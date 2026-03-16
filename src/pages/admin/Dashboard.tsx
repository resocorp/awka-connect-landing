import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getLeadsPerDay, getRenewalsByDay, getStatusDistribution, getConversionsPerDay } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, UserCheck, UserX, Activity, TrendingUp, CalendarDays, PieChart as PieIcon } from "lucide-react";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const STAT_CARDS = [
  { key: "newLeadsToday", label: "New Leads Today", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { key: "pendingPayments", label: "Pending Payments", icon: CreditCard, color: "text-orange-600", bg: "bg-orange-50" },
  { key: "activeCustomers", label: "Active Customers", icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
  { key: "churnedCustomers", label: "Churned", icon: UserX, color: "text-red-600", bg: "bg-red-50" },
];

const ACTION_COLORS: Record<string, string> = {
  created: "bg-blue-100 text-blue-700",
  updated: "bg-yellow-100 text-yellow-700",
  activated: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
  converted_to_customer: "bg-emerald-100 text-emerald-700",
  payment_link_generated: "bg-purple-100 text-purple-700",
  payment_confirmed_radius_created: "bg-emerald-100 text-emerald-700",
};

const PIE_COLORS: Record<string, string> = {
  active: "#22c55e",
  expired: "#f97316",
  suspended: "#ef4444",
  churned: "#6b7280",
};

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
  });

  const { data: leadsPerDay } = useQuery({
    queryKey: ["analytics-leads-per-day"],
    queryFn: getLeadsPerDay,
  });

  const { data: conversionsPerDay } = useQuery({
    queryKey: ["analytics-conversions-per-day"],
    queryFn: getConversionsPerDay,
  });

  const { data: renewalsByDay } = useQuery({
    queryKey: ["analytics-renewals-by-day"],
    queryFn: getRenewalsByDay,
  });

  const { data: statusDist } = useQuery({
    queryKey: ["analytics-status-distribution"],
    queryFn: getStatusDistribution,
  });

  // Merge leads + conversions into one dataset for the combo chart
  const leadsConversionsData = (leadsPerDay || []).map((item: any, i: number) => ({
    date: item.date,
    leads: item.count,
    conversions: conversionsPerDay?.[i]?.count ?? 0,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-16 rounded bg-muted" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-destructive">
          Failed to load dashboard: {(error as Error).message}. Is the backend server running on port 3001?
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((stat) => (
          <Card key={stat.key}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg p-3 ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{data?.[stat.key] ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1: Leads + Conversions over time */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Leads &amp; Conversions (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={leadsConversionsData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => format(parseISO(v), "MMM d")}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(v) => format(parseISO(v as string), "MMM d, yyyy")}
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                />
                <Legend verticalAlign="top" height={30} />
                <Area type="monotone" dataKey="leads" stroke="#3b82f6" fill="url(#colorLeads)" strokeWidth={2} name="Leads" />
                <Area type="monotone" dataKey="conversions" stroke="#22c55e" fill="url(#colorConversions)" strokeWidth={2} name="Conversions" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieIcon className="h-4 w-4" />
              Customer Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {statusDist && statusDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    label={({ status, count }: any) => `${status} (${count})`}
                  >
                    {statusDist.map((entry: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[entry.status] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8">No customer data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Renewals by Day + Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Renewals by Day of Week */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" />
              Renewals by Day of Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={renewalsByDay || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                <Bar dataKey="count" name="Renewals" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity — compact scrollable */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[260px] overflow-y-auto px-6 pb-4">
              {data?.recentActivity?.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {data?.recentActivity?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge
                          className={`text-[10px] px-1.5 py-0 shrink-0 ${
                            ACTION_COLORS[item.action] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.action?.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {item.entity_type} #{item.entity_id?.substring(0, 8)}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
