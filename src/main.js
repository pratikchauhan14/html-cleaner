// Main class definition

import { FormatHTML } from "./utils/formatehtml";
import { HTMLStatic } from "./utils/html";


class HubLFormatter {
  constructor() {
    this.app = document.getElementById('app');
    if (!this.app) {
      console.error('Could not find app element');
      return;
    }

    this.formatHTMLWrapper = new FormatHTML();
    this.formatHTML = this.formatHTMLWrapper.formatHTML;

    this.options = {
      useHublDashes: false,
      removeDataAttributes: false,
      removeClasses: false,
      removeStyleAttrs: false
    };
    this.hasHublCode = false;
    this.hasDataAttributes = false;
    this.elements = {}; // Initialize elements object

    this.initUI();

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.setupEventListeners();
    }, 10);
  }

  initUI() {
    if (!this.app) return;

    this.app.innerHTML = HTMLStatic.html();

    // Cache DOM elements
    this.elements = {
      input: document.getElementById('inputCode'),
      output: document.getElementById('outputCode'),
      formatBtn: document.getElementById('formatBtn'),
      copyBtn: document.getElementById('copyBtn'),
      charCount: document.getElementById('charCount'),
      outputCharCount: document.getElementById('outputCharCount'),
      optionsContainer: document.getElementById('optionsContainer'),
      hublOptions: document.getElementById('hublOptions'),
      htmlOptions: document.getElementById('htmlOptions'),
      useHublDashes: document.getElementById('useHublDashes'),
      removeDataAttrs: document.getElementById('removeDataAttributes'),
      removeClasses: document.getElementById('removeClasses'),
      removeStyleAttrs: document.getElementById('removeStyleAttrs')
    };
  }

  setupEventListeners() {
    if (!this.elements) return;

    const { input, output, copyBtn, useHublDashes, removeDataAttrs, removeClasses } = this.elements;

    if (!input || !output || !copyBtn) {
      console.error('Required elements not found');
      return;
    }

    // Handle paste and input events
    const formatInput = () => {
      this.analyzeCode();
      this.formatCode();
    };

    input.addEventListener('paste', (e) => {
      // Let the paste complete first
      setTimeout(formatInput, 0);
    });

    input.addEventListener('input', formatInput);

    copyBtn.addEventListener('click', () => this.copyToClipboard());

    // Update options
    if (useHublDashes) {
      useHublDashes.addEventListener('change', (e) => {
        this.options.useHublDashes = e.target.checked;
        this.formatCode();
      });
    }

    if (removeDataAttrs) {
      removeDataAttrs.addEventListener('change', (e) => {
        this.options.removeDataAttributes = e.target.checked;
        this.formatCode();
      });
    }

    if (removeClasses) {
      removeClasses.addEventListener('change', (e) => {
        this.options.removeClasses = e.target.checked;
        this.formatCode();
      });
    }

    if (this.elements.removeStyleAttrs) {
      this.elements.removeStyleAttrs.addEventListener('change', (e) => {
        this.options.removeStyleAttrs = e.target.checked;
        this.formatCode();
      });
    }
  }

  analyzeCode() {
    const code = this.elements.input.value;
    this.updateCharCount(code.length);

    // Always show all options
    this.toggleOptions('hublOptions', true);
    this.toggleOptions('htmlOptions', true);
    this.elements.optionsContainer.classList.remove('hidden');

    // Keep checkbox unchecked by default
    if (this.elements.useHublDashes) {
      this.elements.useHublDashes.checked = false;
    }

    // Store analysis results
    this.hasHublCode = /\{\s*[%#]/.test(code) || /\{%-?/.test(code);
    this.hasDataAttributes = /\sdata-\w+\s*=/.test(code);
  }

  toggleOptions(elementId, show) {
    const element = this.elements[elementId];
    if (element) {
      element.classList.toggle('hidden', !show);
    }
  }

  formatCode() {
    if (!this.elements) return;

    const input = this.elements.input.value;
    if (!input.trim()) {
      this.elements.output.textContent = '';
      this.updateCharCount(0, true);
      return;
    }

    let formatted = input;

    // Always apply basic HTML/HubL formatting first
    formatted = this.formatHTML(formatted);

    // Apply additional formatting based on options
    if (this.options.useHublDashes) {
      // Only add dashes to HubL tags that don't already have them
      formatted = this.addHublDashes(formatted);
    } else {
      // Remove dashes if checkbox is unchecked
      formatted = formatted
        .replace(/\{\s*%-/g, '{%')
        .replace(/-%\s*\}/g, '%}');
    }

    if (this.options.removeDataAttributes) {
      formatted = this.removeDataAttributes(formatted);
    }

    if (this.options.removeClasses) {
      formatted = this.removeClassAttributes(formatted);
    }

    if (this.options.removeStyleAttrs) {
      formatted = this.removeStyleAttributes(formatted);
    }

    this.elements.output.textContent = formatted;
    this.updateCharCount(formatted.length, true);
  }

  addHublDashes(code) {
    if (!code) return code;

    // First normalize all tags to remove any existing dashes
    code = code
      .replace(/\{\s*%-/g, '{%')  // Remove dash after {
      .replace(/-%\s*\}/g, '%}'); // Remove dash before }

    // Then add single dashes where needed
    code = code
      .replace(/(\{\s*%)(?!--)/g, '{%-')  // Add single dash after {
      .replace(/(?<!-)(%\s*\})/g, '-%}'); // Add single dash before }

    return code;
  }

  removeDataAttributes(code) {
    // Remove all data-* attributes with different quote styles and spacing
    return code.replace(/\s+data-[\w-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|\S+))?/gi, '');
  }

  removeClassAttributes(code) {
    // Remove all class attributes from any HTML element
    return code.replace(/\s+class\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\s+class\s*=[^\s>]+/gi, '');
  }

  removeStyleAttributes(code) {
    // Remove all style attributes from any HTML element
    return code.replace(/\s+style\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\s+style\s*=[^\s>]+/gi, '');
  }




  updateCharCount(count, isOutput = false) {
    const label = isOutput ? 'Output: ' : 'Input: ';
    const element = isOutput ? this.elements.outputCharCount : this.elements.charCount;
    if (element) {
      element.textContent = `${label}${count} character${count !== 1 ? 's' : ''}`;
    }
  }

  async copyToClipboard() {
    try {
      const output = this.elements.output.textContent;
      if (!output.trim()) {
        this.showError('No content to copy');
        return;
      }

      await navigator.clipboard.writeText(output);
      this.showSuccess('Copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.showError('Failed to copy to clipboard');
    }
  }

  showError(message) {
    this.showNotification(message, 'bg-red-100 border-red-400 text-red-700');
  }

  showSuccess(message) {
    this.showNotification(message, 'bg-green-100 border-green-500 text-green-700');
  }

  showNotification(message, className) {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-4 py-2 border rounded shadow-lg ${className}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize the app when DOM is ready
function initApp() {
  try {
    window.app = new HubLFormatter();
    if (!window.app.app) {
      console.error('Failed to initialize app');
    }
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

// Start the app when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // If DOM is already loaded, wait a small delay to ensure everything is ready
  setTimeout(initApp, 10);
}

// Export the class for ES modules
export default HubLFormatter;
