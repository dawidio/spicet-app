/**
 * Prevents paste events on SPICE-T entry fields.
 * Attaches to any element with the data-no-paste attribute.
 */
export function preventPaste(e) {
  e.preventDefault();
  // Optionally show a brief message
  const el = e.target;
  const original = el.placeholder;
  el.placeholder = 'Paste is disabled — please type your response';
  setTimeout(() => {
    el.placeholder = original || '';
  }, 2000);
}

/**
 * Also prevent drop (dragging text into fields)
 */
export function preventDrop(e) {
  e.preventDefault();
}
