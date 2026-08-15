import newsFrankfurt from "@/assets/news-frankfurt.jpg";
import newsRouting from "@/assets/news-routing.jpg";
import newsElectric from "@/assets/news-electric.jpg";

export interface NewsPost {
  slug: string;
  tag: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
  author: string;
  readTime: string;
  img: string;
  imgCredit: string;
}

export const posts: NewsPost[] = [
  {
    slug: "frankfurt-air-gateway",
    tag: "Network",
    title: "SwiftArc Opens Frankfurt Air Gateway, Cutting Transit Times Across Central Europe",
    excerpt:
      "Our newest logistics facility at Frankfurt Airport represents a major expansion of SwiftArc's European air freight infrastructure, enabling faster, more direct routing to 14 new destinations.",
    body: "The Frankfurt Air Gateway, which became fully operational on July 1, 2026, is SwiftArc's largest single infrastructure investment to date. The 280,000 sq ft facility is equipped with automated sortation conveyors capable of processing up to 18,000 parcels per hour, a dedicated cold-chain annex for temperature-sensitive pharmaceutical and food shipments, and a real-time cargo tracking system integrated directly into the SwiftArc platform.\n\nThe new gateway adds direct air connections to Vienna, Warsaw, Prague, Budapest, Bucharest, Sofia, Zagreb, Ljubljana, Bratislava, Tallinn, Riga, Vilnius, Helsinki, and Reykjavik — destinations that previously required multi-leg transshipment through London Heathrow or Amsterdam Schiphol. Average transit time reductions across these lanes range from 18 to 36 hours.\n\nFor SwiftArc Business and Enterprise customers shipping to Central and Eastern Europe, this means next-business-day delivery is now available to a significantly wider zone. All shipments routed through the Frankfurt gateway are automatically enrolled in SwiftArc's live telemetry programme, giving recipients GPS-level visibility from airside scan to front-door delivery.",
    date: "Jul 3, 2026",
    author: "SwiftArc Network Team",
    readTime: "4 min read",
    img: newsFrankfurt,
    imgCredit: "Aerial cargo operations, Frankfurt",
  },
  {
    slug: "predictive-routing-freight",
    tag: "Product",
    title: "Route Optimization Now Covers Full Freight Lanes, Not Just Last-Mile",
    excerpt:
      "SwiftArc's intelligent routing engine has been extended to analyze full freight corridors — from origin warehouse to destination facility — rather than only the final delivery leg.",
    body: "When SwiftArc first introduced route optimization in 2024, the system was designed to optimize the last-mile segment: choosing between carriers, adjusting estimated arrival windows, and flagging potential residential delivery failures before they occurred. That system has performed well — our prediction accuracy for last-mile ETA windows currently sits at 94.7% within 2-hour bands.\n\nWith the July 2026 update, route optimization now covers the full freight corridor. The engine ingests live data from nine distinct sources: road traffic feeds from TomTom and Google Maps, weather forecasts from NOAA and the European Centre for Medium-Range Weather Forecasts, port congestion indices from Portwatch, customs clearance wait times from 47 border crossing points, carrier performance data from SwiftArc's own network telemetry, air freight capacity signals from IATA, and facility throughput data from our partner warehouses and hubs.\n\nThe result is a system that can proactively identify a bottleneck forming at a hub three days in advance, suggest an alternative routing via a different carrier or gateway, and automatically reassign in-transit shipments before a delay materialises. For Business and Enterprise customers, all rerouting decisions are logged in the ShipmentTimeline and visible in your dashboard in real time.",
    date: "Jun 24, 2026",
    author: "SwiftArc Product Team",
    readTime: "6 min read",
    img: newsRouting,
    imgCredit: "Freight route optimization dashboard",
  },
  {
    slug: "electric-fleet-expansion",
    tag: "Sustainability",
    title: "80% of SwiftArc's EU Last-Mile Fleet Now Running on Electric",
    excerpt:
      "Ahead of our 2027 zero-emission target, SwiftArc has converted the majority of its European urban delivery fleet to battery-electric vehicles, reducing carbon output by an estimated 42,000 tonnes annually.",
    body: "In January 2024, SwiftArc committed publicly to operating a zero-emission last-mile fleet across all EU member states by Q4 2027. Eighteen months ahead of that target, we have crossed the 80% threshold — 6,840 of our 8,550 active EU urban delivery vehicles are now battery-electric.\n\nThe transition has been concentrated in 22 major metropolitan areas including London, Paris, Amsterdam, Berlin, Madrid, Rome, Warsaw, and Stockholm, where urban low-emission zones now restrict or surcharge diesel vehicles. In each of these cities, SwiftArc has partnered with local depot operators to install AC charging infrastructure capable of overnight-charging an entire fleet.\n\nThe environmental impact is measurable. Based on telemetry from our fleet management system, the switch from diesel to electric across these 6,840 vehicles has reduced direct CO₂ emissions by approximately 42,000 tonnes per year — the equivalent of removing 9,100 passenger cars from the road.\n\nFor customers who need to report Scope 3 emissions in their sustainability disclosures, SwiftArc now provides per-shipment carbon intensity data directly via the API and in the dashboard's Export Center. Business and Enterprise customers can download monthly carbon reports in the formats required by GHG Protocol, CDP, and the EU Corporate Sustainability Reporting Directive.",
    date: "Jun 12, 2026",
    author: "SwiftArc Sustainability Team",
    readTime: "5 min read",
    img: newsElectric,
    imgCredit: "SwiftArc electric delivery fleet, Amsterdam",
  },
];
