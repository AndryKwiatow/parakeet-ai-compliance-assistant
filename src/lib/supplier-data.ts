export type RiskCategory = 
  | 'Financial Compliance'
  | 'Data Security'
  | 'Environmental'
  | 'Labor Practices'
  | 'Quality Control'
  | 'Supply Chain'
  | 'Regulatory'
  | 'Cybersecurity';

export interface Supplier {
  id: string;
  name: string;
  riskScore: number;
  riskCategories: RiskCategory[];
  location: string;
  industry: string;
  description: string;
}

export const suppliers: Supplier[] = [
  {
    id: 'S001',
    name: 'MediTech Solutions',
    riskScore: 8,
    riskCategories: ['Data Security', 'Regulatory', 'Cybersecurity'],
    location: 'Boston, MA',
    industry: 'Healthcare',
    description: 'Medical device manufacturer with significant data handling requirements.'
  },
  {
    id: 'S002',
    name: 'Global Pharma Inc',
    riskScore: 7,
    riskCategories: ['Regulatory', 'Quality Control', 'Environmental'],
    location: 'New Jersey, NJ',
    industry: 'Healthcare',
    description: 'Pharmaceutical company with complex regulatory requirements.'
  },
  {
    id: 'S003',
    name: 'TechSecure Systems',
    riskScore: 4,
    riskCategories: ['Cybersecurity', 'Data Security'],
    location: 'Austin, TX',
    industry: 'Technology',
    description: 'IT security solutions provider.'
  },
  {
    id: 'S004',
    name: 'GreenEnergy Corp',
    riskScore: 6,
    riskCategories: ['Environmental', 'Regulatory', 'Supply Chain'],
    location: 'Denver, CO',
    industry: 'Energy',
    description: 'Renewable energy equipment manufacturer.'
  },
  {
    id: 'S005',
    name: 'Global Logistics Ltd',
    riskScore: 9,
    riskCategories: ['Supply Chain', 'Labor Practices', 'Environmental'],
    location: 'Miami, FL',
    industry: 'Logistics',
    description: 'International shipping and logistics company.'
  },
  {
    id: 'S006',
    name: 'SecureBank Systems',
    riskScore: 5,
    riskCategories: ['Financial Compliance', 'Cybersecurity', 'Data Security'],
    location: 'Charlotte, NC',
    industry: 'Financial Services',
    description: 'Banking technology solutions provider.'
  },
  {
    id: 'S007',
    name: 'EcoManufacturing Co',
    riskScore: 3,
    riskCategories: ['Environmental', 'Quality Control'],
    location: 'Portland, OR',
    industry: 'Manufacturing',
    description: 'Sustainable manufacturing company.'
  },
  {
    id: 'S008',
    name: 'HealthData Analytics',
    riskScore: 7,
    riskCategories: ['Data Security', 'Regulatory', 'Cybersecurity'],
    location: 'San Francisco, CA',
    industry: 'Healthcare',
    description: 'Healthcare data analytics and processing company.'
  },
  {
    id: 'S009',
    name: 'Global Retail Solutions',
    riskScore: 6,
    riskCategories: ['Supply Chain', 'Labor Practices', 'Financial Compliance'],
    location: 'Chicago, IL',
    industry: 'Retail',
    description: 'Retail technology and supply chain solutions provider.'
  },
  {
    id: 'S010',
    name: 'Industrial Safety Systems',
    riskScore: 4,
    riskCategories: ['Quality Control', 'Regulatory', 'Environmental'],
    location: 'Houston, TX',
    industry: 'Manufacturing',
    description: 'Industrial safety equipment manufacturer.'
  }
]; 