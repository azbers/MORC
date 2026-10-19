# M.O.R.C. Supply admin guide

## 1. Open the admin

- **Preview link:** add `#admin` to the end of the preview address and press Enter.
- **Live site:** go to `yourdomain/admin.html`.
- **Passcode:** `supplyunit`. Change it in `assets/data.js` (`adminPasscode`) before launch.
- The admin is not linked anywhere on the public site.
- **Lock** (last tab) signs you out. Closing the browser tab also signs you out.

## 2. Add a new pair

1. Go to **Listings** and click **Add listing**.
2. Fill in the details:
   - **Name, URL id, Line** (Men, Women or Kids), sub group, style and badge.
   - **Sizes**, comma separated, for example `40, 41, 42, 43, 44`.
   - **Description**, and **specifications**, one per line as `Label: value`.
3. Add each colour:
   - **Colour name, swatch, price**, and a **before price** only if the pair is on sale.
   - **Images:** one path or link per line. The first one is the main photo.
   - **Stock for every size.**
4. Fill in your costs: **vendor price, hardware and packaging, QA, courier and COD**. These drive the profit figures and the discount floor.
5. Optionally fill in the **page title** and **meta description** for Google.
6. Save. The pair appears in the shop straight away.

## 3. Edit, hide or remove a pair

In **Listings**, each pair has three buttons:

- **Edit** changes any detail.
- **Hide** takes the pair off the shop without deleting it. **Show** brings it back.
- The **delete** button removes the pair completely.

## 4. Day to day tabs

- **Overview:** sales, Cash on Delivery pending, returns, stock alerts, reviews waiting and leads, with a "Needs attention" list.
- **Orders:**
  - Change the status: Placed, Confirmed, Dispatched, Out for delivery, Delivered.
  - Confirm the order on WhatsApp.
  - Add the courier name, tracking number and tracking link, then send the tracking on WhatsApp.
- **Returns:** log an exchange or return. You can put the pair back in stock.
- **Inventory:** update the stock for each size, or receive a new delivery from the vendor.
- **Discounts:** create, pause or delete codes. A code can be limited to certain pairs, one phone number, a minimum order, a number of uses or an end date.
- **Offers:**
  - Put a whole line or chosen pairs on sale by a percentage. Prices never go below your cost plus the minimum profit.
  - Set the announcement bar text.
- **Follow ups:**
  - Visitors who liked pairs and left their WhatsApp number appear here.
  - Send a reminder, a price drop notice or a personal code. The largest discount and the minimum profit are set in the rules at the top of the tab.
- **Reviews:** approve or hide reviews before they go live.
- **Alert list:** WhatsApp sign ups and restock requests.
- **Settings:**
  - Your WhatsApp order number and support email.
  - Low stock level and free delivery threshold.
  - The nationwide delivery fee and delivery time.
- **Publish:** copy or download the full catalog file.

## 5. Make changes visible to every visitor (important)

Until the store has a backend, admin changes are saved only in the browser you made them in. That covers products, stock, orders, codes, leads and settings.

**To publish catalog changes:**

1. Open **Publish** and copy the catalog.
2. Replace the `window.MORC_PRODUCTS` block at the bottom of `assets/data.js` with what you copied.
3. Run `node tools/build.js` and upload the site again.

**To change the WhatsApp number, email, delivery fee or passcode for everyone:** edit them in `assets/data.js`, then rebuild and upload.

Orders, leads and reviews from real customers can only reach you in one shared admin once the store runs on a backend, such as Shopify or a small server with a database. Until then, customers confirm every order with you on WhatsApp.
