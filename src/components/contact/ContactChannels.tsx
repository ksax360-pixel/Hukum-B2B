"use client";

import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { track } from "@/lib/track-client";
import { SITE_CONTACT } from "@/data/site-contact";

export function ContactChannels({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const email = SITE_CONTACT.generalEmail;
  const phone = SITE_CONTACT.phone;
  const wa = SITE_CONTACT.whatsapp;
  const office = SITE_CONTACT.office;
  const hasAddress = Boolean(office.address.en);

  const channels = [
    {
      key: "email",
      icon: Mail,
      label: isAr ? "البريد" : "Email",
      value: email,
      href: `mailto:${email}`,
      event: "contact_email_click",
      show: Boolean(email),
    },
    {
      key: "phone",
      icon: Phone,
      label: isAr ? "الهاتف" : "Phone",
      value: phone,
      href: phone ? `tel:${phone.replace(/\s/g, "")}` : "",
      event: "contact_phone_click",
      show: Boolean(phone),
    },
    {
      key: "whatsapp",
      icon: MessageCircle,
      label: "WhatsApp",
      value: wa,
      href: wa ? `https://wa.me/${wa.replace(/\D/g, "")}` : "",
      event: "contact_whatsapp_click",
      show: Boolean(wa),
    },
    {
      key: "location",
      icon: MapPin,
      label: isAr ? "الموقع" : "Location",
      value: [isAr ? office.city.ar : office.city.en, isAr ? office.country.ar : office.country.en]
        .filter(Boolean)
        .join(", "),
      href: hasAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${office.address.en}, ${office.city.en}, ${office.country.en}`
          )}`
        : "",
      event: "contact_location_click",
      show: true,
    },
  ].filter((c) => c.show);

  return (
    <div className="kt-contact-channels">
      {channels.map((c) => {
        const Icon = c.icon;
        const inner = (
          <>
            <span className="kt-contact-channels__icon">
              <Icon size={16} strokeWidth={1.75} />
            </span>
            <span>
              <strong>{c.label}</strong>
              <em>{c.value}</em>
            </span>
          </>
        );
        if (c.href) {
          return (
            <a
              key={c.key}
              href={c.href}
              className="kt-contact-channels__item"
              target={c.key === "whatsapp" || c.key === "location" ? "_blank" : undefined}
              rel={c.key === "whatsapp" || c.key === "location" ? "noopener noreferrer" : undefined}
              onClick={() => void track({ type: c.event, meta: { channel: c.key } })}
            >
              {inner}
            </a>
          );
        }
        return (
          <div key={c.key} className="kt-contact-channels__item is-static">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
