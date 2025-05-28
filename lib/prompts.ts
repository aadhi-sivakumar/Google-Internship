export const prompts = {
  stockPerformance: (company: string) => `
    Create a detailed stock performance analysis for ${company} over the last 12 months.
    Include key metrics like price changes, volatility, and comparison to relevant indices.
    Format your response as JSON with the following structure:
    {
      "analysis": "Brief 2-3 sentence analysis of the stock performance",
      "chartDescription": "Description of what the chart shows",
      "keyPoints": ["Point 1", "Point 2", "Point 3"]
    }
  `,

  revenueBreakdown: (company: string) => `
  Create a revenue breakdown analysis for ${company}.
  Analyze their different business segments and revenue sources.
  Format your response as JSON with the following structure:
  {
    "analysis": "Brief 2-3 sentence analysis of revenue sources",
    "summary": "One paragraph summary of the overall revenue structure and key insights",
    "segments": [
      {"name": "Segment name", "percentage": number, "trend": "increasing/decreasing/stable"}
    ],
    "keyInsight": "One key insight about their revenue structure"
  }
`,

  keyMetrics: (company: string) => `
    Provide key financial metrics for ${company}.
    Include metrics like Revenue, Net Income, EPS, and P/E Ratio with recent values and YoY changes.
    Format your response as JSON with the following structure:
    {
      "metrics": [
        {"name": "Revenue", "value": "Value with appropriate unit (e.g., $42.5B)", "change": number},
        {"name": "Net Income", "value": "Value with appropriate unit (e.g., $8.7B)", "change": number},
        {"name": "EPS", "value": "Value with appropriate unit (e.g., $3.45)", "change": number},
        {"name": "P/E Ratio", "value": "Value (e.g., 24.3)", "change": number}
      ],
      "summary": "Brief summary of overall financial health"
    }
    Ensure all values are realistic and accurate for ${company}.
  `,

  companyOverview: (company: string) => `
    Create a comprehensive company overview for ${company}.
    Include company description, business model, competitive advantage, and recent developments.
    Format your response as JSON with the following structure:
    {
      "description": "2-3 sentence company description",
      "businessModel": "Brief explanation of business model",
      "competitiveAdvantage": "Key competitive advantages",
      "recentDevelopments": ["Development 1", "Development 2", "Development 3"]
    }
  `,

  companyInfo: (company: string) => `
    Provide basic information about ${company}.
    Include the company type/sector, number of employees, and founding date.
    Format your response as JSON with the following structure:
    {
      "sector": "Primary business sector (e.g., Technology, Healthcare, Finance)",
      "employees": number (e.g., 150000),
      "founded": "Year founded (e.g., 1976)"
    }
    Ensure all information is accurate and realistic for ${company}.
  `,

  swotAnalysis: (company: string) => `
    Perform a SWOT analysis for ${company}.
    Identify key strengths, weaknesses, opportunities, and threats.
    Format your response as JSON with the following structure:
    {
      "strengths": ["Strength 1", "Strength 2", "Strength 3", "Strength 4"],
      "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
      "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
      "threats": ["Threat 1", "Threat 2", "Threat 3"]
    }
  `,

  recentFilings: (company: string) => `
    List recent SEC filings for ${company}.
    Include filing type, date, and brief description of key information.
    Format your response as JSON with the following structure:
    {
      "filings": [
        {
          "type": "Filing type (10-K, 10-Q, 8-K, etc.)",
          "date": "Filing date (Month Day, Year)",
          "description": "Brief description of key information"
        }
      ]
    }
  `,

  revenueGrowth: (company: string) => `
    Analyze quarterly revenue growth for ${company} over the past 6 quarters.
    Include quarter labels and revenue figures.
    Format your response as JSON with the following structure:
    {
      "analysis": "Brief analysis of revenue growth trends",
      "quarters": ["Q1 2022", "Q2 2022", "Q3 2022", "Q4 2022", "Q1 2023", "Q2 2023"],
      "values": [number values in millions]
    }
  `,

  profitMargins: (company: string) => `
    Analyze profit margin trends for ${company} over the past 5 years.
    Include gross margin, operating margin, and net margin.
    Format your response as JSON with the following structure:
    {
      "analysis": "Brief analysis of margin trends",
      "years": ["2019", "2020", "2021", "2022", "2023"],
      "grossMargin": [percentage values],
      "operatingMargin": [percentage values],
      "netMargin": [percentage values]
    }
  `,

  expenseBreakdown: (company: string) => `
    Provide an expense breakdown for ${company} for the current fiscal year.
    Include major expense categories and their percentages.
    Format your response as JSON with the following structure:
    {
      "analysis": "Brief analysis of expense structure",
      "categories": ["Category 1", "Category 2", "Category 3", "Category 4", "Category 5"],
      "percentages": [percentage values]
    }
  `,

  financialHighlights: (company: string) => `
    Provide key financial highlights for ${company}.
    Include information on revenue growth, margin expansion, capital allocation, and balance sheet strength.
    Format your response as JSON with the following structure:
    {
      "highlights": [
        {
          "title": "Highlight title",
          "description": "Detailed description of the highlight"
        }
      ]
    }
  `,

  news: (company: string) => `
    Provide recent news and analysis for ${company}.
    Include article title, source, date, summary, and sentiment.
    Format your response as JSON with the following structure:
    {
      "news": [
        {
          "title": "Article title",
          "source": "News source",
          "date": "Publication date (Month Day, Year)",
          "summary": "Brief summary of the article",
          "sentiment": "positive/negative/neutral"
        }
      ]
    }
  `,

  sentiment: (company: string) => `
    Analyze market sentiment for ${company}.
    Include analyst ratings, news sentiment, and social media sentiment.
    Format your response as JSON with the following structure:
    {
      "analystRating": number (1-5 scale with one decimal),
      "newsSentiment": number (percentage),
      "socialSentiment": number (percentage)
    }
  `,

  keyTopics: (company: string) => `
    Identify key topics related to ${company} in recent discussions.
    Include topic name and relative importance.
    Format your response as JSON with the following structure:
    {
      "topics": [
        {"name": "Topic name", "weight": number (1-100)}
      ]
    }
  `,

  executives: (company: string) => `
    List key executives at ${company}.
    Include name, title, tenure, and background information.
    Format your response as JSON with the following structure:
    {
      "executives": [
        {
          "name": "Executive name",
          "title": "Executive title",
          "since": "Year joined position",
          "background": "Brief background information"
        }
      ]
    }
  `,

  structure: (company: string) => `
    Describe the company structure of ${company}.
    Include board size, independent directors, business units, and subsidiaries.
    Format your response as JSON with the following structure:
    {
      "boardSize": number,
      "independentDirectors": number,
      "businessUnits": ["Business unit 1", "Business unit 2", "Business unit 3"],
      "subsidiaries": ["Subsidiary 1", "Subsidiary 2", "Subsidiary 3"]
    }
  `,

  geography: (company: string) => `
    Describe the geographic presence of ${company}.
    Include headquarters location, major locations, and revenue breakdown by region.
    Format your response as JSON with the following structure:
    {
      "headquarters": "City, Country",
      "majorLocations": ["Location 1", "Location 2", "Location 3", "Location 4"],
      "revenueByRegion": {
        "North America": number (percentage),
        "Europe": number (percentage),
        "Asia Pacific": number (percentage),
        "Rest of World": number (percentage)
      }
    }
  `,

  aiSuggestions: (company: string) => `
    Generate 5 insightful questions that someone might want to ask about ${company}.
    Format your response as a JSON array of strings:
    ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
  `,

  generateChartImage: (company: string, chartType: string, data: any) => {
    let prompt = `Create a ${chartType} chart visualization for ${company}. `

    if (chartType === "stock") {
      prompt += `The chart should show stock performance over the last 12 months. Make it look like a professional stock chart with price movements, volume indicators, and key trend lines.`
    } else if (chartType === "pie") {
      prompt += `Create a pie chart showing the following segments and percentages: `
      if (data && data.segments) {
        data.segments.forEach((segment: any) => {
          prompt += `${segment.name}: ${segment.percentage}%, `
        })
      } else {
        prompt += `Use realistic business segments for ${company}.`
      }
    } else if (chartType === "bar" || chartType === "line") {
      prompt += `Create a ${chartType} chart with appropriate data visualization for ${company}. Make it look professional with clear labels, colors, and data points.`
    }

    prompt += ` The image should be clean, professional, and suitable for a financial dashboard. Use Google's color palette (blue #4285F4, red #DB4437, yellow #F4B400, green #0F9D58) for the visualization.`

    return prompt
  },

  competitorLandscape: (company: string) => `
  Analyze the comprehensive competitive landscape for ${company}. Provide detailed insights into market dynamics, competitor positioning, and technological differentiation.
  
  Format your response as JSON with the following structure:
  {
    "analysis": "Comprehensive 3-4 sentence overview of the competitive landscape and market dynamics",
    "mainCompetitors": [
      {
        "name": "Actual competitor company name",
        "marketShare": "Realistic market share percentage or position (e.g., '23%' or 'Market leader')",
        "strengths": ["Specific competitive strength 1", "Specific competitive strength 2", "Specific competitive strength 3"],
        "focus": "Detailed description of their primary business focus and market strategy"
      }
    ],
    "competitivePosition": {
      "marketPosition": "Specific market position (e.g., 'Market leader', 'Strong challenger', 'Niche player')",
      "keyDifferentiators": ["Unique differentiator 1", "Unique differentiator 2", "Unique differentiator 3"],
      "competitiveAdvantages": ["Sustainable advantage 1", "Sustainable advantage 2", "Sustainable advantage 3"]
    },
    "keyTechnologies": [
      {
        "technology": "Specific technology name (e.g., 'Machine Learning Platform', 'Cloud Infrastructure')",
        "description": "Detailed technical description of the technology and its capabilities",
        "competitiveImpact": "Specific explanation of how this technology provides competitive advantage and market differentiation"
      }
    ],
    "marketTrends": [
      "Specific industry trend 1 with business impact",
      "Specific industry trend 2 with business impact", 
      "Specific industry trend 3 with business impact",
      "Specific industry trend 4 with business impact"
    ],
    "threats": [
      "Specific competitive threat 1 with potential impact",
      "Specific competitive threat 2 with potential impact",
      "Specific competitive threat 3 with potential impact"
    ]
  }
  
  Ensure all information is realistic, current, and specific to ${company}'s actual market position and competitive environment. Include real competitor names and accurate market insights.
`,
}
