chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'VF_OFFSCREEN_ANALYZE') return false;
  const raw = String(message.html ?? '');
  const analysis = {
    textLength: raw.replace(/<[^>]*>/g, '').trim().length,
    hasScriptToken: raw.toLowerCase().includes('<script'),
    hasInlineHandlerToken: /\son[a-z]+\s*=/.test(raw.toLowerCase())
  };
  sendResponse({ ok: true, analysis });
  return true;
});
