(() => {
  const key = 'igrek-content-v1';
  const defaults = {
    benefits: [
      { title: 'Always-on support', text: 'Seamless, responsive customer care around the clock—wherever your customers are.' },
      { title: 'Exceptional talent', text: 'Highly trained agents who sound like your brand, understand your world, and own every outcome.' },
      { title: 'One connected service', text: 'Voice, chat, email, and social managed in one intelligent, effortlessly consistent experience.' }
    ],
    reviews: [
      { quote: '“IGREK feels less like an outsourced team and more like an extension of our own. Our customer satisfaction numbers prove it.”', name: 'Alex Morgan', role: 'VP Operations, Novelle' },
      { quote: '“They brought a level of process, care, and agility that transformed how our customers experience our brand.”', name: 'Jordan Smith', role: 'Customer Director, Vela' },
      { quote: '“From day one, the IGREK team has been proactive, sharp, and completely invested in our growth.”', name: 'Riley Kim', role: 'Founder, Northstar' }
    ]
  };

  const get = () => {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch {
      return {};
    }
  };

  const esc = value => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const field = (label, attr, value, area = false) => `
    <label style="display:grid;gap:6px;margin:8px 0">
      <span style="font-size:12px;color:var(--text-muted);font-weight:bold">${esc(label)}</span>
      ${area ? `<textarea ${attr}>${esc(value)}</textarea>` : `<input ${attr} value="${esc(value)}">`}
    </label>
  `;

  const reviewFields = (review, index) => `
    <div class="review-editor card" style="background:rgba(0,0,0,0.2);margin:12px 0;padding:16px" data-review-index="${index}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h3 style="margin:0;font-size:15px;color:#d9b4f6">Review ${index + 1}</h3>
        <button type="button" class="remove-review">Remove review</button>
      </div>
      ${field('Quote', `data-rq="${index}"`, review.quote, true)}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${field('Name', `data-rn="${index}"`, review.name)}
        ${field('Role / Company', `data-rr="${index}"`, review.role)}
      </div>
    </div>
  `;

  function renderCards(contentData) {
    const parent = document.querySelector('#sections');
    if (!parent) return;

    // Remove existing details if re-rendering
    document.querySelector('#content-details')?.remove();
    document.querySelector('#apply-editor')?.remove();

    const data = contentData || get();
    const cards = data.cards || {};
    const benefits = (cards.benefits && cards.benefits.length) ? cards.benefits : defaults.benefits;
    const reviews = (cards.reviews && cards.reviews.length) ? cards.reviews : defaults.reviews;

    // 1. Benefit Cards & Reviews Editor
    const detailsSection = document.createElement('section');
    detailsSection.id = 'content-details';
    detailsSection.className = 'card';
    detailsSection.innerHTML = `
      <h2>Benefit Highlights Cards (3 Cards)</h2>
      <small style="display:block;margin-bottom:14px;color:var(--text-muted)">These are the 3 featured cards shown directly below the "WHY IGREK" heading.</small>
      <div class="benefits-editors">
        ${benefits.map((item, index) => `
          <div style="background:rgba(0,0,0,0.2);padding:14px;border-radius:6px;margin-bottom:12px;border:1px solid rgba(255,255,255,0.05)">
            <strong style="color:#d9b4f6;font-size:13px">Card ${index + 1}</strong>
            ${field('Title', `data-bt="${index}"`, item.title)}
            ${field('Description', `data-bx="${index}"`, item.text, true)}
          </div>
        `).join('')}
      </div>

      <h2 style="margin-top:28px">Client Reviews</h2>
      <small style="display:block;margin-bottom:14px;color:var(--text-muted)">Testimonials displayed in the client stories section.</small>
      <div id="review-editors">
        ${reviews.map(reviewFields).join('')}
      </div>
      <button type="button" id="add-review" style="margin-top:10px">+ Add new review</button>
    `;

    // 2. Apply Page Content Editor
    const apply = data.apply || {
      eyebrow: 'Let’s make it happen',
      heading: 'Ready for better conversations?',
      description: 'Tell us what you need. We’ll be in touch within one business day.',
      email: 'hello@igrekoutsourcing.com',
      button: 'Submit application',
      nameLabel: 'Full Name',
      emailLabel: 'Email',
      phoneLabel: 'Phone Number',
      vocarooLabel: 'Vocaroo Link',
      experienceLabel: 'Experience In Call Center',
      lastPositionLabel: 'Last Position',
      vocarooHelp: 'Record your voice intro on Vocaroo, then paste your link here.',
      experienceOptions: ['No Experience', 'Less Than 1 Year', '1-3 Years', '3-5 Years']
    };

    const expOptions = Array.isArray(apply.experienceOptions) ? apply.experienceOptions : ['No Experience', 'Less Than 1 Year', '1-3 Years', '3-5 Years'];

    const applySection = document.createElement('section');
    applySection.id = 'apply-editor';
    applySection.className = 'card';
    applySection.innerHTML = `
      <h2>Application Page Content</h2>
      <small style="display:block;margin-bottom:14px;color:var(--text-muted)">Customizes the text, labels, and options shown on /apply/.</small>
      <div class="card-fields">
        ${field('Page Subheading (Eyebrow)', 'data-apply="eyebrow"', apply.eyebrow)}
        ${field('Main Heading', 'data-apply="heading"', apply.heading)}
        ${field('Intro Description', 'data-apply="description"', apply.description, true)}
        ${field('Contact Email', 'data-apply="email"', apply.email)}
        ${field('Submit Button Text', 'data-apply="button"', apply.button)}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          ${field('Full Name Field Label', 'data-apply="nameLabel"', apply.nameLabel)}
          ${field('Email Field Label', 'data-apply="emailLabel"', apply.emailLabel)}
          ${field('Phone Field Label', 'data-apply="phoneLabel"', apply.phoneLabel)}
          ${field('Last Position Label', 'data-apply="lastPositionLabel"', apply.lastPositionLabel)}
        </div>
        ${field('Vocaroo Link Field Label', 'data-apply="vocarooLabel"', apply.vocarooLabel)}
        ${field('Vocaroo Instructions Text', 'data-apply="vocarooHelp"', apply.vocarooHelp, true)}
        ${field('Experience Question Label', 'data-apply="experienceLabel"', apply.experienceLabel)}
        ${field('Experience Radio Options (one option per line)', 'data-experience-options', expOptions.join('\n'), true)}
      </div>
    `;

    parent.append(detailsSection);
    parent.append(applySection);
  }

  function renumberReviews() {
    document.querySelectorAll('.review-editor').forEach((editor, index) => {
      editor.dataset.reviewIndex = index;
      editor.querySelector('h3').textContent = `Review ${index + 1}`;
      const rq = editor.querySelector('[data-rq]');
      const rn = editor.querySelector('[data-rn]');
      const rr = editor.querySelector('[data-rr]');
      if (rq) rq.dataset.rq = index;
      if (rn) rn.dataset.rn = index;
      if (rr) rr.dataset.rr = index;
    });
  }

  // Hook into section rendering
  document.addEventListener('igrek:sections-rendered', e => {
    renderCards(e.detail?.content);
  });

  // Handle review adding and removal
  document.querySelector('#editor')?.addEventListener('click', event => {
    if (event.target.id === 'add-review') {
      const editors = document.querySelector('#review-editors');
      if (editors) {
        editors.insertAdjacentHTML('beforeend', reviewFields({ quote: '', name: '', role: '' }, editors.children.length));
        renumberReviews();
      }
    } else if (event.target.classList.contains('remove-review')) {
      event.target.closest('.review-editor')?.remove();
      renumberReviews();
    }
  });

  // Collect cards and apply data when main editor submits (No race condition!)
  document.addEventListener('igrek:gather-card-data', event => {
    const content = event.detail.content;
    if (!content) return;

    const value = selector => document.querySelector(selector)?.value.trim() || '';

    // Collect Benefits
    content.cards ||= {};
    const benefitCount = document.querySelectorAll('[data-bt]').length || 3;
    content.cards.benefits = Array.from({ length: benefitCount }, (_, i) => ({
      title: value(`[data-bt="${i}"]`),
      text: value(`[data-bx="${i}"]`)
    })).filter(b => b.title || b.text);

    // Collect Reviews
    content.cards.reviews = [...document.querySelectorAll('.review-editor')].map(editor => ({
      quote: editor.querySelector('[data-rq]')?.value.trim() || '',
      name: editor.querySelector('[data-rn]')?.value.trim() || '',
      role: editor.querySelector('[data-rr]')?.value.trim() || ''
    })).filter(r => r.quote || r.name || r.role);

    // Collect Apply settings
    content.apply ||= {};
    document.querySelectorAll('[data-apply]').forEach(input => {
      content.apply[input.dataset.apply] = input.value.trim();
    });

    const expText = document.querySelector('[data-experience-options]')?.value || '';
    content.apply.experienceOptions = expText.split('\n').map(line => line.trim()).filter(Boolean);
  });
})();
