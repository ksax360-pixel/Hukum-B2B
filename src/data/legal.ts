// src/data/legal.ts
// Terms, privacy and marketplace rules in English and Arabic. Drafted from Hukum's business model for counsel
// review: buyers free, suppliers free through 2027, first contact through the Hukum relay, Hukum not a party
// to purchases. No invented dates, figures, entity details or retention periods.

import type { LegalContent } from "@/components/legal/LegalDoc";

export const TERMS: LegalContent = {
  title: { en: "Terms of service", ar: "شروط الاستخدام" },
  lead: { en: "The agreement between you and Hukum when you use hukum.sa as a buyer or a supplier.", ar: "الاتفاق بينك وبين حكم عند استخدامك hukum.sa كمشترٍ أو مورد." },
  summary: [
    { en: "Hukum connects business buyers with suppliers in Saudi Arabia. We are not a party to any purchase.", ar: "حكم يربط المشترين من الشركات بالموردين في السعودية. لسنا طرفاً في أي عملية شراء." },
    { en: "Buyers use Hukum free. Suppliers are free through 2027; paid plans come later and never start without your agreement.", ar: "المشترون يستخدمون حكم مجاناً. الموردون مجاناً خلال ٢٠٢٧؛ الباقات المدفوعة لاحقاً ولا تبدأ بدون موافقتك." },
    { en: "Requests and quotes are enquiries. You agree price, delivery and payment directly with each other.", ar: "الطلبات والعروض استفسارات. تتفقون على السعر والتوريد والدفع مباشرة بينكم." },
    { en: "First contact goes through Hukum. Contact details are shared only with consent.", ar: "أول تواصل يمر عبر حكم. بيانات التواصل تُشارك بموافقة فقط." },
  ],
  sections: [
    { id: "about", title: { en: "What Hukum is", ar: "ما هو حكم" }, paras: [
      { en: "Hukum is an online business-to-business marketplace. Suppliers list products and a storefront; buyers search, compare and send requests for quotation. Hukum passes requests to matching suppliers and shows their quotes side by side.", ar: "حكم سوق إلكتروني بين الشركات. الموردون يعرضون منتجاتهم ومتاجرهم؛ والمشترون يبحثون ويقارنون ويرسلون طلبات عروض أسعار. حكم يوصل الطلبات للموردين المطابقين ويعرض عروضهم جنب بعض." },
      { en: "Hukum does not sell goods, does not take payment for orders, and does not deliver. Any purchase is a contract between the buyer and the supplier only.", ar: "حكم لا يبيع بضائع ولا يستلم مدفوعات الطلبات ولا يوصّل. أي شراء هو عقد بين المشتري والمورد فقط." },
    ] },
    { id: "accounts", title: { en: "Your account", ar: "حسابك" }, list: [
      { en: "Accounts are for business use by people aged 18 or over who can act for their company.", ar: "الحسابات للاستخدام التجاري من أشخاص بعمر ١٨ أو أكثر ومخوّلين بالتصرف عن شركاتهم." },
      { en: "Keep your details accurate and your password private. You're responsible for what happens under your account.", ar: "حافظ على دقة بياناتك وسرية كلمة مرورك. أنت مسؤول عما يحدث في حسابك." },
      { en: "Tell us straight away if you think someone else is using your account.", ar: "بلغنا فوراً إذا تعتقد أن أحداً يستخدم حسابك." },
    ] },
    { id: "buyers", title: { en: "Using Hukum as a buyer", ar: "استخدام حكم كمشترٍ" }, list: [
      { en: "Searching, requesting quotes and comparing them is free.", ar: "البحث وطلب العروض ومقارنتها مجاني." },
      { en: "Send requests you genuinely intend to buy against, with accurate quantities and delivery details.", ar: "أرسل طلبات تنوي الشراء بناءً عليها فعلاً، بكميات وبيانات توصيل دقيقة." },
      { en: "A quote is the supplier's offer. It binds no one through Hukum unless you and the supplier agree in writing.", ar: "العرض هو عرض المورد. لا يُلزم أحداً عبر حكم إلا إذا اتفقت أنت والمورد كتابياً." },
      { en: "Check what you buy. Hukum's verification confirms registration details, not product quality.", ar: "تحقق مما تشتريه. توثيق حكم يؤكد بيانات التسجيل، لا جودة المنتج." },
    ] },
    { id: "suppliers", title: { en: "Using Hukum as a supplier", ar: "استخدام حكم كمورد" }, list: [
      { en: "Supplier accounts are free through 2027. If we introduce paid plans, we'll announce them in advance and nothing is charged unless you choose a plan.", ar: "حسابات الموردين مجانية خلال ٢٠٢٧. إذا قدّمنا باقات مدفوعة نعلن عنها مسبقاً، ولا يُخصم شيء إلا إذا اخترت باقة." },
      { en: "You must hold a valid Commercial Registration and any licence your products need.", ar: "يجب أن يكون لديك سجل تجاري ساري وأي ترخيص تحتاجه منتجاتك." },
      { en: "Listings must be accurate: real photos, the actual brand, and specifications you can meet.", ar: "يجب أن تكون منتجاتك دقيقة: صور حقيقية والعلامة الفعلية ومواصفات تقدر تلتزم بها." },
      { en: "Quotes must say whether the price includes 15% VAT. Honour your quoted terms until the validity date.", ar: "يجب أن يوضح العرض هل السعر شامل ضريبة القيمة المضافة ١٥٪. التزم بشروط عرضك حتى تاريخ صلاحيته." },
      { en: "The Verified badge means we checked your CR with Wathq and, if given, your VAT number with ZATCA. It is not an endorsement.", ar: "شارة «موثّق» تعني أننا تحققنا من سجلك عبر واثق، ومن رقمك الضريبي عبر الزكاة إن وُجد. وليست تزكية." },
      { en: "Changes to your storefront look and new products are reviewed before they go live.", ar: "تغييرات شكل متجرك والمنتجات الجديدة تُراجع قبل نشرها." },
    ] },
    { id: "contact", title: { en: "Contact and the Hukum relay", ar: "التواصل ووسيط حكم" }, paras: [
      { en: "The first message between a buyer and a supplier goes through Hukum. Phone numbers and emails are shared only when the person asking agrees to share their own, and each reveal is recorded.", ar: "أول رسالة بين المشتري والمورد تمر عبر حكم. أرقام الجوال والبريد تُشارك فقط عندما يوافق الطالب على مشاركة بياناته، وكل كشف يُسجّل." },
      { en: "Don't use contact details you get on Hukum for spam, resale or anything other than the enquiry they were shared for.", ar: "لا تستخدم بيانات التواصل اللي تحصل عليها في حكم لرسائل مزعجة أو بيعها أو أي غرض غير الاستفسار اللي شوركت له." },
    ] },
    { id: "prohibited", title: { en: "What's not allowed", ar: "الممنوعات" }, list: [
      { en: "Weapons, explosives, and anything illegal to sell in Saudi Arabia.", ar: "الأسلحة والمتفجرات وأي شيء يمنع بيعه في السعودية." },
      { en: "Counterfeit goods or listings that use a brand you can't supply.", ar: "البضائع المقلدة أو عرض علامة تجارية لا تقدر توفرها." },
      { en: "Regulated items such as pharmaceuticals or hazardous chemicals without the required licence.", ar: "المنتجات المنظمة كالأدوية أو المواد الكيميائية الخطرة بدون الترخيص المطلوب." },
      { en: "Fake requests, fake quotes, or posing as another company.", ar: "الطلبات أو العروض الوهمية أو انتحال صفة شركة أخرى." },
      { en: "Scraping, automated access or attempts to break the site's security.", ar: "سحب البيانات آلياً أو الوصول الآلي أو محاولة اختراق أمان الموقع." },
    ] },
    { id: "content", title: { en: "Your content", ar: "محتواك" }, paras: [
      { en: "You keep ownership of what you upload. You allow Hukum to show, translate, resize and promote it on Hukum and in search results for as long as it's listed. You confirm you have the right to upload it.", ar: "تبقى مالك ما ترفعه. وتسمح لحكم بعرضه وترجمته وتغيير حجمه والترويج له في حكم ونتائج البحث طوال فترة إدراجه. وتؤكد أن لك حق رفعه." },
    ] },
    { id: "liability", title: { en: "Responsibility and liability", ar: "المسؤولية" }, paras: [
      { en: "Hukum is provided as it is. We work to keep it accurate and available but can't promise it will always be.", ar: "حكم مقدّم كما هو. نعمل لإبقائه دقيقاً ومتاحاً لكن لا نضمن ذلك دائماً." },
      { en: "As far as Saudi law allows, Hukum is not responsible for the goods, the quality, the delivery or the payment in a deal between users, or for indirect losses. Nothing here limits liability that the law does not allow us to limit.", ar: "في حدود ما يسمح به النظام السعودي، حكم غير مسؤول عن البضاعة أو جودتها أو توريدها أو دفعها في أي صفقة بين المستخدمين، ولا عن الخسائر غير المباشرة. ولا شيء هنا يحد من مسؤولية لا يجيز النظام الحد منها." },
    ] },
    { id: "suspension", title: { en: "Suspension and closing", ar: "الإيقاف والإغلاق" }, paras: [
      { en: "We may remove a listing or pause an account that breaks these terms or the marketplace rules, and we'll tell you why. You can close your account at any time from Help.", ar: "قد نزيل منتجاً أو نوقف حساباً يخالف هذه الشروط أو قواعد السوق، ونوضح لك السبب. تقدر تقفل حسابك في أي وقت من صفحة المساعدة." },
    ] },
    { id: "changes", title: { en: "Changes to these terms", ar: "تغيير الشروط" }, paras: [
      { en: "If we make a material change, we'll tell you by email or in your workspace before it applies.", ar: "إذا أجرينا تغييراً جوهرياً نبلغك بالإيميل أو في مساحتك قبل تطبيقه." },
    ] },
    { id: "law", title: { en: "Governing law", ar: "النظام الحاكم" }, paras: [
      { en: "These terms are governed by the laws of the Kingdom of Saudi Arabia. Disputes go to the competent courts in the Kingdom.", ar: "تخضع هذه الشروط لأنظمة المملكة العربية السعودية، وتختص محاكم المملكة المختصة بأي نزاع." },
    ] },
  ],
};

