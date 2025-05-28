"use client"

interface CompanyOverviewProps {
  data: {
    description?: string
    businessModel?: string
    competitiveAdvantage?: string
    recentDevelopments?: string[]
    keyProducts?: string[]
  }
}

export function CompanyOverview({ data }: CompanyOverviewProps) {
  // Provide fallback data if data is undefined or incomplete
  const safeData = {
    description: data?.description || "Company description not available.",
    businessModel: data?.businessModel || "Business model information not available.",
    competitiveAdvantage: data?.competitiveAdvantage || "Competitive advantage information not available.",
    recentDevelopments: data?.recentDevelopments || [],
    keyProducts: data?.keyProducts || [],
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-blue-600">Company Description</h3>
        <p className="mt-1 text-sm text-gray-600">{safeData.description}</p>
      </div>

      <div>
        <h3 className="font-medium text-green-600">Business Model</h3>
        <p className="mt-1 text-sm text-gray-600">{safeData.businessModel}</p>
      </div>

      <div>
        <h3 className="font-medium text-red-600">Competitive Advantage</h3>
        <p className="mt-1 text-sm text-gray-600">{safeData.competitiveAdvantage}</p>
      </div>

      {safeData.keyProducts && safeData.keyProducts.length > 0 && (
        <div>
          <h3 className="font-medium text-orange-600">Key Products</h3>
          <ul className="mt-2 space-y-1">
            {safeData.keyProducts.map((product, index) => (
              <li key={index} className="text-sm text-gray-600 list-disc ml-4">
                {product}
              </li>
            ))}
          </ul>
        </div>
      )}

      {safeData.recentDevelopments && safeData.recentDevelopments.length > 0 && (
        <div>
          <h3 className="font-medium text-yellow-600">Recent Developments</h3>
          <ul className="mt-2 space-y-1">
            {safeData.recentDevelopments.map((development, index) => (
              <li key={index} className="text-sm text-gray-600 list-disc ml-4">
                {development}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
