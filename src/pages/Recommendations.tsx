import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, CalendarDays, ChevronDown, CloudRain, FlaskConical, Info, Sprout, Star, Thermometer, X,
} from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from '../components/UI/drawer';
import { Switch } from '../components/UI/switch';
import {
  Meter, Panel, PanelTitle, RegionPicker, ShareBar, SoilSourcePicker, levelTone, useSoilInput,
} from '../components/Mbolea/shared';
import { useMboleaSettings } from '../services/mbolea/settings';
import { rankCrops, type CropSuitability, type FactorScore } from '../services/mbolea/suitability';
import { readSoil } from '../services/mbolea/soil';
import { cropReportPdf, deliverPdf, pdfName, shareText } from '../services/exportService';
import { useNotification } from '../hooks/use-notification';
import { useLanguage } from '../context/LanguageContext';
import { fmt, num, tsh, useMboleaT, type MboleaStrings } from '../i18n/mbolea';

const INITIAL_VISIBLE = 5;

const factorIcon = { temp: Thermometer, rain: CloudRain, ph: FlaskConical } as const;

function plantLabel(r: CropSuitability, m: MboleaStrings) {
  if (r.plantMonth === null) return null;
  const month = m.months[r.plantMonth];
  if (r.crop.perennial) return fmt(m.perennialPlant, { month });
  return fmt(m.plantIn, { season: r.season ? m.seasonNames[r.season.name].split(' ')[0] : '', month });
}

function statusChip(r: CropSuitability, m: MboleaStrings) {
  if (r.status === 'plant_now') {
    return <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-primary text-primary-foreground">{m.status.plant_now}</span>;
  }
  if (r.status === 'prepare') {
    return <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">{fmt(m.status.prepare, { n: r.monthsAway })}</span>;
  }
  return null;
}

