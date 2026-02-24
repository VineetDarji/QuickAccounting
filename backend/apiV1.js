const express = require('express');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const toMillis = (d) => (d instanceof Date ? d.getTime() : null);

const mapRole = (role) => {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') return 'ADMIN';
  if (r === 'employee') return 'EMPLOYEE';
  if (r === 'client') return 'CLIENT';
  if (r === 'client_pending') return 'CLIENT_PENDING';
  return 'USER';
};

const mapClientAccessRequestStatus = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'approved') return 'APPROVED';
  if (s === 'rejected') return 'REJECTED';
  return 'PENDING';
};

const toClientAccessRequestDto = (row) => ({
  id: row.id,
  email: row.requestedEmail,
  name: row.requestedName,
  reason: row.reason || '',
  status: String(row.status || 'PENDING').toLowerCase(),
  createdAt: toMillis(row.createdAt) ?? Date.now(),
  decidedAt: toMillis(row.decidedAt) ?? undefined,
  decidedByEmail: row.decidedBy?.email || undefined,
});

const mapInquiryStatus = (status) =>
  String(status || '').toLowerCase() === 'responded' ? 'RESPONDED' : 'PENDING';

const mapCaseStatus = (status) => {
  const s = String(status || '').toUpperCase();
  const allowed = [
    'NEW',
    'IN_REVIEW',
    'WAITING_ON_CLIENT',
    'SCHEDULED',
    'ON_HOLD',
    'COMPLETED',
  ];
  return allowed.includes(s) ? s : 'NEW';
};

const mapTaskStatus = (status) => {
  const s = String(status || '').toUpperCase();
  const allowed = ['TODO', 'IN_PROGRESS', 'DONE'];
  return allowed.includes(s) ? s : 'TODO';
};

const mapAppointmentMode = (mode) => {
  const m = String(mode || '').toUpperCase();
  const allowed = ['CALL', 'VIDEO', 'IN_PERSON'];
  return allowed.includes(m) ? m : 'CALL';
};

const mapAppointmentStatus = (status) => {
  const s = String(status || '').toUpperCase();
  const allowed = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
  return allowed.includes(s) ? s : 'REQUESTED';
};

const mapInvoiceStatus = (status) => {
  const s = String(status || '').toUpperCase();
  const allowed = ['DRAFT', 'SENT', 'PAID', 'VOID'];
  return allowed.includes(s) ? s : 'DRAFT';
};

const ensureUser = async (prisma, { email, name, role }) => {
  if (!email) throw new Error('email is required');
  const nextName = String(name || '').trim() || String(email).split('@')[0] || 'User';
  const roleEnum = mapRole(role);

  return prisma.user.upsert({
    where: { email },
    update: {
      ...(nextName ? { name: nextName } : {}),
      ...(role ? { role: roleEnum } : {}),
    },
    create: {
      email,
      name: nextName,
      role: roleEnum,
    },
  });
};

const getDefaultTasks = (service) => {
  const s = String(service || '').toLowerCase();
  const mk = (title) => ({ title, status: 'TODO' });

  if (s.includes('gst')) {
    return [
      mk('Collect sales invoices'),
      mk('Collect purchase invoices'),
      mk('Reconcile input credits'),
    ];
  }
  if (s.includes('audit')) {
    return [
      mk('Collect financial statements'),
      mk('Collect ledger exports'),
      mk('Prepare audit checklist'),
    ];
  }
  if (s.includes('tds')) {
    return [mk('Collect payment list'), mk('Confirm section & rates'), mk('Prepare return data')];
  }
  return [
    mk('Collect Form 16 / salary details'),
    mk('Collect bank interest statements'),
    mk('Collect deduction proofs (80C/80D)'),
  ];
};

const toSavedCalculationDto = (row) => ({
  id: row.id,
  userName: row.user?.name || 'User',
  userEmail: row.user?.email || undefined,
  label: row.label,
  type: row.type,
  timestamp: toMillis(row.sourceTimestamp) ?? toMillis(row.createdAt) ?? Date.now(),
  inputs: row.inputs,
  results: row.results,
});

const toCaseDto = (row) => ({
  id: row.id,
  clientEmail: row.client?.email || '',
  clientName: row.client?.name || '',
  title: row.title,
  service: row.service,
  status: row.status,
  createdAt: toMillis(row.createdAt) ?? Date.now(),
  updatedAt: toMillis(row.updatedAt) ?? Date.now(),
  providedData: row.providedData || {},
  documents: (row.documents || []).map((d) => ({
    id: d.id,
    name: d.name,
    type: d.mimeType,
    size: d.size,
    uploadedAt: toMillis(d.uploadedAt) ?? Date.now(),
  })),
  appointments: (row.appointments || []).map((a) => ({
    id: a.id,
    requestedAt: toMillis(a.requestedAt) ?? Date.now(),
    preferredDate: a.preferredDate,
    preferredTime: a.preferredTime,
    mode: a.mode,
    notes: a.notes,
    status: a.status,
    scheduledFor: a.scheduledFor || undefined,
  })),
  invoices: (row.invoices || []).map((inv) => ({
    id: inv.id,
    number: inv.number,
    createdAt: toMillis(inv.createdAt) ?? Date.now(),
    dueDate: inv.dueDate,
    currency: inv.currency,
    amount: inv.amount,
    description: inv.description,
    status: inv.status,
    paymentLink: inv.paymentLink,
  })),
  assignedToEmail: row.assignedTo?.email || '',
  internalNotes: (row.internalNotes || []).map((n) => ({
    id: n.id,
    authorEmail: n.authorEmail,
    authorName: n.authorName,
    text: n.text,
    createdAt: toMillis(n.createdAt) ?? Date.now(),
  })),
  tasks: (row.tasks || []).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    assigneeEmail: t.assignee?.email || undefined,
    createdAt: toMillis(t.createdAt) ?? Date.now(),
    dueAt: toMillis(t.dueAt) ?? undefined,
  })),
});

