/**
 * Extend an array just like JQuery's extend.
 * @param {...object} args Objects to merge.
 * @returns {object} Merged objects.
 */
export const extend = (...args) => {
  for (let i = 1; i < args.length; i++) {
    for (let key in args[i]) {
      if (Object.prototype.hasOwnProperty.call(args[i], key)) {
        if (typeof args[0][key] === 'object' && typeof args[i][key] === 'object') {
          extend(args[0][key], args[i][key]);
        }
        else if (args[i][key] !== undefined) {
          args[0][key] = args[i][key];
        }
      }
    }
  }

  return args[0];
};

/**
 * Retrieve true string from HTML encoded string.
 * @param {string} input Input string.
 * @returns {string} Output string.
 */
export const htmlDecode = (input) => {
  const dparser = new DOMParser().parseFromString(input, 'text/html');
  return dparser.documentElement ? dparser.documentElement.textContent : '';
};

/**
 * Retrieve string without HTML tags.
 * @param {string} html Input string.
 * @returns {string} Output string.
 */
export const stripHTML = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

/**
 * Format language tag (RFC 5646). Assuming "language-coutry". No validation.
 * Cmp. https://tools.ietf.org/html/rfc5646
 * @param {string} languageCode Language tag.
 * @returns {string} Formatted language tag.
 */
export const formatLanguageCode = (languageCode) => {
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
};

/**
 * Copy text to clipboard.
 * Cmp. https://stackoverflow.com/a/30810322
 * @param {string} text Text to copy to clipboard.
 * @param {function} [callback] Callback accepting true/false as param.
 */
export const copyTextToClipboard = async (text, callback = () => {}) => {
  const canCopy = await canCopyToClipboard();
  if (!canCopy) {
    console.error(
      'Cannot copy to clipboard: Clipboard API not supported or not in a secure context.',
    );
    return;
  }

  navigator.clipboard.writeText(text).then(
    () => callback(true),
    (error) => {
      console.error('Cannot copy to clipboard: ', error);
      callback(false);
    },
  );
};

/**
 * Determine if the Clipboard API is supported and if the user has granted permission to write to the clipboard.
 * @returns {Promise<boolean>} True if the Clipboard API is supported and permission is granted, false otherwise.
 */
export const canCopyToClipboard = async () => {
  if (!navigator.clipboard || !window.isSecureContext) {
    return false;
  };

  try {
    const result = await navigator.permissions.query({ name: 'clipboard-write' });
    return result.state === 'granted' || result.state === 'prompt';
  }
  catch (error) {
    return typeof navigator.clipboard.writeText === 'function'; // Fallback for Firefox
  }
};
