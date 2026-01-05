import { LayoutGrid, User, PieChart, FileText, Calendar, Zap } from "lucide-react";

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
            title: "Charging Stations",
            url: "/charging-stations",
            icon: Zap,
          },
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
