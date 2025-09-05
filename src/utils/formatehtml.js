export class FormatHTML {
    constructor() {
        
    }

    formatHTML(html) {
        // Protect {{ ... }} expressions by replacing them with placeholders
        const placeholders = [];
        html = html.replace(/\{\{[\s\S]*?\}\}/g, (match) => {
          placeholders.push(match);
          return `__HUBL_EXPR_${placeholders.length - 1}__`;
        });

        const tab = '  '; // 2 spaces for indentation
        let result = [];
        let indentLevel = 0;
        const stack = [];
        let inHublJson = false;
        let jsonIndent = 0;
        
        // First, normalize and split the HTML into lines
        let normalizedHtml = html
            .replace(/\r\n|\r/g, '\n')  // Normalize line endings
            // Don't add line breaks inside HTML tags with HubL expressions
            .replace(/<[^>]*\{\{[^}]+\}\}[^>]*>/g, match => match.replace(/\n/g, ' '))
            .replace(/([>}])([^<{])/g, '$1\n$2')  // Add line breaks after > and }
            .replace(/([^{])(<|\{%(?!.*\{\{))([^\n]*\{\{[^}]+\}\}[^\n]*\%\})?/g, '$1\n$2$3')  // Add line breaks before <, {% but not inside HubL expressions
            .replace(/(%\})([^\s}])/g, '$1\n$2')  // Add line breaks after %}
            // Add line breaks after }} but not if it's already complete or inside another brace
            .replace(/(\}\})(?!\})/g, '$1\n')
            .replace(/\n+/g, '\n')  // Remove multiple newlines
            .replace(/\{\s*\n\s*\}/g, '{}')  // Fix empty objects
            .replace(/\[\s*\n\s*\]/g, '[]')  // Fix empty arrays
            .trim();

        // Restore {{ ... }} expressions
        normalizedHtml = normalizedHtml.replace(/__HUBL_EXPR_(\d+)__/g, (_, i) => placeholders[i]);

        // Collapse newlines inside attribute values (especially around {{ ... }})
        normalizedHtml = normalizedHtml.replace(/="\s*\n\s*({{[\s\S]*?}})\s*\n\s*"/g, '="$1"');
            
        // Collapse extra spaces inside tag attributes
        normalizedHtml = normalizedHtml.replace(/<([^>]+)>/g, (match, content) => {
          return `<${content.replace(/\s{2,}/g, ' ').trim()}>`;
        });

        // Keep HubL {% ... %} blocks in one line but don’t touch {{ ... }}
        normalizedHtml = normalizedHtml.replace(/\{%\s*([\s\S]*?)\s*%\}/g, (match) => {
          // Collapse excessive whitespace but keep braces intact
          return match
            .replace(/\s{2,}/g, ' ')
            .replace(/\s*%\}/, ' %}')
            .replace(/\{%\s*/, '{% ');
        });

        // Keep HubL {{ ... }} expressions in one line
        normalizedHtml = normalizedHtml.replace(/\{\{\s*([\s\S]*?)\s*\}\}/g, (match) => {
          return match
            .replace(/\s{2,}/g, ' ')
            .replace(/\s*\}\}/, ' }}')
            .replace(/\{\{\s*/, '{{ ');
        });
            
        // Process each line individually
        const lines = normalizedHtml.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
            
        const selfClosingTags = new Set(['br', 'img', 'input', 'link', 'meta', 'hr']);
        const inlineElements = new Set(['span','a','strong','em','b','i','u','code','mark','small']);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (!line) continue;
            
            // Handle HubL tags
            if (line.startsWith('{%') || line.startsWith('{{')) {
                const isClosingTag = /\bend(?:if|for|macro|block|autoescape|filter|trans|with|set|macro|call|raw|spaceless|compress)\b|\belse\b|^\s*\{%-?\s*end/.test(line);
                const isOpeningTag = /\b(?:if|for|macro|block|autoescape|filter|trans|with|set|macro|call|raw|spaceless|compress)\b/.test(line) && !isClosingTag;
                const isSetTag = line.includes('{% set');
                
                // Handle inline expressions
                if (line.startsWith('{{')) {
                    // Handle closing braces in the same line
                    let expr = line;
                    if (line.endsWith('}}') && line.includes('{{')) {
                        expr = line;
                    } else if (i + 1 < lines.length && lines[i + 1].trim() === '}') {
                        expr = line + lines[i + 1];
                        i++; // Skip the next line since we've processed it
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
                
                if (isSetTag && line.includes('[')) {
                    inHublJson = true;
                    jsonIndent = indentLevel + 1;
                }
                
                if (isOpeningTag) {
                    indentLevel++;
                }
                continue;
            }
            
            // Handle JSON-like structures in HubL
            if (inHublJson) {
                // Handle JSON object/array indentation
                const jsonLine = line.replace(/^[,\s]*/, '');
                const isClosingBrace = jsonLine.startsWith('}') || jsonLine.startsWith(']');
                
                if (isClosingBrace) {
                    jsonIndent = Math.max(0, jsonIndent - 1);
                }
                
                result.push(tab.repeat(jsonIndent) + jsonLine);
                
                if (jsonLine.endsWith('{') || jsonLine.endsWith('[')) {
                    jsonIndent++;
                }
                
                continue;
            }
            
            // Handle HTML closing tags
            if (line.startsWith('</')) {
                const tagName = line.match(/^<\/\s*([\w-]+)/)?.[1]?.toLowerCase();
                // Find the last matching opening tag in the stack
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
            
            // Handle HTML opening tags
            if (line.startsWith('<')) {
                let formattedLine = line;
                const tagName = line.match(/^<\s*([\w-]+)/)?.[1]?.toLowerCase();
                const isSelfClosing = line.endsWith('/>') || selfClosingTags.has(tagName);
                
                // Preserve inline HubL expressions in attributes
                if (line.includes('{{') && line.includes('}}')) {
                    formattedLine = line.replace(/\{\{[^}]+\}\}/g, match => {
                        // Keep the expression on the same line
                        return match.replace(/\s+/g, ' ');
                    });
                }

                // Add the line with proper indentation
                result.push(tab.repeat(indentLevel) + formattedLine);

                if (!isSelfClosing && !inlineElements.has(tagName)) {
                    stack.push({ tagName, increased: true });
                    indentLevel++;
                }
                continue;
            }
            
            // Handle regular text content
            result.push(tab.repeat(indentLevel) + line);
        }
        
        return result.join('\n');
    }
}