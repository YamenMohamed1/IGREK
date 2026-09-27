const header = document.querySelector('.site-header');
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (header) addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 12), { passive: true });
toggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  toggle.setAttribute('aria-expanded', isOpen);
  toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});
navLinks?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  navLinks.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}));

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

// ============================================================
// APPLICATION FORM SUBMISSION HANDLER
// ============================================================
// NOTE: Submissions are automatically recorded on the local server
// at /api/apply and saved to applications.json.
// When you're ready to sync with Google Sheets, simply add your
// Google Apps Script Web App URL in local-server.js.
// ============================================================
const contactForm = document.querySelector('#contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) return form.reportValidity();

    const submitBtn = form.querySelector('button[type="submit"]');
    const statusEl = form.querySelector('.form-status');
    const originalBtnHtml = submitBtn.innerHTML;

    const selectedExp = form.querySelector('input[name="experience"]:checked')?.value || 'Not specified';
    const formData = {
      name: form.elements['name']?.value?.trim() || '',
      email: form.elements['email']?.value?.trim() || '',
      phone: form.elements['phone']?.value?.trim() || '',
      vocaroo: form.elements['vocaroo']?.value?.trim() || '',
      experience: selectedExp,
      lastPosition: form.elements['lastPosition']?.value?.trim() || ''
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    statusEl.textContent = '';
    statusEl.style.color = '';

    try {
      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();

      if (response.ok && result.success) {
        statusEl.textContent = 'Thank you! Your application has been received. We will be in touch soon.';
        statusEl.style.color = '#8ae99c';
        form.reset();
      } else {
        throw new Error(result.error || 'Failed to submit application.');
      }
    } catch (err) {
      statusEl.textContent = 'Error: ' + (err.message || 'Unable to submit right now. Please try again.');
      statusEl.style.color = '#ff9999';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  });
}
