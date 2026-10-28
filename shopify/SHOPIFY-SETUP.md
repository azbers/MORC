# Putting DAUR Supply on Shopify

Shopify takes over the parts the static site cannot do on its own:

* the database of products, stock and orders
* the admin login and staff accounts
* the checkout with Cash on Delivery
* hosting and security

The DAUR design stays the same, because it is packaged as a Shopify theme.

**Files in this folder**

| File | What it is |
|---|---|
| `products.csv` | Your 10 pairs, every colour and size, ready for Shopify's product import |
| `daur-supply-theme.zip` | The DAUR theme, ready to upload |
| `theme/` | The same theme unzipped, for anyone who edits code |

Plan names and prices change, so check them on shopify.com/pricing before you choose.

## Step 1. Create the store

1. Sign up at shopify.com with your business email.
2. In **Settings > General** (called Store details on some accounts), set the following:
   * Store name: DAUR Supply
   * Country: Pakistan
   * Store currency: Pakistani Rupee (PKR)
   * Time zone: Karachi
3. Keep the store password protected until launch. You find this under **Online Store > Preferences > Password protection**.

## Step 2. Turn on Cash on Delivery

1. Open **Settings > Payments**.
2. Under **Manual payment methods**, add **Cash on Delivery (COD)**.
3. Write a short instruction, for example: "Pay the rider in cash when your pair arrives. We confirm every order on WhatsApp first."
4. If you later want card or wallet payments, Settings > Payments lists the providers Shopify supports for Pakistan.

## Step 3. Delivery fee and free delivery on two pairs

1. Open **Settings > Shipping and delivery**.
2. Under **General shipping rates**, create a shipping zone named Pakistan, with the country Pakistan.
3. Add a flat rate:
   * Name: Delivery across Pakistan
   * Price: Rs. 250 (or your real fee)
4. Free delivery on two pairs:
   1. Open **Discounts > Create discount > Free shipping**.
   2. Choose **Automatic discount**.
   3. Set the minimum requirement to **Minimum quantity of items: 2**.
   4. Set the countries to Pakistan.

Rs. 250 and "2 to 6 working days" are defaults I set. Please replace them with your courier's real numbers.

## Step 4. Import the products

1. Open **Products > Import**.
2. Choose `products.csv` and upload it.
3. Check the preview, then confirm. You get 10 products with their colours (Color) and sizes (Size, written as EU 40, EU 41 and so on).
   * The file sets stock for every size at your default location.
   * It sets the sale price and the before price (Compare at price).
   * It sets your cost per item, the SEO title and the SEO description.
4. If Shopify reports a column it does not recognise, download Shopify's own sample file on the same screen and compare the headings. I could not test the import against a live store from here.

**How the theme reads each product**

| Shopify field | What it controls |
|---|---|
| Title | Shown without the "DAUR" prefix, which the theme adds itself |
| Product type | The category, for example Hybrids or Derby |
| Description | The paragraph becomes the description. A bullet list of "Label: value" lines becomes the specifications table. |
| Options | Name them exactly **Color** and **Size**. Write sizes as "EU 42". |
| Price and Compare at price | A compare at price higher than the price shows the hanging sale tag |
| Inventory | Stock per size. Sold out sizes show "Notify". |

Tags carry the details Shopify has no field for:

| Tag | Meaning |
|---|---|
| `Men`, `Women` or `Kids` | The line the pair belongs to |
| `group:Baby Girl` | Optional sub group |
| `badge:Drop 01` or `badge:Limited` | The small badge on the card |
| `silhouette:moc` | Shape of the drawn shoe, used until photos are added |
| `swatch:Oxblood=#4a1717` | One per colour. It sets the colour dot. |
| `cost:2600/420/330` | Vendor price, kit, then QA and courier. It drives the public price breakdown. Leave it out to hide the breakdown for that pair. |

## Step 5. Add photos

1. Open each product and add its photos under **Media**.
2. Give each photo an **alt text that contains the colour name**, for example "Moc-Runner v1 Oxblood side". Alternatively, assign the photo to that colour's variants.
3. The theme shows each colour's own photos. The first photo is the main one.
4. A product with no photos keeps the drawn shoe, as in the preview.

## Step 6. Upload the theme

1. Open **Online Store > Themes**.
2. Click **Add theme > Upload zip file** and choose `daur-supply-theme.zip`.
3. Click **Customize** on the uploaded theme, then open **Theme settings**. Fill in:
   * WhatsApp order number (country code first, digits only). It is used only inside WhatsApp links.
   * Support email and the announcement text.
   * The delivery fee, delivery time and free delivery pairs. These must match Step 3, because the shop shows these numbers while Shopify charges the ones in Step 3.
