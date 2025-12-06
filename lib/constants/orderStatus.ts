import {
  Package,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export interface OrderStatusConfig {
  color: string;
  icon: LucideIcon;
  label: string;
}

export const ORDER_STATUS_CONFIG: Record<string, OrderStatusConfig> = {
  pending: {
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    label: "Pending",
  },
  paid: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    label: "Paid",
  },
  shipped: {
    color: "bg-blue-100 text-blue-800",
    icon: Truck,
    label: "Shipped",
  },
  delivered: {
    color: "bg-zinc-100 text-zinc-800",
    icon: Package,
    label: "Delivered",
  },
  cancelled: {
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    label: "Cancelled",
  },
};

export const getOrderStatus = (status: string | null | undefined) =>
  ORDER_STATUS_CONFIG[status ?? "pending"] ?? ORDER_STATUS_CONFIG.pending;

