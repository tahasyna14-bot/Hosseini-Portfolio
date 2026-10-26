CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(120) NOT NULL,
  visual VARCHAR(40) NOT NULL DEFAULT 'default',
  url TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 3000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_published_sort
  ON projects (is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created
  ON contact_messages (created_at DESC);

INSERT INTO projects (slug, title, category, description, technologies, status, visual, sort_order)
VALUES
('akbarzadeh-academy', 'آکادمی اکبرزاده', 'سامانه گزارش‌کار و برنامه‌ریزی مطالعه',
 'وب‌سایتی برای سازمان‌دهی گزارش مطالعه، جزئیات درس، تعداد تست، بازدهی، توضیحات و برنامه هفتگی.',
 ARRAY['HTML','CSS','JavaScript','Cloudflare Workers','D1'], 'در حال توسعه', 'academy', 1),
('persia-tour', 'پرشیا تور', 'وب‌سایت گردشگری',
 'رابطی برای معرفی تورهای داخلی و خارجی، جست‌وجوی مقصد و نمایش اطلاعات سفر؛ قابلیت رزرو و پرداخت فقط پس از پیاده‌سازی و آزمایش قابل تأیید است.',
 ARRAY['HTML','CSS','JavaScript'], 'رابط کاربری / در حال تکمیل', 'travel', 2),
('nova-ai', 'NOVA AI', 'نمونه اولیه دستیار هوشمند',
 'نمونه اولیه رابط گفت‌وگو با بک‌اند پایتون و FastAPI؛ اتصال نهایی به مدل نیازمند بررسی و تکمیل است.',
 ARRAY['Python','FastAPI','AI API'], 'نمونه اولیه', 'nova', 3)
ON CONFLICT (slug) DO NOTHING;
