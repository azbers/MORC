/* M.O.R.C. Supply catalog and store settings.
   Edit this file to change products, prices, stock and delivery rules.
   IMPORTANT: the cost breakdown numbers below are working placeholders.
   Replace them with your real vendor invoices before launch, because the
   brand promise is radical transparency. */

window.MORC_CONFIG = {
  brand: 'M.O.R.C. Supply',
  domain: 'https://morcsupply.pk',
  currency: 'Rs.',
  whatsapp: '923055125974',          // order line, country code first, digits only. Admin > Settings can override it
  supportEmail: 'supply@morcsupply.pk',
  marketRetail: 12000,                // typical mainstream retail price for comparable pairs
  freeDeliveryPairs: 2,               // delivery is free when the bag holds this many pairs
  /* One flat Cash on Delivery fee and timing for every city in Pakistan. Admin > Settings can change both. */
  delivery: { fee: 250, days: '2 to 6 working days' },
  /* Coupon rules. type: percent | flat. min: minimum subtotal in rupees. */
  coupons: {
    'SUPPLYLINE': { type: 'flat', value: 300, min: 0, label: 'Supply line access' },
    'DOUBLEUP': { type: 'percent', value: 10, min: 8000, label: '10% off two pairs or more' }
  },
  audiences: ['Men', 'Women', 'Kids'],
  lowStockAt: 2,
  adminPasscode: 'supplyunit'          // preview lock only; a live store needs a server login
};

/* Catalog. Generated format, also produced by tools/import-catalog.js.
   Each product has one or more colour variants. A variant may carry its own
   price, compareAt (the before price shown struck through when on sale),
   stock per size, and images. When images is empty the site draws the pair
   from silhouette + palette. audience: Men | Women | Kids. group: optional
   sub group such as Baby Girl or Baby Boy. */
