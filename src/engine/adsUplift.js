/**
 * What a monthly ads budget adds to one listing at one price — the single formula shared by the Ads Planner and by
 * Price Coach (through funnel.js), so both always show the same numbers. Pure; see engine/ads.js for the model.
 *
 *   most       = reach × clicks a typical similar listing gets in this price range (buyer interest at this price)
 *   ad clicks  = most × (1 − e^(−spend ÷ (most × cpc)))
 *   ad views   = ad clicks ÷ click rate,   ad orders = ad clicks × orders per click
 */
import { ADS } from '../data/ads.js';

const mid = (r) => (r[0] + r[1]) / 2;

export function adsUplift({ categoryId, bucket, ctr, opv, spend }) {
  const cpc = ADS.cpc[categoryId] ?? ADS.defaultCpc;
  const most = ADS.reach * mid(bucket.clicks);
  const cvr = ctr > 0 ? opv / ctr : 0;
  const adClicks = spend > 0 && most > 0 ? most * (1 - Math.exp(-spend / (most * cpc))) : 0;
  return { cpc, most, cvr, adClicks, adViews: ctr > 0 ? adClicks / ctr : 0, adOrders: adClicks * cvr };
}

/** The product's saved monthly ads budget (₹), or 0 when Price Coach should use the category average per order. */
export const savedBudget = (product) => (product?.adsBudget > 0 ? product.adsBudget : 0);

/** A copy of the product without its saved budget (the Ads Planner draws its curve from zero). */
export const withoutBudget = (product) => (product?.adsBudget != null ? { ...product, adsBudget: null } : product);
