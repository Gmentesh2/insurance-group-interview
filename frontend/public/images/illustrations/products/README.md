# Matching product-card illustrations

The user selected the existing cobalt Travel still life as the style for every product choice. Eight companion cutouts were generated with the built-in Image Generation tool on 16 October 2026; Travel reuses the original artwork documented in [the parent README](../README.md). The full companion prompts are saved in [prompts.json](prompts.json).

All nine subjects use cobalt, ivory, ice blue and silver with realistic materials and transparent backgrounds:

| Product | Subject |
| --- | --- |
| Health | Stethoscope and medical case |
| Motor | Cobalt hatchback and key fob |
| Home | House model and household furnishings |
| Travel | Carry-on, blank travel document and airplane model |
| Personal accident | Knee support, first-aid pouch and bandage |
| Device | Laptop and smartphone |
| Personal cyber | Padlock and smartphone |
| Purchase protection | Shopping bags and parcel |
| Rental car excess | Key, rental tag and car model |

These are decorative category illustrations, not insurer endorsements or coverage promises. Visible localized radio labels, descriptions and honest demo/preview availability remain real HTML. Do not put text over the artwork or add payment-card branding.

## Delivery

- Featured files: 720 × 480 WebP, quality 84.
- `-thumb` files: 180 × 120 WebP, quality 80.
- Transparency preserved; all generated sources had alpha.
- All 18 delivery images total 512,568 bytes. All nine thumbnails total 67,936 bytes.
- Only the selected full illustration is eager/high priority. Compact choices use lazy thumbnails. A default Health view requests roughly 112 KB of card artwork if all eight thumbnails load.
- Existing Next.js Sharp optimized the files. No package, remote image service or runtime generation was added.
- [manifest.json](manifest.json) records source output filenames and byte counts. Raw generated PNGs remain outside the repository; production references resolve only to these local WebPs.
