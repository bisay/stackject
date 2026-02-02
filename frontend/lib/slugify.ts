/**
 * Generate a URL-friendly slug from a string
 * - Converts to lowercase
 * - Replaces spaces and special characters with dashes
 * - Removes consecutive dashes
 * - Trims dashes from start and end
 */
export function slugify(text: string): string {
    if (!text) return '';
    
    return text
        .toString()
        .toLowerCase()
        .trim()
        // Replace spaces with dashes
        .replace(/\s+/g, '-')
        // Remove special characters except dashes and alphanumeric
        .replace(/[^\w\-]+/g, '')
        // Replace multiple dashes with single dash
        .replace(/\-\-+/g, '-')
        // Remove leading dashes
        .replace(/^-+/, '')
        // Remove trailing dashes
        .replace(/-+$/, '');
}