const createV1Router = ({ prisma }) => {
  const router = express.Router();

  router.get(
    '/health',
    asyncHandler(async (_req, res) => {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, db: 'connected' });
    })
  );

  // Import legacy localStorage export (AdminUsers "Download Export")
  router.post(
    '/import/local-export',
    asyncHandler(async (req, res) => {
      const payload = req.body || {};

      const users = Array.isArray(payload.users) ? payload.users : [];
      const profiles = Array.isArray(payload.profiles) ? payload.profiles : [];
      const cases = Array.isArray(payload.cases) ? payload.cases : [];
      const calculations = Array.isArray(payload.calculations) ? payload.calculations : [];
      const inquiries = Array.isArray(payload.inquiries) ? payload.inquiries : [];
      const activities = Array.isArray(payload.activities) ? payload.activities : [];
      const clientAccessRequests = Array.isArray(payload.clientAccessRequests) ? payload.clientAccessRequests : [];

      const summary = {
        users: 0,
        profiles: 0,
        cases: 0,
        calculations: 0,
        inquiries: 0,
        activities: 0,
        clientAccessRequests: 0,
      };

      // Users
      for (const u of users) {
        if (!u || !u.email) continue;
        await ensureUser(prisma, { email: String(u.email), name: u.name, role: u.role });
        summary.users++;
      }

      // Profiles
      for (const p of profiles) {
        if (!p || !p.email) continue;
        const user = await ensureUser(prisma, { email: String(p.email), name: p.name, role: p.role });
        await prisma.clientProfile.upsert({
          where: { userId: user.id },
          update: {
            phone: p.phone || '',
            whatsapp: p.whatsapp || '',
            address: p.address || '',
            pan: p.pan || '',
            aadhaar: p.aadhaar || '',
            notifyEmail: !!(p.notificationPrefs?.email ?? true),
            notifyWhatsapp: !!(p.notificationPrefs?.whatsapp ?? false),
            updatedAt: p.updatedAt ? new Date(Number(p.updatedAt)) : undefined,
          },
          create: {
            userId: user.id,
            phone: p.phone || '',
            whatsapp: p.whatsapp || '',
            address: p.address || '',
            pan: p.pan || '',
            aadhaar: p.aadhaar || '',
            notifyEmail: !!(p.notificationPrefs?.email ?? true),
            notifyWhatsapp: !!(p.notificationPrefs?.whatsapp ?? false),
            createdAt: p.createdAt ? new Date(Number(p.createdAt)) : undefined,
            updatedAt: p.updatedAt ? new Date(Number(p.updatedAt)) : undefined,
          },
        });
        summary.profiles++;
      }

      // Calculations
      for (const c of calculations) {
        if (!c || !c.type) continue;
        const email = String(c.userEmail || '').trim();
        if (!email) continue;

        const user = await ensureUser(prisma, { email, name: c.userName || c.name || email });
        const ts = c.timestamp ? new Date(Number(c.timestamp)) : undefined;

        await prisma.calculation.upsert({
          where: { id: String(c.id) },
          update: {
            userId: user.id,
            type: String(c.type),
            label: String(c.label || 'Report'),
            inputs: c.inputs ?? {},
            results: c.results ?? {},
            sourceTimestamp: ts,
            updatedAt: ts,
          },
          create: {
            id: String(c.id),
            userId: user.id,
            type: String(c.type),
            label: String(c.label || 'Report'),
            inputs: c.inputs ?? {},
            results: c.results ?? {},
            sourceTimestamp: ts,
            createdAt: ts,
            updatedAt: ts,
          },
        });
        summary.calculations++;
      }

      // Inquiries
      for (const i of inquiries) {
        if (!i || !i.email) continue;
        const ts = i.timestamp ? new Date(Number(i.timestamp)) : undefined;
        await prisma.inquiry.upsert({
          where: { id: String(i.id) },
          update: {
            name: String(i.name || ''),
            email: String(i.email),
            service: String(i.service || ''),
            message: String(i.message || ''),
            status: mapInquiryStatus(i.status),
            updatedAt: ts,
          },
          create: {
            id: String(i.id),
            name: String(i.name || ''),
            email: String(i.email),
            service: String(i.service || ''),
            message: String(i.message || ''),
            status: mapInquiryStatus(i.status),
            createdAt: ts,
            updatedAt: ts,
          },
        });
        summary.inquiries++;
      }

      // Activities
      for (const a of activities) {
        if (!a) continue;
        const ts = a.timestamp ? new Date(Number(a.timestamp)) : undefined;
        await prisma.activity.upsert({
          where: { id: String(a.id) },
          update: {
            userName: String(a.userName || 'User'),
            userEmail: String(a.userEmail || ''),
            action: String(a.action || ''),
            details: String(a.details || ''),
            createdAt: ts,
          },
          create: {
            id: String(a.id),
            userName: String(a.userName || 'User'),
            userEmail: String(a.userEmail || ''),
            action: String(a.action || ''),
            details: String(a.details || ''),
            createdAt: ts,
          },
        });
        summary.activities++;
      }

      // Cases (best-effort; legacy export does not contain document blobs)
      for (const c of cases) {
        if (!c || !c.clientEmail) continue;
        const client = await ensureUser(prisma, {
          email: String(c.clientEmail),
          name: c.clientName,
          role: 'user',
        });
        const assignedEmail = String(c.assignedToEmail || '').trim();
        const assignedTo = assignedEmail
          ? await ensureUser(prisma, { email: assignedEmail, name: assignedEmail, role: 'employee' })
          : null;

        await prisma.taxCase.upsert({
          where: { id: String(c.id) },
          update: {
            clientId: client.id,
            assignedToUserId: assignedTo?.id || null,
            title: String(c.title || 'New Case'),
            service: String(c.service || 'Income Tax Filing'),
            status: mapCaseStatus(c.status),
            providedData: c.providedData ?? {},
            createdAt: c.createdAt ? new Date(Number(c.createdAt)) : undefined,
            updatedAt: c.updatedAt ? new Date(Number(c.updatedAt)) : undefined,
          },
          create: {
            id: String(c.id),
            clientId: client.id,
            assignedToUserId: assignedTo?.id || null,
            title: String(c.title || 'New Case'),
            service: String(c.service || 'Income Tax Filing'),
            status: mapCaseStatus(c.status),
            providedData: c.providedData ?? {},
            createdAt: c.createdAt ? new Date(Number(c.createdAt)) : undefined,
            updatedAt: c.updatedAt ? new Date(Number(c.updatedAt)) : undefined,
          },
        });

        // Replace related records
        await prisma.document.deleteMany({ where: { caseId: String(c.id) } });
        await prisma.caseAppointment.deleteMany({ where: { caseId: String(c.id) } });
        await prisma.caseInvoice.deleteMany({ where: { caseId: String(c.id) } });
        await prisma.caseTask.deleteMany({ where: { caseId: String(c.id) } });
        await prisma.caseInternalNote.deleteMany({ where: { caseId: String(c.id) } });

        const docs = Array.isArray(c.documents) ? c.documents : [];
        for (const d of docs) {
          if (!d) continue;
          await prisma.document.create({
            data: {
              id: d.id ? String(d.id) : undefined,
              kind: 'CASE',
              caseId: String(c.id),
              ownerId: client.id,
              name: String(d.name || 'Document'),
              mimeType: String(d.type || 'application/octet-stream'),
              size: Number(d.size || 0),
              storageKey: 'legacy:indexeddb',
              uploadedAt: d.uploadedAt ? new Date(Number(d.uploadedAt)) : undefined,
            },
          });
        }

        const appts = Array.isArray(c.appointments) ? c.appointments : [];
        for (const a of appts) {
          if (!a) continue;
          await prisma.caseAppointment.create({
            data: {
              id: a.id ? String(a.id) : undefined,
              caseId: String(c.id),
              requestedAt: a.requestedAt ? new Date(Number(a.requestedAt)) : undefined,
              preferredDate: String(a.preferredDate || ''),
              preferredTime: String(a.preferredTime || ''),
              mode: mapAppointmentMode(a.mode),
              notes: String(a.notes || ''),
              status: mapAppointmentStatus(a.status),
              scheduledFor: a.scheduledFor ? String(a.scheduledFor) : null,
            },
          });
        }

        const invs = Array.isArray(c.invoices) ? c.invoices : [];
        for (const inv of invs) {
          if (!inv) continue;
          await prisma.caseInvoice.create({
            data: {
              id: inv.id ? String(inv.id) : undefined,
              caseId: String(c.id),
              number: String(inv.number || `INV-${Date.now()}`),
              createdAt: inv.createdAt ? new Date(Number(inv.createdAt)) : undefined,
              dueDate: String(inv.dueDate || ''),
              currency: String(inv.currency || 'INR'),
              amount: Number(inv.amount || 0),
              description: String(inv.description || ''),
              status: mapInvoiceStatus(inv.status),
              paymentLink: String(inv.paymentLink || ''),
            },
          });
        }

        const tasks = Array.isArray(c.tasks) ? c.tasks : [];
        for (const t of tasks) {
          if (!t) continue;
          const assigneeEmail = String(t.assigneeEmail || '').trim();
          const assignee = assigneeEmail
            ? await ensureUser(prisma, { email: assigneeEmail, name: assigneeEmail, role: 'employee' })
            : null;
          await prisma.caseTask.create({
            data: {
              id: t.id ? String(t.id) : undefined,
              caseId: String(c.id),
              title: String(t.title || ''),
              status: mapTaskStatus(t.status),
              assigneeId: assignee?.id || null,
              createdAt: t.createdAt ? new Date(Number(t.createdAt)) : undefined,
              dueAt: t.dueAt ? new Date(Number(t.dueAt)) : null,
            },
          });
        }

        const notes = Array.isArray(c.internalNotes) ? c.internalNotes : [];
        for (const n of notes) {
          if (!n) continue;
          const authorEmail = String(n.authorEmail || '').trim();
          const authorName = String(n.authorName || authorEmail || 'Staff');
          const author = authorEmail
            ? await ensureUser(prisma, { email: authorEmail, name: authorName, role: 'employee' })
            : null;
          await prisma.caseInternalNote.create({
            data: {
              id: n.id ? String(n.id) : undefined,
              caseId: String(c.id),
              authorId: author?.id || null,
              authorEmail,
              authorName,
              text: String(n.text || ''),
              createdAt: n.createdAt ? new Date(Number(n.createdAt)) : undefined,
            },
          });
        }

        summary.cases++;
      }

      for (const request of clientAccessRequests) {
        if (!request || !request.email) continue;
        const requester = await ensureUser(prisma, {
          email: String(request.email).trim(),
          name: String(request.name || request.email),
          role: request.status === 'approved' ? 'client' : request.status === 'pending' ? 'client_pending' : 'user',
        });

        let decidedBy = null;
        const decidedByEmail = String(request.decidedByEmail || '').trim();
        if (decidedByEmail) {
          decidedBy = await ensureUser(prisma, { email: decidedByEmail, name: decidedByEmail, role: 'admin' });
        }

        await prisma.clientAccessRequest.upsert({
          where: { id: String(request.id || '') || `legacy-${requester.id}-${String(request.createdAt || Date.now())}` },
          update: {
            userId: requester.id,
            requestedName: String(request.name || requester.name || requester.email),
            requestedEmail: String(request.email || requester.email),
            reason: String(request.reason || ''),
            status: mapClientAccessRequestStatus(request.status),
            decidedAt: request.decidedAt ? new Date(Number(request.decidedAt)) : null,
            decidedByUserId: decidedBy?.id || null,
            createdAt: request.createdAt ? new Date(Number(request.createdAt)) : undefined,
          },
          create: {
            id: String(request.id || '') || undefined,
            userId: requester.id,
            requestedName: String(request.name || requester.name || requester.email),
            requestedEmail: String(request.email || requester.email),
            reason: String(request.reason || ''),
            status: mapClientAccessRequestStatus(request.status),
            decidedAt: request.decidedAt ? new Date(Number(request.decidedAt)) : null,
            decidedByUserId: decidedBy?.id || null,
            createdAt: request.createdAt ? new Date(Number(request.createdAt)) : undefined,
          },
        });
        summary.clientAccessRequests++;
      }

      res.json({ ok: true, summary });
    })
  );

  // Users
  router.get(
    '/users',
    asyncHandler(async (req, res) => {
      const role = req.query.role ? mapRole(req.query.role) : undefined;
      const users = await prisma.user.findMany({
        where: role ? { role } : undefined,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      res.json(users);
    })
  );

  // Profiles
  router.get(
    '/profiles',
    asyncHandler(async (_req, res) => {
      const profiles = await prisma.clientProfile.findMany({
        include: { user: true, aadhaarDocument: true },
        orderBy: { updatedAt: 'desc' },
      });

      res.json(
        profiles.map((p) => ({
          email: p.user.email,
          name: p.user.name,
          phone: p.phone,
          whatsapp: p.whatsapp,
          address: p.address,
          pan: p.pan,
          aadhaar: p.aadhaar,
          aadhaarDocument: p.aadhaarDocument
            ? {
                id: p.aadhaarDocument.id,
                name: p.aadhaarDocument.name,
                type: p.aadhaarDocument.mimeType,
                size: p.aadhaarDocument.size,
                uploadedAt: toMillis(p.aadhaarDocument.uploadedAt) ?? Date.now(),
              }
            : null,
          notificationPrefs: { email: p.notifyEmail, whatsapp: p.notifyWhatsapp },
          createdAt: toMillis(p.createdAt) ?? Date.now(),
          updatedAt: toMillis(p.updatedAt) ?? Date.now(),
        }))
      );
    })
  );

  router.get(
    '/profiles/:email',
    asyncHandler(async (req, res) => {
      const email = String(req.params.email || '').trim();
      if (!email) return res.status(400).json({ error: 'email is required' });

      const user = await ensureUser(prisma, { email, name: email });
      const profile = await prisma.clientProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
        include: { user: true, aadhaarDocument: true },
      });

      res.json({
        email: profile.user.email,
        name: profile.user.name,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        address: profile.address,
        pan: profile.pan,
        aadhaar: profile.aadhaar,
        aadhaarDocument: profile.aadhaarDocument
          ? {
              id: profile.aadhaarDocument.id,
              name: profile.aadhaarDocument.name,
              type: profile.aadhaarDocument.mimeType,
              size: profile.aadhaarDocument.size,
              uploadedAt: toMillis(profile.aadhaarDocument.uploadedAt) ?? Date.now(),
            }
          : null,
        notificationPrefs: { email: profile.notifyEmail, whatsapp: profile.notifyWhatsapp },
        createdAt: toMillis(profile.createdAt) ?? Date.now(),
        updatedAt: toMillis(profile.updatedAt) ?? Date.now(),
      });
    })
  );

  router.put(
    '/profiles/:email',
    asyncHandler(async (req, res) => {
      const email = String(req.params.email || '').trim();
      if (!email) return res.status(400).json({ error: 'email is required' });

      const body = req.body || {};
      const user = await ensureUser(prisma, { email, name: body.name || email });

      if (body.name) {
        await prisma.user.update({ where: { id: user.id }, data: { name: String(body.name) } });
      }

      const updated = await prisma.clientProfile.upsert({
        where: { userId: user.id },
        update: {
          phone: String(body.phone ?? ''),
          whatsapp: String(body.whatsapp ?? ''),
          address: String(body.address ?? ''),
          pan: String(body.pan ?? ''),
          aadhaar: String(body.aadhaar ?? ''),
          notifyEmail: !!(body.notificationPrefs?.email ?? true),
          notifyWhatsapp: !!(body.notificationPrefs?.whatsapp ?? false),
        },
        create: {
          userId: user.id,
          phone: String(body.phone ?? ''),
          whatsapp: String(body.whatsapp ?? ''),
          address: String(body.address ?? ''),
          pan: String(body.pan ?? ''),
          aadhaar: String(body.aadhaar ?? ''),
          notifyEmail: !!(body.notificationPrefs?.email ?? true),
          notifyWhatsapp: !!(body.notificationPrefs?.whatsapp ?? false),
        },
        include: { user: true, aadhaarDocument: true },
      });

      res.json({
        email: updated.user.email,
        name: updated.user.name,
        phone: updated.phone,
        whatsapp: updated.whatsapp,
        address: updated.address,
        pan: updated.pan,
        aadhaar: updated.aadhaar,
        aadhaarDocument: updated.aadhaarDocument
          ? {
              id: updated.aadhaarDocument.id,
              name: updated.aadhaarDocument.name,
              type: updated.aadhaarDocument.mimeType,
              size: updated.aadhaarDocument.size,
              uploadedAt: toMillis(updated.aadhaarDocument.uploadedAt) ?? Date.now(),
            }
          : null,
        notificationPrefs: { email: updated.notifyEmail, whatsapp: updated.notifyWhatsapp },
        createdAt: toMillis(updated.createdAt) ?? Date.now(),
        updatedAt: toMillis(updated.updatedAt) ?? Date.now(),
      });
    })
  );

  // Calculations
  router.get(
    '/calculations',
    asyncHandler(async (req, res) => {
      const email = String(req.query.email || '').trim();
      const take = Math.min(Math.max(Number(req.query.take || 50), 1), 200);
      const skip = Math.max(Number(req.query.skip || 0), 0);

      let where = undefined;
      if (email) {
        const user = await prisma.user.findUnique({ where: { email } });
        where = user ? { userId: user.id } : { userId: '__none__' };
      }

      const rows = await prisma.calculation.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      });

      res.json(rows.map(toSavedCalculationDto));
    })
  );

  router.post(
    '/calculations',
    asyncHandler(async (req, res) => {
      const body = req.body || {};
      const userEmail = String(body.userEmail || '').trim();
      const userName = String(body.userName || body.name || '').trim();
      const userRole = body.userRole || body.role;
      const type = String(body.type || '').trim();
      const label = String(body.label || 'Report').trim();

      if (!userEmail) return res.status(400).json({ error: 'userEmail is required' });
      if (!type) return res.status(400).json({ error: 'type is required' });

      const user = await ensureUser(prisma, { email: userEmail, name: userName || userEmail, role: userRole });
      const id = body.id ? String(body.id) : undefined;
      const ts = body.timestamp ? new Date(Number(body.timestamp)) : undefined;

      const created = await prisma.calculation.create({
        data: {
          ...(id ? { id } : {}),
          userId: user.id,
          type,
          label,
          inputs: body.inputs ?? {},
          results: body.results ?? {},
          sourceTimestamp: ts,
        },
        include: { user: true },
      });

      res.json(toSavedCalculationDto(created));
    })
  );

  router.delete(
    '/calculations/:id',
    asyncHandler(async (req, res) => {
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ error: 'id is required' });
      await prisma.calculation.delete({ where: { id } });
      res.json({ ok: true });
    })
  );

  // Cases
  router.get(
    '/cases',
    asyncHandler(async (req, res) => {
      const clientEmail = String(req.query.clientEmail || '').trim();
      const assigneeEmail = String(req.query.assigneeEmail || '').trim();
      const status = req.query.status ? mapCaseStatus(req.query.status) : undefined;

      let clientId = undefined;
      if (clientEmail) {
        const client = await prisma.user.findUnique({ where: { email: clientEmail } });
        clientId = client?.id;
      }

      let assigneeId = undefined;
      if (assigneeEmail) {
        const assignee = await prisma.user.findUnique({ where: { email: assigneeEmail } });
        assigneeId = assignee?.id;
      }

      const rows = await prisma.taxCase.findMany({
        where: {
          ...(clientId ? { clientId } : {}),
          ...(assigneeId ? { assignedToUserId: assigneeId } : {}),
          ...(status ? { status } : {}),
        },
        include: {
          client: true,
          assignedTo: true,
          documents: true,
          appointments: true,
          invoices: true,
          internalNotes: true,
          tasks: { include: { assignee: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });

      res.json(rows.map(toCaseDto));
    })
  );

  router.get(
    '/cases/:id',
    asyncHandler(async (req, res) => {
      const id = String(req.params.id || '').trim();
      const row = await prisma.taxCase.findUnique({
        where: { id },
        include: {
          client: true,
          assignedTo: true,
          documents: true,
          appointments: true,
          invoices: true,
          internalNotes: true,
          tasks: { include: { assignee: true } },
        },
      });
      if (!row) return res.status(404).json({ error: 'Case not found' });
      res.json(toCaseDto(row));
    })
  );

  router.post(
    '/cases',
    asyncHandler(async (req, res) => {
      const body = req.body || {};
      const clientEmail = String(body.clientEmail || '').trim();
      const clientName = String(body.clientName || body.userName || '').trim();
      const title = String(body.title || 'New Case').trim();
      const service = String(body.service || 'Income Tax Filing').trim();
      const status = body.status ? mapCaseStatus(body.status) : 'NEW';
      const assignedToEmail = String(body.assignedToEmail || '').trim();

      if (!clientEmail) return res.status(400).json({ error: 'clientEmail is required' });

      const client = await ensureUser(prisma, {
        email: clientEmail,
        name: clientName || clientEmail,
        role: 'user',
      });
      const assignedTo = assignedToEmail
        ? await ensureUser(prisma, { email: assignedToEmail, name: assignedToEmail, role: 'employee' })
        : null;

      const id = body.id ? String(body.id) : undefined;
      const providedData = body.providedData ?? {};
      const rawTasks = Array.isArray(body.tasks) ? body.tasks : null;
      const tasks = (rawTasks && rawTasks.length ? rawTasks : getDefaultTasks(service)).map((t) => ({
        ...(t.id ? { id: String(t.id) } : {}),
        title: String(t.title || ''),
        status: mapTaskStatus(t.status),
        createdAt: t.createdAt ? new Date(Number(t.createdAt)) : undefined,
        dueAt: t.dueAt ? new Date(Number(t.dueAt)) : undefined,
      }));

      const created = await prisma.taxCase.create({
        data: {
          ...(id ? { id } : {}),
          clientId: client.id,
          assignedToUserId: assignedTo?.id || null,
          title,
          service,
          status,
          providedData,
          tasks: { create: tasks },
        },
        include: {
          client: true,
          assignedTo: true,
          documents: true,
          appointments: true,
          invoices: true,
          internalNotes: true,
          tasks: { include: { assignee: true } },
        },
      });

      res.json(toCaseDto(created));
    })
  );

  router.patch(
    '/cases/:id',
    asyncHandler(async (req, res) => {
      const id = String(req.params.id || '').trim();
      const patch = req.body || {};

      const assignedToEmail =
        patch.assignedToEmail !== undefined ? String(patch.assignedToEmail || '').trim() : undefined;
      const assignedTo = assignedToEmail
        ? await ensureUser(prisma, { email: assignedToEmail, name: assignedToEmail, role: 'employee' })
        : null;

      const updated = await prisma.taxCase.update({
        where: { id },
        data: {
          ...(patch.title !== undefined ? { title: String(patch.title || '') } : {}),
          ...(patch.service !== undefined ? { service: String(patch.service || '') } : {}),
          ...(patch.status !== undefined ? { status: mapCaseStatus(patch.status) } : {}),
          ...(patch.providedData !== undefined ? { providedData: patch.providedData ?? {} } : {}),
          ...(assignedToEmail !== undefined ? { assignedToUserId: assignedTo?.id || null } : {}),
        },
        include: {
          client: true,
          assignedTo: true,
          documents: true,
          appointments: true,
          invoices: true,
          internalNotes: true,
          tasks: { include: { assignee: true } },
        },
      });

      res.json(toCaseDto(updated));
    })
  );

  // Case tasks
  router.post(
    '/cases/:id/tasks',
    asyncHandler(async (req, res) => {
      const caseId = String(req.params.id || '').trim();
      const body = req.body || {};
      const assigneeEmail = String(body.assigneeEmail || '').trim();
      const assignee = assigneeEmail
        ? await ensureUser(prisma, { email: assigneeEmail, name: assigneeEmail, role: 'employee' })
        : null;

      const created = await prisma.caseTask.create({
        data: {
          ...(body.id ? { id: String(body.id) } : {}),
          caseId,
          title: String(body.title || ''),
          status: mapTaskStatus(body.status),
          assigneeId: assignee?.id || null,
          createdAt: body.createdAt ? new Date(Number(body.createdAt)) : undefined,
          dueAt: body.dueAt ? new Date(Number(body.dueAt)) : null,
        },
        include: { assignee: true },
      });

      res.json({
        id: created.id,
        title: created.title,
        status: created.status,
        assigneeEmail: created.assignee?.email || undefined,
        createdAt: toMillis(created.createdAt) ?? Date.now(),
        dueAt: toMillis(created.dueAt) ?? undefined,
      });
    })
  );

  router.patch(
    '/cases/:caseId/tasks/:taskId',
    asyncHandler(async (req, res) => {
      const caseId = String(req.params.caseId || '').trim();
      const taskId = String(req.params.taskId || '').trim();
      const body = req.body || {};
      const assigneeEmail = body.assigneeEmail !== undefined ? String(body.assigneeEmail || '').trim() : undefined;
      const assignee = assigneeEmail
        ? await ensureUser(prisma, { email: assigneeEmail, name: assigneeEmail, role: 'employee' })
        : null;

      const updated = await prisma.caseTask.update({
        where: { id: taskId },
        data: {
          ...(body.title !== undefined ? { title: String(body.title || '') } : {}),
          ...(body.status !== undefined ? { status: mapTaskStatus(body.status) } : {}),
          ...(assigneeEmail !== undefined ? { assigneeId: assignee?.id || null } : {}),
          ...(body.dueAt !== undefined ? { dueAt: body.dueAt ? new Date(Number(body.dueAt)) : null } : {}),
        },
        include: { assignee: true, taxCase: true },
      });

      if (updated.caseId !== caseId) return res.status(400).json({ error: 'Task does not belong to caseId' });

      res.json({
        id: updated.id,
        title: updated.title,
        status: updated.status,
        assigneeEmail: updated.assignee?.email || undefined,
        createdAt: toMillis(updated.createdAt) ?? Date.now(),
        dueAt: toMillis(updated.dueAt) ?? undefined,
      });
    })
  );

  // Inquiries
  router.get(
    '/inquiries',
    asyncHandler(async (req, res) => {
      const email = String(req.query.email || '').trim();
      const status = req.query.status ? mapInquiryStatus(req.query.status) : undefined;

      const rows = await prisma.inquiry.findMany({
        where: {
          ...(email ? { email } : {}),
          ...(status ? { status } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(
        rows.map((i) => ({
          id: i.id,
          userId: i.userId || undefined,
          name: i.name,
          email: i.email,
          service: i.service,
          message: i.message,
          timestamp: toMillis(i.createdAt) ?? Date.now(),
          status: i.status === 'RESPONDED' ? 'responded' : 'pending',
        }))
      );
    })
  );

  router.post(
    '/inquiries',
    asyncHandler(async (req, res) => {
      const body = req.body || {};
      const created = await prisma.inquiry.create({
        data: {
          ...(body.id ? { id: String(body.id) } : {}),
          name: String(body.name || ''),
          email: String(body.email || ''),
          service: String(body.service || ''),
          message: String(body.message || ''),
          status: mapInquiryStatus(body.status),
        },
      });

      res.json({
        id: created.id,
        name: created.name,
        email: created.email,
        service: created.service,
        message: created.message,
        timestamp: toMillis(created.createdAt) ?? Date.now(),
        status: created.status === 'RESPONDED' ? 'responded' : 'pending',
      });
    })
  );

  router.patch(
    '/inquiries/:id',
    asyncHandler(async (req, res) => {
      const id = String(req.params.id || '').trim();
      const body = req.body || {};

      const updated = await prisma.inquiry.update({
        where: { id },
        data: {
          ...(body.status !== undefined ? { status: mapInquiryStatus(body.status) } : {}),
        },
      });

      res.json({ ok: true, status: updated.status });
    })
  );

  // Activities
  router.get(
    '/activities',
    asyncHandler(async (req, res) => {
      const email = String(req.query.email || '').trim();
      const take = Math.min(Math.max(Number(req.query.take || 100), 1), 500);

      const rows = await prisma.activity.findMany({
        where: email ? { userEmail: email } : undefined,
        orderBy: { createdAt: 'desc' },
        take,
      });

      res.json(
        rows.map((a) => ({
          id: a.id,
          userName: a.userName,
          userEmail: a.userEmail,
          action: a.action,
          details: a.details,
          timestamp: toMillis(a.createdAt) ?? Date.now(),
        }))
      );
    })
  );

  router.post(
    '/activities',
    asyncHandler(async (req, res) => {
      const body = req.body || {};
      const userEmail = String(body.userEmail || '').trim();
      const userName = String(body.userName || '').trim();
      const linked = userEmail ? await ensureUser(prisma, { email: userEmail, name: userName || userEmail }) : null;

      const created = await prisma.activity.create({
        data: {
          ...(body.id ? { id: String(body.id) } : {}),
          userId: linked?.id || null,
          userName: userName || linked?.name || 'User',
          userEmail: userEmail || linked?.email || '',
          action: String(body.action || ''),
          details: String(body.details || ''),
        },
      });

      res.json({
        id: created.id,
        userName: created.userName,
        userEmail: created.userEmail,
        action: created.action,
        details: created.details,
        timestamp: toMillis(created.createdAt) ?? Date.now(),
      });
    })
  );

  // Client access requests
  router.get(
    '/client-access-requests',
    asyncHandler(async (req, res) => {
      const email = String(req.query.email || '').trim();
      const status = req.query.status ? mapClientAccessRequestStatus(req.query.status) : undefined;
      const rows = await prisma.clientAccessRequest.findMany({
        where: {
          ...(email ? { requestedEmail: email } : {}),
          ...(status ? { status } : {}),
        },
        include: { decidedBy: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json(rows.map(toClientAccessRequestDto));
    })
  );

  router.post(
    '/client-access-requests',
    asyncHandler(async (req, res) => {
      const body = req.body || {};
      const email = String(body.email || '').trim();
      const name = String(body.name || '').trim();
      if (!email) return res.status(400).json({ error: 'email is required' });

      const user = await ensureUser(prisma, { email, name: name || email, role: 'client_pending' });

      const existing = await prisma.clientAccessRequest.findFirst({
        where: { requestedEmail: email, status: 'PENDING' },
        include: { decidedBy: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) return res.json(toClientAccessRequestDto(existing));

      const created = await prisma.clientAccessRequest.create({
        data: {
          userId: user.id,
          requestedName: name || user.name || email,
          requestedEmail: email,
          reason: String(body.reason || ''),
          status: 'PENDING',
        },
        include: { decidedBy: { select: { email: true } } },
      });
      res.json(toClientAccessRequestDto(created));
    })
  );

  router.patch(
    '/client-access-requests/:id',
    asyncHandler(async (req, res) => {
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ error: 'id is required' });

      const body = req.body || {};
      const decision = mapClientAccessRequestStatus(body.status || body.decision);
      if (decision === 'PENDING') return res.status(400).json({ error: 'decision must be approved or rejected' });

      const decidedByEmail = String(body.decidedByEmail || '').trim();
      const decidedBy = decidedByEmail
        ? await ensureUser(prisma, { email: decidedByEmail, name: decidedByEmail, role: 'admin' })
        : null;

      const updated = await prisma.clientAccessRequest.update({
        where: { id },
        data: {
          status: decision,
          decidedAt: new Date(),
          decidedByUserId: decidedBy?.id || null,
        },
        include: { decidedBy: { select: { email: true } } },
      });

      await prisma.user.update({
        where: { id: updated.userId },
        data: {
          role: decision === 'APPROVED' ? 'CLIENT' : 'USER',
        },
      });

      res.json(toClientAccessRequestDto(updated));
    })
  );

  // Dashboard summaries
  router.get(
    '/dashboard/admin',
    asyncHandler(async (_req, res) => {
      const [users, cases, recentCalculations, recentActivities] = await Promise.all([
        prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          select: { id: true, email: true, name: true, role: true, createdAt: true },
        }),
        prisma.taxCase.findMany({
          include: { client: true, assignedTo: true, appointments: true, tasks: { include: { assignee: true } } },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.calculation.findMany({
          include: { user: true },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        prisma.activity.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ]);

      const caseStats = {
        total: cases.length,
        active: cases.filter((c) => c.status !== 'COMPLETED').length,
        unassigned: cases.filter((c) => !c.assignedToUserId).length,
        waiting: cases.filter((c) => c.status === 'WAITING_ON_CLIENT').length,
        scheduled: cases.filter((c) => c.status === 'SCHEDULED').length,
      };

      const userStats = {
        clients: users.filter((u) => u.role === 'CLIENT' || u.role === 'USER').length,
        employees: users.filter((u) => u.role === 'EMPLOYEE').length,
        admins: users.filter((u) => u.role === 'ADMIN').length,
      };

      const calcCountByUserId = new Map();
      recentCalculations.forEach((c) => {
        calcCountByUserId.set(c.userId, (calcCountByUserId.get(c.userId) || 0) + 1);
      });

      const clients = users
        .filter(
          (u) =>
            u.role === 'USER' ||
            u.role === 'CLIENT_PENDING' ||
            u.role === 'CLIENT' ||
            u.role === 'EMPLOYEE' ||
            u.role === 'ADMIN'
        )
        .map((u) => ({
          name: u.name,
          email: u.email,
          role: String(u.role).toLowerCase(),
          calcCount: calcCountByUserId.get(u.id) || 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const appointments = [];
      cases.forEach((c) => {
        (c.appointments || []).forEach((a) => {
          if (a.status === 'REQUESTED' || a.status === 'CONFIRMED') {
            appointments.push({
              caseId: c.id,
              caseTitle: c.title,
              clientName: c.client?.name || '',
              clientEmail: c.client?.email || '',
              date: a.scheduledFor || `${a.preferredDate} ${a.preferredTime}`,
              status: a.status,
            });
          }
        });
      });

      res.json({
        stats: {
          calculations: recentCalculations.length,
          ...caseStats,
          ...userStats,
        },
        clients,
        calculations: recentCalculations.map(toSavedCalculationDto),
        activities: recentActivities.map((a) => ({
          id: a.id,
          userName: a.userName,
          userEmail: a.userEmail,
          action: a.action,
          details: a.details,
          timestamp: toMillis(a.createdAt) ?? Date.now(),
        })),
        appointments: appointments.slice(0, 20),
      });
    })
  );

  router.get(
    '/dashboard/employee/:email',
    asyncHandler(async (req, res) => {
      const email = String(req.params.email || '').trim();
      if (!email) return res.status(400).json({ error: 'email is required' });

      const employee = await prisma.user.findUnique({ where: { email } });
      if (!employee) return res.json({ stats: { total: 0, active: 0, waiting: 0, scheduled: 0 }, tasks: [], appointments: [] });

      const cases = await prisma.taxCase.findMany({
        where: { assignedToUserId: employee.id },
        include: {
          client: true,
          appointments: true,
          tasks: { include: { assignee: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const stats = {
        total: cases.length,
        active: cases.filter((c) => c.status !== 'COMPLETED').length,
        waiting: cases.filter((c) => c.status === 'WAITING_ON_CLIENT').length,
        scheduled: cases.filter((c) => c.status === 'SCHEDULED').length,
      };

      const tasks = [];
      const appointments = [];
      cases.forEach((c) => {
        (c.tasks || []).forEach((t) => {
          if (t.status !== 'DONE') {
            tasks.push({
              id: t.id,
              title: t.title,
              status: t.status,
              createdAt: toMillis(t.createdAt) ?? Date.now(),
              caseId: c.id,
              caseTitle: c.title,
              clientName: c.client?.name || '',
              clientEmail: c.client?.email || '',
            });
          }
        });

        (c.appointments || []).forEach((a) => {
          if (a.status === 'REQUESTED' || a.status === 'CONFIRMED') {
            appointments.push({
              caseId: c.id,
              caseTitle: c.title,
              clientName: c.client?.name || '',
              clientEmail: c.client?.email || '',
              date: a.scheduledFor || `${a.preferredDate} ${a.preferredTime}`,
              status: a.status,
            });
          }
        });
      });

      res.json({
        stats,
        tasks: tasks.sort((a, b) => b.createdAt - a.createdAt).slice(0, 100),
        appointments: appointments.slice(0, 20),
      });
    })
  );

  return router;
};

module.exports = { createV1Router };
