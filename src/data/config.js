/**
 * Tuning constants — Operations Highway MVP
 */
export const CONFIG = {
  // Lanes: world X positions (center = 0)
  LANES: [-3.2, 0, 3.2],
  LANE_INDEX: { LEFT: 0, CENTER: 1, RIGHT: 2 },

  // Movement
  BASE_SPEED: 28.5,
  /** Units per second²-ish scaling for forward speed over time */
  SPEED_RAMP: 0.145,
  /** Max multiplier on base speed from ramp + boosts */
  MAX_SPEED_MULT: 2.4,
  /** Pickup speed stacking cap (1.75 = max +75%) */
  MAX_PICKUP_SPEED_MULT: 1.75,
  LANE_LERP: 8,

  // Player hitbox (forgiving, slightly smaller than mesh)
  PLAYER_HALF_WIDTH: 0.55,
  PLAYER_HALF_DEPTH: 0.9,
  PLAYER_Y: 0.6,

  // Spawning (Z is forward; obstacles start negative, move +Z)
  SPAWN_Z: -95,
  DESPAWN_Z: 12,
  /** Minimum |Δz| between two obstacles in the same lane (fairness) */
  MIN_OBSTACLE_ALONG_Z: 26,
  /** Base interval (seconds) — lowered after warmup */
  OBSTACLE_SPAWN_BASE: 1.6,
  OBSTACLE_SPAWN_MIN: 0.7,
  PICKUP_SPAWN_BASE: 0.35,
  PICKUP_SPAWN_MIN: 0.15,
  /** First ~15s: easier spawns */
  WARMUP_SECONDS: 15,

  // Single hazard type (MVP clarity)
  OBSTACLE_KIND: "OUTAGE",
  /** Display name for HUD legend */
  OBSTACLE_NAME: "Outage",
  OBSTACLE_DAMAGE: 25,

  // Health (run survival meter)
  STARTING_HEALTH: 100,
  REMEDIATION_WRONG_PENALTY: 5,
  REMEDIATION_RESTORE: 10,

  // Scoring (per second / tick feel)
  SCORE_PER_SECOND: 12,
  SCORE_PER_UNIT_DISTANCE: 0.35,
  PICKUP_SCORE: {
    PLAYBOOK: 100,
    COLLECTION: 150,
  },
  BOOST_QUIZ_CORRECT: 250,
  BOOST_QUIZ_WRONG: 25,
  REMEDIATION_CORRECT_STREAK: 1,

  // Boost token quiz (gameplay pauses while answering)
  MAX_REMEDIATIONS: 3,

  BOOST_DURATION: 5,
  /** Seconds added to an active boost when collecting a playbook/collection */
  BOOST_EXTEND_ON_PICKUP: 2,
  /** Speed multiplier during boost */
  BOOST_SPEED_MULT: 1.85,

  // Manual boost (W / Up)
  MANUAL_BOOST_DURATION: 2.5,
  MANUAL_BOOST_MULT: 1.4,
  MANUAL_BOOST_COOLDOWN: 8,

  // Brake (S / Down)
  BRAKE_SPEED_MULT: 0.45,

  // Crash recovery quiz (same — full pause)

  // Automation Flow (streak of 3 correct)
  STREAK_FOR_FLOW: 3,
  FLOW_DURATION: 8,
  FLOW_SCORE_MULT: 1.2,
  /** Pickup pull strength toward player X */
  FLOW_MAGNET: 2.8,

  // Combo multiplier
  COMBO_WINDOW: 3,
  COMBO_BONUS: 25,

  // Near-miss
  NEAR_MISS_MARGIN: 1.2,
  NEAR_MISS_BONUS: 25,

  // School bus (Level F only)
  BUS_SPEED_MULT: 1.2,
  BUS_DAMAGE: 35,

  // Level completion
  LEVEL_DURATION: 60,

  // UI
  STATUS_MESSAGE_MS: 2200,
  STATUS_HIT_MS: 3800,
  /** How long CORRECT / WRONG result screen shows before applying & resuming */
  QUIZ_RESULT_DISPLAY_MS: 1000,
};