export const PRIVACY: LegalContent = {
  title: { en: "Privacy policy", ar: "سياسة الخصوصية" },
  lead: { en: "What personal data Hukum collects, why, who sees it, and your rights under Saudi Arabia's Personal Data Protection Law (PDPL).", ar: "البيانات الشخصية اللي يجمعها حكم، وليش، ومين يشوفها، وحقوقك حسب نظام حماية البيانات الشخصية." },
  summary: [
    { en: "We collect what's needed to run the marketplace: your account, your company details, your requests, quotes and messages.", ar: "نجمع ما يلزم لتشغيل السوق: حسابك وبيانات شركتك وطلباتك وعروضك ورسائلك." },
    { en: "Suppliers see what you need, not who you are, until you choose to share your contact details.", ar: "الموردون يشوفون احتياجك، لا هويتك، إلى أن تختار مشاركة بيانات تواصلك." },
    { en: "We don't sell personal data.", ar: "لا نبيع البيانات الشخصية." },
    { en: "You can see, correct, download or delete your data. Ask from Help or email support@hukum.sa.", ar: "تقدر تطلع على بياناتك وتصححها وتنزلها أو تحذفها. اطلب من المساعدة أو على support@hukum.sa." },
  ],
  sections: [
    { id: "who", title: { en: "Who is responsible", ar: "الجهة المسؤولة" }, paras: [
      { en: "Hukum is the controller of the personal data described here. Contact us at support@hukum.sa for anything about your data.", ar: "حكم هو المتحكم بالبيانات الشخصية الموضحة هنا. تواصل معنا على support@hukum.sa لأي شيء يخص بياناتك." },
    ] },
    { id: "collect", title: { en: "What we collect", ar: "ما نجمعه" }, list: [
      { en: "Account details: name, email, mobile number, company and role.", ar: "بيانات الحساب: الاسم والبريد والجوال والشركة والدور." },
      { en: "Supplier details: Commercial Registration and VAT numbers, address and storefront content.", ar: "بيانات المورد: رقم السجل التجاري والرقم الضريبي والعنوان ومحتوى المتجر." },
      { en: "What you do on Hukum: requests, quotes, messages sent through the relay, saved items and contact reveals.", ar: "ما تقوم به في حكم: الطلبات والعروض والرسائل عبر الوسيط والمحفوظات وكشف بيانات التواصل." },
      { en: "Technical data: pages visited, device and browser, and an approximate location from your IP address.", ar: "بيانات تقنية: الصفحات اللي زرتها والجهاز والمتصفح وموقع تقريبي من عنوان IP." },
    ] },
    { id: "why", title: { en: "Why we use it", ar: "لماذا نستخدمها" }, list: [
      { en: "To run your account and the marketplace, including matching requests to suppliers (contract).", ar: "لتشغيل حسابك والسوق، بما فيه مطابقة الطلبات مع الموردين (العقد)." },
      { en: "To verify suppliers and prevent fraud and abuse (legitimate interest and legal obligation).", ar: "للتحقق من الموردين ومنع الاحتيال وإساءة الاستخدام (المصلحة المشروعة والالتزام النظامي)." },
      { en: "To share your contact details with a buyer or supplier when you ask us to (consent).", ar: "لمشاركة بيانات تواصلك مع مشترٍ أو مورد عندما تطلب ذلك (الموافقة)." },
      { en: "To keep the site secure and improve it (legitimate interest).", ar: "لحماية الموقع وتحسينه (المصلحة المشروعة)." },
      { en: "To meet tax, commercial and other legal requirements (legal obligation).", ar: "للوفاء بالمتطلبات الضريبية والتجارية وغيرها (الالتزام النظامي)." },
    ] },
    { id: "share", title: { en: "Who sees your data", ar: "من يطلع على بياناتك" }, list: [
      { en: "Suppliers invited to your request see the items, quantities, delivery city and dates, not your name, company or contact details, until you share them.", ar: "الموردون المدعوون لطلبك يشوفون البنود والكميات ومدينة التوصيل والتواريخ، لا اسمك أو شركتك أو بيانات تواصلك، لين تشاركها." },
      { en: "Buyers see a supplier's public storefront. A supplier's phone and email are shared only through a consented reveal.", ar: "المشترون يشوفون صفحة المورد العامة. جوال المورد وبريده يُشاركان فقط عبر كشف بموافقة." },
      { en: "Service providers who host the site and send email and SMS for us, under contract and only for that purpose.", ar: "مزودو الخدمة اللي يستضيفون الموقع ويرسلون البريد والرسائل نيابة عنا، بموجب عقد ولهذا الغرض فقط." },
      { en: "Authorities, when Saudi law requires it.", ar: "الجهات الرسمية، عندما يتطلب النظام السعودي ذلك." },
    ] },
    { id: "where", title: { en: "Where your data is kept", ar: "أين تُحفظ بياناتك" }, paras: [
      { en: "We aim to keep personal data in Saudi Arabia. If any processing happens outside the Kingdom, we follow the PDPL rules for transfers.", ar: "نسعى لحفظ البيانات الشخصية داخل السعودية. وإذا تمت أي معالجة خارج المملكة نتبع أحكام النظام الخاصة بالنقل." },
    ] },
    { id: "keep", title: { en: "How long we keep it", ar: "مدة الحفظ" }, paras: [
      { en: "We keep your data while your account is open. After you close it, we delete or anonymise it, except what the law requires us to keep, such as commercial and tax records.", ar: "نحفظ بياناتك ما دام حسابك مفتوحاً. بعد إغلاقه نحذفها أو نجعلها مجهولة، عدا ما يلزمنا النظام بحفظه كالسجلات التجارية والضريبية." },
    ] },
    { id: "rights", title: { en: "Your rights", ar: "حقوقك" }, list: [
      { en: "Know how your data is used, which is this page.", ar: "معرفة كيفية استخدام بياناتك، وهي هذه الصفحة." },
      { en: "Access your data and get a copy.", ar: "الاطلاع على بياناتك والحصول على نسخة منها." },
      { en: "Correct anything that's wrong. Most of it you can edit yourself in Settings.", ar: "تصحيح أي خطأ. أغلبها تقدر تعدله بنفسك من الإعدادات." },
      { en: "Ask us to delete it, and withdraw consent you gave.", ar: "طلب حذفها، وسحب موافقة أعطيتها." },
      { en: "Complain to the Saudi Data and AI Authority (SDAIA) if you're unhappy with how we handled a request.", ar: "تقديم شكوى للهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا) إذا لم تكن راضياً عن تعاملنا مع طلبك." },
    ] },
    { id: "security", title: { en: "Security", ar: "الأمان" }, paras: [
      { en: "Passwords are stored hashed, connections are encrypted, and access to personal data inside Hukum is limited to the people who need it. If a breach affects you, we'll tell you and the authorities as the law requires.", ar: "كلمات المرور تُحفظ مشفّرة، والاتصالات مشفّرة، والوصول للبيانات داخل حكم محصور بمن يحتاجه. إذا أثّر عليك أي اختراق نبلغك ونبلغ الجهات كما يتطلب النظام." },
    ] },
    { id: "cookies", title: { en: "Cookies", ar: "ملفات تعريف الارتباط" }, paras: [
      { en: "We use cookies to keep you signed in and remember your language, and to understand how the site is used.", ar: "نستخدم ملفات تعريف الارتباط لإبقائك مسجلاً وتذكر لغتك، ولفهم طريقة استخدام الموقع." },
    ] },
    { id: "minors", title: { en: "Under 18s", ar: "من هم دون ١٨" }, paras: [
      { en: "Hukum is a business service and isn't meant for anyone under 18.", ar: "حكم خدمة للأعمال وغير موجه لمن هم دون ١٨ سنة." },
    ] },
  ],
};

