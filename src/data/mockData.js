/**
 * mockData.js  — CRM Dashboard MVP · Mock Data Store
 * ====================================================
 * Edit any deal's `status` or `amount` and the KPIs will
 * recalculate automatically.
 */

export const mockData = {

  // ── 1. USERS (Sales Reps) ────────────────────────────────────────
  users: [
    { id: "u1",  full_name: "Ana García",       role: "sales_rep", avatar_url: "https://i.pravatar.cc/150?u=ana",    quota_amount: 120000, status: "active" },
    { id: "u2",  full_name: "Carlos Mendoza",   role: "sales_rep", avatar_url: "https://i.pravatar.cc/150?u=carlos", quota_amount:  90000, status: "active" },
    { id: "u3",  full_name: "Lucía Fernández",  role: "sales_rep", avatar_url: "https://i.pravatar.cc/150?u=lucia",  quota_amount:  80000, status: "active" },
    { id: "u4",  full_name: "Diego Romero",     role: "sales_rep", avatar_url: "https://i.pravatar.cc/150?u=diego",  quota_amount:  75000, status: "active" },
    { id: "u5",  full_name: "Sofía Vargas",     role: "sales_rep", avatar_url: "https://i.pravatar.cc/150?u=sofia",  quota_amount:  85000, status: "active" },
    { id: "u6",  full_name: "Martín López",     role: "sales_rep", avatar_url: "https://i.pravatar.cc/150?u=martin", quota_amount:  70000, status: "active" },
    { id: "mgr", full_name: "Rafael Herrera",   role: "manager",   avatar_url: "https://i.pravatar.cc/150?u=rafael", quota_amount: 500000, status: "active" }
  ],

  // ── 2. PIPELINE STAGES ──────────────────────────────────────────
  stages: [
    { id: "s1", name: "Prospect",    display_order: 1, win_probability:  10, color: "#60A5FA" },
    { id: "s2", name: "Lead",        display_order: 2, win_probability:  30, color: "#818CF8" },
    { id: "s3", name: "Negotiation", display_order: 3, win_probability:  60, color: "#F59E0B" },
    { id: "s4", name: "Closed Won",  display_order: 4, win_probability: 100, color: "#10B981" },
    { id: "s5", name: "Closed Lost", display_order: 5, win_probability:   0, color: "#EF4444" }
  ],

  // ── 3. CUSTOMERS ────────────────────────────────────────────────
  customers: [
    { id: "c1",  company_name: "TechSolutions SL",    industry: "Software",      contact_person: "Carlos Ruiz",    email: "cruiz@techsolutions.com" },
    { id: "c2",  company_name: "Global Market SA",    industry: "Retail",        contact_person: "Laura Gómez",    email: "lgomez@globalmarket.com" },
    { id: "c3",  company_name: "Innovatech Corp",     industry: "Technology",    contact_person: "Pedro Sánchez",  email: "psanchez@innovatech.com" },
    { id: "c4",  company_name: "Finanzas Capital",    industry: "Finance",       contact_person: "María López",    email: "mlopez@finanzascapital.com" },
    { id: "c5",  company_name: "Salud Integral",      industry: "Healthcare",    contact_person: "José Díaz",      email: "jdiaz@saludintegral.com" },
    { id: "c6",  company_name: "Apex Logistics",      industry: "Logistics",     contact_person: "Marta Rivas",    email: "mrivas@apex.com" },
    { id: "c7",  company_name: "Acme Industrial",     industry: "Manufacturing", contact_person: "Juan Torres",    email: "jtorres@acme.com" },
    { id: "c8",  company_name: "Beta Edu Group",      industry: "Education",     contact_person: "Elena Marín",    email: "emarin@betaedu.com" },
    { id: "c9",  company_name: "Nexus Analytics",     industry: "Analytics",     contact_person: "Pablo Vega",     email: "pvega@nexusanalytics.com" },
    { id: "c10", company_name: "CloudFirst Inc",      industry: "Cloud",         contact_person: "Sara Jiménez",   email: "sjimenez@cloudfirst.com" }
  ],

  // ── 4. DEALS (Central Fact Table) ───────────────────────────────
  deals: [
    // ── January 2026 ──────────────────────────────────────────────
    {
      id: "d1",  title: "Licencia Enterprise 2026",
      customer_id: "c1",  owner_id: "u1",  stage_id: "s4",
      amount: 25000, currency: "EUR", status: "won", store_code: "CB",
      created_at: "2026-01-05T10:00:00Z", closed_at: "2026-01-18T14:30:00Z"
    },
    {
      id: "d2",  title: "Suscripción SaaS Anual",
      customer_id: "c6",  owner_id: "u2",  stage_id: "s4",
      amount: 18000, currency: "EUR", status: "won", store_code: "CHM",
      created_at: "2026-01-08T09:00:00Z", closed_at: "2026-01-22T15:00:00Z"
    },
    {
      id: "d3",  title: "Soporte Técnico Premium",
      customer_id: "c4",  owner_id: "u3",  stage_id: "s5",
      amount: 8000, currency: "EUR", status: "lost", store_code: "CHQ",
      created_at: "2026-01-10T11:00:00Z", closed_at: "2026-01-28T10:00:00Z"
    },
    {
      id: "d4",  title: "Pack Starter Analytics",
      customer_id: "c9",  owner_id: "u4",  stage_id: "s4",
      amount: 9500, currency: "EUR", status: "won", store_code: "ESC",
      created_at: "2026-01-12T14:00:00Z", closed_at: "2026-01-30T11:00:00Z"
    },
    // ── February 2026 ─────────────────────────────────────────────
    {
      id: "d5",  title: "Migración Cloud AWS",
      customer_id: "c3",  owner_id: "u5",  stage_id: "s4",
      amount: 45000, currency: "EUR", status: "won", store_code: "HH",
      created_at: "2026-02-01T09:00:00Z", closed_at: "2026-02-20T16:00:00Z"
    },
    {
      id: "d6",  title: "Soporte Helpdesk Anual",
      customer_id: "c6",  owner_id: "u1",  stage_id: "s4",
      amount: 16000, currency: "EUR", status: "won", store_code: "JT",
      created_at: "2026-02-05T09:00:00Z", closed_at: "2026-02-25T14:00:00Z"
    },
    {
      id: "d7",  title: "Auditoría de Ciberseguridad",
      customer_id: "c4",  owner_id: "u6",  stage_id: "s5",
      amount: 10000, currency: "EUR", status: "lost", store_code: "MZ",
      created_at: "2026-02-08T09:00:00Z", closed_at: "2026-02-25T14:00:00Z"
    },
    {
      id: "d8",  title: "Capacitación Ingesta Datos",
      customer_id: "c2",  owner_id: "u2",  stage_id: "s4",
      amount: 12000, currency: "EUR", status: "won", store_code: "PT",
      created_at: "2026-02-10T10:00:00Z", closed_at: "2026-02-28T16:00:00Z"
    },
    // ── March 2026 ────────────────────────────────────────────────
    {
      id: "d9",  title: "Desarrollo a Medida Mobile",
      customer_id: "c8",  owner_id: "u3",  stage_id: "s4",
      amount: 55000, currency: "EUR", status: "won", store_code: "PTB",
      created_at: "2026-03-01T11:00:00Z", closed_at: "2026-03-18T12:00:00Z"
    },
    {
      id: "d10", title: "Consultoría DevOps",
      customer_id: "c6",  owner_id: "u1",  stage_id: "s4",
      amount: 20000, currency: "EUR", status: "won", store_code: "SJ",
      created_at: "2026-03-05T10:00:00Z", closed_at: "2026-03-22T14:00:00Z"
    },
    {
      id: "d11", title: "Mantenimiento Preventivo IT",
      customer_id: "c5",  owner_id: "u4",  stage_id: "s5",
      amount: 5000, currency: "EUR", status: "lost", store_code: "SMA",
      created_at: "2026-03-08T09:00:00Z", closed_at: "2026-03-28T10:00:00Z"
    },
    {
      id: "d12", title: "Soporte L3 Licencias",
      customer_id: "c2",  owner_id: "u5",  stage_id: "s4",
      amount: 14500, currency: "EUR", status: "won", store_code: "VN",
      created_at: "2026-03-10T14:00:00Z", closed_at: "2026-03-30T10:00:00Z"
    },
    {
      id: "d13", title: "Auditoría SEO Corporativa",
      customer_id: "c3",  owner_id: "u6",  stage_id: "s5",
      amount: 4000, currency: "EUR", status: "lost", store_code: "XL",
      created_at: "2026-03-12T11:00:00Z", closed_at: "2026-03-28T15:00:00Z"
    },
    // ── April 2026 ────────────────────────────────────────────────
    {
      id: "d14", title: "Planes Avanzados Ciberseguridad",
      customer_id: "c3",  owner_id: "u2",  stage_id: "s4",
      amount: 35000, currency: "EUR", status: "won", store_code: "Z3",
      created_at: "2026-04-02T11:00:00Z", closed_at: "2026-04-22T16:00:00Z"
    },
    {
      id: "d15", title: "Rediseño Portal Corporativo",
      customer_id: "c8",  owner_id: "u3",  stage_id: "s4",
      amount: 22000, currency: "EUR", status: "won", store_code: "CB",
      created_at: "2026-04-05T09:00:00Z", closed_at: "2026-04-28T16:00:00Z"
    },
    {
      id: "d16", title: "Servicios Cloud Híbrido",
      customer_id: "c7",  owner_id: "u4",  stage_id: "s4",
      amount: 62000, currency: "EUR", status: "won", store_code: "CHM",
      created_at: "2026-04-08T09:00:00Z", closed_at: "2026-04-28T11:30:00Z"
    },
    {
      id: "d17", title: "Despliegue E-commerce",
      customer_id: "c6",  owner_id: "u5",  stage_id: "s4",
      amount: 29000, currency: "EUR", status: "won", store_code: "CHQ",
      created_at: "2026-04-10T10:00:00Z", closed_at: "2026-04-29T16:45:00Z"
    },
    {
      id: "d18", title: "Pack Seguridad Endpoint",
      customer_id: "c10", owner_id: "u6",  stage_id: "s5",
      amount: 7000, currency: "EUR", status: "lost", store_code: "ESC",
      created_at: "2026-04-15T10:00:00Z", closed_at: "2026-04-30T12:00:00Z"
    },
    // ── May 2026 ──────────────────────────────────────────────────
    {
      id: "d19", title: "Suscripción Data Analytics",
      customer_id: "c9",  owner_id: "u1",  stage_id: "s4",
      amount: 31000, currency: "EUR", status: "won", store_code: "HH",
      created_at: "2026-05-02T09:00:00Z", closed_at: "2026-05-20T15:00:00Z"
    },
    {
      id: "d20", title: "Integración API ERP",
      customer_id: "c7",  owner_id: "u2",  stage_id: "s4",
      amount: 22000, currency: "EUR", status: "won", store_code: "JT",
      created_at: "2026-05-05T10:00:00Z", closed_at: "2026-05-22T14:00:00Z"
    },
    {
      id: "d21", title: "Consultoría IoT Fase 1",
      customer_id: "c5",  owner_id: "u3",  stage_id: "s5",
      amount: 11000, currency: "EUR", status: "lost", store_code: "MZ",
      created_at: "2026-05-08T09:00:00Z", closed_at: "2026-05-25T11:00:00Z"
    },
    // ── June 2026 (Open deals — current month) ────────────────────
    {
      id: "d22", title: "Renovación Anual Enterprise",
      customer_id: "c2",  owner_id: "u1",  stage_id: "s3",
      amount: 48000, currency: "EUR", status: "open", store_code: "PT",
      created_at: "2026-06-01T09:00:00Z", expected_close_date: "2026-06-30"
    },
    {
      id: "d23", title: "Implementación ERP Completa",
      customer_id: "c1",  owner_id: "u2",  stage_id: "s3",
      amount: 85000, currency: "EUR", status: "open", store_code: "PTB",
      created_at: "2026-06-02T10:00:00Z", expected_close_date: "2026-07-30"
    },
    {
      id: "d24", title: "Integración de Sistemas API",
      customer_id: "c7",  owner_id: "u3",  stage_id: "s3",
      amount: 22000, currency: "EUR", status: "open", store_code: "SJ",
      created_at: "2026-06-03T10:00:00Z", expected_close_date: "2026-06-28"
    },
    {
      id: "d25", title: "Auditoría de Procesos B2B",
      customer_id: "c8",  owner_id: "u4",  stage_id: "s2",
      amount: 25000, currency: "EUR", status: "open", store_code: "SMA",
      created_at: "2026-06-03T10:00:00Z", expected_close_date: "2026-07-15"
    },
    {
      id: "d26", title: "Ampliación Módulos ERP",
      customer_id: "c1",  owner_id: "u5",  stage_id: "s2",
      amount: 15000, currency: "EUR", status: "open", store_code: "VN",
      created_at: "2026-06-04T14:00:00Z", expected_close_date: "2026-07-20"
    },
    {
      id: "d27", title: "Licencias Adicionales CRM",
      customer_id: "c1",  owner_id: "u6",  stage_id: "s2",
      amount: 6000, currency: "EUR", status: "open", store_code: "XL",
      created_at: "2026-06-05T10:00:00Z", expected_close_date: "2026-06-20"
    },
    {
      id: "d28", title: "Campaña Google Ads & SEO",
      customer_id: "c4",  owner_id: "u1",  stage_id: "s2",
      amount: 18000, currency: "EUR", status: "open", store_code: "Z3",
      created_at: "2026-06-05T10:00:00Z", expected_close_date: "2026-06-25"
    },
    {
      id: "d29", title: "Consultoría UX/UI",
      customer_id: "c5",  owner_id: "u2",  stage_id: "s1",
      amount: 5000, currency: "EUR", status: "open", store_code: "CB",
      created_at: "2026-06-06T10:00:00Z", expected_close_date: "2026-07-30"
    },
    {
      id: "d30", title: "Actualización Infraestructura",
      customer_id: "c7",  owner_id: "u3",  stage_id: "s1",
      amount: 30000, currency: "EUR", status: "open", store_code: "CHM",
      created_at: "2026-06-06T11:00:00Z", expected_close_date: "2026-08-15"
    },
    {
      id: "d31", title: "Ampliación Licencias SaaS",
      customer_id: "c10", owner_id: "u4",  stage_id: "s3",
      amount: 7500, currency: "EUR", status: "open", store_code: "CHQ",
      created_at: "2026-06-07T11:00:00Z", expected_close_date: "2026-06-30"
    },
    {
      id: "d32", title: "Soporte Cloud Nivel 2",
      customer_id: "c3",  owner_id: "u5",  stage_id: "s1",
      amount: 14000, currency: "EUR", status: "open", store_code: "ESC",
      created_at: "2026-06-07T09:00:00Z", expected_close_date: "2026-07-10"
    }
  ]
};
