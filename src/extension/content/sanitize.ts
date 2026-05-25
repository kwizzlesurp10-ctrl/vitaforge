const ALLOWED_TAGS = new Set(['SECTION', 'DIV', 'H1', 'H2', 'H3', 'P', 'SPAN', 'BUTTON', 'A', 'UL', 'OL', 'LI', 'STRONG', 'EM']);
const ALLOWED_ATTRS = new Set(['class', 'href', 'aria-label', 'data-vf-outcome', 'data-vf-generated']);

export function sanitizeVariantHtml(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;

  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
  const removals: Element[] = [];

  while (walker.nextNode()) {
    const element = walker.currentNode as Element;
    if (!ALLOWED_TAGS.has(element.tagName)) {
      removals.push(element);
      continue;
    }

    for (const attr of [...element.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value;
      if (!ALLOWED_ATTRS.has(name) || name.startsWith('on')) element.removeAttribute(attr.name);
      if (name === 'href' && !value.startsWith('https://')) element.removeAttribute(attr.name);
    }
  }

  for (const item of removals) item.replaceWith(...Array.from(item.childNodes));
  return template.content;
}
