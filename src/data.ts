import { type Bid } from "./types"

export const categories = [
  { name: "Home repairs", icon: "wrench", tone: "mint" },
  { name: "Tutoring", icon: "book", tone: "yellow" },
  { name: "Photography", icon: "camera", tone: "pink" },
  { name: "Moving", icon: "truck", tone: "lavender" },
  { name: "Deliveries", icon: "bike", tone: "blue" },
  { name: "Event support", icon: "event", tone: "peach" },
  { name: "Something else", icon: "search", tone: "cream" },
]

export const servicePhotos = {
  repair:
    "https://images.unsplash.com/photo-1597497522150-2f50bffea452?auto=format&fit=crop&w=900&q=82",
  tutor:
    "https://images.unsplash.com/photo-1566827886072-417be1953f36?auto=format&fit=crop&w=900&q=82",
  photography:
    "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=900&q=82",
  moving:
    "https://images.unsplash.com/photo-1596199736721-16d3677365a4?auto=format&fit=crop&w=900&q=82",
  cleaning:
    "https://images.unsplash.com/photo-1793016049699-2c071f7867db?auto=format&fit=crop&w=900&q=82",
  provider:
    "https://images.unsplash.com/photo-1682662046457-74fd5b199b92?auto=format&fit=crop&w=1200&q=85",
  delivery:
    "https://images.unsplash.com/photo-1614018453562-77f6180ce036?auto=format&fit=crop&w=900&q=82",
  authRepair:
    "https://images.unsplash.com/photo-1713192704825-74a0017f585d?auto=format&fit=crop&w=900&q=85",
  authMoving:
    "https://images.unsplash.com/photo-1672559987333-976876fa8a12?auto=format&fit=crop&w=700&q=85",
  authCamera:
    "https://images.unsplash.com/photo-1596629917694-39954024f734?auto=format&fit=crop&w=700&q=85",
}

export const initialBids: Bid[] = [
  {
    id: 1,
    name: "Meera Plumbing Works",
    initials: "MP",
    tone: "yellow",
    rating: 4.9,
    reviews: 128,
    distance: 1.2,
    hours: 2,
    price: 380,
    portfolio: [
      servicePhotos.repair,
      servicePhotos.authRepair,
      servicePhotos.cleaning,
    ],
  },
  {
    id: 2,
    name: "Ravi Kumar",
    initials: "RK",
    tone: "mint",
    rating: 4.8,
    reviews: 91,
    distance: 0.8,
    hours: 1,
    price: 450,
    portfolio: [
      servicePhotos.authRepair,
      servicePhotos.moving,
      servicePhotos.provider,
    ],
  },
  {
    id: 3,
    name: "Sanjay Verma",
    initials: "SV",
    tone: "blue",
    rating: 4.7,
    reviews: 63,
    distance: 2.1,
    hours: 3,
    price: 500,
    portfolio: [
      servicePhotos.repair,
      servicePhotos.authMoving,
      servicePhotos.authCamera,
    ],
  },
]

const categoryPhotos: Record<string, string> = {
  "Home repairs": servicePhotos.repair,
  Tutoring: servicePhotos.tutor,
  Photography: servicePhotos.photography,
  Moving: servicePhotos.moving,
  Deliveries: servicePhotos.delivery,
}

export const photoFor = (category: string) => categoryPhotos[category] ?? servicePhotos.repair
