export interface LeaveCategory {
  id: string;
  name: string;
  total: number;
  color: string;
}

export interface LeaveRequest {
  id: string;
  type: string; // Will now store the category name
  dateStart: string;
  dateEnd: string;
  days: number;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  type: 'Company' | 'Mandatory' | 'Optional';
}

export interface TeamMemberOut {
  name: string;
  avatarUrl: string;
  type: string;
}

export interface DayDetail {
  date: string;
  status: string;
  shift: string;
  teamOut: TeamMemberOut[];
}
