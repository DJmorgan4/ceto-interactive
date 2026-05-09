import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, county } = await req.json()

    if (!lat || !lng) {
      return NextResponse.json({ error: 'lat/lng required' }, { status: 400 })
    }

    // SSURGO soils via USDA Web Soil Survey
    const soilUrl = `https://SDMDataAccess.nrcs.usda.gov/Tabular/SDMTabularService/post.rest`
    
    // Census geocoder reverse lookup for parcel owner/zoning approximation
    const censusUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Districts&format=json`

    const [censusRes] = await Promise.allSettled([
      fetch(censusUrl).then(r => r.json()),
    ])

    const censusData = censusRes.status === 'fulfilled' ? censusRes.value : null
    const geoResult = censusData?.result?.geographies
    const tract = geoResult?.['Census Tracts']?.[0]
    const block = geoResult?.['Census Blocks']?.[0]
    const county2 = geoResult?.['Counties']?.[0]

    return NextResponse.json({
      parcel: {
        parcelId: block?.GEOID || 'Not available',
        ownerName: 'Manual lookup required',
        ownerType: 'Unknown',
        landUseDescription: 'See county appraisal district',
        propertyClass: 'Unknown',
        acres: null,
        yearBuilt: null,
        buildingSqFt: null,
        legalDescription: null,
        assessedLandValue: null,
        assessedImprovementValue: null,
        source: 'US Census Bureau',
        confidence: 'PARTIAL',
      },
      landCover: {
        nlcdClass: 'Unknown',
        developedPercent: 0,
        imperviousPercent: 0,
        cultivatedCropPercent: 0,
        source: 'NLCD — manual lookup required',
        confidence: 'UNAVAILABLE',
      },
      zoning: {
        jurisdiction: county2?.NAME || county || 'Unknown',
        zoningCode: 'Manual lookup required',
        zoningDescription: 'Contact county planning department',
        futureLandUse: null,
        source: 'County Planning Department',
        confidence: 'UNAVAILABLE',
      },
      receptors: {
        nearestSchoolMi: null,
        nearestParkMi: null,
        nearestSurfaceWaterMi: null,
        nearestHospitalMi: null,
        source: 'Manual lookup required',
        confidence: 'UNAVAILABLE',
      },
      occupant: {
        useCategory: 'Unknown',
        environmentalUseRisk: 'Unknown',
        riskBasis: 'Parcel data not available via automated lookup — check county CAD',
        source: 'Manual',
      },
      _meta: {
        censusBlock: block?.GEOID || null,
        censusTract: tract?.NAME || null,
        county: county2?.NAME || county || null,
        note: 'Full parcel data requires county appraisal district API. This returns Census geography as fallback.',
      }
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
