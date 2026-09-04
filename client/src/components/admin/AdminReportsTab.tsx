import type { ReactNode, RefObject } from "react";
import { Activity, Calendar, CalendarOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { EscalationReportsTrigger } from "@/components/EscalationReportsTrigger";

interface AdminReportsTabProps {
  isSuperAdmin: boolean;
  reportCount: number;
  isFetching: boolean;
  pageSizeControl: ReactNode;
  reportsTableTopRef: RefObject<HTMLDivElement>;
  onRefresh: () => void;
  children: ReactNode;
}

/**
 * The scheduled-report tab shell. Query state and report-specific callbacks
 * remain in AdminEnhanced while this component owns the stable tab UI.
 */
export function AdminReportsTab({
  isSuperAdmin,
  reportCount,
  isFetching,
  pageSizeControl,
  reportsTableTopRef,
  onRefresh,
  children,
}: AdminReportsTabProps) {
  return (
    <TabsContent value="reports" className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>All Scheduled Reports</CardTitle>
                <CardDescription>View and manage all scheduled reports across all users and organisations</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {pageSizeControl}
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
                {isFetching ? "Loading..." : "Refresh"}
              </Button>
              <Badge variant="secondary">
                {reportCount} report{reportCount !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reportCount === 0 ? (
            <div className="text-center py-8">
              <CalendarOff className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-lg mb-1">No Scheduled Reports</h3>
              <p className="text-sm text-muted-foreground">
                Configure scheduled reports for users via the Users tab, or for organisations via the Organisations tab.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div ref={reportsTableTopRef} className="scroll-mt-4" />
              {children}
              <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg flex items-start gap-2">
                <Activity className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p><strong>User reports:</strong> Configure via the Calendar icon in the Users tab.</p>
                  <p><strong>Organisation reports:</strong> Configure via the Calendar icon in the Organisations tab (sends to external recipients).</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {isSuperAdmin && <EscalationReportsTrigger />}
    </TabsContent>
  );
}