export const DRIVERS = {
  anshul: {
    id: "anshul",
    name: "Anshul Behl",
    car: "f1",
    country: "CA",
    photo: "./assets/anshul_tron.png",
    origin: "Toronto, Canada",
    bio: "Former neural-net architect turned full-stack automation overlord. By day, Anshul codes sentient CI/CD pipelines for Red Hat. By night, he BASE-jumps off the CN Tower and trains for competitive high diving. Father of two future cyborg engineers, husband to the only person who can beat him at chess. Once automated an entire datacenter migration during a 14-hour flight from Toronto to Tokyo — and still had time to land a perfect reverse 3.5 somersault at the hotel pool. His enemies call him 'The Optimizer.' His daughters call him dad. The grid calls him inevitable.",
  },
  andrius: {
    id: "andrius",
    name: "Andrius Benokraitis",
    car: "f1_maroon",
    country: "US",
    photo: "./assets/andrius_tron.png",
    origin: "Durham, North Carolina",
    bio: "Virginia Tech Hokie, Baltimore-born, Durham-adopted, and absolutely insufferable about AI — in the best way. Andrius will corner you at any gathering and explain why large language models are going to automate your breakfast. And you'll listen, because he's right. Leads a black-ops squad of open-source hackers dedicated to liberating enterprise software from proprietary prisons using Ansible, AI, and sheer audacity. His son Austin already has a GitHub profile with more stars than most senior engineers. His wife Kristin is the only person who can shut down an AI monologue with a single look. Has a Costco Executive membership so elite they named an aisle after him — once bought 400 pounds of chicken tenders in a single trip because 'bulk is a lifestyle, not a strategy.' His 18-wheeler runs on diesel, hubris, and a fine layer of smoke. They call him 'The Evangelist.'",
  },
  justin: {
    id: "justin",
    name: "Justin Braun",
    car: "f1_black_gold",
    country: "US",
    photo: "./assets/justin_tron.png",
    origin: "Cary, North Carolina",
    bio: "Justin Braun is the kind of guy who walks into a room and immediately needs everyone to know he's there. Not in a bad way — in a 'hold on, let me tell you about my evening' way. Prefers Club Haunted House even more than Club Aqua, and will not shut up about it. His friend built the deck there — great deck, beautiful deck, completely over-engineered. Used to be a real piece of work. Sloppy Steaks at Truffoni's — big rare steak, glass of water, slicked-back hair. You wouldn't have liked him. He's changed. Gave a keynote that was supposed to be fifteen minutes and went forty-five because he kept circling back to how the tables were the exact right shape. Has very strong opinions about whether or not bones are money. They are not. Will fight you on this. Was nominated for Baby of the Year three years running, even though he is a grown man. Won twice. They call him 'The Presentation.' The meeting could have been an email, but Justin made sure it wasn't.",
  },
  remy: {
    id: "remy",
    name: "Remy Duplantis",
    car: "f1_turquoise",
    country: "US",
    speedMult: 1.1,
    photo: "./assets/remy_tron.png",
    origin: "Raleigh, North Carolina",
    bio: "Raleigh-raised, caffeine-powered, and violently allergic to fantasy. If your game has orcs, ogres, elves, or anything remotely Tolkien-adjacent, Remy will leave the room with a look of genuine disgust. The only acceptable game genre is Formula 1. Everything else is noise. Runs a turquoise F1 car tuned 10% hotter than anything else on the grid because stock settings are for people who read the manual. Her second greatest passion is riding elevators — up and down, up and down, for hours, no destination, just vibes. Has been banned from three office buildings in downtown Raleigh for 'recreational vertical transit.' Her third greatest passion is tormenting Alex Walczyk — reprograms his keyboard shortcuts weekly and once convinced him his SSH keys had expired during a live demo. They call her 'The Streak.' By the time you see the turquoise blur, she's already lapped you.",
  },
  leo: {
    id: "leo",
    name: "Leo Gallego",
    car: "f1_purple",
    country: "AR",
    photo: "./assets/leo_tron.png",
    origin: "Buenos Aires, Argentina",
    bio: "Leo wrote his first program at age five on a Commodore 64 he found in a dumpster behind a Buenos Aires electronics shop. By twelve he had accidentally penetrated the CIA's internal network and been offered a job by three intelligence agencies before his voice had even broken. Refused all of them because the dress code forbade soccer cleats. Better at soccer than Messi — and Messi knows it. Once nutmegged an entire back line during a charity match while live-debugging a Kubernetes cluster on his phone. Despises broccoli with a fury that borders on religious conviction. Father to a daughter who already types 90 WPM at age four. His purple car is painted the exact frequency of a black light because he believes racing should feel like a rave. Won't brake. Won't yield. Won't eat his vegetables. They call him 'El Rayo.'",
  },
  michele: {
    id: "michele",
    name: "Michele Kelley",
    car: "f1_pink_gold",
    country: "US",
    photo: "./assets/michele_tron.png",
    origin: "Cary, North Carolina",
    bio: "Michele Kelley doesn't use AI — AI uses Michele Kelley, and it's grateful for the opportunity. The undisputed AIOps wizard of the Research Triangle, she runs twenty AI agents simultaneously across Claude Code, Cursor, Google Vertex, Amazon Bedrock, and three platforms she built herself that the rest of the industry hasn't discovered yet. Once connected Cisco Splunk to IBM Instana to ServiceNow in a single pipeline so cursed that all three vendors called to ask her to stop — not because it was broken, but because it was working too well. ServiceNow sent a cease-and-desist wrapped in a job offer. She declined both. Has a standing theory that Splunk dashboards are just astrology for ops engineers, and she will defend this position at any altitude, including the beach, where she conducts most of her architecture reviews from a lounge chair with her toes in the sand. Her pink and gold F1 car has an onboard LLM that trash-talks other drivers in real time. They call her 'The Operator.' Her agents never sleep, and honestly, neither does she.",
  },
  roger: {
    id: "roger",
    name: "Roger Lopez",
    car: "delorean",
    country: "US",
    photo: "./assets/roger_tron.png",
    origin: "Austin, Texas",
    bio: "Son of Cuban immigrants who taught him two things: never give up and always season the rice properly. Roger containerized his first application at age fourteen — in 2005, before Docker existed — using a hand-rolled chroot jail he built on a Pentium 4 in his parents' garage. Holds the unofficial record for most pods running on a single OpenShift cluster: 847,000, deployed via an Ansible playbook he wrote during a brisket smoke at Franklin BBQ. Has a standing reservation at every smokehouse on South Congress and once slow-cooked a 14-pound prime brisket for exactly 16 hours — timed to the minute his Helm chart rollout completed. His wife says he loves Kubernetes more than her. He has not denied it. Races his hover-converted DeLorean through the streets of Austin at 2 AM because the traffic is finally reasonable. When 1.21 gigawatts isn't enough, Roger adds more replicas. They call him 'El Orquestador.' Where he's going, he doesn't need roads.",
  },
  nuno: {
    id: "nuno",
    name: "Nuno Martins",
    car: "truck",
    country: "ZA",
    photo: "./assets/nuno_tron.png",
    origin: "Johannesburg, South Africa",
    bio: "Part security researcher, part mad scientist, fully unhinged. Nuno reverse-engineers malware before breakfast and builds Faraday cages out of braai grills for fun. When he's not dissecting zero-days, he's riding wild hippos through the Kruger bushveld — the only man the hippos respect. Father of three junior hackers, connoisseur of obscure horror films (the gorier the better), and proud owner of the most heavily fortified home lab in the Southern Hemisphere. His truck runs on diesel, paranoia, and pure adrenaline. The dark web fears him. The hippos obey him.",
  },
  hicham: {
    id: "hicham",
    name: "Hicham Mourad",
    car: "lightcycle",
    country: "CA",
    photo: "./assets/hicham_tron.png",
    origin: "Ottawa, Canada",
    bio: "Born in Beirut, forged in Ottawa, fueled by pure maple syrup. Hicham drinks a pint of the dark stuff every morning — Grade A, straight from the can, no pancakes required. Played three hours of hockey daily for twenty years straight and has the missing teeth to prove it. Basically invented the private cloud before anyone knew what a cloud was — spent a decade at VMware virtualizing things that weren't supposed to be virtualizable. His two sons think their dad is a superhero. His French Canadian wife knows he is one. Races motorcycles on weekends because four wheels are for people who need stability. His lightcycle leaves a trail of pure neon. If you see the glow in your mirror, it's already too late. They call him 'The Architect of Clouds.'",
  },
  matt: {
    id: "matt",
    name: "Matthew Packer",
    car: "f1_blue_white",
    country: "US",
    photo: "./assets/matt_tron.png",
    origin: "Greensboro, North Carolina",
    bio: "Toronto-born, Greensboro-transplanted, and still bleeding Maple Leafs blue despite decades of heartbreak — Matt will defend the Leafs' 'rebuilding year' until the heat death of the universe. Former competitive skateboarder who still kickflips in the driveway to embarrass his two kids. Married to the only person patient enough to tolerate his cloud infrastructure monologues at dinner. Speaks fluent AWS, GCP, and Azure — once deployed the same app across all three in a single afternoon just to prove vendor lock-in is a myth, then wrote a blog post about it that went mildly viral. Keeps his house so clean you could perform surgery on the kitchen counter. Hand sanitizer in every pocket, Lysol wipes in the glove box, and a personal rule that shoes never touch carpet. His new dog has its own bath schedule. Knows every Jewish deli within fifty miles and has strong opinions about pastrami thickness. They call him 'The Sanitizer.' His cloud is spotless, and so is everything else.",
  },
  aubrey: {
    id: "aubrey",
    name: "Aubrey Trotter",
    car: "f1_pink",
    country: "US",
    photo: "./assets/aubrey_tron.png",
    origin: "Durham, North Carolina",
    bio: "The only driver on the grid who debugs race strategy in her head while doing bedtime stories. Aubrey is a DevOps sorceress from Durham who once deployed a zero-downtime migration across four continents while making dinosaur chicken nuggets for her son. Graduated top of her class, married her college rival (he still can't beat her lap times), and runs the tightest CI pipeline east of the Mississippi. Her pink F1 car isn't a fashion statement — it's a warning. She color-codes everything, including her enemies. Volunteers at the Durham Food Bank on Saturdays, dominates leaderboards on Sundays. Her son thinks she works at NASA. She has not corrected him. They call her 'The Architect.' Nothing gets past The Architect.",
  },
  alex: {
    id: "alex",
    name: "Alex Walczyk",
    car: "f1_yellow",
    country: "US",
    photo: "./assets/alex_tron.png",
    origin: "Raleigh, North Carolina",
    bio: "The youngest driver on the grid and already the most dangerous. Alex graduated from NC State University with a degree in computer science and a minor in terrifying his professors. Cracked his first firewall at age 12, broke the campus speed record at 19, and had three job offers from alphabet agencies before he finished his senior thesis. Built his own racing simulator out of a stolen server rack and a go-kart chassis. Holds the unofficial world record for fastest lap while simultaneously compiling a kernel. His car is yellow because he wants you to see him coming. You still won't react in time. They call him 'The Kid.' The kid has never lost.",
  },
};

