# External Unsubscribe Integration Guide

This document explains how to integrate Budbringer unsubscribe functionality with an external website (forvarelset.tazk.no).

## How it works

1. **Newsletter links**: Unsubscribe links in newsletters go to: `https://forvarelset.tazk.no/page/meld-av/?email=user@example.com&signature=abc123`

2. **Your website**: Extract email and signature from URL parameters

3. **Call Budbringer API**: Make a POST request to unsubscribe the user

4. **Show confirmation**: Display success/error message to user

## Implementation

### JavaScript Example

```javascript
// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get('email');
const signature = urlParams.get('signature');

if (email && signature) {
  // Call Budbringer unsubscribe API
  fetch('https://budbringer.no/api/unsubscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      signature: signature
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.message === 'Avmeldt') {
      // Show success message
      document.getElementById('unsubscribe-status').innerHTML =
        '<p style="color: green;">✅ Du er nå avmeldt fra Budbringer nyhetsbrev.</p>';
    } else {
      // Show error message
      document.getElementById('unsubscribe-status').innerHTML =
        '<p style="color: red;">❌ Noe gikk galt ved avmeldingen.</p>';
    }
  })
  .catch(error => {
    console.error('Error:', error);
    document.getElementById('unsubscribe-status').innerHTML =
      '<p style="color: red;">❌ Kunne ikke behandle avmeldingen.</p>';
  });
} else {
  // No parameters, show general page
  document.getElementById('unsubscribe-status').innerHTML =
    '<p>Denne siden håndterer avmelding fra Budbringer nyhetsbrev.</p>';
}
```

### HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
    <title>Meld av - Budbringer</title>
</head>
<body>
    <h1>Avmelding fra Budbringer</h1>
    <div id="unsubscribe-status">
        <p>Behandler avmelding...</p>
    </div>

    <script>
        // Add the JavaScript code above here
    </script>
</body>
</html>
```

## API Response Format

### Success Response
```json
{
  "message": "Avmeldt"
}
```

### Error Responses
```json
{
  "error": "Ugyldig forespørsel"
}
```

```json
{
  "error": "Signaturen er ugyldig"
}
```

```json
{
  "error": "Kunne ikke oppdatere"
}
```

## Testing

Test the integration by:

1. Getting a real unsubscribe link from a Budbringer newsletter
2. Visiting the link on your external website
3. Checking that the API call succeeds
4. Verifying in Budbringer admin that the email status changed to "Avmeldt"

## Security Notes

- The signature ensures only valid unsubscribe requests are processed
- Email addresses are normalized (trimmed and lowercased)
- Invalid signatures are rejected with 403 status
- No sensitive data is exposed in error messages

## Support

If you need help with integration, check the Budbringer admin panel to see the status of email addresses after testing.