window.MORC_PRODUCTS = [
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
    "description": "Heavy grain local leather upper. Sourced directly from Punjab’s classic artisan hubs. Structured moc toe stitching sitting on a lightweight, dual density traction sole. Curated for the street, priced for the people.",
    "specs": {
      "Upper": "Full grain cow leather, pebbled",
      "Lining": "Breathable leather and textile",
      "Stitch": "Hand guided moc toe, double needle",
      "Sole": "Dual density rubber, siped traction",
      "Weight": "Approx. 410 g (EU 42)",
      "Origin": "Sialkot and Lahore vendor hubs"
    },
    "cost": {
      "vendor": 2600,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "M.O.R.C. Moc-Runner v1 | Mens Black Leather Casual Shoes Pakistan",
      "description": "The M.O.R.C. Moc-Runner v1 in triple black. Premium local leather casual shoes with moc toe stitching, sold at factory direct pricing with Cash on Delivery in Pakistan."
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
    "description": "A stealth trainer with a bone white phylon midsole and a suede overlaid upper. Built on the same lasts that big labels order from, minus the logo tax.",
    "specs": {
      "Upper": "Suede overlays on engineered mesh",
      "Lining": "Textile with padded collar",
      "Stitch": "Lock stitch overlays",
      "Sole": "Phylon midsole, rubber outsole",
      "Weight": "Approx. 330 g (EU 42)",
      "Origin": "Lahore vendor hub"
    },
    "cost": {
      "vendor": 2850,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "M.O.R.C. Phantom Trainer | Black Streetwear Sneakers Pakistan",
      "description": "Phantom Trainer by M.O.R.C. Supply. Black and bone streetwear sneakers at wholesale pricing, delivered with Cash on Delivery across Pakistan."
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
    "description": "A clean bone court low in smooth leather on a stitched cupsole. The kind of pair that sells for five figures with the right logo. Here it sells at what it is worth.",
    "specs": {
      "Upper": "Smooth corrected grain leather",
      "Lining": "Textile, foam padded",
      "Stitch": "Stitched cupsole",
      "Sole": "Rubber cupsole",
      "Weight": "Approx. 380 g (EU 42)",
      "Origin": "Karachi vendor hub"
    },
    "cost": {
      "vendor": 2400,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "M.O.R.C. Grid Court Low | White Leather Sneakers Pakistan",
      "description": "Grid Court Low by M.O.R.C. Supply. Bone white leather court sneakers at factory direct pricing with Cash on Delivery across Pakistan."
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
    "description": "An open laced derby in burnished black full grain, cut for wear with cargos as much as tailoring. Same benches, same leather, none of the boutique markup.",
    "specs": {
      "Upper": "Full grain leather, hand burnished",
      "Lining": "Leather",
      "Stitch": "Blake stitched welt",
      "Sole": "Rubber with stacked heel",
      "Weight": "Approx. 450 g (EU 42)",
      "Origin": "Sialkot vendor hub"
    },
    "cost": {
      "vendor": 2950,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "M.O.R.C. Unit Derby 02 | Black Leather Derby Shoes Pakistan",
      "description": "Unit Derby 02 by M.O.R.C. Supply. Black full grain leather derby shoes from Pakistani workshops at wholesale pricing with Cash on Delivery."
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
    "description": "A mid cut in ash nubuck with black leather overlays and a padded high collar. Heavy, structured, made to be scuffed on concrete.",
    "specs": {
      "Upper": "Nubuck with leather overlays",
      "Lining": "Padded textile collar",
      "Stitch": "Double row overlay stitch",
      "Sole": "Rubber cupsole, herringbone",
      "Weight": "Approx. 470 g (EU 42)",
      "Origin": "Lahore vendor hub"
    },
    "cost": {
      "vendor": 3150,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "M.O.R.C. Concrete Mid | High Top Streetwear Sneakers Pakistan",
      "description": "Concrete Mid by M.O.R.C. Supply. Ash and black high top streetwear sneakers at wholesale pricing with Cash on Delivery across Pakistan."
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
    "description": "The one loud pair in a quiet catalog. Black mesh and suede on a volt midsole. Small batch from a single vendor run.",
    "specs": {
      "Upper": "Engineered mesh, suede toe",
      "Lining": "Textile",
      "Stitch": "Lock stitch overlays",
      "Sole": "EVA midsole, rubber outsole",
      "Weight": "Approx. 310 g (EU 42)",
      "Origin": "Lahore vendor hub"
    },
    "cost": {
      "vendor": 2750,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "M.O.R.C. Volt Signal | Black Running Style Sneakers Pakistan",
      "description": "Volt Signal by M.O.R.C. Supply. Black and volt running style sneakers in a small batch, at wholesale pricing with Cash on Delivery in Pakistan."
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
    "description": "A waxed black chelsea on a lugged rubber sole. Elastic gussets, pull tab, nothing else. Laceless, so it carries the M.O.R.C. seal on the pull tab instead.",
    "specs": {
      "Upper": "Waxed full grain leather",
      "Lining": "Leather",
      "Stitch": "Goodyear style welt stitch",
      "Sole": "Lugged rubber",
      "Weight": "Approx. 520 g (EU 42)",
      "Origin": "Sialkot vendor hub"
    },
    "cost": {
      "vendor": 3300,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "M.O.R.C. Ward Chelsea | Black Leather Chelsea Boots Pakistan",
      "description": "Ward Chelsea by M.O.R.C. Supply. Black waxed leather chelsea boots from Pakistani workshops at wholesale pricing with Cash on Delivery."
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
    "description": "Soft black nappa slip on with twin gores and a bone sole. The entry point to the supply line.",
    "specs": {
      "Upper": "Nappa leather",
      "Lining": "Leather and textile",
      "Stitch": "Apron stitch",
      "Sole": "Vulcanised rubber",
      "Weight": "Approx. 300 g (EU 42)",
      "Origin": "Karachi vendor hub"
    },
    "cost": {
      "vendor": 2200,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "M.O.R.C. Sector Slip | Black Leather Slip On Shoes Pakistan",
      "description": "Sector Slip by M.O.R.C. Supply. Black nappa leather slip on shoes at factory direct pricing with Cash on Delivery in Pakistan."
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
      "Origin": "Karachi vendor hub"
    },
    "cost": {
      "vendor": 2300,
      "kit": 420,
      "logistics": 330
    },
    "seo": {
      "title": "M.O.R.C. Halo Court | Womens White Leather Sneakers Pakistan",
      "description": "Halo Court by M.O.R.C. Supply. Womens bone leather sneakers at factory direct pricing with Cash on Delivery across Pakistan."
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
      "Origin": "Lahore vendor hub"
    },
    "cost": {
      "vendor": 1300,
      "kit": 300,
      "logistics": 300
    },
    "seo": {
      "title": "M.O.R.C. Unit Mini | Baby Boy Leather Sneakers Pakistan",
      "description": "Unit Mini by M.O.R.C. Supply. Soft leather baby sneakers at factory direct pricing with Cash on Delivery in Pakistan."
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
  }
];
