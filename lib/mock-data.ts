export function mockCompanyData(companyName: string) {
  // Generate realistic mock data based on the company name
  return {
    name: companyName,
    ticker: companyName.substring(0, 4).toUpperCase(),
    sector: getSectorForCompany(companyName),
    employees: getRandomNumber(1000, 500000),
    founded: getRandomNumber(1950, 2010),

    stockPerformance: {
      // Mock data for stock performance chart
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      datasets: [
        {
          label: "Stock Price",
          data: Array(12)
            .fill(0)
            .map(() => getRandomNumber(50, 200)),
        },
      ],
    },

    revenueBreakdown: {
      // Mock data for revenue breakdown pie chart
      labels: ["Product A", "Product B", "Product C", "Services", "Other"],
      datasets: [
        {
          data: [35, 25, 20, 15, 5],
          backgroundColor: ["#4285F4", "#DB4437", "#F4B400", "#0F9D58", "#9E9E9E"],
        },
      ],
    },

    keyMetrics: [
      {
        name: "Revenue",
        value: `$${getRandomNumber(1, 999)}B`,
        change: getRandomNumber(-10, 30),
      },
      {
        name: "Net Income",
        value: `$${getRandomNumber(1, 100)}B`,
        change: getRandomNumber(-15, 40),
      },
      {
        name: "EPS",
        value: `$${getRandomNumber(1, 20)}.${getRandomNumber(10, 99)}`,
        change: getRandomNumber(-20, 50),
      },
      {
        name: "P/E Ratio",
        value: getRandomNumber(10, 40),
        change: getRandomNumber(-25, 25),
      },
    ],

    overview: {
      description: `${companyName} is a leading company in the ${getSectorForCompany(companyName)} industry, known for its innovative products and services. The company has established a strong market presence and continues to expand its operations globally.`,
      businessModel: `${companyName} operates on a ${getRandomItem(["subscription-based", "freemium", "marketplace", "direct sales", "franchise"])} business model, focusing on ${getRandomItem(["consumer", "enterprise", "government", "small business"])} customers.`,
      competitiveAdvantage: `The company's competitive advantage stems from its ${getRandomItem(["proprietary technology", "strong brand recognition", "extensive distribution network", "economies of scale", "unique intellectual property"])}.`,
      recentDevelopments: [
        `${companyName} recently announced a new ${getRandomItem(["product line", "partnership", "acquisition", "expansion plan", "sustainability initiative"])}`,
        `The company has invested $${getRandomNumber(100, 999)}M in ${getRandomItem(["R&D", "marketing", "infrastructure", "talent acquisition", "digital transformation"])}`,
        `${companyName} reported a ${getRandomNumber(5, 30)}% increase in ${getRandomItem(["user engagement", "customer retention", "market share", "operational efficiency", "profit margins"])}`,
      ],
    },

    swot: {
      strengths: [
        `Strong brand recognition in ${getRandomItem(["global", "domestic", "regional", "niche"])} markets`,
        `Diversified product/service portfolio`,
        `Robust financial position with low debt`,
        `Industry-leading innovation capabilities`,
      ],
      weaknesses: [
        `${getRandomItem(["High", "Increasing", "Volatile"])} operational costs`,
        `Dependence on ${getRandomItem(["key suppliers", "specific markets", "legacy systems", "aging infrastructure"])}`,
        `${getRandomItem(["Limited", "Declining", "Inconsistent"])} presence in emerging markets`,
      ],
      opportunities: [
        `Expansion into ${getRandomItem(["emerging markets", "adjacent industries", "new customer segments", "digital channels"])}`,
        `Growing demand for ${getRandomItem(["sustainable products", "digital solutions", "personalized services", "premium offerings"])}`,
        `Strategic acquisitions to enhance capabilities`,
      ],
      threats: [
        `Increasing competition from ${getRandomItem(["tech giants", "startups", "global players", "local specialists"])}`,
        `Regulatory changes in key markets`,
        `${getRandomItem(["Economic slowdown", "Supply chain disruptions", "Talent shortage", "Cybersecurity risks"])}`,
      ],
    },

    recentFilings: [
      {
        type: "10-K Annual Report",
        date: "Mar 15, 2023",
        description: `${companyName}'s annual report detailing financial performance and business operations for the fiscal year.`,
        url: "#",
      },
      {
        type: "10-Q Quarterly Report",
        date: "Aug 5, 2023",
        description: `Quarterly financial report for Q2 2023 showing a ${getRandomNumber(5, 20)}% increase in revenue.`,
        url: "#",
      },
      {
        type: "8-K Current Report",
        date: "Sep 12, 2023",
        description: `Disclosure of ${getRandomItem(["executive changes", "acquisition announcement", "dividend declaration", "debt restructuring"])}`,
        url: "#",
      },
      {
        type: "DEF 14A Proxy Statement",
        date: "Apr 30, 2023",
        description: "Information for shareholders regarding the annual meeting and voting matters.",
        url: "#",
      },
      {
        type: "S-4 Registration",
        date: "Jul 22, 2023",
        description: `Registration for securities related to ${getRandomItem(["merger", "acquisition", "exchange offer", "reorganization"])}`,
        url: "#",
      },
      {
        type: "Form 4",
        date: "Oct 3, 2023",
        description: `Statement of changes in beneficial ownership by ${getRandomItem(["CEO", "CFO", "CTO", "Board Director"])}`,
        url: "#",
      },
    ],

    revenueGrowth: {
      labels: ["Q1 2022", "Q2 2022", "Q3 2022", "Q4 2022", "Q1 2023", "Q2 2023"],
      datasets: [
        {
          label: "Revenue",
          data: Array(6)
            .fill(0)
            .map((_, i) => getRandomNumber(500 + i * 50, 1000 + i * 100)),
        },
      ],
    },

    profitMargins: {
      labels: ["2019", "2020", "2021", "2022", "2023"],
      datasets: [
        {
          label: "Gross Margin",
          data: Array(5)
            .fill(0)
            .map(() => getRandomNumber(60, 80)),
        },
        {
          label: "Operating Margin",
          data: Array(5)
            .fill(0)
            .map(() => getRandomNumber(20, 40)),
        },
        {
          label: "Net Margin",
          data: Array(5)
            .fill(0)
            .map(() => getRandomNumber(10, 30)),
        },
      ],
    },

    expenseBreakdown: {
      labels: ["R&D", "Sales & Marketing", "G&A", "COGS", "Other"],
      datasets: [
        {
          data: [20, 30, 15, 25, 10],
          backgroundColor: ["#4285F4", "#DB4437", "#F4B400", "#0F9D58", "#9E9E9E"],
        },
      ],
    },

    financialHighlights: [
      {
        title: "Record Revenue Growth",
        description: `${companyName} achieved record revenue of $${getRandomNumber(10, 200)}B in the last fiscal year, representing a ${getRandomNumber(5, 25)}% increase year-over-year.`,
      },
      {
        title: "Margin Expansion",
        description: `Operating margins improved by ${getRandomNumber(100, 500)} basis points, driven by operational efficiencies and scale benefits.`,
      },
      {
        title: "Capital Allocation",
        description: `The company returned $${getRandomNumber(5, 50)}B to shareholders through dividends and share repurchases, while investing $${getRandomNumber(5, 30)}B in capital expenditures.`,
      },
      {
        title: "Balance Sheet Strength",
        description: `${companyName} maintains a strong financial position with $${getRandomNumber(10, 100)}B in cash and investments and a debt-to-EBITDA ratio of ${(getRandomNumber(10, 30) / 10).toFixed(1)}x.`,
      },
    ],

    news: [
      {
        title: `${companyName} Announces ${getRandomItem(["Strategic Partnership", "Quarterly Results", "New Product Launch", "Executive Appointment", "Expansion Plans"])}`,
        source: getRandomItem(["Bloomberg", "Reuters", "Wall Street Journal", "Financial Times", "CNBC"]),
        date: "Oct 15, 2023",
        summary: `${companyName} ${getRandomItem([
          `reported Q3 earnings that exceeded analyst expectations, with revenue of $${getRandomNumber(1, 50)}B and EPS of $${getRandomNumber(1, 10)}.${getRandomNumber(10, 99)}`,
          `announced a strategic partnership with ${getRandomItem(["Microsoft", "Amazon", "Google", "Apple", "Meta"])} to develop new technologies`,
          `unveiled plans to expand operations in ${getRandomItem(["Asia", "Europe", "Latin America", "Middle East", "Africa"])}`,
          `appointed a new ${getRandomItem(["CEO", "CFO", "CTO", "COO", "CMO"])} effective next quarter`,
        ])}`,
        sentiment: getRandomItem(["positive", "negative", "neutral"]),
        url: "#",
      },
      {
        title: `Industry Analysis: ${companyName}'s Position in the Evolving Market`,
        source: getRandomItem(["Forbes", "Harvard Business Review", "The Economist", "Barron's", "Seeking Alpha"]),
        date: "Sep 28, 2023",
        summary: `A comprehensive analysis of ${companyName}'s market position reveals ${getRandomItem([
          "strengths in innovation but challenges in scaling operations",
          "competitive advantages in key markets despite increasing competition",
          "opportunities for growth through strategic acquisitions and partnerships",
          "potential risks from regulatory changes and market disruption",
        ])}`,
        sentiment: getRandomItem(["positive", "negative", "neutral"]),
        url: "#",
      },
      {
        title: `${companyName} ${getRandomItem(["Invests", "Acquires", "Partners", "Restructures", "Launches"])} to Boost Growth`,
        source: getRandomItem([
          "TechCrunch",
          "Business Insider",
          "MarketWatch",
          "Yahoo Finance",
          "Investor's Business Daily",
        ]),
        date: "Aug 17, 2023",
        summary: `${companyName} ${getRandomItem([
          `announced a $${getRandomNumber(100, 999)}M investment in ${getRandomItem(["AI", "blockchain", "cloud infrastructure", "sustainable technology", "R&D"])}`,
          `acquired ${getRandomItem(["a startup", "a competitor", "a technology provider", "a distribution network", "intellectual property"])} for $${getRandomNumber(50, 500)}M`,
          `restructured its ${getRandomItem(["operations", "leadership team", "business units", "go-to-market strategy", "supply chain"])} to improve efficiency`,
        ])}`,
        sentiment: getRandomItem(["positive", "negative", "neutral"]),
        url: "#",
      },
    ],

    sentiment: {
      analystRating: (getRandomNumber(30, 50) / 10).toFixed(1),
      newsSentiment: getRandomNumber(40, 90),
      socialSentiment: getRandomNumber(30, 95),
    },

    keyTopics: [
      { name: "Quarterly Earnings", weight: getRandomNumber(60, 100), color: "#4285F4" },
      { name: "Market Expansion", weight: getRandomNumber(40, 90), color: "#DB4437" },
      { name: "Product Innovation", weight: getRandomNumber(50, 95), color: "#F4B400" },
      { name: "Industry Trends", weight: getRandomNumber(30, 85), color: "#0F9D58" },
      { name: "Competition", weight: getRandomNumber(20, 80), color: "#9E9E9E" },
      { name: "Regulatory", weight: getRandomNumber(10, 70), color: "#4285F4" },
      { name: "Leadership", weight: getRandomNumber(15, 75), color: "#DB4437" },
      { name: "Technology", weight: getRandomNumber(25, 85), color: "#F4B400" },
      { name: "Sustainability", weight: getRandomNumber(10, 65), color: "#0F9D58" },
    ],

    executives: [
      {
        name: getRandomName(),
        title: "Chief Executive Officer",
        since: `${getRandomNumber(2010, 2022)}`,
        background: `Previously ${getRandomItem(["CEO", "COO", "President", "EVP"])} at ${getRandomCompany()}. MBA from ${getRandomItem(["Harvard", "Stanford", "Wharton", "MIT", "INSEAD"])}`,
      },
      {
        name: getRandomName(),
        title: "Chief Financial Officer",
        since: `${getRandomNumber(2015, 2022)}`,
        background: `Former ${getRandomItem(["CFO", "VP Finance", "Controller", "Treasurer"])} at ${getRandomCompany()}. CPA with experience in ${getRandomItem(["tech", "finance", "consulting", "manufacturing"])}`,
      },
      {
        name: getRandomName(),
        title: "Chief Technology Officer",
        since: `${getRandomNumber(2016, 2022)}`,
        background: `Led ${getRandomItem(["engineering", "product", "innovation", "R&D"])} at ${getRandomCompany()}. PhD in ${getRandomItem(["Computer Science", "Engineering", "Mathematics", "Physics"])}`,
      },
      {
        name: getRandomName(),
        title: "Chief Operating Officer",
        since: `${getRandomNumber(2017, 2022)}`,
        background: `${getRandomNumber(10, 25)} years of operational experience in ${getRandomItem(["global markets", "supply chain", "manufacturing", "services"])}`,
      },
    ],

    structure: {
      boardSize: getRandomNumber(8, 15),
      independentDirectors: getRandomNumber(6, 12),
      businessUnits: [
        `${getRandomItem(["Consumer", "Enterprise", "Commercial", "Industrial", "Retail"])} ${getRandomItem(["Products", "Services", "Solutions", "Systems", "Technologies"])}`,
        `${getRandomItem(["Global", "Regional", "Digital", "Advanced", "Core"])} ${getRandomItem(["Operations", "Markets", "Platforms", "Ventures", "Innovations"])}`,
        `${getRandomItem(["Strategic", "Emerging", "Specialized", "Integrated", "Professional"])} ${getRandomItem(["Services", "Products", "Solutions", "Technologies", "Applications"])}`,
      ],
      subsidiaries: [
        `${companyName} ${getRandomItem(["International", "Technologies", "Ventures", "Solutions", "Systems"])}`,
        `${getRandomItem(["Alpha", "Beta", "Nova", "Nexus", "Vertex"])} ${getRandomItem(["Technologies", "Systems", "Solutions", "Innovations", "Enterprises"])}`,
        `${getRandomItem(["Global", "Advanced", "Digital", "Smart", "Next"])} ${getRandomItem(["Technologies", "Systems", "Solutions", "Platforms", "Services"])}`,
      ],
    },

    geography: {
      headquarters: `${getRandomItem(["New York", "San Francisco", "Chicago", "Seattle", "Boston", "Austin"])}, ${getRandomItem(["USA", "United States"])}`,
      majorLocations: [
        `${getRandomItem(["London", "Paris", "Berlin", "Amsterdam", "Dublin"])}, ${getRandomItem(["UK", "France", "Germany", "Netherlands", "Ireland"])}`,
        `${getRandomItem(["Tokyo", "Singapore", "Hong Kong", "Seoul", "Shanghai"])}, ${getRandomItem(["Japan", "Singapore", "China", "South Korea", "China"])}`,
        `${getRandomItem(["Sydney", "Melbourne", "Auckland", "Mumbai", "Dubai"])}, ${getRandomItem(["Australia", "Australia", "New Zealand", "India", "UAE"])}`,
        `${getRandomItem(["Toronto", "Vancouver", "Montreal", "São Paulo", "Mexico City"])}, ${getRandomItem(["Canada", "Canada", "Canada", "Brazil", "Mexico"])}`,
      ],
      revenueByRegion: {
        "North America": getRandomNumber(30, 60),
        Europe: getRandomNumber(15, 35),
        "Asia Pacific": getRandomNumber(10, 30),
        "Rest of World": getRandomNumber(5, 15),
      },
    },

    aiSuggestions: [
      `What are ${companyName}'s main growth drivers?`,
      `How does ${companyName} compare to its competitors?`,
      `What are the key risks facing ${companyName}?`,
      `What is ${companyName}'s strategy for the next 5 years?`,
      `How might regulatory changes impact ${companyName}?`,
    ],
  }
}

