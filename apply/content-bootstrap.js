(async () => {
  try {
    const response = await fetch('/api/content', { cache: 'no-store' });
    if (response.ok) {
      const content = await response.json();
      if (content) localStorage.setItem('igrek-content-v1', JSON.stringify(content));
    }
  } catch {}
  const scripts = ['content.js', 'script.js'];
  for (const src of scripts) {
    await new Promise(resolve => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = resolve;
      document.body.append(script);
    });
  }
})();
