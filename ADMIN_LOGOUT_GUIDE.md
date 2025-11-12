# Admin Logout Button Guide

## 📍 Where is the Logout Button?

The **Logout** button is located in the **top-right corner** of all admin pages (except the login page).

### Visual Location:
```
┌─────────────────────────────────────────────────────────────┐
│  Admin Dashboard        [Search email...]  [🚪 Logout]    │  ← TOP BAR
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Main Content Area]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Button Appearance:
- 🔴 **Red color** (destructive variant)
- 🚪 **LogOut icon** on the left
- 📝 **Text**: "Logout"

---

## 🔍 If You Can't See the Logout Button

### Option 1: Check Browser Zoom Level
The button might be outside the viewport if your browser is zoomed in.
- Press `Ctrl + 0` to reset zoom to 100%

### Option 2: Scroll to Top
Make sure you're at the top of the page.

### Option 3: Check if TopBar is Hidden
The TopBar might not be rendering. Check browser console (F12) for errors.

### Option 4: Hard Refresh
Press `Ctrl + Shift + R` to force reload the page with latest code.

---

## 🆘 Alternative Ways to Logout

### Method 1: Clear Cookies Manually (Fastest)

1. Press `F12` to open Developer Tools
2. Go to **Application** tab
3. In left sidebar, expand **Cookies**
4. Click on `https://www.viecom.pro`
5. Find `admin_token` cookie
6. Right-click → **Delete**
7. Refresh the page → You'll be redirected to login

### Method 2: Use Browser Incognito/Private Mode

1. Close the current admin tab
2. Press `Ctrl + Shift + N` (Chrome) or `Ctrl + Shift + P` (Firefox)
3. Visit `https://www.viecom.pro/admin/login`
4. You'll need to login again

### Method 3: Call Logout API Directly

Open a new tab and visit:
```
https://www.viecom.pro/api/admin/auth/logout
```

Or open Console (F12) and run:
```javascript
fetch('/api/admin/auth/logout', { method: 'POST' })
  .then(() => { window.location.href = '/admin/login'; });
```

---

## 🔧 If Logout Button is Really Missing

If you still can't see the button after trying the above, it might be a deployment issue.

### Check if AdminTopBar is rendering:

1. Open browser console (F12)
2. Go to **Console** tab
3. Run:
```javascript
document.querySelector('button[variant="destructive"]')
```

If it returns `null`, the button is not in the DOM.

If it returns an element, the button exists but might be hidden by CSS.

---

## 📸 Expected Appearance

The button should look like this:

```
╔════════════════════════════════════════════════════╗
║  Admin Dashboard              [Search] [🚪 Logout] ║
╚════════════════════════════════════════════════════╝
```

- Located in the top-right corner
- Red background
- White text
- LogOut icon visible

---

## 🐛 Report Issue

If the button is truly missing and none of the alternatives work, please provide:

1. Screenshot of the admin page
2. Browser console errors (F12 → Console)
3. Browser and version (e.g., Chrome 120)

---

Last Updated: 2024-11-12

