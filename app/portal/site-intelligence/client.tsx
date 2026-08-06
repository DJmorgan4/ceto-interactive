'use client'

import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const SITE_INTEL_API =
  process.env.NEXT_PUBLIC_SITE_INTEL_API_URL || 'http://localhost:8001'

type Coordinate = [number, number]
type BoundingBox = [number, number, number, number]

type Transect = {
  start: Coordinate
  end: Coordinate
}

type JobStatus = {
  job_id?: string
  id?: string
  status?: string
  progress?: number
  message?: string
  error?: string
  report_url?: string
  pdf_url?: string
  download_url?: string
  results?: Record<string, unknown>
  files?: Array<{
    name?: string
    url?: string
    type?: string
  }>
  outputs?: Array<{
    name?: string
    url?: string
    type?: string
  }>
  [key: string]: unknown
}

type DatasetDefinition = {
  id: string
  label: string
  description: string
  agency: string
  category: string
  cadence: string
  supports: string[]
}

type OutputDefinition = {
  id: string
  label: string
  description: string
}

type ReportPreset = {
  id: string
  label: string
  description: string
  datasets: string[]
  outputs: string[]
}

const DATASETS: DatasetDefinition[] = [
  {
    id: 'usgs_3dep',
    label: 'USGS 3DEP',
    description: 'Elevation, hillshade, slope and terrain',
    agency: 'USGS',
    category: 'Terrain',
    cadence: 'Best available DEM',
    supports: ['Elevation', 'Slope', 'Drainage', 'Hillshade'],
  },
  {
    id: 'macrostrat',
    label: 'Macrostrat',
    description: 'Mapped geology, geologic age and lithology',
    agency: 'Macrostrat / USGS',
    category: 'Geology',
    cadence: 'Published map service',
    supports: ['Geology', 'Lithology', 'Subsurface context'],
  },
  {
    id: 'soilgrids',
    label: 'SSURGO / SoilGrids',
    description: 'Soils, hydric rating and development limitations',
    agency: 'USDA NRCS',
    category: 'Soils',
    cadence: 'Published soil survey',
    supports: ['Hydric soils', 'Drainage', 'Development suitability'],
  },
  {
    id: 'nhd',
    label: 'National Hydrography',
    description: 'Streams, flowlines and drainage context',
    agency: 'USGS',
    category: 'Hydrology',
    cadence: 'Published hydrography service',
    supports: ['Streams', 'Drainage', 'Watershed context'],
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    description: 'Roads, buildings, access and local context',
    agency: 'OpenStreetMap contributors',
    category: 'Context',
    cadence: 'Continuously updated',
    supports: ['Access', 'Structures', 'Nearby land use'],
  },
  {
    id: 'nlcd',
    label: 'National Land Cover',
    description: 'Land-cover classification and impervious surface',
    agency: 'USGS',
    category: 'Land Cover',
    cadence: 'Published national release',
    supports: ['Land cover', 'Habitat context', 'Development footprint'],
  },
]

const OUTPUTS: OutputDefinition[] = [
  {
    id: 'hillshade',
    label: 'LiDAR Hillshade',
    description: 'Terrain visualization and subtle surface features',
  },
  {
    id: 'slope',
    label: 'Slope Analysis',
    description: 'Slope classes and development constraints',
  },
  {
    id: 'drainage',
    label: 'Drainage',
    description: 'Flow paths, accumulation and ponding context',
  },
  {
    id: 'geology',
    label: 'Geology',
    description: 'Formation, age and lithology summary',
  },
  {
    id: 'soils',
    label: 'Soils',
    description: 'Hydric rating, drainage and engineering limitations',
  },
  {
    id: 'nlcd',
    label: 'Land Cover',
    description: 'Land-cover distribution and site context',
  },
  {
    id: 'cross_section',
    label: 'Cross-Section',
    description: 'Elevation profile along an optional transect',
  },
  {
    id: 'pdf',
    label: 'PDF Report',
    description: 'Consolidated client-ready intelligence report',
  },
]

const ALL_DATASET_IDS = DATASETS.map((item) => item.id)
const ALL_OUTPUT_IDS = OUTPUTS.map((item) => item.id)

const REPORT_PRESETS: ReportPreset[] = [
  {
    id: 'complete',
    label: 'Complete Intelligence',
    description: 'All current datasets and report products',
    datasets: ALL_DATASET_IDS,
    outputs: ALL_OUTPUT_IDS,
  },
  {
    id: 'due-diligence',
    label: 'Due Diligence',
    description: 'Physical setting, hydrology, soils and PDF package',
    datasets: [
      'usgs_3dep',
      'macrostrat',
      'soilgrids',
      'nhd',
      'osm',
      'nlcd',
    ],
    outputs: [
      'hillshade',
      'slope',
      'drainage',
      'geology',
      'soils',
      'nlcd',
      'pdf',
    ],
  },
  {
    id: 'terrain',
    label: 'Terrain & Drainage',
    description: 'Elevation, slope, flow paths and cross-section',
    datasets: ['usgs_3dep', 'nhd', 'soilgrids', 'osm'],
    outputs: ['hillshade', 'slope', 'drainage', 'cross_section', 'pdf'],
  },
  {
    id: 'development',
    label: 'Development Screening',
    description: 'Terrain, soils, drainage and land-cover suitability',
    datasets: ['usgs_3dep', 'soilgrids', 'nhd', 'osm', 'nlcd'],
    outputs: ['hillshade', 'slope', 'drainage', 'soils', 'nlcd', 'pdf'],
  },
]

const EMPTY_FEATURE_COLLECTION = {
  type: 'FeatureCollection' as const,
  features: [],
}

