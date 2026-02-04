# Framework Reference

Quick reference for framework-specific patterns.

## Environment Variable Prefixes

| Framework | Prefix | Access |
|-----------|--------|--------|
| Next.js | `NEXT_PUBLIC_` | `process.env.NEXT_PUBLIC_X` |
| Vite | `VITE_` | `import.meta.env.VITE_X` |
| Create React App | `REACT_APP_` | `process.env.REACT_APP_X` |
| SvelteKit | `PUBLIC_` | `$env/static/public` |
| Nuxt 3 | `NUXT_PUBLIC_` | `useRuntimeConfig().public` |
| Astro | `PUBLIC_` | `import.meta.env.PUBLIC_X` |

---

## Next.js

```javascript
// next.config.js - expose env var
module.exports = {
  env: {
    NEXT_PUBLIC_VIDEO_CDN_URL: process.env.NEXT_PUBLIC_VIDEO_CDN_URL,
  },
};

// Usage
const url = process.env.NEXT_PUBLIC_VIDEO_CDN_URL || '/videos';
```

---

## Vite

```javascript
// vite.config.js - nothing special needed, VITE_ prefix auto-exposed

// Usage
const url = import.meta.env.VITE_VIDEO_CDN_URL || '/videos';
```

---

## SvelteKit

```javascript
// Usage in .svelte files
<script>
  import { env } from '$env/static/public';
  const videoUrl = env.PUBLIC_VIDEO_CDN_URL || '/videos';
</script>
```

---

## Nuxt 3

```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      videoCdnUrl: process.env.NUXT_PUBLIC_VIDEO_CDN_URL || '/videos',
    },
  },
});

// Usage
const config = useRuntimeConfig();
const url = config.public.videoCdnUrl;
```

---

## Astro

```javascript
// Usage
const url = import.meta.env.PUBLIC_VIDEO_CDN_URL || '/videos';
```

---

## Vue (Vue CLI)

```javascript
// Uses same pattern as CRA
const url = process.env.VUE_APP_VIDEO_CDN_URL || '/videos';
```
