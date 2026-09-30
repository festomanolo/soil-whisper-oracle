// Export & sharing for Mbolea Sahihi reports.
//
// Android's WebView has no Web Share API and ignores <a download>, so on the
// native app we write the PDF to the cache directory and hand it to the system
// share sheet (WhatsApp, Gmail, Drive, Bluetooth…). In a browser we use the Web
// Share API when it can share files, otherwise a normal download.

import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FERTILIZERS } from '../data/tz';
import type { Prescription } from './mbolea/prescription';
import type { CropSuitability } from './mbolea/suitability';
import { GRAMS_PER_CAP } from './mbolea/prescription';
import { fmt, num, tsh, type MboleaStrings } from '../i18n/mbolea';

type Lang = 'en' | 'sw';

// ---------------------------------------------------------------- text ----

function stageTiming(p: Prescription, stage: 'basal' | 'topdress', t: MboleaStrings) {
  if (stage === 'basal') return t.basalWhen;
  return p.crop.perennial ? t.topdressAtRains : fmt(t.topdressWhen, { w: p.crop.topDressWeeks });
}

/** Full plan as plain text – for WhatsApp and the share sheet. */
export function prescriptionText(p: Prescription, t: MboleaStrings, lang: Lang): string {
  const crop = p.crop.name[lang];
  const out: string[] = [];
  out.push(`🌱 *${t.appName}* – ${t.yourPlan}`);
  out.push(fmt(t.planFor, { crop, area: num(p.areaAcres, 1), unit: t.acres, region: p.region.name }));
  out.push(`${t.ph} ${p.soil.ph.toFixed(1)} (${t.phClasses[p.reading.ph.class]})`);
  out.push('');
  if (p.lime) {
    out.push(`1️⃣ ${t.stages.preplant}: *${t.lime}* – ${num(p.lime.kgTotal)} ${t.kg} (${num(p.lime.bags, 1)} ${t.bags}) – ${tsh(p.lime.cost)}`);
    out.push(`   ${t.limeWhen}`);
  }
  if (p.noRecommendation) out.push(fmt(t.noRec, { crop }));
  p.lines.forEach((l) => {
    const f = FERTILIZERS[l.product];
    out.push(`• ${t.stages[l.stage]}: *${lang === 'sw' ? f.sw : f.name}* – ${num(l.kgTotal, 1)} ${t.kg} (${num(l.bags, 1)} ${t.bags}) – ${tsh(l.cost)}`);
    out.push(`   ${stageTiming(p, l.stage as 'basal' | 'topdress', t)}`);
  });
  out.push('');
  out.push(`💰 ${t.totalCost}: *${tsh(p.totalCost)}*`);
  if (p.economics) {
    out.push(`📈 ${t.extraHarvest}: ~${num(p.economics.extraYieldKg)} ${t.kg} · ${t.extraIncome}: ~${tsh(p.economics.extraIncome)}`);
    out.push(`   ${t.vcrLabel} TSh ${num(p.economics.vcr, 1)}`);
  }
  out.push('');
  out.push(`✅ ${t.verifyInputs}`);
  // Monospace keeps WhatsApp from reading the USSD code's asterisks as *bold*.
  return out.join('\n').replace(/\*148\*52#/g, '```*148*52#```');
}

/** Short version that fits in two SMS messages. */
export function prescriptionSms(p: Prescription, t: MboleaStrings, lang: Lang): string {
  const parts = [
    `${t.appName}: ${p.crop.name[lang]} ${num(p.areaAcres, 1)} ${t.acres}, ${p.region.name}.`,
  ];
  if (p.lime) parts.push(`${t.lime} ${num(p.lime.bags, 1)} ${t.bags}.`);
  p.lines.forEach((l) => parts.push(`${FERTILIZERS[l.product].name.split(' ')[0]} ${num(l.bags, 1)} ${t.bags}.`));
  parts.push(`${t.totalCost} ${tsh(p.totalCost)}.`);
  return parts.join(' ');
}

export function openWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

export function openSms(text: string) {
  window.location.href = `sms:?body=${encodeURIComponent(text)}`;
}

/** System share sheet for text; falls back to the clipboard. Returns 'shared' | 'copied'. */
export async function shareText(title: string, text: string): Promise<'shared' | 'copied'> {
  if (Capacitor.isNativePlatform()) {
    await Share.share({ title, text, dialogTitle: title });
    return 'shared';
  }
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'shared';
    }
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}

