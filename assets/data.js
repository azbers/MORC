/* DAUR Supply catalog and store settings.
   Edit this file to change products, prices, stock and delivery rules.
   The cost numbers below are working placeholders for the admin's profit
   checks. They are never shown on the storefront. */

window.DAUR_CONFIG = {
  brand: 'DAUR Supply',
  domain: 'https://daursupply.com',
  currency: 'Rs.',
  whatsapp: '923199628735',          // order line, country code first, digits only. Admin > Settings can override it
  supportEmail: 'contact@daursupply.com',
  marketRetail: 12000,                // typical mainstream retail price for comparable pairs
  freeDeliveryPairs: 2,               // delivery is free when the bag holds this many pairs
  /* One flat Cash on Delivery fee and timing for every city in Pakistan. Admin > Settings can change both. */
  delivery: { fee: 200, days: '2 to 6 working days' },
  /* Coupon rules. type: percent | flat. min: minimum subtotal in rupees. */
  coupons: {
    'SUPPLYLINE': { type: 'flat', value: 300, min: 0, label: 'Supply line access' },
    'DOUBLEUP': { type: 'percent', value: 10, min: 8000, label: '10% off two pairs or more' }
  },
  /* Lines on sale right now. Products of other lines stay in the catalog below but are hidden
     everywhere, and a line with no products is hidden too. To relaunch, add 'Women' and 'Kids' back. */
  audiences: ['Men'],
  lowStockAt: 2,
  adminPasscode: 'supplyunit'          // preview lock only; a live store needs a server login
};

/* Catalog. Generated format, also produced by tools/import-catalog.js.
   Each product has one or more colour variants. A variant may carry its own
   price, compareAt (the before price shown struck through when on sale),
   stock per size, and images. When images is empty the site draws the pair
   from silhouette + palette. audience: Men | Women | Kids. group: optional
   sub group such as Baby Girl or Baby Boy. */
