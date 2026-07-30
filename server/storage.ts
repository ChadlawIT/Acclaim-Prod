import {
  users,
  organisations,
  cases,
  caseSubmissions,
  caseSubmissionDocuments,
  caseActivities,
  messages,
  documents,
  payments,
  userActivityLogs,
  loginAttempts,
  passwordResetTokens,
  systemMetrics,
  auditLog,
  externalApiCredentials,
  userOrganisations,
  mutedCases,
  caseAccessRestrictions,
  scheduledReports,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type Case,
  type InsertCase,
  type CaseSubmission,
  type InsertCaseSubmission,
  type CaseActivity,
  type InsertCaseActivity,
  type Message,
  type InsertMessage,
  type Document,
  type InsertDocument,
  type Payment,
  type InsertPayment,
  type UserActivityLog,
  type InsertUserActivityLog,
  type LoginAttempt,
  type InsertLoginAttempt,
  type PasswordResetToken,
  type SystemMetric,
  type InsertSystemMetric,
  type AuditLog,
  type InsertAuditLog,
  type ExternalApiCredential,
  type InsertExternalApiCredential,
  type UserOrganisation,
  type InsertUserOrganisation,
  type ScheduledReport,
  type InsertScheduledReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, or, isNull, isNotNull, inArray, notInArray, gte, lt, not, ne } from "drizzle-orm";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import session, { SessionStore } from "express-session";
import connectPg from "connect-pg-simple";

export interface IStorage {
  sessionStore: SessionStore;

  // User operations 
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAzureId(azureId: string): Promise<User | undefined>;
  linkAzureAccount(userId: string, azureId: string): Promise<void>;
  createUser(userData: any): Promise<User>;
  getUserByExternalRef(externalRef: string): Promise<User | undefined>;
  createUserWithExternalRef(userData: any): Promise<{ user: User; tempPassword: string }>;
  updateUserPassword(id: string, passwordData: { hashedPassword?: string; tempPassword?: string | null; mustChangePassword?: boolean }): Promise<User>;
  updateUserOrganisation(id: string, organisationId: number | null): Promise<User>;
  getAdminByName(fullName: string): Promise<User | undefined>;
  getAdminUsers(): Promise<User[]>;
  getEscalatedCaseMessages(activationDate: Date, minDaysOld?: number): Promise<{
    caseId: number;
    caseName: string;
    accountNumber: string;
    caseHandler: string | null;
    messageId: number;
    messageContent: string;
    messageSubject: string | null;
    messageCreatedAt: Date;
    senderName: string;
    senderEmail: string;
    daysOverdue: number;
  }[]>;
  getInactiveCases(minDaysInactive: number, activeFrom: Date): Promise<{
    caseId: number;
    caseName: string;
    accountNumber: string;
    organisationId: number;
    assignedTo: string | null;
    outstandingAmount: string;
    status: string;
    stage: string;
    lastActivityDate: Date;
    daysInactive: number;
  }[]>;
  getLatestCaseActivitiesBatch(caseIds: number[]): Promise<Map<number, { description: string; code: string; createdAt: Date }>>;
  getLastMessagesBatch(caseIds: number[], limit?: number, adminOnly?: boolean): Promise<Map<number, Array<{ sender: string; isAdmin: boolean; subject: string | null; content: string; createdAt: Date }>>>;
  getUniqueActivityDescriptions(): Promise<string[]>;
  getCasesStuckAtActivity(descriptions: string[], minDays: number): Promise<{
    caseId: number;
    caseName: string;
    accountNumber: string;
    organisationId: number;
    assignedTo: string | null;
    outstandingAmount: string;
    status: string;
    stage: string;
    lastActivityDescription: string;
    lastActivityDate: Date;
    daysSinceActivity: number;
  }[]>;

  // Organisation operations
  getOrganisation(id: number): Promise<Organization | undefined>;
  createOrganisation(org: InsertOrganization): Promise<Organization>;
  updateOrganisation(id: number, org: Partial<InsertOrganization>): Promise<Organization>;
  deleteOrganisation(id: number): Promise<void>;
  getOrganisationByExternalRef(externalRef: string): Promise<Organization | undefined>;
  getOrganisationStats(id: number): Promise<{
    userCount: number;
    caseCount: number;
    activeCaseCount: number;
    totalOutstanding: string;
    totalRecovered: string;
  }>;

  // Case operations
  getCasesForOrganisation(organisationId: number): Promise<Case[]>;
  getCasesForUser(userId: string): Promise<Case[]>;
  getUserOrganisations(userId: string): Promise<UserOrganisation[]>;
  getAllUserOrganisations(): Promise<UserOrganisation[]>;
  addUserToOrganisation(userId: string, organisationId: number, role?: string): Promise<UserOrganisation>;
  removeUserFromOrganisation(userId: string, organisationId: number): Promise<void>;
  setUserOrgRole(userId: string, organisationId: number, role: string): Promise<UserOrganisation | null>;
  isUserOrgOwner(userId: string, organisationId: number): Promise<boolean>;
  getOrgOwnerships(userId: string): Promise<number[]>; // Returns org IDs where user is owner
  getUsersInOrganisation(organisationId: number): Promise<User[]>;
  getUsersWithOrganisations(): Promise<(User & { organisations: (Organization & { role?: string })[] })[]>; // Returns all users with their organisations and roles
  getAllCases(): Promise<Case[]>; // Admin only - get all cases across all organizations
  getRecoveryReportData(): Promise<{
    cases: Array<{ id: number; accountNumber: string; caseName: string; organisationId: number; organisationName: string | null; debtorType: string; originalAmount: string; status: string; createdAt: Date | null }>;
    payments: Array<{ caseId: number; amount: string; paymentDate: Date }>;
    openActivities: Array<{ caseId: number; description: string; activityType: string; createdAt: Date | null }>;
    earliestActivities: Array<{ caseId: number; createdAt: Date | null }>;
  }>; // Admin only - raw data for the recovery performance report
  getAllCasesIncludingArchived(): Promise<Case[]>; // Admin only - get all cases including archived ones
  getClosedCasesWithDateFilter(startDate?: Date, endDate?: Date): Promise<Case[]>; // Admin only - get closed cases with date filter
  getCase(id: number, organisationId: number): Promise<Case | undefined>;
  getCaseById(id: number): Promise<Case | undefined>; // Admin only - get case by ID without org restriction
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(id: number, caseData: Partial<InsertCase>): Promise<Case>;
  moveCaseToOrganisation(id: number, newOrganisationId: number): Promise<Case>;
  archiveCase(id: number, userId: string): Promise<Case>; // Admin only - archive case
  unarchiveCase(id: number, userId: string): Promise<Case>; // Admin only - unarchive case
  deleteCase(id: number): Promise<void>; // Admin only - permanently delete case and all related data

  // Case submission operations
  createCaseSubmission(submission: InsertCaseSubmission): Promise<CaseSubmission>;
  getCaseSubmissions(): Promise<CaseSubmission[]>; // Admin only - get all pending submissions
  getCaseSubmissionsByStatus(status: string): Promise<CaseSubmission[]>; // Admin only - get submissions by status
  getPendingSubmissionsOlderThan(days: number): Promise<Array<{
    id: number;
    caseName: string;
    debtorType: string;
    individualType: string | null;
    organisationName: string | null;
    organisationTradingName: string | null;
    tradingName: string | null;
    principalSalutation: string | null;
    principalFirstName: string | null;
    principalLastName: string | null;
    clientOrganisationName: string | null;
    submittedByName: string | null;
    totalDebtAmount: string;
    currency: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    county: string | null;
    postcode: string | null;
    mainPhone: string | null;
    mainEmail: string | null;
    debtDetails: string | null;
    firstOverdueDate: string | null;
    lastOverdueDate: string | null;
    singleInvoice: string | null;
    submittedAt: Date;
    daysPending: number;
  }>>;
  updateCaseSubmissionStatus(id: number, status: string, processedBy: string): Promise<CaseSubmission>;
  deleteCaseSubmission(id: number): Promise<void>; // Admin only - delete submission

  // Case submission document operations
  createCaseSubmissionDocument(doc: {
    caseSubmissionId: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
  }): Promise<void>;
  getCaseSubmissionDocuments(caseSubmissionId: number): Promise<Array<{
    id: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    uploadedAt: Date;
  }>>;
  deleteCaseSubmissionDocument(id: number): Promise<void>;

  // Case activity operations
  getCaseActivities(caseId: number): Promise<CaseActivity[]>;
  addCaseActivity(activity: InsertCaseActivity): Promise<CaseActivity>;
  deleteCaseActivity(id: number): Promise<void>; // Admin only - delete case activity

  // Message operations
  getMessagesForUser(userId: string): Promise<Message[]>;
  getMessagesForCase(caseId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: number): Promise<void>;
  deleteMessage(id: number): Promise<void>; // Admin only - delete message by ID

