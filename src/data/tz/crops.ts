// Tanzanian crop knowledge base for Mbolea Sahihi.
//
// Sources (every number below is traceable to one of these):
//  - ECO:  FAO ECOCROP crop parameters (temperature, crop-cycle rainfall, pH),
//          extracted by scripts/tz-data/ecocrop_extract.json.
//  - MoA:  Ministry of Agriculture R&D "Recommended Application Rate (RAR) for
//          fertiliser per crop" (maize & rice 2015; beans, potato, coffee 2013;
//          cotton), reproduced in IFDC/AFO "Fertilizer Use by Crop - Tanzania".
//  - TARI: Tanzania Agricultural Research Institute published guidance.
//  - LIT:  Agronomy literature for East Africa where no official Tanzanian rate
//          exists (the IFDC report notes RARs are missing for cassava, pigeon pea,
//          cashew and others). These are flagged `official: false` in the UI.
//  Yields are approximate smallholder averages (NBS/FAOSTAT) and attainable
//  yields under good management (MoA expected-yield ranges where available).

export type CropId =
  | 'maize' | 'rice' | 'beans' | 'sorghum' | 'finger-millet' | 'irish-potato'
  | 'cassava' | 'sweet-potato' | 'sunflower' | 'sesame' | 'groundnut' | 'pigeon-pea'
  | 'cotton' | 'coffee' | 'cashew' | 'tomato' | 'onion' | 'wheat';

export type Range = [number, number];

export interface TzCrop {
  id: CropId;
  name: { en: string; sw: string };
  category: 'cereal' | 'legume' | 'root' | 'oilseed' | 'vegetable' | 'cash';
  perennial: boolean;
  legume: boolean;
  /** Typical Tanzanian variety, days from planting to harvest. */
  cycleDays: number;
  /** FAO ECOCROP limits. rain = mm over the crop cycle (annual for perennials). */
  eco: { tempOpt: Range; tempAbs: Range; rainOpt: Range; rainAbs: Range; phOpt: Range; phAbs: Range };
  /**
   * Elevation band (m) where the crop is grown in Tanzania. ECOCROP has no altitude
   * limits, so without this cashew would "fit" the cool Southern Highlands.
   */
  altitude?: Range;
  /** Recommended nutrient rate, kg/ha of N, P2O5, K2O. null = no recommendation exists. */
  nutrients: { n: number; p2o5: number; k2o: number; source: string; official: boolean } | null;
  /** When to top-dress nitrogen, in weeks after planting/emergence. */
  topDressWeeks: string;
  plantsPerHa: number;
  spacing: string;
  /** t/ha: typical smallholder yield vs. attainable with recommended inputs. */
  yield: { typical: number; attainable: number };
  /**
   * Market price. `wfp` = commodity id in market-prices.json (WFP wholesale),
   * converted to farm-gate with `farmgateFactor`. Otherwise `referenceTzsPerKg`
   * is an editable farm-gate estimate for 2025/26.
   */
  price: { wfp?: string; referenceTzsPerKg?: number; farmgateFactor: number; unit: { en: string; sw: string } };
  tips: { en: string[]; sw: string[] };
}

const kg = { en: 'grain', sw: 'nafaka' };

