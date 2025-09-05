(() => {
  // src/utils/formatehtml.js
  var FormatHTML = class {
    constructor() {
    }
    formatHTML(html) {
      const placeholders = [];
      html = html.replace(/\{\{[\s\S]*?\}\}/g, (match) => {
        placeholders.push(match);
        return `__HUBL_EXPR_${placeholders.length - 1}__`;
      });
      const tab = "  ";
      let result = [];
      let indentLevel = 0;
      const stack = [];
      let inHublJson = false;
      let jsonIndent = 0;
      let normalizedHtml = html.replace(/\r\n|\r/g, "\n").replace(/<[^>]*\{\{[^}]+\}\}[^>]*>/g, (match) => match.replace(/\n/g, " ")).replace(/([>}])([^<{])/g, "$1\n$2").replace(/([^{])(<|\{%(?!.*\{\{))([^\n]*\{\{[^}]+\}\}[^\n]*\%\})?/g, "$1\n$2$3").replace(/(%\})([^\s}])/g, "$1\n$2").replace(/(\}\})(?!\})/g, "$1\n").replace(/\n+/g, "\n").replace(/\{\s*\n\s*\}/g, "{}").replace(/\[\s*\n\s*\]/g, "[]").trim();
      normalizedHtml = normalizedHtml.replace(/__HUBL_EXPR_(\d+)__/g, (_, i) => placeholders[i]);
      normalizedHtml = normalizedHtml.replace(/="\s*\n\s*({{[\s\S]*?}})\s*\n\s*"/g, '="$1"');
      normalizedHtml = normalizedHtml.replace(/<([^>]+)>/g, (match, content) => {
        return `<${content.replace(/\s{2,}/g, " ").trim()}>`;
      });
      normalizedHtml = normalizedHtml.replace(/\{%\s*([\s\S]*?)\s*%\}/g, (match) => {
        return match.replace(/\s{2,}/g, " ").replace(/\s*%\}/, " %}").replace(/\{%\s*/, "{% ");
      });
      normalizedHtml = normalizedHtml.replace(/\{\{\s*([\s\S]*?)\s*\}\}/g, (match) => {
        return match.replace(/\s{2,}/g, " ").replace(/\s*\}\}/, " }}").replace(/\{\{\s*/, "{{ ");
      });
      const lines = normalizedHtml.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
      const selfClosingTags = /* @__PURE__ */ new Set(["br", "img", "input", "link", "meta", "hr"]);
      const inlineElements = /* @__PURE__ */ new Set(["span", "a", "strong", "em", "b", "i", "u", "code", "mark", "small"]);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line)
          continue;
        if (line.startsWith("{%") || line.startsWith("{{")) {
          const isClosingTag = /\bend(?:if|for|macro|block|autoescape|filter|trans|with|set|macro|call|raw|spaceless|compress)\b|\belse\b|^\s*\{%-?\s*end/.test(line);
          const isOpeningTag = /\b(?:if|for|macro|block|autoescape|filter|trans|with|set|macro|call|raw|spaceless|compress)\b/.test(line) && !isClosingTag;
          const isSetTag = line.includes("{% set");
          if (line.startsWith("{{")) {
            let expr = line;
            if (line.endsWith("}}") && line.includes("{{")) {
              expr = line;
            } else if (i + 1 < lines.length && lines[i + 1].trim() === "}") {
              expr = line + lines[i + 1];
              i++;
            }
            result.push(tab.repeat(indentLevel) + expr);
            continue;
          }
          if (isClosingTag) {
            if (inHublJson) {
              inHublJson = false;
              jsonIndent = 0;
            }
            indentLevel = Math.max(0, indentLevel - 1);
          }
          result.push(tab.repeat(indentLevel) + line);
          if (isSetTag && line.includes("[")) {
            inHublJson = true;
            jsonIndent = indentLevel + 1;
          }
          if (isOpeningTag) {
            indentLevel++;
          }
          continue;
        }
        if (inHublJson) {
          const jsonLine = line.replace(/^[,\s]*/, "");
          const isClosingBrace = jsonLine.startsWith("}") || jsonLine.startsWith("]");
          if (isClosingBrace) {
            jsonIndent = Math.max(0, jsonIndent - 1);
          }
          result.push(tab.repeat(jsonIndent) + jsonLine);
          if (jsonLine.endsWith("{") || jsonLine.endsWith("[")) {
            jsonIndent++;
          }
          continue;
        }
        if (line.startsWith("</")) {
          const tagName = line.match(/^<\/\s*([\w-]+)/)?.[1]?.toLowerCase();
          let lastIndex = -1;
          for (let j = stack.length - 1; j >= 0; j--) {
            if (stack[j].tagName === tagName) {
              lastIndex = j;
              break;
            }
          }
          if (lastIndex !== -1) {
            const last = stack.splice(lastIndex)[0];
            if (last && last.increased) {
              indentLevel = Math.max(0, indentLevel - 1);
            }
          }
          result.push(tab.repeat(indentLevel) + line);
          continue;
        }
        if (line.startsWith("<")) {
          let formattedLine = line;
          const tagName = line.match(/^<\s*([\w-]+)/)?.[1]?.toLowerCase();
          const isSelfClosing = line.endsWith("/>") || selfClosingTags.has(tagName);
          if (line.includes("{{") && line.includes("}}")) {
            formattedLine = line.replace(/\{\{[^}]+\}\}/g, (match) => {
              return match.replace(/\s+/g, " ");
            });
          }
          result.push(tab.repeat(indentLevel) + formattedLine);
          if (!isSelfClosing && !inlineElements.has(tagName)) {
            stack.push({ tagName, increased: true });
            indentLevel++;
          }
          continue;
        }
        result.push(tab.repeat(indentLevel) + line);
      }
      return result.join("\n");
    }
  };

  // src/utils/html.js
  var HTMLStatic = class {
    static html() {
      return `
        <div class="">
    <div class="p-4 flex gap-4">
        <div class="w-[300px]">
            <div id="optionsContainer">
                <div class="text-lg font-medium text-gray-900 dark:text-gray-100 pb-2">Formatting Options:</div>
                <div id="hublOptions" class="space-y-2">
                    <label class="flex items-center space-x-2 text-sm">
                        <input type="checkbox" id="useHublDashes" class="rounded border-gray-300 text-blue-600" />
                        <span>Use HubL whitespace control ({%- -%})</span>
                    </label>
                </div>
                <div id="htmlOptions" class="space-y-2 mt-2">
                    <label class="flex items-center space-x-2 text-sm">
                        <input type="checkbox" id="removeDataAttributes" class="rounded border-gray-300 text-blue-600" />
                        <span>Remove data-* attributes</span>
                    </label>
                    <label class="flex items-center space-x-2 text-sm">
                        <input type="checkbox" id="removeClasses" class="rounded border-gray-300 text-blue-600" />
                        <span>Remove class attributes</span>
                    </label>
                    <label class="flex items-center space-x-2 text-sm">
                        <input type="checkbox" id="removeStyleAttrs" class="rounded border-gray-300 text-blue-600" />
                        <span>Remove style attributes</span>
                    </label>
                </div>
            </div>
        </div>
        <div class="w-[calc(100%-300px)]">
            <div class="grid grid-cols-1 lg:grid-cols-2">
                <!-- Input Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-4">
                        <label for="inputCode" class="block text-sm font-medium text-gray-700 dark:text-gray-100">Input Code</label>
                        <span id="charCount" class="text-xs text-gray-500">0 characters</span>
                    </div>
                    <textarea id="inputCode" class="" placeholder="Paste your HubL/HTML code here..." spellcheck="false"></textarea>
                </div>

                <!-- Output Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-5">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-100">Formatted Output</label>
                        </div>
                        <span id="outputCharCount" class="text-xs text-gray-500">0 characters</span>
                    </div>
                    <div class="relative">
                        <div class="absolute top-0 right-0">
                            <button id="copyBtn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center space-x-2">
                                <span>Copy to Clipboard</span>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                    />
                                </svg>
                            </button>
                        </div>
                        <pre id="outputCode"></pre>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
        `;
    }
  };

  // src/main.js
  var HubLFormatter = class {
    constructor() {
      this.app = document.getElementById("app");
      if (!this.app) {
        console.error("Could not find app element");
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
      this.elements = {};
      this.initUI();
      setTimeout(() => {
        this.setupEventListeners();
      }, 10);
    }
    initUI() {
      if (!this.app)
        return;
      this.app.innerHTML = HTMLStatic.html();
      this.elements = {
        input: document.getElementById("inputCode"),
        output: document.getElementById("outputCode"),
        formatBtn: document.getElementById("formatBtn"),
        copyBtn: document.getElementById("copyBtn"),
        charCount: document.getElementById("charCount"),
        outputCharCount: document.getElementById("outputCharCount"),
        optionsContainer: document.getElementById("optionsContainer"),
        hublOptions: document.getElementById("hublOptions"),
        htmlOptions: document.getElementById("htmlOptions"),
        useHublDashes: document.getElementById("useHublDashes"),
        removeDataAttrs: document.getElementById("removeDataAttributes"),
        removeClasses: document.getElementById("removeClasses"),
        removeStyleAttrs: document.getElementById("removeStyleAttrs")
      };
    }
    setupEventListeners() {
      if (!this.elements)
        return;
      const { input, output, copyBtn, useHublDashes, removeDataAttrs, removeClasses } = this.elements;
      if (!input || !output || !copyBtn) {
        console.error("Required elements not found");
        return;
      }
      const formatInput = () => {
        this.analyzeCode();
        this.formatCode();
      };
      input.addEventListener("paste", (e) => {
        setTimeout(formatInput, 0);
      });
      input.addEventListener("input", formatInput);
      copyBtn.addEventListener("click", () => this.copyToClipboard());
      if (useHublDashes) {
        useHublDashes.addEventListener("change", (e) => {
          this.options.useHublDashes = e.target.checked;
          this.formatCode();
        });
      }
      if (removeDataAttrs) {
        removeDataAttrs.addEventListener("change", (e) => {
          this.options.removeDataAttributes = e.target.checked;
          this.formatCode();
        });
      }
      if (removeClasses) {
        removeClasses.addEventListener("change", (e) => {
          this.options.removeClasses = e.target.checked;
          this.formatCode();
        });
      }
      if (this.elements.removeStyleAttrs) {
        this.elements.removeStyleAttrs.addEventListener("change", (e) => {
          this.options.removeStyleAttrs = e.target.checked;
          this.formatCode();
        });
      }
    }
    analyzeCode() {
      const code = this.elements.input.value;
      this.updateCharCount(code.length);
      this.toggleOptions("hublOptions", true);
      this.toggleOptions("htmlOptions", true);
      this.elements.optionsContainer.classList.remove("hidden");
      if (this.elements.useHublDashes) {
        this.elements.useHublDashes.checked = false;
      }
      this.hasHublCode = /\{\s*[%#]/.test(code) || /\{%-?/.test(code);
      this.hasDataAttributes = /\sdata-\w+\s*=/.test(code);
    }
    toggleOptions(elementId, show) {
      const element = this.elements[elementId];
      if (element) {
        element.classList.toggle("hidden", !show);
      }
    }
    formatCode() {
      if (!this.elements)
        return;
      const input = this.elements.input.value;
      if (!input.trim()) {
        this.elements.output.textContent = "";
        this.updateCharCount(0, true);
        return;
      }
      let formatted = input;
      formatted = this.formatHTML(formatted);
      if (this.options.useHublDashes) {
        formatted = this.addHublDashes(formatted);
      } else {
        formatted = formatted.replace(/\{\s*%-/g, "{%").replace(/-%\s*\}/g, "%}");
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
      if (!code)
        return code;
      code = code.replace(/\{\s*%-/g, "{%").replace(/-%\s*\}/g, "%}");
      code = code.replace(/(\{\s*%)(?!--)/g, "{%-").replace(/(?<!-)(%\s*\})/g, "-%}");
      return code;
    }
    removeDataAttributes(code) {
      return code.replace(/\s+data-[\w-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|\S+))?/gi, "");
    }
    removeClassAttributes(code) {
      return code.replace(/\s+class\s*=\s*["'][^"']*["']/gi, "").replace(/\s+class\s*=[^\s>]+/gi, "");
    }
    removeStyleAttributes(code) {
      return code.replace(/\s+style\s*=\s*["'][^"']*["']/gi, "").replace(/\s+style\s*=[^\s>]+/gi, "");
    }
    updateCharCount(count, isOutput = false) {
      const label = isOutput ? "Output: " : "Input: ";
      const element = isOutput ? this.elements.outputCharCount : this.elements.charCount;
      if (element) {
        element.textContent = `${label}${count} character${count !== 1 ? "s" : ""}`;
      }
    }
    async copyToClipboard() {
      try {
        const output = this.elements.output.textContent;
        if (!output.trim()) {
          this.showError("No content to copy");
          return;
        }
        await navigator.clipboard.writeText(output);
        this.showSuccess("Copied to clipboard!");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        this.showError("Failed to copy to clipboard");
      }
    }
    showError(message) {
      this.showNotification(message, "bg-red-100 border-red-400 text-red-700");
    }
    showSuccess(message) {
      this.showNotification(message, "bg-green-100 border-green-500 text-green-700");
    }
    showNotification(message, className) {
      const notification = document.createElement("div");
      notification.className = `fixed bottom-4 right-4 px-4 py-2 border rounded shadow-lg ${className}`;
      notification.textContent = message;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 3e3);
    }
  };
  function initApp() {
    try {
      window.app = new HubLFormatter();
      if (!window.app.app) {
        console.error("Failed to initialize app");
      }
    } catch (error) {
      console.error("Error initializing app:", error);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    setTimeout(initApp, 10);
  }
  var main_default = HubLFormatter;
})();
//# sourceMappingURL=bundle.js.map