const MAP_STYLES = {
  dark: {
    label: 'Dark',
    url: 'https://tiles.openfreemap.org/styles/dark',
  },
  light: {
    label: 'Light',
    url: 'https://tiles.openfreemap.org/styles/bright',
  },
  liberty: {
    label: 'Terrain',
    url: 'https://tiles.openfreemap.org/styles/liberty',
  },
} as const

type MapStyleKey = keyof typeof MAP_STYLES

const COLORS = {
  page: '#071018',
  surface: '#0d1822',
  surfaceStrong: '#111f2c',
  surfaceSoft: '#142637',
  border: 'rgba(151, 179, 199, 0.18)',
  borderStrong: 'rgba(151, 179, 199, 0.32)',
  text: '#f3f7fa',
  muted: '#91a3b2',
  faint: '#607482',
  blue: '#4da3e6',
  blueSoft: 'rgba(77, 163, 230, 0.14)',
  green: '#56c98f',
  greenSoft: 'rgba(86, 201, 143, 0.12)',
  amber: '#e8b55b',
  amberSoft: 'rgba(232, 181, 91, 0.12)',
  red: '#ef6a67',
  redSoft: 'rgba(239, 106, 103, 0.12)',
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${SITE_INTEL_API}${url}`
  return `${SITE_INTEL_API}/${url}`
}

function approximateAreaAcres(bbox: BoundingBox | null): number | null {
  if (!bbox) return null

  const [west, south, east, north] = bbox
  const meanLatRadians = (((south + north) / 2) * Math.PI) / 180

  const widthMeters =
    Math.abs(east - west) * 111_320 * Math.cos(meanLatRadians)
  const heightMeters = Math.abs(north - south) * 110_574
  const squareMeters = widthMeters * heightMeters

  return squareMeters / 4046.8564224
}

function formatArea(acres: number | null): string {
  if (acres === null || !Number.isFinite(acres)) return 'Not calculated'
  if (acres < 1) return `${acres.toFixed(2)} acres`
  if (acres < 100) return `${acres.toFixed(1)} acres`
  return `${Math.round(acres).toLocaleString()} acres`
}

function clampProgress(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(100, parsed))
}

function getDownloadLinks(jobStatus: JobStatus | null) {
  if (!jobStatus) return []

  const links: Array<{ label: string; url: string }> = []
  const seen = new Set<string>()

  const add = (label: string, rawUrl: unknown) => {
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) return

    const url = normalizeUrl(rawUrl)
    if (seen.has(url)) return

    seen.add(url)
    links.push({ label, url })
  }

  add('Download report', jobStatus.report_url)
  add('Download PDF', jobStatus.pdf_url)
  add('Download package', jobStatus.download_url)

  const collections = [jobStatus.files, jobStatus.outputs]

  for (const collection of collections) {
    if (!Array.isArray(collection)) continue

    collection.forEach((file, index) => {
      if (!file || typeof file !== 'object') return

      add(
        file.name || file.type || `Output ${index + 1}`,
        file.url,
      )
    })
  }

  if (jobStatus.results && typeof jobStatus.results === 'object') {
    Object.entries(jobStatus.results).forEach(([key, value]) => {
      if (
        typeof value === 'string' &&
        (value.startsWith('/') || /^https?:\/\//i.test(value))
      ) {
        add(
          key
            .replaceAll('_', ' ')
            .replace(/\b\w/g, (character) => character.toUpperCase()),
          value,
        )
      }
    })
  }

  return links
}

export default function SiteIntelligenceClient() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const aoiClicks = useRef<maplibregl.LngLat[]>([])
  const transectClicks = useRef<Coordinate[]>([])

  const drawingAOIRef = useRef(false)
  const drawingTransectRef = useRef(false)

  const [projectName, setProjectName] = useState('')
  const [clientName, setClientName] = useState('')
  const [projectPurpose, setProjectPurpose] = useState(
    'Environmental due diligence and site development screening',
  )

  const [bbox, setBbox] = useState<BoundingBox | null>(null)
  const [center, setCenter] = useState<Coordinate | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [transect, setTransect] = useState<Transect | null>(null)

  const [isDrawingAOI, setIsDrawingAOI] = useState(false)
  const [isDrawingTransect, setIsDrawingTransect] = useState(false)

  const [datasets, setDatasets] = useState<string[]>(ALL_DATASET_IDS)
  const [outputs, setOutputs] = useState<string[]>(ALL_OUTPUT_IDS)
  const [preset, setPreset] = useState('complete')
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('dark')

  const [coordinateInput, setCoordinateInput] = useState('')
  const [activePanel, setActivePanel] = useState<
    'setup' | 'sources' | 'evidence'
  >('setup')

  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')

  const areaAcres = useMemo(() => approximateAreaAcres(bbox), [bbox])
  const downloads = useMemo(() => getDownloadLinks(jobStatus), [jobStatus])

  const qualityScore = useMemo(() => {
    let score = 0

    if (projectName.trim()) score += 10
    if (clientName.trim()) score += 5
    if (projectPurpose.trim()) score += 5
    if (bbox) score += 25
    if (center) score += 5

    score += Math.round((datasets.length / ALL_DATASET_IDS.length) * 25)
    score += Math.round((outputs.length / ALL_OUTPUT_IDS.length) * 20)

    if (transect) score += 5

    return Math.min(100, score)
  }, [
    projectName,
    clientName,
    projectPurpose,
    bbox,
    center,
    datasets,
    outputs,
    transect,
  ])

  const evidenceRows = useMemo(() => {
    const rows: Array<{
      finding: string
      evidence: string
      source: string
      confidence: string
    }> = []

    if (datasets.includes('usgs_3dep')) {
      rows.push({
        finding: 'Terrain and slope',
        evidence: '3DEP elevation, hillshade and derived slope',
        source: 'USGS 3DEP',
        confidence: 'High',
      })
    }

    if (datasets.includes('nhd')) {
      rows.push({
        finding: 'Drainage context',
        evidence: 'Mapped hydrography and derived flow paths',
        source: 'USGS NHD + 3DEP',
        confidence: 'High',
      })
    }

    if (datasets.includes('soilgrids')) {
      rows.push({
        finding: 'Soil suitability',
        evidence: 'Soil mapping, hydric rating and drainage class',
        source: 'USDA NRCS',
        confidence: 'High',
      })
    }

    if (datasets.includes('macrostrat')) {
      rows.push({
        finding: 'Geologic setting',
        evidence: 'Formation, age and mapped lithology',
        source: 'Macrostrat / USGS',
        confidence: 'Moderate–High',
      })
    }

    if (datasets.includes('nlcd')) {
      rows.push({
        finding: 'Land-cover context',
        evidence: 'National land-cover classification',
        source: 'USGS NLCD',
        confidence: 'Moderate–High',
      })
    }

    return rows
  }, [datasets])

  const applyAoiToMap = useCallback(
    (nextBbox: BoundingBox, shouldFit = true) => {
      const [west, south, east, north] = nextBbox
      const nextCenter: Coordinate = [
        (west + east) / 2,
        (south + north) / 2,
      ]

      setBbox(nextBbox)
      setCenter(nextCenter)

      const source = map.current?.getSource('aoi') as
        | maplibregl.GeoJSONSource
        | undefined

      source?.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [west, south],
                  [east, south],
                  [east, north],
                  [west, north],
                  [west, south],
                ],
              ],
            },
          },
        ],
      })

      if (shouldFit) {
        map.current?.fitBounds(
          [
            [west, south],
            [east, north],
          ],
          {
            padding: 80,
            maxZoom: 16,
            duration: 700,
          },
        )
      }
    },
    [],
  )

  const addOperationalLayers = useCallback(() => {
    const currentMap = map.current
    if (!currentMap) return

    if (!currentMap.getSource('aoi')) {
      currentMap.addSource('aoi', {
        type: 'geojson',
        data: EMPTY_FEATURE_COLLECTION,
      })
    }

    if (!currentMap.getLayer('aoi-fill')) {
      currentMap.addLayer({
        id: 'aoi-fill',
        type: 'fill',
        source: 'aoi',
        paint: {
          'fill-color': COLORS.blue,
          'fill-opacity': 0.18,
        },
      })
    }

    if (!currentMap.getLayer('aoi-line')) {
      currentMap.addLayer({
        id: 'aoi-line',
        type: 'line',
        source: 'aoi',
        paint: {
          'line-color': COLORS.blue,
          'line-width': 3,
        },
      })
    }

    if (!currentMap.getSource('transect')) {
      currentMap.addSource('transect', {
        type: 'geojson',
        data: EMPTY_FEATURE_COLLECTION,
      })
    }

    if (!currentMap.getLayer('transect-line')) {
      currentMap.addLayer({
        id: 'transect-line',
        type: 'line',
        source: 'transect',
        paint: {
          'line-color': COLORS.amber,
          'line-width': 3,
          'line-dasharray': [3, 2],
        },
      })
    }

    if (!currentMap.getSource('transect-points')) {
      currentMap.addSource('transect-points', {
        type: 'geojson',
        data: EMPTY_FEATURE_COLLECTION,
      })
    }

    if (!currentMap.getLayer('transect-points-layer')) {
      currentMap.addLayer({
        id: 'transect-points-layer',
        type: 'circle',
        source: 'transect-points',
        paint: {
          'circle-radius': 6,
          'circle-color': COLORS.amber,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })
    }

  }, [])

  // Sync AOI + transect geometry without recreating the map.
  useEffect(() => {
    const currentMap = map.current
    if (!mapReady || !currentMap) return

    if (bbox) applyAoiToMap(bbox, false)

    if (transect) {
      const transectSource = currentMap.getSource('transect') as
        | maplibregl.GeoJSONSource
        | undefined

      transectSource?.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [transect.start, transect.end],
            },
          },
        ],
      })
    }
  }, [mapReady, bbox, transect, applyAoiToMap])

  useEffect(() => {
    drawingAOIRef.current = isDrawingAOI
  }, [isDrawingAOI])

  useEffect(() => {
    drawingTransectRef.current = isDrawingTransect
  }, [isDrawingTransect])

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const instance = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.dark.url,
      center: [-96.797, 32.7767],
      zoom: 9,
      attributionControl: {},
    })

    map.current = instance

    instance.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right',
    )

    instance.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 140,
        unit: 'imperial',
      }),
      'bottom-right',
    )

    instance.on('load', () => {
      addOperationalLayers()
      setMapReady(true)
    })

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      instance.remove()
      map.current = null
      setMapReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const container = mapContainer.current
    if (!container) return

    const resize = () => map.current?.resize()
    const observer = new ResizeObserver(resize)

    observer.observe(container)

    const frame = requestAnimationFrame(resize)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const currentMap = map.current
    if (!currentMap) return

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      const point: Coordinate = [event.lngLat.lng, event.lngLat.lat]

      if (drawingAOIRef.current) {
        aoiClicks.current.push(event.lngLat)

        if (aoiClicks.current.length === 2) {
          const first = aoiClicks.current[0]
          const second = aoiClicks.current[1]

          const nextBbox: BoundingBox = [
            Math.min(first.lng, second.lng),
            Math.min(first.lat, second.lat),
            Math.max(first.lng, second.lng),
            Math.max(first.lat, second.lat),
          ]

          applyAoiToMap(nextBbox)
          aoiClicks.current = []
          drawingAOIRef.current = false
          setIsDrawingAOI(false)
          currentMap.getCanvas().style.cursor = ''
        }

        return
      }

      if (drawingTransectRef.current) {
        transectClicks.current.push(point)

        const pointsSource = currentMap.getSource(
          'transect-points',
        ) as maplibregl.GeoJSONSource | undefined

        pointsSource?.setData({
          type: 'FeatureCollection',
          features: transectClicks.current.map((coordinate) => ({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: coordinate,
            },
          })),
        })

        if (transectClicks.current.length === 2) {
          const [start, end] = transectClicks.current
          const nextTransect = { start, end }

          setTransect(nextTransect)

          const lineSource = currentMap.getSource(
            'transect',
          ) as maplibregl.GeoJSONSource | undefined

          lineSource?.setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: [start, end],
                },
              },
            ],
          })

          transectClicks.current = []
          drawingTransectRef.current = false
          setIsDrawingTransect(false)
          currentMap.getCanvas().style.cursor = ''
        }
      }
    }

    currentMap.on('click', handleClick)

    return () => {
      currentMap.off('click', handleClick)
    }
  }, [mapReady, applyAoiToMap])

  const changeMapStyle = (nextStyle: MapStyleKey) => {
    setMapStyle(nextStyle)

    const currentMap = map.current
    if (!currentMap) return

    currentMap.setStyle(MAP_STYLES[nextStyle].url)
    currentMap.once('style.load', addOperationalLayers)
  }

  const startDrawAOI = () => {
    setError('')
    aoiClicks.current = []
    transectClicks.current = []

    drawingAOIRef.current = true

    drawingTransectRef.current = false

    setIsDrawingAOI(true)
    setIsDrawingTransect(false)

    if (map.current) {
      map.current.getCanvas().style.cursor = 'crosshair'
    }
  }

  const startDrawTransect = () => {
    setError('')
    transectClicks.current = []
    aoiClicks.current = []

    drawingTransectRef.current = true

    drawingAOIRef.current = false

    setIsDrawingTransect(true)
    setIsDrawingAOI(false)

    const currentMap = map.current

    if (currentMap) {
      currentMap.getCanvas().style.cursor = 'crosshair'

      const pointsSource = currentMap.getSource(
        'transect-points',
      ) as maplibregl.GeoJSONSource | undefined

      pointsSource?.setData(EMPTY_FEATURE_COLLECTION)
    }
  }

  const clearTransect = () => {
    setTransect(null)
    transectClicks.current = []
    drawingTransectRef.current = false
    setIsDrawingTransect(false)

    const currentMap = map.current
    if (!currentMap) return

    currentMap.getCanvas().style.cursor = ''

    const lineSource = currentMap.getSource(
      'transect',
    ) as maplibregl.GeoJSONSource | undefined

    const pointsSource = currentMap.getSource(
      'transect-points',
    ) as maplibregl.GeoJSONSource | undefined

    lineSource?.setData(EMPTY_FEATURE_COLLECTION)
    pointsSource?.setData(EMPTY_FEATURE_COLLECTION)
  }

  const clearAll = () => {
    setBbox(null)
    setCenter(null)
    setTransect(null)
    setJobId(null)
    setJobStatus(null)
    setPolling(false)
    setError('')

    aoiClicks.current = []
    transectClicks.current = []

    setIsDrawingAOI(false)
    setIsDrawingTransect(false)
    drawingAOIRef.current = false
    drawingTransectRef.current = false

    const currentMap = map.current
    if (!currentMap) return

    currentMap.getCanvas().style.cursor = ''

    ;(
      currentMap.getSource('aoi') as maplibregl.GeoJSONSource | undefined
    )?.setData(EMPTY_FEATURE_COLLECTION)

    ;(
      currentMap.getSource(
        'transect',
      ) as maplibregl.GeoJSONSource | undefined
    )?.setData(EMPTY_FEATURE_COLLECTION)

    ;(
      currentMap.getSource(
        'transect-points',
      ) as maplibregl.GeoJSONSource | undefined
    )?.setData(EMPTY_FEATURE_COLLECTION)
  }

  const applyCoordinateInput = () => {
    setError('')

    const values = coordinateInput
      .trim()
      .replace(/[()°]/g, '')
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number)

    if (
      values.length !== 2 ||
      !values.every(Number.isFinite)
    ) {
      setError('Enter coordinates as latitude, longitude.')
      return
    }

    const [latitude, longitude] = values

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError('The latitude or longitude is outside the valid range.')
      return
    }

    const halfSize = 0.0025

    const nextBbox: BoundingBox = [
      longitude - halfSize,
      latitude - halfSize,
      longitude + halfSize,
      latitude + halfSize,
    ]

    applyAoiToMap(nextBbox)
  }

  const useCurrentLocation = () => {
    setError('')

    if (!navigator.geolocation) {
      setError('Location services are not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        setCoordinateInput(
          `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        )

        const halfSize = 0.0025

        applyAoiToMap([
          longitude - halfSize,
          latitude - halfSize,
          longitude + halfSize,
          latitude + halfSize,
        ])
      },
      (locationError) => {
        setError(
          locationError.message || 'Unable to retrieve your location.',
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 12_000,
      },
    )
  }

  const applyPreset = (presetId: string) => {
    const selectedPreset = REPORT_PRESETS.find(
      (item) => item.id === presetId,
    )

    if (!selectedPreset) return

    setPreset(presetId)
    setDatasets([...selectedPreset.datasets])
    setOutputs([...selectedPreset.outputs])
  }

  const toggleDataset = (datasetId: string) => {
    setPreset('custom')
    setDatasets((current) =>
      current.includes(datasetId)
        ? current.filter((id) => id !== datasetId)
        : [...current, datasetId],
    )
  }

  const toggleOutput = (outputId: string) => {
    setPreset('custom')
    setOutputs((current) =>
      current.includes(outputId)
        ? current.filter((id) => id !== outputId)
        : [...current, outputId],
    )
  }

  const submitJob = async () => {
    setError('')

    if (!bbox || !center) {
      setError('Draw or enter an Area of Interest before generating.')
      return
    }

    if (datasets.length === 0) {
      setError('Select at least one source dataset.')
      return
    }

    if (outputs.length === 0) {
      setError('Select at least one report output.')
      return
    }

    const requestBody: {
      project_name: string
      bbox: BoundingBox
      center: Coordinate
      datasets: string[]
      outputs: string[]
      transect?: Transect
    } = {
      project_name: projectName.trim() || 'Unnamed Site',
      bbox,
      center,
      datasets,
      outputs,
    }

    if (transect) requestBody.transect = transect

    try {
      setSubmitting(true)
      setJobId(null)
      setJobStatus(null)

      const response = await fetch(`${SITE_INTEL_API}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const rawText = await response.text()
      let data: JobStatus = {}

      if (rawText) {
        try {
          data = JSON.parse(rawText) as JobStatus
        } catch {
          data = { message: rawText }
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Site Intelligence API returned ${response.status}.`,
        )
      }

      const nextJobId = String(data.job_id || data.id || '')

      if (!nextJobId) {
        throw new Error('The API did not return a job ID.')
      }

      setJobId(nextJobId)
      setJobStatus(data)
      setPolling(true)
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to create the report job.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!polling || !jobId) return

    const poll = async () => {
      try {
        const response = await fetch(
          `${SITE_INTEL_API}/api/jobs/${encodeURIComponent(jobId)}`,
          {
            cache: 'no-store',
          },
        )

        const rawText = await response.text()
        let data: JobStatus = {}

        if (rawText) {
          try {
            data = JSON.parse(rawText) as JobStatus
          } catch {
            data = { message: rawText }
          }
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              `Status request returned ${response.status}.`,
          )
        }

        setJobStatus(data)

        const status = String(data.status || '').toLowerCase()

        if (
          ['complete', 'completed', 'success', 'succeeded', 'failed', 'error']
            .includes(status)
        ) {
          setPolling(false)

          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
        }
      } catch (pollError) {
        setError(
          pollError instanceof Error
            ? pollError.message
            : 'Unable to retrieve job status.',
        )
      }
    }

    void poll()

    pollRef.current = setInterval(() => {
      void poll()
    }, 2500)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [jobId, polling])

  const progress = clampProgress(jobStatus?.progress)
  const status = String(jobStatus?.status || (jobId ? 'queued' : 'ready'))
  const statusLower = status.toLowerCase()
  const jobFailed = ['failed', 'error'].includes(statusLower)
  const jobComplete = ['complete', 'completed', 'success', 'succeeded'].includes(
    statusLower,
  )

  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        minHeight: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: COLORS.page,
        color: COLORS.text,
        fontFamily: 'var(--font-inter), Inter, Arial, sans-serif',
      }}
    >
      <header
        style={{
          minHeight: 64,
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          borderBottom: `1px solid ${COLORS.border}`,
          background: 'rgba(7, 16, 24, 0.96)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 20,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: COLORS.faint,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 3,
            }}
          >
            Ceto Environmental Intelligence
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
              minWidth: 0,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 650,
                whiteSpace: 'nowrap',
              }}
            >
              Site Intelligence
            </h1>

            <span
              style={{
                color: COLORS.muted,
                fontSize: 11,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Evidence-driven site screening
            </span>
          </div>
        </div>

        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <Link
            href="/portal"
            style={{
              color: COLORS.muted,
              textDecoration: 'none',
              fontSize: 11,
              padding: '8px 10px',
            }}
          >
            Portal
          </Link>

          <Link
            href="/portal/site-intelligence/jobs"
            style={{
              color: COLORS.blue,
              textDecoration: 'none',
              fontSize: 11,
              padding: '8px 10px',
              border: `1px solid ${COLORS.borderStrong}`,
              borderRadius: 7,
              background: COLORS.blueSoft,
            }}
          >
            Job history
          </Link>
        </nav>
      </header>

      <div
        className="flex-col lg:flex-row"
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <aside
          className="w-full lg:w-[390px] max-h-[52vh] lg:max-h-none"
          style={{
            minHeight: 0,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${COLORS.border}`,
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 5,
              padding: 8,
              borderBottom: `1px solid ${COLORS.border}`,
              flexShrink: 0,
            }}
          >
            {[
              ['setup', 'Project'],
              ['sources', 'Data'],
              ['evidence', 'Evidence'],
            ].map(([id, label]) => {
              const selected = activePanel === id

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setActivePanel(
                      id as 'setup' | 'sources' | 'evidence',
                    )
                  }
                  style={{
                    minHeight: 34,
                    borderRadius: 6,
                    border: `1px solid ${
                      selected ? COLORS.borderStrong : 'transparent'
                    }`,
                    color: selected ? COLORS.text : COLORS.muted,
                    background: selected
                      ? COLORS.surfaceSoft
                      : 'transparent',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: selected ? 650 : 500,
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div
            style={{
              flex: '1 1 0%',
              minHeight: 0,
              overflowY: 'auto',
              padding: 16,
            }}
          >
            {activePanel === 'setup' && (
              <>
                <SectionTitle
                  title="Project identity"
                  description="Use the same project name and location across every report."
                />

                <FieldLabel label="Project name">
                  <input
                    value={projectName}
                    onChange={(event) =>
                      setProjectName(event.target.value)
                    }
                    placeholder="Site name"
                    style={inputStyle}
                  />
                </FieldLabel>

                <FieldLabel label="Client">
                  <input
                    value={clientName}
                    onChange={(event) =>
                      setClientName(event.target.value)
                    }
                    placeholder="Client or agency"
                    style={inputStyle}
                  />
                </FieldLabel>

                <FieldLabel label="Purpose">
                  <textarea
                    value={projectPurpose}
                    onChange={(event) =>
                      setProjectPurpose(event.target.value)
                    }
                    rows={2}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      lineHeight: 1.45,
                    }}
                  />
                </FieldLabel>

                <SectionTitle
                  title="Area of Interest"
                  description="Draw two opposite corners or enter a center coordinate."
                />

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 6,
                    marginBottom: 7,
                  }}
                >
                  <input
                    value={coordinateInput}
                    onChange={(event) =>
                      setCoordinateInput(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        applyCoordinateInput()
                      }
                    }}
                    placeholder="31.60724, -97.29720"
                    style={inputStyle}
                  />

                  <button
                    type="button"
                    onClick={applyCoordinateInput}
                    style={secondaryButtonStyle}
                  >
                    Set
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={startDrawAOI}
                    style={{
                      ...secondaryButtonStyle,
                      borderColor: isDrawingAOI
                        ? COLORS.blue
                        : COLORS.borderStrong,
                      color: isDrawingAOI
                        ? COLORS.blue
                        : COLORS.text,
                      background: isDrawingAOI
                        ? COLORS.blueSoft
                        : COLORS.surfaceStrong,
                    }}
                  >
                    {isDrawingAOI
                      ? 'Click two corners…'
                      : 'Draw AOI'}
                  </button>

                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    style={secondaryButtonStyle}
                  >
                    My location
                  </button>
                </div>

                {bbox ? (
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 7,
                      border: `1px solid rgba(86, 201, 143, 0.35)`,
                      background: COLORS.greenSoft,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        color: COLORS.green,
                        fontSize: 11,
                        fontWeight: 700,
                        marginBottom: 5,
                      }}
                    >
                      Area selected
                    </div>

                    <div style={dataRowStyle}>
                      <span>Center</span>
                      <strong>
                        {center?.[1].toFixed(6)},{' '}
                        {center?.[0].toFixed(6)}
                      </strong>
                    </div>

                    <div style={dataRowStyle}>
                      <span>Approximate area</span>
                      <strong>{formatArea(areaAcres)}</strong>
                    </div>
                  </div>
                ) : (
                  <InfoBox>
                    No AOI selected. The report cannot be generated until a
                    site boundary is defined.
                  </InfoBox>
                )}

                <SectionTitle
                  title="Optional cross-section"
                  description="Draw a start and end point for an elevation profile."
                />

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 6,
                  }}
                >
                  <button
                    type="button"
                    onClick={startDrawTransect}
                    style={{
                      ...secondaryButtonStyle,
                      borderColor: isDrawingTransect
                        ? COLORS.amber
                        : COLORS.borderStrong,
                      color: isDrawingTransect
                        ? COLORS.amber
                        : COLORS.text,
                      background: isDrawingTransect
                        ? COLORS.amberSoft
                        : COLORS.surfaceStrong,
                    }}
                  >
                    {isDrawingTransect
                      ? 'Click start and end…'
                      : transect
                        ? 'Redraw transect'
                        : 'Draw transect'}
                  </button>

                  <button
                    type="button"
                    onClick={clearTransect}
                    disabled={!transect && !isDrawingTransect}
                    style={{
                      ...secondaryButtonStyle,
                      opacity:
                        transect || isDrawingTransect ? 1 : 0.4,
                    }}
                  >
                    Clear
                  </button>
                </div>
              </>
            )}

            {activePanel === 'sources' && (
              <>
                <SectionTitle
                  title="Report profile"
                  description="Profiles select a defensible group of datasets and outputs."
                />

                <div
                  style={{
                    display: 'grid',
                    gap: 6,
                    marginBottom: 18,
                  }}
                >
                  {REPORT_PRESETS.map((item) => {
                    const selected = preset === item.id

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => applyPreset(item.id)}
                        style={{
                          padding: 10,
                          textAlign: 'left',
                          borderRadius: 7,
                          cursor: 'pointer',
                          border: `1px solid ${
                            selected
                              ? COLORS.blue
                              : COLORS.border
                          }`,
                          background: selected
                            ? COLORS.blueSoft
                            : COLORS.surfaceStrong,
                          color: COLORS.text,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            marginBottom: 3,
                          }}
                        >
                          {item.label}
                        </div>

                        <div
                          style={{
                            color: COLORS.muted,
                            fontSize: 10,
                            lineHeight: 1.4,
                          }}
                        >
                          {item.description}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <SectionTitle
                  title={`Source datasets · ${datasets.length}/${DATASETS.length}`}
                  description="Each selected source should be identified in the report data lineage."
                />

                <div
                  style={{
                    display: 'grid',
                    gap: 6,
                    marginBottom: 18,
                  }}
                >
                  {DATASETS.map((dataset) => (
                    <ToggleCard
                      key={dataset.id}
                      selected={datasets.includes(dataset.id)}
                      title={dataset.label}
                      description={dataset.description}
                      meta={`${dataset.agency} · ${dataset.category}`}
                      onClick={() => toggleDataset(dataset.id)}
                    />
                  ))}
                </div>

                <SectionTitle
                  title={`Report outputs · ${outputs.length}/${OUTPUTS.length}`}
                  description="Products are created from the selected source datasets."
                />

                <div style={{ display: 'grid', gap: 6 }}>
                  {OUTPUTS.map((output) => (
                    <ToggleCard
                      key={output.id}
                      selected={outputs.includes(output.id)}
                      title={output.label}
                      description={output.description}
                      onClick={() => toggleOutput(output.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {activePanel === 'evidence' && (
              <>
                <SectionTitle
                  title="Evidence Matrix"
                  description="Every report conclusion should show its evidence, source and confidence."
                />

                <div style={{ display: 'grid', gap: 7 }}>
                  {evidenceRows.map((row) => (
                    <div
                      key={row.finding}
                      style={{
                        padding: 11,
                        borderRadius: 7,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.surfaceStrong,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginBottom: 5,
                        }}
                      >
                        <strong style={{ fontSize: 11 }}>
                          {row.finding}
                        </strong>

                        <span
                          style={{
                            color: COLORS.green,
                            fontSize: 9,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.confidence}
                        </span>
                      </div>

                      <div
                        style={{
                          color: COLORS.muted,
                          fontSize: 10,
                          lineHeight: 1.45,
                          marginBottom: 5,
                        }}
                      >
                        {row.evidence}
                      </div>

                      <div
                        style={{
                          color: COLORS.faint,
                          fontSize: 9,
                        }}
                      >
                        Source: {row.source}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 14 }}>
                  <SectionTitle
                    title="Field verification"
                    description="Desktop intelligence supports decisions but does not replace field verification or EP review."
                  />

                  <InfoBox tone="warning">
                    Add field photographs, observations, access limitations,
                    staining, odors, tanks, drums and data gaps to the final
                    report workflow.
                  </InfoBox>
                </div>
              </>
            )}
          </div>

          <div
            style={{
              padding: 12,
              borderTop: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 7,
                fontSize: 10,
              }}
            >
              <span style={{ color: COLORS.muted }}>
                Report readiness
              </span>

              <strong
                style={{
                  color:
                    qualityScore >= 85
                      ? COLORS.green
                      : qualityScore >= 60
                        ? COLORS.amber
                        : COLORS.red,
                }}
              >
                {qualityScore}%
              </strong>
            </div>

            <div
              style={{
                height: 4,
                borderRadius: 999,
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.08)',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${qualityScore}%`,
                  background:
                    qualityScore >= 85
                      ? COLORS.green
                      : qualityScore >= 60
                        ? COLORS.amber
                        : COLORS.red,
                  transition: 'width 180ms ease',
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '9px 10px',
                  marginBottom: 9,
                  borderRadius: 6,
                  color: COLORS.red,
                  background: COLORS.redSoft,
                  border: `1px solid rgba(239, 106, 103, 0.32)`,
                  fontSize: 10,
                  lineHeight: 1.4,
                }}
              >
                {error}
              </div>
            )}

            {!jobId && (
              <button
                type="button"
                onClick={submitJob}
                disabled={
                  submitting ||
                  !bbox ||
                  datasets.length === 0 ||
                  outputs.length === 0
                }
                style={{
                  width: '100%',
                  minHeight: 42,
                  border: 0,
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 750,
                  color:
                    submitting || !bbox
                      ? COLORS.faint
                      : '#ffffff',
                  background:
                    submitting ||
                    !bbox ||
                    datasets.length === 0 ||
                    outputs.length === 0
                      ? COLORS.surfaceStrong
                      : COLORS.blue,
                  cursor:
                    submitting ||
                    !bbox ||
                    datasets.length === 0 ||
                    outputs.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {submitting
                  ? 'Starting analysis…'
                  : !bbox
                    ? 'Select an AOI to continue'
                    : 'Generate intelligence report'}
              </button>
            )}

            {jobId && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 7,
                  border: `1px solid ${
                    jobFailed
                      ? 'rgba(239, 106, 103, 0.35)'
                      : jobComplete
                        ? 'rgba(86, 201, 143, 0.35)'
                        : COLORS.borderStrong
                  }`,
                  background: jobFailed
                    ? COLORS.redSoft
                    : jobComplete
                      ? COLORS.greenSoft
                      : COLORS.surfaceStrong,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 7,
                  }}
                >
                  <strong
                    style={{
                      fontSize: 11,
                      textTransform: 'capitalize',
                    }}
                  >
                    {status}
                  </strong>

                  <span
                    style={{
                      color: COLORS.muted,
                      fontSize: 9,
                    }}
                  >
                    {progress}%
                  </span>
                </div>

                <div
                  style={{
                    height: 4,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                    marginBottom:
                      jobStatus?.message || downloads.length ? 8 : 0,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${jobComplete ? 100 : progress}%`,
                      background: jobFailed
                        ? COLORS.red
                        : jobComplete
                          ? COLORS.green
                          : COLORS.blue,
                      transition: 'width 350ms ease',
                    }}
                  />
                </div>

                {jobStatus?.message && (
                  <div
                    style={{
                      color: COLORS.muted,
                      fontSize: 10,
                      lineHeight: 1.4,
                      marginBottom: downloads.length ? 8 : 0,
                    }}
                  >
                    {jobStatus.message}
                  </div>
                )}

                {downloads.length > 0 && (
                  <div style={{ display: 'grid', gap: 5 }}>
                    {downloads.map((download) => (
                      <a
                        key={download.url}
                        href={download.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'block',
                          padding: '8px 9px',
                          borderRadius: 5,
                          background: COLORS.blue,
                          color: '#ffffff',
                          textAlign: 'center',
                          textDecoration: 'none',
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {download.label}
                      </a>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setJobId(null)
                    setJobStatus(null)
                    setPolling(false)
                    setError('')
                  }}
                  style={{
                    ...secondaryButtonStyle,
                    width: '100%',
                    marginTop: 7,
                  }}
                >
                  Start another report
                </button>
              </div>
            )}
          </div>
        </aside>

        <main
          style={{
            flex: '1 1 0%',
            minWidth: 0,
            minHeight: 0,
            position: 'relative',
            overflow: 'hidden',
            background: '#05090d',
          }}
          className="min-h-[48vh] lg:min-h-0"
        >
          <div
            ref={mapContainer}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 5,
              display: 'flex',
              gap: 5,
              padding: 5,
              borderRadius: 8,
              border: `1px solid ${COLORS.borderStrong}`,
              background: 'rgba(7, 16, 24, 0.88)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {(
              Object.entries(MAP_STYLES) as Array<
                [MapStyleKey, (typeof MAP_STYLES)[MapStyleKey]]
              >
            ).map(([key, definition]) => (
              <button
                key={key}
                type="button"
                onClick={() => changeMapStyle(key)}
                style={{
                  border: 0,
                  padding: '7px 9px',
                  borderRadius: 5,
                  cursor: 'pointer',
                  color:
                    mapStyle === key ? COLORS.text : COLORS.muted,
                  background:
                    mapStyle === key
                      ? COLORS.surfaceSoft
                      : 'transparent',
                  fontSize: 10,
                  fontWeight: mapStyle === key ? 700 : 500,
                }}
              >
                {definition.label}
              </button>
            ))}
          </div>

          <div
            style={{
              position: 'absolute',
              left: 12,
              bottom: 30,
              zIndex: 5,
              maxWidth: 300,
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${COLORS.borderStrong}`,
              background: 'rgba(7, 16, 24, 0.88)',
              backdropFilter: 'blur(12px)',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                color: COLORS.text,
                fontSize: 11,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {isDrawingAOI
                ? 'AOI drawing active'
                : isDrawingTransect
                  ? 'Transect drawing active'
                  : bbox
                    ? 'Site boundary selected'
                    : 'Define the subject property'}
            </div>

            <div
              style={{
                color: COLORS.muted,
                fontSize: 9,
                lineHeight: 1.45,
              }}
            >
              {isDrawingAOI
                ? 'Click two opposite corners of the property.'
                : isDrawingTransect
                  ? 'Click the start and end of the profile.'
                  : bbox
                    ? `${formatArea(areaAcres)} · ${datasets.length} data sources · ${outputs.length} outputs`
                    : 'Draw an AOI or enter a latitude and longitude in the project panel.'}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function SectionTitle({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div style={{ marginBottom: 9, marginTop: 2 }}>
      <div
        style={{
          color: COLORS.text,
          fontSize: 11,
          fontWeight: 750,
          marginBottom: description ? 3 : 0,
        }}
      >
        {title}
      </div>

      {description && (
        <div
          style={{
            color: COLORS.muted,
            fontSize: 9,
            lineHeight: 1.45,
          }}
        >
          {description}
        </div>
      )}
    </div>
  )
}

function FieldLabel({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label
      style={{
        display: 'block',
        marginBottom: 11,
      }}
    >
      <span
        style={{
          display: 'block',
          color: COLORS.faint,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 5,
        }}
      >
        {label}
      </span>

      {children}
    </label>
  )
}

function ToggleCard({
  selected,
  title,
  description,
  meta,
  onClick,
}: {
  selected: boolean
  title: string
  description: string
  meta?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: 10,
        display: 'grid',
        gridTemplateColumns: '18px 1fr',
        gap: 9,
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: 7,
        border: `1px solid ${
          selected ? 'rgba(77, 163, 230, 0.5)' : COLORS.border
        }`,
        background: selected
          ? COLORS.blueSoft
          : COLORS.surfaceStrong,
        color: COLORS.text,
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: `1px solid ${
            selected ? COLORS.blue : COLORS.borderStrong
          }`,
          background: selected ? COLORS.blue : 'transparent',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          marginTop: 1,
        }}
      >
        {selected ? '✓' : ''}
      </span>

      <span>
        <span
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 700,
            marginBottom: 3,
          }}
        >
          {title}
        </span>

        <span
          style={{
            display: 'block',
            color: COLORS.muted,
            fontSize: 9,
            lineHeight: 1.4,
          }}
        >
          {description}
        </span>

        {meta && (
          <span
            style={{
              display: 'block',
              color: COLORS.faint,
              fontSize: 8,
              marginTop: 4,
            }}
          >
            {meta}
          </span>
        )}
      </span>
    </button>
  )
}

function InfoBox({
  children,
  tone = 'default',
}: {
  children: React.ReactNode
  tone?: 'default' | 'warning'
}) {
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 7,
        border: `1px solid ${
          tone === 'warning'
            ? 'rgba(232, 181, 91, 0.3)'
            : COLORS.border
        }`,
        background:
          tone === 'warning'
            ? COLORS.amberSoft
            : COLORS.surfaceStrong,
        color:
          tone === 'warning' ? COLORS.amber : COLORS.muted,
        fontSize: 9,
        lineHeight: 1.5,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 36,
  padding: '8px 9px',
  borderRadius: 6,
  border: `1px solid ${COLORS.borderStrong}`,
  outline: 'none',
  background: COLORS.surfaceStrong,
  color: COLORS.text,
  fontSize: 11,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const secondaryButtonStyle: React.CSSProperties = {
  minHeight: 36,
  padding: '8px 10px',
  borderRadius: 6,
  border: `1px solid ${COLORS.borderStrong}`,
  background: COLORS.surfaceStrong,
  color: COLORS.text,
  fontSize: 10,
  fontWeight: 650,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const dataRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  color: COLORS.muted,
  fontSize: 9,
  lineHeight: 1.7,
}
