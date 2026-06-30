import { LeaveRequest, Holiday, TeamMemberOut, LeaveCategory } from './types';

export const DEFAULT_CATEGORIES: LeaveCategory[] = [
  { id: 'cat-accrued', name: 'Accrued', total: 11.52, color: 'text-primary' },
  { id: 'cat-sick', name: 'Sick', total: 7, color: 'text-rose-500' },
  { id: 'cat-optional', name: 'Optional', total: 2, color: 'text-emerald-500' }
];

export const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: 'leave-1',
    type: 'Accrued',
    dateStart: '2026-05-20',
    dateEnd: '2026-05-22',
    days: 3,
    reason: 'Vacation',
    status: 'Approved',
  },
  {
    id: 'leave-2',
    type: 'Accrued',
    dateStart: '2026-08-14',
    dateEnd: '2026-08-14',
    days: 1,
    reason: 'Hyderabad Trip',
    status: 'Approved',
  },
  {
    id: 'leave-3',
    type: 'Optional',
    dateStart: '2026-09-14',
    dateEnd: '2026-09-14',
    days: 1,
    reason: 'Fall Breather',
    status: 'Approved',
  },
  {
    id: 'leave-4',
    type: 'Sick',
    dateStart: '2026-10-28',
    dateEnd: '2026-10-28',
    days: 1,
    reason: 'CAT Prep Sprint',
    status: 'Approved',
  },
  {
    id: 'leave-5',
    type: 'Sick',
    dateStart: '2026-11-18',
    dateEnd: '2026-11-18',
    days: 1,
    reason: 'Mid-week Burnout',
    status: 'Approved',
  },
  {
    id: 'leave-6',
    type: 'Optional',
    dateStart: '2026-11-27',
    dateEnd: '2026-11-27',
    days: 1,
    reason: 'CAT Focus Block',
    status: 'Approved',
  },
  {
    id: 'leave-7',
    type: 'Accrued',
    dateStart: '2026-12-16',
    dateEnd: '2026-12-16',
    days: 0.5,
    reason: 'Winter Home Trip',
    status: 'Approved',
  },
  {
    id: 'leave-8',
    type: 'Accrued',
    dateStart: '2026-12-17',
    dateEnd: '2026-12-31',
    days: 10,
    reason: 'Winter Home Trip',
    status: 'Approved',
  }
];