export const TZ_CROPS: TzCrop[] = [
  {
    id: 'maize', name: { en: 'Maize', sw: 'Mahindi' }, category: 'cereal', perennial: false, legume: false,
    cycleDays: 120,
    eco: { tempOpt: [18, 33], tempAbs: [10, 47], rainOpt: [600, 1200], rainAbs: [400, 1800], phOpt: [5, 7], phAbs: [4.5, 8.5] },
    nutrients: { n: 100, p2o5: 40, k2o: 0, source: 'MoA R&D 2015', official: true },
    topDressWeeks: '3–5', plantsPerHa: 53333, spacing: '75 × 25 cm',
    yield: { typical: 1.6, attainable: 5.0 },
    price: { wfp: 'maize', farmgateFactor: 0.8, unit: kg },
    tips: {
      en: ['Plant with the first reliable rains (≥ 20 mm in a week).', 'Top-dress when maize is knee-high and the soil is moist.', 'Use certified seed – verify with *148*52#.'],
      sw: ['Panda mvua za kwanza za uhakika zikinyesha (≥ mm 20 kwa wiki).', 'Weka mbolea ya kukuzia mahindi yakifika magotini na udongo ukiwa na unyevu.', 'Tumia mbegu zilizothibitishwa – hakiki kwa *148*52#.'],
    },
  },
  {
    id: 'rice', name: { en: 'Rice (paddy)', sw: 'Mpunga' }, category: 'cereal', perennial: false, legume: false,
    cycleDays: 130,
    eco: { tempOpt: [20, 30], tempAbs: [10, 36], rainOpt: [1500, 2000], rainAbs: [1000, 4000], phOpt: [5.5, 7], phAbs: [4.5, 9] },
    nutrients: { n: 80, p2o5: 20, k2o: 0, source: 'MoA R&D 2015', official: true },
    topDressWeeks: '3 & 7', plantsPerHa: 250000, spacing: '20 × 20 cm',
    yield: { typical: 2.5, attainable: 5.0 },
    // WFP reports milled rice; paddy fetches roughly 55% of the milled price.
    price: { wfp: 'rice', farmgateFactor: 0.55, unit: { en: 'paddy', sw: 'mpunga' } },
    tips: {
      en: ['Best in valley bottoms or irrigation schemes – rain alone is often short.', 'Split urea: half at tillering, half at panicle initiation.'],
      sw: ['Hustawi zaidi mabondeni au kwenye skimu za umwagiliaji.', 'Gawa Urea: nusu wakati wa kuchipua matawi, nusu wakati wa kubeba.'],
    },
  },
  {
    id: 'beans', name: { en: 'Beans', sw: 'Maharage' }, category: 'legume', perennial: false, legume: true,
    cycleDays: 90,
    eco: { tempOpt: [16, 25], tempAbs: [7, 32], rainOpt: [500, 2000], rainAbs: [300, 4300], phOpt: [5.5, 7.5], phAbs: [4, 9] },
    nutrients: { n: 30, p2o5: 60, k2o: 0, source: 'MoA R&D 2013', official: true },
    topDressWeeks: '3', plantsPerHa: 200000, spacing: '50 × 10 cm',
    yield: { typical: 0.8, attainable: 1.8 },
    price: { wfp: 'beans', farmgateFactor: 0.8, unit: kg },
    tips: {
      en: ['Beans fix their own nitrogen – do not over-apply urea.', 'Rhizobium inoculant boosts yields on new fields.'],
      sw: ['Maharage hujitengenezea naitrojeni – usizidishe Urea.', 'Chanjo ya Rhizobium huongeza mavuno kwenye mashamba mapya.'],
    },
  },
  {
    id: 'sorghum', name: { en: 'Sorghum', sw: 'Mtama' }, category: 'cereal', perennial: false, legume: false,
    cycleDays: 110,
    eco: { tempOpt: [24, 35], tempAbs: [10, 40], rainOpt: [500, 1000], rainAbs: [300, 3000], phOpt: [6, 7], phAbs: [5, 8.5] },
    nutrients: { n: 40, p2o5: 20, k2o: 0, source: 'TARI / East Africa literature', official: false },
    topDressWeeks: '4', plantsPerHa: 133000, spacing: '75 × 10 cm',
    yield: { typical: 1.0, attainable: 2.5 },
    price: { wfp: 'sorghum', farmgateFactor: 0.8, unit: kg },
    tips: {
      en: ['A drought-tolerant choice for Dodoma, Singida and Shinyanga.', 'Guard against birds near harvest.'],
      sw: ['Zao linalostahimili ukame kwa Dodoma, Singida na Shinyanga.', 'Linda dhidi ya ndege karibu na mavuno.'],
    },
  },
  {
    id: 'finger-millet', name: { en: 'Finger millet', sw: 'Ulezi' }, category: 'cereal', perennial: false, legume: false,
    cycleDays: 120,
    eco: { tempOpt: [18, 27], tempAbs: [8, 35], rainOpt: [800, 1100], rainAbs: [600, 4300], phOpt: [6, 6.5], phAbs: [5.5, 7.5] },
    nutrients: { n: 40, p2o5: 20, k2o: 0, source: 'TARI / East Africa literature', official: false },
    topDressWeeks: '4', plantsPerHa: 330000, spacing: '30 × 10 cm',
    yield: { typical: 0.8, attainable: 2.0 },
    price: { wfp: 'finger-millet', farmgateFactor: 0.8, unit: kg },
    tips: {
      en: ['High value grain in Rukwa, Mbeya and Kigoma.', 'Weed early – seedlings are slow.'],
      sw: ['Nafaka yenye bei nzuri Rukwa, Mbeya na Kigoma.', 'Palilia mapema – miche hukua polepole.'],
    },
  },
  {
    id: 'irish-potato', name: { en: 'Irish potato', sw: 'Viazi mviringo' }, category: 'root', perennial: false, legume: false,
    cycleDays: 110,
    eco: { tempOpt: [15, 25], tempAbs: [7, 30], rainOpt: [500, 800], rainAbs: [250, 2000], phOpt: [5, 6.2], phAbs: [4.2, 8.5] },
    altitude: [1200, 3000],
    nutrients: { n: 257, p2o5: 57, k2o: 57, source: 'MoA R&D 2013 (Southern Highlands)', official: true },
    topDressWeeks: '4–6', plantsPerHa: 44000, spacing: '75 × 30 cm',
    yield: { typical: 9, attainable: 20 },
    price: { wfp: 'irish-potato', farmgateFactor: 0.75, unit: { en: 'tubers', sw: 'viazi' } },
    tips: {
      en: ['Suited to cool highlands (Njombe, Mbeya, Iringa).', 'Use clean seed to avoid bacterial wilt.'],
      sw: ['Hustawi nyanda za juu zenye baridi (Njombe, Mbeya, Iringa).', 'Tumia mbegu safi kuepuka mnyauko bakteria.'],
    },
  },
  {
    id: 'cassava', name: { en: 'Cassava', sw: 'Muhogo' }, category: 'root', perennial: false, legume: false,
    cycleDays: 300,
    eco: { tempOpt: [20, 29], tempAbs: [10, 35], rainOpt: [1000, 1500], rainAbs: [500, 5000], phOpt: [5.5, 8], phAbs: [4, 9] },
    nutrients: { n: 68, p2o5: 68, k2o: 68, source: 'TARI (NPK 17:17:17, 8 bags/ha)', official: false },
    topDressWeeks: '3', plantsPerHa: 10000, spacing: '100 × 100 cm',
    yield: { typical: 8, attainable: 20 },
    price: { referenceTzsPerKg: 250, farmgateFactor: 1, unit: { en: 'fresh roots', sw: 'mizizi mibichi' } },
    tips: {
      en: ['Use CMD/CBSD tolerant varieties from TARI Kibaha or Ukiriguru.', 'Tolerates acid soils better than most crops.'],
      sw: ['Tumia aina zinazostahimili batobato na michirizi kahawia (TARI Kibaha/Ukiriguru).', 'Huvumilia udongo wenye tindikali kuliko mazao mengi.'],
    },
  },
  {
    id: 'sweet-potato', name: { en: 'Sweet potato', sw: 'Viazi vitamu' }, category: 'root', perennial: false, legume: false,
    cycleDays: 120,
    eco: { tempOpt: [18, 28], tempAbs: [10, 38], rainOpt: [750, 1250], rainAbs: [500, 5000], phOpt: [5, 7], phAbs: [4, 8] },
    nutrients: { n: 34, p2o5: 34, k2o: 34, source: 'TARI (NPK 17:17:17)', official: false },
    topDressWeeks: '3', plantsPerHa: 33000, spacing: '100 × 30 cm',
    yield: { typical: 6, attainable: 15 },
    price: { referenceTzsPerKg: 400, farmgateFactor: 1, unit: { en: 'roots', sw: 'viazi' } },
    tips: {
      en: ['Orange-fleshed varieties add vitamin A and sell well in towns.'],
      sw: ['Aina za rangi ya chungwa zina vitamini A na zinauzika mijini.'],
    },
  },
  {
    id: 'sunflower', name: { en: 'Sunflower', sw: 'Alizeti' }, category: 'oilseed', perennial: false, legume: false,
    cycleDays: 110,
    eco: { tempOpt: [17, 34], tempAbs: [5, 45], rainOpt: [600, 1000], rainAbs: [300, 1600], phOpt: [6, 7.5], phAbs: [5.5, 8] },
    nutrients: { n: 50, p2o5: 30, k2o: 0, source: 'TARI / East Africa literature', official: false },
    topDressWeeks: '4', plantsPerHa: 44000, spacing: '75 × 30 cm',
    yield: { typical: 0.9, attainable: 2.0 },
    price: { referenceTzsPerKg: 950, farmgateFactor: 1, unit: { en: 'seed', sw: 'mbegu' } },
    tips: {
      en: ['Priority crop for cutting edible-oil imports – strong demand in Singida and Dodoma.', 'Hybrid seed roughly doubles yield over recycled seed.'],
      sw: ['Zao la kipaumbele kupunguza uagizaji wa mafuta – soko kubwa Singida na Dodoma.', 'Mbegu chotara huongeza mavuno karibu mara mbili.'],
    },
  },
  {
    id: 'sesame', name: { en: 'Sesame', sw: 'Ufuta' }, category: 'oilseed', perennial: false, legume: false,
    cycleDays: 100,
    eco: { tempOpt: [20, 30], tempAbs: [10, 40], rainOpt: [500, 1000], rainAbs: [300, 1500], phOpt: [5.5, 7.5], phAbs: [4.5, 8] },
    altitude: [0, 1500],
    nutrients: { n: 40, p2o5: 20, k2o: 0, source: 'East Africa literature', official: false },
    topDressWeeks: '4', plantsPerHa: 166000, spacing: '60 × 10 cm',
    yield: { typical: 0.5, attainable: 1.0 },
    price: { referenceTzsPerKg: 3000, farmgateFactor: 1, unit: { en: 'seed', sw: 'mbegu' } },
    tips: {
      en: ['Sold through warehouse-receipt auctions in Lindi, Mtwara and Ruvuma.', 'Needs well-drained soil – waterlogging kills it.'],
      sw: ['Huuzwa kupitia minada ya stakabadhi ghalani Lindi, Mtwara na Ruvuma.', 'Inahitaji udongo usiotuamisha maji.'],
    },
  },
  {
    id: 'groundnut', name: { en: 'Groundnut', sw: 'Karanga' }, category: 'legume', perennial: false, legume: true,
    cycleDays: 110,
    eco: { tempOpt: [22, 32], tempAbs: [10, 45], rainOpt: [600, 1500], rainAbs: [400, 4000], phOpt: [5.5, 6.5], phAbs: [4.5, 8.5] },
    nutrients: { n: 0, p2o5: 30, k2o: 0, source: 'East Africa literature', official: false },
    topDressWeeks: '—', plantsPerHa: 222000, spacing: '45 × 10 cm',
    yield: { typical: 0.8, attainable: 1.8 },
    price: { referenceTzsPerKg: 2500, farmgateFactor: 1, unit: { en: 'shelled nuts', sw: 'karanga zilizomenywa' } },
    tips: {
      en: ['Gypsum at flowering improves pod filling on sandy soils.', 'Dry quickly after harvest to prevent aflatoxin.'],
      sw: ['Jasi (gypsum) wakati wa kuchanua huboresha ujazo wa punje.', 'Kausha haraka baada ya kuvuna kuzuia sumukuvu.'],
    },
  },
  {
    id: 'pigeon-pea', name: { en: 'Pigeon pea', sw: 'Mbaazi' }, category: 'legume', perennial: false, legume: true,
    cycleDays: 180,
    eco: { tempOpt: [18, 38], tempAbs: [10, 45], rainOpt: [600, 1500], rainAbs: [400, 4000], phOpt: [5, 7], phAbs: [4.5, 8.4] },
    altitude: [0, 1800],
    nutrients: { n: 0, p2o5: 20, k2o: 0, source: 'East Africa literature', official: false },
    topDressWeeks: '—', plantsPerHa: 44000, spacing: '150 × 30 cm',
    yield: { typical: 0.8, attainable: 1.5 },
    price: { referenceTzsPerKg: 1500, farmgateFactor: 1, unit: kg },
    tips: {
      en: ['Intercrop with maize – it feeds the soil for the next season.'],
      sw: ['Changanya na mahindi – huongeza rutuba kwa msimu ujao.'],
    },
  },
  {
    id: 'cotton', name: { en: 'Cotton', sw: 'Pamba' }, category: 'cash', perennial: false, legume: false,
    cycleDays: 170,
    eco: { tempOpt: [22, 36], tempAbs: [15, 42], rainOpt: [750, 1200], rainAbs: [450, 1500], phOpt: [6, 7.5], phAbs: [5, 9.5] },
    altitude: [0, 1500],
    nutrients: { n: 40, p2o5: 40, k2o: 0, source: 'MoA R&D', official: true },
    topDressWeeks: '6', plantsPerHa: 44000, spacing: '90 × 25 cm',
    yield: { typical: 0.7, attainable: 1.5 },
    price: { referenceTzsPerKg: 1150, farmgateFactor: 1, unit: { en: 'seed cotton', sw: 'pamba mbegu' } },
    tips: {
      en: ['Main belt: Simiyu, Shinyanga, Mwanza, Geita, Mara.', 'Follow the Cotton Board (TCB) spraying calendar.'],
      sw: ['Ukanda mkuu: Simiyu, Shinyanga, Mwanza, Geita, Mara.', 'Fuata kalenda ya unyunyiziaji ya Bodi ya Pamba (TCB).'],
    },
  },
  {
    id: 'coffee', name: { en: 'Coffee (Arabica)', sw: 'Kahawa (Arabika)' }, category: 'cash', perennial: true, legume: false,
    cycleDays: 365,
    eco: { tempOpt: [14, 28], tempAbs: [10, 34], rainOpt: [1400, 2300], rainAbs: [750, 4200], phOpt: [5.5, 7], phAbs: [4.3, 8.4] },
    altitude: [1000, 2300],
    nutrients: { n: 85, p2o5: 20, k2o: 10, source: 'MoA R&D 2013', official: true },
    topDressWeeks: 'onset of rains', plantsPerHa: 1330, spacing: '2.74 × 2.74 m',
    yield: { typical: 0.35, attainable: 0.8 },
    price: { referenceTzsPerKg: 7000, farmgateFactor: 1, unit: { en: 'parchment', sw: 'kahawa ngozi' } },
    tips: {
      en: ['Apply nitrogen in 2–3 splits during the rains.', 'Mulch and shade trees protect soil moisture.'],
      sw: ['Weka naitrojeni mara 2–3 wakati wa mvua.', 'Matandazo na miti ya kivuli hulinda unyevu.'],
    },
  },
  {
    id: 'cashew', name: { en: 'Cashew', sw: 'Korosho' }, category: 'cash', perennial: true, legume: false,
    cycleDays: 365,
    eco: { tempOpt: [15, 35], tempAbs: [5, 46], rainOpt: [750, 1600], rainAbs: [400, 4000], phOpt: [4.5, 6.5], phAbs: [3.8, 8.7] },
    altitude: [0, 1000],
    // IFDC/MoA: no official fertilizer RAR exists for cashew.
    nutrients: null,
    topDressWeeks: '—', plantsPerHa: 100, spacing: '10 × 10 m',
    yield: { typical: 0.5, attainable: 1.2 },
    price: { referenceTzsPerKg: 2800, farmgateFactor: 1, unit: { en: 'raw nuts', sw: 'korosho ghafi' } },
    tips: {
      en: ['Sulphur dusting against powdery mildew matters more than NPK.', 'Sold through the Cashewnut Board (CBT) warehouse-receipt auctions.'],
      sw: ['Kupuliza salfa dhidi ya ubwiri unga ni muhimu kuliko NPK.', 'Huuzwa kupitia minada ya Bodi ya Korosho (CBT).'],
    },
  },
  {
    id: 'tomato', name: { en: 'Tomato', sw: 'Nyanya' }, category: 'vegetable', perennial: false, legume: false,
    cycleDays: 110,
    eco: { tempOpt: [20, 27], tempAbs: [7, 35], rainOpt: [600, 1300], rainAbs: [400, 1800], phOpt: [5.5, 6.8], phAbs: [5, 7.5] },
    nutrients: { n: 120, p2o5: 80, k2o: 60, source: 'Horticulture guideline (East Africa)', official: false },
    topDressWeeks: '3 & 6', plantsPerHa: 27000, spacing: '75 × 50 cm',
    yield: { typical: 15, attainable: 35 },
    price: { referenceTzsPerKg: 800, farmgateFactor: 1, unit: { en: 'fruit', sw: 'matunda' } },
    tips: {
      en: ['Prices swing hard – stagger planting to avoid gluts.', 'Stake plants and watch for Tuta absoluta.'],
      sw: ['Bei hubadilika sana – panda kwa awamu kuepuka mafuriko ya soko.', 'Weka miti ya kushikilia na angalia Tuta absoluta.'],
    },
  },
  {
    id: 'onion', name: { en: 'Onion', sw: 'Kitunguu' }, category: 'vegetable', perennial: false, legume: false,
    cycleDays: 120,
    eco: { tempOpt: [12, 25], tempAbs: [4, 30], rainOpt: [350, 600], rainAbs: [300, 2800], phOpt: [6, 7], phAbs: [4.3, 8.3] },
    nutrients: { n: 100, p2o5: 60, k2o: 60, source: 'Horticulture guideline (East Africa)', official: false },
    topDressWeeks: '4 & 7', plantsPerHa: 400000, spacing: '25 × 10 cm',
    yield: { typical: 12, attainable: 25 },
    price: { referenceTzsPerKg: 1200, farmgateFactor: 1, unit: { en: 'bulbs', sw: 'vitunguu' } },
    tips: {
      en: ['Mostly irrigated in the dry season (Manyara, Singida, Iringa).', 'Stop nitrogen 6 weeks before harvest for better storage.'],
      sw: ['Hulimwa kwa umwagiliaji kiangazi (Manyara, Singida, Iringa).', 'Acha naitrojeni wiki 6 kabla ya kuvuna ili vihifadhike vizuri.'],
    },
  },
  {
    id: 'wheat', name: { en: 'Wheat', sw: 'Ngano' }, category: 'cereal', perennial: false, legume: false,
    cycleDays: 120,
    eco: { tempOpt: [15, 23], tempAbs: [5, 27], rainOpt: [750, 900], rainAbs: [300, 1600], phOpt: [6, 7], phAbs: [5.5, 8.5] },
    altitude: [1200, 3000],
    nutrients: { n: 60, p2o5: 40, k2o: 0, source: 'TARI Selian / literature', official: false },
    topDressWeeks: '4', plantsPerHa: 2500000, spacing: 'rows 20 cm',
    yield: { typical: 1.5, attainable: 3.5 },
    price: { wfp: 'wheat', farmgateFactor: 0.8, unit: kg },
    tips: {
      en: ['Needs cool highlands above ~1,500 m (Arusha, Manyara, Njombe, Mbeya).', '91% of wheat eaten in Tanzania is imported – local demand is large.'],
      sw: ['Inahitaji nyanda za juu zenye baridi (juu ya m 1,500).', 'Asilimia 91 ya ngano inaagizwa – soko la ndani ni kubwa.'],
    },
  },
];

export const CROP_BY_ID: Record<CropId, TzCrop> =
  Object.fromEntries(TZ_CROPS.map((c) => [c.id, c])) as Record<CropId, TzCrop>;
