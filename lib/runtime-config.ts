export const deploymentMode = "catalog";

/**
 * MOOR SPICE is a product catalogue. It intentionally has no cart, checkout,
 * order tracking, customer records, or payment flow.
 */
export const commerceEnabled = false;
export const hasDatabase = Boolean(process.env.DATABASE_URL);
