import { useEffect } from "react";
import { useLocation } from "wouter";
import { captureSellerRefFromUrl } from "@/lib/sellerRef";

/** Persiste ?ref=CODIGO en cualquier ruta de la app. */
export function SellerRefCapture() {
  const [location] = useLocation();
  useEffect(() => {
    captureSellerRefFromUrl(window.location.search);
  }, [location]);
  return null;
}
