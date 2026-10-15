/**
 * MARITIME OPERATIONS AI KNOWLEDGE BASE (MAR-KB-001)
 * Version 1.0 | Reference Date: 14 October 2026
 * Full structured knowledge base for seafarers, deck officers, captains,
 * engineers, cargo operations, safety, documentation and ship management.
 */

export interface KnowledgeSection {
  id: string;
  number: string;
  title: string;
  tags: string[];
  summary: string;
  content?: string;
  items?: string[];
  tableData?: Array<{ [key: string]: string }>;
  keyRules?: string[];
  links?: Array<{ name: string; url: string }>;
}

export interface GlossaryItem {
  abbreviation: string;
  meaning: string;
  category?: string;
}

export const KNOWLEDGE_BASE_META = {
  documentId: "MAR-KB-001",
  version: "1.0",
  referenceDate: "14 October 2026",
  title: "Maritime Seafarer & Ship Operations AI Knowledge Base",
  governance: "General reference. Does not replace vessel's approved manuals, SMS, flag-State instructions, or qualified personnel.",
};

export const PRIORITY_LABELS = [
  { label: "STATUTORY / REQUIRED", meaning: "Applicable obligation confirmed in a current official requirement for the vessel and operation." },
  { label: "VESSEL-SPECIFIC", meaning: "Requirement depends on approved plans, installed equipment, class, vessel type or company SMS." },
  { label: "CONDITIONAL", meaning: "Applies only in defined cases, such as tanker cargo, polar water, offshore DP, or certain tonnage." },
  { label: "RECOMMENDED", meaning: "Useful reference or working practice; not automatically a statutory requirement." },
  { label: "VERIFY", meaning: "Applicability or current status not confirmed. Check the official or approved source." },
];

