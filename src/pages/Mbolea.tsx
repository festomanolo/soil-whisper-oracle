import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, BadgeCheck, CalendarDays, CloudRain, FlaskConical, Info, Lightbulb, Minus, Plus,
  Receipt, ShieldCheck, Sprout, Tractor, TrendingUp,
} from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/UI/tabs';
import { Switch } from '../components/UI/switch';
import {
  Meter, Panel, PanelTitle, RegionPicker, Segmented, SoilSourcePicker, ShareBar, levelTone, useSoilInput,
} from '../components/Mbolea/shared';
import {
  CROP_BY_ID, FERTILIZERS, FERTILIZER_PRICE_SOURCE, MARKET_PRICES, TZ_CROPS,
  type CropId, type FertilizerId, type TzRegion,
} from '../data/tz';
import { useMboleaSettings } from '../services/mbolea/settings';
import { rankCrops, type CropSuitability } from '../services/mbolea/suitability';
import { detectSeasons, cycleMonths } from '../services/mbolea/seasons';
import { buildPrescription, defaultCropPrice, GRAMS_PER_CAP, type Prescription } from '../services/mbolea/prescription';
import { textureFromClay, type Texture } from '../services/mbolea/soil';
import {
  deliverPdf, openSms, openWhatsApp, pdfName, prescriptionPdf, prescriptionSms, prescriptionText, shareText,
} from '../services/exportService';
import { useNotification } from '../hooks/use-notification';
import { useLanguage } from '../context/LanguageContext';
import { fmt, num, tsh, useMboleaT } from '../i18n/mbolea';

const CROP_KEY = 'mbolea.crop';

// ------------------------------------------------------------ Plan tab ----

function AreaStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const m = useMboleaT();
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const set = (v: number) => onChange(Math.max(0.25, Math.min(500, Math.round(v * 4) / 4)));
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="-" onClick={() => set(value - (value > 2 ? 1 : 0.5))}
        className="w-11 h-11 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center active:scale-95">
        <Minus className="w-4 h-4" />
      </button>
      <div className="flex-1 flex items-baseline justify-center gap-1.5 bg-white dark:bg-background border border-border rounded-2xl h-11">
        <input
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value.replace(',', '.'))}
          onBlur={() => { const v = parseFloat(text); if (v > 0) set(v); else setText(String(value)); }}
          className="w-16 text-center bg-transparent text-lg font-bold focus:outline-none"
          aria-label={m.area}
        />
        <span className="text-sm text-muted-foreground">{value === 1 ? m.acre : m.acres}</span>
      </div>
      <button type="button" aria-label="+" onClick={() => set(value + (value >= 2 ? 1 : 0.5))}
        className="w-11 h-11 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center active:scale-95">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