// ----------------------------------------------------------------- PDF ----

const GREEN: [number, number, number] = [21, 128, 61];
const GREEN_LIGHT: [number, number, number] = [240, 253, 244];
const INK: [number, number, number] = [23, 32, 26];
const MUTED: [number, number, number] = [95, 110, 100];

// The built-in PDF fonts are WinAnsi – swap out glyphs they cannot draw.
const safe = (s: string) => s
  .replace(/≈|~/g, '~').replace(/≥/g, '>=').replace(/≤/g, '<=')
  .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{20E3}]/gu, '');

class PdfWriter {
  doc = new jsPDF({ unit: 'mm', format: 'a4' });
  y = 0;
  readonly left = 16;
  readonly width = 178;

  ensure(h: number) {
    if (this.y + h > 280) {
      this.doc.addPage();
      this.y = 18;
    }
  }

  header(title: string, subtitle: string, date: string) {
    const d = this.doc;
    d.setFillColor(...GREEN);
    d.rect(0, 0, 210, 30, 'F');
    d.setTextColor(255, 255, 255);
    d.setFont('helvetica', 'bold').setFontSize(18).text('Mbolea Sahihi', this.left, 13);
    d.setFont('helvetica', 'normal').setFontSize(10).text(safe(title), this.left, 20);
    d.setFontSize(9).text(safe(subtitle), this.left, 25.5);
    d.text(date, 210 - this.left, 13, { align: 'right' });
    this.y = 40;
  }

  section(title: string) {
    this.ensure(14);
    this.y += 2;
    this.doc.setTextColor(...GREEN).setFont('helvetica', 'bold').setFontSize(12).text(safe(title), this.left, this.y);
    this.doc.setDrawColor(...GREEN).setLineWidth(0.3).line(this.left, this.y + 1.5, this.left + this.width, this.y + 1.5);
    this.y += 8;
  }

  para(text: string, opts: { size?: number; color?: [number, number, number]; bold?: boolean } = {}) {
    const d = this.doc;
    d.setFont('helvetica', opts.bold ? 'bold' : 'normal').setFontSize(opts.size ?? 10).setTextColor(...(opts.color ?? INK));
    const lines = d.splitTextToSize(safe(text), this.width) as string[];
    const h = lines.length * ((opts.size ?? 10) * 0.45);
    this.ensure(h);
    d.text(lines, this.left, this.y);
    this.y += h + 2;
  }

  /** Simple table; the first column wraps, the rest are right-aligned. */
  table(head: string[], rows: string[][], widths: number[]) {
    const d = this.doc;
    const x0 = this.left;
    const rowH = (cells: string[]) => {
      d.setFontSize(9);
      const lines = d.splitTextToSize(safe(cells[0]), widths[0] - 3) as string[];
      return Math.max(7, lines.length * 4.2 + 3);
    };
    this.ensure(9);
    d.setFillColor(...GREEN);
    d.rect(x0, this.y - 5, this.width, 7.5, 'F');
    d.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(9);
    let x = x0;
    head.forEach((h, i) => {
      if (i === 0) d.text(safe(h), x + 2, this.y);
      else d.text(safe(h), x + widths[i] - 2, this.y, { align: 'right' });
      x += widths[i];
    });
    this.y += 5;
    rows.forEach((r, ri) => {
      const h = rowH(r);
      this.ensure(h);
      if (ri % 2 === 0) {
        d.setFillColor(...GREEN_LIGHT);
        d.rect(x0, this.y - 2.5, this.width, h, 'F');
      }
      d.setTextColor(...INK).setFont('helvetica', 'normal').setFontSize(9);
      let cx = x0;
      r.forEach((c, i) => {
        if (i === 0) d.text(d.splitTextToSize(safe(c), widths[0] - 3), cx + 2, this.y + 1.8);
        else d.text(safe(c), cx + widths[i] - 2, this.y + 1.8, { align: 'right' });
        cx += widths[i];
      });
      this.y += h;
    });
    this.y += 4;
  }