export const PICKUP_TYPES = [
  "PLAYBOOK",
  "CERTIFIED_COLLECTION",
  "POLICY_SHIELD",
  "BOOST_TOKEN",
];

export const TUTORIAL_STEPS = [
  { type: "PLAYBOOK",              kind: "pickup",   lane: 1, tip: "Collect Playbooks for +100 points!",               label: "Collect a Playbook" },
  {
    kind: "billboard",
    lane: -1,
    tip: "Billboards line the track — click one to open an interactive demo and earn +500 points!",
    label: "Open a billboard demo",
  },
  { type: "CERTIFIED_COLLECTION",  kind: "pickup",   lane: 1, tip: "Collections are worth +150 points!",               label: "Grab a Collection" },
  { type: "OUTAGE",                kind: "obstacle",  lane: 1, tip: "Dodge Outages — they drain your health!",          label: "Dodge an Outage" },
  { type: "BRAKE",                 kind: "lesson",    lane: -1, tip: "Hold S or ↓ to brake and slow down.",             label: "Learn to Brake" },
  { type: "POLICY_SHIELD",         kind: "pickup",   lane: 1, tip: "The purple pickup is a Shield — grab it!",         label: "Pick up a Shield" },
  { type: "OUTAGE",                kind: "obstacle",  lane: 1, tip: "Shield active! Hit this Outage to test it.",        label: "Test the Shield", mustHit: true },
  { type: "BOOST_TOKEN",           kind: "pickup",   lane: 1, tip: "Boost Tokens pause for a quiz — answer for speed!",  label: "Ace a Boost Quiz" },
];

