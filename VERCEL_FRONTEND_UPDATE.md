# Vercel Frontend: Embed Mode Update

## What to change

In your Next.js page component (likely `app/page.tsx` or `src/app/page.tsx`), 
add embed detection and conditionally hide the back link and outer padding.

## Step 1: Add embed detection at the top of your component

Find your main component function (the default export) and add this near the top,
alongside your other `useState` hooks:

```tsx
const [isEmbed, setIsEmbed] = useState(false);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  setIsEmbed(params.get('embed') === 'true');
}, []);
```

## Step 2: Conditionally hide the back link

Find the two `<a>` tags that render "← Back to Dallasite On Tour" and wrap them:

```tsx
{!isEmbed && (
  <a href="https://dallasiteontour.org" style={styles.backLink}>
    ← Back to Dallasite On Tour
  </a>
)}
```

There are TWO instances of this link (one for connected state, one for the 
landing state) — update both.

## Step 3: Adjust container padding when embedded

Update the container style to remove top padding when embedded:

```tsx
<div style={{
  ...styles.container,
  ...(isEmbed ? { padding: '0', justifyContent: 'stretch' } : {})
}}>
```

And make the card fill the space:

```tsx
<div style={{
  ...styles.card,
  ...(isEmbed ? { maxWidth: '100%', borderRadius: '0', flex: 1 } : {})
}}>
```

## Quick full example of the changes

If your component looks roughly like this:

```tsx
export default function Home() {
  const [token, setToken] = useState(null);
  // ... other state ...

  // ADD THIS:
  const [isEmbed, setIsEmbed] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsEmbed(params.get('embed') === 'true');
  }, []);

  // Then in your JSX, wrap the back links:
  return token ? (
    <div style={{...styles.container, ...(isEmbed ? {padding: 0} : {})}}>
      {!isEmbed && (
        <a href="https://dallasiteontour.org" style={styles.backLink}>
          ← Back to Dallasite On Tour
        </a>
      )}
      <div style={{...styles.card, ...(isEmbed ? {maxWidth:'100%', borderRadius:0, flex:1} : {})}}>
        {/* ... rest of connected UI ... */}
      </div>
    </div>
  ) : (
    <div style={{...styles.container, ...(isEmbed ? {padding: 0} : {})}}>
      {!isEmbed && (
        <a href="https://dallasiteontour.org" style={styles.backLink}>
          ← Back to Dallasite On Tour
        </a>
      )}
      <div style={{...styles.card, ...(isEmbed ? {maxWidth:'100%', borderRadius:0, flex:1} : {})}}>
        {/* ... rest of landing UI ... */}
      </div>
    </div>
  );
}
```

## After making changes

```bash
git add .
git commit -m "Add embed mode for iframe integration"
git push
```

Vercel will auto-deploy. The Cloudflare site already loads `?embed=true` 
so the back link will disappear automatically once this deploys.
