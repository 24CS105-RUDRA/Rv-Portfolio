const topics = ['Web app', 'AI', 'Hardware', 'Something strange'];
const capText = (value, limit) => String(value).slice(0, limit).replace(/[\uD800-\uDBFF]$/, '');

// Briefs stay in the URL fragment: the text is not sent to the web server.
// The link works in another tab and does not require browser storage.
export function ideaHref({message = '', topic = 'Something strange', source = ''} = {}) {
  if (!String(message).trim()) return '/idea/';
  const brief = new URLSearchParams({brief: capText(String(message).trim(), 4000), topic: topics.includes(topic) ? topic : 'Something strange', source: capText(source, 80)});
  return `/idea/#${brief}`;
}

export function readIdeaBrief(hash) {
  const params = new URLSearchParams(String(hash).replace(/^#/, ''));
  const message = capText((params.get('brief') || '').trim(), 4000);
  if (!message) return null;
  return {message, topic: topics.includes(params.get('topic')) ? params.get('topic') : 'Something strange', source: capText(params.get('source') || '', 80)};
}
