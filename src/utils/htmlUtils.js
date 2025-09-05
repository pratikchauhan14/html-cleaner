class HTMLCleaner {
  /**
   * Remove all data-* attributes from an element and its children
   * @param {HTMLElement} el - The element to clean
   */
  removeDataAttributes(el) {
    [...el.attributes].forEach(attr => {
      if (attr.name.startsWith('data-')) el.removeAttribute(attr.name);
    });
    
    el.childNodes.forEach(child => {
      if (child.nodeType === 1) this.removeDataAttributes(child);
    });
  }

  /**
   * Format HTML with proper indentation
   * @param {HTMLElement} el - The element to format
   * @param {number} [indent=0] - Current indentation level
   * @returns {string} Formatted HTML string
   */
  formatHTML(el, indent = 0) {
    const spacing = '  '.repeat(indent);
    
    // Handle text nodes
    if (el.nodeType === 3) {
      const text = el.textContent.trim();
      return text ? `${spacing}${text}\n` : '';
    }
    
    // Ignore non-element nodes
    if (el.nodeType !== 1) return '';

    let html = `${spacing}<${el.tagName.toLowerCase()}`;

    // Add attributes
    [...el.attributes].forEach(attr => {
      html += ` ${attr.name}="${attr.value}"`;
    });

    // Handle self-closing and regular elements
    if (el.childNodes.length === 0) {
      html += `></${el.tagName.toLowerCase()}>\n`;
    } else {
      html += '>\n';
      // Process child nodes
      el.childNodes.forEach(child => {
        html += this.formatHTML(child, indent + 1);
      });
      html += `${spacing}</${el.tagName.toLowerCase()}>\n`;
    }
    
    return html;
  }

  /**
   * Clean and format HTML string
   * @param {string} htmlString - The HTML string to clean and format
   * @returns {string} Cleaned and formatted HTML
   */
  cleanAndFormat(htmlString) {
    const temp = document.createElement('div');
    temp.innerHTML = htmlString;

    // Remove data attributes
    this.removeDataAttributes(temp);

    // Format the HTML
    let formatted = '';
    temp.childNodes.forEach(child => {
      formatted += this.formatHTML(child);
    });

    return formatted;
  }
}

export default HTMLCleaner;
