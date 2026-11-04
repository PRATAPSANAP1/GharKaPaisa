import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://gharkapaisa.in";

const SEO_CONFIG = {
  "/": {
    title: "GharKaPaisa – Credit Cards, Loans & Insurance in India",
    description:
      "Explore credit cards, personal loans, insurance and financial services in India with GharKaPaisa. Compare available offers and find products that match your needs.",
    index: true,
  },
  "/credit-cards": {
    title: "Compare Credit Cards in India | GharKaPaisa",
    description:
      "Explore credit cards from leading banks in India. Compare available features, benefits and offers to find a card that suits your needs.",
    index: true,
  },
  "/loans": {
    title: "Personal, Home & Business Loans | GharKaPaisa",
    description:
      "Explore personal, home and business loan options with GharKaPaisa. Review available offers and find financing options that suit your needs.",
    index: true,
  },
  "/insurance": {
    title: "Explore Insurance Plans in India | GharKaPaisa",
    description:
      "Explore life, health and general insurance options with GharKaPaisa. Review available plans and find coverage that fits your needs.",
    index: true,
  },
  "/careers": {
    title: "Careers & Job Opportunities | GharKaPaisa",
    description:
      "Explore career opportunities at GharKaPaisa and learn about available job openings.",
    index: true,
  },
  "/contact": {
    title: "Contact GharKaPaisa | Customer Support",
    description:
      "Get in touch with GharKaPaisa for assistance with financial products, services and general inquiries.",
    index: true,
  },
};

const DEFAULT_SEO = {
  title: "GharKaPaisa – Financial Services in India",
  description: "Explore financial products and services with GharKaPaisa.",
  index: false,
};

export default function SEO({ noIndex = false }) {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
    const config = SEO_CONFIG[path] || DEFAULT_SEO;

    document.title = config.title;

    const setMeta = (attribute, key, content) => {
      let element = document.head.querySelector(
        `meta[${attribute}="${key}"]`
      );

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    setMeta("name", "description", config.description);

    setMeta(
      "name",
      "robots",
      noIndex || !config.index ? "noindex, follow" : "index, follow"
    );

    const canonicalUrl = `${SITE_URL}${path}`;

    let canonical = document.head.querySelector('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }

    canonical.setAttribute("href", canonicalUrl);
  }, [location.pathname, noIndex]);

  return null;
}