// Helper functions
function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function getSectorForCompany(companyName: string) {
  const sectors = [
    "Technology",
    "Financial Services",
    "Healthcare",
    "Consumer Goods",
    "Telecommunications",
    "Energy",
    "Manufacturing",
    "Retail",
    "Media",
    "Automotive",
    "Aerospace",
    "Pharmaceuticals",
  ]

  // Use a deterministic approach based on the company name
  const hash = companyName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return sectors[hash % sectors.length]
}

function getRandomName() {
  const firstNames = [
    "James",
    "Mary",
    "John",
    "Patricia",
    "Robert",
    "Jennifer",
    "Michael",
    "Linda",
    "William",
    "Elizabeth",
    "David",
    "Susan",
    "Richard",
    "Jessica",
    "Joseph",
    "Sarah",
    "Thomas",
    "Karen",
    "Charles",
    "Nancy",
    "Christopher",
    "Lisa",
    "Daniel",
    "Margaret",
    "Matthew",
    "Betty",
    "Anthony",
    "Sandra",
    "Mark",
    "Ashley",
    "Donald",
    "Kimberly",
    "Steven",
    "Emily",
    "Paul",
    "Donna",
    "Andrew",
    "Michelle",
    "Joshua",
    "Carol",
  ]

  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Jones",
    "Brown",
    "Davis",
    "Miller",
    "Wilson",
    "Moore",
    "Taylor",
    "Anderson",
    "Thomas",
    "Jackson",
    "White",
    "Harris",
    "Martin",
    "Thompson",
    "Garcia",
    "Martinez",
    "Robinson",
    "Clark",
    "Rodriguez",
    "Lewis",
    "Lee",
    "Walker",
    "Hall",
    "Allen",
    "Young",
    "Hernandez",
    "King",
    "Wright",
    "Lopez",
    "Hill",
    "Scott",
    "Green",
    "Adams",
    "Baker",
    "Gonzalez",
    "Nelson",
    "Carter",
  ]

  return `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`
}

function getRandomCompany() {
  const companies = [
    "Acme Corp",
    "Globex",
    "Initech",
    "Umbrella Corp",
    "Stark Industries",
    "Wayne Enterprises",
    "Cyberdyne Systems",
    "Soylent Corp",
    "Weyland-Yutani",
    "Massive Dynamic",
    "Oscorp",
    "LexCorp",
    "Tyrell Corporation",
    "Gekko & Co",
    "Wonka Industries",
    "Dunder Mifflin",
    "Hooli",
    "Pied Piper",
    "Prestige Worldwide",
  ]

  return getRandomItem(companies)
}
