/**
 * Full bilingual demo catalog — one rich listing per marketplace category.
 * Imagery resolved via product-visuals / category photos.
 */
export type DemoSku = {
  categoryKey: string;
  sku: string;
  name: { en: string; ar: string };
  brand: string;
  price?: number;
  moq?: number;
  unit?: string;
};

export const FULL_DEMO_CATALOG: DemoSku[] = [
  { categoryKey: "safety-equipment", sku: "SAF-HELM-01", name: { en: "Industrial Safety Helmet Pro", ar: "خوذة سلامة صناعية برو" }, brand: "NajdSafe Demo", price: 85, moq: 50, unit: "piece" },
  { categoryKey: "construction", sku: "CON-SCF-01", name: { en: "Modular Scaffolding Frame Set", ar: "طقم إطارات سقالات معيارية" }, brand: "BuildRight Demo", price: 420, moq: 10, unit: "set" },
  { categoryKey: "building-materials", sku: "BLD-CEM-01", name: { en: "Portland Cement OPC 42.5", ar: "أسمنت بورتلاند OPC 42.5" }, brand: "Najd Cement Demo", price: 18, moq: 100, unit: "carton" },
  { categoryKey: "fmcg", sku: "FMCG-COF-01", name: { en: "Wholesale Arabica Coffee Beans", ar: "حبوب قهوة أرابيكا بالجملة" }, brand: "Najd Roasters Demo", price: 45, moq: 20, unit: "kg" },
  { categoryKey: "food-beverage", sku: "FB-WTR-01", name: { en: "Bottled Drinking Water Pallet", ar: "منصة مياه شرب معبأة" }, brand: "AquaGulf Demo", price: 65, moq: 5, unit: "pallet" },
  { categoryKey: "medical-equipment", sku: "MED-STETH-01", name: { en: "Clinical Stethoscope Set", ar: "طقم سماعة طبية" }, brand: "ClinicCare Demo", price: 220, moq: 10, unit: "set" },
  { categoryKey: "pharmaceuticals", sku: "PHAR-PPE-01", name: { en: "Sterile Examination Glove Carton", ar: "كرتون قفازات فحص معقمة" }, brand: "MedSupply Demo", price: 160, moq: 20, unit: "carton" },
  { categoryKey: "lab-scientific", sku: "LAB-PIP-01", name: { en: "Laboratory Micropipette Kit", ar: "طقم ماصات مخبرية دقيقة" }, brand: "LabCore Demo", price: 890, moq: 5, unit: "set" },
  { categoryKey: "textiles", sku: "TEX-ROLL-01", name: { en: "Industrial Cotton Fabric Roll", ar: "لفة قماش قطني صناعي" }, brand: "WeaveCo Demo", price: 120, moq: 50, unit: "meter" },
  { categoryKey: "apparel", sku: "APR-WRK-01", name: { en: "Industrial Workwear Coverall", ar: "بدلة عمل صناعية" }, brand: "WorkFit Demo", price: 95, moq: 100, unit: "piece" },
  { categoryKey: "it-services", sku: "IT-WEB-01", name: { en: "Corporate Website Development Package", ar: "باقة تطوير موقع شركات" }, brand: "Digital Hijaz Demo", moq: 1, unit: "custom" },
  { categoryKey: "telecom", sku: "TEL-RTR-01", name: { en: "Enterprise Network Router Bundle", ar: "باقة راوتر شبكة للمؤسسات" }, brand: "NetPulse Demo", price: 1850, moq: 2, unit: "set" },
  { categoryKey: "electrical", sku: "ELC-CBL-01", name: { en: "LV Power Cable 3-Core", ar: "كابل طاقة منخفض الجهد ثلاثي النواة" }, brand: "VoltGulf Demo", price: 18, moq: 500, unit: "meter" },
  { categoryKey: "industrial-machinery", sku: "MCH-PMP-01", name: { en: "Industrial Centrifugal Pump", ar: "مضخة طرد مركزي صناعية" }, brand: "PumpMaster Demo", price: 4200, moq: 1, unit: "piece" },
  { categoryKey: "hvac", sku: "HVAC-AC-01", name: { en: "Commercial Split AC 2 Ton", ar: "مكيف سبليت تجاري 2 طن" }, brand: "CoolAir Demo", price: 2400, moq: 2, unit: "piece" },
  { categoryKey: "oil-gas", sku: "OIL-VLV-01", name: { en: "API Gate Valve 6 Inch", ar: "صمام بوابة API مقاس 6 إنش" }, brand: "PetroValve Demo", price: 3100, moq: 4, unit: "piece" },
  { categoryKey: "renewable-energy", sku: "REN-SOL-01", name: { en: "Monocrystalline Solar Panel 550W", ar: "لوح شمسي أحادي البلورة 550 واط" }, brand: "SunNajd Demo", price: 680, moq: 20, unit: "piece" },
  { categoryKey: "automotive", sku: "AUT-FLT-01", name: { en: "Heavy Duty Oil Filter Pack", ar: "باقة فلاتر زيت للمركبات الثقيلة" }, brand: "AutoGulf Demo", price: 48, moq: 50, unit: "carton" },
  { categoryKey: "packaging", sku: "PKG-BOX-01", name: { en: "Corrugated Shipping Cartons", ar: "كراتين شحن مموجة" }, brand: "PackRight Demo", price: 3.5, moq: 500, unit: "piece" },
  { categoryKey: "printing-services", sku: "PRT-DIG-01", name: { en: "Digital Printing Package", ar: "باقة طباعة رقمية" }, brand: "PrintForge Demo", price: 450, moq: 1, unit: "custom" },
  { categoryKey: "stationery", sku: "STN-SET-01", name: { en: "Corporate Stationery Kit", ar: "طقم قرطاسية شركات" }, brand: "PaperNest Demo", price: 85, moq: 25, unit: "set" },
  { categoryKey: "office-supplies", sku: "OFF-TNR-01", name: { en: "Laser Toner Cartridge Bundle", ar: "باقة خراطيش حبر ليزر" }, brand: "OfficePrime Demo", price: 320, moq: 10, unit: "set" },
  { categoryKey: "furniture-fitout", sku: "FUR-DSK-01", name: { en: "Executive Office Desk Set", ar: "طقم مكتب تنفيذي" }, brand: "FitOut KSA Demo", price: 2100, moq: 5, unit: "set" },
  { categoryKey: "lighting", sku: "LGT-LED-01", name: { en: "Industrial LED High Bay Light", ar: "إضاءة LED صناعية عالية" }, brand: "BrightHall Demo", price: 285, moq: 20, unit: "piece" },
  { categoryKey: "plumbing", sku: "PLB-PIP-01", name: { en: "PPR Plumbing Pipe Bundle", ar: "باقة أنابيب سباكة PPR" }, brand: "FlowPipe Demo", price: 95, moq: 50, unit: "pack" },
  { categoryKey: "tools-hardware", sku: "TLS-KIT-01", name: { en: "Professional Hand Tool Kit", ar: "طقم أدوات يدوية احترافية" }, brand: "ToolForge Demo", price: 540, moq: 10, unit: "set" },
  { categoryKey: "agriculture", sku: "AGR-DRP-01", name: { en: "Drip Irrigation Kit", ar: "طقم ري بالتنقيط" }, brand: "GreenOasis Demo", price: 890, moq: 5, unit: "set" },
  { categoryKey: "logistics", sku: "LOG-PLT-01", name: { en: "Plastic Pallet Export Grade", ar: "طبلية بلاستيك للتصدير" }, brand: "CargoBase Demo", price: 120, moq: 40, unit: "piece" },
  { categoryKey: "facility-management", sku: "FAC-MNT-01", name: { en: "Facility Maintenance Service Plan", ar: "خطة صيانة المرافق" }, brand: "FacilityPro Demo", moq: 1, unit: "custom" },
  { categoryKey: "cleaning", sku: "CLN-KIT-01", name: { en: "Industrial Cleaning Chemical Kit", ar: "طقم كيماويات تنظيف صناعي" }, brand: "CleanForce Demo", price: 310, moq: 15, unit: "set" },
  { categoryKey: "chemicals", sku: "CHM-SLV-01", name: { en: "Industrial Solvent Drum 200L", ar: "برميل مذيب صناعي 200 لتر" }, brand: "ChemArabia Demo", price: 980, moq: 4, unit: "carton" },
  { categoryKey: "plastics", sku: "PLS-RES-01", name: { en: "HDPE Resin Granules Bag", ar: "كيس حبيبات راتنج HDPE" }, brand: "PolyGulf Demo", price: 75, moq: 100, unit: "carton" },
  { categoryKey: "security-systems", sku: "SEC-CCTV-01", name: { en: "IP CCTV Camera 4-Pack", ar: "باقة 4 كاميرات مراقبة IP" }, brand: "SecureEye Demo", price: 1450, moq: 2, unit: "set" },
  { categoryKey: "hospitality", sku: "HSP-LIN-01", name: { en: "Hotel Linen Bulk Pack", ar: "باقة مفروشات فندقية بالجملة" }, brand: "HospitalityLinc Demo", price: 680, moq: 20, unit: "set" },
  { categoryKey: "beauty", sku: "BTY-KIT-01", name: { en: "Salon Professional Care Kit", ar: "طقم عناية احترافي للصالونات" }, brand: "GlowLab Demo", price: 390, moq: 12, unit: "set" },
  { categoryKey: "education", sku: "EDU-KIT-01", name: { en: "Classroom STEM Learning Kit", ar: "طقم تعلم STEM للفصول" }, brand: "EduNest Demo", price: 520, moq: 10, unit: "set" },
  { categoryKey: "water-treatment", sku: "WTR-FLT-01", name: { en: "Industrial Water Filter Cartridge Set", ar: "طقم خراطيش فلترة مياه صناعية" }, brand: "PureFlow Demo", price: 740, moq: 8, unit: "set" },
  { categoryKey: "waste-management", sku: "WST-BIN-01", name: { en: "Industrial Waste Bin 240L", ar: "حاوية نفايات صناعية 240 لتر" }, brand: "EcoBin Demo", price: 185, moq: 25, unit: "piece" },
  { categoryKey: "mining", sku: "MIN-HEL-01", name: { en: "Mining Safety Helmet with Lamp Mount", ar: "خوذة تعدين مع تثبيت مصباح" }, brand: "MineGuard Demo", price: 125, moq: 40, unit: "piece" },
  { categoryKey: "home-appliances", sku: "APL-WSH-01", name: { en: "Commercial Dishwasher Unit", ar: "غسالة صحون تجارية" }, brand: "KitchenPro Demo", price: 5600, moq: 1, unit: "piece" },
  { categoryKey: "marketing-services", sku: "MKT-CMP-01", name: { en: "B2B Digital Campaign Package", ar: "باقة حملة رقمية B2B" }, brand: "ReachArabia Demo", moq: 1, unit: "custom" },
  { categoryKey: "company-formation", sku: "SVC-CR-01", name: { en: "Saudi Company Formation Package", ar: "باقة تأسيس شركة سعودية" }, brand: "Setup Gulf Demo", moq: 1, unit: "custom" },
  { categoryKey: "legal-services", sku: "SVC-LEG-01", name: { en: "Corporate Contract Review", ar: "مراجعة عقود الشركات" }, brand: "Counsel SA Demo", moq: 1, unit: "custom" },
  { categoryKey: "visa-services", sku: "SVC-VISA-01", name: { en: "Work Visa Processing Support", ar: "دعم إصدار تأشيرة عمل" }, brand: "EntryAssist Demo", moq: 1, unit: "custom" },
  { categoryKey: "accounting-finance", sku: "SVC-ACC-01", name: { en: "VAT Filing & Bookkeeping", ar: "تقديم ضريبة القيمة المضافة والمحاسبة" }, brand: "Ledger KSA Demo", price: 1500, moq: 1, unit: "custom" },
  { categoryKey: "hr-recruitment", sku: "HR-REC-01", name: { en: "Corporate Recruitment Retainer", ar: "عقد استقطاب موظفين للشركات" }, brand: "TalentBridge Demo", moq: 1, unit: "custom" },
  { categoryKey: "translation-services", sku: "TRN-DOC-01", name: { en: "Certified Document Translation Pack", ar: "باقة ترجمة وثائق معتمدة" }, brand: "LinguaSA Demo", price: 280, moq: 1, unit: "pack" },
  { categoryKey: "professional-services", sku: "PRO-CON-01", name: { en: "Business Consulting Day Rate", ar: "استشارة أعمال باليوم" }, brand: "Advisor KSA Demo", price: 3500, moq: 1, unit: "custom" },
  { categoryKey: "others", sku: "OTH-GEN-01", name: { en: "Custom B2B Supply Request", ar: "طلب توريد B2B مخصص" }, brand: "Kingdom Trade Demo", moq: 1, unit: "custom" },
  // Extra depth for popular homepage categories
  { categoryKey: "safety-equipment", sku: "SAF-GLV-01", name: { en: "Nitrile Industrial Safety Gloves", ar: "قفازات سلامة صناعية من النيتريل" }, brand: "GulfGuard Demo", price: 28, moq: 200, unit: "pair" },
  { categoryKey: "safety-equipment", sku: "SAF-EYE-01", name: { en: "Anti-Fog Safety Goggles", ar: "نظارات سلامة مضادة للضباب" }, brand: "RSS Demo", price: 36, moq: 100, unit: "piece" },
  { categoryKey: "building-materials", sku: "BLD-STL-01", name: { en: "Deformed Steel Rebar 12mm", ar: "حديد تسليح محزّز 12 مم" }, brand: "Najd Steel Demo", price: 2450, moq: 5, unit: "ton" },
  { categoryKey: "construction", sku: "CON-FRM-01", name: { en: "Timber Formwork Panel Pack", ar: "باقة ألواح قوالب خشبية" }, brand: "FormCraft Demo", price: 380, moq: 20, unit: "pack" },
  { categoryKey: "electrical", sku: "ELC-DB-01", name: { en: "Distribution Board 24-Way", ar: "لوحة توزيع 24 دائرة" }, brand: "VoltGulf Demo", price: 620, moq: 5, unit: "piece" },
  { categoryKey: "hvac", sku: "HVAC-FLT-01", name: { en: "AHU Filter Media Roll", ar: "لفة فلاتر وحدات مناولة الهواء" }, brand: "CoolAir Demo", price: 210, moq: 10, unit: "roll" },
  { categoryKey: "packaging", sku: "PKG-TAP-01", name: { en: "Industrial Packing Tape Carton", ar: "كرتون شريط تغليف صناعي" }, brand: "PackRight Demo", price: 55, moq: 40, unit: "carton" },
  { categoryKey: "agriculture", sku: "AGR-SHD-01", name: { en: "Agricultural Shade Net 50%", ar: "شبك تظليل زراعي 50%" }, brand: "GreenOasis Demo", price: 4.5, moq: 500, unit: "meter" },
  { categoryKey: "medical-equipment", sku: "MED-DSP-01", name: { en: "Disposable Surgical Mask Box", ar: "علبة كمامات جراحية للاستخدام مرة واحدة" }, brand: "ClinicCare Demo", price: 42, moq: 50, unit: "box" },
  { categoryKey: "office-supplies", sku: "OFF-PAP-01", name: { en: "A4 Copy Paper Ream Case", ar: "كرتون ورق تصوير A4" }, brand: "PaperNest Demo", price: 165, moq: 20, unit: "custom" },
  { categoryKey: "tools-hardware", sku: "TLS-DRL-01", name: { en: "Cordless Drill Driver Kit", ar: "طقم مثقاب لاسلكي" }, brand: "ToolForge Demo", price: 475, moq: 8, unit: "set" },
  { categoryKey: "logistics", sku: "LOG-STR-01", name: { en: "Stretch Wrap Film Roll", ar: "لفة فيلم تغليف مطاطي" }, brand: "CargoBase Demo", price: 68, moq: 30, unit: "roll" },
];
