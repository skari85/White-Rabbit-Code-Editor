export default function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "White Rabbit",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description: "Minimal, open-source code editor built by a visual artist.",
    softwareVersion: "v0.1.0",
    url: "https://www.whiterabbit.onl",
    image: "https://www.whiterabbit.onl/og.jpg",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    sameAs: ["https://github.com/skari85/White-Rabbit-Code-Editor"],
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

