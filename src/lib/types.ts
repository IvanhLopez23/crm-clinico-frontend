export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "arrived"
  | "in_consultation"
  | "completed"
  | "cancelled"
  | "no_show";

export type Appointment = {
  id: string;
  patientId: string;
  practitionerId: string;
  serviceId: string | null;
  householdId: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: AppointmentStatus;
  bookedVia: string;
  isOverbooking: boolean;
  serviceNameSnapshot: string | null;
  durationMinutesSnapshot: number | null;
  bufferAfterMinutesSnapshot: number;
  priceCentsSnapshot: number;
  currencySnapshot: string | null;
  checkedInAt: string | null;
  roomedAt: string | null;
  consultStartedAt: string | null;
  consultEndedAt: string | null;
  checkedOutAt: string | null;
  noShowMarkedAt: string | null;
  overbookingReason: string | null;
  patientFirstName: string;
  patientLastName: string;
  practitionerName: string;
};

export type Practitioner = {
  id: string;
  fullName: string;
  specialty: string | null;
  color?: string;
  defaultSlotMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  isAcceptingNewPatients?: boolean;
  isActive?: boolean;
  createdAt?: string;
};

export type AvailabilityRule = {
  id: string;
  clinicId: string;
  practitionerId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validTo: string | null;
  slotMinutes: number;
  label: string | null;
  createdAt: string;
};

export type ScheduleBlock = {
  id: string;
  clinicId: string;
  practitionerId: string;
  startsAt: string;
  endsAt: string;
  type: string;
  reason: string | null;
  createdAt: string;
};

export type Specialty = {
  id: string;
  clinicId: string;
  code: string;
  name: string;
  createdAt: string;
};

export type SystemUser = {
  id: string;
  email: string;
  fullName: string;
  avatarData: string | null;
  role: "admin" | "practitioner" | "receptionist";
  practitionerId: string | null;
  practitionerName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type Service = {
  id: string;
  code: string;
  name: string;
  specialtyId: string | null;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  priceCents: number;
  currency: string;
  isActive: boolean;
  color: string | null;
};

export type PractitionerService = {
  id: string;
  practitionerId: string;
  serviceId: string;
  name: string;
  code: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  isActive: boolean;
};

export type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  usersCount: number;
  practitionersCount: number;
  patientsCount: number;
  appointmentsCount: number;
  contractCount: number;
  contractEndsAt: string | null;
  contractStatus: "none" | "active" | "expiring" | "expired" | "inactive";
  contractDaysLeft: number | null;
};

export type TenantUser = {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "practitioner" | "receptionist";
  practitionerId: string | null;
  practitionerName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type TenantDetail = TenantSummary & {
  users: TenantUser[];
  practitioners: Array<{ id: string; fullName: string; isActive: boolean }>;
};

export type TenantContract = {
  id: string;
  clinicId: string;
  name: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReminderJob = {
  id: string;
  appointmentId: string;
  patientId: string;
  patientFirstName: string;
  patientLastName: string;
  practitionerName: string;
  channel: string;
  templateCode: string;
  scheduledFor: string;
  status: "pending" | "processing" | "sent" | "failed" | "cancelled";
  attempts: number;
  lastAttemptAt: string | null;
  sentAt: string | null;
  errorCode: string | null;
  appointmentStartsAt: string;
};

export type WaitlistEntry = {
  id: string;
  patientId: string;
  patientFirstName: string;
  patientLastName: string;
  practitionerId: string | null;
  practitionerName: string | null;
  earliestDate: string;
  latestDate: string;
  preferredTimeFrom: string | null;
  preferredTimeTo: string | null;
  priority: number;
  status: "waiting" | "offered" | "booked" | "expired" | "cancelled";
  notes: string | null;
  createdAt: string;
};

export type WaitlistOffer = {
  id: string;
  entryId: string;
  patientId: string;
  patientFirstName: string;
  patientLastName: string;
  practitionerId: string;
  practitionerName: string;
  startsAt: string;
  endsAt: string;
  status: "pending" | "accepted" | "expired" | "declined" | "superseded";
  expiresAt: string;
  appointmentId: string | null;
  createdAt: string;
};

export type AppointmentPayment = {
  id: string;
  appointmentId: string;
  amountCents: number;
  currency: string;
  method: "cash" | "card" | "transfer" | "other";
  status: "paid" | "refunded" | "void";
  paidAt: string;
  notes: string | null;
};

export type PublicClinicData = {
  clinic: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    currency: string;
  };
  services: Array<{
    id: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
    currency: string;
  }>;
  practitioners: Array<{
    id: string;
    fullName: string;
    specialty: string | null;
  }>;
  assignments: Array<{
    practitionerId: string;
    serviceId: string;
    durationMinutes: number;
    priceCents: number;
    currency: string;
  }>;
};

export type AvailabilitySlot = {
  startsAt: string;
  endsAt: string;
};

export type AvailabilityResponse = {
  timezone: string;
  slots: AvailabilitySlot[];
  service?: {
    id: string;
    name: string;
    priceCents: number;
    currency: string;
    depositRequiredCents: number;
  };
};

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: {
    appointmentId?: string;
    patientId?: string;
    patientName?: string;
    serviceName?: string;
    startsAt?: string;
    endsAt?: string;
  };
  readAt: string | null;
  createdAt: string;
};