export const MARITIME_SECTIONS: KnowledgeSection[] = [
  {
    id: "01-scope",
    number: "01",
    title: "Scope, use, and safety boundaries",
    tags: ["scope", "AI retrieval", "applicability", "source-of-truth", "safety-critical operations", "versioning"],
    summary: "A structured reference inventory for merchant shipping and related maritime operations covering people, equipment, procedures, and ship/shore workflows.",
    content: "Covers people and ranks; personal readiness; bridge and navigation; communications; deck seamanship; cargo systems; machinery and engineering; life-saving and firefighting; security; regulations; qualifications; statutory certificates; environment; port clearance; stability; calculations; safety management; logs; master data; digital systems; workflows; AI retrieval schema; glossary; source governance.",
    keyRules: [
      "SAFETY BOUNDARY: Use current approved ship documents, the responsible officer, the company SMS, flag-State rules, class requirements, and official authorities as source of truth. Never replace approved procedures or authorized human judgment.",
      "Distinguish a common practice from a legal requirement. Label uncertainty and identify which authority or approved manual must be checked.",
      "Never infer that an equipment item, certificate, or procedure is mandatory solely because it appears in this inventory.",
      "Do not fabricate log entries, certificates, inspection results, signatures, or evidence of completion."
    ]
  },
  {
    id: "02-roles",
    number: "02",
    title: "Maritime roles and responsibility map",
    tags: ["crew", "roles", "ranks", "responsibility", "captain", "master", "chief officer", "deck", "engine", "ETO", "ratings"],
    summary: "Common merchant-shipping organizational roles and functional responsibilities across Deck, Engine, Catering, and Specialist ratings.",
    content: "Each job maps to assigned duties, required qualifications, familiarization, equipment access, approvals, required records and escalation paths under the vessel's Safe Manning Document and SMS.",
    tableData: [
      { role: "Master / Captain", focus: "Overall command; safety and pollution prevention; navigation oversight; legal and company compliance; crew management; emergency command." },
      { role: "Chief Officer / Chief Mate", focus: "Deck department; cargo loading/discharge; stability and ballast; deck crew; deck maintenance; safety functions assigned by SMS." },
      { role: "Second Officer", focus: "Passage planning; charts and publications; navigation equipment and updates; assigned bridge watch." },
      { role: "Third Officer", focus: "Assigned bridge watch; inspections/maintenance of designated life-saving and firefighting equipment as assigned." },
      { role: "Deck Cadet", focus: "Supervised learning in navigation, seamanship, cargo operations, safety and recordkeeping." },
      { role: "Bosun / Boatswain", focus: "Deck ratings, maintenance, mooring, rigging and work coordination." },
      { role: "Able Seafarer Deck (AB)", focus: "Lookout, steering, mooring, deck operations, maintenance and assigned watch duties." },
      { role: "Ordinary Seafarer (OS)", focus: "Entry-level deck work under supervision; cleaning and basic maintenance." },
      { role: "Chief Engineer", focus: "Engineering department; propulsion, power generation, machinery reliability, maintenance and applicable environmental controls." },
      { role: "Second Engineer", focus: "Day-to-day engine-room coordination, machinery upkeep, operational readiness and work allocation." },
      { role: "Other Engineer Officers", focus: "Assigned machinery, watchkeeping, repair, inspection and performance monitoring." },
      { role: "Electro-Technical Officer (ETO)", focus: "Electrical power, electronic equipment, automation, instrumentation, control systems and related maintenance." },
      { role: "Engine Cadet / Engine Ratings", focus: "Supervised technical learning, machinery rounds, lubrication, cleanliness, checks and maintenance support." },
      { role: "Radio / GMDSS duty holder", focus: "Maritime distress and safety communications according to equipment, qualification and manning arrangements." },
      { role: "Cook / Steward", focus: "Food hygiene, safe storage, provisions, sanitation and accommodation services." },
      { role: "Designated Medical Care Person", focus: "Medical response within qualification, ship procedures and applicable requirements." },
      { role: "SSO / Safety roles / DPO", focus: "Specific security, safety-management or dynamic-positioning duties where applicable and assigned." }
    ],
    keyRules: [
      "Role-to-evidence principle: Do not assume a person is authorized to operate a system because the person has read about it or it appears in this knowledge base."
    ]
  },
  {
    id: "03-readiness",
    number: "03",
    title: "Personal readiness, carry-on items, and PPE",
    tags: ["personal equipment", "PPE", "joining", "passport", "seafarer book", "personal tools", "health", "digital"],
    summary: "Checklist of personal documents, protective equipment, and working tools required before joining a ship.",
    content: "Separates personal carry-on items from employer-supplied safety equipment under company policy, port security, and hazardous-area rules.",
    items: [
      "Identity & Travel: Passport, valid visas, Seafarers Identification Document (SID), Seafarer/Discharge book, Seafarers Employment Agreement (SEA), company joining letter.",
      "Certifications: Medical fitness certificate, CoC/CoP, required STCW training evidence, flag-State endorsements.",
      "PPE: Safety helmet, protective footwear, approved coveralls, hi-vis vest, safety glasses/goggles, task-appropriate gloves, hearing protection, foul weather gear.",
      "Specialist PPE: Fall-arrest harness, PFD, respiratory protection (must be approved and tested; employer supplied).",
      "Working tools: Pen, waterproof notebook, watch, flashlight with spare batteries, calculator, small measuring tape. Avoid unauthorized USB drives or unapproved electronics in hazardous zones.",
      "Health & Welfare: Prescribed medicines in original labeled containers, personal toiletries, contact family plan, familiarity with ship's medical chest access."
    ]
  },
  {
    id: "04-bridge",
    number: "04",
    title: "Bridge, navigation and passage planning",
    tags: ["bridge", "ECDIS", "charts", "radar", "ARPA", "AIS", "GNSS", "compass", "passage plan", "COLREG", "watchkeeping", "voyage"],
    summary: "Core bridge equipment, manual plotting tools, nautical publications, watchkeeping standards, and berth-to-berth voyage planning.",
    content: "Covers navigation suites, electronic navigational charts (ENCs), COLREGs, target tracking, ECDIS safety contour/depth configurations, tides, squat, under-keel clearance (UKC), and VTS pilotage.",
    items: [
      "Navigation Suite: Magnetic compass, gyrocompass and repeaters, autopilot/steering gear, rudder-angle indicator, rate-of-turn (ROT) indicator, GNSS/GPS, Doppler speed log, echo sounder.",
      "Radar & ARPA: Target tracking, restricted visibility navigation, CPA/TCPA alarms, trial manoeuvres, AIS integration.",
      "ECDIS: Electronic charts (ENCs), chart updates/AIO, safety settings (Safety Depth, Safety Contour, Shallow Contour, Deep Contour), look-ahead alarms.",
      "Passage Planning: Berth to berth (Appraisal, Planning, Execution, Monitoring), route hazards, no-go areas, safe-water channels, traffic separation schemes (TSS).",
      "Records: Deck logbook, position/watch records, compass error book, bridge order book, Master's standing orders, navigational warning file."
    ],
    keyRules: [
      "CROSS-CHECK RULE: Position, heading, course, speed, depth and target information must be assessed using suitable independent cross-checks (e.g. radar ranges, visual bearings, parallel indexing). GNSS, AIS, radar and ECDIS do not eliminate the need for a competent lookout."
    ]
  },
  {
    id: "05-comms",
    number: "05",
    title: "Maritime communications and GMDSS",
    tags: ["VHF", "MF/HF", "DSC", "GMDSS", "NAVTEX", "SafetyNET", "EPIRB", "SART", "MMSI", "SMCP", "Mayday"],
    summary: "GMDSS radio equipment, distress alerting procedures, satellite communications, and standard marine communication phrases.",
    content: "Details VHF, MF/HF with DSC, NAVTEX, SafetyNET, EPIRBs, SARTs, survival-craft radios, and official protocols for Mayday, Pan-Pan, and Sécurité.",
    tableData: [
      { system: "VHF marine radio", notes: "Short-range ship-to-ship and ship-to-shore voice communication (Ch 16 distress/calling; Ch 13 navigation safety)." },
      { system: "MF/HF radio with DSC", notes: "Longer-range radio, automated distress alerting, urgency and safety calling across Sea Areas A2/A3/A4." },
      { system: "GMDSS installation", notes: "Distress and safety radiocommunication suite tailored to ship sea areas." },
      { system: "NAVTEX receiver", notes: "Receives maritime safety information (MSI), navigational warnings and weather on 518 kHz (international) and 490 kHz." },
      { system: "SafetyNET / EGC", notes: "Satellite-based maritime safety information broadcast via Inmarsat/Iridium." },
      { system: "EPIRB", notes: "Emergency Position Indicating Radio Beacon (406 MHz COSPAS-SARSAT with GPS position & 121.5 MHz homing)." },
      { system: "SART / AIS-SART", notes: "Search and Rescue locating aid: Radar SART creates 12 blips on 9 GHz radar; AIS-SART broadcasts GPS position." },
      { system: "Portable VHF", notes: "Waterproof two-way radiotelephone apparatus for survival craft." }
    ],
    keyRules: [
      "ROLE LIMIT: Only appropriately qualified personnel holding a GOC (General Operator's Certificate) or ROC should perform functions requiring GMDSS qualifications.",
      "Distress call structure: MAYDAY (threat of grave and imminent danger), PAN-PAN (urgency message concerning safety of ship/person), SÉCURITÉ (navigational warning or meteorological warning)."
    ]
  },
  {
    id: "06-deck",
    number: "06",
    title: "Deck seamanship, mooring, anchoring and maintenance",
    tags: ["deck tools", "mooring", "anchoring", "ropes", "bosun", "lashing", "lifting gear", "rigging", "permits"],
    summary: "Safe line handling, anchor work, rigging, lifting appliance management, and deck preservation under Permit-to-Work controls.",
    content: "Covers mooring winches, bitts, fairleads, synthetic and wire ropes, windlasses, chain stoppers, accommodation/pilot ladders, and critical snap-back zone safety.",
    items: [
      "Mooring & Anchoring: Mooring lines, capstans, drums, brake holding capacity, bollards, chocks, roller fairleads, heaving lines, stoppers. Windlass, anchors, stud-link chain, shackle markings, chain locker.",
      "Safe Access: Gangways, accommodation ladders, pilot ladders (SOLAS Chapter V/23 compliant), embarkation ladders, safety nets, lifebuoy with light at gangway.",
      "Maintenance Tools: Chipping hammers, needle guns, scrapers, wire brushes, airless sprayers, paint rollers, grease guns, torque wrenches.",
      "Cargo Lifting & Rigging: Deck cranes, derricks, cargo winches, hatch cover hydraulics, twistlocks, lashing bars, turnbuckles, spreaders.",
      "Documentation: Lifting Appliance Register, thorough examination certificates, Safe Working Load (SWL) markings, rope retirement records."
    ],
    keyRules: [
      "SAFE WORKING LIMITS: Never improvise a lifting arrangement or exceed marked/approved limits.",
      "Keep completely clear of snap-back zones and never stand in the bight of a rope or under suspended loads.",
      "Permits required: Enclosed Space, Hot Work, Working Aloft/Overside, Heavy Lift, Electrical Isolation."
    ]
  },
  {
    id: "07-cargo",
    number: "07",
    title: "Cargo operations by vessel type",
    tags: ["container", "bulk", "oil tanker", "chemical tanker", "gas carrier", "ro-ro", "passenger", "offshore", "dangerous goods"],
    summary: "Operational workflows and safety regulations for Containers, Bulk Carriers, Oil/Chemical Tankers, Gas Carriers, and Ro-Ro vessels.",
    content: "Specific requirements across cargo types: Container bay plans and VGM, Bulk IMSBC liquefaction prevention, Tanker IGS and COW, Chemical IBC coatings, Gas IGC BOG systems.",
    items: [
      "Container Ships: Bay/row/tier plans, Verified Gross Mass (VGM), Cargo Securing Manual (CSM), reefer container temperature monitoring, IMDG segregation rules.",
      "Bulk Carriers: IMSBC Code, Group A (liquefaction risk/TML), Group B (chemical hazards), Group C, draft surveys, hold cleaning, de-ballasting coordination, bending moment & shear force limits.",
      "Oil Tankers: Inert Gas System (IGS < 8% O2, < 5% during transfer), closed ullaging, vapour return, Ship/Shore Safety Checklist, Crude Oil Washing (COW), manifold pressure checks.",
      "Chemical Tankers: IBC Code, tank coating compatibility, cargo compatibility charts, toxic vapour monitoring, substance-specific PPE, heating/cooling systems, stripping.",
      "Liquefied Gas Carriers: IGC Code, boil-off gas (BOG) management, emergency shutdown (ESD), cryogenic PPE, nitrogen inerting, liquid/vapour manifolds.",
      "Ro-Ro & Passenger: Ramps, car deck ventilation, gas detection, vehicle lashing, watertight doors, passenger crowd management, muster lists."
    ]
  },
  {
    id: "08-engine",
    number: "08",
    title: "Engine room, propulsion and technical systems",
    tags: ["engine room", "propulsion", "machinery", "pumps", "generators", "electrical", "HVAC", "water", "pollution control"],
    summary: "Main propulsion, auxiliary machinery, electrical power generation and distribution, automation, and PMS maintenance workflows.",
    content: "Covers main 2-stroke/4-stroke diesels, turbochargers, diesel generators, switchboards, boilers, purifiers, oily water separators (15 ppm), sewage treatment, and BWMS.",
    items: [
      "Main Propulsion: 2-stroke/4-stroke diesel, shafting, propeller, governor, fuel injection pumps, starting air compressors (30 bar), scavenge air, lube oil system, jacket cooling.",
      "Auxiliary Systems: Diesel generators, emergency generator (automatic start within 45s), auxiliary boiler, economizer, fuel purifiers/centrifuges, bilge & ballast pumps.",
      "Pollution Equipment: Oily Water Separator (OWS with 15 ppm bilge alarm and automatic stopping device), Ballast Water Management System (BWMS), sewage treatment plant, incinerator.",
      "Electrical & Automation: Main & Emergency switchboards, transformers, circuit breakers, VFDs, PLC automation, SCADA, megohmmeter (megger) insulation tests, 440V / 220V distribution.",
      "Engineering Records: Engine logbook, machinery running hours, Bunker Delivery Notes (BDNs), fuel oil analysis reports, PMS work orders, oil transfer records."
    ]
  },
  {
    id: "09-safety",
    number: "09",
    title: "Life-saving, firefighting, medical and hazardous-space safety",
    tags: ["SOLAS", "LSA", "lifejacket", "lifeboat", "liferaft", "fire", "SCBA", "EEBD", "gas detector", "medical", "enclosed space"],
    summary: "SOLAS Life-Saving Appliances (LSA Code), Fire Safety Systems (FSS Code), medical emergencies, and enclosed space entry safeguards.",
    content: "Detailed requirements for lifeboats, liferafts, immersion suits, fire pumps, SCBA, EEBDs, fixed fire systems (CO2, foam, mist), and enclosed space atmosphere testing.",
    items: [
      "LSA Equipment: SOLAS-approved lifejackets with lights and whistles, immersion suits, thermal protective aids (TPA), lifebuoys with SI lights and smoke markers.",
      "Survival Craft: Totally enclosed lifeboats, freefall lifeboats, rescue boats, davit/hydrostatic release liferafts, hydrostatic release units (HRU), line-throwing appliances, pyrotechnics (rocket parachutes, hand flares, buoyant smoke signals).",
      "Fire Fighting: Portable extinguishers (foam, dry powder, CO2), fire hoses with jet/spray nozzles, international shore connection, emergency fire pump (independent prime mover).",
      "Breathing Apparatus: Self-Contained Breathing Apparatus (SCBA) with min 1200L / 30 min duration, Emergency Escape Breathing Devices (EEBD) with min 10 min air supply.",
      "Medical: WHO International Medical Guide for Ships, ship medicine chest categories, stretcher, AED, resuscitation oxygen, burn dressing.",
      "Enclosed Space Entry: Multi-gas detector (O2 min 20.9%, LEL < 1%, CO < 25 ppm, H2S < 5 ppm), mechanical ventilation, calibrated bump test, entry permit, standby watchkeeper, retrieval tripod and harness."
    ],
    keyRules: [
      "LIFE-SAFETY CONTROL: Never enter an enclosed space based only on a reading from one unverified instrument. Follow the approved entry permit, continuous ventilation, atmosphere testing at different levels, communications, and standby rescue arrangements.",
      "Rescue attempts without proper breathing apparatus must never be undertaken — rescue attempts must not create additional casualties."
    ]
  },
  {
    id: "10-security",
    number: "10",
    title: "Ship security and access control",
    tags: ["ISPS", "SSP", "SSO", "CSO", "SSAS", "access control", "visitor log", "stowaway", "cyber security"],
    summary: "ISPS Code compliance, Security Levels 1-3, gangway access monitoring, Ship Security Plan (SSP), and maritime cyber risk management.",
    content: "Governs roles of Ship Security Officer (SSO), Company Security Officer (CSO), Port Facility Security Officer (PFSO), SSAS covert alarms, and restricted ship zones.",
    items: [
      "ISPS Security Levels: Level 1 (Normal baseline), Level 2 (Heightened risk), Level 3 (Exceptional risk/imminent danger).",
      "Access Control: Single point of access, 24/7 gangway watch, visitor ID badges, crew photo ID, baggage and stores search, deck security lighting.",
      "Restricted Areas: Bridge, engine room, steering gear room, cargo control room, emergency generator, ship stores.",
      "Ship Security Alert System (SSAS): Covert activation buttons on bridge and master's cabin sending silent distress to flag state and company without sounding local alarms.",
      "Cybersecurity: Password policies, network segregation (OT vs crew welfare Wi-Fi), USB lockdown on ECDIS and engine computers, reporting phishing/ransomware incidents."
    ],
    keyRules: [
      "Store only the metadata needed for AI retrieval. Never expose access credentials, alarm codes, restricted layout schematics, or exploitable security configurations."
    ]
  },
  {
    id: "11-regulations",
    number: "11",
    title: "Conventions, codes, regulations and nautical publications",
    tags: ["SOLAS", "STCW", "COLREG", "MARPOL", "ISM", "ISPS", "MLC", "IMDG", "IMSBC", "IBC", "IGC", "Load Lines", "BWM", "Polar Code"],
    summary: "The primary international statutory framework governing commercial shipping, seafarer rights, and marine environmental protection.",
    content: "Navigation map to international conventions: IMO conventions, ILO MLC 2006, STCW, MARPOL Annexes I-VI, and official nautical publications.",
    tableData: [
      { code: "SOLAS 1974", desc: "Safety of Life at Sea: construction, fire protection, LSA, radio (GMDSS), navigation safety, carriage of cargoes." },
      { code: "STCW 1978/2010", desc: "Standards of Training, Certification and Watchkeeping: minimum competency standards and mandatory rest hours." },
      { code: "COLREGs 1972", desc: "International Regulations for Preventing Collisions at Sea: steering and sailing rules, lights, shapes, sound signals." },
      { code: "MARPOL 73/78", desc: "Pollution prevention: Annex I (Oil), II (Noxious Liquids), III (Packaged Goods), IV (Sewage), V (Garbage), VI (Air/Emissions)." },
      { code: "Load Lines 1966", desc: "Freeboard, watertight integrity, Plimsoll mark zones (Tropical, Summer, Winter, Winter North Atlantic)." },
      { code: "ISM Code", desc: "International Safety Management: company Safety Management System (SMS), Designated Person Ashore (DPA), safety audits." },
      { code: "ISPS Code", desc: "International Ship and Port Facility Security: vessel security plans, access control, security levels." },
      { code: "MLC 2006", desc: "Maritime Labour Convention: seafarers' rights, minimum age, employment agreements, wages, hours of work/rest, repatriation, accommodation." },
      { code: "IMDG / IMSBC", desc: "International Maritime Dangerous Goods Code / International Maritime Solid Bulk Cargoes Code." },
      { code: "IBC / IGC", desc: "International Bulk Chemical Code / International Gas Carrier Code." },
      { code: "BWM Convention", desc: "Ballast Water Management: D-1 standard (exchange) and D-2 standard (treatment system)." }
    ],
    keyRules: [
      "VERSION CONTROL: Check current official publications, amendments, flag-State circulars, and vessel's approved document register before operational decisions."
    ]
  },
  {
    id: "12-qualifications",
    number: "12",
    title: "Seafarer qualifications, medical fitness and employment records",
    tags: ["CoC", "CoP", "STCW", "MARINA", "passport", "medical", "sea service", "discharge book", "employment agreement", "training"],
    summary: "STCW certification pathways, medical fitness (MLC / STCW I/9), Certificates of Competency (CoC), and Certificates of Proficiency (CoP).",
    content: "Details credentialing requirements, sea service testimonials, discharge books, and specific national references such as Philippines MARINA STCW Administration.",
    items: [
      "Core Certificates: Certificate of Competency (CoC - Officer in Charge of Navigational/Engineering Watch, Chief Mate, 2nd Engineer, Master, Chief Engineer).",
      "Certificates of Proficiency (CoP): Basic Safety Training (BST), Proficiency in Survival Craft and Rescue Boats (PSCRB), Advanced Firefighting (AFF), Medical First Aid / Medical Care, Security Awareness / DSD, Tanker Endorsements.",
      "Medical Fitness: Valid STCW / MLC compliant medical certificate issued by an approved maritime medical practitioner (maximum 2-year validity).",
      "Seafarer Employment: Seafarers Employment Agreement (SEA), company joining letter, Seafarer's Identification and Record Book (SIRB) / Discharge Book.",
      "Philippines MARINA STCW Reference: Filipino seafarers must consult the official MARINA STCW Administration portal (https://stcw.marina.gov.ph/faq-documentary-requirements/ and https://stcw.marina.gov.ph/marina-stcw-circulars/) for current circulars, MISMO portal applications, and documentary requirements."
    ]
  },
  {
    id: "13-certificates",
    number: "13",
    title: "Ship certificates, statutory documents and technical plans",
    tags: ["certificate register", "registry", "class", "statutory", "DOC", "SMC", "ISSC", "IOPP", "IAPP", "IEEC", "survey", "plans"],
    summary: "Mandatory statutory certificates under IMO FAL.2/Circ.133, classification documents, and approved vessel stability/safety plans.",
    content: "Covers Certificate of Registry, Load Line, SOLAS Safety (Construction, Equipment, Radio), DOC, SMC, ISSC, IOPP, IAPP, Minimum Safe Manning, and survey schedules.",
    tableData: [
      { cert: "Certificate of Registry", authority: "Flag State", desc: "Confirms ship nationality and legal ownership." },
      { cert: "International Tonnage Certificate (1969)", authority: "Flag / Class", desc: "Gross and Net Tonnage determination." },
      { cert: "International Load Line Certificate", authority: "Class on behalf of Flag", desc: "Assigned freeboards and seasonal marks." },
      { cert: "SOLAS Safety Construction / Equipment / Radio", authority: "Recognized Organization (Class)", desc: "Validates compliance with SOLAS Chapters II-1, II-2, III, IV." },
      { cert: "Document of Compliance (DOC) & SMC", authority: "Flag / Class", desc: "DOC for operating company; Safety Management Certificate (SMC) for ship under ISM." },
      { cert: "International Ship Security Certificate (ISSC)", authority: "RSO (Recognized Security Org)", desc: "ISPS Code compliance." },
      { cert: "Minimum Safe Manning Document", authority: "Flag Administration", desc: "Specifies required crew numbers and rank qualifications." },
      { cert: "IOPP, IAPP, IEEC, BWM Certificates", authority: "Class / Flag", desc: "Environmental certificates under MARPOL Annex I, VI, and BWM Convention." }
    ],
    items: [
      "Certificate Statuses: Applicable / Verified, Due Soon (survey approaching), Pending (endorsement/renewal in progress), Exempt, Not Applicable, Unverified."
    ]
  },
  {
    id: "14-environmental",
    number: "14",
    title: "Environmental protection and pollution records",
    tags: ["MARPOL", "Oil Record Book", "Garbage Record Book", "BDN", "ballast water", "SOPEP", "emissions", "waste"],
    summary: "MARPOL operational recordkeeping: Oil Record Book Part I/II, Garbage Record Book, Bunker Delivery Notes, and SOPEP contingency plans.",
    content: "Strict recordkeeping standards for bilge disposal, sludge incineration, bunker sampling (MARPOL Annex VI), sewage discharges, and Ballast Water D-2 compliance.",
    items: [
      "Oil Record Book (ORB) Part I: Machinery space operations (bunkering, internal fuel transfer, bilge water discharge via 15 ppm OWS, sludge tank disposal, manual bilge valve operations).",
      "Oil Record Book Part II: Cargo and ballast operations for oil tankers.",
      "Garbage Record Book (GRB): Category A (Plastics - ZERO discharge at sea), Category B (Food waste - >12nm en route, or >3nm comminuted <25mm), Category C (Domestic waste), Category D (Cooking oil), Category E (Incinerator ashes), Category F (Operational waste), Category G (Animal carcasses), Category H (Fishing gear), Category I (E-waste), Category J (Cargo residues non-HME), Category K (Cargo residues HME).",
      "Bunker Delivery Notes (BDN): Retained for 3 years, representative fuel sample sealed and signed (MARPOL sample kept for 12 months minimum), sulphur cap (0.50% global, 0.10% in ECAs).",
      "Ballast Water Record Book: Volume, date, time, geographical coordinates, method of ballast exchange or treatment (BWMS).",
      "SOPEP / SMPEP: Shipboard Oil Pollution Emergency Plan, contact lists, initial reporting steps, coastal state notifications."
    ],
    keyRules: [
      "Record actual operations accurately in real time; preserve required entries, signatures, timestamps, and retention periods. Never falsify or pre-fill entries."
    ]
  },
  {
    id: "15-port-commercial",
    number: "15",
    title: "Port clearance, customs, cargo commerce and chartering",
    tags: ["port clearance", "FAL", "crew list", "cargo declaration", "charter party", "B/L", "NOR", "SOF", "demurrage", "port call"],
    summary: "Port arrival/departure clearance formalities under IMO FAL Convention, charter party terms, Notice of Readiness, and Bill of Lading.",
    content: "Covers FAL forms (General Decl, Cargo Decl, Crew List, Stores Decl), Maritime Declaration of Health, Laytime calculations, SOF, Letters of Protest, and Maritime Single Window.",
    items: [
      "IMO FAL Forms: IMO General Declaration (FAL Form 1), Cargo Declaration (Form 2), Ship's Stores Declaration (Form 3), Crew's Effects Declaration (Form 4), Crew List (Form 5), Passenger List (Form 6), Dangerous Goods (Form 7).",
      "Health & Customs: Maritime Declaration of Health, Free Pratique, Ship Sanitation Control Exemption Certificate (SSCEC - 6 months validity), port clearance out.",
      "Chartering & Operations: Notice of Readiness (NOR) tendering upon arrival at port limits/berth, Statement of Facts (SOF) tracking cargo working time, laytime calculation, demurrage/despatch.",
      "Cargo Documents: Bill of Lading (B/L), Sea Waybill, Cargo Manifest, Certificate of Origin, Mate's Receipt, Letter of Protest (for delays, bad weather, cargo damage, discrepancy in cargo figures)."
    ]
  },
  {
    id: "16-stability-calculations",
    number: "16",
    title: "Stability, ship handling and maritime calculations",
    tags: ["stability", "GM", "GZ", "trim", "draft", "displacement", "TPC", "MCTC", "squat", "under-keel clearance", "draft survey"],
    summary: "Ship hydrostatics, intact and damage stability criteria, trim calculations, Under-Keel Clearance (UKC), squat, and passage math.",
    content: "Provides formulas, principles, and verification steps for metacentric height (GM), righting lever (GZ), draft survey, TPC, MCTC, squat in shallow water, and fuel consumption.",
    items: [
      "Stability Basics: G (Center of Gravity), B (Center of Buoyancy), M (Metacenter), GM (Metacentric Height = KM - KG). Positive GM indicates initial stability. GZ = righting arm.",
      "Free Surface Effect (FSE): Slack tanks reduce virtual GM by (i × d) / V.",
      "Trim & Draft: Trim = Aft Draft - Forward Draft. TPC = displacement required to sink 1 cm. MCTC = moment required to change trim by 1 cm. Change of Trim = Total Trim Moment / MCTC.",
      "Under-Keel Clearance (UKC): UKC = Charted Depth + Height of Tide - Ship's Dynamic Draft. Dynamic Draft = Static Draft + Squat + Heel Allowance + Safety Margin.",
      "Squat Formula: In open water: Squat ≈ Cb × V² / 100 (meters). In confined channels: Squat ≈ 2 × Cb × V² / 100 (meters), where Cb = block coefficient, V = ship speed through water in knots.",
      "Speed, Distance, ETA: Distance (nm) = Speed (knots) × Time (hours). Estimated Passage Time = Distance / Speed. ETA = Departure + Passage Time (adjusted for time zones).",
      "Fuel Consumption: Total Fuel = (Daily Consumption / 24) × Steaming Hours + Safety Reserve (normally 15-20% margin)."
    ],
    keyRules: [
      "Generic formulas must not override approved ship-specific loading software, stability booklets, or company UKC policy."
    ]
  },
  {
    id: "17-sms-permits",
    number: "17",
    title: "SMS, risk control, permits and emergency management",
    tags: ["SMS", "ISM", "PTW", "JSA", "risk assessment", "LOTO", "toolbox talk", "emergency", "drills", "incident", "near miss"],
    summary: "Safety Management System (SMS), Permit to Work (PTW) system, Job Safety Analysis (JSA), Lockout-Tagout (LOTO), and emergency scenario response.",
    content: "Comprehensive risk controls for enclosed space, hot work, working aloft/overside, electrical isolation, emergency drills, and incident investigations.",
    items: [
      "Permit-to-Work (PTW) Types: Enclosed Space Entry, Hot Work, Working Aloft / Overside, Electrical High-Voltage Isolation, Critical Heavy Lifting, Underwater / Diving.",
      "JSA / Toolbox Talk: Hazard identification, consequences, preventive controls, required PPE, emergency rescue contingency, assigned roles, stop-work authority.",
      "LOTO: Lockout/Tagout of breakers, valves, pipelines, and machinery controls before servicing.",
      "Emergency Scenarios: Fire/Explosion, Man Overboard (MOB - Williamson turn, Anderson turn, Scharnow turn), Abandon Ship, Grounding, Collision, Flooding, Blackout, Toxic gas release, Oil spill, Enclosed space rescue.",
      "Emergency Drills Cadence: Fire and Abandon Ship drills held within 24 hours of leaving port if >25% crew changed, and at least monthly for all crew under SOLAS."
    ]
  },
  {
    id: "18-logs-records",
    number: "18",
    title: "Logs, operational records and audit trail",
    tags: ["deck log", "engine log", "noon report", "rest hours", "drills", "permits", "cargo log", "Oil Record Book", "audit trail"],
    summary: "Statutory logbooks, daily noon reports, watchkeeping handovers, STCW rest-hour compliance, and VDR preservation.",
    content: "Guidelines for factual, contemporaneous, and immutable operational records across deck, engine, environmental, and crew administration.",
    items: [
      "Deck Logbook: Hourly positions, weather, sea state, barometric pressure, compass checks, lookouts on watch, course/speed adjustments, engine orders, drills, safety inspections.",
      "Engine Logbook: Running hours, temperatures, pressures, generator loads, fuel/lube tank soundings, purifier operation, bilge levels.",
      "Noon Report: Daily at 12:00 ship time. 24-hr steaming distance, average speed, main engine RPM, fuel/diesel oil consumed, lube oil consumed, freshwater produced/consumed, weather, ROB (Remaining On Board), ETA next port.",
      "Rest Hours (STCW / MLC): Minimum 10 hours rest in any 24-hour period; minimum 77 hours rest in any 7-day period. Maximum 14 hours work. Rest may be divided into no more than two periods, one of which must be at least 6 hours.",
      "Voyage Data Recorder (VDR): In event of serious marine casualty or near-miss, immediately press the VDR save button to preserve 12/48-hour audio and radar records."
    ]
  },
  {
    id: "19-master-data",
    number: "19",
    title: "Master data and maritime reference data model",
    tags: ["vessel data", "crew data", "navigation data", "cargo data", "machinery data", "environmental data", "port data", "commercial data"],
    summary: "Data structures and entities connecting vessels, crew, equipment, maintenance, voyages, and statutory certificates.",
    content: "Entity relationships: Vessel master, Crew master, Navigation dataset, Cargo dataset, Machinery dataset, Port/logistics dataset, Safety/compliance records.",
    items: [
      "Vessel Entity: IMO number, Call Sign, MMSI, Flag State, Classification Society, Gross Tonnage, Net Tonnage, Deadweight (DWT), Length Overall (LOA), Beam, Draft.",
      "Crew Entity: Seafarer ID, Name, Rank, Passport, Seaman's Book No, CoC/CoP references, Medical expiry, Next of kin, Rest hour logs.",
      "Quality Attributes: Unique ID, entity type, verification status, validity period, data sensitivity, source authority, change history."
    ]
  },
  {
    id: "20-software-cyber",
    number: "20",
    title: "Maritime software, digital systems and cyber hygiene",
    tags: ["ECDIS", "PMS", "CMMS", "crew management", "DMS", "fleet", "ERP", "port call", "satellite", "OT", "offline", "cyber"],
    summary: "Shipboard digital infrastructure, ECDIS, Planned Maintenance Systems (PMS), and IMO Resolution MSC.428(98) cyber security controls.",
    content: "Covers operational technology (OT) vs information technology (IT) separation, offline operations, intermittent satellite connectivity, and AI safety limitations.",
    keyRules: [
      "AI SYSTEM LIMIT: An AI assistant may help locate approved material and organize records, but MUST NOT become the control authority for navigation, propulsion, cargo transfer, fire systems or other safety-critical systems.",
      "Never plug unapproved USB drives or personal smartphones into ECDIS, Radar, VDR, or engine automation workstations."
    ]
  },
  {
    id: "21-lifecycle",
    number: "21",
    title: "Operating lifecycle and recurring workflows",
    tags: ["joining", "familiarization", "pre-departure", "voyage", "port arrival", "cargo", "maintenance", "emergency", "handover"],
    summary: "Chronological operational lifecycle from pre-joining through departure, ocean passage, port arrival, cargo operations, and sign-off.",
    tableData: [
      { stage: "Before joining", activities: "Identity/travel documents, medical fitness, certificates, endorsements, training, contract, joining instructions." },
      { stage: "Join and familiarize", activities: "Sign-on, identity/qualification checks, duty assignment, muster list, escape routes, safety equipment, alarms, ship familiarization." },
      { stage: "Pre-departure", activities: "Vessel readiness, passage plan, weather, bridge equipment, crew readiness, machinery, fuel/stores, cargo/stability, clearances." },
      { stage: "At sea", activities: "Watchkeeping, route/position monitoring, weather/traffic, bridge and engine checks, cargo/machinery monitoring, rest hours, logs." },
      { stage: "Port arrival/cargo", activities: "Pilot/tug/berth coordination, clearance, mooring, cargo plan, cargo watch, ballast, safety/environmental controls, cargo documents." },
      { stage: "Maintenance", activities: "PMS tasks, risk assessment, PTW, isolation, authorized work, inspection/test, defects, closeout and evidence." },
      { stage: "Emergency", activities: "Recognize/report, alarm, follow assigned duties, protect life, use designated communications, execute approved procedure." },
      { stage: "Handover/sign-off", activities: "Update logs; hand over outstanding tasks/defects/navigation/cargo status; account for documents/equipment; retain sea-service records." }
    ]
  },
  {
    id: "22-role-bundles",
    number: "22",
    title: "Role-based reference bundles",
    tags: ["captain checklist", "chief officer", "second officer", "third officer", "bosun", "chief engineer", "ETO", "cook", "medical"],
    summary: "Tailored reference bundles and priority record checklists for each maritime rank onboard.",
    tableData: [
      { role: "Master / Captain", bundle: "Ship particulars/certificates; minimum manning; passage plan; approved stability/loading; standing/night orders; muster/emergency plans; crew competency; cargo/dangerous goods; port/agent instructions; weather/warnings; statutory logs; SMS; towing procedures; voyage/charter instructions; defects/audits; emergency contacts." },
      { role: "Chief Officer", bundle: "Cargo/stability/ballast plans; cargo securing; deck maintenance; mooring and lifting gear; deck crew duty plans; inspections; permits; cargo logs; safety drills and applicable pollution plans." },
      { role: "Second Officer", bundle: "Passage plan; charts/publications; ECDIS update status; route validation; navigation equipment checks; tides/currents/weather/port references; assigned watch records." },
      { role: "Third Officer", bundle: "Assigned bridge watch procedures; life-saving/fire equipment assigned inspection records; relevant manuals; defect reporting; assigned drill/maintenance evidence." },
      { role: "Deck Cadet", bundle: "Training record book; supervised navigation/seamanship/cargo tasks; safety procedures; equipment familiarization; assessments and sea-service records." },
      { role: "Bosun / AB / OS", bundle: "Mooring/anchoring plan; deck-work risk assessments; PPE; rigging/lifting gear limits; line inspection; maintenance lists; assigned checklists and reporting path." },
      { role: "Chief Engineer", bundle: "Machinery particulars/manuals; engine logs; propulsion/power status; PMS/critical defects; fuel/lube/environmental records; spares; surveys; engineering permits; emergency and blackout procedures." },
      { role: "Engineer / ratings", bundle: "Watch/rounds instructions; machinery manuals; isolation and PTW; assigned PMS tasks; operating parameters; defect reports; spare-parts and handover records." },
      { role: "ETO", bundle: "Electrical/automation diagrams; switchboard and protection manuals; alarm/PLC documentation; calibration/testing; maintenance; cyber access policy; high-voltage controls." },
      { role: "Cook / steward", bundle: "Food storage/temperature/hygiene procedures; sanitation; provisions inventory; allergen/medical information under policy; galley safety and waste management." },
      { role: "Designated medical person", bundle: "Medical inventory/expiry; first-aid/medical procedures within qualification; medical communication; patient equipment; incident and stock records." }
    ]
  },
  {
    id: "23-readiness-checklist",
    number: "23",
    title: "General readiness checklist template",
    tags: ["readiness", "checklist", "pre-departure", "crew", "bridge", "machinery", "cargo", "safety", "port"],
    summary: "Operational checklist template covering Crew, Bridge, Engine Room, Deck/Cargo/Stability, Safety/Environment, and Port Clearance.",
    content: "Used for voyage planning, port departure verification, and ensuring all statutory conditions are met prior to single-up.",
    items: [
      "Crew & Compliance: Crew competency and medical fitness verified; certificates and endorsements valid; safe manning complied with; shipboard familiarization completed; muster list posted.",
      "Bridge & Navigation: Passage plan validated berth-to-berth; ENCs/charts and publications current; navigation warnings checked; Radar, ECDIS, AIS, GNSS operational; steering gear tested 1 hr before departure; bridge comms tested.",
      "Engine Room & Machinery: Main engine tested ahead/astern; generators synchronized; steering gear pumps tested; critical spares checked; fuel/lube/cooling levels verified; OWS and pollution equipment operational.",
      "Deck, Cargo & Stability: Cargo secured per CSM; hatches battened down; drafts and trim calculated; GM verified within limits; mooring winches and anchors ready; deadlights secured.",
      "Safety & Environment: Lifeboats and liferafts in readiness; EPIRB/SARTs tested; fire main pressurized; fire dampers tested; SOPEP gear ready; medical chest stocked.",
      "Port & Voyage Admin: Port clearance granted; outbound pilot booked; crew list and declarations signed; customs/immigration cleared; agent instructions on hand."
    ]
  },
  {
    id: "24-ai-schema",
    number: "24",
    title: "Recommended AI knowledge-base record schema",
    tags: ["schema", "taxonomy", "metadata", "chunking", "provenance", "access control", "source", "revision", "vector search"],
    summary: "The data contract and guidelines for AI answers, citations, and risk-boundary enforcement.",
    content: "Rules for AI answers: Answer direct question first; state applicability boundary and source; separate required, conditional, recommended, and unverified items; identify missing context; never fabricate compliance or readings.",
    keyRules: [
      "AI ANSWER CONTRACT:",
      "1. Answer the direct question first, then state the applicability boundary and source citation.",
      "2. Separate required, conditional, recommended, and unverified items using priority labels.",
      "3. Identify missing context instead of silently guessing vessel type, flag, rank, or cargo.",
      "4. For safety-critical questions, explicitly point to the current approved procedure and responsible qualified officer.",
      "5. For regulatory questions, quote or paraphrase the current official IMO/ILO/Flag provision accurately.",
      "6. Never fabricate compliance status, certificate validity, inspection completion, or equipment readings."
    ]
  },
  {
    id: "25-glossary",
    number: "25",
    title: "Glossary and abbreviation index",
    tags: ["glossary", "abbreviations", "IMO", "SOLAS", "STCW", "ECDIS", "GMDSS", "PMS", "PTW", "UKC", "VGM", "BDN"],
    summary: "Comprehensive maritime abbreviation index and official technical definitions across navigation, engineering, safety, and commerce.",
    content: "Definitions for over 50 essential maritime terms and acronyms."
  },
  {
    id: "26-official-sources",
    number: "26",
    title: "Official source register and maintenance plan",
    tags: ["sources", "official links", "IMO", "ILO", "MARINA", "regulations", "maintenance", "review cadence"],
    summary: "Authoritative international registers, official IMO/ILO/MARINA portals, and source verification cadence.",
    links: [
      { name: "IMO Navigation & Safety", url: "https://www.imo.org/en/ourwork/safety/pages/navigationdefault.aspx" },
      { name: "IMO SOLAS Convention", url: "https://www.imo.org/en/about/conventions/pages/international-convention-for-the-safety-of-life-at-sea-%28solas%29%2C-1974.aspx" },
      { name: "IMO STCW Training & Certification", url: "https://www.imo.org/en/ourwork/humanelement/pages/trainingcertification-default.aspx" },
      { name: "IMO Life-Saving Appliances (LSA)", url: "https://www.imo.org/en/ourwork/safety/pages/lifesavingappliances-default.aspx" },
      { name: "IMO Fire Protection (FSS)", url: "https://www.imo.org/en/ourwork/safety/pages/fireprotection-default.aspx" },
      { name: "IMO Certificates & Declarations (FAL.2/Circ.133)", url: "https://www.imo.org/en/ourwork/facilitation/pages/declarationscertificates-default.aspx" },
      { name: "ILO Maritime Labour Convention (MLC 2006)", url: "https://www.ilo.org/international-labour-standards/maritime-labour-convention-2006-0" },
      { name: "MARINA STCW Philippines Requirements", url: "https://stcw.marina.gov.ph/faq-documentary-requirements/" },
      { name: "MARINA STCW Circulars", url: "https://stcw.marina.gov.ph/marina-stcw-circulars/" }
    ]
  }
];

