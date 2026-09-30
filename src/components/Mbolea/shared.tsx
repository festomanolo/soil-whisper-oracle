// Shared building blocks for the Mbolea Sahihi tab and the Crops page.

import React, { useMemo, useState } from 'react';
import { Crosshair, Loader2, MapPin, Share2, MessageCircle, MessageSquareText, FileDown } from 'lucide-react';
import { TZ_REGIONS, type TzRegion } from '../../data/tz';
import { useSensorData } from '../../context/SensorDataContext';
import { useNotification } from '../../hooks/use-notification';
import { detectRegion, useMboleaSettings } from '../../services/mbolea/settings';
import { regionalSoil, type SoilInput, type SoilSource } from '../../services/mbolea/soil';
import { fromAnalysis, fromSensor, loadSavedAnalyses } from '../../services/mbolea/soilSources';
import { fmt, useMboleaT } from '../../i18n/mbolea';

// ----------------------------------------------------------- surfaces ----

export const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[24px] p-4 sm:p-5 border border-border/60 shadow-sm ${className}`}>
    {children}
  </section>
);

export const PanelTitle = ({ icon: Icon, children, aside }: {
  icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode; aside?: React.ReactNode;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-3">
    <h2 className="text-base font-semibold flex items-center gap-2 min-w-0">
      {Icon && <Icon className="w-4 h-4 text-primary flex-shrink-0" />}
      <span>{children}</span>
    </h2>
    {aside && <div className="flex-shrink-0">{aside}</div>}
  </div>
);

/** Pill-style segmented control. */
export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: {
  value: T; options: { value: T; label: string; disabled?: boolean }[]; onChange: (v: T) => void; size?: 'sm' | 'md';
}) {
  return (
    <div className="flex gap-1 p-1 bg-muted/70 rounded-2xl overflow-x-auto no-scrollbar">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={`flex-1 whitespace-nowrap rounded-xl font-medium transition-all duration-200 disabled:opacity-40 ${
            size === 'sm' ? 'text-xs px-2.5 py-1.5' : 'text-sm px-3 py-2'
          } ${value === o.value ? 'bg-white dark:bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Horizontal meter; tone reflects how good the value is, all in the green family. */
export const Meter = ({ value, className = '' }: { value: number; className?: string }) => {
  const pct = Math.max(0, Math.min(100, value));
  const tone = pct >= 70 ? 'bg-green-600' : pct >= 40 ? 'bg-emerald-400' : 'bg-lime-400';
  return (
    <div className={`h-2 bg-muted rounded-full overflow-hidden ${className}`}>
      <div className={`h-full rounded-full transition-all duration-700 ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

export const levelTone = (level: string) =>
  level === 'low' ? 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200'
    : level === 'high' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
      : level === 'unknown' ? 'bg-muted text-muted-foreground'
        : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';

// -------------------------------------------------------------- region ----

export function RegionPicker() {
  const m = useMboleaT();
  const { settings, update } = useMboleaSettings();
  const { showNotification } = useNotification();
  const [busy, setBusy] = useState(false);

  const locate = async () => {
    setBusy(true);
    const r = await detectRegion();
    setBusy(false);
    if (r) {
      update({ regionId: r.id });
      showNotification(`${m.region}: ${r.name}`, 'success');
    } else {
      showNotification(m.gpsFailed, 'warning');
    }
  };

  return (
    <div className="flex gap-2">
      <label className="relative flex-1 min-w-0">
        <span className="sr-only">{m.region}</span>
        <MapPin className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <select
          value={settings.regionId}
          onChange={(e) => update({ regionId: e.target.value })}
          className="w-full appearance-none bg-white dark:bg-background border border-border rounded-2xl pl-9 pr-8 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {[...TZ_REGIONS].sort((a, b) => a.name.localeCompare(b.name)).map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xs">▾</span>
      </label>
      <button
        type="button"
        onClick={locate}
        disabled={busy}
        title={m.useGps}
        aria-label={m.useGps}
        className="flex-shrink-0 w-11 h-11 rounded-2xl border border-border bg-white dark:bg-background flex items-center justify-center text-primary hover:bg-primary/5 disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- soil ----

export interface ManualSoil { ph: string; n: string; p: string; k: string }

const SOURCE_KEY = 'mbolea.soilSource';

/** Chooses where soil numbers come from and returns a normalised SoilInput. */
export function useSoilInput(region: TzRegion) {
  const m = useMboleaT();
  const { soilHealth, isConnected } = useSensorData();
  const saved = useMemo(loadSavedAnalyses, []);
  const [source, setSourceState] = useState<SoilSource>(() => {
    try {
      const s = localStorage.getItem(SOURCE_KEY) as SoilSource | null;
      if (s) return s;
    } catch { /* ignore */ }
    return saved.length ? 'saved' : 'regional';
  });
  const [savedId, setSavedId] = useState<number | undefined>(saved[0]?.id);
  const [manual, setManual] = useState<ManualSoil>({ ph: '', n: '', p: '', k: '' });

  const setSource = (s: SoilSource) => {
    setSourceState(s);
    try { localStorage.setItem(SOURCE_KEY, s); } catch { /* ignore */ }
  };

  // If the preferred source is unavailable, fall back gracefully.
  const effective: SoilSource =
    source === 'sensor' && !isConnected ? (saved.length ? 'saved' : 'regional')
      : source === 'saved' && !saved.length ? 'regional'
        : source === 'manual' && !(parseFloat(manual.ph) > 0) ? 'regional'
          : source;

  const soil: SoilInput = useMemo(() => {
    const regional = regionalSoil(region.soil, region.name) ?? { source: 'regional', label: region.name, ph: 6.0 };
    if (effective === 'sensor') return fromSensor(soilHealth, m.currentReading);
    if (effective === 'saved') {
      const a = saved.find((x) => x.id === savedId) ?? saved[0];
      return fromAnalysis(a);
    }
    if (effective === 'manual') {
      const n = (v: string) => (v.trim() === '' || Number.isNaN(parseFloat(v)) ? undefined : parseFloat(v));
      return {
        source: 'manual', label: m.sources.manual, ph: parseFloat(manual.ph),
        nitrogen: n(manual.n), phosphorus: n(manual.p), potassium: n(manual.k),
        clayPct: region.soil?.clayPct, organicCarbonGkg: region.soil?.organicCarbonGkg,
      };
    }
    return regional;
  }, [effective, soilHealth, saved, savedId, manual, region, m]);

  return { soil, source, effective, setSource, saved, savedId, setSavedId, manual, setManual, sensorAvailable: isConnected };
}

export function SoilSourcePicker({ state }: { state: ReturnType<typeof useSoilInput> }) {
  const m = useMboleaT();
  const { source, effective, setSource, saved, savedId, setSavedId, manual, setManual, sensorAvailable, soil } = state;

  const field = (key: keyof ManualSoil, label: string, placeholder: string) => (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        inputMode="decimal"
        value={manual[key]}
        placeholder={placeholder}
        onChange={(e) => setManual({ ...manual, [key]: e.target.value.replace(',', '.') })}
        className="mt-1 w-full bg-white dark:bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );

  return (
    <div className="space-y-3">
      <Segmented
        size="sm"
        value={source}
        onChange={(v) => setSource(v as SoilSource)}
        options={[
          { value: 'sensor', label: m.sources.sensor, disabled: !sensorAvailable },
          { value: 'saved', label: m.sources.saved, disabled: !saved.length },
          { value: 'manual', label: m.sources.manual },
          { value: 'regional', label: m.sources.regional },
        ]}
      />

      {source === 'saved' && saved.length > 0 && (
        <select
          value={savedId}
          onChange={(e) => setSavedId(Number(e.target.value))}
          className="w-full bg-white dark:bg-background border border-border rounded-xl px-3 py-2 text-sm"
        >
          {saved.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {new Date(a.timestamp).toLocaleDateString()} · pH {a.averageData.ph.toFixed(1)}
            </option>
          ))}
        </select>
      )}

      {source === 'manual' && (
        <div className="grid grid-cols-2 gap-2">
          {field('ph', m.ph, '5.8')}
          {field('n', `${m.nitrogen} ${m.mgkg}`, '—')}
          {field('p', `${m.phosphorus} ${m.mgkg}`, '—')}
          {field('k', `${m.potassium} ${m.mgkg}`, '—')}
        </div>
      )}

      {effective === 'regional' && (
        <p className="text-xs text-muted-foreground bg-secondary/60 rounded-xl p-2.5">
          {fmt(m.regionalNote, { region: soil.label ?? '' })}
        </p>
      )}
      {(effective === 'sensor' || effective === 'saved') && (
        <p className="text-xs text-muted-foreground">{m.probeNote}</p>
      )}
    </div>
  );
}

// -------------------------------------------------------------- export ----

export function ShareBar({ onWhatsApp, onSms, onShare, onPdf }: {
  onWhatsApp?: () => void; onSms?: () => void; onShare?: () => Promise<void>; onPdf: () => Promise<void>;
}) {
  const m = useMboleaT();
  const [busy, setBusy] = useState<string | null>(null);
  const run = (key: string, fn?: () => void | Promise<void>) => async () => {
    if (!fn || busy) return;
    setBusy(key);
    try { await fn(); } finally { setBusy(null); }
  };
  const btn = 'flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl text-xs font-medium transition-all active:scale-[0.97] disabled:opacity-60';
  const items = [
    onWhatsApp && { key: 'wa', label: m.whatsapp, icon: MessageCircle, fn: onWhatsApp },
    onSms && { key: 'sms', label: m.sms, icon: MessageSquareText, fn: onSms },
    onShare && { key: 'share', label: m.share, icon: Share2, fn: onShare },
  ].filter(Boolean) as { key: string; label: string; icon: React.ComponentType<{ className?: string }>; fn: () => void }[];

  return (
    <div className={`grid gap-2 ${items.length === 3 ? 'grid-cols-4' : items.length === 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {items.map(({ key, label, icon: Icon, fn }) => (
        <button key={key} type="button" onClick={run(key, fn)} disabled={!!busy}
          className={`${btn} bg-secondary text-secondary-foreground hover:bg-accent`}>
          {busy === key ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
          {label}
        </button>
      ))}
      <button type="button" onClick={run('pdf', onPdf)} disabled={!!busy}
        className={`${btn} bg-primary text-primary-foreground hover:bg-primary/90`}>
        {busy === 'pdf' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
        {busy === 'pdf' ? m.preparing : m.savePdf}
      </button>
    </div>
  );
}
