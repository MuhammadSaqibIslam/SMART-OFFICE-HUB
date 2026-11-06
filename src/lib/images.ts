// Formats every browser can display. HEIC photos (common on Apple devices)
// upload fine but show as a broken image in Chrome, so they are rejected here.
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const PHOTO_ACCEPT = PHOTO_TYPES.join(',')
export const PHOTO_TYPE_ERROR = 'Please choose a JPG, PNG or WebP image'
