"use client"

interface CompanyExecutivesProps {
  executives: Array<{
    name: string
    title: string
    since: string
    background: string
    imageUrl?: string
  }>
}

export function CompanyExecutives({ executives }: CompanyExecutivesProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {executives.map((executive, index) => (
        <div key={index} className="flex gap-4 p-4 rounded-lg border">
          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-medium overflow-hidden">
            {executive.imageUrl ? (
              <img
                src={executive.imageUrl || "/placeholder.svg"}
                alt={executive.name}
                className="h-full w-full object-cover"
              />
            ) : (
              executive.name
                .split(" ")
                .map((n) => n[0])
                .join("")
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-medium">{executive.name}</h3>
            <p className="text-sm text-blue-600">{executive.title}</p>
            <p className="text-xs text-gray-500 mt-1">Since {executive.since}</p>
            <p className="text-xs text-gray-600 mt-2">{executive.background}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
