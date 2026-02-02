/**
 * HTML Sanitizer for TipTap Rich Text Content
 * Prevents XSS attacks by removing dangerous HTML elements and attributes
 */

// Allowed HTML tags (safe for TipTap content)
const ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote',
    'a',
    'span',
    'div',
    'img',
    'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

// Allowed attributes per tag
const ALLOWED_ATTRS: Record<string, string[]> = {
    'a': ['href', 'target', 'rel', 'class'],
    'img': ['src', 'alt', 'width', 'height', 'class'],
    'span': ['class', 'data-type', 'data-id', 'data-label'], // For TipTap mentions
    'div': ['class', 'data-type'],
    'pre': ['class'],
    'code': ['class'],
    'p': ['class'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan'],
};

// Dangerous patterns to remove
const DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^>]*>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    /<input\b[^>]*>/gi,
    /<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi,
    /<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi,
    /<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi,
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    /<link\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
    /<base\b[^>]*>/gi,
];

// Dangerous attribute patterns
const DANGEROUS_ATTR_PATTERNS = [
    /\bon\w+\s*=/gi,           // onclick, onerror, onload, etc.
    /javascript:/gi,           // javascript: URLs
    /vbscript:/gi,             // vbscript: URLs
    /data:/gi,                 // data: URLs (can contain scripts)
    /expression\s*\(/gi,       // CSS expressions
];

/**
 * Sanitize HTML content from TipTap editor
 * Removes dangerous scripts, event handlers, and unsafe URLs
 */
export function sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    let sanitized = html;

    // Step 1: Remove dangerous tags completely
    for (const pattern of DANGEROUS_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }

    // Step 2: Remove dangerous attributes (event handlers, javascript: urls)
    for (const pattern of DANGEROUS_ATTR_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }

    // Step 3: Clean href and src attributes to prevent javascript: injection
    sanitized = sanitized.replace(
        /(<a\s+[^>]*href\s*=\s*["'])(javascript:|vbscript:|data:)([^"']*["'])/gi,
        '$1#$3'
    );
    
    sanitized = sanitized.replace(
        /(<img\s+[^>]*src\s*=\s*["'])(javascript:|vbscript:)([^"']*["'])/gi,
        '$1#$3'
    );

    // Step 4: Ensure all external links have rel="noopener noreferrer"
    sanitized = sanitized.replace(
        /<a\s+([^>]*href\s*=\s*["']https?:\/\/[^"']*["'][^>]*)>/gi,
        (match, attrs) => {
            if (!attrs.includes('rel=')) {
                return `<a ${attrs} rel="noopener noreferrer">`;
            }
            return match;
        }
    );

    // Step 5: Remove style attributes that could contain expressions
    sanitized = sanitized.replace(
        /\sstyle\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi,
        ''
    );

    return sanitized.trim();
}

/**
 * Sanitize plain text (remove all HTML)
 * Use this for fields that should never contain HTML
 */
export function sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') {
        return '';
    }
    
    // Remove all HTML tags
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .trim();
}

/**
 * Escape HTML entities (for displaying user input as text)
 */
export function escapeHtml(text: string): string {
    if (!text || typeof text !== 'string') {
        return '';
    }
    
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
