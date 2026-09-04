import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

interface AdminCaseTabPanelsProps {
  isSuperAdmin: boolean;
  caseManagement: ReactNode;
  caseSubmissions: ReactNode;
}

/**
 * Presentation-only wrappers for the two case-related admin tabs. State and
 * mutations deliberately remain with their owning panels/parent.
 */
export function AdminCaseTabPanels({
  isSuperAdmin,
  caseManagement,
  caseSubmissions,
}: AdminCaseTabPanelsProps) {
  return (
    <>
      <TabsContent value="cases">
        <Card>
          <CardHeader>
            <CardTitle>Case Management</CardTitle>
            <CardDescription>Archive or permanently delete cases across all organisations</CardDescription>
          </CardHeader>
          <CardContent>{caseManagement}</CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="case-submissions">
        <Card>
          <CardHeader>
            <CardTitle>Case Submissions</CardTitle>
            <CardDescription>Review and manage case submissions from users</CardDescription>
          </CardHeader>
          <CardContent>{caseSubmissions}</CardContent>
        </Card>
      </TabsContent>
    </>
  );
}