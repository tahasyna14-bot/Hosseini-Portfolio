import { getPool, databaseEnabled } from './pool.js';

const fallbackProjects = [
  {
    id: 'academy-akbarzadeh',
    slug: 'akbarzadeh-academy',
    title: 'آکادمی اکبرزاده',
    category: 'سامانه گزارش‌کار و برنامه‌ریزی مطالعه',
    description: 'وب‌سایتی برای سازمان‌دهی گزارش مطالعه، جزئیات درس، تعداد تست، بازدهی، توضیحات و برنامه هفتگی.',
    technologies: ['HTML', 'CSS', 'JavaScript', 'Cloudflare Workers', 'D1'],
    status: 'در حال توسعه',
    visual: 'academy',
    url: ''
  },
  {
    id: 'persia-tour',
    slug: 'persia-tour',
    title: 'پرشیا تور',
    category: 'وب‌سایت گردشگری',
    description: 'رابطی برای معرفی تورهای داخلی و خارجی، جست‌وجوی مقصد و نمایش اطلاعات سفر؛ قابلیت رزرو و پرداخت فقط پس از پیاده‌سازی و آزمایش قابل تأیید است.',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    status: 'رابط کاربری / در حال تکمیل',
    visual: 'travel',
    url: ''
  },
  {
    id: 'nova-ai',
    slug: 'nova-ai',
    title: 'NOVA AI',
    category: 'نمونه اولیه دستیار هوشمند',
    description: 'نمونه اولیه رابط گفت‌وگو با بک‌اند پایتون و FastAPI؛ اتصال نهایی به مدل نیازمند بررسی و تکمیل است.',
    technologies: ['Python', 'FastAPI', 'AI API'],
    status: 'نمونه اولیه',
    visual: 'nova',
    url: ''
  }
];

function mapProject(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    description: row.description,
    technologies: Array.isArray(row.technologies) ? row.technologies : [],
    status: row.status,
    visual: row.visual || 'default',
    url: row.url || ''
  };
}

export async function getProjects() {
  if (!databaseEnabled()) return fallbackProjects;
  const result = await getPool().query(
    `SELECT id, slug, title, category, description, technologies, status, visual, url
     FROM projects WHERE is_published = TRUE ORDER BY sort_order ASC, created_at DESC`
  );
  return result.rows.length ? result.rows.map(mapProject) : fallbackProjects;
}

export async function getProjectBySlug(slug) {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug) || null;
}

export async function saveContactMessage({ name, email, message }) {
  const result = await getPool().query(
    `INSERT INTO contact_messages (name, email, message)
     VALUES ($1, $2, $3) RETURNING id`,
    [name, email, message]
  );
  return result.rows[0];
}
