/* ============================================================
   QUICKTASK — MOCK DATA LAYER
   ------------------------------------------------------------
   This file simulates what would normally live in a database
   (Postgres/Supabase) and be served through an authenticated
   API. Every record shape here maps to a real table described
   in the case study's architecture section:

     users, provider_profiles, services, categories, tasks,
     payments, wallets, wallet_transactions, messages, reviews

   All dates are generated relative to "now" so the demo always
   looks current no matter when a recruiter opens it.
   ============================================================ */

const QT_DATA = (() => {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  const now = Date.now();

  const iso = (ms) => new Date(ms).toISOString();

  // ---------- Categories ----------
  const categories = [
    { id: "administrative", name: "Administrative", icon: "clipboard" },
    { id: "research", name: "Research", icon: "search" },
    { id: "writing", name: "Writing", icon: "pen" },
    { id: "design", name: "Design", icon: "brush" },
    { id: "business", name: "Business Support", icon: "briefcase" },
  ];

  // ---------- Providers ----------
  const providers = [
    {
      id: "prov-sofia",
      name: "Sofia Reyes",
      title: "Administrative & Data Specialist",
      avatar: "SR",
      rating: 4.9,
      reviewCount: 128,
      completedTasks: 341,
      responseTime: "Under 2 hrs",
      bio: "Detail-obsessed virtual assistant with 4 years handling data, calendars and inboxes for busy founders.",
      skills: ["Data Entry", "Spreadsheets", "Calendar Management", "Proofreading"],
    },
    {
      id: "prov-daniel",
      name: "Daniel Kim",
      title: "Research & Business Support",
      avatar: "DK",
      rating: 4.8,
      reviewCount: 96,
      completedTasks: 210,
      responseTime: "Under 3 hrs",
      bio: "Former analyst turned freelance researcher. Fast, sourced, and skeptical of anything unverified.",
      skills: ["Market Research", "Lead Research", "Data Collection"],
    },
    {
      id: "prov-mia",
      name: "Mia Santos",
      title: "Presentation & Visual Design",
      avatar: "MS",
      rating: 5.0,
      reviewCount: 74,
      completedTasks: 158,
      responseTime: "Under 4 hrs",
      bio: "Designs decks and social assets that don't look like they were made at midnight (even when they were).",
      skills: ["Presentation Design", "Social Graphics", "Image Editing"],
    },
    {
      id: "prov-liam",
      name: "Liam Cruz",
      title: "Writing & Editing",
      avatar: "LC",
      rating: 4.7,
      reviewCount: 61,
      completedTasks: 132,
      responseTime: "Under 5 hrs",
      bio: "Copyeditor and transcriptionist who reads your document like it's going to print tomorrow.",
      skills: ["Proofreading", "Transcription", "Copywriting"],
    },
  ];

  // ---------- Services ----------
  // price in USD cents, turnaround in hours (min-max)
  const services = [
    {
      id: "svc-data-entry",
      category: "administrative",
      name: "Data Entry",
      shortDesc: "Clean, accurate entry into the sheet or system of your choice.",
      description:
        "Hand off spreadsheets, forms, or scanned records and get them entered accurately into the format you need — Excel, Google Sheets, Airtable, or a CRM.",
      whatsIncluded: [
        "Manual entry with a double-check pass",
        "Formatting to match your existing template",
        "A short completion note flagging anything unclear",
      ],
      requirements: ["Source files or access to the records", "Target template or sheet, if you have one"],
      startingPrice: 2500,
      turnaround: [24, 48],
      providerId: "prov-sofia",
      rating: 4.9,
      reviewCount: 54,
    },
    {
      id: "svc-doc-formatting",
      category: "administrative",
      name: "Document Formatting",
      shortDesc: "Turn a messy draft into a clean, consistent document.",
      description:
        "Consistent headings, spacing, styles and layout across a Word or Google Doc — good for reports, proposals, and policy documents.",
      whatsIncluded: ["Consistent heading & style structure", "Table of contents if needed", "Export in your preferred format"],
      requirements: ["The document", "Any brand or style guide you follow"],
      startingPrice: 2000,
      turnaround: [24, 48],
      providerId: "prov-sofia",
      rating: 4.8,
      reviewCount: 39,
    },
    {
      id: "svc-spreadsheet-cleanup",
      category: "administrative",
      name: "Spreadsheet Cleanup",
      shortDesc: "De-duplicate, reformat, and organize an unruly spreadsheet.",
      description:
        "Removes duplicates, fixes broken formulas, standardizes formatting, and organizes tabs so the sheet is usable again.",
      whatsIncluded: ["Duplicate & error removal", "Consistent formatting", "Short summary of what changed"],
      requirements: ["Edit access or a copy of the file"],
      startingPrice: 3000,
      turnaround: [24, 48],
      providerId: "prov-sofia",
      rating: 4.9,
      reviewCount: 47,
    },
    {
      id: "svc-calendar-org",
      category: "administrative",
      name: "Calendar Organization",
      shortDesc: "A week (or month) of your calendar, sorted and conflict-free.",
      description:
        "Reviews your calendar for conflicts, batches similar meetings, and sets up recurring blocks the way you actually work.",
      whatsIncluded: ["Conflict resolution", "Recurring block setup", "Written summary of changes"],
      requirements: ["Calendar access (view or edit, your choice)"],
      startingPrice: 2200,
      turnaround: [24, 48],
      providerId: "prov-sofia",
      rating: 4.7,
      reviewCount: 22,
    },
    {
      id: "svc-online-research",
      category: "research",
      name: "Online Research",
      shortDesc: "A sourced answer to a specific research question.",
      description:
        "Focused research on a topic you give us, delivered as a short brief with sources — not a pile of unsorted links.",
      whatsIncluded: ["Written brief with sources", "Key findings summarized up top", "Follow-up Q&A included"],
      requirements: ["A clear research question", "Any sources to avoid or already reviewed"],
      startingPrice: 3500,
      turnaround: [24, 48],
      providerId: "prov-daniel",
      rating: 4.8,
      reviewCount: 61,
    },
    {
      id: "svc-competitor-research",
      category: "research",
      name: "Competitor Research",
      shortDesc: "See what 3–5 competitors are actually doing.",
      description:
        "A side-by-side comparison of your chosen competitors — pricing, positioning, and anything notable in how they sell.",
      whatsIncluded: ["Comparison table", "Notable findings write-up", "Screenshots where useful"],
      requirements: ["List of competitors", "What you're trying to decide"],
      startingPrice: 4500,
      turnaround: [24, 48],
      providerId: "prov-daniel",
      rating: 4.9,
      reviewCount: 33,
    },
    {
      id: "svc-lead-research",
      category: "business",
      name: "Lead Research",
      shortDesc: "A list of qualified leads, with contact details.",
      description:
        "Builds a list of prospects matching your criteria, verified and organized so your outreach can start right away.",
      whatsIncluded: ["Verified contact list (CSV)", "Filtered by your criteria", "Source notes per lead"],
      requirements: ["Ideal customer profile", "Preferred list size"],
      startingPrice: 4000,
      turnaround: [24, 48],
      providerId: "prov-daniel",
      rating: 4.7,
      reviewCount: 28,
    },
    {
      id: "svc-data-collection",
      category: "research",
      name: "Data Collection",
      shortDesc: "Structured data pulled from sites, PDFs, or listings.",
      description:
        "Gathers and organizes data points from the sources you specify into a clean, ready-to-use spreadsheet.",
      whatsIncluded: ["Structured spreadsheet output", "Source column for every row", "Basic validation pass"],
      requirements: ["Source list or search criteria", "Fields you need collected"],
      startingPrice: 3200,
      turnaround: [24, 48],
      providerId: "prov-daniel",
      rating: 4.8,
      reviewCount: 19,
    },
    {
      id: "svc-proofreading",
      category: "writing",
      name: "Proofreading",
      shortDesc: "A careful pass for grammar, clarity, and consistency.",
      description:
        "Line-by-line proofreading for grammar, spelling, punctuation, and consistency — tracked changes so you can see every edit.",
      whatsIncluded: ["Tracked-changes edit", "Consistency pass (terms, formatting)", "Short notes on recurring issues"],
      requirements: ["The document", "Style guide, if any (AP, APA, house style)"],
      startingPrice: 1800,
      turnaround: [24, 48],
      providerId: "prov-liam",
      rating: 4.8,
      reviewCount: 88,
    },
    {
      id: "svc-transcription",
      category: "writing",
      name: "Transcription",
      shortDesc: "Audio or video, transcribed and timestamped.",
      description:
        "Accurate transcription of interviews, meetings, or recordings, with timestamps and speaker labels on request.",
      whatsIncluded: ["Full text transcript", "Speaker labels", "Timestamps every 60 seconds"],
      requirements: ["Audio/video file or link", "Number of speakers"],
      startingPrice: 2600,
      turnaround: [24, 48],
      providerId: "prov-liam",
      rating: 4.7,
      reviewCount: 41,
    },
    {
      id: "svc-copywriting",
      category: "writing",
      name: "Copywriting Assistance",
      shortDesc: "Polished copy for a page, post, or short email.",
      description:
        "Turns your rough notes or bullet points into clear, on-tone copy for a landing page section, post, or short email.",
      whatsIncluded: ["Draft copy in your tone", "One revision round", "Plain-text and formatted versions"],
      requirements: ["What it's for and who it's talking to", "Any brand voice notes"],
      startingPrice: 3000,
      turnaround: [24, 48],
      providerId: "prov-liam",
      rating: 4.6,
      reviewCount: 25,
    },
    {
      id: "svc-presentation-design",
      category: "design",
      name: "Presentation Design",
      shortDesc: "A deck that looks like it took a week, not a night.",
      description:
        "Redesigns your slide content into a clean, consistent deck — one template, readable layouts, no clip art.",
      whatsIncluded: ["Full deck redesign (up to 20 slides)", "Editable source file", "One revision round"],
      requirements: ["Slide content or outline", "Brand colors/logo if any"],
      startingPrice: 6000,
      turnaround: [24, 48],
      providerId: "prov-mia",
      rating: 5.0,
      reviewCount: 52,
    },
    {
      id: "svc-social-graphics",
      category: "design",
      name: "Social Media Graphics",
      shortDesc: "A set of on-brand posts, sized for every platform.",
      description:
        "A batch of social graphics matched to your brand, delivered pre-sized for Instagram, LinkedIn, and Facebook.",
      whatsIncluded: ["5 graphics, 3 platform sizes each", "Source files", "Caption suggestions"],
      requirements: ["Brand colors/logo/fonts", "Topics or copy for each post"],
      startingPrice: 4500,
      turnaround: [24, 48],
      providerId: "prov-mia",
      rating: 4.9,
      reviewCount: 30,
    },
    {
      id: "svc-image-editing",
      category: "design",
      name: "Basic Image Editing",
      shortDesc: "Background removal, resizing, and touch-ups.",
      description:
        "Quick, clean edits — background removal, cropping, resizing, and basic color/exposure correction.",
      whatsIncluded: ["Up to 10 images edited", "Consistent sizing/format", "Source + web-ready exports"],
      requirements: ["Images", "What needs fixing per image, if not obvious"],
      startingPrice: 1500,
      turnaround: [24, 48],
      providerId: "prov-mia",
      rating: 4.8,
      reviewCount: 20,
    },
    {
      id: "svc-email-org",
      category: "business",
      name: "Email Organization",
      shortDesc: "An inbox sorted into folders you'll actually use.",
      description:
        "Sorts a backlog into labeled folders, unsubscribes from clutter, and sets up filters so it stays that way.",
      whatsIncluded: ["Folder/label structure", "Filters for recurring senders", "Unsubscribe from list mail"],
      requirements: ["Temporary inbox access (revocable anytime)"],
      startingPrice: 2800,
      turnaround: [24, 48],
      providerId: "prov-sofia",
      rating: 4.6,
      reviewCount: 17,
    },
  ];

  // ---------- Users ----------
  const users = {
    "user-alex": {
      id: "user-alex",
      role: "customer",
      name: "Alex Morgan",
      email: "alex.morgan@example.com",
      avatar: "AM",
      preferredCurrency: "USD",
      notifications: { email: true, sms: false },
      wallet: { coins: 4200 },
    },
    "user-jamie": {
      id: "user-jamie",
      role: "customer",
      name: "Jamie Carter",
      email: "jamie.carter@example.com",
      avatar: "JC",
      preferredCurrency: "Coins",
      notifications: { email: true, sms: true },
      wallet: { coins: 900 },
    },
    "prov-sofia": {
      id: "prov-sofia",
      role: "provider",
      name: "Sofia Reyes",
      email: "sofia.reyes@example.com",
      avatar: "SR",
      wallet: { availableUSD: 41850, pendingUSD: 8000 },
    },
    "user-admin": {
      id: "user-admin",
      role: "admin",
      name: "Admin",
      email: "admin@quicktask.app",
      avatar: "QA",
    },
  };

  // ---------- Tasks ----------
  // status flow: Draft, Awaiting Payment, Paid, Pending Provider Acceptance,
  // Accepted, In Progress, Completed, Cancelled, Declined, Payment Failed,
  // Refunded, Disputed
  const tasks = [
    {
      id: "T-1042",
      customerId: "user-alex",
      providerId: "prov-sofia",
      serviceId: "svc-data-entry",
      title: "Enter Q3 vendor invoices into Sheets",
      description: "About 80 invoices (PDF) need entering into the attached Google Sheet template.",
      instructions: "One row per invoice. Flag anything missing a PO number in a comment.",
      deadline: iso(now + 2 * DAY),
      scheduledFor: iso(now + 1 * DAY + 6 * HOUR),
      status: "In Progress",
      price: 2500,
      paymentMethod: "Coins",
      createdAt: iso(now - 1 * DAY),
      history: [
        { status: "Requested", at: iso(now - 1 * DAY) },
        { status: "Paid", at: iso(now - 1 * DAY + HOUR) },
        { status: "Accepted", at: iso(now - 1 * DAY + 3 * HOUR) },
        { status: "In Progress", at: iso(now - 12 * HOUR) },
      ],
      files: ["Q3-invoices.pdf", "sheet-template.xlsx"],
    },
    {
      id: "T-1039",
      customerId: "user-alex",
      providerId: "prov-mia",
      serviceId: "svc-presentation-design",
      title: "Investor update deck redesign",
      description: "16-slide investor update, needs a clean consistent look before Thursday's board call.",
      instructions: "Keep our existing color palette (navy + gold). Charts can be simplified.",
      deadline: iso(now - 2 * DAY),
      scheduledFor: iso(now - 3 * DAY),
      status: "Completed",
      price: 6000,
      paymentMethod: "PayPal",
      createdAt: iso(now - 6 * DAY),
      history: [
        { status: "Requested", at: iso(now - 6 * DAY) },
        { status: "Paid", at: iso(now - 6 * DAY + HOUR) },
        { status: "Accepted", at: iso(now - 6 * DAY + 2 * HOUR) },
        { status: "In Progress", at: iso(now - 5 * DAY) },
        { status: "Submitted", at: iso(now - 3 * DAY - 2 * HOUR) },
        { status: "Completed", at: iso(now - 3 * DAY) },
      ],
      files: ["investor-deck-draft.pptx"],
      review: {
        rating: 5,
        categories: { quality: 5, communication: 5, speed: 4, professionalism: 5 },
        text: "Mia turned a messy deck into something we were actually proud to present. Fast turnaround too.",
        at: iso(now - 3 * DAY),
      },
    },
    {
      id: "T-1046",
      customerId: "user-jamie",
      providerId: "prov-sofia",
      serviceId: "svc-proofreading",
      title: "Proofread grad school application essays",
      description: "Two essays, 650 words each. Need a close read before Friday's deadline.",
      instructions: "Please track changes and leave comments on anything unclear.",
      deadline: iso(now + 3 * DAY),
      scheduledFor: iso(now + 2 * DAY + 4 * HOUR),
      status: "Pending Provider Acceptance",
      price: 1800,
      paymentMethod: "USD",
      createdAt: iso(now - 3 * HOUR),
      history: [
        { status: "Requested", at: iso(now - 3 * HOUR) },
        { status: "Paid", at: iso(now - 3 * HOUR + 5 * 60 * 1000) },
      ],
      files: ["essay-1.docx", "essay-2.docx"],
    },
    {
      id: "T-1050",
      customerId: "user-alex",
      providerId: "prov-daniel",
      serviceId: "svc-competitor-research",
      title: "Compare 4 project management tools",
      description: "Comparing Asana, Monday, ClickUp, and Linear for a 40-person team.",
      instructions: "Focus on pricing at our team size and onboarding time.",
      deadline: iso(now + 4 * DAY),
      scheduledFor: iso(now + 3 * DAY),
      status: "Accepted",
      price: 4500,
      paymentMethod: "USDC",
      createdAt: iso(now - 4 * HOUR),
      history: [
        { status: "Requested", at: iso(now - 4 * HOUR) },
        { status: "Paid", at: iso(now - 4 * HOUR + 5 * 60 * 1000) },
        { status: "Accepted", at: iso(now - 1 * HOUR) },
      ],
      files: [],
    },
    {
      id: "T-1028",
      customerId: "user-alex",
      providerId: "prov-sofia",
      serviceId: "svc-calendar-org",
      title: "Sort out double-booked October calendar",
      description: "October is a mess after a reorg. Needs a clean pass.",
      instructions: "",
      deadline: iso(now - 8 * DAY),
      scheduledFor: iso(now - 9 * DAY),
      status: "Cancelled",
      price: 2200,
      paymentMethod: "Coins",
      createdAt: iso(now - 11 * DAY),
      history: [
        { status: "Requested", at: iso(now - 11 * DAY) },
        { status: "Paid", at: iso(now - 11 * DAY + HOUR) },
        { status: "Cancelled", at: iso(now - 10 * DAY) },
      ],
      files: [],
      cancelReason: "Customer requested cancellation — refunded to Coins balance.",
    },
  ];

  // ---------- Messages (per task) ----------
  const messages = {
    "T-1042": [
      { from: "prov-sofia", text: "Started on these — a few invoices are missing PO numbers, flagging as I go.", at: iso(now - 10 * HOUR), read: true },
      { from: "user-alex", text: "Perfect, thank you! Don't worry about chasing those down, just flag them.", at: iso(now - 9 * HOUR), read: true },
    ],
    "T-1039": [
      { from: "prov-mia", text: "Sent the redesigned deck — let me know if the chart on slide 9 needs adjusting.", at: iso(now - 3 * DAY - HOUR), read: true },
      { from: "user-alex", text: "This is great, no changes needed. Thank you!", at: iso(now - 3 * DAY), read: true },
    ],
    "T-1046": [
      { from: "user-jamie", text: "Hi! Just flagging the deadline is firm — my application closes Friday 5pm.", at: iso(now - 2 * HOUR), read: false },
    ],
    "T-1050": [],
    "T-1028": [
      { from: "user-alex", text: "Actually need to cancel this, sorted it out myself. Sorry for the trouble!", at: iso(now - 10 * DAY), read: true },
    ],
  };

  // ---------- Wallet transactions (customer) ----------
  const walletTransactions = {
    "user-alex": [
      { id: "WT-501", type: "purchase", amount: 5000, note: "Bought 5,000 Coins", at: iso(now - 12 * DAY) },
      { id: "WT-502", type: "spend", amount: -2500, note: "Payment for T-1042", at: iso(now - 1 * DAY) },
      { id: "WT-503", type: "refund", amount: 2200, note: "Refund for cancelled T-1028", at: iso(now - 10 * DAY) },
    ],
    "user-jamie": [{ id: "WT-601", type: "purchase", amount: 1000, note: "Bought 1,000 Coins", at: iso(now - 5 * DAY) }],
  };

  // ---------- Platform-wide payment ledger (admin view) ----------
  const payments = [
    { id: "PAY-9001", taskId: "T-1042", customer: "Alex Morgan", provider: "Sofia Reyes", amount: 2500, currency: "Coins", method: "Coins", status: "Paid", at: iso(now - 1 * DAY) },
    { id: "PAY-9002", taskId: "T-1039", customer: "Alex Morgan", provider: "Mia Santos", amount: 6000, currency: "USD", method: "PayPal", status: "Paid", at: iso(now - 6 * DAY) },
    { id: "PAY-9003", taskId: "T-1046", customer: "Jamie Carter", provider: "Sofia Reyes", amount: 1800, currency: "USD", method: "Card", status: "Paid", at: iso(now - 3 * HOUR) },
    { id: "PAY-9004", taskId: "T-1050", customer: "Alex Morgan", provider: "Daniel Kim", amount: 4500, currency: "USDC", method: "Crypto", status: "Paid", at: iso(now - 4 * HOUR) },
    { id: "PAY-9005", taskId: "T-1028", customer: "Alex Morgan", provider: "Sofia Reyes", amount: 2200, currency: "Coins", method: "Coins", status: "Refunded", at: iso(now - 11 * DAY) },
  ];

  // ---------- Platform config ----------
  const config = {
    minLeadHours: 48,
    coinsPerUSD: 100, // $10 = 1,000 coins
    platformCommissionPct: 20, // provider receives 80%
    cryptoAssets: ["USDC", "USDT", "BTC", "ETH"],
  };

  return { categories, providers, services, users, tasks, messages, walletTransactions, payments, config };
})();
