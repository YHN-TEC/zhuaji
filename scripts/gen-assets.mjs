import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve('public/img')
fs.mkdirSync(dir, { recursive: true })

/** 占位照片：柔和光线 + 宠物剪影，保证任何尺寸下都不是空白块 */
function photo(id, { c1, c2, c3, ink, species = 'cat' }) {
  const cat = `
    <ellipse cx="400" cy="492" rx="104" ry="126" fill="${ink}"/>
    <circle cx="400" cy="330" r="62" fill="${ink}"/>
    <path d="M348 292 L338 246 L384 272 Z" fill="${ink}"/>
    <path d="M452 292 L462 246 L416 272 Z" fill="${ink}"/>
    <path d="M498 556 q74 -34 58 -108" stroke="${ink}" stroke-width="26" fill="none" stroke-linecap="round"/>`
  const dog = `
    <ellipse cx="400" cy="500" rx="112" ry="120" fill="${ink}"/>
    <circle cx="400" cy="344" r="66" fill="${ink}"/>
    <ellipse cx="332" cy="356" rx="26" ry="46" transform="rotate(12 332 356)" fill="${ink}"/>
    <ellipse cx="468" cy="356" rx="26" ry="46" transform="rotate(-12 468 356)" fill="${ink}"/>
    <path d="M506 556 q40 -40 22 -84" stroke="${ink}" stroke-width="22" fill="none" stroke-linecap="round"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="0.6" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="sun${id}" cx="0.72" cy="0.18" r="0.55">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="floor${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.55"/>
    </linearGradient>
    <filter id="b${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="s${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="40"/></filter>
  </defs>

  <rect width="800" height="600" fill="url(#bg${id})"/>
  <rect width="800" height="600" fill="url(#sun${id})"/>
  <g filter="url(#s${id})" opacity="0.55">
    <circle cx="180" cy="150" r="86" fill="#ffffff"/>
    <circle cx="640" cy="420" r="120" fill="${c1}"/>
  </g>
  <rect y="470" width="800" height="130" fill="url(#floor${id})"/>
  <ellipse cx="400" cy="566" rx="196" ry="26" fill="#3c4a44" opacity="0.18" filter="url(#b${id})"/>
  <g opacity="0.42" filter="url(#b${id})">${species === 'cat' ? cat : dog}</g>
  <rect x="0.5" y="0.5" width="799" height="599" fill="none" stroke="#ffffff" stroke-opacity="0.28"/>
</svg>`
}

const photos = {
  'photo-cat.svg': { c1: '#e6f0eb', c2: '#c2dcd1', c3: '#a7cabc', ink: '#1f3b33', species: 'cat' },
  'photo-dog.svg': { c1: '#f8ecdf', c2: '#ead2b8', c3: '#d9b997', ink: '#4a3a2a', species: 'dog' },
  'photo-1.svg': { c1: '#eaf2ee', c2: '#c9dfd5', c3: '#a9c9bc', ink: '#22403a', species: 'cat' },
  'photo-2.svg': { c1: '#faece0', c2: '#ecd2ba', c3: '#d9b493', ink: '#4b3728', species: 'dog' },
  'photo-3.svg': { c1: '#e3edf0', c2: '#c2d6dc', c3: '#a0bcc6', ink: '#253a42', species: 'cat' },
  'photo-4.svg': { c1: '#f0eade', c2: '#ddcfb7', c3: '#c7b494', ink: '#3f3828', species: 'dog' },
}

for (const [name, cfg] of Object.entries(photos)) {
  fs.writeFileSync(path.join(dir, name), photo(name.replace(/\W/g, ''), cfg))
}

const catAvatar = (bg, fg) => `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="${bg}"/>
  <g fill="${fg}">
    <path d="M58 62 L52 30 L84 46 Z"/><path d="M142 62 L148 30 L116 46 Z"/>
    <path d="M100 42c30 0 52 22 52 54 0 34-24 58-52 58s-52-24-52-58c0-32 22-54 52-54Z"/>
  </g>
  <g fill="${bg}">
    <circle cx="82" cy="96" r="7"/><circle cx="118" cy="96" r="7"/>
    <path d="M100 112c6 0 10 4 10 8s-4 6-10 6-10-2-10-6 4-8 10-8Z"/>
    <path d="M96 132c2 4 6 4 8 0" stroke="${bg}" stroke-width="4" fill="none" stroke-linecap="round"/>
  </g>
  <g stroke="${bg}" stroke-width="3" stroke-linecap="round" opacity="0.75">
    <path d="M56 108 L26 102"/><path d="M56 118 L28 122"/>
    <path d="M144 108 L174 102"/><path d="M144 118 L172 122"/>
  </g>
</svg>`

const dogAvatar = (bg, fg) => `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="${bg}"/>
  <g fill="${fg}">
    <path d="M62 62c-18-6-30 10-26 34 3 20 14 30 26 26Z"/>
    <path d="M138 62c18-6 30 10 26 34-3 20-14 30-26 26Z"/>
    <path d="M100 44c28 0 46 20 46 50 0 32-22 58-46 58s-46-26-46-58c0-30 18-50 46-50Z"/>
  </g>
  <g fill="${bg}">
    <circle cx="84" cy="92" r="6.5"/><circle cx="116" cy="92" r="6.5"/>
    <ellipse cx="100" cy="118" rx="12" ry="9"/>
  </g>
  <path d="M100 127v8" stroke="${bg}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M92 142c3 4 13 4 16 0" stroke="${bg}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
</svg>`

fs.writeFileSync(path.join(dir, 'avatar-cat.svg'), catAvatar('#dcede7', '#0e6b5c'))
fs.writeFileSync(path.join(dir, 'avatar-cat-2.svg'), catAvatar('#f6e7dc', '#b4623f'))
fs.writeFileSync(path.join(dir, 'avatar-dog.svg'), dogAvatar('#f3e4d5', '#9c6134'))
fs.writeFileSync(path.join(dir, 'avatar-dog-2.svg'), dogAvatar('#e1e9ec', '#3d6472'))

const personAvatar = (bg, fg) => `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="${bg}"/>
  <circle cx="60" cy="46" r="20" fill="${fg}"/>
  <path d="M18 120c0-24 19-40 42-40s42 16 42 40Z" fill="${fg}"/>
</svg>`
fs.writeFileSync(path.join(dir, 'avatar-user.svg'), personAvatar('#e4efeb', '#2f6b5e'))
fs.writeFileSync(path.join(dir, 'avatar-user-2.svg'), personAvatar('#f7e9df', '#b46a48'))
fs.writeFileSync(path.join(dir, 'avatar-user-3.svg'), personAvatar('#e7eaef', '#4b5a6b'))

fs.writeFileSync(
  path.join(dir, 'paw.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0e6b5c"/>
  <g fill="#f7f9f8">
    <ellipse cx="32" cy="41" rx="13" ry="11"/>
    <ellipse cx="18" cy="27" rx="6" ry="8" transform="rotate(-18 18 27)"/>
    <ellipse cx="46" cy="27" rx="6" ry="8" transform="rotate(18 46 27)"/>
    <ellipse cx="26" cy="18" rx="5" ry="6.5" transform="rotate(-8 26 18)"/>
    <ellipse cx="38" cy="18" rx="5" ry="6.5" transform="rotate(8 38 18)"/>
  </g>
</svg>`,
)

console.log('assets regenerated')
