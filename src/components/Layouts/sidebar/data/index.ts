import { LayoutGrid, User, PieChart, FileText, Calendar } from "lucide-react";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: LayoutGrid,
        items: [
          {
            title: "Customers",
            url: "/customers",
            icon: User,
          },
        ],
      },
      {
        title: "Master",
        icon: PieChart,
        items: [
          {
            title: "Station addition",
            url: "/station-submissions",
            icon: FileText,
          },
          {
            title: "Trip Check-ins",
            url: "/trip-checkins",
            icon: Calendar,
          }
        ]
      }
    ],
  },
];