  keyValues(pairs: [string, string][]) {
    const d = this.doc;
    const colW = this.width / 2;
    pairs.forEach(([k, v], i) => {
      const col = i % 2;
      if (col === 0) this.ensure(10);
      const x = this.left + col * colW;
      d.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED).text(safe(k), x, this.y);
      d.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK).text(safe(v), x, this.y + 5);
      if (col === 1 || i === pairs.length - 1) this.y += 11;
    });
  }

  footer(lines: string[]) {
    const d = this.doc;
    const pages = d.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      d.setPage(i);
      d.setFont('helvetica', 'normal').setFontSize(7).setTextColor(...MUTED);
      lines.forEach((l, li) => d.text(safe(l), this.left, 287 + li * 3.2 - (lines.length - 1) * 3.2));
      d.text(`${i}/${pages}`, 210 - this.left, 290, { align: 'right' });
    }
  }
}

const SOURCES_FOOTER = [
  'Fertilizer rates: Ministry of Agriculture R&D RAR (via IFDC/AFO), TARI. Crop limits: FAO ECOCROP. Climate: NASA POWER.',
  'Soil baseline: ISRIC SoilGrids. Prices: TFRA indicative 2024/25, WFP VAM. Estimates only - confirm with your extension officer.',
];

export function prescriptionPdf(p: Prescription, t: MboleaStrings, lang: Lang): jsPDF {
  const w = new PdfWriter();
  const crop = p.crop.name[lang];
  const date = new Date().toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-GB');
  w.header(t.yourPlan, fmt(t.planFor, { crop, area: num(p.areaAcres, 1), unit: t.acres, region: p.region.name }), date);

  w.section(t.soilSummary);
  w.keyValues([
    [t.ph, `${p.soil.ph.toFixed(1)} - ${t.phClasses[p.reading.ph.class]}`],
    [t.nitrogen, t.levels[p.reading.n]],
    [t.phosphorus, t.levels[p.reading.p]],
    [t.potassium, t.levels[p.reading.k]],
  ]);
  w.para(`${t.soilData}: ${t.sources[p.soil.source]}${p.soil.label ? ` - ${p.soil.label}` : ''}`, { size: 8, color: MUTED });

  w.section(t.yourPlan);
  if (p.noRecommendation) w.para(fmt(t.noRec, { crop }));
  const rows: string[][] = [];
  if (p.lime) {
    rows.push([`${t.stages.preplant}: ${lang === 'sw' ? FERTILIZERS.lime.sw : FERTILIZERS.lime.name}\n${t.limeWhen}`,
      num(p.lime.kgTotal), num(p.lime.bags, 1), tsh(p.lime.cost)]);
  }
  p.lines.forEach((l) => {
    const f = FERTILIZERS[l.product];
    const perPlant = l.gramsPerPlant ? `\n${fmt(t.perPlant, { g: num(l.gramsPerPlant, 1), caps: num(l.gramsPerPlant / GRAMS_PER_CAP, 1) })}` : '';
    rows.push([
      `${t.stages[l.stage]}: ${lang === 'sw' ? f.sw : f.name}\n${stageTiming(p, l.stage as 'basal' | 'topdress', t)}${perPlant}`,
      num(l.kgTotal, 1), num(l.bags, 1), tsh(l.cost),
    ]);
  });
  if (rows.length) {
    w.table([t.product, t.kg, t.bags, 'TSh'], rows, [106, 22, 22, 28]);
  }
  w.keyValues([[t.totalCost, tsh(p.totalCost)], [t.fertilizerOnly, tsh(p.fertilizerCost)]]);
  if (p.lime) w.para(fmt(t.limeBody, { ph: p.soil.ph.toFixed(1), target: p.lime.targetPh.toFixed(1), t: num(p.lime.tPerHa, 1) }), { size: 9 });
  if (p.soil.ph < 5.5 && p.lines.length) w.para(t.acidChoice, { size: 9 });

  if (p.crop.nutrients) {
    w.section(t.nutrients);
    w.table(['', 'N', 'P2O5', 'K2O'], [
      [t.target, String(p.target.n), String(p.target.p2o5), String(p.target.k2o)],
      [t.supplied, String(p.supplied.n), String(p.supplied.p2o5), String(p.supplied.k2o)],
    ], [88, 30, 30, 30]);
    w.para(`${p.official ? t.official : t.notOfficial} - ${t.source}: ${p.crop.nutrients.source}`, { size: 8, color: MUTED });
  }

  if (p.economics) {
    w.section(t.expectedReturn);
    w.keyValues([
      [t.extraHarvest, `~${num(p.economics.extraYieldKg)} ${t.kg}`],
      [t.extraIncome, `~${tsh(p.economics.extraIncome)}`],
      [t.vcrLabel, `TSh ${num(p.economics.vcr, 1)}`],
      [t.farmgate, `${tsh(p.economics.pricePerKg)}/kg`],
    ]);
    w.para(fmt(t.estimateNote, { price: num(p.economics.pricePerKg) }), { size: 8, color: MUTED });
  }

  w.section(t.tips);
  p.crop.tips[lang].forEach((tip) => w.para(`- ${tip}`, { size: 9 }));
  w.para(t.verifyInputs, { size: 9, bold: true });
  w.para(t.showDealer, { size: 8, color: MUTED });

  w.footer(SOURCES_FOOTER);
  return w.doc;
}

