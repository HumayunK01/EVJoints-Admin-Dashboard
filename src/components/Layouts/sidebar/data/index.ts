import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: Icons.FourCircle,
        items: [
          {
            title: "Customers",
            url: "/",
            icon: Icons.User,
          },
        ],
      },
      {
        title: "Master",
        icon: Icons.PieChart,
        items: [
          {
            title: "Station addition",
            url: "/station-submissions",
            icon: Icons.Alphabet,
          },
          {
            title: "Trip Check-ins",
            url: "/trip-checkins",
            icon: Icons.Calendar,
          }
        ]
      }
    ],
  },
];