function CropChips({ ranked, value, onChange }: { ranked: CropSuitability[]; value: CropId; onChange: (c: CropId) => void }) {
  const { lang } = useLanguage();
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
      {ranked.map((r) => {
        const active = r.crop.id === value;
        return (
          <button
            key={r.crop.id}
            type="button"
            onClick={() => onChange(r.crop.id)}
            className={`flex-shrink-0 rounded-2xl px-3 py-2 text-left border transition-all ${
              active ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-white dark:bg-background border-border'
            }`}
          >
            <div className="text-sm font-semibold whitespace-nowrap">{r.crop.name[lang]}</div>
            <div className={`text-[11px] ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{r.score}%</div>
          </button>
        );
      })}
    </div>
  );
}

function PlanLine({ index, title, product, timing, kg, bags, cost, perPlant, highlight }: {
  index: number; title: string; product: string; timing: string; kg: string; bags: string; cost: string;
  perPlant?: string | null; highlight?: boolean;
}) {
  const m = useMboleaT();
  return (
    <li className="relative pl-10">
      <span className={`absolute left-0 top-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
        highlight ? 'bg-lime-200 text-lime-900 dark:bg-lime-800 dark:text-lime-100' : 'bg-primary text-primary-foreground'
      }`}>{index}</span>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{title}</div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold leading-snug">{product}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{timing}</div>
          {perPlant && <div className="text-xs text-primary mt-0.5">{perPlant}</div>}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-lg leading-none">{bags}<span className="text-xs font-medium text-muted-foreground ml-1">{m.bags}</span></div>
          <div className="text-xs text-muted-foreground mt-1">{kg} {m.kg}</div>
          <div className="text-xs font-medium mt-0.5">{cost}</div>
        </div>
      </div>
    </li>
  );
}

function PlanResult({ p, suitability, useSubsidy, onToggleSubsidy }: {
  p: Prescription; suitability: number; useSubsidy: boolean; onToggleSubsidy: (v: boolean) => void;
}) {
  const m = useMboleaT();
  const { lang } = useLanguage();
  const { showNotification } = useNotification();
  const crop = p.crop.name[lang];
  const vcr = p.economics?.vcr ?? 0;

  const timing = (stage: string) =>
    stage === 'basal' ? m.basalWhen : p.crop.perennial ? m.topdressAtRains : fmt(m.topdressWhen, { w: p.crop.topDressWeeks });

  let step = 0;
  const title = `${m.appName} – ${crop}`;

  return (
    <div className="space-y-4">
      {/* Cost hero */}
      <section className="rounded-[28px] p-5 text-white bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 shadow-lg shadow-green-900/20">
        <div className="text-sm text-white/80">{m.yourPlan}</div>
        <div className="text-xs text-white/70 mt-0.5">
          {fmt(m.planFor, { crop, area: num(p.areaAcres, 2), unit: m.acres, region: p.region.name })}
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-xs text-white/70">{m.totalCost}</div>
            <div className="text-3xl font-bold tracking-tight">{tsh(p.totalCost)}</div>
          </div>
          {p.economics && suitability >= 35 && (
            <div className="text-right">
              <div className="text-xs text-white/70">{m.vcrLabel}</div>
              <div className="text-2xl font-bold">TSh {num(vcr, 1)}</div>
            </div>
          )}
        </div>
        <label className="mt-4 flex items-center justify-between bg-white/10 rounded-2xl px-3 py-2">
          <span className="text-sm">{useSubsidy ? m.subsidised : m.marketPrices}</span>
          <Switch checked={useSubsidy} onCheckedChange={onToggleSubsidy} aria-label={m.useSubsidy} />
        </label>
      </section>

      {suitability < 35 && (
        <Panel className="border-lime-300 dark:border-lime-800 bg-lime-50/90 dark:bg-lime-950/40">
          <div className="flex gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 text-lime-700 dark:text-lime-300 flex-shrink-0 mt-0.5" />
            <p>{fmt(m.poorFit, { crop, region: p.region.name, score: suitability })}</p>
          </div>
        </Panel>
      )}

      {p.lime && (
        <Panel className="border-lime-300 dark:border-lime-800 bg-lime-50/90 dark:bg-lime-950/40">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-lime-700 dark:text-lime-300 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold">{m.limeTitle}</div>
              <p className="mt-1 text-muted-foreground">
                {fmt(m.limeBody, { ph: p.soil.ph.toFixed(1), target: p.lime.targetPh.toFixed(1), t: num(p.lime.tPerHa, 1) })}
              </p>
              {p.lime.split && <p className="mt-1 text-muted-foreground">{m.limeSplit}</p>}
            </div>
          </div>
        </Panel>
      )}

      <Panel>
        <PanelTitle icon={Receipt} aside={
          <span className={`text-[11px] px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
            p.official ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' : 'bg-muted text-muted-foreground'
          }`}>
            {p.official ? <BadgeCheck className="w-3 h-3" /> : <Info className="w-3 h-3" />}
            {p.official ? m.official : m.notOfficial}
          </span>
        }>
          {m.shoppingList}
        </PanelTitle>
        <p className="text-xs text-muted-foreground -mt-1 mb-4">{m.showDealer}</p>

        {p.noRecommendation && <p className="text-sm text-muted-foreground mb-3">{fmt(m.noRec, { crop })}</p>}

        <ol className="space-y-4">
          {p.lime && (
            <PlanLine
              index={++step} highlight title={m.stages.preplant}
              product={lang === 'sw' ? FERTILIZERS.lime.sw : FERTILIZERS.lime.name}
              timing={m.limeWhen} kg={num(p.lime.kgTotal)} bags={num(p.lime.bags, 1)} cost={tsh(p.lime.cost)}
            />
          )}
          {p.lines.map((l) => {
            const f = FERTILIZERS[l.product];
            return (
              <PlanLine
                key={`${l.product}-${l.stage}`}
                index={++step}
                title={m.stages[l.stage]}
                product={lang === 'sw' ? f.sw : f.name}
                timing={timing(l.stage)}
                kg={num(l.kgTotal, 1)} bags={num(l.bags, 1)} cost={tsh(l.cost)}
                perPlant={l.gramsPerPlant ? fmt(m.perPlant, { g: num(l.gramsPerPlant, 1), caps: num(l.gramsPerPlant / GRAMS_PER_CAP, 1) }) : null}
              />
            );
          })}
        </ol>

        {p.soil.ph < 5.5 && p.lines.length > 0 && (
          <p className="text-xs text-muted-foreground mt-4 bg-secondary/60 rounded-xl p-2.5">{m.acidChoice}</p>
        )}

        {p.crop.nutrients && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <div className="text-xs text-muted-foreground mb-2">{m.nutrients}</div>
            <div className="grid grid-cols-4 text-sm gap-y-1">
              <span />
              <span className="text-center font-medium">N</span>
              <span className="text-center font-medium">P₂O₅</span>
              <span className="text-center font-medium">K₂O</span>
              <span className="text-muted-foreground">{m.target}</span>
              <span className="text-center">{p.target.n}</span>
              <span className="text-center">{p.target.p2o5}</span>
              <span className="text-center">{p.target.k2o}</span>
              <span className="text-muted-foreground">{m.supplied}</span>
              <span className="text-center font-semibold text-primary">{p.supplied.n}</span>
              <span className="text-center font-semibold text-primary">{p.supplied.p2o5}</span>
              <span className="text-center font-semibold text-primary">{p.supplied.k2o}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-2">{m.source}: {p.crop.nutrients.source}</div>
          </div>
        )}
      </Panel>

      {p.economics && suitability >= 35 && (
        <Panel>
          <PanelTitle icon={TrendingUp}>{m.expectedReturn}</PanelTitle>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/60 rounded-2xl p-3">
              <div className="text-xs text-muted-foreground">{m.extraHarvest}</div>
              <div className="text-lg font-bold">~{num(p.economics.extraYieldKg)} {m.kg}</div>
            </div>
            <div className="bg-secondary/60 rounded-2xl p-3">
              <div className="text-xs text-muted-foreground">{m.extraIncome}</div>
              <div className="text-lg font-bold">~{tsh(p.economics.extraIncome)}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              vcr >= 2 ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                : vcr >= 1 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                  : 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200'
            }`}>
              {vcr >= 2 ? m.vcrGood : vcr >= 1 ? m.vcrOk : m.vcrWeak}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">{fmt(m.estimateNote, { price: num(p.economics.pricePerKg) })}</p>
        </Panel>
      )}

      <Panel>
        <PanelTitle icon={Lightbulb}>{m.tips}</PanelTitle>
        <ul className="space-y-2 text-sm">
          {p.crop.tips[lang].map((tip) => (
            <li key={tip} className="flex gap-2"><Sprout className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{tip}</li>
          ))}
          <li className="flex gap-2 font-medium"><ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{m.verifyInputs}</li>
        </ul>
      </Panel>

      <ShareBar
        onWhatsApp={() => openWhatsApp(prescriptionText(p, m, lang))}
        onSms={() => openSms(prescriptionSms(p, m, lang))}
        onShare={async () => {
          const r = await shareText(title, prescriptionText(p, m, lang));
          if (r === 'copied') showNotification(m.copied, 'success');
        }}
        onPdf={async () => {
          try {
            await deliverPdf(prescriptionPdf(p, m, lang), pdfName('mbolea-sahihi', p.crop.id, p.region.id), title);
            showNotification(m.pdfReady, 'success');
          } catch (e) {
            console.error('PDF export failed', e);
            showNotification(m.exportFailed, 'error');
          }
        }}
      />
    </div>
  );
}