export const HOLIDAYS: Holiday[] = [
  {
    id: 'hol-1',
    date: '2026-01-01',
    name: "New Year's Day",
    type: 'Mandatory',
  },
  {
    id: 'hol-2',
    date: '2026-01-14',
    name: 'Makara Sankranti/Pongal',
    type: 'Optional',
  },
  {
    id: 'hol-3',
    date: '2026-01-26',
    name: 'Republic Day',
    type: 'Mandatory',
  },
  {
    id: 'hol-4',
    date: '2026-02-15',
    name: 'Maha Shivaratri',
    type: 'Mandatory',
  },
  {
    id: 'hol-5',
    date: '2026-03-04',
    name: 'Holi',
    type: 'Optional',
  },
  {
    id: 'hol-6',
    date: '2026-03-19',
    name: 'Ugadi',
    type: 'Mandatory',
  },
  {
    id: 'hol-7',
    date: '2026-03-21',
    name: 'Idul Fitr (Ramzan)',
    type: 'Mandatory',
  },
  {
    id: 'hol-8',
    date: '2026-03-31',
    name: 'Mahavir Jayanti',
    type: 'Optional',
  },
  {
    id: 'hol-9',
    date: '2026-04-03',
    name: 'Good Friday',
    type: 'Mandatory',
  },
  {
    id: 'hol-10',
    date: '2026-04-14',
    name: 'Dr Ambedkar Jayanti',
    type: 'Optional',
  },
  {
    id: 'hol-11',
    date: '2026-04-20',
    name: 'Basava Jayanti / Akshaya Tritiya',
    type: 'Optional',
  },
  {
    id: 'hol-12',
    date: '2026-05-01',
    name: 'May Day & Buddha Purnima',
    type: 'Mandatory',
  },
  {
    id: 'hol-13',
    date: '2026-05-28',
    name: 'Bakrid / Eid al Adha',
    type: 'Mandatory',
  },
  {
    id: 'hol-14',
    date: '2026-06-26',
    name: 'Muharram',
    type: 'Optional',
  },
  {
    id: 'hol-15',
    date: '2026-08-15',
    name: 'Independence Day',
    type: 'Mandatory',
  },
  {
    id: 'hol-16',
    date: '2026-08-26',
    name: 'Eid e Milad',
    type: 'Optional',
  },
  {
    id: 'hol-17',
    date: '2026-08-28',
    name: 'Raksha Bandhan',
    type: 'Optional',
  },
  {
    id: 'hol-18',
    date: '2026-09-04',
    name: 'Janmashtami',
    type: 'Optional',
  },
  {
    id: 'hol-19',
    date: '2026-09-14',
    name: 'Ganesh Chaturthi',
    type: 'Optional',
  },
  {
    id: 'hol-20',
    date: '2026-10-02',
    name: 'Gandhi Jayanti',
    type: 'Mandatory',
  },
  {
    id: 'hol-21',
    date: '2026-10-10',
    name: 'Mahalaya Amavasye',
    type: 'Mandatory',
  },
  {
    id: 'hol-22',
    date: '2026-10-20',
    name: 'Maha Navami/Ayudh Puja',
    type: 'Optional',
  },
  {
    id: 'hol-23',
    date: '2026-10-21',
    name: 'Vijaya Dashami',
    type: 'Mandatory',
  },
  {
    id: 'hol-24',
    date: '2026-10-26',
    name: 'Maharishi Valmiki Jayanti',
    type: 'Optional',
  },
  {
    id: 'hol-25',
    date: '2026-11-01',
    name: 'Karnataka Rajyotsava',
    type: 'Mandatory',
  },
  {
    id: 'hol-26',
    date: '2026-11-08',
    name: 'Deepavali Day 1',
    type: 'Mandatory',
  },
  {
    id: 'hol-27',
    date: '2026-11-09',
    name: 'Deepavali Day 2',
    type: 'Mandatory',
  },
  {
    id: 'hol-28',
    date: '2026-11-11',
    name: 'Deepavali Holiday (Bhai Dooj)',
    type: 'Optional',
  },
  {
    id: 'hol-29',
    date: '2026-11-24',
    name: 'Guru Nanak Jayanti',
    type: 'Optional',
  },
  {
    id: 'hol-30',
    date: '2026-11-27',
    name: 'Kanakadasa Jayanti',
    type: 'Optional',
  },
  {
    id: 'hol-31',
    date: '2026-12-25',
    name: 'Christmas Day',
    type: 'Mandatory',
  },
];

export const TEAM_MEMBERS: TeamMemberOut[] = [
  {
    name: 'David',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKcrIaCOzQkU_GwL7xdqozlyWhuXErnPDIy_C7aCyqz2MpDIhOzaEd7waLjZmKfs_aWzWkHf6gUerOKP2vT7BkCAFDFvBehVG6S3oloJR6POpvqkUGvNupTuA1rhbNIcSyQsUCfOFBoOLaiROfkILM1IQfW0Uq6uYHpc-OXeEtgx9k88cn3woDBAmwI-2FnKlNu4wyavN-FM_xxsaTpGSWewq7Tu8TymEbKJl-_JalbPzpRx3upn6R',
    type: 'Annual Leave'
  },
  {
    name: 'Sarah',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDS_RVpmeuX1X78mn34gVEdxDMsF7lEcHoSxVg9dOl8uqY1KdyUpRKkHzr66Trw1O6VE94eaKMn6u63ngb9YuFe3uYmyz4jrNWg8YWiCjqyr_cOFDDSpXKVRSsUH5ny8xRjIcOz6NigqxolSXJ-f9qofnr36E1i2YCheSYHvDGBnlZTqT2tC2NL3E3VaFyGjIIEz76A82liVZfXMEdfIWkCUzMRsvIhTfwaRQMcbXQQMYGSKs7dIDj',
    type: 'Annual Leave'
  }
];
