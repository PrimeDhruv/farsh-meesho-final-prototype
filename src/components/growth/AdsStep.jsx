import { useMemo } from 'react';
import { Megaphone, Sparkles, AlertTriangle, ShieldAlert, Check, ArrowRight, X } from 'lucide-react';
import { Button } from '../ui/index.js';
import { adsCurve, priceAdsPlan, roundSpend, spendZone } from '../../engine/ads.js';
import { inr, inrSigned, num, numSigned } from '../../lib/format.js';
import { roundViews, roundClicks } from '../../engine/funnel.js';

const r50 = (n) => Math.round(n / 50) * 50 + 0;

/**
 * Price Coach step 5 — your ads. The same model as the Ads Planner, at the price this product is set to (or the
 * suggestion). Saving a budget makes Price Coach count it instead of the category's ₹ per order average, so the
 * no-loss price, orders and total profit on every screen include the ads.
 */
export function AdsStep({ coach, product, price, t, onSave, onClear, onUsePriceAndAds }) {
  const c = coach, p = product;
  const curve = useMemo(() => (price != null ? adsCurve({ product: p, coach: c, price }) : null), [p, c, price]);
  const plan = useMemo(() => priceAdsPlan({ product: p, coach: c }), [p, c]);
  const saved = p.adsBudget > 0 ? p.adsBudget : null;

  if (!curve) return <p className="muted">{t('as.noPrice')}</p>;
  if (curve.belowFloor) return <div className="banner tone-red" role="alert"><ShieldAlert size={16} aria-hidden /><span>{t('ad.belowFloor', { price: inr(price), floor: inr(curve.floorNoAds) })}</span></div>;

  const best = roundSpend(curve.bestSpend);
  const atBest = curve.at(best);
  const mine = saved != null ? curve.at(saved) : null;
  const zone = saved != null ? spendZone(curve, saved) : null;
  const combo = plan.bestWithAds;
  const showCombo = combo && combo.price !== price && combo.withAds.totalProfit > (mine ?? atBest).totalProfit + 50;

  return (
    <div className="as" data-testid="ads-step">
      {!curve.pays ? (
        <div className="banner tone-amber" role="alert"><AlertTriangle size={16} aria-hidden /><span>{t('ad.noPay', { price: inr(price), back: curve.r0.toFixed(2) })}</span></div>
      ) : (
        <div className="banner big tone-teal" data-testid="ads-step-sweet"><Megaphone size={18} aria-hidden />
          <span>{t('as.sweet', { price: inr(price), lo: inr(r50(curve.sweet.lo)), hi: inr(r50(curve.sweet.hi)), best: inr(best), orders: numSigned(Math.round(atBest.adOrders)), profit: inrSigned(r50(atBest.gain)) })}</span></div>
      )}

      {saved != null ? (
        <div className="as-saved" data-testid="ads-step-saved">
          <div className="row between wrap">
            <div><span className="mv-l">{t('as.yours')}</span>
              <div className="row" style={{ gap: 8 }}><b className="big-num num">{inr(saved)}</b><span className="muted small">{t('ad.perMonth')}</span>
                <span className={`badge tone-${zone === 'sweet' ? 'green' : zone === 'loss' ? 'red' : 'amber'}`}>{t(`ad.z.${zone}`)}</span></div></div>
            <div className="row wrap">
              <Button size="sm" variant="secondary" to="/ads">{t('as.change')}</Button>
              <Button size="sm" variant="ghost" icon={X} onClick={onClear} data-testid="ads-step-clear">{t('as.clear')}</Button>
            </div>
          </div>
          <div className="mv-grid" style={{ marginTop: 10 }}>
            {[['fn.views', curve.none.views, mine.views, num], ['fn.clicks', curve.none.clicks, mine.clicks, num], ['fn.orders', curve.none.orders, mine.orders, num], ['fn.total', curve.none.totalProfit, mine.totalProfit, inr]].map(([k, a, b, f]) => (
              <div key={k} className="mv-cell"><span className="mv-l">{t(k)}</span>
                <span className="mv-v"><span className="mv-from">{f(k === 'fn.total' ? r50(a) : k === 'fn.views' ? roundViews(a) : k === 'fn.clicks' ? roundClicks(a) : Math.round(a))}</span><span className="mv-arrow">→</span><b>{f(k === 'fn.total' ? r50(b) : k === 'fn.views' ? roundViews(b) : k === 'fn.clicks' ? roundClicks(b) : Math.round(b))}</b></span></div>
            ))}
          </div>
          <p className="small" style={{ marginTop: 8 }}>{t('as.counted', { per: inr(Math.round(mine.adCostPerOrder)), avg: inr(c.cat.ads), floor: inr(c.now.floor) })}</p>
          {zone !== 'sweet' && curve.pays && <p className="small amber" style={{ marginTop: 4 }}>{t('as.offSweet', { lo: inr(r50(curve.sweet.lo)), hi: inr(r50(curve.sweet.hi)) })}</p>}
        </div>
      ) : (
        <div className="as-saved" data-testid="ads-step-none">
          <p className="small">{t('as.usingAvg', { avg: inr(c.cat.ads) })}</p>
          {curve.pays && (
            <div className="row wrap" style={{ marginTop: 10 }}>
              <Button icon={Check} onClick={() => onSave(best)} data-testid="ads-step-save">{t('as.save', { amt: inr(best) })}</Button>
              <Button variant="secondary" to="/ads">{t('as.open')}<ArrowRight size={14} aria-hidden /></Button>
            </div>
          )}
        </div>
      )}

      {showCombo && (
        <div className="as-combo" data-testid="ads-step-combo">
          <Sparkles size={18} aria-hidden />
          <div className="grow"><b>{t('as.combo', { price: inr(combo.price), amt: inr(combo.spend), profit: inr(r50(combo.withAds.totalProfit)) })}</b>
            <p className="tiny muted">{t('as.comboSub', { price: inr(price), profit: inr(r50((mine ?? atBest).totalProfit)) })}</p></div>
          <Button size="sm" onClick={() => onUsePriceAndAds(combo.price, combo.spend)} data-testid="ads-step-combo-use">{t('as.comboUse', { price: inr(combo.price), amt: inr(combo.spend) })}</Button>
        </div>
      )}
    </div>
  );
}
