# Chhavi's Creations

Handmade fashion storefront with WhatsApp ordering, contact form, and Google Sheets integration.

## Fix: "Drive - You need access" error

This happens when the Apps Script project is **not bound** to your sheet, or the web app was deployed with the wrong access settings.

### Do this again carefully

1. Open your sheet: [Chhavi Creations](https://docs.google.com/spreadsheets/d/1ma9WiOpXRzkGtKaJrDcq0Mr316f94XzDcVbKV1QKtw0/edit)
2. Make sure you are signed in as the **same Google account** that owns the sheet.
3. Click **Extensions > Apps Script** (opens the script tied to THIS sheet).
4. Delete any old code. Paste everything from `google-apps-script/Code.gs`.
5. Click **Save**.
6. Click **Deploy > Manage deployments**.
   - If an old deployment exists, click the pencil (Edit).
   - Or create **New deployment**.
7. Type: **Web app**
8. Settings must be exactly:
   - **Execute as:** Me (`your email`)
   - **Who has access:** Anyone
9. Click **Deploy**, approve permissions if asked (Allow).
10. Copy the **Web app URL** ending in `/exec`.
11. Paste it into `script.js`:

```js
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/...../exec";
```

### Quick test

Open the `/exec` URL in a new browser tab (or Incognito).

You should see JSON like:

```json
{"success":true,"message":"Chhavi's Creations API is running.","sheet":"Chhavi Creations","tabs":["Contacts","Orders"]}
```

If you still see **Drive / You need access**, the deployment access is still wrong, or you are signed into a different Google account.

### Common mistakes

| Wrong | Correct |
|---|---|
| Created script at script.google.com alone | Create via **Extensions > Apps Script** inside the sheet |
| Who has access: Only myself | Who has access: **Anyone** |
| Execute as: User accessing the web app | Execute as: **Me** |
| Using an old `/exec` URL after redeploy | Copy the **new** URL after each redeploy |
| Pasting the spreadsheet URL into `script.js` | Paste the Apps Script **web app** `/exec` URL |

## What gets saved

**Contacts**
- Timestamp, Name, Phone, Email, Inquiry Type, Message

**Orders**
- Timestamp, Name, Phone, Product, Product Code, Size, Quantity, Status, Notes
