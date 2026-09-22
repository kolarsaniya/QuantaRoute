export interface DriverProfile {
  id: string;
  vehicleNumber: number;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  vehicleModel: string;
  plate: string;
  fuelType: "EV" | "Diesel";
  batteryOrFuelLevel: number; // percentage
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bloodGroup: string;
  shift: string;
  avatarInitials: string;
  status: "on-route" | "at-depot" | "break" | "offline";
  rating: number;
  completedDeliveries: number;
  totalDeliveries: number;
}

export interface DriverInfo {
  id: number;
  name: string;
  phone: string;
  avatar: string;
  vehicleModel: string;
  plate: string;
  fuelType: "EV" | "Diesel";
  fuelLevel: number;
  rating: number;
}

export const DRIVER_ROSTER: Record<number, DriverInfo> = {
  0: {
    id: 0,
    name: "Rajesh Kumar",
    phone: "+91 98450 12345",
    avatar: "RK",
    vehicleModel: "Tata Ace EV",
    plate: "KA-01-EA-1082",
    fuelType: "EV",
    fuelLevel: 88,
    rating: 4.9,
  },
  1: {
    id: 1,
    name: "Suresh Murthy",
    phone: "+91 98451 67890",
    avatar: "SM",
    vehicleModel: "Ashok Leyland Bada Dost",
    plate: "KA-04-MB-4521",
    fuelType: "Diesel",
    fuelLevel: 74,
    rating: 4.8,
  },
  2: {
    id: 2,
    name: "Anil Deshmukh",
    phone: "+91 98452 34567",
    avatar: "AD",
    vehicleModel: "Mahindra Zor Grand EV",
    plate: "KA-05-EV-9901",
    fuelType: "EV",
    fuelLevel: 92,
    rating: 4.95,
  },
  3: {
    id: 3,
    name: "Mohammed Farooq",
    phone: "+91 98453 78901",
    avatar: "MF",
    vehicleModel: "Eicher Pro 2049",
    plate: "KA-03-TR-6234",
    fuelType: "Diesel",
    fuelLevel: 61,
    rating: 4.7,
  },
  4: {
    id: 4,
    name: "Venkatesh Rao",
    phone: "+91 98454 89012",
    avatar: "VR",
    vehicleModel: "Tata Ultra T.7 EV",
    plate: "KA-02-EV-3310",
    fuelType: "EV",
    fuelLevel: 80,
    rating: 4.85,
  },
};

export type DriverIncidentType =
  | "traffic"
  | "breakdown"
  | "roadblock"
  | "customer_unavailable"
  | "sos";

export interface DriverIncidentReport {
  id: string;
  driverId: string;
  driverName: string;
  vehiclePlate: string;
  type: DriverIncidentType;
  title: string;
  description: string;
  locationName: string;
  lat: number;
  lng: number;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  status: "reported" | "acknowledged" | "resolved";
}

export interface AppNotification {
  id: string;
  senderRole: "admin" | "fleetmanager" | "fleetdriver" | "system";
  senderName: string;
  recipientRole: "all" | "admin" | "fleetmanager" | "fleetdriver";
  recipientId?: string; // driver id or "all"
  recipientName?: string;
  title: string;
  message: string;
  timestamp: string;
  priority: "urgent" | "route_update" | "maintenance" | "general";
  read: boolean;
  acknowledged?: boolean;
  type?: "notification" | "incident_report" | "status_reply";
}

// Alias for compatibility
export type DriverNotification = AppNotification;

