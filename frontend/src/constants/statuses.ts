export const OFFICIAL_VEHICLE_STATUSES = [
  {
    value: "sold",
    rawValue: "Sold",
    labelKey: "status.sold",
  },
  {
    value: "inStock",
    rawValue: "In-Stock",
    labelKey: "status.inStock",
  },
  {
    value: "notAvailable",
    rawValue: "Not-Available",
    labelKey: "status.notAvailable",
  },
  {
    value: "reserve",
    rawValue: "Reserve",
    labelKey: "status.reserve",
  },
  {
    value: "reservationForCompanies",
    rawValue: "Reservation for Companies",
    labelKey: "status.reservationForCompanies",
  },
  {
    value: "cession",
    rawValue: "Cession",
    labelKey: "status.cession",
  },
  {
    value: "contract",
    rawValue: "Contract",
    labelKey: "status.contract",
  },
  {
    value: "error",
    rawValue: "Error",
    labelKey: "status.error",
  },
] as const;

export type OfficialVehicleStatus = (typeof OFFICIAL_VEHICLE_STATUSES)[number]["value"] | "unknown";
