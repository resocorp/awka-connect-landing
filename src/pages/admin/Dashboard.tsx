import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, UserCheck, UserX, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STAT_CARDS = [
  { key: "newLeadsToday", label: "New Leads Today", icon: Users, color: "text-blue-600" },
  { key: "pendingPayments", label: "Pending Payments", icon: CreditCard, color: "text-orange-600" },
  { key: "activeCustomers", label: "Active Customers", icon: UserCheck, color: "text-green-600" },
  { key: "churnedCustomers", label: "Churned", icon: UserX, color: "text-red-600" },
];

const ACTION_COLORS: Record<string, string> = {
  created: "bg-blue-100 text-blue-700",
  updated: "bg-yellow-100 text-yellow-700",
  activated: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
  payment_link_generated: "bg-purple-100 text-purple-700",
  payment_confirmed_radius_created: "bg-emerald-100 text-emerald-700",
};

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
  });

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
              <div className={`rounded-lg bg-muted p-3 ${stat.color}`}>
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentActivity?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {data?.recentActivity?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        ACTION_COLORS[item.action] || "bg-gray-100 text-gray-700"
                      }
                    >
                      {item.action}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {item.entity_type} #{item.entity_id?.substring(0, 8)}
                      </p>
                      {item.details && (
                        <p className="text-xs text-muted-foreground">
                          {JSON.stringify(item.details).substring(0, 80)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