export const MARITIME_GLOSSARY: GlossaryItem[] = [
  { abbreviation: "AB", meaning: "Able Seafarer Deck, where used in the applicable rank structure." },
  { abbreviation: "AIS", meaning: "Automatic Identification System. Broadcasts vessel ID, position, course, speed, and voyage data." },
  { abbreviation: "ARPA", meaning: "Automatic Radar Plotting Aid. Computes targets' CPA, TCPA, true vector, and collision risk." },
  { abbreviation: "B/L", meaning: "Bill of Lading. Document of title, receipt of cargo, and contract of carriage." },
  { abbreviation: "BDN", meaning: "Bunker Delivery Note. Statutory fuel receipt kept 3 years under MARPOL Annex VI." },
  { abbreviation: "BNWAS", meaning: "Bridge Navigational Watch Alarm System. Monitors bridge watchkeeper presence and awareness." },
  { abbreviation: "BOG", meaning: "Boil-Off Gas. Evaporated cryogenic cargo gas on LNG/LPG carriers." },
  { abbreviation: "BRM / ERM", meaning: "Bridge Resource Management / Engine-room Resource Management." },
  { abbreviation: "BWMS", meaning: "Ballast Water Management System. Equipment neutralizing invasive aquatic species to D-2 standard." },
  { abbreviation: "COLREGs", meaning: "International Regulations for Preventing Collisions at Sea (1972 Rules of the Road)." },
  { abbreviation: "CoC / CoP", meaning: "Certificate of Competency / Certificate of Proficiency under STCW." },
  { abbreviation: "CSO / SSO", meaning: "Company Security Officer / Ship Security Officer under ISPS Code." },
  { abbreviation: "DSC", meaning: "Digital Selective Calling. Automated calling technique on VHF Ch 70, MF 2187.5 kHz, and HF." },
  { abbreviation: "ECDIS", meaning: "Electronic Chart Display and Information System complying with IMO standards." },
  { abbreviation: "EEBD / SCBA", meaning: "Emergency Escape Breathing Device (escape only) / Self-Contained Breathing Apparatus (firefighting/entry)." },
  { abbreviation: "EPIRB", meaning: "Emergency Position-Indicating Radio Beacon (406 MHz COSPAS-SARSAT)." },
  { abbreviation: "ETA / ETB / ETD", meaning: "Estimated Time of Arrival / Berthing / Departure." },
  { abbreviation: "GMDSS", meaning: "Global Maritime Distress and Safety System." },
  { abbreviation: "GNSS", meaning: "Global Navigation Satellite System (GPS, Galileo, GLONASS, BeiDou)." },
  { abbreviation: "GM / GZ", meaning: "Metacentric height (measure of initial stability) / righting lever or righting-arm curve." },
  { abbreviation: "IGF / IGC / IBC", meaning: "Codes covering low-flashpoint fuels / liquefied gas carriers / chemical tankers in bulk." },
  { abbreviation: "IMDG / IMSBC", meaning: "International Maritime Dangerous Goods Code / International Maritime Solid Bulk Cargoes Code." },
  { abbreviation: "IMO", meaning: "International Maritime Organization. UN specialized agency for maritime safety and pollution prevention." },
  { abbreviation: "ISPS / ISM", meaning: "International Ship and Port Facility Security Code / International Safety Management Code." },
  { abbreviation: "JSA / JHA", meaning: "Job Safety Analysis / Job Hazard Analysis." },
  { abbreviation: "LSA", meaning: "Life-Saving Appliances Code under SOLAS." },
  { abbreviation: "MARPOL", meaning: "International Convention for the Prevention of Pollution from Ships (Annexes I-VI)." },
  { abbreviation: "MCTC / TPC", meaning: "Moment to Change Trim one Centimetre / Tonnes Per Centimetre immersion." },
  { abbreviation: "MLC", meaning: "Maritime Labour Convention, 2006, as amended ('Seafarers' Bill of Rights')." },
  { abbreviation: "MMSI", meaning: "Maritime Mobile Service Identity. Unique 9-digit radio identifier for ships and coast stations." },
  { abbreviation: "NAVTEX", meaning: "Navigational Telex maritime safety information broadcast service on 518 kHz." },
  { abbreviation: "NOR / SOF", meaning: "Notice of Readiness / Statement of Facts in voyage chartering." },
  { abbreviation: "OS", meaning: "Ordinary Seafarer, entry level rank in the deck department." },
  { abbreviation: "OT / IT", meaning: "Operational Technology (engine/nav controls) / Information Technology (business/crew comms)." },
  { abbreviation: "PMS / CMMS", meaning: "Planned Maintenance System / Computerized Maintenance Management System." },
  { abbreviation: "PTW / LOTO", meaning: "Permit to Work / Lockout-Tagout system." },
  { abbreviation: "SAR / SART", meaning: "Search and Rescue / Search and Rescue Transponder (radar or AIS)." },
  { abbreviation: "SDS", meaning: "Safety Data Sheet. Chemical hazards, emergency actions, and handling measures." },
  { abbreviation: "SEEMP", meaning: "Ship Energy Efficiency Management Plan." },
  { abbreviation: "SID", meaning: "Seafarers Identification Document (ILO 185)." },
  { abbreviation: "SMS / SMC / DOC", meaning: "Safety Management System / Safety Management Certificate / Document of Compliance." },
  { abbreviation: "SOLAS", meaning: "International Convention for the Safety of Life at Sea, 1974." },
  { abbreviation: "STCW", meaning: "International Convention on Standards of Training, Certification and Watchkeeping for Seafarers." },
  { abbreviation: "SWL", meaning: "Safe Working Load of lifting appliances, wire ropes, and shackles." },
  { abbreviation: "UKC", meaning: "Under-Keel Clearance. Vertical distance between lowest part of ship's hull and seabed." },
  { abbreviation: "VDR / S-VDR", meaning: "Voyage Data Recorder / Simplified Voyage Data Recorder ('black box')." },
  { abbreviation: "VGM", meaning: "Verified Gross Mass for packed shipping containers under SOLAS VI/2." },
  { abbreviation: "VHF / MF / HF", meaning: "Very High Frequency (30-300 MHz) / Medium Frequency (300-3000 kHz) / High Frequency (3-30 MHz)." },
  { abbreviation: "VTS", meaning: "Vessel Traffic Service. Shore-side maritime traffic monitoring and routing." },
  { abbreviation: "BW / ECA / SECA", meaning: "Ballast Water / Emission Control Area / Sulphur Emission Control Area (0.10% sulphur limit)." }
];

