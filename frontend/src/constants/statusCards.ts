export interface StatusCardConfig {
  key: string;
  statusValue: string;
  labelKey: string;
  tone: "green" | "yellow" | "blue" | "purple" | "red" | "pink";
}

export const DASHBOARD_STATUS_CARDS: StatusCardConfig[] = [
  {
    key: "inStock",
    statusValue: "inStock",
    labelKey: "dashboard.statusCards.inStock",
    tone: "green",
  },
  {
    key: "reserved",
    statusValue: "reserve",
    labelKey: "dashboard.statusCards.reserved",
    tone: "yellow",
  },
  {
    key: "companyReservation",
    statusValue: "reservationForCompanies",
    labelKey: "dashboard.statusCards.companyReservation",
    tone: "pink",
  },
  {
    key: "contract",
    statusValue: "contract",
    labelKey: "dashboard.statusCards.contract",
    tone: "blue",
  },
  {
    key: "cession",
    statusValue: "cession",
    labelKey: "dashboard.statusCards.cession",
    tone: "purple",
  },
  {
    key: "sold",
    statusValue: "sold",
    labelKey: "dashboard.statusCards.sold",
    tone: "red",
  },
  
  
  
  
];
