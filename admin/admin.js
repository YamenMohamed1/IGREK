(() => {
  const key = 'igrek-content-v1';
  const tokenKey = 'igrek-admin-token';
  const defaults = {
    sections: [
      { id: 'about', title: 'About Us', builtIn: true, paragraphs: ['IGREK Outsourcing turns every customer conversation into a lasting advantage for ambitious brands.'] },
      { id: 'why-us', title: 'WHY IGREK', builtIn: true, paragraphs: ['Everything we build is designed to create better outcomes—for your customers, your team, and your bottom line.'] },
      { id: 'reviews', title: 'Reviews', builtIn: true, paragraphs: ['Hear from the brands that trust IGREK to deliver standout customer experiences.'] }
    ]
  };

  const get = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      if (!stored?.sections) return structuredClone(defaults);
      stored.sections = stored.sections.filter(section => section.id !== 'results');
      return stored;
    } catch {
      return structuredClone(defaults);
    }
  };

  window.igrekAdmin = {
    getContent: get,
    saveContent: updated => {
      localStorage.setItem(key, JSON.stringify(updated));
    }
  };

  let content = get();
  const login = document.querySelector('#login');
  const admin = document.querySelector('#admin');
  const list = document.querySelector('#sections');
  const errorEl = document.querySelector('#error');
  const statusEl = document.querySelector('#status');

  const escape = value => String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const slug = value => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `section-${Date.now()}`;

  function render() {
    list.innerHTML = content.sections.map((section, index) => `
      <article class="section-card card" data-index="${index}">
        <div class="card-header">
          <div>
            <h2>${section.builtIn ? 'Main website section' : 'Custom website section'}</h2>
            <small>${section.builtIn ? 'Shown in the main navigation' : 'Added to the main menu when saved'}</small>
          </div>
          <div>
            ${index ? '<button class="move-up" type="button">↑ Move up</button>' : ''}
            ${index < content.sections.length - 1 ? '<button class="move-down" type="button">↓ Move down</button>' : ''}
            ${section.builtIn ? '' : '<button class="delete" type="button">Delete section</button>'}
          </div>
        </div>
        <label>Section title<input class="section-title" value="${escape(section.title)}" required></label>
        <div class="paragraph-list">
          ${(section.paragraphs || []).map(paragraph => {
            const value = typeof paragraph === 'string' ? { title: '', text: paragraph } : paragraph || { title: '', text: '' };
            return `
              <div class="paragraph">
                <div class="paragraph-fields">
                  <input class="paragraph-title" value="${escape(value.title || '')}" placeholder="Optional paragraph heading (e.g. Talent, Not Just Agents)">
                  <textarea class="paragraph-text" placeholder="Paragraph body text...">${escape(value.text || '')}</textarea>
                </div>
                <button class="remove" type="button" title="Remove paragraph">✕</button>
              </div>
            `;
          }).join('')}
        </div>
        <button class="add add-paragraph" type="button" style="margin-top:8px">+ Add paragraph</button>
      </article>
    `).join('');

    document.dispatchEvent(new CustomEvent('igrek:sections-rendered', { detail: { content } }));
  }

  function showDashboard() {
    login.hidden = true;
    admin.hidden = false;
    render();
    loadApplications();
  }

  // Check existing session
  const existingToken = sessionStorage.getItem(tokenKey);
  if (existingToken) {
    showDashboard();
  }

  // Login Form Submission
  document.querySelector('#login-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    errorEl.textContent = '';
    const form = new FormData(event.currentTarget);
    const username = form.get('username');
    const password = form.get('password');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok && data.success && data.token) {
        sessionStorage.setItem(tokenKey, data.token);
        showDashboard();
      } else {
        errorEl.textContent = data.error || 'Incorrect username or password.';
      }
    } catch {
      errorEl.textContent = 'Server unreachable. Please check connection.';
    }
  });

  // Logout
  document.querySelector('#logout')?.addEventListener('click', () => {
    sessionStorage.removeItem(tokenKey);
    admin.hidden = true;
    login.hidden = false;
    errorEl.textContent = '';
  });

  // Tab switching
  const tabContent = document.querySelector('#tab-content');
  const tabApps = document.querySelector('#tab-applications');
  const viewContent = document.querySelector('#content-tab-view');
  const viewApps = document.querySelector('#applications-tab-view');

  tabContent?.addEventListener('click', () => {
    tabContent.classList.add('active');
    tabApps.classList.remove('active');
    viewContent.hidden = false;
    viewApps.hidden = true;
  });

  tabApps?.addEventListener('click', () => {
    tabApps.classList.add('active');
    tabContent.classList.remove('active');
    viewApps.hidden = false;
    viewContent.hidden = true;
    loadApplications();
  });

  // Add custom section
  document.querySelector('#add-section')?.addEventListener('click', () => {
    content.sections.push({
      id: `section-${Date.now()}`,
      title: 'New Section',
      builtIn: false,
      paragraphs: [{ title: '', text: 'Add your section content here.' }]
    });
    render();
  });

  // Section card interaction
  list?.addEventListener('click', event => {
    const card = event.target.closest('.section-card');
    if (!card) return;
    const index = Number(card.dataset.index);
    const section = content.sections[index];

    if (event.target.classList.contains('move-up') && index > 0) {
      [content.sections[index - 1], content.sections[index]] = [content.sections[index], content.sections[index - 1]];
      render();
    } else if (event.target.classList.contains('move-down') && index < content.sections.length - 1) {
      [content.sections[index], content.sections[index + 1]] = [content.sections[index + 1], content.sections[index]];
      render();
    } else if (event.target.classList.contains('delete')) {
      if (confirm(`Delete "${section.title}"?`)) {
        content.sections.splice(index, 1);
        render();
      }
    } else if (event.target.classList.contains('add-paragraph')) {
      section.paragraphs ||= [];
      section.paragraphs.push({ title: '', text: '' });
      render();
    } else if (event.target.classList.contains('remove')) {
      const row = event.target.closest('.paragraph');
      const pIndex = [...card.querySelectorAll('.paragraph')].indexOf(row);
      section.paragraphs.splice(pIndex, 1);
      render();
    }
  });

  // Applications fetching and rendering
  async function loadApplications() {
    const listEl = document.querySelector('#applications-list');
    const badgeEl = document.querySelector('#app-badge');
    const token = sessionStorage.getItem(tokenKey);
    if (!token) return;

    try {
      const res = await fetch('/api/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load applications');
      const apps = await res.json();

      if (badgeEl) badgeEl.textContent = apps.length;

      if (!apps.length) {
        listEl.innerHTML = '<p class="empty-state">No applications received yet. Submissions from the /apply page will appear here.</p>';
        return;
      }

      listEl.innerHTML = apps.map(app => {
        const dateStr = app.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'N/A';
        const vocarooUrl = app.vocaroo ? escape(app.vocaroo) : '';
        return `
          <article class="app-card">
            <div class="app-top">
              <div>
                <h3>${escape(app.name)}</h3>
                <span class="app-date">Submitted on ${dateStr}</span>
              </div>
            </div>
            <div class="app-grid">
              <div class="app-field">
                <label>Email</label>
                <a href="mailto:${escape(app.email)}">${escape(app.email)}</a>
              </div>
              <div class="app-field">
                <label>Phone</label>
                <a href="tel:${escape(app.phone)}">${escape(app.phone)}</a>
              </div>
              <div class="app-field">
                <label>Call Center Experience</label>
                <span>${escape(app.experience)}</span>
              </div>
              <div class="app-field">
                <label>Last Position</label>
                <span>${escape(app.lastPosition)}</span>
              </div>
            </div>
            ${vocarooUrl ? `
              <div class="vocaroo-box">
                <div>
                  <strong>Voice Introduction</strong>
                  <div style="font-size:12px;color:var(--text-muted);word-break:break-all">${vocarooUrl}</div>
                </div>
                <a href="${vocarooUrl}" target="_blank" rel="noreferrer">Open Recording ↗</a>
              </div>
            ` : ''}
          </article>
        `;
      }).join('');
    } catch (err) {
      if (listEl) listEl.innerHTML = `<p class="empty-state" style="color:#ff9999">Error loading applications: ${escape(err.message)}</p>`;
    }
  }

  document.querySelector('#refresh-apps')?.addEventListener('click', loadApplications);

  // Unified Editor Submit Handler (No race conditions!)
  document.querySelector('#editor')?.addEventListener('submit', async event => {
    event.preventDefault();
    statusEl.textContent = 'Saving changes...';
    statusEl.style.color = '#d9b4f6';

    // 1. Gather Section cards
    [...list.querySelectorAll('.section-card')].forEach(card => {
      const section = content.sections[Number(card.dataset.index)];
      if (!section) return;
      section.title = card.querySelector('.section-title').value.trim() || section.title;
      if (!section.builtIn) section.id = slug(section.title);
      section.paragraphs = [...card.querySelectorAll('.paragraph')].map(row => ({
        title: row.querySelector('.paragraph-title').value.trim(),
        text: row.querySelector('.paragraph-text').value.trim()
      })).filter(p => p.text || p.title);
    });

    // 2. Allow admin-cards.js to populate cards and apply data into content
    document.dispatchEvent(new CustomEvent('igrek:gather-card-data', { detail: { content } }));

    // 3. Save to localStorage
    localStorage.setItem(key, JSON.stringify(content));

    // 4. Save to server with authentication
    const token = sessionStorage.getItem(tokenKey);
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(content)
      });

      if (!response.ok) {
        throw new Error('Server rejected save. Session may have expired.');
      }

      statusEl.textContent = '✓ Saved successfully to server and website!';
      statusEl.style.color = '#8ae99c';
    } catch (err) {
      statusEl.textContent = `Saved locally, but server update failed (${err.message}).`;
      statusEl.style.color = '#ffb7bd';
    }
  });
})();
