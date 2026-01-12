/**
 * Extend an array just like JQuery's extend.
 * @returns {object} Merged objects.
 */
export function extend() {
  for (let i = 1; i < arguments.length; i++) {
    for (let key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        if (
          typeof arguments[0][key] === 'object' &&
          typeof arguments[i][key] === 'object'
        ) {
          extend(arguments[0][key], arguments[i][key]);
        }
        else {
          arguments[0][key] = arguments[i][key];
        }
      }
    }
  }
  return arguments[0];
}

/**
 * Retrieve true string from HTML encoded string.
 * @param {string} input Input string.
 * @returns {string} Output string.
 */
export function htmlDecode(input) {
  const dparser = new DOMParser().parseFromString(input, 'text/html');
  return dparser.documentElement ? dparser.documentElement.textContent : '';
}

/**
 * Retrieve string without HTML tags.
 * @param {string} html Input string.
 * @returns {string} Output string.
 */
export function stripHTML(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Format language tag (RFC 5646). Assuming "language-coutry". No validation.
 * Cmp. https://tools.ietf.org/html/rfc5646
 * @param {string} languageCode Language tag.
 * @returns {string} Formatted language tag.
 */
export function formatLanguageCode(languageCode) {
  if (typeof languageCode !== 'string') {
    return languageCode;
  }

  /*
   * RFC 5646 states that language tags are case insensitive, but
   * recommendations may be followed to improve human interpretation
   */
  const segments = languageCode.split('-');
  segments[0] = segments[0].toLowerCase(); // ISO 639 recommendation
  if (segments.length > 1) {
    segments[1] = segments[1].toUpperCase(); // ISO 3166-1 recommendation
  }
  languageCode = segments.join('-');

  return languageCode;
}

/**
 * Copy text to clipboard.
 * Cmp. https://stackoverflow.com/a/30810322
 * @param {string} text Text to copy to clipboard.
 * @param {function} [callback] Callback accepting true/false as param.
 */
export function copyTextToClipboard(text, callback = () => {}) {
  if (!navigator.clipboard) {
    console.error(
      'Cannot copy to clipboard: navigator.clipboard is undefined',
    );
    return;
  }

  navigator.clipboard.writeText(text).then(
    () => callback(true),
    (error) => {
      console.error('Cannot copy to clipboard: ', error);
      callback(false);
    }
  );
}