4. Click **Publish** when you are happy.

**Another option is to connect the theme from GitHub.**

1. In Online Store > Themes, choose **Add theme > Connect from GitHub**.
2. Pick the repository **azbers/MORC** and the branch **shopify-theme**.
3. That branch holds only the theme. Every push to it updates the theme in Shopify, so you never upload a zip again. Changes you make in the theme editor are saved back to that branch by Shopify.

## Step 7. Create the brand pages

1. Open **Online Store > Pages**.
2. Create one page for each address below. The title can be anything. Set the address under **Search engine listing > URL handle**.
3. The theme draws these pages itself, so leave the content empty.

| URL handle | Page |
|---|---|
| `manifesto` | Manifesto |
| `contract` | Operational contract, delivery, exchanges, size guide, FAQ |
| `policies` | Terms, privacy, shipping, refunds, COD and contact |
| `track` | Track order |
| `liked` | Liked pairs |
| `alerts` | WhatsApp alert list |
| `feed` | The feed |

Any other page you create in Shopify shows its own content in the DAUR style.

## Step 8. Legal policies at checkout

1. Open **Settings > Policies**.
2. Paste the refund, privacy, terms and shipping texts from your policies page.
3. Shopify links them at checkout.
4. Please have a lawyer review them before launch.

## Step 9. Discount codes

Open **Discounts > Create discount** and recreate your codes:

| Code | Type | Details |
|---|---|---|
| SUPPLYLINE | Amount off order | Rs. 300 |
| DOUBLEUP | Amount off order | 10 percent, minimum purchase Rs. 8,000 |

Shopify discounts can also be limited to chosen products, chosen customers, a number of uses, one use per customer, or an end date.

Shoppers can type a code in the bag. The theme carries it to Shopify checkout, where Shopify checks it and applies it.

## Step 10. Domain, staff and going live

* **Domain:** Settings > Domains > Connect existing domain. Shopify shows the DNS records to add at your domain registrar.
* **Staff:** Settings > Users and permissions. Every person gets their own login, and you control what each one can see.
* **Customer accounts:** Settings > Customer accounts. Customers then sign in with their email and see their orders, which is where the Track page sends them.
* **Launch:** remove the password from Online Store > Preferences.

## Daily work in Shopify

| Task | Where |
|---|---|
| New orders | Orders. Shopify emails you for each one. |
| Confirm on WhatsApp | Use the customer's phone number on the order |
| Dispatch | Open the order, click Fulfill items, enter the courier and tracking number. If your courier is not in the list, choose Other and paste the tracking link. |
| Stock | Products > Inventory |
| New pair | Products > Add product, following the conventions in Step 4 |
| Archive or delete a pair | Open it, set the status to Draft or Archived, or delete it |
| Sales and reports | Analytics |

Customers see the courier and the tracking link on their order status page. Several Pakistani couriers offer Shopify apps that book parcels and update tracking automatically. Search the Shopify App Store for your courier.

## What works differently on Shopify

* **Admin:** the DAUR admin screen is not included. Shopify's own admin replaces it, with real logins.
* **Checkout:** the bag, liked pairs, search and the flex card work as before. Checkout is Shopify's own page with Cash on Delivery. The DAUR checkout form is not used.
* **Track page:** it sends customers to their Shopify order page, or lets them ask on WhatsApp with an order number. Shopify does not allow a public lookup by phone number without a login.
* **Alert list, restock requests, liked pairs follow ups and new reviews:** these are emailed to the store through Shopify's contact form, so they reach you instead of staying in the visitor's browser.
  * I tested this only against a local stand in for Shopify.
  * Shopify can ask some visitors to pass a spam check, which would stop that email.
  * Please send one test sign up after launch and confirm it arrives.
  * For reliable WhatsApp automation and a lead list, use a WhatsApp marketing app from the Shopify App Store.
* **Reviews:** the built in reviews are kept in the visitor's browser and never go public, because there is no approval screen on Shopify. For public, moderated reviews, install a reviews app.
* **Personal codes and profit floors:** the follow up rules from the DAUR admin (largest discount, minimum profit) are not automatic on Shopify. Create those codes in Discounts and limit them to the customer.

## Updating the theme later

The theme source lives in `shopify/theme-src`, and it shares `assets/` with the static site.

1. Run `node tools/shopify-theme.js` to rebuild `daur-supply-theme.zip`.
2. Upload the new zip as in Step 6.

Run `node tools/shopify-csv.js` to rebuild `products.csv` from `assets/data.js`. Once you live on Shopify, edit products in Shopify instead.
