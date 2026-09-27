(() => {
  const key = 'igrek-content-v1';
  let data;
  try {
    data = JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    data = {};
  }

  const site = data.site || { footerTagline: 'People. Performance. Growth.', copyright: 'IGREK Outsourcing', links: { home: '/home/', apply: '/apply/' } };
  const links = site.links || { home: '/home/', apply: '/apply/' };
  document.querySelectorAll('[data-link="home"]').forEach(link => { link.href = links.home; });
  document.querySelectorAll('[data-link="apply"]').forEach(link => { link.href = links.apply; });

  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  if (site.footerTagline) document.querySelector('[data-footer-tagline]')?.replaceChildren(document.createTextNode(site.footerTagline));
  if (site.copyright) document.querySelector('[data-footer-copyright]')?.replaceChildren(document.createTextNode(site.copyright));

  const apply = data.apply;
  if (!apply) return;

  const applyIntro = document.querySelector('.apply-intro');
  if (applyIntro) {
    if (apply.eyebrow) {
      const eyebrow = applyIntro.querySelector('.eyebrow');
      if (eyebrow) eyebrow.innerHTML = `<span></span> ${esc(apply.eyebrow)}`;
    }
    if (apply.heading) {
      const h1 = applyIntro.querySelector('h1, h2');
      if (h1) h1.innerHTML = esc(apply.heading);
    }
    if (apply.description) {
      const p = applyIntro.querySelector('p:not(.eyebrow)');
      if (p) p.textContent = apply.description;
    }
    if (apply.email) {
      const emailLink = applyIntro.querySelector('a');
      if (emailLink) {
        emailLink.href = `mailto:${apply.email}`;
        emailLink.innerHTML = `${esc(apply.email)} <span>↗</span>`;
      }
    }
  }

  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    const setLabelText = (inputName, labelText) => {
      if (!labelText) return;
      const input = document.querySelector(`[name="${inputName}"]`);
      const label = input?.closest('label');
      if (label && label.firstChild) label.firstChild.nodeValue = labelText;
    };

    setLabelText('name', apply.nameLabel);
    setLabelText('email', apply.emailLabel);
    setLabelText('phone', apply.phoneLabel);
    setLabelText('vocaroo', apply.vocarooLabel);
    setLabelText('lastPosition', apply.lastPositionLabel);

    if (apply.experienceLabel) {
      const legend = document.querySelector('fieldset legend');
      if (legend) legend.textContent = apply.experienceLabel;
    }

    if (apply.vocarooHelp) {
      const helpEl = document.querySelector('.field-help');
      if (helpEl) {
        helpEl.innerHTML = `${esc(apply.vocarooHelp)} <a href="https://vocaroo.com/" target="_blank" rel="noreferrer">Vocaroo</a>`;
      }
    }

    if (Array.isArray(apply.experienceOptions) && apply.experienceOptions.length) {
      const expContainer = document.querySelector('[data-experience-options]');
      if (expContainer) {
        expContainer.innerHTML = apply.experienceOptions.filter(Boolean).map((opt, i) =>
          `<label><input type="radio" name="experience" value="${esc(opt)}" ${i === 0 ? 'required' : ''}>${esc(opt)}</label>`
        ).join('');
      }
    }

    if (apply.button) {
      const btn = contactForm.querySelector('button[type="submit"]');
      if (btn) btn.innerHTML = `${esc(apply.button)} <span>→</span>`;
    }
  }
})();
