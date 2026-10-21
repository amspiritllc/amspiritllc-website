# Static product showcase

Exactly eight fictional examples are included for design review. Sample IDs start with `sample-`; the page labels an all-sample catalog as a preview, not offers for sale. Replace the sample feed and imagery only after owner approval. The page reads display prices as supplied; it performs no pricing calculation.

The v1 contract is `/products/products.json`: `schema`, ISO `generatedAt`, and `items`. Item fields are exactly `id`, `name`, `category`, `description`, `image`, `price`, `available`, `featured`. Unknown keys are rejected. See `catalog-model.mjs` for validation. Invalid or unavailable feeds fail closed with a contact link. Image paths must be local `/products/img/<slug>.webp`; missing images use a text placeholder. Keep images at or below 1200 pixels.

Categories: consumer-electronics, computer-accessories, office-products, gaming, home-goods, other. A null price or false availability displays no price. Unavailable entries sort last for both price directions. Search/filter/sort remain in memory only. The only data request is the same-origin JSON file. Inquiries contain only the item name in an email subject. No offers structured data is emitted.

Run `node --test products/catalog-model.test.mjs`. No runtime dependencies or build step. Artwork in `products/art/` is original illustrative source for the sample WebP files, not product photography.

This change is stacked on the redesign PR. Keep it a draft until design, sample presentation and the eventual real feed are approved. Do not publish sample items as real inventory.