function PlanTab({ region, ranked, cropId, setCropId, soilState }: {
  region: TzRegion; ranked: CropSuitability[]; cropId: CropId; setCropId: (c: CropId) => void;
  soilState: ReturnType<typeof useSoilInput>;
}) {
  const m = useMboleaT();
  const { settings, update, prices } = useMboleaSettings();
  const texture: Texture = settings.texture ?? textureFromClay(soilState.soil.clayPct ?? region.soil?.clayPct);
  const suit = ranked.find((r) => r.crop.id === cropId);

  const prescription = useMemo(() => buildPrescription({
    crop: CROP_BY_ID[cropId], region, soil: soilState.soil, areaAcres: settings.areaAcres,
    texture, prices, suitability: suit?.score ?? 50,
  }), [cropId, region, soilState.soil, settings.areaAcres, texture, prices, suit?.score]);

  const r = prescription.reading;

  return (
    <div className="space-y-4">
      <Panel>
        <PanelTitle icon={Tractor}>{m.farm}</PanelTitle>
        <div className="space-y-3">
          <RegionPicker />
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">{m.area}</div>
            <AreaStepper value={settings.areaAcres} onChange={(v) => update({ areaAcres: v })} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">{m.pickCrop}</div>
            <CropChips ranked={ranked} value={cropId} onChange={setCropId} />
          </div>
          <label className="flex items-center justify-between gap-3 bg-muted/50 rounded-2xl px-3 py-2.5">
            <div>
              <div className="text-sm font-medium">{m.irrigated}</div>
              <div className="text-[11px] text-muted-foreground">{m.irrigatedHint}</div>
            </div>
            <Switch checked={settings.irrigated} onCheckedChange={(v) => update({ irrigated: v })} />
          </label>
        </div>
      </Panel>

      <Panel>
        <PanelTitle icon={FlaskConical}>{m.soilData}</PanelTitle>
        <SoilSourcePicker state={soilState} />
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelTone(r.ph.value < 5.5 ? 'low' : 'medium')}`}>
            pH {r.ph.value.toFixed(1)} · {m.phClasses[r.ph.class]}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelTone(r.n)}`}>N · {m.levels[r.n]}</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelTone(r.p)}`}>P · {m.levels[r.p]}</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelTone(r.k)}`}>K · {m.levels[r.k]}</span>
        </div>
        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-1.5">{m.texture}</div>
          <Segmented
            size="sm"
            value={texture}
            onChange={(v) => update({ texture: v as Texture })}
            options={[
              { value: 'sandy', label: m.textures.sandy },
              { value: 'loam', label: m.textures.loam },
              { value: 'clay', label: m.textures.clay },
            ]}
          />
        </div>
      </Panel>

      <PlanResult p={prescription} suitability={suit?.score ?? 50} useSubsidy={settings.useSubsidy} onToggleSubsidy={(v) => update({ useSubsidy: v })} />
    </div>
  );
}