export function cropReportPdf(
  s: CropSuitability, regionName: string, soilLabel: string, t: MboleaStrings, lang: Lang, pricePerKg: number,
): jsPDF {
  const w = new PdfWriter();
  const c = s.crop;
  const date = new Date().toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-GB');
  w.header(`${c.name[lang]} - ${t.suitability} ${s.score}%`, `${regionName} · ${soilLabel}`, date);

  w.section(t.whyScore);
  w.table([t.suitability, t.yourFarm, t.ideal, '%'], [
    [t.factors.temp, `${s.temp.value} °C`, `${s.temp.optimal[0]}–${s.temp.optimal[1]} °C`, `${Math.round(s.temp.score * 100)}`],
    [t.factors.rain, `${s.rain.value} mm`, `${s.rain.optimal[0]}–${s.rain.optimal[1]} mm`, `${Math.round(s.rain.score * 100)}`],
    [t.factors.ph, `${s.ph.value.toFixed(1)}`, `${s.ph.optimal[0]}–${s.ph.optimal[1]}`, `${Math.round(s.ph.score * 100)}`],
  ], [70, 36, 46, 26]);

  w.section(t.details);
  const plant = s.plantMonth !== null ? t.months[s.plantMonth] : '-';
  w.keyValues([
    [t.plantingWindow, s.season ? `${t.seasonNames[s.season.name]}: ${plant}` : plant],
    [t.harvest, s.harvestMonth !== null ? t.months[s.harvestMonth] : '-'],
    [t.cycle, `${c.cycleDays} ${t.days}`],
    [t.spacing, c.spacing],
    [`${t.yieldLabel} - ${t.typical}`, String(c.yield.typical)],
    [`${t.yieldLabel} - ${t.attainable}`, String(c.yield.attainable)],
    [t.farmgate, `${tsh(pricePerKg)}/kg`],
  ]);

  w.section(t.tips);
  c.tips[lang].forEach((tip) => w.para(`- ${tip}`, { size: 9 }));
  w.footer(SOURCES_FOOTER);
  return w.doc;
}

/** Saves/shares a PDF on any platform. Returns what happened for UI feedback. */
export async function deliverPdf(doc: jsPDF, filename: string, title: string): Promise<'shared' | 'downloaded'> {
  if (Capacitor.isNativePlatform()) {
    const base64 = doc.output('datauristring').split(',')[1];
    const { uri } = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
    await Share.share({ title, files: [uri], dialogTitle: title });
    return 'shared';
  }
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  // Mobile browsers get the share sheet; desktops just download the file.
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (mobile && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'shared';
    }
  }
  doc.save(filename);
  return 'downloaded';
}

export const pdfName = (...parts: string[]) =>
  `${parts.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.pdf`;
