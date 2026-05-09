export interface ShippingOptionDto {
  id: string;
  carrier: string;
  service: string;
  cost: number;
  estimatedDays: number;
  label: string;
}
