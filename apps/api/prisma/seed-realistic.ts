import { PrismaClient, AgeGroup, AppointmentStatus, AppointmentSource, PaymentStatus, PaymentMethod, PaymentProvider, CommunicationChannel, CommunicationStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { PERMISSIONS, ROLE_NAMES } from "@citydental/types";

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  OWNER: [...PERMISSIONS],
  ORG_ADMIN: PERMISSIONS.filter((p) => p !== "organization:manage"),
  LOCATION_ADMIN: ["location:read","location:manage","user:read","patient:read","patient:create","patient:update","doctor:read","appointment:read","appointment:create","appointment:update","appointment:cancel","audit:read"],
  DOCTOR: ["patient:read","doctor:read","appointment:read","appointment:update","location:read"],
  RECEPTIONIST: ["patient:read","patient:create","patient:update","appointment:read","appointment:create","appointment:update","appointment:cancel","location:read","doctor:read"],
  ACCOUNTANT: ["patient:read","appointment:read","audit:read","organization:read","location:read"],
  PATIENT: ["patient:read","appointment:read"],
};

const prisma = new PrismaClient();

async function main() {
  console.log("Starting realistic seed for citydental_dev...");
  const org = await prisma.organization.upsert({
    where: { slug: "citydental" },
    update: { name: "City Dental", timezone: "Asia/Kolkata" },
    create: { name: "City Dental", slug: "citydental", timezone: "Asia/Kolkata" },
  });

  // Locations: upsert 3
  const locData = [
    { code: "main", name: "Main Clinic - Yadav Market", addressLine1: "Shop No. 5, Yadav Market, MG Road", city: "Etah", state: "Uttar Pradesh", postalCode: "207001", phone: "+91 94151 92948", email: "citydentalEtah@gmail.com" },
    { code: "civil", name: "Civil Lines Branch", addressLine1: "12, Civil Lines", city: "Etah", state: "Uttar Pradesh", postalCode: "207001", phone: "+91 94151 92949", email: "civil@citydental.local" },
    { code: "agra", name: "Agra Road Clinic", addressLine1: "45, Agra Road", city: "Etah", state: "Uttar Pradesh", postalCode: "207002", phone: "+91 94151 92950", email: "agra@citydental.local" },
  ];
  const locations: Record<string, typeof locData[0] & { id: string }> = {} as never;
  for (const l of locData) {
    const loc = await prisma.location.upsert({
      where: { organizationId_code: { organizationId: org.id, code: l.code! } },
      update: { name: l.name, addressLine1: l.addressLine1, city: l.city, state: l.state, postalCode: l.postalCode, phone: l.phone, email: l.email, status: "ACTIVE" },
      create: { organizationId: org.id, ...l, status: "ACTIVE" },
    });
    locations[l.code!] = loc as never;
  }
  console.log(`Locations: ${Object.keys(locations).join(", ")}`);

  // Permissions & Roles
  for (const code of PERMISSIONS) await prisma.permission.upsert({ where: { code }, update: {}, create: { code, description: code } });
  for (const roleName of ROLE_NAMES) {
    const role = await prisma.role.upsert({
      where: { organizationId_name: { organizationId: org.id, name: roleName } },
      update: { isSystem: true },
      create: { organizationId: org.id, name: roleName, isSystem: true, description: `${roleName} system role` },
    });
    const codes = ROLE_PERMISSION_MAP[roleName] ?? [];
    for (const code of codes) {
      const perm = await prisma.permission.findUnique({ where: { code } });
      if (!perm) continue;
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } }, update: {}, create: { roleId: role.id, permissionId: perm.id } });
    }
  }

  // Clean existing transactional data (keep org, locations, permissions, roles)
  console.log("Cleaning existing transactional data...");
  await prisma.payment.deleteMany({ where: { organizationId: org.id } });
  await prisma.communication.deleteMany({ where: { organizationId: org.id } });
  await prisma.auditLog.deleteMany({ where: { organizationId: org.id } });
  await prisma.appointment.deleteMany({ where: { organizationId: org.id } });
  await prisma.doctorSpecialty.deleteMany({});
  await prisma.patient.deleteMany({ where: { organizationId: org.id } });
  // Keep admin user, delete others except admin
  const adminEmail = "admin@citydental.local";
  await prisma.userRole.deleteMany({ where: { user: { organizationId: org.id, email: { not: adminEmail } } } });
  await prisma.doctor.deleteMany({ where: { organizationId: org.id } });
  await prisma.user.deleteMany({ where: { organizationId: org.id, email: { not: adminEmail } } });

  // Ensure admin exists
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const hash = await bcrypt.hash("CityDentalAdmin1", 10);
    admin = await prisma.user.create({ data: { organizationId: org.id, email: adminEmail, passwordHash: hash, firstName: "Admin", lastName: "CityDental", isSuperAdmin: true, status: "ACTIVE" } });
    const ownerRole = await prisma.role.findUnique({ where: { organizationId_name: { organizationId: org.id, name: "OWNER" } } });
    if (ownerRole) await prisma.userRole.create({ data: { userId: admin.id, roleId: ownerRole.id } });
    console.log("Created admin");
  }

  // Create additional users with roles
  const usersData = [
    { email: "reception@citydental.local", firstName: "Sunita", lastName: "Sharma", phone: "+91 98765 43210", role: "RECEPTIONIST", location: "main", password: "Reception123" },
    { email: "dr.kamlesh@citydental.local", firstName: "Kamlesh", lastName: "Yadav", phone: "+91 94151 92948", role: "DOCTOR", location: "main", password: "DoctorPass123" },
    { email: "dr.priya@citydental.local", firstName: "Priya", lastName: "Singh", phone: "+91 98765 43211", role: "DOCTOR", location: "civil", password: "DoctorPass123" },
    { email: "locadmin@citydental.local", firstName: "Ramesh", lastName: "Verma", phone: "+91 98765 43212", role: "LOCATION_ADMIN", location: "civil", password: "LocAdmin123" },
    { email: "orgadmin@citydental.local", firstName: "Anil", lastName: "Kumar", phone: "+91 98765 43213", role: "ORG_ADMIN", location: null, password: "OrgAdmin123" },
    { email: "accountant@citydental.local", firstName: "Meena", lastName: "Gupta", phone: "+91 98765 43214", role: "ACCOUNTANT", location: null, password: "Account1234" },
  ];
  const createdUsers: Record<string, { id: string; email: string }> = {};
  for (const u of usersData) {
    const hash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.create({ data: { organizationId: org.id, email: u.email, passwordHash: hash, firstName: u.firstName, lastName: u.lastName, phone: u.phone, status: "ACTIVE" } });
    createdUsers[u.email] = user;
    const role = await prisma.role.findUnique({ where: { organizationId_name: { organizationId: org.id, name: u.role } } });
    if (role) await prisma.userRole.create({ data: { userId: user.id, roleId: role.id, locationId: u.location ? locations[u.location].id : null } });
    console.log(`User ${u.email} -> ${u.role} @ ${u.location ?? "org"}`);
  }

  // Doctors: 5 doctors, link some to users
  const doctorsData = [
    { firstName: "Kamlesh", lastName: "Yadav", email: "dr.kamlesh@citydental.local", phone: "+91 94151 92948", licenseNumber: "DCI-UP-12345", qualifications: "BDS, MDS - Oral Surgery", specialties: ["Oral Surgery", "General Dentistry"], location: "main", userEmail: "dr.kamlesh@citydental.local" },
    { firstName: "Priya", lastName: "Singh", email: "dr.priya@citydental.local", phone: "+91 98765 43211", licenseNumber: "DCI-UP-12346", qualifications: "BDS, MDS - Orthodontics", specialties: ["Orthodontics", "General Dentistry"], location: "civil", userEmail: "dr.priya@citydental.local" },
    { firstName: "Amit", lastName: "Verma", email: "dr.amit@citydental.local", phone: "+91 98765 43215", licenseNumber: "DCI-UP-12347", qualifications: "BDS, MDS - Endodontics", specialties: ["Endodontics", "Conservative Dentistry"], location: "main", userEmail: null },
    { firstName: "Sneha", lastName: "Reddy", email: "dr.sneha@citydental.local", phone: "+91 98765 43216", licenseNumber: "DCI-UP-12348", qualifications: "BDS, MDS - Pedodontics", specialties: ["Pedodontics", "Preventive Dentistry"], location: "agra", userEmail: null },
    { firstName: "Vikram", lastName: "Sharma", email: "dr.vikram@citydental.local", phone: "+91 98765 43217", licenseNumber: "DCI-UP-12349", qualifications: "BDS, MDS - Prosthodontics", specialties: ["Prosthodontics", "Geriatric Dentistry"], location: "civil", userEmail: null },
  ];
  const doctors: Record<string, { id: string }> = {};
  for (const d of doctorsData) {
    const userId = d.userEmail ? createdUsers[d.userEmail]?.id ?? null : null;
    // Also check if doctor user exists via dr.kamlesh etc.
    const docUser = d.userEmail ? await prisma.user.findUnique({ where: { email: d.userEmail } }) : null;
    const doctor = await prisma.doctor.create({
      data: {
        organizationId: org.id,
        userId: docUser?.id ?? null,
        primaryLocationId: locations[d.location].id,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phone: d.phone,
        licenseNumber: d.licenseNumber,
        qualifications: d.qualifications,
        status: "ACTIVE",
        specialties: { create: d.specialties.map((name) => ({ name })) },
      },
    });
    doctors[d.email] = doctor;
    console.log(`Doctor ${d.firstName} ${d.lastName} @ ${d.location}`);
  }

  // Patients: 18 patients across age groups and locations
  const patientsData = [
    { firstName: "Aarav", lastName: "Sharma", ageGroup: "CHILD" as AgeGroup, gender: "MALE", phone: "+91 98765 10001", email: "aarav.sharma@test.local", city: "Etah", location: "main", patientNumber: "PAT-0001" },
    { firstName: "Anaya", lastName: "Verma", ageGroup: "CHILD" as AgeGroup, gender: "FEMALE", phone: "+91 98765 10002", email: "anaya.verma@test.local", city: "Etah", location: "main", patientNumber: "PAT-0002" },
    { firstName: "Kabir", lastName: "Gupta", ageGroup: "CHILD" as AgeGroup, gender: "MALE", phone: "+91 98765 10003", email: "kabir.gupta@test.local", city: "Etah", location: "civil", patientNumber: "PAT-0003" },
    { firstName: "Diya", lastName: "Singh", ageGroup: "CHILD" as AgeGroup, gender: "FEMALE", phone: "+91 98765 10004", email: "diya.singh@test.local", city: "Etah", location: "agra", patientNumber: "PAT-0004" },
    { firstName: "Rohan", lastName: "Yadav", ageGroup: "ADULT" as AgeGroup, gender: "MALE", phone: "+91 98765 10005", email: "rohan.yadav@test.local", city: "Etah", location: "main", patientNumber: "PAT-0005" },
    { firstName: "Priya", lastName: "Kumar", ageGroup: "ADULT" as AgeGroup, gender: "FEMALE", phone: "+91 98765 10006", email: "priya.kumar@test.local", city: "Etah", location: "civil", patientNumber: "PAT-0006" },
    { firstName: "Amit", lastName: "Sharma", ageGroup: "ADULT" as AgeGroup, gender: "MALE", phone: "+91 98765 10007", email: "amit.sharma@test.local", city: "Etah", location: "main", patientNumber: "PAT-0007" },
    { firstName: "Neha", lastName: "Reddy", ageGroup: "ADULT" as AgeGroup, gender: "FEMALE", phone: "+91 98765 10008", email: "neha.reddy@test.local", city: "Agra", location: "agra", patientNumber: "PAT-0008" },
    { firstName: "Vikram", lastName: "Patel", ageGroup: "ADULT" as AgeGroup, gender: "MALE", phone: "+91 98765 10009", email: "vikram.patel@test.local", city: "Etah", location: "civil", patientNumber: "PAT-0009" },
    { firstName: "Sneha", lastName: "Mishra", ageGroup: "ADULT" as AgeGroup, gender: "FEMALE", phone: "+91 98765 10010", email: "sneha.mishra@test.local", city: "Etah", location: "main", patientNumber: "PAT-0010" },
    { firstName: "Rajesh", lastName: "Verma", ageGroup: "SENIOR" as AgeGroup, gender: "MALE", phone: "+91 98765 10011", email: "rajesh.verma@test.local", city: "Etah", location: "main", patientNumber: "PAT-0011" },
    { firstName: "Sunita", lastName: "Devi", ageGroup: "SENIOR" as AgeGroup, gender: "FEMALE", phone: "+91 98765 10012", email: "sunita.devi@test.local", city: "Etah", location: "civil", patientNumber: "PAT-0012" },
    { firstName: "Harish", lastName: "Kumar", ageGroup: "SENIOR" as AgeGroup, gender: "MALE", phone: "+91 98765 10013", email: "harish.kumar@test.local", city: "Etah", location: "agra", patientNumber: "PAT-0013" },
    { firstName: "Kamla", lastName: "Devi", ageGroup: "SENIOR" as AgeGroup, gender: "FEMALE", phone: "+91 98765 10014", email: "kamla.devi@test.local", city: "Etah", location: "main", patientNumber: "PAT-0014" },
    { firstName: "Arjun", lastName: "Singh", ageGroup: "ADULT" as AgeGroup, gender: "MALE", phone: "+91 98765 10015", email: "arjun.singh@test.local", city: "Etah", location: "civil", patientNumber: "PAT-0015" },
    { firstName: "Pooja", lastName: "Sharma", ageGroup: "ADULT" as AgeGroup, gender: "FEMALE", phone: "+91 98765 10016", email: "pooja.sharma@test.local", city: "Etah", location: "main", patientNumber: "PAT-0016" },
    { firstName: "Aarohi", lastName: "Gupta", ageGroup: "CHILD" as AgeGroup, gender: "FEMALE", phone: "+91 98765 10017", email: "aarohi.gupta@test.local", city: "Etah", location: "agra", patientNumber: "PAT-0017" },
    { firstName: "Dev", lastName: "Yadav", ageGroup: "SENIOR" as AgeGroup, gender: "MALE", phone: "+91 98765 10018", email: "dev.yadav@test.local", city: "Etah", location: "civil", patientNumber: "PAT-0018" },
  ];
  const patients: Record<string, { id: string; ageGroup: AgeGroup | null }> = {};
  for (const p of patientsData) {
    const created = await prisma.patient.create({
      data: {
        organizationId: org.id,
        primaryLocationId: locations[p.location].id,
        patientNumber: p.patientNumber,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.ageGroup === "CHILD" ? new Date("2018-05-10") : p.ageGroup === "SENIOR" ? new Date("1955-03-12") : new Date("1990-07-20"),
        gender: p.gender,
        email: p.email,
        phone: p.phone,
        addressLine1: "12, Test Street",
        city: p.city,
        state: "Uttar Pradesh",
        postalCode: "207001",
        status: "ACTIVE",
        ageGroup: p.ageGroup,
      },
    });
    patients[p.patientNumber] = created;
  }
  console.log(`Patients: ${Object.keys(patients).length}`);

  // Appointments: 22 appointments across statuses, dates, doctors, no double booking
  const feeMap: Record<AgeGroup, number> = { CHILD: 400, ADULT: 500, SENIOR: 450 };
  const doctorList = Object.values(doctors);
  const patientList = Object.values(patients);
  const locKeys = Object.keys(locations);
  const statuses: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"];
  const now = new Date();
  const appointmentsData: Array<{ patientNumber: string; doctorIdx: number; locationCode: string; daysOffset: number; hour: number; status: AppointmentStatus; ageGroup: AgeGroup; source: AppointmentSource }> = [
    { patientNumber: "PAT-0001", doctorIdx: 3, locationCode: "agra", daysOffset: 1, hour: 10, status: "SCHEDULED", ageGroup: "CHILD", source: "PATIENT_PORTAL" },
    { patientNumber: "PAT-0005", doctorIdx: 0, locationCode: "main", daysOffset: 1, hour: 11, status: "CONFIRMED", ageGroup: "ADULT", source: "STAFF" },
    { patientNumber: "PAT-0006", doctorIdx: 1, locationCode: "civil", daysOffset: 2, hour: 9, status: "SCHEDULED", ageGroup: "ADULT", source: "PHONE" },
    { patientNumber: "PAT-0002", doctorIdx: 3, locationCode: "agra", daysOffset: -2, hour: 14, status: "COMPLETED", ageGroup: "CHILD", source: "STAFF" },
    { patientNumber: "PAT-0011", doctorIdx: 4, locationCode: "civil", daysOffset: 3, hour: 15, status: "SCHEDULED", ageGroup: "SENIOR", source: "WALK_IN" },
    { patientNumber: "PAT-0007", doctorIdx: 2, locationCode: "main", daysOffset: -1, hour: 10, status: "COMPLETED", ageGroup: "ADULT", source: "STAFF" },
    { patientNumber: "PAT-0012", doctorIdx: 4, locationCode: "civil", daysOffset: 0, hour: 11, status: "CHECKED_IN", ageGroup: "SENIOR", source: "STAFF" },
    { patientNumber: "PAT-0008", doctorIdx: 1, locationCode: "civil", daysOffset: 5, hour: 10, status: "SCHEDULED", ageGroup: "ADULT", source: "PATIENT_PORTAL" },
    { patientNumber: "PAT-0003", doctorIdx: 3, locationCode: "agra", daysOffset: 2, hour: 11, status: "CANCELLED", ageGroup: "CHILD", source: "PHONE" },
    { patientNumber: "PAT-0009", doctorIdx: 0, locationCode: "main", daysOffset: -3, hour: 9, status: "NO_SHOW", ageGroup: "ADULT", source: "STAFF" },
    { patientNumber: "PAT-0010", doctorIdx: 2, locationCode: "main", daysOffset: 4, hour: 14, status: "CONFIRMED", ageGroup: "ADULT", source: "STAFF" },
    { patientNumber: "PAT-0013", doctorIdx: 4, locationCode: "agra", daysOffset: 6, hour: 10, status: "SCHEDULED", ageGroup: "SENIOR", source: "WALK_IN" },
    { patientNumber: "PAT-0014", doctorIdx: 0, locationCode: "main", daysOffset: 7, hour: 9, status: "SCHEDULED", ageGroup: "SENIOR", source: "PATIENT_PORTAL" },
    { patientNumber: "PAT-0015", doctorIdx: 1, locationCode: "civil", daysOffset: -5, hour: 15, status: "COMPLETED", ageGroup: "ADULT", source: "STAFF" },
    { patientNumber: "PAT-0016", doctorIdx: 2, locationCode: "main", daysOffset: 1, hour: 15, status: "CANCELLED", ageGroup: "ADULT", source: "PHONE" },
    { patientNumber: "PAT-0017", doctorIdx: 3, locationCode: "agra", daysOffset: 3, hour: 9, status: "SCHEDULED", ageGroup: "CHILD", source: "PATIENT_PORTAL" },
    { patientNumber: "PAT-0018", doctorIdx: 4, locationCode: "civil", daysOffset: -7, hour: 10, status: "COMPLETED", ageGroup: "SENIOR", source: "STAFF" },
    { patientNumber: "PAT-0004", doctorIdx: 3, locationCode: "agra", daysOffset: 8, hour: 11, status: "SCHEDULED", ageGroup: "CHILD", source: "WALK_IN" },
    { patientNumber: "PAT-0005", doctorIdx: 0, locationCode: "main", daysOffset: 2, hour: 14, status: "CONFIRMED", ageGroup: "ADULT", source: "STAFF" },
    { patientNumber: "PAT-0006", doctorIdx: 1, locationCode: "civil", daysOffset: 0, hour: 16, status: "SCHEDULED", ageGroup: "ADULT", source: "STAFF" },
  ];

  const createdAppointments: Array<{ id: string; status: AppointmentStatus; amount: number }> = [];
  for (let i = 0; i < appointmentsData.length; i++) {
    const a = appointmentsData[i];
    const patient = patients[a.patientNumber];
    const doctor = doctorList[a.doctorIdx];
    const loc = locations[a.locationCode];
    const start = new Date(now);
    start.setDate(now.getDate() + a.daysOffset);
    start.setHours(a.hour, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    // Avoid double booking: if overlap, shift by 30 min
    const overlap = await prisma.appointment.findFirst({ where: { doctorId: doctor.id, status: { in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"] }, scheduledStart: { lt: end }, scheduledEnd: { gt: start } } });
    const finalStart = overlap ? new Date(start.getTime() + 60 * 60 * 1000) : start;
    const finalEnd = new Date(finalStart.getTime() + 30 * 60 * 1000);
    const appt = await prisma.appointment.create({
      data: {
        organizationId: org.id,
        locationId: loc.id,
        patientId: patient.id,
        doctorId: doctor.id,
        scheduledStart: finalStart,
        scheduledEnd: finalEnd,
        status: a.status,
        source: a.source,
        ageGroup: a.ageGroup,
        reason: `Consultation for ${a.ageGroup.toLowerCase()}`,
        createdById: admin.id,
        cancelledAt: a.status === "CANCELLED" ? new Date() : null,
      },
    });
    createdAppointments.push({ id: appt.id, status: a.status, amount: feeMap[a.ageGroup] });
    await prisma.auditLog.create({ data: { organizationId: org.id, actorUserId: admin.id, action: "CREATE", resourceType: "Appointment", resourceId: appt.id, metadata: { ageGroup: a.ageGroup, status: a.status } } });
  }
  console.log(`Appointments: ${createdAppointments.length}`);

  // Payments: for each appointment, create payment with appropriate status
  for (const appt of createdAppointments) {
    const fullAppt = await prisma.appointment.findUnique({ where: { id: appt.id }, include: { patient: true } });
    if (!fullAppt) continue;
    let paymentStatus: PaymentStatus = "PENDING";
    let method: PaymentMethod = appt.amount === 400 ? "UPI" : appt.amount === 450 ? "UPI_QR" : "ONLINE";
    if (["CONFIRMED", "CHECKED_IN", "COMPLETED"].includes(fullAppt.status)) paymentStatus = "PAID";
    else if (fullAppt.status === "CANCELLED") paymentStatus = "CANCELLED";
    else if (fullAppt.status === "NO_SHOW") paymentStatus = "FAILED";
    else if (fullAppt.status === "SCHEDULED" && Math.random() > 0.5) { paymentStatus = "PENDING"; method = "ONLINE"; }
    const provider: PaymentProvider = paymentStatus === "PAID" ? "MOCK" : "MOCK";
    const providerOrderId = `order_${appt.id.slice(0, 8)}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const payment = await prisma.payment.create({
      data: {
        organizationId: org.id,
        patientId: fullAppt.patientId,
        appointmentId: fullAppt.id,
        amount: appt.amount,
        currency: "INR",
        status: paymentStatus,
        method,
        provider,
        providerOrderId,
        providerPaymentId: paymentStatus === "PAID" ? `pay_${appt.id.slice(0, 8)}` : null,
        paidAt: paymentStatus === "PAID" ? new Date() : null,
        failureReason: paymentStatus === "FAILED" ? "Insufficient funds" : null,
      },
    });
    await prisma.auditLog.create({ data: { organizationId: org.id, actorUserId: admin.id, action: paymentStatus === "PAID" ? "CREATE" : "CREATE", resourceType: "Payment", resourceId: payment.id, metadata: { status: paymentStatus, amount: appt.amount } } });
  }
  console.log("Payments created");

  // Communications: for each appointment, create history
  for (const appt of createdAppointments.slice(0, 12)) {
    const fullAppt = await prisma.appointment.findUnique({ where: { id: appt.id }, include: { patient: true } });
    if (!fullAppt) continue;
    const channel: CommunicationChannel = fullAppt.patient.email ? "EMAIL" : "SMS";
    const status: CommunicationStatus = Math.random() > 0.2 ? "SUCCESS" : "NOT_CONFIGURED";
    await prisma.communication.create({
      data: {
        organizationId: org.id,
        patientId: fullAppt.patientId,
        channel,
        template: "appointment_confirmation",
        message: `Hi ${fullAppt.patient.firstName}, your appointment on ${fullAppt.scheduledStart.toISOString()} is ${fullAppt.status}`,
        status,
        provider: channel === "EMAIL" ? "SMTP" : "MOCK",
        providerMessageId: status === "SUCCESS" ? `msg_${appt.id.slice(0, 6)}` : null,
        failureReason: status === "NOT_CONFIGURED" ? "Provider not configured" : null,
        initiatedById: admin.id,
        sentAt: status === "SUCCESS" ? new Date() : null,
      },
    });
  }
  console.log("Communications created");

  // Additional audit logs for user actions
  await prisma.auditLog.createMany({
    data: [
      { organizationId: org.id, actorUserId: admin.id, action: "LOGIN", resourceType: "User", resourceId: admin.id },
      { organizationId: org.id, actorUserId: admin.id, action: "CREATE", resourceType: "Patient", resourceId: patients["PAT-0001"].id },
      { organizationId: org.id, actorUserId: admin.id, action: "UPDATE", resourceType: "Location", resourceId: locations["main"].id },
    ],
  });

  const finalCounts = await Promise.all([prisma.patient.count(), prisma.doctor.count(), prisma.appointment.count(), prisma.payment.count(), prisma.communication.count(), prisma.auditLog.count()]);
  console.log("Final counts patient/doctor/appt/payment/comm/audit", finalCounts);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());
