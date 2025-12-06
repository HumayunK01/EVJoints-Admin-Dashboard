import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        items: [
          {
            title: "Customers",
            url: "/",
            icon: Icons.User,
          },
          {
            title: "Trip Details",
            url: "/trip-details",
            icon: Icons.Table,
          },
        ],
      },
    ],
  },
];