function CropCard({ r, rank, onDetails, onPlan }: {
  r: CropSuitability; rank: number; onDetails: () => void; onPlan: () => void;
}) {
  const m = useMboleaT();
  const { lang } = useLanguage();
  const best = rank === 0;
  const plant = plantLabel(r, m);
  return (
    <article className={`rounded-[24px] p-4 border transition-shadow bg-white/80 dark:bg-card/80 backdrop-blur-xl ${
      best ? 'border-green-300 dark:border-green-800 shadow-md shadow-green-900/5' : 'border-border/60'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          best ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
        }`}>
          <Sprout className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold leading-tight">{r.crop.name[lang]}</h3>
            {best && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-lime-200 text-lime-900 dark:bg-lime-800 dark:text-lime-100 flex items-center gap-1">
                <Star className="w-3 h-3" />{m.bestMatch}
              </span>
            )}
            {statusChip(r, m)}
          </div>
          {plant && <div className="text-xs text-muted-foreground mt-0.5">{plant}</div>}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-primary leading-none">{r.score}%</div>
          <div className="text-[10px] text-muted-foreground mt-1">{m.suitability}</div>
        </div>
      </div>

      <Meter value={r.score} className="mt-3" />

      <div className="mt-3 grid grid-cols-3 gap-2">
        {(['temp', 'rain', 'ph'] as const).map((k) => {
          const f = r[k];
          const Icon = factorIcon[k];
          return (
            <div key={k} className={`rounded-xl px-2 py-1.5 ${r.limiting === k ? 'bg-lime-100 dark:bg-lime-900/40' : 'bg-muted/60'}`}>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Icon className="w-3 h-3" />{m.factors[k]}</div>
              <div className="text-sm font-semibold">
                {k === 'temp' ? `${f.value}°C` : k === 'rain' ? `${num(f.value)} mm` : f.value.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {r.limiting ? fmt(m.limitedBy, { factor: m.factors[r.limiting].toLowerCase() }) : m.allGood}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onDetails}
          className="py-2.5 rounded-2xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent active:scale-[0.98] transition">
          {m.details}
        </button>
        <button type="button" onClick={onPlan}
          className="py-2.5 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition flex items-center justify-center gap-1.5">
          {m.openPlan}<ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}

function FactorRow({ label, f, unit, digits = 0 }: { label: string; f: FactorScore; unit: string; digits?: number }) {
  const m = useMboleaT();
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">
          {m.yourFarm}: <b className="text-foreground">{num(f.value, digits)}{unit}</b> · {m.ideal}: {f.optimal[0]}–{f.optimal[1]}{unit}
        </span>
      </div>
      <Meter value={f.score * 100} className="mt-1.5" />
    </div>
  );
}

function CropDetails({ r, regionName, soilLabel, price, onClose, onPlan }: {
  r: CropSuitability; regionName: string; soilLabel: string; price: number; onClose: () => void; onPlan: () => void;
}) {
  const m = useMboleaT();
  const { lang } = useLanguage();
  const { showNotification } = useNotification();
  const c = r.crop;

  const summary = [
    `🌱 ${m.appName} – ${c.name[lang]} (${m.suitability} ${r.score}%)`,
    `${regionName} · ${soilLabel}`,
    plantLabel(r, m) ?? '',
    `${m.factors.temp}: ${r.temp.value}°C (${m.ideal} ${r.temp.optimal.join('–')})`,
    `${m.factors.rain}: ${r.rain.value} mm (${m.ideal} ${r.rain.optimal.join('–')})`,
    `${m.factors.ph}: ${r.ph.value.toFixed(1)} (${m.ideal} ${r.ph.optimal.join('–')})`,
    `${m.yieldLabel}: ${c.yield.typical} → ${c.yield.attainable}`,
    ...c.tips[lang].map((tip) => `• ${tip}`),
  ].filter(Boolean).join('\n');

  const stats: [string, string][] = [
    [m.plantingWindow, r.plantMonth !== null ? m.months[r.plantMonth] : '—'],
    [m.harvest, r.harvestMonth !== null ? m.months[r.harvestMonth] : '—'],
    [m.cycle, `${c.cycleDays} ${m.days}`],
    [m.spacing, c.spacing],
    [`${m.yieldLabel} · ${m.typical}`, String(c.yield.typical)],
    [`${m.yieldLabel} · ${m.attainable}`, String(c.yield.attainable)],
    [m.farmgate, `${tsh(price)}/kg`],
  ];

  return (
    <div className="px-4 pb-6 overflow-y-auto">
      <div className="flex items-start justify-between gap-3 pt-3">
        <div>
          <DrawerTitle className="text-2xl font-bold">{c.name[lang]}</DrawerTitle>
          <p className="text-sm text-muted-foreground">{regionName} · {plantLabel(r, m)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary leading-none">{r.score}%</div>
            <div className="text-[10px] text-muted-foreground">{m.suitability}</div>
          </div>
          <DrawerClose asChild>
            <button type="button" aria-label={m.close} onClick={onClose} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </DrawerClose>
        </div>
      </div>

      <section className="mt-4 space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2"><Info className="w-4 h-4 text-primary" />{m.whyScore}</h4>
        <FactorRow label={m.factors.temp} f={r.temp} unit="°C" digits={1} />
        <FactorRow label={m.factors.rain} f={r.rain} unit=" mm" />
        <FactorRow label={m.factors.ph} f={r.ph} unit="" digits={1} />
      </section>

      <section className="mt-5 grid grid-cols-2 gap-2">
        {stats.map(([k, v]) => (
          <div key={k} className="bg-muted/60 rounded-2xl p-3">
            <div className="text-[11px] text-muted-foreground">{k}</div>
            <div className="text-sm font-semibold">{v}</div>
          </div>
        ))}
      </section>

      <section className="mt-5">
        <h4 className="text-sm font-semibold mb-2">{m.tips}</h4>
        <ul className="space-y-2 text-sm">
          {c.tips[lang].map((tip) => (
            <li key={tip} className="flex gap-2"><Sprout className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />{tip}</li>
          ))}
        </ul>
      </section>

      <button type="button" onClick={onPlan}
        className="mt-5 w-full py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground flex items-center justify-center gap-2">
        <FlaskConical className="w-4 h-4" />{m.openPlan}
      </button>

      <div className="mt-3">
        <ShareBar
          onShare={async () => {
            const res = await shareText(`${m.appName} – ${c.name[lang]}`, summary);
            if (res === 'copied') showNotification(m.copied, 'success');
          }}
          onPdf={async () => {
            try {
              await deliverPdf(
                cropReportPdf(r, regionName, soilLabel, m, lang, price),
                pdfName('mbolea-sahihi', c.id, regionName, 'report'),
                `${m.appName} – ${c.name[lang]}`,
              );
              showNotification(m.pdfReady, 'success');
            } catch (e) {
              console.error('PDF export failed', e);
              showNotification(m.exportFailed, 'error');
            }
          }}
        />
      </div>
    </div>
  );
}

const RecommendationsContent = () => {
  const m = useMboleaT();
  const navigate = useNavigate();
  const { region, prices, settings, update } = useMboleaSettings();
  const soilState = useSoilInput(region);
  const { soil } = soilState;
  const [showAll, setShowAll] = useState(false);
  const [showSoil, setShowSoil] = useState(false);
  const [details, setDetails] = useState<CropSuitability | null>(null);

  const ranked = useMemo(
    () => rankCrops(region, soil.ph, undefined, settings.irrigated),
    [region, soil.ph, settings.irrigated],
  );
  const reading = readSoil(soil);
  const visible = showAll ? ranked : ranked.slice(0, INITIAL_VISIBLE);
  const soilLabel = soil.source === 'regional' ? fmt(m.regionalBaseline, { region: region.name }) : soil.label ?? m.sources[soil.source];

  const openPlan = (id: string) => navigate(`/mbolea?tab=plan&crop=${id}`);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="rounded-[32px] p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/30 border border-green-200/60 dark:border-green-900/60">
        <h1 className="text-2xl font-bold tracking-tight">{m.cropsTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{fmt(m.cropsSubtitle, { region: region.name })}</p>
        <div className="mt-4"><RegionPicker /></div>
        <label className="mt-3 flex items-center justify-between gap-3 bg-white/80 dark:bg-card/80 rounded-2xl px-3 py-2.5 border border-border/60">
          <div>
            <div className="text-sm font-medium">{m.irrigated}</div>
            <div className="text-[11px] text-muted-foreground">{m.irrigatedHint}</div>
          </div>
          <Switch checked={settings.irrigated} onCheckedChange={(v) => update({ irrigated: v })} />
        </label>

        <button type="button" onClick={() => setShowSoil((v) => !v)}
          className="mt-3 w-full flex items-center justify-between gap-2 bg-white/80 dark:bg-card/80 rounded-2xl px-3 py-2.5 border border-border/60 text-left">
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground">{m.soilSample}</div>
            <div className="text-sm font-medium truncate">{soilLabel}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelTone(soil.ph < 5.5 ? 'low' : 'medium')}`}>pH {soil.ph.toFixed(1)}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showSoil ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {showSoil && (
          <div className="mt-3 bg-white/80 dark:bg-card/80 rounded-2xl p-3 border border-border/60">
            <SoilSourcePicker state={soilState} />
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelTone(soil.ph < 5.5 ? 'low' : 'medium')}`}>
                {m.phClasses[reading.ph.class]}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelTone(reading.n)}`}>N · {m.levels[reading.n]}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelTone(reading.p)}`}>P · {m.levels[reading.p]}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelTone(reading.k)}`}>K · {m.levels[reading.k]}</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {visible.map((r, i) => (
          <CropCard key={r.crop.id} r={r} rank={i} onDetails={() => setDetails(r)} onPlan={() => openPlan(r.crop.id)} />
        ))}
      </div>

      {ranked.length > INITIAL_VISIBLE && (
        <button type="button" onClick={() => setShowAll((v) => !v)}
          className="w-full py-3 rounded-2xl text-sm font-medium border border-border bg-white/80 dark:bg-card/80 text-primary">
          {showAll ? m.showLess : fmt(m.showAll, { n: ranked.length })}
        </button>
      )}

      <Panel>
        <PanelTitle icon={CalendarDays}>{fmt(m.seasonsIn, { region: region.name })}</PanelTitle>
        <p className="text-sm text-muted-foreground">{m.regimes[region.regime]} · {m.climateSource}</p>
        <button type="button" onClick={() => navigate('/mbolea?tab=calendar')}
          className="mt-3 w-full py-2.5 rounded-2xl text-sm font-semibold bg-secondary text-secondary-foreground flex items-center justify-center gap-1.5">
          {m.tabs.calendar}<ArrowRight className="w-4 h-4" />
        </button>
      </Panel>

      <Drawer open={!!details} onOpenChange={(o) => !o && setDetails(null)} shouldScaleBackground={false}>
        <DrawerContent className="max-h-[92vh] rounded-t-[28px]">
          {details && (
            <CropDetails
              r={details}
              regionName={region.name}
              soilLabel={soilLabel}
              price={prices.crop[details.crop.id]}
              onClose={() => setDetails(null)}
              onPlan={() => { setDetails(null); openPlan(details.crop.id); }}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

const Recommendations = () => (
  <DashboardLayout>
    <RecommendationsContent />
  </DashboardLayout>
);

export default Recommendations;
