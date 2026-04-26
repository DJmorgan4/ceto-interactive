// ── Static Map URL Generators ─────────────────────────────────────────────────
// All free, no API key required except Mapbox (already have token)

export interface MapUrls {
  aerial: string;
  fema: string;
  nwi: string;
  soils: string;
  topo: string;
  regulatory: string;
}

export function generateMapUrls(
  lat: number,
  lng: number,
  mapboxToken: string
): MapUrls {
  const z = 15;
  const z12 = 12;

  // Mapbox satellite aerial — subject property centered
  const aerial = `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-s+1E4976(${lng},${lat})/${lng},${lat},${z},0/800x500@2x?access_token=${mapboxToken}`;

  // Mapbox streets topo context
  const topo = `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/pin-s+1E4976(${lng},${lat})/${lng},${lat},${z12},0/800x500@2x?access_token=${mapboxToken}`;

  // FEMA flood map via FEMA MSC tile service (public, no key)
  const fema = `https://msc.fema.gov/arcgis/rest/services/NFHL/MapServer/export?bbox=${lng - 0.02},${lat - 0.015},${lng + 0.02},${lat + 0.015}&bboxSR=4326&imageSR=4326&size=800,500&format=png32&transparent=false&layers=show:28&f=image`;

  // USFWS NWI via FWS mapper tile service (public, no key)
  const nwi = `https://www.fws.gov/wetlandsmapper/rest/services/Wetlands_Raster/ImageServer/exportImage?bbox=${lng - 0.02},${lat - 0.015},${lng + 0.02},${lat + 0.015}&bboxSR=4326&imageSR=4326&size=800,500&format=png32&f=image`;

  // USDA SSURGO soils via NRCS WMS (public, no key)
  const soils = `https://SDMDataAccess.sc.egov.usda.gov/Spatial/SDM.wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=mapunitpoly&STYLES=&FORMAT=image/png&SRS=EPSG:4326&BBOX=${lng - 0.02},${lat - 0.015},${lng + 0.02},${lat + 0.015}&WIDTH=800&HEIGHT=500`;

  // Regulatory radius map — Mapbox with circle overlay
  const regulatory = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+B43C28(${lng},${lat})/${lng},${lat},${z12},0/800x500@2x?access_token=${mapboxToken}`;

  return { aerial, fema, nwi, soils, topo, regulatory };
}