export const RULES: LegalContent = {
  title: { en: "Marketplace rules", ar: "قواعد السوق" },
  lead: { en: "How buyers and suppliers are expected to behave on Hukum, and what happens when someone doesn't.", ar: "السلوك المتوقع من المشترين والموردين في حكم، وما يحدث عند المخالفة." },
  summary: [
    { en: "Be who you say you are, and list or request only what's real.", ar: "كن من تقول إنك هو، واعرض أو اطلب ما هو حقيقي فقط." },
    { en: "Keep first contact on Hukum and use contact details only for the enquiry.", ar: "خلّ أول تواصل في حكم واستخدم بيانات التواصل للاستفسار فقط." },
    { en: "Report anything that looks wrong. We look at every report.", ar: "بلّغ عن أي شيء يبدو غلط. نراجع كل بلاغ." },
  ],
  sections: [
    { id: "everyone", title: { en: "For everyone", ar: "للجميع" }, list: [
      { en: "Use your real name and your company's real details.", ar: "استخدم اسمك الحقيقي وبيانات شركتك الحقيقية." },
      { en: "Be respectful in messages. No harassment, threats or abuse.", ar: "كن محترماً في الرسائل. بدون مضايقة أو تهديد أو إساءة." },
      { en: "Keep the first contact on Hukum. Don't ask for payment or bank details in a first message.", ar: "خلّ أول تواصل داخل حكم. لا تطلب دفعاً أو بيانات بنكية في أول رسالة." },
      { en: "Use contact details only for the enquiry they were shared for.", ar: "استخدم بيانات التواصل فقط للاستفسار اللي شوركت له." },
    ] },
    { id: "suppliers", title: { en: "For suppliers", ar: "للموردين" }, list: [
      { en: "Show real photos of the product you'll supply and its actual brand. No counterfeits.", ar: "اعرض صوراً حقيقية للمنتج اللي بتورده وعلامته الفعلية. بدون تقليد." },
      { en: "Make prices clear, and say whether they include 15% VAT.", ar: "وضّح الأسعار وهل تشمل ضريبة القيمة المضافة ١٥٪." },
      { en: "Quote only what you can deliver, in the lead time you state.", ar: "سعّر فقط ما تقدر توفره، بالمدة اللي تذكرها." },
      { en: "Honour a quote until its validity date, or withdraw it with a reason.", ar: "التزم بعرضك حتى تاريخ صلاحيته، أو اسحبه مع ذكر السبب." },
      { en: "Answer the requests you receive, even if it's to pass.", ar: "رد على الطلبات اللي توصلك، حتى لو بالاعتذار." },
      { en: "Keep your CR, VAT registration and product licences current.", ar: "حافظ على سريان سجلك التجاري وتسجيلك الضريبي وتراخيص منتجاتك." },
    ] },
    { id: "buyers", title: { en: "For buyers", ar: "للمشترين" }, list: [
      { en: "Send requests you intend to buy against, with real quantities and delivery details.", ar: "أرسل طلبات تنوي الشراء بناءً عليها، بكميات وبيانات توصيل حقيقية." },
      { en: "Don't use requests to collect competitors' prices.", ar: "لا تستخدم الطلبات لجمع أسعار المنافسين." },
      { en: "Let suppliers know when you've chosen, so they can stop following up.", ar: "بلّغ الموردين لما تختار، عشان يوقفون المتابعة." },
    ] },
    { id: "listings", title: { en: "Listings we remove", ar: "المنتجات اللي نزيلها" }, list: [
      { en: "Prohibited or illegal items, and regulated items without a licence.", ar: "المنتجات الممنوعة أو المخالفة، والمنظمة بدون ترخيص." },
      { en: "Misleading photos, names, prices or specifications.", ar: "الصور أو الأسماء أو الأسعار أو المواصفات المضللة." },
      { en: "Duplicates of the same product posted to take more space in search.", ar: "تكرار نفس المنتج لأخذ مساحة أكبر في البحث." },
      { en: "Contact details placed in product names, photos or descriptions to bypass the relay.", ar: "وضع بيانات التواصل في أسماء المنتجات أو صورها أو أوصافها لتجاوز الوسيط." },
    ] },
    { id: "enforcement", title: { en: "When rules are broken", ar: "عند المخالفة" }, paras: [
      { en: "Depending on how serious it is, we may warn you, remove a listing, pause your account or close it. We tell you what happened and why.", ar: "حسب خطورة المخالفة، قد ننبهك أو نزيل منتجاً أو نوقف حسابك مؤقتاً أو نقفله. ونوضح لك ما حدث ولماذا." },
      { en: "If you think we got it wrong, reply from Help and a person will look at it again.", ar: "إذا تشوف إننا أخطأنا، رد من صفحة المساعدة وبيراجعها شخص مرة ثانية." },
    ] },
    { id: "report", title: { en: "Reporting a problem", ar: "الإبلاغ عن مشكلة" }, paras: [
      { en: "Use “Report a concern” in the footer, or the report link on any supplier page. If you've been asked to pay into an unexpected bank account, don't pay and report it straight away.", ar: "استخدم «الإبلاغ عن مشكلة» أسفل الصفحة، أو رابط البلاغ في صفحة أي مورد. إذا طُلب منك الدفع لحساب بنكي غير متوقع، لا تدفع وبلّغ فوراً." },
    ] },
  ],
};