window.DAUR_PRODUCTS = [
  {
    "id": "moc-runner-v1",
    "name": "Moc-Runner v1",
    "audience": "Men",
    "group": null,
    "category": "Hybrids",
    "silhouette": "moc",
    "tag": "Drop 01",
    "createdAt": "2026-10-01",
    "sizes": [
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "description": "The everyday leather shoe, rethought. Pebbled full grain cow leather meets a hand guided moc toe and a dual density sole that grips outside and cushions underfoot. Wear it with jeans on a weekday or a crisp shalwar kameez on Friday.",
    "specs": {
      "Upper": "Full grain cow leather, pebbled",
      "Lining": "Breathable leather and textile",
      "Stitch": "Hand guided moc toe, double needle",
      "Sole": "Dual density rubber, siped traction",
      "Weight": "Approx. 410 g (EU 42)",
      "Made in": "Sialkot and Lahore, Pakistan"
    },
    "cost": {
      "vendor": 2600,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "Moc-Runner | Black Leather Casual Shoes for Men, Price in Pakistan",
      "description": "Moc-Runner by DAUR Supply: full grain leather casual shoes for men with a hand guided moc toe and a cushioned sole. Cash on Delivery across Pakistan, free delivery on 2 pairs."
    },
    "variants": [
      {
        "id": "triple-black",
        "color": "Triple Black",
        "hex": "#111111",
        "price": 4500,
        "compareAt": null,
        "stock": {
          "40": 3,
          "41": 6,
          "42": 8,
          "43": 5,
          "44": 2,
          "45": 0
        },
        "palette": {
          "upper": "#141414",
          "panel": "#1d1d1d",
          "sole": "#0c0c0c",
          "stitch": "#5a5a55",
          "lace": "#0a0a0a"
        },
        "images": []
      },
      {
        "id": "oxblood",
        "color": "Oxblood",
        "hex": "#4a1717",
        "price": 4500,
        "compareAt": null,
        "stock": {
          "40": 2,
          "41": 3,
          "42": 4,
          "43": 3,
          "44": 1,
          "45": 0
        },
        "palette": {
          "upper": "#3a1212",
          "panel": "#2a0d0d",
          "sole": "#0c0c0c",
          "stitch": "#7a4a44",
          "lace": "#0a0a0a"
        },
        "images": []
      }
    ]
  },
  {
    "id": "phantom-trainer",
    "name": "Phantom Trainer",
    "audience": "Men",
    "group": null,
    "category": "Sneakers",
    "silhouette": "runner",
    "tag": "Drop 01",
    "createdAt": "2026-10-03",
    "sizes": [
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "description": "A stealth trainer for long city days. Suede overlays on breathable engineered mesh, a padded collar and a bone white phylon midsole that keeps every step light. Dark enough for the evening, easy enough for every day.",
    "specs": {
      "Upper": "Suede overlays on engineered mesh",
      "Lining": "Textile with padded collar",
      "Stitch": "Lock stitch overlays",
      "Sole": "Phylon midsole, rubber outsole",
      "Weight": "Approx. 330 g (EU 42)",
      "Made in": "Lahore, Pakistan"
    },
    "cost": {
      "vendor": 2850,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "Phantom Trainer | Black Sneakers & Joggers for Men, Price in Pakistan",
      "description": "Phantom Trainer by DAUR Supply: black suede and mesh sneakers for men on a light phylon sole. Cash on Delivery across Pakistan, free delivery on 2 pairs."
    },
    "variants": [
      {
        "id": "obsidian-bone",
        "color": "Obsidian / Bone",
        "hex": "#161616",
        "price": 4300,
        "compareAt": 4800,
        "stock": {
          "40": 4,
          "41": 5,
          "42": 0,
          "43": 6,
          "44": 4,
          "45": 2
        },
        "palette": {
          "upper": "#161616",
          "panel": "#222220",
          "sole": "#d8d2c4",
          "stitch": "#64645e",
          "lace": "#0a0a0a"
        },
        "images": []
      }
    ]
  },
  {
    "id": "grid-court-low",
    "name": "Grid Court Low",
    "audience": "Men",
    "group": null,
    "category": "Sneakers",
    "silhouette": "court",
    "tag": "Drop 01",
    "createdAt": "2026-10-05",
    "sizes": [
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "description": "A clean court low that goes with everything. Smooth leather on a stitched rubber cupsole, cut with sharp, minimal lines. Wear it with denim, chinos or a white shalwar kameez and let the silhouette do the talking.",
    "specs": {
      "Upper": "Smooth corrected grain leather",
      "Lining": "Textile, foam padded",
      "Stitch": "Stitched cupsole",
      "Sole": "Rubber cupsole",
      "Weight": "Approx. 380 g (EU 42)",
      "Made in": "Karachi, Pakistan"
    },
    "cost": {
      "vendor": 2400,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "Grid Court Low | White Leather Sneakers for Men, Price in Pakistan",
      "description": "Grid Court Low by DAUR Supply: clean leather court sneakers for men in bone or black, on a stitched rubber cupsole. Cash on Delivery across Pakistan, free delivery on 2 pairs."
    },
    "variants": [
      {
        "id": "bone-ink",
        "color": "Bone / Ink",
        "hex": "#d9d3c5",
        "price": 4200,
        "compareAt": null,
        "stock": {
          "40": 2,
          "41": 7,
          "42": 9,
          "43": 7,
          "44": 3,
          "45": 1
        },
        "palette": {
          "upper": "#d9d3c5",
          "panel": "#cbc4b4",
          "sole": "#e8e3d7",
          "stitch": "#8d877a",
          "lace": "#0a0a0a"
        },
        "images": []
      },
      {
        "id": "triple-black",
        "color": "Triple Black",
        "hex": "#111111",
        "price": 4200,
        "compareAt": null,
        "stock": {
          "40": 3,
          "41": 4,
          "42": 6,
          "43": 5,
          "44": 2,
          "45": 1
        },
        "palette": {
          "upper": "#141414",
          "panel": "#1c1c1c",
          "sole": "#101010",
          "stitch": "#4e4e4a",
          "lace": "#0a0a0a"
        },
        "images": []
      }
    ]
  },
  {
    "id": "unit-derby-02",
    "name": "Unit Derby 02",
    "audience": "Men",
    "group": null,
    "category": "Leather",
    "silhouette": "derby",
    "tag": "Drop 01",
    "createdAt": "2026-10-07",
    "sizes": [
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "description": "An open laced derby in hand burnished black full grain leather. A Blake stitched welt and a stacked heel give it the stance of a formal shoe, while the rubber sole keeps it easy all day. As sharp with tailoring as it is with cargos.",
    "specs": {
      "Upper": "Full grain leather, hand burnished",
      "Lining": "Leather",
      "Stitch": "Blake stitched welt",
      "Sole": "Rubber with stacked heel",
      "Weight": "Approx. 450 g (EU 42)",
      "Made in": "Sialkot, Pakistan"
    },
    "cost": {
      "vendor": 2950,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "Unit Derby 02 | Black Leather Formal Shoes for Men, Price in Pakistan",
      "description": "Unit Derby 02 by DAUR Supply: hand burnished full grain leather derby shoes for men, for the office, weddings and shalwar kameez. Cash on Delivery across Pakistan."
    },
    "variants": [
      {
        "id": "black-full-grain",
        "color": "Black Full Grain",
        "hex": "#121212",
        "price": 4900,
        "compareAt": null,
        "stock": {
          "40": 1,
          "41": 3,
          "42": 4,
          "43": 4,
          "44": 2,
          "45": 1
        },
        "palette": {
          "upper": "#121212",
          "panel": "#1a1a1a",
          "sole": "#0b0b0b",
          "stitch": "#4e4e4a",
          "lace": "#0a0a0a"
        },
        "images": []
      }
    ]
  },
  {
    "id": "concrete-mid",
    "name": "Concrete Mid",
    "audience": "Men",
    "group": null,
    "category": "Sneakers",
    "silhouette": "mid",
    "tag": "Drop 01",
    "createdAt": "2026-10-09",
    "sizes": [
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "description": "A mid cut built with weight and structure. Ash nubuck with black leather overlays, a padded high collar and a herringbone rubber cupsole that holds firm on concrete. Made to be worn hard and look better for it.",
    "specs": {
      "Upper": "Nubuck with leather overlays",
      "Lining": "Padded textile collar",
      "Stitch": "Double row overlay stitch",
      "Sole": "Rubber cupsole, herringbone",
      "Weight": "Approx. 470 g (EU 42)",
      "Made in": "Lahore, Pakistan"
    },
    "cost": {
      "vendor": 3150,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "Concrete Mid | High Top Sneakers for Men, Price in Pakistan",
      "description": "Concrete Mid by DAUR Supply: ash nubuck and leather high top sneakers for men on a herringbone rubber cupsole. Cash on Delivery across Pakistan, free delivery on 2 pairs."
    },
    "variants": [
      {
        "id": "ash-black",
        "color": "Ash / Black",
        "hex": "#4a4a47",
        "price": 5200,
        "compareAt": null,
        "stock": {
          "40": 0,
          "41": 2,
          "42": 5,
          "43": 5,
          "44": 3,
          "45": 2
        },
        "palette": {
          "upper": "#4a4a47",
          "panel": "#2a2a28",
          "sole": "#101010",
          "stitch": "#7a7a74",
          "lace": "#0a0a0a"
        },
        "images": []
      }
    ]
  },
  {
    "id": "volt-signal",
    "name": "Volt Signal",
    "audience": "Men",
    "group": null,
    "category": "Sneakers",
    "silhouette": "runner",
    "tag": "Limited",
    "createdAt": "2026-10-11",
    "sizes": [
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "description": "The one loud pair in the collection. Black engineered mesh and a suede toe ride on a volt EVA midsole made for movement. A limited run, for the days you want to be seen.",
    "specs": {
      "Upper": "Engineered mesh, suede toe",
      "Lining": "Textile",
      "Stitch": "Lock stitch overlays",
      "Sole": "EVA midsole, rubber outsole",
      "Weight": "Approx. 310 g (EU 42)",
      "Made in": "Lahore, Pakistan"
    },
    "cost": {
      "vendor": 2750,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "Volt Signal | Black Running Style Sneakers for Men, Price in Pakistan",
      "description": "Volt Signal by DAUR Supply: black mesh and suede sneakers for men on a volt EVA sole, in a limited run. Cash on Delivery across Pakistan."
    },
    "variants": [
      {
        "id": "black-volt",
        "color": "Black / Volt",
        "hex": "#ccff00",
        "price": 4700,
        "compareAt": null,
        "stock": {
          "40": 2,
          "41": 2,
          "42": 3,
          "43": 2,
          "44": 1,
          "45": 0
        },
        "palette": {
          "upper": "#121212",
          "panel": "#1c1c1c",
          "sole": "#ccff00",
          "stitch": "#5a5a55",
          "lace": "#0a0a0a"
        },
        "images": []
      }
    ]
  },
  {
    "id": "ward-chelsea",
    "name": "Ward Chelsea",
    "audience": "Men",
    "group": null,
    "category": "Leather",
    "silhouette": "chelsea",
    "tag": "Drop 01",
    "createdAt": "2026-10-13",
    "sizes": [
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "description": "A waxed full grain chelsea boot on a lugged rubber sole. Elastic gussets, a pull tab and clean lines, nothing more. Laceless, so the DAUR seal rides on the pull tab. Built for winter evenings, weddings and everything between.",
    "specs": {
      "Upper": "Waxed full grain leather",
      "Lining": "Leather",
      "Stitch": "Goodyear style welt stitch",
      "Sole": "Lugged rubber",
      "Weight": "Approx. 520 g (EU 42)",
      "Made in": "Sialkot, Pakistan"
    },
    "cost": {
      "vendor": 3300,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "Ward Chelsea | Leather Chelsea Boots for Men, Price in Pakistan",
      "description": "Ward Chelsea by DAUR Supply: waxed full grain leather chelsea boots for men in black or dark brown, on a lugged rubber sole. Cash on Delivery across Pakistan."
    },
    "variants": [
      {
        "id": "black-waxed",
        "color": "Black Waxed",
        "hex": "#111111",
        "price": 4900,
        "compareAt": 5400,
        "stock": {
          "40": 1,
          "41": 2,
          "42": 3,
          "43": 3,
          "44": 2,
          "45": 1
        },
        "palette": {
          "upper": "#111111",
          "panel": "#191919",
          "sole": "#0a0a0a",
          "stitch": "#4b4b47",
          "lace": "#2a2a28"
        },
        "images": []
      },
      {
        "id": "dark-brown",
        "color": "Dark Brown",
        "hex": "#3b2a1e",
        "price": 4900,
        "compareAt": 5400,
        "stock": {
          "40": 1,
          "41": 1,
          "42": 2,
          "43": 2,
          "44": 1,
          "45": 0
        },
        "palette": {
          "upper": "#33241a",
          "panel": "#271b13",
          "sole": "#0a0a0a",
          "stitch": "#6b5747",
          "lace": "#2a2a28"
        },
        "images": []
      }
    ]
  },
  {
    "id": "sector-slip",
    "name": "Sector Slip",
    "audience": "Men",
    "group": null,
    "category": "Hybrids",
    "silhouette": "slip",
    "tag": "Drop 01",
    "createdAt": "2026-10-15",
    "sizes": [
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "description": "Soft black nappa leather, twin elastic gores and a bone vulcanised sole. Slip on and go, from the office to the dinner table. The easiest way into a DAUR pair.",
    "specs": {
      "Upper": "Nappa leather",
      "Lining": "Leather and textile",
      "Stitch": "Apron stitch",
      "Sole": "Vulcanised rubber",
      "Weight": "Approx. 300 g (EU 42)",
      "Made in": "Karachi, Pakistan"
    },
    "cost": {
      "vendor": 2200,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "Sector Slip | Black Leather Slip On Shoes for Men, Price in Pakistan",
      "description": "Sector Slip by DAUR Supply: soft nappa leather slip on shoes for men with twin elastic gores and a bone sole. Cash on Delivery across Pakistan, free delivery on 2 pairs."
    },
    "variants": [
      {
        "id": "black-nappa",
        "color": "Black Nappa",
        "hex": "#131313",
        "price": 3900,
        "compareAt": null,
        "stock": {
          "40": 4,
          "41": 6,
          "42": 6,
          "43": 5,
          "44": 3,
          "45": 2
        },
        "palette": {
          "upper": "#131313",
          "panel": "#1b1b1b",
          "sole": "#d8d2c4",
          "stitch": "#5a5a55",
          "lace": "#0a0a0a"
        },
        "images": []
      }
    ]
  },
  {
    "id": "halo-court-w",
    "name": "Halo Court",
    "audience": "Women",
    "group": null,
    "category": "Sneakers",
    "silhouette": "court",
    "tag": "Drop 01",
    "createdAt": "2026-10-17",
    "sizes": [
      36,
      37,
      38,
      39,
      40,
      41
    ],
    "description": "A slim profile court low in soft bone leather with a tonal sole. Cut on a narrower last for women’s sizing.",
    "specs": {
      "Upper": "Soft corrected grain leather",
      "Lining": "Textile",
      "Stitch": "Stitched cupsole",
      "Sole": "Rubber cupsole",
      "Weight": "Approx. 300 g (EU 38)",
      "Made in": "Karachi, Pakistan"
    },
    "cost": {
      "vendor": 2300,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "DAUR Halo Court | Women's White Leather Sneakers Price in Pakistan",
      "description": "Halo Court by DAUR Supply. Women's bone leather sneakers, crafted in Pakistan, with Cash on Delivery across Pakistan."
    },
    "variants": [
      {
        "id": "bone",
        "color": "Bone",
        "hex": "#e2dccf",
        "price": 4100,
        "compareAt": null,
        "stock": {
          "36": 3,
          "37": 5,
          "38": 6,
          "39": 4,
          "40": 2,
          "41": 1
        },
        "palette": {
          "upper": "#e2dccf",
          "panel": "#d3ccbd",
          "sole": "#ece8de",
          "stitch": "#8d877a",
          "lace": "#e8e4da"
        },
        "images": []
      },
      {
        "id": "black",
        "color": "Black",
        "hex": "#111111",
        "price": 4100,
        "compareAt": null,
        "stock": {
          "36": 2,
          "37": 3,
          "38": 4,
          "39": 3,
          "40": 1,
          "41": 0
        },
        "palette": {
          "upper": "#141414",
          "panel": "#1c1c1c",
          "sole": "#e8e3d7",
          "stitch": "#5a5a55",
          "lace": "#0a0a0a"
        },
        "images": []
      }
    ]
  },
  {
    "id": "unit-mini-bb",
    "name": "Unit Mini",
    "audience": "Kids",
    "group": "Baby Boy",
    "category": "Sneakers",
    "silhouette": "court",
    "tag": "Drop 01",
    "createdAt": "2026-10-18",
    "sizes": [
      20,
      21,
      22,
      23,
      24,
      25
    ],
    "description": "The court low scaled down for first steps. Soft leather upper, flexible rubber sole, easy on and off.",
    "specs": {
      "Upper": "Soft leather",
      "Lining": "Cotton textile",
      "Stitch": "Stitched sole",
      "Sole": "Flexible rubber",
      "Weight": "Approx. 140 g (EU 22)",
      "Made in": "Lahore, Pakistan"
    },
    "cost": {
      "vendor": 1300,
      "kit": 300,
      "logistics": 300
    },
    "seo": {
      "title": "DAUR Unit Mini | Baby Boy Leather Sneakers Price in Pakistan",
      "description": "Unit Mini by DAUR Supply. Soft leather baby sneakers, crafted in Pakistan, with Cash on Delivery."
    },
    "variants": [
      {
        "id": "ink",
        "color": "Ink",
        "hex": "#15171c",
        "price": 2400,
        "compareAt": 2900,
        "stock": {
          "20": 3,
          "21": 4,
          "22": 4,
          "23": 3,
          "24": 2,
          "25": 1
        },
        "palette": {
          "upper": "#16181d",
          "panel": "#1e2026",
          "sole": "#e8e3d7",
          "stitch": "#5a5a55",
          "lace": "#0a0a0a"
        },
        "images": []
      }
    ]
  },
  {
    "id": "saddle-tassel",
    "name": "Saddle Tassel",
    "audience": "Men",
    "group": null,
    "category": "Hybrids",
    "silhouette": "loafer",
    "tag": "New",
    "createdAt": "2026-10-26",
    "sizes": [
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "description": "A slip on tassel loafer that keeps things easy. The upper is a fine diagonal twill with a soft brushed apron over the toe, edged in pale piping so the shape reads from across the room. A saddle strap crosses the instep and ties off in a knotted tassel pair. Underneath, a flexible gum sole with a brick tread keeps every step light. Wear it with chinos, linen trousers or a crisp shalwar kameez, no socks required.",
    "specs": {
      "Upper": "Diagonal twill with a brushed apron",
      "Details": "Saddle strap, knotted tassel pair, piped apron edge",
      "Footbed": "Cushioned, stitched heel lining",
      "Sole": "Flexible gum sole, brick tread",
      "Style": "Slip on, no laces",
      "Made in": "Pakistan"
    },
    "cost": null,
    "seo": {
      "title": "Saddle Tassel | Tassel Loafers for Men, Price in Pakistan",
      "description": "The DAUR Saddle Tassel: a men's slip on tassel loafer in sand or black, with a flexible gum sole. Cash on Delivery across Pakistan."
    },
    "variants": [
      {
        "id": "sand",
        "color": "Sand",
        "hex": "#CDB697",
        "price": 3900,
        "compareAt": null,
        "stock": {
          "40": 2,
          "41": 3,
          "42": 4,
          "43": 4,
          "44": 2,
          "45": 1
        },
        "palette": {
          "upper": "#CDB697",
          "panel": "#C2A988",
          "apron": "#B79E80",
          "pipe": "#F0E4D2",
          "tassel": "#B39878",
          "sole": "#C9965C",
          "stitch": "#8E7558",
          "lace": "#B39878"
        },
        "images": []
      },
      {
        "id": "black",
        "color": "Black",
        "hex": "#1C1C1D",
        "price": 3900,
        "compareAt": null,
        "stock": {
          "40": 1,
          "41": 2,
          "42": 3,
          "43": 3,
          "44": 2,
          "45": 1
        },
        "palette": {
          "upper": "#1C1C1D",
          "panel": "#18181A",
          "apron": "#141415",
          "pipe": "#2C2C2E",
          "tassel": "#141415",
          "sole": "#9AA3A6",
          "stitch": "#4A4A4C",
          "lace": "#141415"
        },
        "images": []
      }
    ]
  }
];

/* Statuses for the home page story rail. On Shopify these come from posts in the
   blog with the handle "status": title, image, summary, tags pin and link:/path.
   New products get a status of their own automatically for 7 days. */
window.DAUR_STATUSES = window.DAUR_STATUSES || [
  { "id": "free-two", "title": "Free delivery on 2 pairs", "text": "Order any two pairs and delivery is free, to every city in Pakistan. Pay cash at your door.", "image": null, "date": "2026-10-26", "tags": ["pin", "link:shop.html"] }
];