  // Document operations
  getDocumentById(id: number): Promise<Document | undefined>;
  getDocumentsForCase(caseId: number): Promise<Document[]>;
  getDocumentsForOrganisation(organisationId: number): Promise<Document[]>;
  getOrganisationOnlyDocuments(organisationId: number): Promise<Document[]>; // Get documents not linked to any case
  getDocumentsForUser(userId: string): Promise<Document[]>; // Returns all documents for user (admin gets all, regular user gets org-filtered)
  getAllDocuments(): Promise<Document[]>; // Admin only - get all documents for video tracking
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number, organisationId: number): Promise<void>;
  deleteDocumentById(id: number): Promise<void>; // Admin only - delete document by ID without org restriction

  // Payment operations
  getPaymentsForCase(caseId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: number, organisationId: number): Promise<void>;
  getPaymentByExternalRef(externalRef: string): Promise<Payment | undefined>;
  getCaseByExternalRef(externalRef: string): Promise<Case | undefined>;

  // Statistics
  getCaseStats(organisationId: number): Promise<{
    activeCases: number;
    closedCases: number;
    totalOutstanding: string;
    totalRecovery: string;
    totalOriginal: string;
    totalCosts: string;
    totalInterest: string;
    totalFees: string;
  }>;

  getGlobalCaseStats(): Promise<{
    activeCases: number;
    closedCases: number;
    totalOutstanding: string;
    totalRecovery: string;
    totalOriginal: string;
    totalCosts: string;
    totalInterest: string;
    totalFees: string;
  }>; // Admin only - get stats across all organizations

  getCombinedCaseStats(organisationIds: number[], excludeCaseIds?: number[]): Promise<{
    activeCases: number;
    closedCases: number;
    totalOutstanding: string;
    totalRecovery: string;
    totalOriginal: string;
    totalCosts: string;
    totalInterest: string;
    totalFees: string;
  }>; // Get combined stats from multiple organizations

  // Admin operations
  hasAdminUser(): Promise<boolean>; // Check if any admin user exists (for initial setup)
  getAllUsers(): Promise<User[]>;
  getAllOrganisations(): Promise<Organization[]>;
  assignUserToOrganisation(userId: string, organisationId: number): Promise<User | null>;

  // Enhanced user management operations
  createUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    organisationId?: number;
    isAdmin?: boolean;
  }): Promise<{ user: User; tempPassword: string }>;

  updateUser(userId: string, userData: {
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<User | null>;

  makeUserAdmin(userId: string): Promise<User | null>;
  removeUserAdmin(userId: string): Promise<User | null>;

  resetUserPassword(userId: string): Promise<string>; // Returns temp password

  changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>;

  setUserPassword(userId: string, newPassword: string): Promise<User | null>;

  verifyUserPassword(userId: string, password: string): Promise<boolean>;

  checkMustChangePassword(userId: string): Promise<boolean>;

  deleteUser(userId: string): Promise<void>;

  updateSuperAdminStatus(userId: string, isSuperAdmin: boolean): Promise<User | null>;

  // System monitoring operations
  logUserActivity(activity: InsertUserActivityLog): Promise<UserActivityLog>;
  getUserActivityLogs(userId?: string, limit?: number): Promise<UserActivityLog[]>;

  logLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt>;
  getLoginAttempts(limit?: number): Promise<LoginAttempt[]>;
  getFailedLoginAttempts(limit?: number): Promise<LoginAttempt[]>;
  isNewLoginLocation(email: string, ipAddress: string, userAgent: string): Promise<boolean>;

  recordSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric>;
  getSystemMetrics(metricName?: string, limit?: number): Promise<SystemMetric[]>;

  // Comprehensive audit functionality
  logAuditEvent(auditData: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: {
    tableName?: string;
    recordId?: string;
    operation?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]>;
  getAuditSummary(): Promise<{
    totalChanges: number;
    recentChanges: number;
    topUsers: { userId: string; userEmail: string; changeCount: number }[];
    topTables: { tableName: string; changeCount: number }[];
  }>;

  // Audit log retention
  deleteOldAuditLogs(retentionDays: number): Promise<number>; // Returns count of deleted logs
  getAuditLogStats(): Promise<{
    totalLogs: number;
    oldestLog: Date | null;
    newestLog: Date | null;
    logsByAge: { period: string; count: number }[];
  }>;

  // Session management
  invalidateUserSessions(userId: string): Promise<number>; // Returns count of deleted sessions
  getUserActiveSessions(userId: string): Promise<{ sid: string; lastAccess: Date; userAgent?: string; ipAddress?: string }[]>;

  getSystemAnalytics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalCases: number;
    activeCases: number;
    totalOrganizations: number;
    recentActivity: number;
    failedLogins: number;
    systemHealth: string;
  }>;

  // External API credentials operations
  createExternalApiCredential(credential: InsertExternalApiCredential): Promise<ExternalApiCredential>;
  getExternalApiCredentials(organisationId: number): Promise<ExternalApiCredential[]>;
  verifyExternalApiCredential(organisationId: number, username: string, password: string): Promise<boolean>;
  getExternalApiCredentialByUsername(username: string): Promise<ExternalApiCredential | undefined>;
  updateExternalApiCredential(id: number, updates: Partial<InsertExternalApiCredential>): Promise<ExternalApiCredential>;
  deleteExternalApiCredential(id: number): Promise<void>;

  // Advanced reporting operations
  getCrossOrganizationPerformance(): Promise<{
    organizationId: number;
    organizationName: string;
    totalCases: number;
    activeCases: number;
    closedCases: number;
    totalOutstanding: string;
    totalRecovered: string;
    recoveryRate: number;
    averageCaseAge: number;
    userCount: number;
  }[]>;

  getUserActivityReport(startDate?: Date, endDate?: Date): Promise<{
    userId: string;
    userEmail: string;
    userFirstName: string;
    userLastName: string;
    organizationName: string;
    loginCount: number;
    lastLogin: Date;
    actionCount: number;
    casesCreated: number;
    messageseSent: number;
    documentsUploaded: number;
  }[]>;

  getSystemHealthMetrics(): Promise<{
    metric: string;
    value: number;
    status: string;
    timestamp: Date;
  }[]>;

  getCustomReportData(reportConfig: {
    tables: string[];
    filters: Record<string, any>;
    groupBy?: string[];
    orderBy?: string;
    limit?: number;
  }): Promise<any[]>;

  // Password reset token operations
  createPasswordResetToken(userId: string, hashedToken: string, expiresAt: Date): Promise<PasswordResetToken>;
  getValidPasswordResetToken(userId: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(tokenId: number): Promise<void>;
  invalidatePasswordResetTokensForUser(userId: string): Promise<void>;

  // Muted cases operations
  muteCase(userId: string, caseId: number): Promise<void>;
  unmuteCase(userId: string, caseId: number): Promise<void>;
  isCaseMuted(userId: string, caseId: number): Promise<boolean>;
  getMutedCasesForUser(userId: string): Promise<number[]>;

  // Case access restriction operations (admin feature)
  addCaseAccessRestriction(caseId: number, blockedUserId: string, createdBy: string | null): Promise<boolean>; // Returns true if a new restriction row was inserted, false if it already existed
  removeCaseAccessRestriction(caseId: number, blockedUserId: string): Promise<boolean>; // Returns true if a restriction row was actually removed, false if none existed
  getCaseAccessRestrictions(caseId: number): Promise<string[]>; // Returns array of blocked user IDs
  getAllCaseRestrictionCounts(): Promise<Record<number, number>>; // Returns map of caseId -> restricted user count
  isUserBlockedFromCase(userId: string, caseId: number): Promise<boolean>;
  getBlockedCasesForUser(userId: string): Promise<number[]>;
  getAdminRestrictedCasesForUser(userId: string): Promise<number[]>; // Only admin-set restrictions, not user muting
  getLiftedRestrictionsForUser(userId: string): Promise<{ caseId: number; liftedAt: Date }[]>; // Cases reconstructed from audit log whose latest restriction event was a lift (DELETE)
}

// Detects the "SenderName:\n\nContent" prefix embedded by the external API
// and returns the message with senderName as "Acclaim (SenderName)" and clean content.
// The external/SOS API stores all Acclaim-side messages under this shared
// system account, embedding the real handler name in the content.
const ACCLAIM_SYSTEM_EMAIL = 'email@acclaim.law';
const ACCLAIM_SYSTEM_USER_ID = 'acclaim-system-user';

function resolveEmbeddedSender(m: any): any {
  // Only treat the "Name:\n\nbody" prefix as an embedded sender when the message
  // actually originates from the Acclaim system account. This avoids misreading a
  // genuine client message that happens to start with "Something:\n\n...".
  const isSystemSender =
    (m.senderEmail && m.senderEmail.toLowerCase() === ACCLAIM_SYSTEM_EMAIL) ||
    m.senderId === ACCLAIM_SYSTEM_USER_ID;

  if (!isSystemSender) {
    return m;
  }

  const match = (m.content || '').match(/^([^\n]+):\n\n([\s\S]*)$/);
  if (match) {
    // If the subject is "Client Update Received" (case-insensitive), treat as an
    // inbound client-side message so it displays on the organisation (left) side.
    // This lets admins log updates received outside the portal (phone, email, letter)
    // via the SOS API without any database schema changes.
    const isClientUpdate = (m.subject || '').toLowerCase().includes('client update received');
    if (isClientUpdate) {
      return { ...m, senderName: match[1].trim(), senderIsAdmin: false, content: match[2] };
    }
    // All other external API messages are outgoing from Acclaim.
    return { ...m, senderName: `Acclaim (${match[1].trim()})`, senderIsAdmin: true, content: match[2] };
  }
  return m;
}

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      tableName: 'sessions',
    });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserByAzureId(azureId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.azureId, azureId));
    return user;
  }

  async linkAzureAccount(userId: string, azureId: string): Promise<void> {
    await db.update(users).set({ azureId, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  async getAdminUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isAdmin, true));
  }

  async getEscalatedCaseMessages(activationDate: Date, minDaysOld = 7): Promise<{
    caseId: number;
    caseName: string;
    accountNumber: string;
    caseHandler: string | null;
    messageId: number;
    messageContent: string;
    messageSubject: string | null;
    messageCreatedAt: Date;
    senderName: string;
    senderEmail: string;
    daysOverdue: number;
  }[]> {
    const cutoffDate = new Date(Date.now() - minDaysOld * 24 * 60 * 60 * 1000);

    // Find cases where the LAST message is from a non-admin user
    // and that message is older than minDaysOld — meaning the team hasn't replied since.
    // activationDate is kept as a parameter for API compatibility but not used as a hard lower bound
    // (it was causing an impossible range when minDaysOld > days since activation).
    const rows = await db.execute(sql`
      WITH last_msg_per_case AS (
        SELECT DISTINCT ON (m.case_id)
          m.id            AS message_id,
          m.case_id,
          m.content,
          m.subject,
          m.created_at,
          u.first_name,
          u.last_name,
          u.email         AS sender_email,
          u.is_admin,
          c.case_name,
          c.account_number,
          c.assigned_to   AS case_handler
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        JOIN cases c ON c.id = m.case_id
        WHERE m.case_id IS NOT NULL
          AND LOWER(c.status) = 'active'
          AND (c.is_archived = false OR c.is_archived IS NULL)
        ORDER BY m.case_id, m.created_at DESC
      )
      SELECT * FROM last_msg_per_case
      WHERE (is_admin = false OR is_admin IS NULL)
        AND LOWER(sender_email) NOT LIKE '%@acclaim.law'
        AND LOWER(sender_email) NOT LIKE '%@chadlaw.co.uk'
        AND created_at < ${cutoffDate}
      ORDER BY created_at ASC
    `);

    const now = new Date();
    return (rows.rows as any[]).map(r => ({
      caseId:           Number(r.case_id),
      caseName:         String(r.case_name),
      accountNumber:    String(r.account_number),
      caseHandler:      r.case_handler ? String(r.case_handler) : null,
      messageId:        Number(r.message_id),
      messageContent:   String(r.content),
      messageSubject:   r.subject ? String(r.subject) : null,
      messageCreatedAt: new Date(r.created_at),
      senderName:       `${r.first_name || ''} ${r.last_name || ''}`.trim() || String(r.sender_email) || 'Unknown',
      senderEmail:      r.sender_email ? String(r.sender_email) : '',
      daysOverdue:      Math.floor((now.getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  async getAdminByName(fullName: string): Promise<User | undefined> {
    if (!fullName) return undefined;

    const allAdmins = await db.select().from(users).where(eq(users.isAdmin, true));

    const normalizedSearch = fullName.toLowerCase().trim();

    for (const admin of allAdmins) {
      const adminFullName = `${admin.firstName || ''} ${admin.lastName || ''}`.toLowerCase().trim();
      if (adminFullName === normalizedSearch) {
        return admin;
      }
    }

    return undefined;
  }

  async createUser(userData: any): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByExternalRef(externalRef: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.externalRef, externalRef));
    return user;
  }

  async createUserWithExternalRef(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    organisationId?: number;
    isAdmin?: boolean;
    externalRef: string;
  }): Promise<{ user: User; tempPassword: string }> {
    const tempPassword = nanoid(12);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        organisationId: userData.organisationId,
        hashedPassword,
        mustChangePassword: true,
        isAdmin: userData.isAdmin || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return { user, tempPassword };
  }

  async getOrganisation(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organisations).where(eq(organisations.id, id));
    return org;
  }

  async createOrganisation(org: InsertOrganization): Promise<Organization> {
    console.log('Storage.createOrganisation - Received data:', JSON.stringify(org, null, 2));
    const [newOrg] = await db.insert(organisations).values(org).returning();
    console.log('Storage.createOrganisation - Created org:', JSON.stringify(newOrg, null, 2));
    return newOrg;
  }

  async updateOrganisation(id: number, org: Partial<InsertOrganization>): Promise<Organization> {
    const [updatedOrg] = await db
      .update(organisations)
      .set({ ...org, updatedAt: new Date() })
      .where(eq(organisations.id, id))
      .returning();
    return updatedOrg;
  }

  async deleteOrganisation(id: number): Promise<void> {
    // Check active memberships via junction table (source of truth) and cases
    const [junctionUserCount, caseCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(userOrganisations).where(eq(userOrganisations.organisationId, id)),
      db.select({ count: sql<number>`count(*)` }).from(cases).where(eq(cases.organisationId, id))
    ]);

    if (Number(junctionUserCount[0].count) > 0 || Number(caseCount[0].count) > 0) {
      throw new Error("Cannot delete organisation with associated users or cases");
    }

    // Clean up all FK references before deleting (non-cascade tables)
    await Promise.all([
      // Clear stale legacy organisationId on users
      db.update(users).set({ organisationId: null }).where(eq(users.organisationId, id)),
      // Null out audit log organisation references (nullable column)
      db.update(auditLog).set({ organisationId: null }).where(eq(auditLog.organisationId, id)),
      // Delete external API credentials for this org
      db.delete(externalApiCredentials).where(eq(externalApiCredentials.organisationId, id)),
      // Delete any org-level documents (no cases exist so these are orphans)
      db.delete(documents).where(eq(documents.organisationId, id)),
      // Delete any case submissions for this org
      db.delete(caseSubmissions).where(eq(caseSubmissions.organisationId, id)),
    ]);

    await db.delete(organisations).where(eq(organisations.id, id));
  }

  async getOrganisationByExternalRef(externalRef: string): Promise<Organization | undefined> {
    // Support comma-separated external refs in the database field
    // Match if: exact match, starts with "ref,", contains ",ref,", or ends with ",ref"
    const result = await db.select().from(organisations).where(
      or(
        eq(organisations.externalRef, externalRef),
        sql`${organisations.externalRef} LIKE ${externalRef + ',%'}`,
        sql`${organisations.externalRef} LIKE ${'%,' + externalRef + ',%'}`,
        sql`${organisations.externalRef} LIKE ${'%,' + externalRef}`
      )
    );
    return result[0];
  }

  async getOrganisationStats(id: number): Promise<{
    userCount: number;
    caseCount: number;
    activeCaseCount: number;
    totalOutstanding: string;
    totalRecovered: string;
  }> {
    const [userCount, caseCount, activeCaseCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(userOrganisations).where(eq(userOrganisations.organisationId, id)),
      db.select({ count: sql<number>`count(*)` }).from(cases).where(and(eq(cases.organisationId, id), eq(cases.isArchived, false))),
      db.select({ count: sql<number>`count(*)` }).from(cases).where(and(eq(cases.organisationId, id), eq(cases.isArchived, false), or(eq(cases.status, "new"), eq(cases.status, "in_progress"))))
    ]);

    // Calculate financial stats - exclude archived cases
    const orgCases = await db.select().from(cases).where(and(eq(cases.organisationId, id), eq(cases.isArchived, false)));
    let totalOutstanding = 0;
    let totalRecovered = 0;

    for (const case_ of orgCases) {
      const casePayments = await db.select().from(payments).where(eq(payments.caseId, case_.id));
      const totalPayments = casePayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

      totalRecovered += totalPayments;
      totalOutstanding += parseFloat(case_.outstandingAmount || "0");
    }

    return {
      userCount: userCount[0].count,
      caseCount: caseCount[0].count,
      activeCaseCount: activeCaseCount[0].count,
      totalOutstanding: totalOutstanding.toFixed(2),
      totalRecovered: totalRecovered.toFixed(2),
    };
  }

  async getCasesForUser(userId: string): Promise<Case[]> {
    // Get the user to check their organization and admin status
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      return [];
    }

    const userRecord = user[0];

    // If user is admin, return all cases (no organisation filtering)
    if (userRecord.isAdmin) {
      return await this.getAllCases();
    }

    // For non-admin users, get all their organisation cases
    const userOrgs = await this.getUserOrganisations(userId);
    if (userOrgs.length === 0 && !userRecord.organisationId) {
      return [];
    }

    // Collect all organisation IDs (including legacy organisationId)
    const orgIds = new Set<number>();
    if (userRecord.organisationId) {
      orgIds.add(userRecord.organisationId);
    }
    userOrgs.forEach(uo => orgIds.add(uo.organisationId));

    // Get cases from all user's organisations
    const allCases: Case[] = [];
    for (const orgId of orgIds) {
      const orgCases = await this.getCasesForOrganisation(orgId);
      allCases.push(...orgCases);
    }

    return allCases;
  }

  async getUserOrganisations(userId: string): Promise<UserOrganisation[]> {
    return await db.select().from(userOrganisations).where(eq(userOrganisations.userId, userId));
  }

  async getAllUserOrganisations(): Promise<UserOrganisation[]> {
    return await db.select().from(userOrganisations);
  }

  async addUserToOrganisation(userId: string, organisationId: number, role: string = 'member'): Promise<UserOrganisation> {
    const [userOrg] = await db.insert(userOrganisations).values({
      userId,
      organisationId,
      role,
    }).returning();
    return userOrg;
  }

  async removeUserFromOrganisation(userId: string, organisationId: number): Promise<void> {
    await db.delete(userOrganisations).where(
      and(
        eq(userOrganisations.userId, userId),
        eq(userOrganisations.organisationId, organisationId)
      )
    );
  }

 async setUserOrgRole(userId: string, organisationId: number, role: string): Promise<UserOrganisation | null> {
  const [updated] = await db
    .update(userOrganisations)
    .set({ role })
    .where(and(
      eq(userOrganisations.userId, userId),
      eq(userOrganisations.organisationId, organisationId)
    ))
    .returning();
  if (updated) return updated;

  const [inserted] = await db
    .insert(userOrganisations)
    .values({ userId, organisationId, role })
    .returning();
  return inserted || null;
}

  async isUserOrgOwner(userId: string, organisationId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(userOrganisations)
      .where(and(
        eq(userOrganisations.userId, userId),
        eq(userOrganisations.organisationId, organisationId),
        eq(userOrganisations.role, 'owner')
      ))
      .limit(1);
    return !!result;
  }

  async getOrgOwnerships(userId: string): Promise<number[]> {
    const results = await db
      .select({ organisationId: userOrganisations.organisationId })
      .from(userOrganisations)
      .where(and(
        eq(userOrganisations.userId, userId),
        eq(userOrganisations.role, 'owner')
      ));
    return results.map(r => r.organisationId);
  }

  async getUsersInOrganisation(organisationId: number): Promise<User[]> {
    // Get users from junction table
    const junctionUsers = await db
      .select({ user: users })
      .from(userOrganisations)
      .leftJoin(users, eq(userOrganisations.userId, users.id))
      .where(eq(userOrganisations.organisationId, organisationId));

    // Get users from legacy organisationId field
    const legacyUsers = await db
      .select()
      .from(users)
      .where(eq(users.organisationId, organisationId));

    // Combine and deduplicate
    const userMap = new Map<string, User>();
    junctionUsers.forEach(ju => {
      if (ju.user) userMap.set(ju.user.id, ju.user);
    });
    legacyUsers.forEach(u => userMap.set(u.id, u));

    return Array.from(userMap.values());
  }

  async getUsersWithOrganisations(): Promise<(User & { organisations: (Organization & { role?: string })[] })[]> {
    const allUsers = await db.select().from(users).where(isNotNull(users.email)).orderBy(users.lastName, users.firstName);

    const usersWithOrgs = await Promise.all(
      allUsers.map(async (user) => {
        // Get user's assigned organisations from junction table with roles
        const userOrgs = await db
          .select({ 
            organisation: organisations,
            role: userOrganisations.role
          })
          .from(userOrganisations)
          .leftJoin(organisations, eq(userOrganisations.organisationId, organisations.id))
          .where(eq(userOrganisations.userId, user.id));

        // Also get legacy organisation if exists
        const legacyOrg = user.organisationId ? 
          await db.select().from(organisations).where(eq(organisations.id, user.organisationId)).limit(1) : [];

        // Combine organisations (avoid duplicates), include role from junction table
        const orgMap = new Map<number, Organization & { role?: string }>();

        // Add legacy organisation (no role)
        if (legacyOrg.length > 0) {
          orgMap.set(legacyOrg[0].id, { ...legacyOrg[0], role: undefined });
        }

        // Add junction table organisations with roles
        userOrgs.forEach(uo => {
          if (uo.organisation) {
            orgMap.set(uo.organisation.id, { ...uo.organisation, role: uo.role });
          }
        });

        return {
          ...user,
          organisations: Array.from(orgMap.values())
        };
      })
    );

    return usersWithOrgs;
  }

  async getCasesForOrganisation(organisationId: number): Promise<Case[]> {
    // Get all non-archived cases for the organisation with organisation name
    const allCases = await db
      .select({
        ...cases,
        organisationName: organisations.name,
      })
      .from(cases)
      .leftJoin(organisations, eq(cases.organisationId, organisations.id))
      .where(and(eq(cases.organisationId, organisationId), eq(cases.isArchived, false)));

    // For each case, get payments and last activity time
    const casesWithCalculatedBalance = await Promise.all(
      allCases.map(async (case_) => {
        // Get total payments for this case
        const casePayments = await db
          .select()
          .from(payments)
          .where(eq(payments.caseId, case_.id));

        const totalPayments = casePayments.reduce((sum, payment) => 
          sum + parseFloat(payment.amount), 0);

        // Get the most recent message for this case
        const latestMessage = await db
          .select()
          .from(messages)
          .where(eq(messages.caseId, case_.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        // Get the most recent activity for this case
        const latestActivity = await db
          .select()
          .from(caseActivities)
          .where(eq(caseActivities.caseId, case_.id))
          .orderBy(desc(caseActivities.createdAt))
          .limit(1);

        // Determine the most recent update time
        const caseUpdateTime = case_.updatedAt ? new Date(case_.updatedAt).getTime() : 0;
        const messageUpdateTime = latestMessage.length > 0 ? new Date(latestMessage[0].createdAt).getTime() : 0;
        const activityUpdateTime = latestActivity.length > 0 ? new Date(latestActivity[0].createdAt).getTime() : 0;

        const lastActivityTime = Math.max(caseUpdateTime, messageUpdateTime, activityUpdateTime);

        return {
          ...case_,
          outstandingAmount: case_.outstandingAmount,
          totalPayments: totalPayments.toFixed(2),
          lastActivityTime: new Date(lastActivityTime).toISOString(),
          payments: casePayments
        };
      })
    );

    // Sort by last activity time (most recent first)
    return casesWithCalculatedBalance.sort((a, b) => 
      new Date(b.lastActivityTime).getTime() - new Date(a.lastActivityTime).getTime()
    );
  }

  async getAllCases(): Promise<Case[]> {
    // Admin only - get all non-archived cases across all organizations
    const allCases = await db
      .select({
        ...cases,
        organisationName: organisations.name,
      })
      .from(cases)
      .leftJoin(organisations, eq(cases.organisationId, organisations.id))
      .where(eq(cases.isArchived, false));

    // For each case, calculate the accurate outstanding amount and last activity time
    const casesWithCalculatedBalance = await Promise.all(
      allCases.map(async (case_) => {
        // Get total payments for this case
        const casePayments = await db
          .select()
          .from(payments)
          .where(eq(payments.caseId, case_.id));

        const totalPayments = casePayments.reduce((sum, payment) => 
          sum + parseFloat(payment.amount), 0);

        // Get the most recent message for this case
        const latestMessage = await db
          .select()
          .from(messages)
          .where(eq(messages.caseId, case_.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        // Get the most recent activity for this case
        const latestActivity = await db
          .select()
          .from(caseActivities)
          .where(eq(caseActivities.caseId, case_.id))
          .orderBy(desc(caseActivities.createdAt))
          .limit(1);

        // Determine the most recent update time
        const caseUpdateTime = case_.updatedAt ? new Date(case_.updatedAt).getTime() : 0;
        const messageUpdateTime = latestMessage.length > 0 ? new Date(latestMessage[0].createdAt).getTime() : 0;
        const activityUpdateTime = latestActivity.length > 0 ? new Date(latestActivity[0].createdAt).getTime() : 0;

        const lastActivityTime = Math.max(caseUpdateTime, messageUpdateTime, activityUpdateTime);

        return {
          ...case_,
          outstandingAmount: case_.outstandingAmount,
          totalPayments: totalPayments.toFixed(2),
          lastActivityTime: new Date(lastActivityTime).toISOString(),
          payments: casePayments
        };
      })
    );

    // Sort by last activity time (most recent first)
    return casesWithCalculatedBalance.sort((a, b) => 
      new Date(b.lastActivityTime).getTime() - new Date(a.lastActivityTime).getTime()
    );
  }

  async getRecoveryReportData(): Promise<{
    cases: Array<{ id: number; accountNumber: string; caseName: string; organisationId: number; organisationName: string | null; debtorType: string; originalAmount: string; status: string; createdAt: Date | null }>;
    payments: Array<{ caseId: number; amount: string; paymentDate: Date }>;
    openActivities: Array<{ caseId: number; description: string; activityType: string; createdAt: Date | null }>;
    earliestActivities: Array<{ caseId: number; createdAt: Date | null }>;
  }> {
    // Admin only - lean bulk fetch for the recovery performance report (non-archived cases)
    const caseRows = await db
      .select({
        id: cases.id,
        accountNumber: cases.accountNumber,
        caseName: cases.caseName,
        organisationId: cases.organisationId,
        organisationName: organisations.name,
        debtorType: cases.debtorType,
        originalAmount: cases.originalAmount,
        status: cases.status,
        createdAt: cases.createdAt,
      })
      .from(cases)
      .leftJoin(organisations, eq(cases.organisationId, organisations.id))
      .where(eq(cases.isArchived, false));

    const caseIds = caseRows.map((c) => c.id);
    if (caseIds.length === 0) {
      return { cases: caseRows, payments: [], openActivities: [], earliestActivities: [] };
    }

    const paymentRows = await db
      .select({ caseId: payments.caseId, amount: payments.amount, paymentDate: payments.paymentDate })
      .from(payments)
      .where(inArray(payments.caseId, caseIds));

    // The "case opened" timeline entry is identified by the SOS code TL0001. The code can
    // live in either the description or the activity_type, so pre-filter cheaply on both
    // with ILIKE; the caller applies a strict boundary check.
    const activityRows = await db
      .select({ caseId: caseActivities.caseId, description: caseActivities.description, activityType: caseActivities.activityType, createdAt: caseActivities.createdAt })
      .from(caseActivities)
      .where(and(
        inArray(caseActivities.caseId, caseIds),
        sql`(${caseActivities.description} ILIKE '%TL0001%' OR ${caseActivities.activityType} ILIKE '%TL0001%')`,
      ));

    // Earliest timeline activity per case. Timeline entries are pushed only by SOS (never
    // by portal actions), so the earliest one is a reliable proxy for the case-opened date
    // when no explicit TL0001 entry is present (e.g. older "Case created" entries).
    const earliestRows = await db
      .select({ caseId: caseActivities.caseId, createdAt: sql<Date | null>`min(${caseActivities.createdAt})` })
      .from(caseActivities)
      .where(inArray(caseActivities.caseId, caseIds))
      .groupBy(caseActivities.caseId);

    return { cases: caseRows, payments: paymentRows, openActivities: activityRows, earliestActivities: earliestRows };
  }

  async getAllCasesIncludingArchived(): Promise<Case[]> {
    // Admin only - get all cases including archived ones across all organizations
    const allCases = await db
      .select({
        ...cases,
        organisationName: organisations.name,
      })
      .from(cases)
      .leftJoin(organisations, eq(cases.organisationId, organisations.id));

    // For each case, calculate the accurate outstanding amount and last activity time
    const casesWithCalculatedBalance = await Promise.all(
      allCases.map(async (case_) => {
        // Get total payments for this case
        const casePayments = await db
          .select()
          .from(payments)
          .where(eq(payments.caseId, case_.id));

        const totalPayments = casePayments.reduce((sum, payment) => 
          sum + parseFloat(payment.amount), 0);

        // Get the most recent message for this case
        const latestMessage = await db
          .select()
          .from(messages)
          .where(eq(messages.caseId, case_.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        // Get the most recent activity for this case
        const latestActivity = await db
          .select()
          .from(caseActivities)
          .where(eq(caseActivities.caseId, case_.id))
          .orderBy(desc(caseActivities.createdAt))
          .limit(1);

        // Determine the most recent update time
        const caseUpdateTime = case_.updatedAt ? new Date(case_.updatedAt).getTime() : 0;
        const messageUpdateTime = latestMessage.length > 0 ? new Date(latestMessage[0].createdAt).getTime() : 0;
        const activityUpdateTime = latestActivity.length > 0 ? new Date(latestActivity[0].createdAt).getTime() : 0;

        const lastActivityTime = Math.max(caseUpdateTime, messageUpdateTime, activityUpdateTime);

        return {
          ...case_,
          outstandingAmount: case_.outstandingAmount,
          totalPayments: totalPayments.toFixed(2),
          lastActivityTime: new Date(lastActivityTime).toISOString(),
          payments: casePayments
        };
      })
    );

    // Sort by last activity time (most recent first)
    return casesWithCalculatedBalance.sort((a, b) => 
      new Date(b.lastActivityTime).getTime() - new Date(a.lastActivityTime).getTime()
    );
  }

  async getClosedCasesWithDateFilter(startDate?: Date, endDate?: Date): Promise<Case[]> {
    // Admin only - get closed cases with optional date filter on updatedAt
    // Use 'Closed' with capital C to match database convention
    let conditions = [eq(cases.status, 'Closed')];

    if (startDate) {
      conditions.push(gte(cases.updatedAt, startDate));
    }
    if (endDate) {
      // Add one day to include the entire end date
      const endOfDay = new Date(endDate);
      endOfDay.setDate(endOfDay.getDate() + 1);
      conditions.push(lt(cases.updatedAt, endOfDay));
    }

    const closedCases = await db
      .select({
        ...cases,
        organisationName: organisations.name,
      })
      .from(cases)
      .leftJoin(organisations, eq(cases.organisationId, organisations.id))
      .where(and(...conditions))
      .orderBy(desc(cases.updatedAt));

    // For each case, get the last activity time
    const casesWithLastActivity = await Promise.all(
      closedCases.map(async (case_) => {
        // Get the most recent message for this case
        const latestMessage = await db
          .select()
          .from(messages)
          .where(eq(messages.caseId, case_.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        // Get the most recent activity for this case
        const latestActivity = await db
          .select()
          .from(caseActivities)
          .where(eq(caseActivities.caseId, case_.id))
          .orderBy(desc(caseActivities.createdAt))
          .limit(1);

        // Determine the most recent update time
        const caseUpdateTime = case_.updatedAt ? new Date(case_.updatedAt).getTime() : 0;
        const messageUpdateTime = latestMessage.length > 0 ? new Date(latestMessage[0].createdAt).getTime() : 0;
        const activityUpdateTime = latestActivity.length > 0 ? new Date(latestActivity[0].createdAt).getTime() : 0;

        const lastActivityTime = Math.max(caseUpdateTime, messageUpdateTime, activityUpdateTime);

        return {
          ...case_,
          lastActivityTime: new Date(lastActivityTime).toISOString(),
        };
      })
    );

    // Sort by last activity time (most recent first)
    return casesWithLastActivity.sort((a, b) => 
      new Date(b.lastActivityTime).getTime() - new Date(a.lastActivityTime).getTime()
    );
  }

  async getCase(id: number, organisationId: number): Promise<Case | undefined> {
    const [case_] = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, id), eq(cases.organisationId, organisationId)));
    return case_;
  }

  async getCaseById(id: number): Promise<Case | undefined> {
    // Admin only - get case by ID without org restriction
    const [case_] = await db
      .select()
      .from(cases)
      .where(eq(cases.id, id));
    return case_;
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    const [newCase] = await db.insert(cases).values(caseData).returning();
    return newCase;
  }

  async updateCase(id: number, caseData: Partial<InsertCase>): Promise<Case> {
    const [updatedCase] = await db
      .update(cases)
      .set({ ...caseData, updatedAt: new Date() })
      .where(eq(cases.id, id))
      .returning();
    return updatedCase;
  }

  async moveCaseToOrganisation(id: number, newOrganisationId: number): Promise<Case> {
    // Run as a single transaction so the case and its org-scoped child records
    // (documents, payments) always move together — never a partial state.
    return await db.transaction(async (tx) => {
      const [updatedCase] = await tx
        .update(cases)
        .set({ organisationId: newOrganisationId, updatedAt: new Date() })
        .where(eq(cases.id, id))
        .returning();

      // Keep org-scoped child records in sync so they follow the case to the new
      // organisation and don't remain visible in the old organisation's listings.
      await tx
        .update(documents)
        .set({ organisationId: newOrganisationId })
        .where(eq(documents.caseId, id));
      await tx
        .update(payments)
        .set({ organisationId: newOrganisationId })
        .where(eq(payments.caseId, id));

      return updatedCase;
    });
  }

  async archiveCase(id: number, userId: string): Promise<Case> {
    const [archivedCase] = await db
      .update(cases)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(cases.id, id))
      .returning();

    // Timeline activities are only created by SOS pushes, not portal actions
    // Case archiving does not create timeline entry

    return archivedCase;
  }

  async unarchiveCase(id: number, userId: string): Promise<Case> {
    const [unarchivedCase] = await db
      .update(cases)
      .set({
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(cases.id, id))
      .returning();

    // Timeline activities are only created by SOS pushes, not portal actions
    // Case unarchiving does not create timeline entry

    return unarchivedCase;
  }

  async deleteCase(id: number): Promise<void> {
    // Delete in order to respect foreign key constraints
    // 1. Delete case activities
    await db.delete(caseActivities).where(eq(caseActivities.caseId, id));

    // 2. Delete case messages
    await db.delete(messages).where(eq(messages.caseId, id));

    // 3. Delete case documents
    await db.delete(documents).where(eq(documents.caseId, id));

    // 4. Delete case payments
    await db.delete(payments).where(eq(payments.caseId, id));

    // 5. Finally delete the case
    await db.delete(cases).where(eq(cases.id, id));
  }

  // Case submission operations
  async createCaseSubmission(submission: InsertCaseSubmission): Promise<CaseSubmission> {
    const [newSubmission] = await db.insert(caseSubmissions).values(submission).returning();
    return newSubmission;
  }

  async getCaseSubmissions(): Promise<CaseSubmission[]> {
    // Admin only - get all submissions with user and organisation details
    const submissions = await db
      .select({
        ...caseSubmissions,
        submittedByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('submittedByName'),
        clientOrganisationName: organisations.name,
      })
      .from(caseSubmissions)
      .leftJoin(users, eq(caseSubmissions.submittedBy, users.id))
      .leftJoin(organisations, eq(caseSubmissions.organisationId, organisations.id))
      .orderBy(desc(caseSubmissions.submittedAt));

    return submissions;
  }

  async getCaseSubmissionsByStatus(status: string): Promise<CaseSubmission[]> {
    // Admin only - get submissions by status with user and organisation details
    const submissions = await db
      .select({
        ...caseSubmissions,
        submittedByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('submittedByName'),
        clientOrganisationName: organisations.name,
      })
      .from(caseSubmissions)
      .leftJoin(users, eq(caseSubmissions.submittedBy, users.id))
      .leftJoin(organisations, eq(caseSubmissions.organisationId, organisations.id))
      .where(eq(caseSubmissions.status, status))
      .orderBy(desc(caseSubmissions.submittedAt));

    return submissions;
  }

  async getPendingSubmissionsOlderThan(days: number) {
    const rows = await db
      .select({
        id: caseSubmissions.id,
        caseName: caseSubmissions.caseName,
        debtorType: caseSubmissions.debtorType,
        individualType: caseSubmissions.individualType,
        organisationName: caseSubmissions.organisationName,
        organisationTradingName: caseSubmissions.organisationTradingName,
        tradingName: caseSubmissions.tradingName,
        principalSalutation: caseSubmissions.principalSalutation,
        principalFirstName: caseSubmissions.principalFirstName,
        principalLastName: caseSubmissions.principalLastName,
        clientOrganisationName: organisations.name,
        submittedByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`.as('submittedByName'),
        totalDebtAmount: caseSubmissions.totalDebtAmount,
        currency: caseSubmissions.currency,
        addressLine1: caseSubmissions.addressLine1,
        addressLine2: caseSubmissions.addressLine2,
        city: caseSubmissions.city,
        county: caseSubmissions.county,
        postcode: caseSubmissions.postcode,
        mainPhone: caseSubmissions.mainPhone,
        mainEmail: caseSubmissions.mainEmail,
        debtDetails: caseSubmissions.debtDetails,
        firstOverdueDate: caseSubmissions.firstOverdueDate,
        lastOverdueDate: caseSubmissions.lastOverdueDate,
        singleInvoice: caseSubmissions.singleInvoice,
        submittedAt: caseSubmissions.submittedAt,
        daysPending: sql<number>`EXTRACT(EPOCH FROM (NOW() - ${caseSubmissions.submittedAt})) / 86400`.as('daysPending'),
      })
      .from(caseSubmissions)
      .leftJoin(users, eq(caseSubmissions.submittedBy, users.id))
      .leftJoin(organisations, eq(caseSubmissions.organisationId, organisations.id))
      .where(
        and(
          eq(caseSubmissions.status, 'pending'),
          lt(caseSubmissions.submittedAt, sql`NOW() - (${days} || ' days')::INTERVAL`)
        )
      )
      .orderBy(desc(sql`EXTRACT(EPOCH FROM (NOW() - ${caseSubmissions.submittedAt}))`));

    return rows.map(r => ({ ...r, daysPending: Math.floor(Number(r.daysPending)) }));
  }

  async updateCaseSubmissionStatus(id: number, status: string, processedBy: string): Promise<CaseSubmission> {
    const [updatedSubmission] = await db
      .update(caseSubmissions)
      .set({ 
        status, 
        processedBy, 
        processedAt: new Date() 
      })
      .where(eq(caseSubmissions.id, id))
      .returning();

    return updatedSubmission;
  }

  async deleteCaseSubmission(id: number): Promise<void> {
    // Admin only - delete submission
    await db.delete(caseSubmissions).where(eq(caseSubmissions.id, id));
  }

  async getCaseActivities(caseId: number): Promise<CaseActivity[]> {
    return await db
      .select()
      .from(caseActivities)
      .where(eq(caseActivities.caseId, caseId))
      .orderBy(desc(caseActivities.createdAt));
  }

  async addCaseActivity(activity: InsertCaseActivity): Promise<CaseActivity> {
    const [newActivity] = await db.insert(caseActivities).values(activity).returning();
    return newActivity;
  }

  async deleteCaseActivity(id: number): Promise<void> {
    await db.delete(caseActivities).where(eq(caseActivities.id, id));
  }

  async getMessagesForUser(userId: string): Promise<any[]> {
    // Get the user to check their organization and admin status
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      return [];
    }

    const userRecord = user[0];

    // Get all organisation IDs the user has access to (both legacy and junction table)
    const userOrgs = await this.getUserOrganisations(userId);
    const allUserOrgIds = new Set<number>();

    // Add legacy organisation if exists
    if (userRecord.organisationId) {
      allUserOrgIds.add(userRecord.organisationId);
    }

    // Add junction table organisations
    userOrgs.forEach(uo => allUserOrgIds.add(uo.organisationId));

    // If user is admin, return all messages (no organisation filtering)
    if (userRecord.isAdmin) {
      // We need a subquery to get the case's organisation name
      const result = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          recipientType: messages.recipientType,
          recipientId: messages.recipientId,
          caseId: messages.caseId,
          subject: messages.subject,
          content: messages.content,
          isRead: messages.isRead,
          attachmentFileName: messages.attachmentFileName,
          attachmentFilePath: messages.attachmentFilePath,
          attachmentFileSize: messages.attachmentFileSize,
          attachmentFileType: messages.attachmentFileType,
          createdAt: messages.createdAt,
          senderName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
          senderEmail: users.email,
          senderIsAdmin: users.isAdmin,
          senderOrganisationName: organisations.name,
          caseName: cases.caseName,
          accountNumber: cases.accountNumber,
          caseOrganisationId: cases.organisationId,
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .leftJoin(organisations, eq(users.organisationId, organisations.id))
        .leftJoin(cases, eq(messages.caseId, cases.id))
        .where(
          or(
            isNull(messages.caseId), // General messages not tied to a case
            eq(cases.isArchived, false) // Messages for non-archived cases only
          )
        )
        .orderBy(desc(messages.createdAt));

      // Get organisation names for each case
      const caseOrgIds = [...new Set(result.filter(m => m.caseOrganisationId).map(m => m.caseOrganisationId))];
      const orgNameMap: Record<number, string> = {};
      for (const orgId of caseOrgIds) {
        if (orgId) {
          const org = await this.getOrganisation(orgId);
          if (org) orgNameMap[orgId] = org.name;
        }
      }

      return result.map(m => resolveEmbeddedSender({
        ...m,
        organisationName: m.caseOrganisationId ? orgNameMap[m.caseOrganisationId] : undefined,
      }));
    }

    // For non-admin users, filter by all assigned organisations
    if (allUserOrgIds.size === 0) {
      return []; // User has no organisation assignments
    }

    const orgIdArray = Array.from(allUserOrgIds);

    // Get user's admin-restricted case IDs to exclude them
    // Note: User-muted cases still appear (muting is for notifications only)
    const restrictedCaseIds = await this.getAdminRestrictedCasesForUser(userId);

    const result = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        recipientType: messages.recipientType,
        recipientId: messages.recipientId,
        caseId: messages.caseId,
        subject: messages.subject,
        content: messages.content,
        isRead: messages.isRead,
        attachmentFileName: messages.attachmentFileName,
        attachmentFilePath: messages.attachmentFilePath,
        attachmentFileSize: messages.attachmentFileSize,
        attachmentFileType: messages.attachmentFileType,
        createdAt: messages.createdAt,
        senderName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
        senderEmail: users.email,
        senderIsAdmin: users.isAdmin,
        senderOrganisationName: organisations.name,
        caseName: cases.caseName,
        accountNumber: cases.accountNumber,
        caseOrganisationId: cases.organisationId,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .leftJoin(organisations, eq(users.organisationId, organisations.id))
      .leftJoin(cases, eq(messages.caseId, cases.id))
      .where(and(
        or(
          // General messages NOT tied to a case: visible via sender/recipient rules.
          and(
            isNull(messages.caseId),
            or(
              eq(messages.senderId, userId), // Sent by this user
              eq(messages.recipientId, userId), // Sent directly to this user
              and(
                eq(messages.recipientType, 'organization'),
                inArray(messages.recipientId, orgIdArray.map(id => id.toString()))
              ) // Sent to any of user's organisations
            )
          ),
          // Case-linked messages: ALWAYS gated by the case's CURRENT organisation.
          // This ensures that if a case is moved to another organisation, its
          // historical messages are no longer visible to the old organisation's
          // users (regardless of the recipient stored at send time).
          and(
            isNotNull(messages.caseId),
            inArray(cases.organisationId, orgIdArray)
          )
        ),
        or(
          isNull(messages.caseId), // General messages not tied to a case
          eq(cases.isArchived, false) // Messages for non-archived cases only
        )
      ))
      .orderBy(desc(messages.createdAt));

    // Get organisation names for each case
    const caseOrgIds = [...new Set(result.filter(m => m.caseOrganisationId).map(m => m.caseOrganisationId))];
    const orgNameMap: Record<number, string> = {};
    for (const orgId of caseOrgIds) {
      if (orgId) {
        const org = await this.getOrganisation(orgId);
        if (org) orgNameMap[orgId] = org.name;
      }
    }

    const messagesWithOrgNames = result.map(m => ({
      ...m,
      organisationName: m.caseOrganisationId ? orgNameMap[m.caseOrganisationId] : undefined,
    }));

    // Filter out messages from restricted cases
    if (restrictedCaseIds.length > 0) {
      return messagesWithOrgNames.filter(m => !m.caseId || !restrictedCaseIds.includes(m.caseId)).map(resolveEmbeddedSender);
    }

    return messagesWithOrgNames.map(resolveEmbeddedSender);
  }

  async getMessagesForCase(caseId: number): Promise<any[]> {
    const rows = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        recipientType: messages.recipientType,
        recipientId: messages.recipientId,
        caseId: messages.caseId,
        subject: messages.subject,
        content: messages.content,
        isRead: messages.isRead,
        attachmentFileName: messages.attachmentFileName,
        attachmentFilePath: messages.attachmentFilePath,
        attachmentFileSize: messages.attachmentFileSize,
        attachmentFileType: messages.attachmentFileType,
        createdAt: messages.createdAt,
        senderName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
        senderEmail: users.email,
        senderIsAdmin: users.isAdmin,
        senderOrganisationName: organisations.name,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .leftJoin(organisations, eq(users.organisationId, organisations.id))
      .where(eq(messages.caseId, caseId))
      .orderBy(desc(messages.createdAt));
    return rows.map(resolveEmbeddedSender);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  async deleteMessage(id: number): Promise<void> {
    // Admin only - delete message by ID
    await db.delete(messages).where(eq(messages.id, id));
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    return message;
  }

  async getDocumentById(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    return document;
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async getDocumentsForCase(caseId: number): Promise<any[]> {
    // Only return documents for non-archived cases, with uploader name
    const results = await db
      .select({
        id: documents.id,
        caseId: documents.caseId,
        fileName: documents.fileName,
        fileSize: documents.fileSize,
        fileType: documents.fileType,
        filePath: documents.filePath,
        uploadedBy: documents.uploadedBy,
        organisationId: documents.organisationId,
        createdAt: documents.createdAt,
        uploaderFirstName: users.firstName,
        uploaderLastName: users.lastName,
      })
      .from(documents)
      .leftJoin(cases, eq(documents.caseId, cases.id))
      .leftJoin(users, eq(documents.uploadedBy, users.id))
      .where(and(
        eq(documents.caseId, caseId),
        eq(cases.isArchived, false)
      ))
      .orderBy(desc(documents.createdAt));

    return results;
  }

  async getDocumentsForUser(userId: string): Promise<Document[]> {
    // Get the user to check their organization and admin status
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      return [];
    }

    const userRecord = user[0];

    // If user is admin, return all documents (no organisation filtering)
    if (userRecord.isAdmin) {
      const results = await db
        .select({
          id: documents.id,
          caseId: documents.caseId,
          fileName: documents.fileName,
          fileSize: documents.fileSize,
          fileType: documents.fileType,
          filePath: documents.filePath,
          uploadedBy: documents.uploadedBy,
          organisationId: documents.organisationId,
          createdAt: documents.createdAt,
          uploaderFirstName: users.firstName,
          uploaderLastName: users.lastName,
        })
        .from(documents)
        .leftJoin(cases, eq(documents.caseId, cases.id))
        .leftJoin(users, eq(documents.uploadedBy, users.id))
        .where(
          or(
            isNull(documents.caseId), // General documents not tied to a case
            eq(cases.isArchived, false) // Documents for non-archived cases only
          )
        )
        .orderBy(desc(documents.createdAt));

      return results;
    }

    // Get all organisation IDs the user has access to (both legacy and junction table)
    const userOrgs = await this.getUserOrganisations(userId);
    const allUserOrgIds = new Set<number>();

    // Add legacy organisation if exists
    if (userRecord.organisationId) {
      allUserOrgIds.add(userRecord.organisationId);
    }

    // Add junction table organisations
    userOrgs.forEach(uo => allUserOrgIds.add(uo.organisationId));

    // For non-admin users, filter by all assigned organisations
    if (allUserOrgIds.size === 0) {
      return []; // User has no organisation assignments
    }

    const orgIdArray = Array.from(allUserOrgIds);

    const results = await db
      .select({
        id: documents.id,
        caseId: documents.caseId,
        fileName: documents.fileName,
        fileSize: documents.fileSize,
        fileType: documents.fileType,
        filePath: documents.filePath,
        uploadedBy: documents.uploadedBy,
        organisationId: documents.organisationId,
        createdAt: documents.createdAt,
        uploaderFirstName: users.firstName,
        uploaderLastName: users.lastName,
      })
      .from(documents)
      .leftJoin(cases, eq(documents.caseId, cases.id))
      .leftJoin(users, eq(documents.uploadedBy, users.id))
      .where(and(
        inArray(documents.organisationId, orgIdArray), // Documents from any of user's organisations
        or(
          isNull(documents.caseId), // General documents not tied to a case
          eq(cases.isArchived, false) // Documents for non-archived cases only
        )
      ))
      .orderBy(desc(documents.createdAt));

    return results;
  }

  async getDocumentsForOrganisation(organisationId: number): Promise<any[]> {
    // Only return documents for non-archived cases, with uploader name
    const results = await db
      .select({
        id: documents.id,
        caseId: documents.caseId,
        fileName: documents.fileName,
        fileSize: documents.fileSize,
        fileType: documents.fileType,
        filePath: documents.filePath,
        uploadedBy: documents.uploadedBy,
        organisationId: documents.organisationId,
        createdAt: documents.createdAt,
        uploaderFirstName: users.firstName,
        uploaderLastName: users.lastName,
      })
      .from(documents)
      .leftJoin(cases, eq(documents.caseId, cases.id))
      .leftJoin(users, eq(documents.uploadedBy, users.id))
      .where(and(
        eq(documents.organisationId, organisationId),
        or(
          isNull(documents.caseId), // General org documents not tied to a case
          eq(cases.isArchived, false) // Documents for non-archived cases only
        )
      ))
      .orderBy(desc(documents.createdAt));

    return results;
  }

  async getOrganisationOnlyDocuments(organisationId: number): Promise<any[]> {
    // Return only documents that are not linked to any case (organisation-level docs)
    const results = await db
      .select({
        id: documents.id,
        caseId: documents.caseId,
        fileName: documents.fileName,
        fileSize: documents.fileSize,
        fileType: documents.fileType,
        filePath: documents.filePath,
        uploadedBy: documents.uploadedBy,
        organisationId: documents.organisationId,
        createdAt: documents.createdAt,
        uploaderFirstName: users.firstName,
        uploaderLastName: users.lastName,
      })
      .from(documents)
      .leftJoin(users, eq(documents.uploadedBy, users.id))
      .where(and(
        eq(documents.organisationId, organisationId),
        isNull(documents.caseId)
      ))
      .orderBy(desc(documents.createdAt));

    return results;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async deleteDocument(id: number, organisationId: number): Promise<void> {
    await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.organisationId, organisationId)));
  }

  async deleteDocumentById(id: number): Promise<void> {
    // Admin only - delete document by ID without org restriction
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Payment operations
  async getPaymentsForCase(caseId: number): Promise<Payment[]> {
    // First check if the case is archived
    const caseRecord = await db.select()
      .from(cases)
      .where(eq(cases.id, caseId))
      .limit(1);

    if (caseRecord.length === 0 || caseRecord[0].isArchived) {
      return []; // Return empty array if case doesn't exist or is archived
    }

    // Get payments for non-archived case
    return await db.select()
      .from(payments)
      .where(eq(payments.caseId, caseId))
      .orderBy(desc(payments.paymentDate));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updatedPayment] = await db.update(payments)
      .set(payment)
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  async deletePayment(id: number, organisationId?: number): Promise<void> {
    if (organisationId) {
      // Standard deletion with organisation check
      await db.delete(payments)
        .where(and(
          eq(payments.id, id),
          eq(payments.organisationId, organisationId)
        ));
    } else {
      // External API deletion without organisation check
      await db.delete(payments)
        .where(eq(payments.id, id));
    }
  }

  async getPaymentByExternalRef(externalRef: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.externalRef, externalRef));
    return payment;
  }

  async getCaseByExternalRef(externalRef: string): Promise<Case | undefined> {
    const [case_] = await db
      .select()
      .from(cases)
      .where(eq(cases.externalRef, externalRef));
    return case_;
  }

  async getCasesByAccountNumber(accountNumber: string): Promise<Case[]> {
    const cases_ = await db
      .select()
      .from(cases)
      .where(eq(cases.accountNumber, accountNumber));
    return cases_;
  }

  async getCaseStats(organisationId: number): Promise<{
    activeCases: number;
    closedCases: number;
    totalOutstanding: string;
    totalRecovery: string;
    totalOriginal: string;
    totalCosts: string;
    totalInterest: string;
    totalFees: string;
  }> {
    const [stats] = await db
      .select({
        activeCases: sql<number>`COUNT(CASE WHEN LOWER(status) != 'closed' THEN 1 END)`,
        closedCases: sql<number>`COUNT(CASE WHEN LOWER(status) = 'closed' THEN 1 END)`,
        totalOutstanding: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN outstanding_amount ELSE 0 END), 0)`,
        totalOriginal: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN original_amount ELSE 0 END), 0)`,
        totalCosts: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN costs_added ELSE 0 END), 0)`,
        totalInterest: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN interest_added ELSE 0 END), 0)`,
        totalFees: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN fees_added ELSE 0 END), 0)`,
      })
      .from(cases)
      .where(and(eq(cases.organisationId, organisationId), eq(cases.isArchived, false)));

    // Calculate total recovery from payments for active cases only (excluding archived cases)
    const [recoveryStats] = await db
      .select({
        totalRecovery: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .leftJoin(cases, eq(payments.caseId, cases.id))
      .where(and(
        eq(cases.organisationId, organisationId),
        eq(cases.isArchived, false),
        sql`LOWER(${cases.status}) != 'closed'`
      ));

    return {
      activeCases: stats.activeCases,
      closedCases: stats.closedCases,
      totalOutstanding: stats.totalOutstanding.toString(),
      totalRecovery: recoveryStats.totalRecovery.toString(),
      totalOriginal: stats.totalOriginal.toString(),
      totalCosts: stats.totalCosts.toString(),
      totalInterest: stats.totalInterest.toString(),
      totalFees: stats.totalFees.toString(),
    };
  }

  async getGlobalCaseStats(): Promise<{
    activeCases: number;
    closedCases: number;
    totalOutstanding: string;
    totalRecovery: string;
    totalOriginal: string;
    totalCosts: string;
    totalInterest: string;
    totalFees: string;
  }> {
    // Admin only - get stats across all organizations (excluding archived cases)
    const [stats] = await db
      .select({
        activeCases: sql<number>`COUNT(CASE WHEN LOWER(status) != 'closed' THEN 1 END)`,
        closedCases: sql<number>`COUNT(CASE WHEN LOWER(status) = 'closed' THEN 1 END)`,
        totalOutstanding: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN outstanding_amount ELSE 0 END), 0)`,
        totalOriginal: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN original_amount ELSE 0 END), 0)`,
        totalCosts: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN costs_added ELSE 0 END), 0)`,
        totalInterest: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN interest_added ELSE 0 END), 0)`,
        totalFees: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN fees_added ELSE 0 END), 0)`,
      })
      .from(cases)
      .where(eq(cases.isArchived, false));

    // Calculate total recovery from payments for active cases across all organizations (excluding archived cases)
    const [recoveryStats] = await db
      .select({
        totalRecovery: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .leftJoin(cases, eq(payments.caseId, cases.id))
      .where(and(
        eq(cases.isArchived, false),
        sql`LOWER(${cases.status}) != 'closed'`
      ));

    return {
      activeCases: stats.activeCases,
      closedCases: stats.closedCases,
      totalOutstanding: stats.totalOutstanding.toString(),
      totalRecovery: recoveryStats.totalRecovery.toString(),
      totalOriginal: stats.totalOriginal.toString(),
      totalCosts: stats.totalCosts.toString(),
      totalInterest: stats.totalInterest.toString(),
      totalFees: stats.totalFees.toString(),
    };
  }

  async getCombinedCaseStats(organisationIds: number[], excludeCaseIds: number[] = []): Promise<{
    activeCases: number;
    closedCases: number;
    totalOutstanding: string;
    totalRecovery: string;
    totalOriginal: string;
    totalCosts: string;
    totalInterest: string;
    totalFees: string;
  }> {
    // Build conditions for filtering
    const conditions = [
      eq(cases.isArchived, false),
      inArray(cases.organisationId, organisationIds)
    ];

    // Add exclusion filter if there are cases to exclude
    if (excludeCaseIds.length > 0) {
      conditions.push(notInArray(cases.id, excludeCaseIds));
    }

    // Get combined stats from multiple organizations (excluding archived cases and optionally excluded cases)
    const [stats] = await db
      .select({
        activeCases: sql<number>`COUNT(CASE WHEN LOWER(status) != 'closed' THEN 1 END)`,
        closedCases: sql<number>`COUNT(CASE WHEN LOWER(status) = 'closed' THEN 1 END)`,
        totalOutstanding: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN outstanding_amount ELSE 0 END), 0)`,
        totalOriginal: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN original_amount ELSE 0 END), 0)`,
        totalCosts: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN costs_added ELSE 0 END), 0)`,
        totalInterest: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN interest_added ELSE 0 END), 0)`,
        totalFees: sql<string>`COALESCE(SUM(CASE WHEN LOWER(status) != 'closed' THEN fees_added ELSE 0 END), 0)`,
      })
      .from(cases)
      .where(and(...conditions));

    // Build conditions for recovery stats
    const recoveryConditions = [
      eq(cases.isArchived, false),
      inArray(cases.organisationId, organisationIds),
      sql`LOWER(${cases.status}) != 'closed'`
    ];

    if (excludeCaseIds.length > 0) {
      recoveryConditions.push(notInArray(cases.id, excludeCaseIds));
    }

    // Calculate total recovery from payments for cases in specified organizations (excluding archived cases)
    const [recoveryStats] = await db
      .select({
        totalRecovery: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .leftJoin(cases, eq(payments.caseId, cases.id))
      .where(and(...recoveryConditions));

    return {
      activeCases: stats.activeCases,
      closedCases: stats.closedCases,
      totalOutstanding: stats.totalOutstanding.toString(),
      totalRecovery: recoveryStats.totalRecovery.toString(),
      totalOriginal: stats.totalOriginal.toString(),
      totalCosts: stats.totalCosts.toString(),
      totalInterest: stats.totalInterest.toString(),
      totalFees: stats.totalFees.toString(),
    };
  }

  // Admin operations
  async hasAdminUser(): Promise<boolean> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isAdmin, true));
    return result.count > 0;
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        organisationId: users.organisationId,
        createdAt: users.createdAt,
        organisationName: organisations.name,
        isAdmin: users.isAdmin,
        isSuperAdmin: users.isSuperAdmin,
        phone: users.phone,
        azureId: users.azureId,
        mustChangePassword: users.mustChangePassword,
      })
      .from(users)
      .leftJoin(organisations, eq(users.organisationId, organisations.id))
      .where(isNotNull(users.email))
      .orderBy(users.createdAt);

    return result;
  }

  async getAllOrganisations(): Promise<Organization[]> {
    const result = await db
      .select({
        id: organisations.id,
        name: organisations.name,
        externalRef: organisations.externalRef,
        createdAt: organisations.createdAt,
        scheduledReportsEnabled: organisations.scheduledReportsEnabled,
        userCount: sql<number>`count(${users.id})`,
      })
      .from(organisations)
      .leftJoin(users, eq(organisations.id, users.organisationId))
      .groupBy(organisations.id, organisations.name, organisations.externalRef, organisations.createdAt, organisations.scheduledReportsEnabled)
      .orderBy(organisations.createdAt);

    return result;
  }

  async assignUserToOrganisation(userId: string, organisationId: number): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ organisationId: organisationId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return user || null;
  }

  // Enhanced user management methods
  async createUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    organisationId?: number;
    isAdmin?: boolean;
    canSubmitCases?: boolean;
  }): Promise<{ user: User; tempPassword: string }> {
    const tempPassword = nanoid(12); // Generate temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const userId = nanoid(10);

    // Auto-assign super admin for specific email addresses
    const emailLower = userData.email.toLowerCase();
    const isSuperAdmin = emailLower === 'matt.perry@chadlaw.co.uk' || emailLower === 'it@chadlaw.co.uk';

    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: emailLower,
        phone: userData.phone,
        organisationId: userData.organisationId,
        isAdmin: userData.isAdmin || false,
        isSuperAdmin,
        hashedPassword,
        tempPassword,
        mustChangePassword: true,
        canSubmitCases: userData.canSubmitCases ?? false,
      })
      .returning();

    return { user, tempPassword };
  }

  async updateSuperAdminStatus(userId: string, isSuperAdmin: boolean): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ isSuperAdmin, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || null;
  }

  async updateUser(userId: string, userData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  }): Promise<User | null> {
    const updateData: any = { updatedAt: new Date() };
    if (userData.firstName !== undefined) updateData.firstName = userData.firstName;
    if (userData.lastName !== undefined) updateData.lastName = userData.lastName;
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    if (userData.email !== undefined) updateData.email = userData.email;

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return user || null;
  }

  async updateNotificationPreferences(userId: string, preferences: {
    emailNotifications: boolean;
    documentNotifications?: boolean;
    loginNotifications?: boolean;
    pushNotifications: boolean;
  }): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({
        emailNotifications: preferences.emailNotifications,
        documentNotifications: preferences.documentNotifications,
        loginNotifications: preferences.loginNotifications,
        pushNotifications: preferences.pushNotifications,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return user || null;
  }

  async getUsersByOrganisationId(organisationId: number): Promise<User[]> {
    // Get users via legacy organisationId field
    const legacyUsers = await db.select().from(users).where(eq(users.organisationId, organisationId));

    // Get users via junction table
    const junctionUsers = await db
      .select({ user: users })
      .from(userOrganisations)
      .leftJoin(users, eq(userOrganisations.userId, users.id))
      .where(eq(userOrganisations.organisationId, organisationId));

    // Combine and deduplicate users
    const userMap = new Map<string, User>();

    // Add legacy users
    legacyUsers.forEach(user => userMap.set(user.id, user));

    // Add junction users
    junctionUsers.forEach(ju => {
      if (ju.user) {
        userMap.set(ju.user.id, ju.user);
      }
    });

    return Array.from(userMap.values());
  }

  async updateUserPassword(id: string, passwordData: { 
    hashedPassword?: string; 
    tempPassword?: string | null; 
    mustChangePassword?: boolean 
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        hashedPassword: passwordData.hashedPassword,
        tempPassword: passwordData.tempPassword,
        mustChangePassword: passwordData.mustChangePassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async updateUserOrganisation(id: string, organisationId: number | null): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        organisationId: organisationId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async makeUserAdmin(userId: string): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ isAdmin: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return user || null;
  }

  async removeUserAdmin(userId: string): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ isAdmin: false, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return user || null;
  }

  async updateUserCaseSubmission(userId: string, canSubmitCases: boolean): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ canSubmitCases, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return user || null;
  }

  async resetUserPassword(userId: string): Promise<string> {
    const tempPassword = nanoid(12);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await db
      .update(users)
      .set({
        hashedPassword,
        tempPassword,
        mustChangePassword: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return tempPassword;
  }

  async changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.hashedPassword) return false;

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isCurrentPasswordValid) return false;

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({
        hashedPassword: newPasswordHash,
        tempPassword: null,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return true;
  }

  async setUserPassword(userId: string, newPassword: string): Promise<User | null> {
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const [user] = await db
      .update(users)
      .set({
        hashedPassword: newPasswordHash,
        tempPassword: null,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return user || null;
  }

  async verifyUserPassword(userId: string, password: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.hashedPassword) return false;

    return await bcrypt.compare(password, user.hashedPassword);
  }

  async checkMustChangePassword(userId: string): Promise<boolean> {
    const [user] = await db.select({ mustChangePassword: users.mustChangePassword }).from(users).where(eq(users.id, userId));
    return user?.mustChangePassword || false;
  }

  async deleteUser(userId: string): Promise<void> {
    // Anonymise the user record rather than deleting it.
    // This preserves all case data (messages, documents, payments, case activities,
    // audit logs) by keeping the user row alive so FK references remain valid.
    // Setting email to null also prevents login and hides the user from admin lists.
    await db.update(users).set({
      email: null,
      firstName: "Deleted",
      lastName: "User",
      phone: null,
      profileImageUrl: null,
      hashedPassword: null,
      tempPassword: null,
      azureId: null,
      externalRef: null,
      isAdmin: false,
      isSuperAdmin: false,
    }).where(eq(users.id, userId));

    // Remove organisation memberships
    await db.delete(userOrganisations).where(eq(userOrganisations.userId, userId));

    // Remove internal login/session tracking logs (not case data)
    await db.delete(userActivityLogs).where(eq(userActivityLogs.userId, userId));
  }

  // System monitoring operations
  async logUserActivity(activity: InsertUserActivityLog): Promise<UserActivityLog> {
    const [log] = await db.insert(userActivityLogs).values(activity).returning();
    return log;
  }

  async getUserActivityLogs(userId?: string, limit = 100): Promise<UserActivityLog[]> {
    let query = db.select({
      id: userActivityLogs.id,
      userId: userActivityLogs.userId,
      action: userActivityLogs.action,
      details: userActivityLogs.details,
      ipAddress: userActivityLogs.ipAddress,
      userAgent: userActivityLogs.userAgent,
      timestamp: userActivityLogs.createdAt,
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName,
    })
    .from(userActivityLogs)
    .leftJoin(users, eq(userActivityLogs.userId, users.id))
    .orderBy(desc(userActivityLogs.createdAt))
    .limit(limit);

    if (userId) {
      query = query.where(eq(userActivityLogs.userId, userId));
    }

    return await query;
  }

  async logLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt> {
    const [log] = await db.insert(loginAttempts).values(attempt).returning();
    return log;
  }

  async getLoginAttempts(limit = 100): Promise<LoginAttempt[]> {
    return await db.select().from(loginAttempts)
      .orderBy(desc(loginAttempts.createdAt))
      .limit(limit);
  }

  async getFailedLoginAttempts(limit = 100): Promise<LoginAttempt[]> {
    return await db.select().from(loginAttempts)
      .where(eq(loginAttempts.success, false))
      .orderBy(desc(loginAttempts.createdAt))
      .limit(limit);
  }

  async isNewLoginLocation(email: string, ipAddress: string, userAgent: string): Promise<boolean> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const previousLogins = await db.select().from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email.toLowerCase()),
          eq(loginAttempts.success, true),
          eq(loginAttempts.ipAddress, ipAddress),
          gte(loginAttempts.createdAt, sevenDaysAgo)
        )
      )
      .limit(1);

    return previousLogins.length === 0;
  }

  async recordSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric> {
    const [record] = await db.insert(systemMetrics).values(metric).returning();
    return record;
  }

  async getSystemMetrics(metricName?: string, limit = 100): Promise<SystemMetric[]> {
    let query = db.select().from(systemMetrics)
      .orderBy(desc(systemMetrics.recordedAt))
      .limit(limit);

    if (metricName) {
      query = query.where(eq(systemMetrics.metricName, metricName));
    }

    return await query;
  }

  async getSystemAnalytics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalCases: number;
    activeCases: number;
    totalOrganizations: number;
    recentActivity: number;
    failedLogins: number;
    systemHealth: string;
  }> {
    try {
      const [totalUsers, totalCases, totalOrganizations] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(users),
        db.select({ count: sql<number>`count(*)` }).from(cases).where(eq(cases.isArchived, false)),
        db.select({ count: sql<number>`count(*)` }).from(organisations),
      ]);

      const [activeCases] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(cases)
          .where(and(eq(cases.isArchived, false), or(eq(cases.status, "new"), eq(cases.status, "in_progress")))),
      ]);

      // Simple fallback values for missing tables
      const recentActivity = 0;
      const failedLogins = 0;
      const activeUsers = Math.floor(totalUsers[0]?.count * 0.8) || 0; // Estimate 80% active

      // Determine system health based on failed logins and activity
      let systemHealth = "healthy";
      if (failedLogins > 10) {
        systemHealth = "warning";
      }
      if (failedLogins > 50) {
        systemHealth = "critical";
      }

      return {
        totalUsers: totalUsers[0]?.count || 0,
        activeUsers,
        totalCases: totalCases[0]?.count || 0,
        activeCases: activeCases[0]?.count || 0,
        totalOrganizations: totalOrganizations[0]?.count || 0,
        recentActivity,
        failedLogins,
        systemHealth,
      };
    } catch (error) {
      console.error('Error fetching system analytics:', error);
      // Return safe fallback data
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalCases: 0,
        activeCases: 0,
        totalOrganizations: 0,
        recentActivity: 0,
        failedLogins: 0,
        systemHealth: "unknown",
      };
    }
  }

  // Advanced reporting operations
  async getCrossOrganizationPerformance(): Promise<{
    organizationId: number;
    organizationName: string;
    totalCases: number;
    activeCases: number;
    closedCases: number;
    totalOutstanding: string;
    totalRecovered: string;
    recoveryRate: number;
    averageCaseAge: number;
    userCount: number;
  }[]> {
    // Get case and payment data per organisation
    const caseResults = await db
      .select({
        organisationId: organisations.id,
        organisationName: organisations.name,
        totalCases: sql<number>`COUNT(DISTINCT ${cases.id})`,
        activeCases: sql<number>`COUNT(DISTINCT CASE WHEN LOWER(${cases.status}) != 'closed' THEN ${cases.id} END)`,
        closedCases: sql<number>`COUNT(DISTINCT CASE WHEN LOWER(${cases.status}) = 'closed' THEN ${cases.id} END)`,
        totalOutstanding: sql<string>`COALESCE(SUM(DISTINCT ${cases.outstandingAmount}), 0)`,
        totalOriginalAmount: sql<string>`COALESCE(SUM(DISTINCT ${cases.originalAmount}), 0)`,
        averageCaseAge: sql<number>`COALESCE(AVG(EXTRACT(DAYS FROM NOW() - ${cases.createdAt})), 0)`,
      })
      .from(organisations)
      .leftJoin(cases, and(eq(cases.organisationId, organisations.id), eq(cases.isArchived, false)))
      .groupBy(organisations.id, organisations.name)
      .orderBy(organisations.name);

    // Get payment totals per organisation
    const paymentResults = await db
      .select({
        organisationId: cases.organisationId,
        totalRecovered: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .innerJoin(cases, eq(payments.caseId, cases.id))
      .where(eq(cases.isArchived, false))
      .groupBy(cases.organisationId);

    const paymentMap = new Map(paymentResults.map(p => [p.organisationId, p.totalRecovered]));

    // Get user counts per organisation (including multi-org users)
    const userCounts = await db
      .select({
        organisationId: sql<number>`org_id`,
        userCount: sql<number>`COUNT(DISTINCT user_id)`,
      })
      .from(sql`(
        SELECT ${users.id} as user_id, ${users.organisationId} as org_id FROM ${users}
        UNION
        SELECT ${userOrganisations.userId} as user_id, ${userOrganisations.organisationId} as org_id FROM ${userOrganisations}
      ) AS all_user_orgs`)
      .groupBy(sql`org_id`);

    const userCountMap = new Map(userCounts.map(u => [u.organisationId, u.userCount]));

    return caseResults.map(result => {
      const totalRecovered = paymentMap.get(result.organisationId) || "0";
      const originalAmount = parseFloat(result.totalOriginalAmount) || 0;
      const recoveredAmount = parseFloat(totalRecovered) || 0;

      // Recovery rate = (amount recovered / original debt amount) * 100
      const recoveryRate = originalAmount > 0 ? (recoveredAmount / originalAmount) * 100 : 0;

      return {
        organisationId: result.organisationId,
        organisationName: result.organisationName || 'Unknown',
        totalCases: result.totalCases || 0,
        activeCases: result.activeCases || 0,
        closedCases: result.closedCases || 0,
        totalOutstanding: result.totalOutstanding,
        totalRecovered: totalRecovered,
        recoveryRate: Math.min(recoveryRate, 100), // Cap at 100%
        averageCaseAge: result.averageCaseAge || 0,
        userCount: userCountMap.get(result.organisationId) || 0,
      };
    });
  }

  async getUserActivityReport(startDate?: Date, endDate?: Date): Promise<{
    userId: string;
    userEmail: string;
    userFirstName: string;
    userLastName: string;
    organizationName: string;
    loginCount: number;
    lastLogin: Date;
    actionCount: number;
    casesCreated: number;
    messageseSent: number;
    documentsUploaded: number;
  }[]> {
    // Get basic user data with organization info
    const usersWithOrgs = await db
      .select({
        userId: users.id,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        organizationName: organisations.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(organisations, eq(users.organisationId, organisations.id))
      .orderBy(users.email);

    // Get case counts for each user (excluding archived cases)
    const caseCounts = await db
      .select({
        userId: cases.createdBy,
        casesCreated: sql<number>`COUNT(*)`,
      })
      .from(cases)
      .where(and(cases.createdBy !== null, eq(cases.isArchived, false)))
      .groupBy(cases.createdBy);

    const caseMap = new Map(caseCounts.map(c => [c.userId, c.casesCreated]));

    // Get message counts for each user (excluding messages from archived cases)
    const messageCounts = await db
      .select({
        userId: messages.senderId,
        messageseSent: sql<number>`COUNT(*)`,
      })
      .from(messages)
      .leftJoin(cases, eq(messages.caseId, cases.id))
      .where(or(
        isNull(messages.caseId), // General messages not tied to a case
        eq(cases.isArchived, false) // Messages for non-archived cases only
      ))
      .groupBy(messages.senderId);

    const messageMap = new Map(messageCounts.map(m => [m.userId, m.messageseSent]));

    // Get document counts for each user (excluding documents from archived cases)
    const documentCounts = await db
      .select({
        userId: documents.uploadedBy,
        documentsUploaded: sql<number>`COUNT(*)`,
      })
      .from(documents)
      .leftJoin(cases, eq(documents.caseId, cases.id))
      .where(and(
        documents.uploadedBy !== null,
        or(
          isNull(documents.caseId), // General documents not tied to a case
          eq(cases.isArchived, false) // Documents for non-archived cases only
        )
      ))
      .groupBy(documents.uploadedBy);

    const documentMap = new Map(documentCounts.map(d => [d.userId, d.documentsUploaded]));

    return usersWithOrgs.map(user => ({
      userId: user.userId,
      userEmail: user.userEmail || '',
      userFirstName: user.userFirstName || '',
      userLastName: user.userLastName || '',
      organizationName: user.organizationName || 'Unassigned',
      loginCount: Math.floor(Math.random() * 20) + 1, // Simplified for demo
      lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
      actionCount: (caseMap.get(user.userId) || 0) + (messageMap.get(user.userId) || 0) + (documentMap.get(user.userId) || 0),
      casesCreated: caseMap.get(user.userId) || 0,
      messageseSent: messageMap.get(user.userId) || 0,
      documentsUploaded: documentMap.get(user.userId) || 0,
    }));
  }

  async getSystemHealthMetrics(): Promise<{
    metric: string;
    value: number;
    status: string;
    timestamp: Date;
  }[]> {
    // Get key system health metrics
    const metrics = [
      {
        metric: 'Database Connections',
        value: 1, // Simplified for demo
        status: 'healthy',
        timestamp: new Date(),
      },
      {
        metric: 'Active Users (24h)',
        value: 3, // Simplified for demo
        status: 'healthy',
        timestamp: new Date(),
      },
      {
        metric: 'Failed Logins (24h)',
        value: 1, // Simplified for demo
        status: 'healthy',
        timestamp: new Date(),
      },
      {
        metric: 'Cases Created (24h)',
        value: (await db.select({ count: sql<number>`COUNT(*)` })
          .from(cases)
          .where(and(
            eq(cases.isArchived, false),
            sql`${cases.createdAt} > NOW() - INTERVAL '24 hours'`
          )))[0].count,
        status: 'healthy',
        timestamp: new Date(),
      },
    ];

    // Determine status based on values
    return metrics.map(metric => {
      let status = 'healthy';
      if (metric.metric === 'Failed Logins (24h)' && metric.value > 10) {
        status = 'warning';
      }
      if (metric.metric === 'Failed Logins (24h)' && metric.value > 50) {
        status = 'critical';
      }
      return { ...metric, status };
    });
  }

  async getCustomReportData(reportConfig: {
    tables: string[];
    filters: Record<string, any>;
    groupBy?: string[];
    orderBy?: string;
    limit?: number;
  }): Promise<any[]> {
    // This is a simplified version - in production, you'd want more robust query building
    try {
      let query = db.select();

      // For demo purposes, support common table combinations
      if (reportConfig.tables.includes('cases') && reportConfig.tables.includes('organisations')) {
        query = db.select({
          caseId: cases.id,
          accountNumber: cases.accountNumber,
          caseName: cases.caseName,
          originalAmount: cases.originalAmount,
          outstandingAmount: cases.outstandingAmount,
          status: cases.status,
          organizationName: organisations.name,
          createdAt: cases.createdAt,
        })
        .from(cases)
        .leftJoin(organisations, eq(cases.organisationId, organisations.id));
      } else if (reportConfig.tables.includes('users') && reportConfig.tables.includes('organisations')) {
        query = db.select({
          userId: users.id,
          userEmail: users.email,
          userFirstName: users.firstName,
          userLastName: users.lastName,
          organizationName: organisations.name,
          isAdmin: users.isAdmin,
          isSuperAdmin: users.isSuperAdmin,
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(organisations, eq(users.organisationId, organisations.id));
      } else {
        // Default to cases only
        query = db.select().from(cases);
      }

      // Apply filters (simplified)
      if (reportConfig.filters.status) {
        query = query.where(eq(cases.status, reportConfig.filters.status));
      }

      // Apply limit
      if (reportConfig.limit) {
        query = query.limit(reportConfig.limit);
      }

      return await query;
    } catch (error) {
      console.error('Custom report query error:', error);
      return [];
    }
  }

  // External API credentials operations
  async createExternalApiCredential(credential: InsertExternalApiCredential): Promise<ExternalApiCredential> {
    const [result] = await db.insert(externalApiCredentials).values(credential).returning();
    return result;
  }

  async getExternalApiCredentials(organisationId: number): Promise<ExternalApiCredential[]> {
    return await db
      .select()
      .from(externalApiCredentials)
      .where(eq(externalApiCredentials.organisationId, organisationId));
  }

  async verifyExternalApiCredential(organisationId: number, username: string, password: string): Promise<boolean> {
    const [credential] = await db
      .select()
      .from(externalApiCredentials)
      .where(
        and(
          eq(externalApiCredentials.organisationId, organisationId),
          eq(externalApiCredentials.username, username),
          eq(externalApiCredentials.isActive, true)
        )
      );

    if (!credential) {
      return false;
    }

    return await bcrypt.compare(password, credential.hashedPassword);
  }

  async getExternalApiCredentialByUsername(username: string): Promise<ExternalApiCredential | undefined> {
    const [credential] = await db
      .select()
      .from(externalApiCredentials)
      .where(eq(externalApiCredentials.username, username));
    return credential;
  }

  async updateExternalApiCredential(id: number, updates: Partial<InsertExternalApiCredential>): Promise<ExternalApiCredential> {
    const [result] = await db
      .update(externalApiCredentials)
      .set(updates)
      .where(eq(externalApiCredentials.id, id))
      .returning();
    return result;
  }

  async deleteExternalApiCredential(id: number): Promise<void> {
    await db.delete(externalApiCredentials).where(eq(externalApiCredentials.id, id));
  }

  // Comprehensive audit functionality
  async logAuditEvent(auditData: InsertAuditLog): Promise<AuditLog> {
    const [result] = await db.insert(auditLog).values(auditData).returning();
    return result;
  }

  async getAuditLogs(filters?: {
    tableName?: string;
    recordId?: string;
    operation?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    let query = db.select().from(auditLog);

    const conditions = [];

    if (filters?.tableName) {
      conditions.push(eq(auditLog.tableName, filters.tableName));
    }

    if (filters?.recordId) {
      conditions.push(eq(auditLog.recordId, filters.recordId));
    }

    if (filters?.operation) {
      conditions.push(eq(auditLog.operation, filters.operation));
    }

    if (filters?.userId) {
      conditions.push(eq(auditLog.userId, filters.userId));
    }

    if (filters?.startDate) {
      conditions.push(sql`${auditLog.timestamp} >= ${filters.startDate}`);
    }

    if (filters?.endDate) {
      conditions.push(sql`${auditLog.timestamp} <= ${filters.endDate}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(auditLog.timestamp));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  async getAuditSummary(): Promise<{
    totalChanges: number;
    recentChanges: number;
    topUsers: { userId: string; userEmail: string; changeCount: number }[];
    topTables: { tableName: string; changeCount: number }[];
  }> {
    // Get total changes
    const [totalChanges] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog);

    // Get recent changes (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const [recentChanges] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(sql`${auditLog.timestamp} >= ${yesterday}`);

    // Get top users by change count
    const topUsers = await db
      .select({
        userId: auditLog.userId,
        userEmail: auditLog.userEmail,
        changeCount: sql<number>`count(*)`,
      })
      .from(auditLog)
      .where(sql`${auditLog.userId} IS NOT NULL`)
      .groupBy(auditLog.userId, auditLog.userEmail)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Get top tables by change count
    const topTables = await db
      .select({
        tableName: auditLog.tableName,
        changeCount: sql<number>`count(*)`,
      })
      .from(auditLog)
      .groupBy(auditLog.tableName)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    return {
      totalChanges: totalChanges.count,
      recentChanges: recentChanges.count,
      topUsers: topUsers.map(user => ({
        userId: user.userId || 'Unknown',
        userEmail: user.userEmail || 'Unknown',
        changeCount: user.changeCount,
      })),
      topTables: topTables.map(table => ({
        tableName: table.tableName,
        changeCount: table.changeCount,
      })),
    };
  }

  async deleteOldAuditLogs(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db.delete(auditLog)
      .where(sql`${auditLog.timestamp} < ${cutoffDate}`);

    return result.rowCount || 0;
  }

  async getAuditLogStats(): Promise<{
    totalLogs: number;
    oldestLog: Date | null;
    newestLog: Date | null;
    logsByAge: { period: string; count: number }[];
  }> {
    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog);

    // Get oldest and newest log timestamps
    const [dateRange] = await db
      .select({
        oldest: sql<Date>`min(${auditLog.timestamp})`,
        newest: sql<Date>`max(${auditLog.timestamp})`,
      })
      .from(auditLog);

    // Get logs grouped by age periods
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [lastWeek] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(sql`${auditLog.timestamp} >= ${oneWeekAgo}`);

    const [lastMonth] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(sql`${auditLog.timestamp} >= ${oneMonthAgo} AND ${auditLog.timestamp} < ${oneWeekAgo}`);

    const [lastThreeMonths] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(sql`${auditLog.timestamp} >= ${threeMonthsAgo} AND ${auditLog.timestamp} < ${oneMonthAgo}`);

    const [lastSixMonths] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(sql`${auditLog.timestamp} >= ${sixMonthsAgo} AND ${auditLog.timestamp} < ${threeMonthsAgo}`);

    const [lastYear] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(sql`${auditLog.timestamp} >= ${oneYearAgo} AND ${auditLog.timestamp} < ${sixMonthsAgo}`);

    const [olderThanYear] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(sql`${auditLog.timestamp} < ${oneYearAgo}`);

    return {
      totalLogs: totalResult.count,
      oldestLog: dateRange.oldest || null,
      newestLog: dateRange.newest || null,
      logsByAge: [
        { period: 'Last 7 days', count: lastWeek.count },
        { period: '7-30 days', count: lastMonth.count },
        { period: '1-3 months', count: lastThreeMonths.count },
        { period: '3-6 months', count: lastSixMonths.count },
        { period: '6-12 months', count: lastYear.count },
        { period: 'Over 1 year', count: olderThanYear.count },
      ],
    };
  }

  // Session management methods
  async invalidateUserSessions(userId: string): Promise<number> {
    // The user_sessions table stores user data in the sess JSONB column
    // The structure is: { cookie: {...}, passport: { user: userId } }
    // Note: The actual table name is 'user_sessions' not 'sessions'
    const result = await db.execute(
      sql`DELETE FROM user_sessions WHERE sess->'passport'->>'user' = ${userId}`
    );

    return (result as any).rowCount || 0;
  }

  async getUserActiveSessions(userId: string): Promise<{ sid: string; lastAccess: Date; userAgent?: string; ipAddress?: string }[]> {
    // Query the user_sessions table directly
    const result = await db.execute(
      sql`SELECT sid, sess, expire FROM user_sessions 
          WHERE sess->'passport'->>'user' = ${userId} 
          AND expire > NOW()`
    );

    const rows = (result as any).rows || [];
    return rows.map((row: any) => {
      const sessData = row.sess as any;
      return {
        sid: row.sid,
        lastAccess: new Date(row.expire),
        userAgent: sessData?.userAgent,
        ipAddress: sessData?.ipAddress,
      };
    });
  }

  // Helper method to create audit records for database changes
  async auditChange(
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    oldData: any = null,
    newData: any = null,
    userId?: string,
    userEmail?: string,
    ipAddress?: string,
    userAgent?: string,
    organisationId?: number,
    description?: string
  ): Promise<void> {
    try {
      if (operation === 'UPDATE' && oldData && newData) {
        // For updates, log individual field changes
        const changes = this.getFieldChanges(oldData, newData);

        for (const change of changes) {
          await this.logAuditEvent({
            tableName,
            recordId,
            operation,
            fieldName: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
            userId,
            userEmail,
            ipAddress,
            userAgent,
            organisationId,
            description: description || `Updated ${change.field}`,
          });
        }
      } else {
        // For INSERT/DELETE, log the entire operation
        await this.logAuditEvent({
          tableName,
          recordId,
          operation,
          oldValue: oldData ? JSON.stringify(oldData) : null,
          newValue: newData ? JSON.stringify(newData) : null,
          userId,
          userEmail,
          ipAddress,
          userAgent,
          organisationId,
          description: description || `${operation} operation on ${tableName}`,
        });
      }
    } catch (error) {
      // Don't throw errors for audit logging to avoid disrupting main operations
      console.error('Audit logging failed:', error);
    }
  }

  private getFieldChanges(oldData: any, newData: any): { field: string; oldValue: string; newValue: string }[] {
    const changes = [];

    // Compare all fields
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      const oldValue = oldData[key];
      const newValue = newData[key];

      // Skip system fields that change automatically
      if (['updatedAt', 'lastModified'].includes(key)) {
        continue;
      }

      // Compare values (handle null/undefined)
      if (oldValue !== newValue) {
        changes.push({
          field: key,
          oldValue: oldValue !== null && oldValue !== undefined ? String(oldValue) : null,
          newValue: newValue !== null && newValue !== undefined ? String(newValue) : null,
        });
      }
    }

    return changes;
  }

  // Case submission document operations
  async createCaseSubmissionDocument(doc: {
    caseSubmissionId: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
  }): Promise<void> {
    await db.insert(caseSubmissionDocuments).values({
      caseSubmissionId: doc.caseSubmissionId,
      fileName: doc.fileName,
      filePath: doc.filePath,
      fileSize: doc.fileSize,
      fileType: doc.fileType,
    });
  }

  async getCaseSubmissionDocuments(caseSubmissionId: number): Promise<Array<{
    id: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    uploadedAt: Date;
  }>> {
    const results = await db.select().from(caseSubmissionDocuments)
      .where(eq(caseSubmissionDocuments.caseSubmissionId, caseSubmissionId))
      .orderBy(desc(caseSubmissionDocuments.uploadedAt));

    return results.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      filePath: doc.filePath,
      fileSize: doc.fileSize,
      fileType: doc.fileType,
      uploadedAt: doc.uploadedAt,
    }));
  }

  async deleteCaseSubmissionDocument(id: number): Promise<void> {
    await db.delete(caseSubmissionDocuments).where(eq(caseSubmissionDocuments.id, id));
  }

  // Password reset token operations
  async createPasswordResetToken(userId: string, hashedToken: string, expiresAt: Date): Promise<PasswordResetToken> {
    // Invalidate any existing tokens for this user first
    await this.invalidatePasswordResetTokensForUser(userId);

    const [token] = await db.insert(passwordResetTokens).values({
      userId,
      hashedToken,
      expiresAt,
    }).returning();
    return token;
  }

  async getValidPasswordResetToken(userId: string): Promise<PasswordResetToken | undefined> {
    const [token] = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, userId),
          isNull(passwordResetTokens.usedAt),
          sql`${passwordResetTokens.expiresAt} > NOW()`
        )
      )
      .orderBy(desc(passwordResetTokens.createdAt))
      .limit(1);
    return token;
  }

  async markPasswordResetTokenUsed(tokenId: number): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  async invalidatePasswordResetTokensForUser(userId: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.userId, userId),
          isNull(passwordResetTokens.usedAt)
        )
      );
  }

  // Muted cases operations
  async muteCase(userId: string, caseId: number): Promise<void> {
    // Check if already muted to avoid duplicates
    const existing = await db.select()
      .from(mutedCases)
      .where(and(eq(mutedCases.userId, userId), eq(mutedCases.caseId, caseId)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(mutedCases).values({ userId, caseId });
    }
  }

  async unmuteCase(userId: string, caseId: number): Promise<void> {
    await db.delete(mutedCases)
      .where(and(eq(mutedCases.userId, userId), eq(mutedCases.caseId, caseId)));
  }

  async isCaseMuted(userId: string, caseId: number): Promise<boolean> {
    const [result] = await db.select()
      .from(mutedCases)
      .where(and(eq(mutedCases.userId, userId), eq(mutedCases.caseId, caseId)))
      .limit(1);
    return !!result;
  }

  async getMutedCasesForUser(userId: string): Promise<number[]> {
    const results = await db.select({ caseId: mutedCases.caseId })
      .from(mutedCases)
      .where(eq(mutedCases.userId, userId));
    return results.map(r => r.caseId);
  }

  // Case access restriction operations - admin/owner blocks user from seeing a case
  // This is separate from muting - restrictions hide the case AND block notifications
  async addCaseAccessRestriction(caseId: number, blockedUserId: string, createdBy: string | null): Promise<boolean> {
    // Check if restriction already exists
    const existing = await db.select()
      .from(caseAccessRestrictions)
      .where(and(
        eq(caseAccessRestrictions.caseId, caseId),
        eq(caseAccessRestrictions.blockedUserId, blockedUserId)
      ))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(caseAccessRestrictions).values({
        caseId,
        blockedUserId,
        createdBy,
      });
      return true;
    }
    return false;
  }

  async removeCaseAccessRestriction(caseId: number, blockedUserId: string): Promise<boolean> {
    const deleted = await db.delete(caseAccessRestrictions)
      .where(and(
        eq(caseAccessRestrictions.caseId, caseId),
        eq(caseAccessRestrictions.blockedUserId, blockedUserId)
      ))
      .returning({ id: caseAccessRestrictions.id });
    return deleted.length > 0;
  }

  async getCaseAccessRestrictions(caseId: number): Promise<string[]> {
    // Get users who are blocked from this case by admin (NOT muted cases)
    // Muted cases only affect email notifications, not case visibility
    const results = await db.select({ blockedUserId: caseAccessRestrictions.blockedUserId })
      .from(caseAccessRestrictions)
      .where(eq(caseAccessRestrictions.caseId, caseId));
    return results.map(r => r.blockedUserId);
  }

  async getAllCaseRestrictionCounts(): Promise<Record<number, number>> {
    // Returns a map of caseId -> number of users restricted from that case
    const results = await db.select({
      caseId: caseAccessRestrictions.caseId,
      count: sql<number>`count(*)`,
    })
      .from(caseAccessRestrictions)
      .groupBy(caseAccessRestrictions.caseId);
    const map: Record<number, number> = {};
    for (const row of results) {
      map[row.caseId] = Number(row.count);
    }
    return map;
  }

  async isUserBlockedFromCase(userId: string, caseId: number): Promise<boolean> {
    // Check admin-set case access restrictions (NOT muted cases)
    // Muted cases only affect email notifications, not case visibility
    const result = await db.select()
      .from(caseAccessRestrictions)
      .where(and(
        eq(caseAccessRestrictions.blockedUserId, userId),
        eq(caseAccessRestrictions.caseId, caseId)
      ))
      .limit(1);
    return result.length > 0;
  }

  async getBlockedCasesForUser(userId: string): Promise<number[]> {
    // Only return admin-set case access restrictions (NOT muted cases)
    // Muted cases only affect email notifications, not case visibility
    const results = await db.select({ caseId: caseAccessRestrictions.caseId })
      .from(caseAccessRestrictions)
      .where(eq(caseAccessRestrictions.blockedUserId, userId));
    return results.map(r => r.caseId);
  }

  async getAdminRestrictedCasesForUser(userId: string): Promise<number[]> {
    // Get only admin-set restrictions from case_access_restrictions table
    // This is separate from user-muting - used for scheduled reports
    const results = await db.select({ caseId: caseAccessRestrictions.caseId })
      .from(caseAccessRestrictions)
      .where(eq(caseAccessRestrictions.blockedUserId, userId));
    return results.map(r => r.caseId);
  }

  // Reconstruct, from the audit log, which cases were most recently lifted (un-restricted)
  // for a user. We record both lift (DELETE) and restore (INSERT) events against
  // tableName 'case_access_restrictions' with newValue = the blocked user's id and
  // recordId = the caseId. The latest event per case tells us its current audited state.
  async getLiftedRestrictionsForUser(userId: string): Promise<{ caseId: number; liftedAt: Date }[]> {
    const events = await db.select()
      .from(auditLog)
      .where(and(
        eq(auditLog.tableName, 'case_access_restrictions'),
        eq(auditLog.newValue, userId),
      ))
      .orderBy(desc(auditLog.timestamp));

    const latestByCase = new Map<number, { operation: string; timestamp: Date }>();
    for (const event of events) {
      const caseId = parseInt(event.recordId);
      if (Number.isNaN(caseId)) continue;
      if (!latestByCase.has(caseId)) {
        latestByCase.set(caseId, {
          operation: event.operation,
          timestamp: event.timestamp ?? new Date(),
        });
      }
    }

    const lifted: { caseId: number; liftedAt: Date }[] = [];
    latestByCase.forEach((info, caseId) => {
      if (info.operation === 'DELETE') {
        lifted.push({ caseId, liftedAt: info.timestamp });
      }
    });
    return lifted;
  }

  // Scheduled reports operations - supports multiple reports per user

  async getScheduledReportById(id: number): Promise<ScheduledReport | undefined> {
    const [result] = await db.select()
      .from(scheduledReports)
      .where(eq(scheduledReports.id, id))
      .limit(1);
    return result;
  }

  async getScheduledReportsForUser(userId: string): Promise<ScheduledReport[]> {
    return await db.select()
      .from(scheduledReports)
      .where(eq(scheduledReports.userId, userId));
  }

  async createScheduledReport(data: InsertScheduledReport): Promise<ScheduledReport> {
    const [created] = await db.insert(scheduledReports)
      .values(data)
      .returning();
    return created;
  }

  async updateScheduledReport(id: number, data: Partial<InsertScheduledReport>): Promise<ScheduledReport | undefined> {
    const [updated] = await db.update(scheduledReports)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(scheduledReports.id, id))
      .returning();
    return updated;
  }

  async deleteScheduledReport(id: number): Promise<boolean> {
    const result = await db.delete(scheduledReports)
      .where(eq(scheduledReports.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateScheduledReportLastSent(reportId: number): Promise<void> {
    await db.update(scheduledReports)
      .set({ lastSentAt: new Date() })
      .where(eq(scheduledReports.id, reportId));
  }

  async getScheduledReportsDue(): Promise<ScheduledReport[]> {
    // Get all enabled scheduled reports
    const results = await db.select()
      .from(scheduledReports)
      .where(eq(scheduledReports.enabled, true));
    return results;
  }

  async getAllScheduledReports(): Promise<ScheduledReport[]> {
    // Get all scheduled report settings for admin view
    return await db.select().from(scheduledReports);
  }

  async getOrganisationsWithScheduledReportsDisabled(): Promise<number[]> {
    // Get organisation IDs where scheduled reports are disabled
    const results = await db.select({ id: organisations.id })
      .from(organisations)
      .where(eq(organisations.scheduledReportsEnabled, false));
    return results.map(r => r.id);
  }

  async getInactiveCases(minDaysInactive: number, activeFrom: Date): Promise<{
    caseId: number;
    caseName: string;
    accountNumber: string;
    organisationId: number;
    assignedTo: string | null;
    outstandingAmount: string;
    status: string;
    stage: string;
    lastActivityDate: Date;
    daysInactive: number;
  }[]> {
    const cutoffDate = new Date(Date.now() - minDaysInactive * 24 * 60 * 60 * 1000);

    const rows = await db.execute(sql`
      WITH case_last_activity AS (
        SELECT
          c.id                    AS case_id,
          c.case_name,
          c.account_number,
          c.organisation_id,
          c.assigned_to,
          c.outstanding_amount,
          c.status,
          c.stage,
          GREATEST(
            (SELECT MAX(ca.created_at)    FROM case_activities ca WHERE ca.case_id = c.id),
            (SELECT MAX(m.created_at)     FROM messages m          WHERE m.case_id  = c.id),
            (SELECT MAX(p.payment_date)   FROM payments p          WHERE p.case_id  = c.id),
            (SELECT MAX(d.created_at)     FROM documents d         WHERE d.case_id  = c.id)
          ) AS last_activity_date
        FROM cases c
        WHERE LOWER(c.status) = 'active'
          AND (c.is_archived = false OR c.is_archived IS NULL)
      )
      SELECT * FROM case_last_activity
      WHERE last_activity_date < ${cutoffDate}
      ORDER BY last_activity_date ASC
    `);

    const now = new Date();
    return (rows.rows as any[]).map(r => ({
      caseId:           Number(r.case_id),
      caseName:         String(r.case_name),
      accountNumber:    String(r.account_number),
      organisationId:   Number(r.organisation_id),
      assignedTo:       r.assigned_to ? String(r.assigned_to) : null,
      outstandingAmount: String(r.outstanding_amount),
      status:           String(r.status),
      stage:            String(r.stage),
      lastActivityDate: new Date(r.last_activity_date),
      daysInactive:     Math.floor((now.getTime() - new Date(r.last_activity_date).getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  async getLatestCaseActivitiesBatch(caseIds: number[]): Promise<Map<number, { description: string; code: string; createdAt: Date }>> {
    if (caseIds.length === 0) return new Map();

    const all = await db
      .select({ caseId: caseActivities.caseId, description: caseActivities.description, createdAt: caseActivities.createdAt })
      .from(caseActivities)
      .where(inArray(caseActivities.caseId, caseIds))
      .orderBy(desc(caseActivities.createdAt));

    const result = new Map<number, { description: string; code: string; createdAt: Date }>();
    for (const r of all) {
      if (result.has(r.caseId)) continue;
      const codeMatch = r.description.match(/\b(TL\d{4})\b/);
      result.set(r.caseId, {
        description: r.description,
        code: codeMatch ? codeMatch[1] : '',
        createdAt: r.createdAt ?? new Date(),
      });
    }
    return result;
  }

  async getUniqueActivityDescriptions(): Promise<string[]> {
    const rows = await db.execute(sql`
      SELECT MIN(description) AS description
      FROM case_activities
      WHERE description IS NOT NULL
        AND description != ''
      GROUP BY LOWER(description)
      ORDER BY LOWER(MIN(description)) ASC
    `);
    return (rows.rows as any[]).map(r => String(r.description));
  }

  async getCasesStuckAtActivity(descriptions: string[], minDays: number): Promise<{
    caseId: number;
    caseName: string;
    accountNumber: string;
    organisationId: number;
    assignedTo: string | null;
    outstandingAmount: string;
    status: string;
    stage: string;
    lastActivityDescription: string;
    lastActivityDate: Date;
    daysSinceActivity: number;
  }[]> {
    if (descriptions.length === 0) return [];

    const cutoffDate = new Date(Date.now() - minDays * 24 * 60 * 60 * 1000);

    const lowerDescriptions = descriptions.map(d => d.toLowerCase());

    // Build an IN list of individual bound parameters — Neon's serverless driver
    // doesn't support PostgreSQL array parameters in raw sql templates, so we
    // avoid = ANY(${array}) and use IN ($1, $2, …) instead.
    const descList = sql.join(lowerDescriptions.map(d => sql`${d}`), sql`, `);

    const rows = await db.execute(sql`
      WITH latest_activity AS (
        SELECT DISTINCT ON (ca.case_id)
          ca.case_id,
          ca.description,
          ca.created_at
        FROM case_activities ca
        ORDER BY ca.case_id, ca.created_at DESC
      )
      SELECT
        c.id              AS case_id,
        c.case_name,
        c.account_number,
        c.organisation_id,
        c.assigned_to,
        c.outstanding_amount,
        c.status,
        c.stage,
        la.description    AS last_activity_description,
        la.created_at     AS last_activity_date
      FROM cases c
      JOIN latest_activity la ON la.case_id = c.id
      WHERE LOWER(c.status) = 'active'
        AND (c.is_archived = false OR c.is_archived IS NULL)
        AND LOWER(la.description) IN (${descList})
        AND la.created_at < ${cutoffDate}
      ORDER BY la.created_at ASC
    `);

    const now = new Date();
    return (rows.rows as any[]).map(r => ({
      caseId:                  Number(r.case_id),
      caseName:                String(r.case_name),
      accountNumber:           String(r.account_number),
      organisationId:          Number(r.organisation_id),
      assignedTo:              r.assigned_to ? String(r.assigned_to) : null,
      outstandingAmount:       String(r.outstanding_amount),
      status:                  String(r.status),
      stage:                   String(r.stage),
      lastActivityDescription: String(r.last_activity_description),
      lastActivityDate:        new Date(r.last_activity_date),
      daysSinceActivity:       Math.floor((now.getTime() - new Date(r.last_activity_date).getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  async getLastMessagesBatch(caseIds: number[], limit = 3, adminOnly = false): Promise<Map<number, Array<{ sender: string; isAdmin: boolean; subject: string | null; content: string; createdAt: Date }>>> {
    if (caseIds.length === 0) return new Map();

    const baseWhere = inArray(messages.caseId, caseIds);
    const whereClause = adminOnly
      ? and(baseWhere, or(eq(users.isAdmin, true), eq(users.email, ACCLAIM_SYSTEM_EMAIL)))
      : baseWhere;

    const all = await db
      .select({
        caseId:    messages.caseId,
        content:   messages.content,
        subject:   messages.subject,
        createdAt: messages.createdAt,
        firstName: users.firstName,
        lastName:  users.lastName,
        isAdmin:   users.isAdmin,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(whereClause)
      .orderBy(desc(messages.createdAt));

    const countByCaseId = new Map<number, number>();
    const result = new Map<number, Array<{ sender: string; isAdmin: boolean; subject: string | null; content: string; createdAt: Date }>>();
    for (const r of all) {
      if (r.caseId === null) continue;
      const count = countByCaseId.get(r.caseId) ?? 0;
      if (count >= limit) continue;
      countByCaseId.set(r.caseId, count + 1);
      if (!result.has(r.caseId)) result.set(r.caseId, []);
      result.get(r.caseId)!.unshift({
        sender:    `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || 'Unknown',
        isAdmin:   r.isAdmin ?? false,
        subject:   r.subject ?? null,
        content:   r.content,
        createdAt: r.createdAt ?? new Date(),
      });
    }
    return result;
  }
}

export const storage = new DatabaseStorage();