export type NotificationsResponse = {
  items: AppNotification[];
  unreadCount: number;
};

export type PatientSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  birthDate: string | null;
  status: string;
  householdId: string | null;
  phoneMasked: string | null;
  emailMasked: string | null;
};

export type ContactView = {
  id: string;
  ownerType: string;
  kind: string;
  valueMasked: string;
  isPrimary: boolean;
  isVerified: boolean;
  transactionalOptIn: boolean;
  marketingOptIn: boolean;
  optOutAt: string | null;
};

export type AllergyView = {
  id: string;
  allergen: string;
  severity: string;
  isActive: boolean;
  verifiedAt: string | null;
  reaction?: string | null;
  notes?: string | null;
};

export type TagView = {
  id: string;
  code: string;
  label: string;
  category: string;
  color: string | null;
  isAlert: boolean;
  severity: number;
  expiresAt: string | null;
};

export type GuardianView = {
  id: string;
  guardianPatientId: string | null;
  name: string | null;
  phoneMasked: string | null;
  relationship: string;
  isLegalGuardian: boolean;
  validFrom: string;
  validTo: string | null;
};

export type PatientDetail = {
  id: string;
  clinicId: string;
  householdId: string | null;
  relationship: string;
  isAccountHolder: boolean;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  birthDate: string | null;
  documentType: string | null;
  documentMasked: string | null;
  sexAtBirth: string | null;
  genderIdentity: string | null;
  bloodType: string | null;
  preferredLanguage: string;
  status: string;
  reminderOptOut: boolean;
  marketingOptIn: boolean;
  source: string | null;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  createdAt: string;
  updatedAt: string;
  household: { id: string; name: string; billingPatientId: string | null } | null;
  contacts: ContactView[];
  allergies: AllergyView[];
  tags: TagView[];
  guardians: GuardianView[];
};

export type HouseholdDetail = {
  id: string;
  name: string;
  billingPatientId: string | null;
  preferredChannel: string;
  members: PatientSearchResult[];
  contacts: ContactView[];
};

export type WaitingRoomLevel = "green" | "amber" | "red";

export type WaitingRoomItem = {
  appointmentId: string;
  patientId: string;
  patientFirstName: string;
  patientLastName: string;
  practitionerId: string;
  practitionerName: string;
  practitionerColor: string;
  serviceName: string | null;
  status: string;
  scheduledAt: string;
  checkedInAt: string | null;
  roomedAt: string | null;
  consultStartedAt: string | null;
  waitMinutes: number;
  delayMinutes: number;
  expectedConsultMinutes: number;
  level: WaitingRoomLevel;
  levelReason: string;
  allergyAlert: boolean;
};

export type WaitingRoomResponse = {
  generatedAt: string;
  timezone: string;
  date: string;
  inRoom: WaitingRoomItem[];
  inConsultation: WaitingRoomItem[];
  upcoming: WaitingRoomItem[];
  practitionerStatus: Array<{
    practitionerId: string;
    practitionerName: string;
    color: string;
    delayMinutes: number;
    level: WaitingRoomLevel;
    waitingCount: number;
  }>;
};
