export class HTMLStatic {
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
        `
    }
}
    
