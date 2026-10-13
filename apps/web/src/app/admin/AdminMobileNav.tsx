"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { AdminNav } from "./AdminNav";

type Item = { href: string; label: string; show: boolean };

export function AdminMobileNav({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => { setOpen(false); }, [pathname]);
  return (
    <>
      <button
        type="button"
        className="cd-button cd-button-secondary admin-mobile-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Menu
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Admin navigation">
        <AdminNav items={items} onNavigate={() => setOpen(false)} />
      </Modal>
    </>
  );
}
