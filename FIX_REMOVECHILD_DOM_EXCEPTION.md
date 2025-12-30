Context

Some users saw a full‑page error while generating or downloading images/videos:

- Error: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.

Root cause

- We created a temporary <a> element for downloads, appended it to document.body, then removed it with document.body.removeChild(anchor).
- In fast navigation or concurrent React updates, the node can already be detached by the time the cleanup runs, causing the DOMException.

Fix

- Replace direct removeChild calls with a safe removal sequence that prefers Element.remove() and falls back to parentNode.removeChild when present.

Pattern

```
document.body.appendChild(anchor);
anchor.click();
if (anchor.remove) {
  anchor.remove();
} else if (anchor.parentNode) {
  anchor.parentNode.removeChild(anchor);
}
```

Touched files (representative)

- src/components/image-generator.tsx
- src/components/video-generator.tsx
- src/app/[locale]/assets/assets-client.tsx
- src/components/workflow/batch-*.tsx
- src/app/admin/*/page.tsx

Notes

- This change is no‑op functionally but eliminates uncaught DOMExceptions under race conditions.

