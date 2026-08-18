"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { BatteryCharging, Check, Coins, Loader2, ShoppingBag, Sparkles } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"
import type { ShopProduct, ShopStatusResponse } from "@/lib/shop/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

async function getAccessToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export function ShopExperience() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [shop, setShop] = useState<ShopStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null)

  const loadShop = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) return
    const response = await fetch("/api/shop", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.error || "Magazinul nu a putut fi încărcat.")
    setShop(payload)
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      window.location.assign("/login?next=/shop")
      return
    }
    void loadShop()
      .catch((error: Error) =>
        toast({ title: "Magazin indisponibil", description: error.message, variant: "destructive" })
      )
      .finally(() => setLoading(false))
  }, [authLoading, user, loadShop, toast])

  const purchase = async (product: ShopProduct) => {
    try {
      setBuying(product.key)
      const token = await getAccessToken()
      if (!token) throw new Error("Sesiunea a expirat.")
      const response = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productKey: product.key }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || "Achiziția nu a reușit.")
      setShop(payload.shop)
      toast({
        title: "Achiziție reușită",
        description:
          product.kind === "coupon"
            ? "Cuponul tău este gata de folosit la Premium."
            : "Energia a fost adăugată în cont.",
      })
    } catch (error) {
      toast({
        title: "Nu am putut cumpăra",
        description: error instanceof Error ? error.message : "Încearcă din nou.",
        variant: "destructive",
      })
    } finally {
      setBuying(null)
    }
  }

  if (loading || authLoading || !shop) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7C5CFC]" aria-label="Se încarcă" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-[#5B47D6] via-[#7C5CFC] to-[#a78bfa] p-6 text-white shadow-[0_24px_70px_-35px_rgba(91,71,214,.8)] sm:p-9">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <ShoppingBag className="h-3.5 w-3.5" /> Magazin PLANCKPASS
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Transformă progresul în avantaje
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
              Folosește monedele câștigate ca să iei energie sau reduceri personale la Premium.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2">
            <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <Coins className="h-6 w-6 text-amber-300" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">Monede</p>
                <p className="text-xl font-black">
                  {(shop.coinBalance ?? 0).toLocaleString("ro-RO")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <BatteryCharging className="h-6 w-6 text-cyan-200" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">Energie</p>
                <p className="text-xl font-black">{shop.energyBalance.toLocaleString("ro-RO")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {shop.activeCoupons.length > 0 ? (
        <section>
          <h2 className="text-xl font-black text-gray-900">Cupoanele tale</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {shop.activeCoupons.map((coupon) => (
              <div key={coupon.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-black text-gray-900">-{coupon.percentOff}% Premium</p>
                    <p className="mt-1 text-sm text-emerald-700">Cod personal: {coupon.code}</p>
                  </div>
                  <Check className="h-5 w-5 text-emerald-600" />
                </div>
                <Link
                  href={`/pricing?source=shop&shop_coupon=${encodeURIComponent(coupon.id)}`}
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  Folosește la Premium
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Produse</h2>
            <p className="mt-1 text-sm text-gray-500">Cupoanele sunt personale și se folosesc o singură dată.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {shop.products.map((product) => {
            const isBuying = buying === product.key
            const hasActiveCoupon =
              product.kind === "coupon" &&
              shop.activeCoupons.some((coupon) => coupon.productKey === product.key)
            return (
              <article
                key={product.key}
                className="group flex min-h-64 flex-col rounded-[26px] border border-gray-200 bg-white p-6 shadow-[0_16px_45px_-30px_rgba(15,23,42,.35)] transition hover:-translate-y-1 hover:border-[#cfc7ff]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEEAFE] text-[#5B47D6]">
                  {product.kind === "energy" ? (
                    <BatteryCharging className="h-6 w-6" />
                  ) : (
                    <Sparkles className="h-6 w-6" />
                  )}
                </span>
                <h3 className="mt-5 text-xl font-black text-gray-900">{product.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">{product.description}</p>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  disabled={Boolean(buying) || hasActiveCoupon}
                  className={cn(
                    "mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full font-bold transition",
                    buying || hasActiveCoupon
                      ? "cursor-wait bg-gray-100 text-gray-400"
                      : "bg-[#7C5CFC] text-white shadow-[0_4px_0_#5B47D6] hover:brightness-110 active:translate-y-1 active:shadow-none"
                  )}
                >
                  {isBuying ? <Loader2 className="h-4 w-4 animate-spin" /> : hasActiveCoupon ? <Check className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
                  {hasActiveCoupon
                    ? "Cupon activ"
                    : `${product.coinCost.toLocaleString("ro-RO")} monede`}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <AlertDialog
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => {
          if (!open && !buying) setSelectedProduct(null)
        }}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmi achiziția?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedProduct
                ? `Vei cheltui ${selectedProduct.coinCost.toLocaleString("ro-RO")} Monede Quante pentru ${selectedProduct.name}.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(buying)}>Renunță</AlertDialogCancel>
            <AlertDialogAction
              disabled={!selectedProduct || Boolean(buying)}
              onClick={(event) => {
                event.preventDefault()
                if (!selectedProduct) return
                void purchase(selectedProduct).finally(() => setSelectedProduct(null))
              }}
              className="bg-[#7C5CFC] hover:bg-[#6847eb]"
            >
              {buying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cumpără
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