// -------------------------------------------------------- Calendar tab ----

function RainChart({ region }: { region: TzRegion }) {
  const m = useMboleaT();
  const seasons = detectSeasons(region);
  const max = Math.max(...region.rainfallMm, 1);
  const seasonOf = (month: number) =>
    seasons.find((s) => cycleMonths(s.startMonth, s.months * 30).includes(month));
  const now = new Date().getMonth();
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-2">{m.monthlyRain}</div>
      <div className="flex items-end gap-1 h-32" role="img" aria-label={m.monthlyRain}>
        {region.rainfallMm.map((mm, i) => {
          const s = seasonOf(i);
          const isStart = seasons.some((x) => x.startMonth === i);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
              <span className="text-[9px] text-muted-foreground mb-0.5">{mm}</span>
              <div
                className={`w-full rounded-t-md transition-all ${
                  s ? (s.name === 'vuli' ? 'bg-emerald-400' : 'bg-green-600') : 'bg-muted'
                } ${isStart ? 'ring-2 ring-offset-1 ring-lime-400 ring-offset-background' : ''}`}
                style={{ height: `${Math.max(3, (mm / max) * 100)}%` }}
                title={`${m.months[i]}: ${mm} mm`}
              />
              <span className={`text-[10px] mt-1 ${i === now ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                {m.months[i].slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-muted-foreground">
        {seasons.some((s) => s.name === 'vuli') && <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />Vuli</span>}
        {seasons.some((s) => s.name !== 'vuli') && (
          <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-green-600" />{region.regime === 'bimodal' ? 'Masika' : 'Msimu'}</span>
        )}
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm ring-2 ring-lime-400" />{m.plantingWindow}</span>
      </div>
    </div>
  );
}

function CalendarTab({ region, ranked, onPick }: { region: TzRegion; ranked: CropSuitability[]; onPick: (c: CropId) => void }) {
  const m = useMboleaT();
  const { lang } = useLanguage();
  const seasons = detectSeasons(region);

  const statusText = (r: CropSuitability) =>
    r.status === 'plant_now' ? m.status.plant_now
      : r.status === 'prepare' ? fmt(m.status.prepare, { n: r.monthsAway })
        : fmt(m.status.off_season, { month: r.plantMonth !== null ? m.months[r.plantMonth] : '—' });

  return (
    <div className="space-y-4">
      <Panel>
        <PanelTitle icon={CloudRain} aside={<span className="text-[11px] text-muted-foreground">{m.regimes[region.regime]}</span>}>
          {fmt(m.seasonsIn, { region: region.name })}
        </PanelTitle>
        <RegionPicker />
        <div className="mt-4"><RainChart region={region} /></div>
        <p className="text-[11px] text-muted-foreground mt-3">{m.climateSource}</p>
      </Panel>

      {seasons.map((s) => {
        const crops = ranked.filter((r) => r.season?.name === s.name && !r.crop.perennial && r.score >= 40).slice(0, 6);
        return (
          <Panel key={`${s.name}-${s.startMonth}`}>
            <PanelTitle icon={CalendarDays} aside={
              <span className="text-[11px] text-muted-foreground">{fmt(m.seasonRain, { mm: s.rainMm, n: s.months })}</span>
            }>
              {m.seasonNames[s.name]}
            </PanelTitle>
            <div className="text-sm mb-3">
              <span className="text-muted-foreground">{m.plantingWindow}: </span>
              <span className="font-semibold">{m.months[s.startMonth]} – {m.months[(s.startMonth + 1) % 12]}</span>
            </div>
            <div className="text-xs text-muted-foreground mb-2">{m.whatToPlant}</div>
            <ul className="divide-y divide-border/60">
              {crops.map((r) => (
                <li key={r.crop.id}>
                  <button type="button" onClick={() => onPick(r.crop.id)} className="w-full flex items-center gap-3 py-2.5 text-left">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{r.crop.name[lang]}</div>
                      <Meter value={r.score} className="mt-1.5" />
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold">{r.score}%</div>
                      <div className={`text-[11px] ${r.status === 'plant_now' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                        {statusText(r)}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------- Prices tab ----

function PriceInput({ value, onCommit }: { value: number; onCommit: (v: number | null) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <input
      inputMode="numeric"
      value={text}
      onChange={(e) => setText(e.target.value.replace(/[^\d]/g, ''))}
      onBlur={() => { const v = parseInt(text, 10); onCommit(v > 0 ? v : null); }}
      className="w-28 text-right bg-white dark:bg-background border border-border rounded-xl px-2.5 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
    />
  );
}

function PricesTab({ region }: { region: TzRegion }) {
  const m = useMboleaT();
  const { lang } = useLanguage();
  const { settings, update, prices } = useMboleaSettings();

  const setFert = (id: FertilizerId, v: number | null) => {
    const next = { ...settings.fertilizerPrices };
    if (v === null) delete next[id]; else next[id] = v;
    update({ fertilizerPrices: next });
  };
  const setCrop = (id: CropId, v: number | null) => {
    const next = { ...settings.cropPrices };
    if (v === null) delete next[id]; else next[id] = v;
    update({ cropPrices: next });
  };

  const cropSource = (id: CropId) => {
    const c = CROP_BY_ID[id];
    if (settings.cropPrices[id] !== undefined) return null;
    if (c.price.wfp) {
      return MARKET_PRICES.byRegion[region.id]?.[c.price.wfp] ? fmt(m.wfp, { region: region.name }) : m.wfpNational;
    }
    return m.estimate;
  };

  return (
    <div className="space-y-4">
      <Panel>
        <label className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-sm">{m.useSubsidy}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{m.subsidyNote}</div>
          </div>
          <Switch checked={settings.useSubsidy} onCheckedChange={(v) => update({ useSubsidy: v })} />
        </label>
      </Panel>

      <Panel>
        <PanelTitle icon={FlaskConical}>{m.fertPrices}</PanelTitle>
        <p className="text-xs text-muted-foreground mb-3">{m.editHint}</p>
        <ul className="divide-y divide-border/60">
          {Object.values(FERTILIZERS).map((f) => {
            const overridden = settings.fertilizerPrices[f.id] !== undefined;
            return (
              <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{lang === 'sw' ? f.sw : f.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {overridden
                      ? <button type="button" className="text-primary underline" onClick={() => setFert(f.id, null)}>{m.reset}</button>
                      : f.price.verified ? m.verified : m.estimate}
                  </div>
                </div>
                <PriceInput value={prices.fertilizer[f.id]} onCommit={(v) => setFert(f.id, v)} />
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-muted-foreground mt-3">{FERTILIZER_PRICE_SOURCE}</p>
      </Panel>

      <Panel>
        <PanelTitle icon={Sprout}>{m.cropPrices}</PanelTitle>
        <ul className="divide-y divide-border/60">
          {TZ_CROPS.map((c) => {
            const src = cropSource(c.id);
            return (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{c.name[lang]} <span className="text-muted-foreground font-normal">· {c.price.unit[lang]}</span></div>
                  <div className="text-[11px] text-muted-foreground">
                    {src ?? <button type="button" className="text-primary underline" onClick={() => setCrop(c.id, null)}>{m.reset}</button>}
                  </div>
                </div>
                <PriceInput value={prices.crop[c.id] || defaultCropPrice(c, region.id)} onCommit={(v) => setCrop(c.id, v)} />
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-muted-foreground mt-3">
          {fmt(m.priceSources, { period: `${MARKET_PRICES.periodStart.slice(0, 7)} – ${MARKET_PRICES.periodEnd.slice(0, 7)}` })}
        </p>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------- page ----

type TabId = 'plan' | 'calendar' | 'prices';

const MboleaContent = () => {
  const m = useMboleaT();
  const { region, settings } = useMboleaSettings();
  const soilState = useSoilInput(region);
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<TabId>(() => (params.get('tab') as TabId) || 'plan');

  const ranked = useMemo(
    () => rankCrops(region, soilState.soil.ph, undefined, settings.irrigated),
    [region, soilState.soil.ph, settings.irrigated],
  );

  const [cropId, setCropIdState] = useState<CropId>(() => {
    const fromUrl = params.get('crop') as CropId | null;
    if (fromUrl && CROP_BY_ID[fromUrl]) return fromUrl;
    try {
      const saved = localStorage.getItem(CROP_KEY) as CropId | null;
      if (saved && CROP_BY_ID[saved]) return saved;
    } catch { /* ignore */ }
    return 'maize';
  });

  const setCropId = (c: CropId) => {
    setCropIdState(c);
    try { localStorage.setItem(CROP_KEY, c); } catch { /* ignore */ }
  };

  // Keep the URL shareable/deep-linkable (e.g. from the Crops page).
  useEffect(() => {
    setParams({ tab, crop: cropId }, { replace: true });
  }, [tab, cropId, setParams]);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="rounded-[32px] p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/30 border border-green-200/60 dark:border-green-900/60">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{m.appName}</h1>
            <p className="text-sm text-muted-foreground">{m.tagline}</p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)}>
        <TabsList className="grid grid-cols-3 w-full h-auto p-1 rounded-2xl bg-muted/70">
          <TabsTrigger value="plan" className="rounded-xl py-2 data-[state=active]:text-primary">{m.tabs.plan}</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-xl py-2 data-[state=active]:text-primary">{m.tabs.calendar}</TabsTrigger>
          <TabsTrigger value="prices" className="rounded-xl py-2 data-[state=active]:text-primary">{m.tabs.prices}</TabsTrigger>
        </TabsList>
        <TabsContent value="plan" className="mt-4">
          <PlanTab region={region} ranked={ranked} cropId={cropId} setCropId={setCropId} soilState={soilState} />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <CalendarTab region={region} ranked={ranked} onPick={(c) => { setCropId(c); setTab('plan'); window.scrollTo({ top: 0 }); }} />
        </TabsContent>
        <TabsContent value="prices" className="mt-4">
          <PricesTab region={region} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Mbolea = () => (
  <DashboardLayout>
    <MboleaContent />
  </DashboardLayout>
);

export default Mbolea;