export const MARITIME_ROLES = [
  { id: "all", label: "All Seafarers & Crew", icon: "Anchor" },
  { id: "master", label: "Master / Captain", icon: "Shield" },
  { id: "chief-mate", label: "Chief Officer / Deck", icon: "Compass" },
  { id: "second-officer", label: "2nd Officer / Nav", icon: "Map" },
  { id: "third-officer", label: "3rd Officer / Safety", icon: "LifeBuoy" },
  { id: "chief-engineer", label: "Chief Engineer", icon: "Cpu" },
  { id: "engineer", label: "Watch Engineer", icon: "Wrench" },
  { id: "eto", label: "Electro-Technical (ETO)", icon: "Zap" },
  { id: "bosun", label: "Bosun & Deck Crew", icon: "Package" },
  { id: "cadet", label: "Deck / Engine Cadet", icon: "BookOpen" },
  { id: "medical", label: "Medical Officer", icon: "HeartPulse" }
];

export const QUICK_PROMPTS = [
  {
    role: "all",
    label: "Enclosed Space Entry Controls",
    query: "What are the mandatory safety controls, atmosphere test limits, and rescue rules before entering an enclosed space?",
    badge: "Safety §09/§17"
  },
  {
    role: "all",
    label: "MARPOL Bilge & Garbage Rules",
    query: "Explain MARPOL regulations for oily bilge water discharge via OWS (15 ppm) and Garbage disposal zones.",
    badge: "Pollution §14"
  },
  {
    role: "master",
    label: "Pre-Departure Checklist",
    query: "Walk me through the essential pre-departure readiness checklist under MAR-KB-001 Section 23 for bridge, engine, and deck.",
    badge: "Readiness §23"
  },
  {
    role: "second-officer",
    label: "ECDIS Safety Settings & Contours",
    query: "How should ECDIS safety contour, safety depth, shallow contour, and deep contour be configured and cross-checked?",
    badge: "Navigation §04"
  },
  {
    role: "chief-mate",
    label: "Bulk Cargo Liquefaction & IMSBC",
    query: "What are the IMSBC Code precautions for Group A bulk cargoes prone to liquefaction and how is TML checked?",
    badge: "Cargo §07"
  },
  {
    role: "chief-engineer",
    label: "Bunker Delivery Note & Sulphur Cap",
    query: "What are the MARPOL Annex VI requirements for Bunker Delivery Notes (BDNs), fuel testing, and sulphur limits?",
    badge: "Engineering §08/§14"
  },
  {
    role: "second-officer",
    label: "UKC & Squat Estimation",
    query: "Explain the formula for calculating Under-Keel Clearance (UKC) and estimating ship squat in open vs confined channels.",
    badge: "Calculations §16"
  },
  {
    role: "cadet",
    label: "Philippines MARINA STCW Process",
    query: "What are the official MARINA STCW guidelines and circulars for Filipino seafarers renewing CoC or CoP?",
    badge: "Qualifications §12"
  }
];
