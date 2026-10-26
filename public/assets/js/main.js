(() => {
  'use strict';
  const config = window.MASOOM_CONFIG || {};
  let projectFallback = window.MASOOM_PROJECTS || [];
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const menuButton = $('.menu-toggle');
  const nav = $('#main-nav');
  const navLinks = $$('.nav-link');

  function closeMenu() {
    nav?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'باز کردن منو');
  }
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
    nav?.classList.toggle('is-open', open);
  });
  navLinks.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -25px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  const sections = $$('main section[id]');
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(section => sectionObserver.observe(section));
  }

  const portrait = $('#hero-portrait');
  const portraitFrame = $('#portrait-frame');
  if (portrait) {
    portrait.addEventListener('error', () => portraitFrame?.classList.add('portrait-empty'), { once: true });
    if (portrait.complete && portrait.naturalWidth === 0) portraitFrame?.classList.add('portrait-empty');
  }

  $('#current-year').textContent = String(new Date().getFullYear());

  const email = String(config.email || '').trim();
  const emailLink = $('#email-link');
  const copyButton = $('#copy-email');
  const contactFeedback = $('#contact-feedback');
  const configuredEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.includes('your-email@example.com');
  if (configuredEmail) {
    emailLink.textContent = email;
    emailLink.href = `mailto:${email}`;
    emailLink.dir = 'ltr';
    copyButton.disabled = false;
  } else {
    emailLink.textContent = 'ایمیل را در فایل config.js تنظیم کن';
    emailLink.removeAttribute('href');
    emailLink.setAttribute('aria-disabled', 'true');
    copyButton.disabled = true;
  }
  copyButton?.addEventListener('click', async () => {
    if (!configuredEmail) return;
    try {
      await navigator.clipboard.writeText(email);
      contactFeedback.textContent = 'آدرس ایمیل کپی شد.';
    } catch {
      contactFeedback.textContent = `کپی خودکار در دسترس نیست؛ ایمیل را دستی انتخاب کن: ${email}`;
    }
  });

  const form = $('#contact-form');
  const formStatus = $('#form-status');
  const submitButton = $('.submit-button', form || document);
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(form).entries());
    submitButton.disabled = true;
    $('.submit-label', submitButton).textContent = 'در حال ارسال...';
    formStatus.textContent = 'در حال بررسی و ثبت پیام...';
    formStatus.className = 'form-status';
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'ثبت پیام انجام نشد.');
      formStatus.textContent = result.message || 'پیام ثبت شد.';
      formStatus.classList.add('success');
      form.reset();
    } catch (error) {
      formStatus.textContent = error.message || 'ارتباط با سرور برقرار نشد. از ایمیل استفاده کن.';
      formStatus.classList.add('error');
    } finally {
      submitButton.disabled = false;
      $('.submit-label', submitButton).textContent = 'ارسال پیام';
    }
  });

  // Public project API. The local cards remain available if the API/database is not configured.
  async function loadProjects() {
    const note = $('#api-note');
    try {
      const response = await fetch('/api/projects', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('API unavailable');
      const result = await response.json();
      if (!result.ok || !Array.isArray(result.data) || !result.data.length) throw new Error('No project data');
      if (result.source === 'database') {
        projectFallback = result.data;
        renderProjectCards(result.data);
        if (note) note.textContent = 'اطلاعات پروژه‌ها از دیتابیس خوانده می‌شود.';
      } else if (note) {
        note.textContent = 'نمایش اطلاعات پیش‌فرض پروژه‌ها؛ برای ویرایش مرکزی، دیتابیس را تنظیم کن.';
      }
    } catch {
      if (note) note.textContent = 'API در دسترس نیست؛ پروژه‌ها با محتوای محلی نمایش داده می‌شوند.';
    }
  }

  function renderProjectCards(projects) {
    const grid = $('#projects-grid');
    if (!grid) return;
    const visualClass = { 'akbarzadeh-academy': 'project-academy', 'persia-tour': 'project-travel', 'nova-ai': 'project-nova' };
    const visualHtml = {
      'akbarzadeh-academy': '<div class="project-art art-academy"><div class="art-label">STUDY / SYSTEM</div><div class="art-board"><span>WEEKLY REPORT</span><div class="art-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="art-bottom"><b>01</b><span>FOCUS / REVIEW / REPEAT</span></div></div></div>',
      'persia-tour': '<div class="project-art art-travel"><div class="travel-sun"></div><div class="travel-mountain mountain-a"></div><div class="travel-mountain mountain-b"></div><div class="travel-card-mini"><span>DESTINATION / 02</span><b>Explore<br>somewhere new.</b><i>TRAVEL INTERFACE</i></div></div>',
      'nova-ai': '<div class="project-art art-nova"><div class="nova-orbit orbit-a"></div><div class="nova-orbit orbit-b"></div><div class="nova-core">N<span>·</span></div><div class="nova-label">NOVA / EXPERIMENT</div><div class="nova-lines"><i></i><i></i><i></i></div></div>'
    };
    grid.replaceChildren();
    projects.forEach((project, index) => {
      const article = document.createElement('article');
      article.className = `project-card ${visualClass[project.slug] || ''}`;
      const art = document.createElement('div');
      art.innerHTML = visualHtml[project.slug] || '<div class="project-art art-default"><span>MASOOM / PROJECT</span></div>';
      article.append(art.firstElementChild);
      const info = document.createElement('div');
      info.className = 'project-info';
      const meta = document.createElement('div');
      meta.className = 'project-meta';
      const category = document.createElement('span');
      category.textContent = `${String(index + 1).padStart(2, '0')} / ${project.category || 'PROJECT'}`;
      const status = document.createElement('span');
      status.className = 'project-status';
      status.textContent = project.status || 'در حال توسعه';
      meta.append(category, status);
      const title = document.createElement('h3'); title.textContent = project.title;
      const description = document.createElement('p'); description.textContent = project.description;
      const foot = document.createElement('div'); foot.className = 'project-foot';
      const tags = document.createElement('div'); tags.className = 'tag-list';
      (Array.isArray(project.technologies) ? project.technologies : []).slice(0, 3).forEach(value => {
        const tag = document.createElement('span'); tag.textContent = value; tags.append(tag);
      });
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'text-button project-detail';
      button.dataset.project = project.slug;
      button.append(document.createTextNode('جزئیات پروژه '));
      const arrow = document.createElement('span'); arrow.textContent = '↖'; button.append(arrow);
      foot.append(tags, button);
      info.append(meta, title, description, foot);
      article.append(info);
      grid.append(article);
    });
  }

  const dialog = $('#project-dialog');
  const closeDialog = $('.dialog-close', dialog || document);
  function openProject(project) {
    if (!project || !dialog) return;
    $('#dialog-status').textContent = project.status || 'در حال توسعه';
    $('#dialog-title').textContent = project.title || 'پروژه';
    $('#dialog-description').textContent = project.description || '';
    const tags = $('#dialog-tags');
    tags.replaceChildren();
    (Array.isArray(project.technologies) ? project.technologies : []).forEach(value => {
      const span = document.createElement('span'); span.textContent = value; tags.append(span);
    });
    const liveLink = $('#dialog-live-link');
    if (project.url && /^https?:\/\//i.test(project.url)) {
      liveLink.href = project.url;
      liveLink.hidden = false;
    } else {
      liveLink.hidden = true;
      liveLink.removeAttribute('href');
    }
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    closeDialog?.focus();
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('.project-detail');
    if (!button) return;
    const slug = button.dataset.project;
    const project = projectFallback.find(item => item.slug === slug);
    if (project) openProject(project);
    else {
      fetch(`/api/projects/${encodeURIComponent(slug)}`).then(r => r.json()).then(result => openProject(result.data)).catch(() => {});
    }
  });
  closeDialog?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  loadProjects();
})();
