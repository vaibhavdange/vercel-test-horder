import { Region } from '@/types/restaurant';

export const regions: Region[] = [
  {
    id: 'india',
    name: 'India',
    code: 'IN',
    country: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    taxRules: [
      {
        id: 'gst',
        name: 'GST',
        rate: 0.18,
        appliesTo: 'all',
        isActive: true,
      },
      {
        id: 'cgst',
        name: 'CGST',
        rate: 0.09,
        appliesTo: 'all',
        isActive: true,
      },
      {
        id: 'sgst',
        name: 'SGST',
        rate: 0.09,
        appliesTo: 'all',
        isActive: true,
      },
    ],
    invoiceTemplate: 'india-standard',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    isActive: true,
  },
  {
    id: 'united-states',
    name: 'United States',
    code: 'US',
    country: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    taxRules: [
      {
        id: 'sales-tax',
        name: 'Sales Tax',
        rate: 0.08,
        appliesTo: 'all',
        isActive: true,
      },
      {
        id: 'food-tax',
        name: 'Food Tax',
        rate: 0.05,
        appliesTo: 'food',
        isActive: true,
      },
    ],
    invoiceTemplate: 'us-standard',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    isActive: true,
  },
  {
    id: 'united-kingdom',
    name: 'United Kingdom',
    code: 'UK',
    country: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    taxRules: [
      {
        id: 'vat',
        name: 'VAT',
        rate: 0.20,
        appliesTo: 'all',
        isActive: true,
      },
      {
        id: 'reduced-vat',
        name: 'Reduced VAT',
        rate: 0.05,
        appliesTo: 'food',
        isActive: true,
      },
    ],
    invoiceTemplate: 'uk-standard',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    isActive: true,
  },
];

export const getRegionById = (id: string): Region | undefined => {
  return regions.find(region => region.id === id);
};

export const getRegionByCode = (code: string): Region | undefined => {
  return regions.find(region => region.code === code);
};

export const getDefaultRegion = (): Region => {
  return regions[0]; // India as default
};
