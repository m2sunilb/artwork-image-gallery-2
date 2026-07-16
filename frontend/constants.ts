import { ImageRecord, User, BU, BG, Role } from './types';

export const ROLES: Role[] = ['System Admin', 'GMS Integrator', 'BU Contributor', 'General Viewer'];
export const BUS: BU[] = ['United Kingdom', 'Germany', 'Netherlands', 'United States', 'India', 'Global'];
export const BGS: BG[] = [
  'Beauty & Wellbeing (B&W)',
  'Personal Care (PC)',
  'Home Care (HC)',
  'Nutrition (NU)',
  'Ice Cream (IC)'
];

export const MOCK_USERS: Record<Role, User> = {
  'System Admin': { role: 'System Admin', bu: 'All', bg: 'All', name: 'Bob (Admin)', email: 'bob.admin@unilever.com' },
  'GMS Integrator': { role: 'GMS Integrator', bu: 'All', bg: 'All', name: 'Charlie (TAB)', email: 'charlie.tab@unilever.com' },
  'BU Contributor': { role: 'BU Contributor', bu: 'United Kingdom', bg: 'Beauty & Wellbeing (B&W)', name: 'Alice (R&D)', email: 'alice.rnd@unilever.com' },
  'General Viewer': { role: 'General Viewer', bu: 'All', bg: 'All', name: 'Guest User', email: 'guest.viewer@unilever.com' }
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateSeedRecords = (): ImageRecord[] => [
  {
    id: 'rec_1',
    title: 'Dove Deeply Nourishing Body Wash',
    description: 'Front label artwork with updated moisturizing formula claims and Unilever logo placement.',
    custId: 'PIT-UK-1001',
    tabId: 'TAB-8821',
    bu: 'United Kingdom',
    bg: 'Personal Care (PC)',
    status: 'Active',
    createdBy: 'Alice (R&D)',
    createdAt: '2024-01-10T09:00:00Z',
    modifiedBy: 'Charlie (TAB)',
    modifiedAt: '2024-01-12T14:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=400&q=80',
    hasImage: true,
    history: [
      { id: generateId(), timestamp: '2024-01-10T09:00:00Z', user: 'Alice (R&D)', action: 'Created Record in SQL Server' },
      { id: generateId(), timestamp: '2024-01-12T14:30:00Z', user: 'Charlie (TAB)', action: 'Linked TAB ID & Verified Bucket Asset' }
    ]
  },
  {
    id: 'rec_2',
    title: 'Knorr Tomato Soup Pack',
    description: 'German language nutritional table update and front-of-pack allergen warnings.',
    custId: 'PIT-DE-2044',
    bu: 'Germany',
    bg: 'Nutrition (NU)',
    status: 'Active',
    createdBy: 'Dave (R&D)',
    createdAt: '2024-01-15T10:15:00Z',
    modifiedBy: 'Dave (R&D)',
    modifiedAt: '2024-01-15T10:15:00Z',
    imageUrl: '',
    hasImage: false,
    history: [
      { id: generateId(), timestamp: '2024-01-15T10:15:00Z', user: 'Dave (R&D)', action: 'Created Record (Pending Image Upload to gs://rd_artgallery)' }
    ]
  },
  {
    id: 'rec_3',
    title: 'Hellmanns Real Mayonnaise Jar',
    description: 'Global branding alignment artwork with updated sustainable cage-free egg badge.',
    custId: 'PIT-GL-3099',
    tabId: 'TAB-9002',
    bu: 'Global',
    bg: 'Nutrition (NU)',
    status: 'Archived',
    createdBy: 'Eve (R&D)',
    createdAt: '2023-08-20T11:00:00Z',
    modifiedBy: 'Eve (R&D)',
    modifiedAt: '2024-02-01T10:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=400&q=80',
    hasImage: true,
    history: [
      { id: generateId(), timestamp: '2023-08-20T11:00:00Z', user: 'Eve (R&D)', action: 'Created Record' },
      { id: generateId(), timestamp: '2024-02-01T10:00:00Z', user: 'Eve (R&D)', action: 'Status changed to Archived (Superseded by V4)' }
    ]
  },
  {
    id: 'rec_4',
    title: 'Rexona Men Cobalt Dry Spray',
    description: 'Netherlands regional packaging layout with 72H sweat protection claim.',
    custId: 'PIT-NL-1055',
    bu: 'Netherlands',
    bg: 'Personal Care (PC)',
    status: 'Active',
    createdBy: 'Alice (R&D)',
    createdAt: '2024-02-10T16:45:00Z',
    modifiedBy: 'Alice (R&D)',
    modifiedAt: '2024-02-10T16:45:00Z',
    imageUrl: '',
    hasImage: false,
    history: [
      { id: generateId(), timestamp: '2024-02-10T16:45:00Z', user: 'Alice (R&D)', action: 'Created Record (Pending Image Upload)' }
    ]
  },
  {
    id: 'rec_5',
    title: 'Lipton Yellow Label Tea Festive Pack',
    description: 'Indian market festive edition pack with traditional gold motifs and premium blend badge.',
    custId: 'PIT-IN-4011',
    tabId: 'TAB-7741',
    bu: 'India',
    bg: 'Nutrition (NU)',
    status: 'Active',
    createdBy: 'Raj (R&D)',
    createdAt: '2024-01-12T10:00:00Z',
    modifiedBy: 'Bob (Admin)',
    modifiedAt: '2024-02-15T09:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
    hasImage: true,
    history: [
      { id: generateId(), timestamp: '2024-01-12T10:00:00Z', user: 'Raj (R&D)', action: 'Created Record' },
      { id: generateId(), timestamp: '2024-02-15T09:00:00Z', user: 'Bob (Admin)', action: 'Status verified and synced with SQL Server' }
    ]
  },
  {
    id: 'rec_6',
    title: 'Sunsilk Nourishing Soft & Smooth Conditioner',
    description: 'US market back label ingredients list and recycling instructions.',
    custId: 'PIT-US-5022',
    tabId: 'TAB-1102',
    bu: 'United States',
    bg: 'Beauty & Wellbeing (B&W)',
    status: 'Active',
    createdBy: 'Sarah (R&D)',
    createdAt: '2024-01-05T14:00:00Z',
    modifiedBy: 'Sarah (R&D)',
    modifiedAt: '2024-01-05T14:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80',
    hasImage: true,
    history: [
      { id: generateId(), timestamp: '2024-01-05T14:00:00Z', user: 'Sarah (R&D)', action: 'Created Record and uploaded image to gs://rd_artgallery/artwork/PIT-US-5022.png' }
    ]
  },
  {
    id: 'rec_7',
    title: 'Domestos Extended Power Bleach',
    description: 'UK safety warning, child-resistant cap instructions, and active chlorine percentage.',
    custId: 'PIT-UK-1088',
    bu: 'United Kingdom',
    bg: 'Home Care (HC)',
    status: 'Active',
    createdBy: 'Alice (R&D)',
    createdAt: '2024-02-20T11:30:00Z',
    modifiedBy: 'Alice (R&D)',
    modifiedAt: '2024-02-20T11:30:00Z',
    imageUrl: '',
    hasImage: false,
    history: [
      { id: generateId(), timestamp: '2024-02-20T11:30:00Z', user: 'Alice (R&D)', action: 'Created Record (Pending Image Upload)' }
    ]
  },
  {
    id: 'rec_8',
    title: 'Axe Dark Temptation Body Spray',
    description: 'German market promotional graphics with updated fragrance duration claims.',
    custId: 'PIT-DE-2099',
    tabId: 'TAB-4491',
    bu: 'Germany',
    bg: 'Personal Care (PC)',
    status: 'Active',
    createdBy: 'Dave (R&D)',
    createdAt: '2023-12-18T09:00:00Z',
    modifiedBy: 'Charlie (TAB)',
    modifiedAt: '2023-12-20T15:45:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=400&q=80',
    hasImage: true,
    history: [
      { id: generateId(), timestamp: '2023-12-18T09:00:00Z', user: 'Dave (R&D)', action: 'Created Record' },
      { id: generateId(), timestamp: '2023-12-20T15:45:00Z', user: 'Charlie (TAB)', action: 'Added TAB ID and linked to bucket asset' }
    ]
  },
  {
    id: 'rec_9',
    title: 'Ben & Jerrys Cookie Dough Pint',
    description: 'US packaging lid design with Fairtrade certification and non-GMO ingredient badges.',
    custId: 'PIT-US-5066',
    bu: 'United States',
    bg: 'Ice Cream (IC)',
    status: 'Active',
    createdBy: 'Sarah (R&D)',
    createdAt: '2024-02-02T10:15:00Z',
    modifiedBy: 'Sarah (R&D)',
    modifiedAt: '2024-02-02T10:15:00Z',
    imageUrl: '',
    hasImage: false,
    history: [
      { id: generateId(), timestamp: '2024-02-02T10:15:00Z', user: 'Sarah (R&D)', action: 'Created Record (Pending Image Upload)' }
    ]
  },
  {
    id: 'rec_10',
    title: 'Comfort Intense Fuchsia Passion',
    description: 'Netherlands ultra-concentrated fabric conditioner refill pouch artwork.',
    custId: 'PIT-NL-1099',
    tabId: 'TAB-3301',
    bu: 'Netherlands',
    bg: 'Home Care (HC)',
    status: 'Active',
    createdBy: 'Jan (R&D)',
    createdAt: '2023-11-14T08:30:00Z',
    modifiedBy: 'Jan (R&D)',
    modifiedAt: '2023-11-14T08:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    hasImage: true,
    history: [
      { id: generateId(), timestamp: '2023-11-14T08:30:00Z', user: 'Jan (R&D)', action: 'Created Record and uploaded image to gs://rd_artgallery/artwork/PIT-NL-1099.png' }
    ]
  }
];
