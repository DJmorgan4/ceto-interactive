export const runtime = 'nodejs';

type FeedItem = {
  title: string;
  link: string;
  source: string;
  publishedAt?: string;
  summary?: string;
  category?: string;
  impact?: 'high' | 'medium' | 'low';
  deadline?: string;
};

export async function GET() {
  const items: FeedItem[] = [
    // URGENT ITEMS - High impact with deadlines
    {
      title: 'EPA Proposes New PFAS Maximum Contaminant Levels - Comment Period Closing',
      link: 'https://www.federalregister.gov/documents/2025/01/15/2025-00123/pfas-national-primary-drinking-water-regulation',
      source: 'EPA',
      publishedAt: '2025-01-15T00:00:00Z',
      summary: 'The Environmental Protection Agency proposes enforceable drinking water standards for six PFAS compounds. This rule would require water systems to monitor for PFAS and reduce contamination. Public comments accepted through February 15, 2025.',
      category: 'Clean Water Act',
      impact: 'high',
      deadline: '2025-02-15T23:59:59Z'
    },
    {
      title: 'TCEQ Multi-Sector General Permit - Notice of Intent Deadline Approaching',
      link: 'https://www.tceq.texas.gov/permitting/stormwater/msgp-2026-renewal',
      source: 'TCEQ',
      publishedAt: '2025-01-08T00:00:00Z',
      summary: 'Industrial facilities currently covered under the 2021 MSGP must submit a new Notice of Intent by January 20, 2025 to maintain stormwater discharge authorization. Failure to submit will result in lapsed coverage.',
      category: 'Stormwater',
      impact: 'high',
      deadline: '2025-01-20T23:59:59Z'
    },
    {
      title: 'Section 404 Nationwide Permit Public Comment Period - Final Week',
      link: 'https://www.federalregister.gov/documents/2025/06/18/2025-11190/nationwide-permits-renewal',
      source: 'USACE',
      publishedAt: '2025-06-18T00:00:00Z',
      summary: 'U.S. Army Corps of Engineers seeks comments on proposed renewal and revision of 56 nationwide permits for wetlands and waters. Includes new fish passage permit and streamlined authorization processes.',
      category: 'Wetlands',
      impact: 'high',
      deadline: '2025-08-15T23:59:59Z'
    },

    // TOP STORIES - High impact, no immediate deadline
    {
      title: 'Federal Wetlands Jurisdiction Dramatically Narrowed Under New Guidance',
      link: 'https://www.epa.gov/wotus/continuous-surface-connection-guidance',
      source: 'EPA',
      publishedAt: '2025-03-12T00:00:00Z',
      summary: 'EPA and U.S. Army Corps of Engineers clarify that only wetlands with continuous surface connections to navigable waters are federally regulated. This major policy shift could exempt thousands of wetlands from Clean Water Act Section 404 permit requirements, significantly affecting development projects nationwide.',
      category: 'Wetlands',
      impact: 'high'
    },
    {
      title: 'Endangered Species Act Regulations Face Major Overhaul',
      link: 'https://www.fws.gov/project/endangered-species-act-regulation-revisions',
      source: 'USFWS',
      publishedAt: '2025-11-21T00:00:00Z',
      summary: 'U.S. Fish and Wildlife Service and NOAA Fisheries propose reinstating 2019 ESA framework, removing blanket threatened species protections and revising critical habitat designation criteria. Changes would affect consultations for federal projects and private land development.',
      category: 'Endangered Species',
      impact: 'high'
    },
    {
      title: 'NEPA Implementing Regulations Rescinded Across Federal Agencies',
      link: 'https://www.federalregister.gov/documents/2025/07/03/2025-12326/nepa-usda-regulations',
      source: 'USDA/DOE/DOI',
      publishedAt: '2025-07-03T00:00:00Z',
      summary: 'Following CEQ regulation repeal, USDA, Department of Energy, and Department of Interior finalize removal of NEPA implementing regulations. Agencies will maintain environmental review procedures in internal handbooks rather than codified regulations. Effective immediately.',
      category: 'NEPA',
      impact: 'high'
    },

    // RECENT UPDATES - Regular monitoring
    {
      title: 'TCEQ Adopts Final Aquaculture General Permit Amendments',
      link: 'https://www.tceq.texas.gov/permitting/wastewater/aquaculture-txg130000',
      source: 'TCEQ',
      publishedAt: '2025-09-10T00:00:00Z',
      summary: 'Texas Commission on Environmental Quality adopts amendments to Aquaculture General Permit consistent with House Bill 609. Changes include expanded wastewater definitions and allowances for oyster mariculture operations.',
      category: 'Water Quality',
      impact: 'medium'
    },
    {
      title: 'EPA Finalizes Clean Water Act Analytical Methods Update',
      link: 'https://www.federalregister.gov/documents/2025/04/10/2025-06234/cwa-methods-update-rule-22',
      source: 'EPA',
      publishedAt: '2025-04-10T00:00:00Z',
      summary: 'Environmental Protection Agency adds and updates approved analytical methods for measuring contaminants in wastewater effluent under Clean Water Act. New methods improve detection capabilities for emerging contaminants.',
      category: 'Clean Water Act',
      impact: 'medium'
    },
    {
      title: '2025-26 Migratory Bird Hunting Frameworks Published',
      link: 'https://www.federalregister.gov/documents/2025/08/18/2025-15703/migratory-bird-hunting-final-frameworks',
      source: 'USFWS',
      publishedAt: '2025-08-18T00:00:00Z',
      summary: 'U.S. Fish and Wildlife Service publishes final frameworks for 2025-26 waterfowl hunting season. States select season dates and bag limits within federal frameworks using adaptive harvest management.',
      category: 'Wildlife',
      impact: 'low'
    },
    {
      title: 'Farm Bill Extension Continues Conservation Program Funding',
      link: 'https://www.usda.gov/farmbill/2025-extension',
      source: 'USDA',
      publishedAt: '2024-12-21T00:00:00Z',
      summary: 'One-year extension of 2018 Farm Bill maintains funding for Environmental Quality Incentives Program, Conservation Stewardship Program, and Agricultural Conservation Easement Program through September 2025.',
      category: 'Agriculture',
      impact: 'medium'
    },
    {
      title: 'Texas Groundwater Districts Issue Updated Management Plans',
      link: 'https://www.twdb.texas.gov/groundwater/management-plans/',
      source: 'TWDB',
      publishedAt: '2025-01-05T00:00:00Z',
      summary: 'Texas Water Development Board reports that groundwater conservation districts across the state have submitted updated management plans addressing drought conditions and aquifer sustainability.',
      category: 'Water Resources',
      impact: 'low'
    },
    {
      title: 'DOE Revises NEPA Procedures for Energy Projects',
      link: 'https://www.federalregister.gov/documents/2025/07/03/2025-12383/doe-nepa-interim-final-rule',
      source: 'Department of Energy',
      publishedAt: '2025-07-03T00:00:00Z',
      summary: 'Department of Energy substantially revises NEPA implementing procedures following CEQ regulation rescission. Changes streamline environmental reviews for energy infrastructure projects.',
      category: 'NEPA',
      impact: 'medium'
    },
    {
      title: 'EPA Region 6 Announces Enforcement Initiative for Industrial Stormwater',
      link: 'https://www.epa.gov/enforcement/region-6-industrial-stormwater-initiative',
      source: 'EPA Region 6',
      publishedAt: '2025-01-10T00:00:00Z',
      summary: 'EPA Region 6 launches targeted enforcement initiative focusing on industrial stormwater compliance in Texas, Louisiana, Oklahoma, Arkansas, and New Mexico. Facilities should review MSGP requirements.',
      category: 'Stormwater',
      impact: 'medium'
    },
    {
      title: 'TCEQ Proposes Updates to Concrete Batch Plant Regulations',
      link: 'https://www.tceq.texas.gov/rules/concrete-batch-sb763-sb2351',
      source: 'TCEQ',
      publishedAt: '2025-05-15T00:00:00Z',
      summary: 'Texas regulators propose revisions to protectiveness review and amendment requirements for concrete batch plants implementing Senate Bills 763 and 2351 from 89th Legislature.',
      category: 'Air Quality',
      impact: 'low'
    },
    {
      title: 'Federal Highway Administration Updates NEPA Transportation Regulations',
      link: 'https://www.federalregister.gov/documents/2025/07/03/2025-12364/fhwa-nepa-revision',
      source: 'FHWA',
      publishedAt: '2025-07-03T00:00:00Z',
      summary: 'FHWA, FRA, and FTA modify NEPA regulations for transportation projects to align with BUILDER Act amendments and removal of CEQ regulations. Changes effective immediately.',
      category: 'NEPA',
      impact: 'medium'
    },
    {
      title: 'Texas Parks and Wildlife Announces Public Land Hunting Opportunities',
      link: 'https://tpwd.texas.gov/huntwild/hunt/public/',
      source: 'TPWD',
      publishedAt: '2025-08-01T00:00:00Z',
      summary: 'Texas Parks and Wildlife Department releases 2025-26 public hunting opportunities on wildlife management areas. Applications for annual permits open September 1.',
      category: 'Wildlife',
      impact: 'low'
    },
    {
      title: 'NOAA Fisheries Updates Endangered Marine Species Critical Habitat',
      link: 'https://www.fisheries.noaa.gov/action/critical-habitat-designation-gulf-sturgeon',
      source: 'NOAA Fisheries',
      publishedAt: '2024-12-18T00:00:00Z',
      summary: 'National Marine Fisheries Service revises critical habitat designations for Gulf sturgeon in Texas coastal waters. Updates reflect current distribution data and habitat conditions.',
      category: 'Endangered Species',
      impact: 'low'
    },
    {
      title: 'EPA Issues PFAS Testing Order for Public Water Systems',
      link: 'https://www.epa.gov/sdwa/and-polyfluoroalkyl-substances-pfas',
      source: 'EPA',
      publishedAt: '2025-01-07T00:00:00Z',
      summary: 'Environmental Protection Agency issues testing order requiring public water systems to monitor for 29 PFAS compounds. Results will inform future regulatory decisions on additional forever chemicals.',
      category: 'Drinking Water',
      impact: 'medium'
    },
    {
      title: 'Railroad Commission of Texas Updates Waste Disposal Well Regulations',
      link: 'https://www.rrc.texas.gov/oil-and-gas/applications-and-permits/injection-disposal-wells/',
      source: 'Railroad Commission of Texas',
      publishedAt: '2024-12-15T00:00:00Z',
      summary: 'Railroad Commission adopts rule amendments for Class II injection wells addressing seismicity concerns and enhanced monitoring requirements for waste disposal operations.',
      category: 'Water Quality',
      impact: 'medium'
    }
  ];

  // Simulate realistic API delay
  await new Promise(resolve => setTimeout(resolve, 600));

  return Response.json({ items });
}
