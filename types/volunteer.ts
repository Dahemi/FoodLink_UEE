export interface VolunteerTask {
  id: string;
  donorInfo: {
    name: string;
    address: string;
    phone: string;
    contactPerson: string;
  };
  ngoInfo: {
    name: string;
    address: string;
    phone: string;
    contactPerson: string;
  };
  foodDetails: {
    type: string;
    quantity: string;
    expiryTime: string;
    specialInstructions?: string;
  };
  pickupTime: string;
  deliveryTime: string;
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  distance?: string;
  estimatedDuration?: string;
}

export interface VolunteerStats {
  completedTasks: number;
  totalDeliveries: number;
  mealsDelivered: number;
  averageRating: number;
  totalHours: number;
  impactScore: number;
}

export interface RescheduleRequest {
  taskId: string;
  newTime: Date;
  reason: string;
  requestedBy: 'volunteer' | 'donor' | 'ngo';
}

export interface TaskFilter {
  status?: VolunteerTask['status'];
  priority?: VolunteerTask['priority'];
  dateRange?: {
    start: Date;
    end: Date;
  };
}
