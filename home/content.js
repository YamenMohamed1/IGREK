(() => {
  const key = 'igrek-content-v1';
  const defaults = {
    sections: [
      { id: 'about', title: 'About Us', builtIn: true, paragraphs: ['IGREK Outsourcing turns every customer conversation into a lasting advantage for ambitious brands.'] },
      { id: 'why-us', title: 'WHY IGREK', builtIn: true, paragraphs: ['Everything we build is designed to create better outcomes—for your customers, your team, and your bottom line.'] },
      { id: 'reviews', title: 'Reviews', builtIn: true, paragraphs: ['Hear from the brands that trust IGREK to deliver standout customer experiences.'] }
    ]
  };

  let data;
  try {
    data = JSON.parse(localStorage.getItem(key)) || defaults;
  } catch {
    data = defaults;
  }

  data.sections = (data.sections || defaults.sections).filter(section => section.id !== 'results');
  data.site ||= { footerTagline: 'People. Performance. Growth.', copyright: 'IGREK Outsourcing', links: { home: '/home/', apply: '/apply/' } };
  data.site.links ||= { home: '/home/', apply: '/apply/' };

  // Site links
  document.querySelectorAll('[data-link="apply"]').forEach(link => { link.href = data.site.links.apply; });
  document.querySelectorAll('footer [data-link="home"]').forEach(link => { link.href = data.site.links.home; });

  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Footer branding
  if (data.site.footerTagline) document.querySelector('[data-footer-tagline]')?.replaceChildren(document.createTextNode(data.site.footerTagline));
  if (data.site.copyright) document.querySelector('[data-footer-copyright]')?.replaceChildren(document.createTextNode(data.site.copyright));

  const paragraphParts = paragraph => typeof paragraph === 'string' ? { title: '', text: paragraph } : { title: paragraph?.title || '', text: paragraph?.text || '' };

  // Render Built-in Sections
  data.sections.filter(s => s.builtIn).forEach(s => {
    const el = document.querySelector(`[data-content-section="${s.id}"]`);
    if (!el) return;
    const paragraphs = (s.paragraphs || []).map(paragraphParts).filter(p => p.text);
    el.innerHTML = paragraphs.map(p => `<p>${p.title ? `<strong>${esc(p.title)}</strong>` : ''}${esc(p.text)}</p>`).join('');
  });

  // Update Nav Section Titles
  data.sections.filter(s => s.builtIn).forEach(s => {
    document.querySelectorAll(`[data-nav-section="${s.id}"]`).forEach(link => link.textContent = s.title);
  });

  // Render Custom Sections
  const custom = document.querySelector('#custom-content-sections');
  if (custom) {
    custom.innerHTML = data.sections.filter(s => !s.builtIn).map(s => `
      <section class="section container custom-content" id="${esc(s.id)}">
        <div class="section-heading">
          <p class="eyebrow"><span></span> IGREK Outsourcing</p>
          <h2>${esc(s.title)}</h2>
          <div class="content-paragraphs">
            ${(s.paragraphs || []).map(paragraphParts).filter(p => p.text).map(p => `<p>${p.title ? `<strong>${esc(p.title)}</strong>` : ''}${esc(p.text)}</p>`).join('')}
          </div>
        </div>
      </section>
    `).join('');
  }

  // Navigation Links
  const navigation = document.querySelector('#nav-links');
  navigation?.querySelectorAll('[data-custom-nav]').forEach(link => link.remove());
  data.sections.filter(s => !s.builtIn).forEach(s => {
    const link = document.createElement('a');
    link.href = `#${s.id}`;
    link.dataset.customNav = 'true';
    link.textContent = s.title;
    navigation?.querySelector('.nav-cta')?.before(link);
  });

  // Section Reordering
  const sectionNodes = { about: document.querySelector('#about'), 'why-us': document.querySelector('#why-us'), reviews: document.querySelector('#reviews') };
  data.sections.filter(s => !s.builtIn).forEach(s => { sectionNodes[s.id] = document.querySelector(`#${CSS.escape(s.id)}`); });
  if (custom) {
    const orderedNodes = data.sections.map(s => sectionNodes[s.id]).filter(Boolean);
    orderedNodes.forEach(node => custom.parentNode.append(node));
    custom.remove();
  }

  // Cards Configuration
  data.cards ||= {};
  data.cards.benefits ||= [
    { title: 'Always-on support', text: 'Seamless, responsive customer care around the clock—wherever your customers are.' },
    { title: 'Exceptional talent', text: 'Highly trained agents who sound like your brand, understand your world, and own every outcome.' },
    { title: 'One connected service', text: 'Voice, chat, email, and social managed in one intelligent, effortlessly consistent experience.' }
  ];

  const benefitIcons = [
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-2a8 8 0 0 1 16 0v2M4 13v4a2 2 0 0 0 2 2h2v-6H4Zm16 0v4a2 2 0 0 1-2 2h-2v-6h4Z"/><path d="M16 19c0 2-2 2-4 2"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.2 4.5L19 8.2l-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8L5 8.2l4.8-.7L12 3Z"/><path d="M19 15.5c.6.4 1 .9 1 1.5 0 1.1-1.2 2-2.7 2H6.7C5.2 19 4 18.1 4 17c0-.6.4-1.1 1-1.5"/></svg>',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 18H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-3"/><rect x="8" y="12" width="8" height="8" rx="1"/><path d="M10.5 16h3"/></svg>'
  ];

  // Render Benefits maintaining glassmorphic cards and SVG icons
  const benefitGrid = document.querySelector('.benefit-grid');
  if (benefitGrid && Array.isArray(data.cards.benefits)) {
    benefitGrid.innerHTML = data.cards.benefits.map((item, index) => `
      <article class="benefit glass-card">
        <div class="icon">${benefitIcons[index % benefitIcons.length]}</div>
        <p class="number">${String(index + 1).padStart(2, '0')}</p>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.text)}</p>
      </article>
    `).join('');
  }

  // Render Reviews maintaining glassmorphic cards
  const initials = name => String(name || '?').trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const reviewGrid = document.querySelector('.review-grid');
  if (reviewGrid && Array.isArray(data.cards.reviews)) {
    reviewGrid.innerHTML = data.cards.reviews.map(item => `
      <figure class="review glass-card">
        <div class="stars">★★★★★</div>
        <blockquote>${esc(item.quote)}</blockquote>
        <figcaption>
          <div class="avatar">${esc(initials(item.name))}</div>
          <div>
            <strong>${esc(item.name)}</strong>
            <span>${esc(item.role)}</span>
          </div>
        </figcaption>
      </figure>
    `).join('');
  }
})();