export const INITIAL_DRIVERS: DriverProfile[] = [
  {
    id: "DRV-001",
    vehicleNumber: 1,
    name: "Rajesh Kumar",
    phone: "+91 98450 12345",
    email: "driver.rajesh@quantaroute.com",
    licenseNumber: "DL-0420180019234",
    vehicleModel: "Tata Ace EV",
    plate: "KA-01-EA-1082",
    fuelType: "EV",
    batteryOrFuelLevel: 78,
    emergencyContact: {
      name: "Sunita Kumar",
      relationship: "Spouse",
      phone: "+91 98450 99881",
    },
    bloodGroup: "O+",
    shift: "07:30 AM – 04:30 PM (Morning)",
    avatarInitials: "RK",
    status: "on-route",
    rating: 4.9,
    completedDeliveries: 4,
    totalDeliveries: 7,
  },
  {
    id: "DRV-002",
    vehicleNumber: 2,
    name: "Suresh Murthy",
    phone: "+91 97412 88764",
    email: "driver.suresh@quantaroute.com",
    licenseNumber: "DL-0520190044120",
    vehicleModel: "Ashok Leyland Bada Dost",
    plate: "KA-04-MB-4521",
    fuelType: "Diesel",
    batteryOrFuelLevel: 62,
    emergencyContact: {
      name: "Ramesh Murthy",
      relationship: "Brother",
      phone: "+91 97412 11223",
    },
    bloodGroup: "B+",
    shift: "08:00 AM – 05:00 PM (Regular)",
    avatarInitials: "SM",
    status: "on-route",
    rating: 4.8,
    completedDeliveries: 3,
    totalDeliveries: 6,
  },
  {
    id: "DRV-003",
    vehicleNumber: 3,
    name: "Anil Deshmukh",
    phone: "+91 99001 54321",
    email: "driver.anil@quantaroute.com",
    licenseNumber: "DL-0320160088912",
    vehicleModel: "Mahindra Zor Grand EV",
    plate: "KA-05-EV-9901",
    fuelType: "EV",
    batteryOrFuelLevel: 91,
    emergencyContact: {
      name: "Pooja Deshmukh",
      relationship: "Spouse",
      phone: "+91 99001 77665",
    },
    bloodGroup: "A+",
    shift: "07:00 AM – 03:30 PM (Early)",
    avatarInitials: "AD",
    status: "on-route",
    rating: 4.95,
    completedDeliveries: 5,
    totalDeliveries: 8,
  },
  {
    id: "DRV-004",
    vehicleNumber: 4,
    name: "Vikram Gowda",
    phone: "+91 98800 23456",
    email: "driver.vikram@quantaroute.com",
    licenseNumber: "DL-0120200031874",
    vehicleModel: "Eicher Pro 2049",
    plate: "KA-03-TR-6234",
    fuelType: "Diesel",
    batteryOrFuelLevel: 45,
    emergencyContact: {
      name: "Lakshmi Gowda",
      relationship: "Spouse",
      phone: "+91 98800 55443",
    },
    bloodGroup: "AB+",
    shift: "09:00 AM – 06:00 PM (Midday)",
    avatarInitials: "VG",
    status: "break",
    rating: 4.7,
    completedDeliveries: 2,
    totalDeliveries: 5,
  },
  {
    id: "DRV-005",
    vehicleNumber: 5,
    name: "Karthik Nair",
    phone: "+91 96111 98765",
    email: "driver.karthik@quantaroute.com",
    licenseNumber: "DL-0220210065431",
    vehicleModel: "Piaggio Ape E-Xtra EV",
    plate: "KA-02-EV-3310",
    fuelType: "EV",
    batteryOrFuelLevel: 84,
    emergencyContact: {
      name: "Devi Nair",
      relationship: "Mother",
      phone: "+91 96111 22334",
    },
    bloodGroup: "O-",
    shift: "08:00 AM – 05:00 PM (Regular)",
    avatarInitials: "KN",
    status: "on-route",
    rating: 4.85,
    completedDeliveries: 4,
    totalDeliveries: 6,
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "NOTIF-1",
    senderRole: "admin",
    senderName: "Admin",
    recipientRole: "fleetdriver",
    recipientId: "DRV-001",
    recipientName: "Rajesh Kumar",
    title: "Priority Delivery Notice",
    message: "Customer at Indiranagar (#2) has requested arrival before 10:30 AM for express parcel handover.",
    timestamp: "10 mins ago",
    priority: "urgent",
    read: false,
    acknowledged: false,
    type: "notification",
  },
  {
    id: "NOTIF-2",
    senderRole: "system",
    senderName: "System Dispatch",
    recipientRole: "all",
    title: "Quantum Reroute Computed",
    message: "Traffic congestion detected near Majestic. Your in-cab GPS navigation path has been auto-rerouted via Cubbon Rd (saves ~11 mins).",
    timestamp: "24 mins ago",
    priority: "route_update",
    read: false,
    acknowledged: true,
    type: "notification",
  },
  {
    id: "NOTIF-3",
    senderRole: "fleetdriver",
    senderName: "Rajesh Kumar (Driver #1)",
    recipientRole: "admin",
    recipientName: "Admin Console",
    title: "Incident Report: Heavy Traffic Jam",
    message: "Heavy gridlock encountered at Outer Ring Rd flyover junction. Estimated delay: 15 minutes. Requesting detour clearance.",
    timestamp: "18 mins ago",
    priority: "urgent",
    read: false,
    acknowledged: false,
    type: "incident_report",
  },
  {
    id: "NOTIF-4",
    senderRole: "fleetdriver",
    senderName: "Suresh Murthy (Driver #2)",
    recipientRole: "admin",
    recipientName: "Admin Console",
    title: "Driver Status: Stop #3 Completed",
    message: "Delivered 5 cargo boxes to Whitefield Tech Park. Recipient signature recorded. Proceeding to KR Puram.",
    timestamp: "32 mins ago",
    priority: "general",
    read: true,
    acknowledged: true,
    type: "status_reply",
  },
  {
    id: "NOTIF-5",
    senderRole: "fleetmanager",
    senderName: "Fleet Manager",
    recipientRole: "fleetdriver",
    recipientId: "DRV-001",
    recipientName: "Rajesh Kumar",
    title: "Midday EV Charging Hub Slot",
    message: "Fast charging bay #3 reserved for your Tata Ace EV at Koramangala Hub from 01:15 PM – 01:45 PM.",
    timestamp: "1 hour ago",
    priority: "maintenance",
    read: true,
    acknowledged: true,
    type: "notification",
  },
  {
    id: "NOTIF-6",
    senderRole: "system",
    senderName: "Safety Control",
    recipientRole: "all",
    title: "Weather & Speed Advisory",
    message: "Light rain forecast in East Bangalore. Recommended road speed reduced to 35 km/h for heavy cargo safety.",
    timestamp: "2 hours ago",
    priority: "general",
    read: true,
    acknowledged: true,
    type: "notification",
  },
];