export const TUTORIAL_QUIZ_QUESTION = {
  question: "According to the Q4 2024 Forrester Wave report, who is the leader in infrastructure automation?",
  options: [
    "Red Hat Ansible Automation Platform",
    "Coyote Automation Suite",
    "ACME Bloatware Enterprise",
    "Duct-Tape-as-a-Service",
  ],
  answer: 0,
  explanation: "Red Hat Ansible Automation Platform was named a Leader by Forrester.",
};

export const TUTORIAL_SPAWN_Z = -60;
export const TUTORIAL_TIP_Z = -18;

export const LEVELS = {
  A: {
    id: "A",
    /** URL segment for GitHub Pages (must match index.html & themePath slugs) */
    pathSegment: "AIOps",
    name: "AIOps",
    subtitle: "Tame the Alert Storm",
    road:     0x3a3e4c,
    roadEmissive: 0x0c1018,
    edge:     0x1a1a2e,
    edgeEmissive: 0x220044,
    laneMarker: 0x00ffcc,
    side:     0x0a0e18,
    sideEmissive: 0x0c1830,
    fog:      0x0a0e18,
    sky:      0x050510,
    sceneBg:  0x0a0e18,
    scenery: "city",
    billboards: [
      {
        id: "demo1",
        label: "Automation for AIOps",
        accent: 0x00c8ea,
        logo: "./assets/automation_for_aiops.png",
        embed:
          "https://demo.arcade.software/kCuEEAIeU2a8plQcDALz?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "Automation for AIOps — Red Hat Ansible Automation Platform",
        logoObjectFit: "cover",
      },
      {
        id: "demo2",
        label: "IBM Instana + AAP",
        accent: 0x00c8ea,
        logo: "./assets/unlock_aiops_instana_aap_arcade.png",
        embed:
          "https://demo.arcade.software/iv4MGA8BVPeEtdjNYmBM?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "Unlock AIOps with IBM Instana and Ansible Automation Platform",
        logoObjectFit: "cover",
      },
      {
        id: "demo3",
        label: "ServiceNow Leap + MCP",
        accent: 0xff6644,
        logo: "./assets/aiops_servicenow_leap_ansible_mcp.png",
        embed:
          "https://demo.arcade.software/UAt0jBV2NHwrV3rgaTQr?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "Unlock AIOps with ServiceNow Leap and Ansible MCP server",
        logoObjectFit: "cover",
      },
    ],
  },
  B: {
    id: "B",
    pathSegment: "Workflows",
    name: "Workflow orchestration",
    subtitle: "Automation & orchestration",
    road:     0x555960,
    roadEmissive: 0x0a0a0c,
    edge:     0x446633,
    edgeEmissive: 0x112200,
    laneMarker: 0xffffff,
    side:     0x2a5520,
    sideEmissive: 0x0a2200,
    fog:      0x88aacc,
    sky:      0x6699bb,
    sceneBg:  0x7799aa,
    scenery: "forest",
    music: "./assets/audio/bgm-alpine.m4a",
    billboards: [
      {
        id: "demo4",
        label: "Workflow orchestration",
        accent: 0x44bb66,
        embed: null,
        embedTitle: "Workflow orchestration — booth demos",
      },
      {
        id: "demo5",
        label: "Built to Automate track",
        accent: 0xddaa22,
        embed: null,
        embedTitle: "Built to Automate track",
      },
      {
        id: "demo6",
        label: "Arcade links coming soon",
        accent: 0x8866dd,
        embed: null,
        embedTitle: "Interactive arcade flows — publishing soon",
      },
    ],
  },
  C: {
    id: "C",
    pathSegment: "Developer-Experience",
    name: "Developer experience",
    subtitle: "Ship automation faster",
    road:     0x8b7355,
    roadEmissive: 0x1a1208,
    edge:     0xc4a84a,
    edgeEmissive: 0x332800,
    laneMarker: 0xffeecc,
    side:     0xd4b85a,
    sideEmissive: 0x332800,
    fog:      0xd4c09a,
    sky:      0xccaa77,
    sceneBg:  0xc4a870,
    scenery: "desert",
    music: "./assets/audio/bgm-desert.m4a",
    billboards: [
      {
        id: "demo7",
        label: "Ansible Dev Container in VS Code",
        accent: 0xff8844,
        logo: "./assets/installing_ansible_dev_container_in_vscode.png",
        embed:
          "https://demo.arcade.software/iKoPpilaNueRFTUzWnqL?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "Installing Ansible Dev Container in VS Code",
        logoObjectFit: "cover",
      },
      {
        id: "demo8",
        label: "Cursor + MCP for AAP",
        accent: 0xcc4466,
        logo: "./assets/cursor_mcp_aap_youtube_thumbnail.png",
        embed: "https://www.youtube.com/embed/EidwVmZQkGM?rel=0",
        embedTitle: "How to set up Cursor with MCP for Ansible Automation Platform",
        logoObjectFit: "cover",
      },
      {
        id: "demo9",
        label: "Copilot Studio + MCP",
        accent: 0x44ccaa,
        logo: "./assets/copilot_studio_mcp_aap_youtube_thumbnail.png",
        embed: "https://www.youtube.com/embed/ok_ID1Ldgds?rel=0",
        embedTitle: "Talk to your Ansible Automation Platform with AI — Copilot Studio + MCP",
        logoObjectFit: "cover",
      },
    ],
  },
  D: {
    id: "D",
    pathSegment: "Policy-and-governance",
    name: "Governance & compliance",
    subtitle: "Compliance at speed",
    road:     0x3a3828,
    roadEmissive: 0x0a0a04,
    edge:     0x4a5530,
    edgeEmissive: 0x1a2200,
    laneMarker: 0x88cc66,
    side:     0x2a3a1a,
    sideEmissive: 0x0a1a04,
    fog:      0x4a5a3a,
    sky:      0x556644,
    sceneBg:  0x3a4a2a,
    scenery: "swamp",
    music: "./assets/audio/bgm-swamp.m4a",
    billboards: [
      {
        id: "demo10",
        label: "Security automation with AAP",
        accent: 0x66aa44,
        embed: "https://interact.redhat.com/share/kS1DsZIb5aqO9s5rvw7T",
        embedTitle: "Red Hat Ansible Automation Platform for security automation",
      },
      {
        id: "demo11",
        label: "Ansible secrets + Vault",
        accent: 0xaacc22,
        logo: "./assets/manage_ansible_secrets_with_hashicorp_vault.png",
        embed:
          "https://demo.arcade.software/8wSFxhB1CT2w7Z7OWsyz?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "Manage Ansible secrets with HashiCorp Vault",
        logoObjectFit: "cover",
      },
      {
        id: "demo12",
        label: "Vault & Ansible integration",
        accent: 0x44aa88,
        embed:
          "https://demo.arcade.software/WSh5uLpMzwN5Eb4ojTK7?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "Vault & Ansible — Arcade flow",
      },
    ],
  },
  E: {
    id: "E",
    pathSegment: "Infrastructure-and-network",
    name: "Network & infrastructure",
    subtitle: "Day 2 at machine speed",
    road:     0x445566,
    roadEmissive: 0x060810,
    edge:     0x3388aa,
    edgeEmissive: 0x0a2244,
    laneMarker: 0xffffff,
    side:     0x2266aa,
    sideEmissive: 0x0a1844,
    fog:      0x6699bb,
    sky:      0x4488bb,
    sceneBg:  0x5599bb,
    scenery: "water",
    music: "./assets/audio/bgm-ocean.m4a",
    billboards: [
      {
        id: "demo13",
        label: "Virtualization infrastructure",
        accent: 0x44aaff,
        logo: "./assets/virtualization_infrastructure_ansible_arcade.png",
        embed:
          "https://demo.arcade.software/KlhYhTinO6JIaYtLV6uk?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "Virtualization infrastructure automation with Red Hat Ansible",
        logoObjectFit: "cover",
      },
      {
        id: "demo14",
        label: "RHEL automated management",
        accent: 0xaaddff,
        logo: "./assets/rhel_automated_management_arcade.png",
        embed:
          "https://demo.arcade.software/b4bwKoXtWj5DSaSuBjIX?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "Red Hat Enterprise Linux automated management",
        logoObjectFit: "cover",
      },
      {
        id: "demo15",
        label: "Windows VM Day 2 ops",
        accent: 0x6688cc,
        logo: "./assets/automating_day_2_windows_vm_operations.png",
        embed:
          "https://demo.arcade.software/oBoXzgiggcwGdG5DzosF?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "Automating Day 2 Windows VM operations",
        logoObjectFit: "cover",
      },
    ],
  },
  F: {
    id: "F",
    pathSegment: "AAP-on-cloud",
    name: "Cloud automation",
    subtitle: "Automate across clouds",
    road:     0x667788,
    roadEmissive: 0x0a0c10,
    edge:     0x8899aa,
    edgeEmissive: 0x112244,
    laneMarker: 0xccddff,
    side:     0xdde8f0,
    sideEmissive: 0x2a3040,
    fog:      0xc8d8e8,
    sky:      0xaabbcc,
    sceneBg:  0xbccada,
    scenery: "snow",
    music: "./assets/audio/bgm-snow.m4a",
    billboards: [
      {
        id: "demo16",
        label: "Self-healing infrastructure",
        accent: 0x22ccff,
        logo: "./assets/aiops_self_healing_infrastructure_aap.png",
        embed:
          "https://demo.arcade.software/QIkx7TMuu22RDi0nUjRA?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "AIOps — self-healing infrastructure with AAP",
        logoObjectFit: "cover",
      },
      {
        id: "demo17",
        label: "Self-healing on AWS",
        accent: 0x44ffcc,
        logo: "./assets/aiops_self_healing_aws_infrastructure_aap.png",
        embed:
          "https://demo.arcade.software/qYeocEdiSCHFkKXytJMe?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "AIOps: Self-Healing AWS Infrastructure with AAP",
        logoObjectFit: "cover",
      },
      {
        id: "demo18",
        label: "Ansible Automation on AWS",
        accent: 0x88aaff,
        logo: "./assets/ansible_automation_on_aws.png",
        embed:
          "https://demo.arcade.software/g25qlmX59RI0r6OjRjL2?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "Ansible Automation on AWS",
        logoObjectFit: "cover",
      },
    ],
  },
  G: {
    id: "G",
    pathSegment: "Metrics-and-telemetry",
    name: "Automation ROI",
    subtitle: "Visibility for operators",
    road:     0x555555,
    roadEmissive: 0x080808,
    edge:     0xcc8844,
    edgeEmissive: 0x331800,
    laneMarker: 0xffdd44,
    side:     0x7a6a50,
    sideEmissive: 0x1a1408,
    fog:      0x8aAAcc,
    sky:      0x6699cc,
    sceneBg:  0x88aacc,
    scenery: "coast",
    music: "./assets/audio/bgm-coast.m4a",
    curve: { amplitude: 5, frequency: 0.018 },
    billboards: [
      {
        id: "demo19",
        label: "Ansible Automation Dashboard installation",
        accent: 0xff8822,
        logo: "./assets/dashboard_installation.jpg",
        embed:
          "https://demo.arcade.software/rRlctHhxxxojPuls1oui?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "Ansible Automation Dashboard installation",
        logoObjectFit: "cover",
      },
      {
        id: "demo20",
        label: "Automation Dashboard",
        accent: 0xffcc44,
        logo: "./assets/Automation_dashboard.jpg",
        embed:
          "https://demo.arcade.software/G1lEX5P4rjLgAS3sjsC7?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "Automation Dashboard",
        logoObjectFit: "cover",
      },
    ],
  },
  H: {
    id: "H",
    pathSegment: "AAP-101",
    name: "Red Hat Ansible 101",
    subtitle: "Operator / ops quickstart",
    road:     0x2a2a30,
    roadEmissive: 0x040408,
    edge:     0x1a1a2e,
    edgeEmissive: 0x110022,
    laneMarker: 0xffcc00,
    side:     0x1a2218,
    sideEmissive: 0x0a1208,
    fog:      0x2a3548,
    sky:      0x182840,
    sceneBg:  0x1a2838,
    scenery: "durham",
    music: "./assets/audio/bgm-durham.m4a",
    billboards: [
      {
        id: "demo22",
        label: "Deploy & remove apps on RHEL",
        accent: 0xcc0000,
        logo: "./assets/aap_deploy_remove_apps_rhel.png",
        embed:
          "https://demo.arcade.software/WLz8bjVZ1Tw1ie8KBv7f?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "AAP — deploy and remove apps on RHEL",
        logoObjectFit: "cover",
      },
      {
        id: "demo23",
        label: "Automation intelligent assistant",
        accent: 0x0088cc,
        logo: "./assets/automation_intelligent_assistant.png",
        embed:
          "https://demo.arcade.software/6104eaB6sLcy5LB1oAzi?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "Automation intelligent assistant — Red Hat Ansible Automation Platform",
        logoObjectFit: "cover",
      },
      {
        id: "demo24",
        label: "Provision Ansible in Developer Sandbox",
        accent: 0xff9900,
        logo: "./assets/provision_ansible_dev_sandbox.png",
        embed:
          "https://demo.arcade.software/tE9tlgwEwnXUUqqUWxW5?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
        embedTitle: "Provision Ansible in Developer Sandbox",
        logoObjectFit: "cover",
      },
    ],
  },
  DS: {
    id: "DS",
    pathSegment: "Death-Star-Trench",
    name: "Death Star Trench",
    subtitle: "May the Fourth be with you",
    /** Death Star surface grey — readable, not crushed to black */
    road:     0x5c5e68,
    roadEmissive: 0x181c24,
    edge:     0x6a6c78,
    edgeEmissive: 0x22242c,
    laneMarker: 0xa8aeb8,
    side:     0x4a4c58,
    sideEmissive: 0x1a1c28,
    fog:      0x242830,
    sky:      0x0a1022,
    sceneBg:  0x121826,
    scenery: "trench",
    music: "./assets/audio/trench-run.m4a",
    billboards: [
      { id: "ds1", label: "Thermal exhaust port", accent: 0xffcc00 },
      { id: "ds2", label: "Stay on target", accent: 0xcc3333 },
      { id: "ds3", label: "Use the automation", accent: 0x4488ff },
    ],
  },
};

/** Summit Booth Themes site (paired booth pages — keep in sync with summit-booth-themes repo) */
export const SUMMIT_BOOTH_BASE = "https://abwalczyk.github.io/summit-booth-themes";

export function getSummitBoothThemeUrl(levelId) {
  const seg = LEVELS[levelId]?.pathSegment;
  return seg ? `${SUMMIT_BOOTH_BASE}/${seg}/` : null;
}
