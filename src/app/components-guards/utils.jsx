// Sample students (use images instead of emojis)
export const sampleStudents = [
  {
    id: "2024-09-001",
    name: "Juan Santos",
    grade: "9-A",
    rfid: "RF001234567",
    avatar: "/inoske.jpg", // boy
  },
  {
    id: "2024-07-002",
    name: "Ana Santos",
    grade: "7-B",
    rfid: "RF001234568",
    avatar: "/halloween fuyutsi.png", // girl
  },
  {
    id: "2024-10-003",
    name: "Miguel Rodriguez",
    grade: "10-C",
    rfid: "RF001234569",
    avatar: "/inoske.jpg", // boy
  },
  {
    id: "2024-08-004",
    name: "Sofia Cruz",
    grade: "8-A",
    rfid: "RF001234570",
    avatar: "/halloween fuyutsi.png", // girl
  },
];


// Notifications
export const adminNotifications = [
  {
    id: 1,
    type: "urgent",
    title: "Fire Drill Scheduled",
    message: "Fire drill at 2:00 PM today.",
    from: "Assistant Principal",
    date: "2025-08-31",
    time: "10:00 AM",
  },
  {
    id: 2,
    type: "info",
    title: "Parent Meeting Today",
    message: "Parent-teacher conference 3:00-5:00 PM.",
    from: "Principal",
    date: "2025-08-31",
    time: "11:15 AM",
  },
];

// School events with date
export const schoolEvents = [
  {
    date: "2025-09-01",
    time: "9:00 AM",
    title: "General Meeting for Parents",
    message: "A general assembly for all parents will be held at the school gym.",
    author: "School Administration",
  },
  {
    date: "2025-09-03",
    time: "All Day",
    title: "First Quarter Exam Week",
    message: "Please be reminded that first quarter examinations will run from Sept 3 to Sept 7.",
    author: "Academic Affairs",
  },

];

// Sick leave students with reported date
export const sickLeaveStudents = [
  { name: "Maria Gonzalez", grade: "8-B", reason: "Fever", reported: "7:30 AM", date: "2025-08-31" },
  { name: "Pedro Alvarez", grade: "10-A", reason: "Stomach flu", reported: "8:15 AM", date: "2025-08-30" },
  { name: "Carmen Lopez", grade: "9-C", reason: "Headache", reported: "9:00 AM", date: "2025-08-27" },
];

// Dashboard stats
export const stats = [
  { title: "Students Present", value: 247, icon: "👥", color: "bg-green-100", note: "Currently In School" },
  { title: "Total Activity", value: 331, icon: "📊", color: "bg-blue-100", note: "↗️ +15 in last hour" },
  { title: "Sick Leave", value: 8, icon: "🏥", color: "bg-red-100", note: "Absent Today" },
];


const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Filter entries by "today"
 */
export function filterToday(data) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  return data.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= todayStart && itemDate <= todayEnd;
  });
}

/**
 * Filter entries by "this week"
 */
export function filterThisWeek(data) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay()); // Sunday
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  end.setHours(23, 59, 59, 999);

  return data.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= start && itemDate <= end;
  });
}

/**
 * Filter entries by "this month"
 */
export function filterThisMonth(data) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return data.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= start && itemDate <= end;
  });
}
