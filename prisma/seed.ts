import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

const createDemo = process.env.DEMO_SEED === 'true'

type RouteSeed = {
  id: string
  origin: string
  destination: string
  distance: number
  durationHours: number
  basePrice: number
  busPlateNumber: string
  stops: Array<{
    city: string
    name: string
    role: 'ORIGIN' | 'STOP' | 'DESTINATION'
  }>
  departures: Array<{
    hour: number
    minute: number
    promoPercentage?: number
  }>
}

const busConfigs = [
  {
    plateNumber: 'AR-001-AB',
    name: 'Bus Premium 1',
    brand: 'Yutong',
    capacity: 50,
    seatType: 'STANDARD',
    seatsPerRow: 5,
    amenities: 'WiFi, Climatisation, USB',
  },
  {
    plateNumber: 'AR-002-AB',
    name: 'Bus VIP 1',
    brand: 'Mercedes',
    capacity: 30,
    seatType: 'VIP',
    seatsPerRow: 5,
    amenities: 'Climatisation, Sièges inclinables, USB',
  },
  {
    plateNumber: 'AR-003-KS',
    name: 'Navette Kin Express',
    brand: 'Toyota Coaster',
    capacity: 18,
    seatType: 'STANDARD',
    seatsPerRow: 3,
    amenities: 'Climatisation, Charge USB',
  },
  {
    plateNumber: 'AR-004-KS',
    name: 'Intercity Confort',
    brand: 'Scania',
    capacity: 45,
    seatType: 'STANDARD',
    seatsPerRow: 5,
    amenities: 'WiFi, Climatisation, Sièges inclinables',
  },
]

const vehicleConfigs = [
  {
    plateNumber: 'AR-CAR-001',
    brand: 'Toyota',
    model: 'Corolla',
    type: 'CAR',
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    seats: 5,
    dailyRate: 45000,
    color: 'Blanc',
    mileage: 68000,
    features: ['Climatisation', 'Bluetooth', 'USB'],
  },
  {
    plateNumber: 'AR-VAN-002',
    brand: 'Hyundai',
    model: 'H1',
    type: 'VAN',
    fuelType: 'DIESEL',
    transmission: 'MANUAL',
    seats: 9,
    dailyRate: 70000,
    color: 'Gris',
    mileage: 92000,
    features: ['Climatisation', 'GPS', 'Prise 12V'],
  },
  {
    plateNumber: 'AR-SUV-003',
    brand: 'Nissan',
    model: 'X-Trail',
    type: 'SUV',
    fuelType: 'HYBRID',
    transmission: 'AUTOMATIC',
    seats: 7,
    dailyRate: 85000,
    color: 'Noir',
    mileage: 54000,
    features: ['4x4', 'Caméra recul', 'Bluetooth'],
  },
]

const routeSeeds: RouteSeed[] = [
  {
    id: 'route-1',
    origin: 'Abidjan',
    destination: 'Yamoussoukro',
    distance: 240,
    durationHours: 3,
    basePrice: 5000,
    busPlateNumber: 'AR-001-AB',
    stops: [
      { city: 'Abidjan', name: 'Gare Adjamé', role: 'ORIGIN' },
      { city: 'Yamoussoukro', name: 'Gare principale', role: 'DESTINATION' },
    ],
    departures: [
      { hour: 7, minute: 30 },
      { hour: 12, minute: 30 },
      { hour: 18, minute: 0, promoPercentage: 10 },
    ],
  },
  {
    id: 'route-2',
    origin: 'Abidjan',
    destination: 'Bouaké',
    distance: 350,
    durationHours: 4,
    basePrice: 8000,
    busPlateNumber: 'AR-002-AB',
    stops: [
      { city: 'Abidjan', name: 'Gare Adjamé', role: 'ORIGIN' },
      { city: 'Yamoussoukro', name: 'Gare principale', role: 'STOP' },
      { city: 'Bouaké', name: 'Gare routière', role: 'DESTINATION' },
    ],
    departures: [
      { hour: 8, minute: 0 },
      { hour: 14, minute: 0 },
    ],
  },
  {
    id: 'route-yam-abj',
    origin: 'Yamoussoukro',
    destination: 'Abidjan',
    distance: 240,
    durationHours: 3,
    basePrice: 5000,
    busPlateNumber: 'AR-001-AB',
    stops: [
      { city: 'Yamoussoukro', name: 'Gare principale', role: 'ORIGIN' },
      { city: 'Abidjan', name: 'Gare Adjamé', role: 'DESTINATION' },
    ],
    departures: [
      { hour: 6, minute: 30 },
      { hour: 15, minute: 0 },
    ],
  },
  {
    id: 'route-bke-abj',
    origin: 'Bouaké',
    destination: 'Abidjan',
    distance: 350,
    durationHours: 4,
    basePrice: 8000,
    busPlateNumber: 'AR-002-AB',
    stops: [
      { city: 'Bouaké', name: 'Gare routière', role: 'ORIGIN' },
      { city: 'Yamoussoukro', name: 'Gare principale', role: 'STOP' },
      { city: 'Abidjan', name: 'Gare Adjamé', role: 'DESTINATION' },
    ],
    departures: [
      { hour: 6, minute: 0 },
      { hour: 16, minute: 30, promoPercentage: 15 },
    ],
  },
  {
    id: 'route-kin-band',
    origin: 'Kinshasa',
    destination: 'Bandundu',
    distance: 420,
    durationHours: 7,
    basePrice: 12000,
    busPlateNumber: 'AR-004-KS',
    stops: [
      { city: 'Kinshasa', name: 'Gare Centrale', role: 'ORIGIN' },
      { city: 'Kikwit', name: 'Gare Kikwit', role: 'STOP' },
      { city: 'Bandundu', name: 'Gare Bandundu', role: 'DESTINATION' },
    ],
    departures: [
      { hour: 6, minute: 0 },
      { hour: 20, minute: 0, promoPercentage: 5 },
    ],
  },
  {
    id: 'route-band-kin',
    origin: 'Bandundu',
    destination: 'Kinshasa',
    distance: 420,
    durationHours: 7,
    basePrice: 12000,
    busPlateNumber: 'AR-004-KS',
    stops: [
      { city: 'Bandundu', name: 'Gare Bandundu', role: 'ORIGIN' },
      { city: 'Kikwit', name: 'Gare Kikwit', role: 'STOP' },
      { city: 'Kinshasa', name: 'Gare Centrale', role: 'DESTINATION' },
    ],
    departures: [
      { hour: 5, minute: 30 },
      { hour: 19, minute: 30 },
    ],
  },
  {
    id: 'route-kinkole-gombe',
    origin: 'Kinkole',
    destination: 'Gombe',
    distance: 38,
    durationHours: 1.25,
    basePrice: 2500,
    busPlateNumber: 'AR-003-KS',
    stops: [
      { city: 'Kinkole', name: 'Terminal Kinkole', role: 'ORIGIN' },
      { city: 'Kinshasa', name: 'Gare Centrale', role: 'STOP' },
      { city: 'Gombe', name: 'Arrêt Centre Gombe', role: 'DESTINATION' },
    ],
    departures: [
      { hour: 6, minute: 30 },
      { hour: 9, minute: 30 },
      { hour: 13, minute: 0 },
      { hour: 17, minute: 30 },
    ],
  },
  {
    id: 'route-gombe-kinkole',
    origin: 'Gombe',
    destination: 'Kinkole',
    distance: 38,
    durationHours: 1.25,
    basePrice: 2500,
    busPlateNumber: 'AR-003-KS',
    stops: [
      { city: 'Gombe', name: 'Arrêt Centre Gombe', role: 'ORIGIN' },
      { city: 'Kinshasa', name: 'Gare Centrale', role: 'STOP' },
      { city: 'Kinkole', name: 'Terminal Kinkole', role: 'DESTINATION' },
    ],
    departures: [
      { hour: 7, minute: 15 },
      { hour: 11, minute: 0 },
      { hour: 15, minute: 30 },
      { hour: 19, minute: 0 },
    ],
  },
]

function buildSeatLayout(capacity: number, seatsPerRow: number) {
  const rows = Math.ceil(capacity / seatsPerRow)
  return JSON.stringify({ rows, seatsPerRow, driverSeat: { present: true, numbered: false } })
}

function buildSeats(busId: string, capacity: number, seatType: string, seatsPerRow: number) {
  const seats = [] as Array<{ busId: string; seatNumber: string; seatType: string; isAvailable: boolean }>
  let created = 0
  let rowIndex = 0

  while (created < capacity) {
    for (let seatIndex = 1; seatIndex <= seatsPerRow && created < capacity; seatIndex++) {
      seats.push({
        busId,
        seatNumber: `${String.fromCharCode(65 + rowIndex)}${seatIndex}`,
        seatType,
        isAvailable: true,
      })
      created += 1
    }
    rowIndex += 1
  }

  return seats
}

function buildBusImageDataUri(name: string, plateNumber: string, color: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${color}"/>
          <stop offset="1" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <rect x="120" y="220" width="960" height="230" rx="36" fill="#ffffff" opacity="0.18"/>
      <rect x="180" y="260" width="840" height="110" rx="16" fill="#ffffff" opacity="0.2"/>
      <circle cx="300" cy="470" r="52" fill="#0f172a"/>
      <circle cx="900" cy="470" r="52" fill="#0f172a"/>
      <text x="120" y="130" font-family="Arial, sans-serif" font-size="62" font-weight="800" fill="#ffffff">${name}</text>
      <text x="120" y="185" font-family="Arial, sans-serif" font-size="34" fill="#e2e8f0">${plateNumber}</text>
      <text x="120" y="565" font-family="Arial, sans-serif" font-size="24" fill="#e2e8f0">Aigle Royale • Fleet</text>
    </svg>`
  )}`
}

function buildVehicleImageDataUri(label: string, plateNumber: string, color: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="vg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${color}"/>
          <stop offset="1" stop-color="#111827"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#vg)"/>
      <rect x="180" y="280" width="760" height="150" rx="24" fill="#ffffff" opacity="0.2"/>
      <rect x="280" y="240" width="350" height="70" rx="18" fill="#ffffff" opacity="0.22"/>
      <circle cx="310" cy="460" r="48" fill="#0f172a"/>
      <circle cx="860" cy="460" r="48" fill="#0f172a"/>
      <text x="90" y="120" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#ffffff">${label}</text>
      <text x="90" y="178" font-family="Arial, sans-serif" font-size="30" fill="#e5e7eb">${plateNumber}</text>
      <text x="90" y="560" font-family="Arial, sans-serif" font-size="22" fill="#e5e7eb">Aigle Royale • Vehicle Rental</text>
    </svg>`
  )}`
}

async function main() {
  console.log('🌱 Seeding database...')

  const seedClientPassword = await bcrypt.hash('seed123', 10)
  const seedClient = await prisma.user.upsert({
    where: { email: 'client.seed@aigleroyale.local' },
    update: {
      firstName: 'Client',
      lastName: 'Seed',
      isActive: true,
      role: 'CLIENT',
    },
    create: {
      email: 'client.seed@aigleroyale.local',
      password: seedClientPassword,
      firstName: 'Client',
      lastName: 'Seed',
      role: 'CLIENT',
      isActive: true,
      referralCode: 'AR-CLIENT-SEED',
      loyaltyPoints: 0,
      loyaltyTier: 'BRONZE',
    },
  })

  const demoClientPlain = process.env.CLIENT_PASSWORD || 'demo123'
  const demoClientPassword = await bcrypt.hash(demoClientPlain, 10)
  const demoClient = await prisma.user.upsert({
    where: { email: 'client@demo.com' },
    update: {
      firstName: 'Client',
      lastName: 'Demo',
      role: 'CLIENT',
      isActive: true,
      password: demoClientPassword,
    },
    create: {
      email: 'client@demo.com',
      password: demoClientPassword,
      firstName: 'Client',
      lastName: 'Demo',
      phone: '+2250700000001',
      role: 'CLIENT',
      isActive: true,
      referralCode: 'AR-CLIENT-DEMO',
      loyaltyPoints: 0,
      loyaltyTier: 'BRONZE',
    },
  })

  if (!demoClient.referralCode) {
    await prisma.user.update({
      where: { id: demoClient.id },
      data: { referralCode: 'AR-CLIENT-DEMO' },
    })
  }

  console.log('✅ Client démo créé:', demoClient.email)

  const demoClientAlpha = await prisma.user.upsert({
    where: { email: 'client.alpha@demo.com' },
    update: {
      firstName: 'Client',
      lastName: 'Alpha',
      role: 'CLIENT',
      isActive: true,
      password: demoClientPassword,
      referralCode: 'AR-CLIENT-ALPHA',
      loyaltyTier: 'BRONZE',
    },
    create: {
      email: 'client.alpha@demo.com',
      password: demoClientPassword,
      firstName: 'Client',
      lastName: 'Alpha',
      phone: '+2250700000101',
      role: 'CLIENT',
      isActive: true,
      referralCode: 'AR-CLIENT-ALPHA',
      loyaltyTier: 'BRONZE',
    },
  })

  const demoClientBeta = await prisma.user.upsert({
    where: { email: 'client.beta@demo.com' },
    update: {
      firstName: 'Client',
      lastName: 'Beta',
      role: 'CLIENT',
      isActive: true,
      password: demoClientPassword,
      referralCode: 'AR-CLIENT-BETA',
      loyaltyTier: 'BRONZE',
    },
    create: {
      email: 'client.beta@demo.com',
      password: demoClientPassword,
      firstName: 'Client',
      lastName: 'Beta',
      phone: '+2250700000102',
      role: 'CLIENT',
      isActive: true,
      referralCode: 'AR-CLIENT-BETA',
      loyaltyTier: 'BRONZE',
    },
  })

  console.log('✅ Clients supplémentaires créés:', demoClientAlpha.email, demoClientBeta.email)

  // Créer un administrateur (optionnel — activé uniquement si DEMO_SEED=true)
  let admin: any | undefined
  if (createDemo) {
    const adminPlain = process.env.ADMIN_PASSWORD || 'admin123'
    const adminPassword = await bcrypt.hash(adminPlain, 10)
    admin = await prisma.user.upsert({
      where: { email: 'admin@aigleroyale.com' },
      update: {},
      create: {
        email: 'admin@aigleroyale.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'Aigle Royale',
        role: 'ADMINISTRATOR',
        referralCode: 'AR-ADMIN-0001',
        loyaltyPoints: 0,
        loyaltyTier: 'BRONZE',
      },
    })
    if (!admin.referralCode) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { referralCode: 'AR-ADMIN-0001' },
      })
    }
    console.log('✅ Admin créé:', admin.email)
  } else {
    console.log('Skipped creating demo admin (DEMO_SEED!=true)')
  }

  // Créer un agent démo (optionnel)
  if (createDemo) {
    const agentPlain = process.env.AGENT_PASSWORD || 'demo123'
    const agentPassword = await bcrypt.hash(agentPlain, 10)
    const agent = await prisma.user.upsert({
      where: { email: 'agent@demo.com' },
      update: {},
      create: {
        email: 'agent@demo.com',
        password: agentPassword,
        firstName: 'Jean',
        lastName: 'Kouassi',
        phone: '+225 07 XX XX XX XX',
        role: 'AGENT',
        referralCode: 'AR-AGENT-DEMO',
        loyaltyPoints: 0,
        loyaltyTier: 'BRONZE',
      },
    })
    if (!agent.referralCode) {
      await prisma.user.update({
        where: { id: agent.id },
        data: { referralCode: 'AR-AGENT-DEMO' },
      })
    }
    console.log('✅ Agent démo créé:', agent.email)
  } else {
    console.log('Skipped creating demo agent (DEMO_SEED!=true)')
  }

  // Créer un super agent (vente en agence) - démo (optionnel)
  if (createDemo) {
    const superAgentPlain = process.env.SUPER_AGENT_PASSWORD || 'demo123'
    const superAgentPassword = await bcrypt.hash(superAgentPlain, 10)
    const superAgent = await prisma.user.upsert({
      where: { email: 'superagent@demo.com' },
      update: {},
      create: {
        email: 'superagent@demo.com',
        password: superAgentPassword,
        firstName: 'Marie',
        lastName: 'Koné',
        phone: '+225 01 23 45 67 89',
        role: 'SUPER_AGENT',
        referralCode: 'AR-SUPER-AGENT-DEMO',
        loyaltyPoints: 0,
        loyaltyTier: 'BRONZE',
        gender: 'FEMME',
        birthDate: new Date('1990-05-15'),
        city: 'Abidjan',
        passportOrIdNumber: 'CI2024AB123456',
      },
    })
    if (!superAgent.referralCode) {
      await prisma.user.update({
        where: { id: superAgent.id },
        data: { referralCode: 'AR-SUPER-AGENT-DEMO' },
      })
    }
    console.log('✅ Super Agent démo créé:', superAgent.email)
  } else {
    console.log('Skipped creating demo super agent (DEMO_SEED!=true)')
  }

  // Créer un compte logistique (planning chauffeurs) - démo (optionnel)
  if (createDemo) {
    const logisticsPlain = process.env.LOGISTICS_PASSWORD || 'demo123'
    const logisticsPassword = await bcrypt.hash(logisticsPlain, 10)
    const logistics = await prisma.user.upsert({
      where: { email: 'logistics@demo.com' },
      update: {},
      create: {
        email: 'logistics@demo.com',
        password: logisticsPassword,
        firstName: 'Logistique',
        lastName: 'Aigle Royale',
        phone: '+225 05 XX XX XX XX',
        role: 'LOGISTICS',
        referralCode: 'AR-LOGISTICS-DEMO',
        loyaltyPoints: 0,
        loyaltyTier: 'BRONZE',
      },
    })
    if (!logistics.referralCode) {
      await prisma.user.update({
        where: { id: logistics.id },
        data: { referralCode: 'AR-LOGISTICS-DEMO' },
      })
    }
    console.log('✅ Logistique démo créé:', logistics.email)
  } else {
    console.log('Skipped creating demo logistics account (DEMO_SEED!=true)')
  }

  // Nettoyage (SQLite) - évite les erreurs de contraintes FK lors de la régénération des sièges
  // On purge d'abord les tables dépendantes.

  await prisma.notificationLog.deleteMany({})
  await prisma.notificationCampaign.deleteMany({})
  await prisma.appNotification.deleteMany({})
  await prisma.supportComplaint.deleteMany({})
  await prisma.manifestShare.deleteMany({})
  await prisma.driverScheduleEvent.deleteMany({})
  await prisma.locationVehicule.deleteMany({})
  await prisma.logisticsIssue.deleteMany({})
  await prisma.payment.deleteMany({})
  await prisma.commission.deleteMany({})
  await prisma.loyaltyTransaction.deleteMany({})
  await prisma.travelVoucher.deleteMany({})
  await prisma.bookingHistory.deleteMany({})
  await prisma.booking.deleteMany({})
  await prisma.bookingGroup.deleteMany({})
  await prisma.freightPayment.deleteMany({})
  await prisma.freightOrder.deleteMany({})
  await prisma.avisClient.deleteMany({})
  await prisma.seatSegmentAvailability.deleteMany({})
  await prisma.busRental.deleteMany({})
  await prisma.companyReview.deleteMany({})
  await prisma.driver.deleteMany({})
  await prisma.passengerPricing.deleteMany({})
  await prisma.offer.deleteMany({})
  await prisma.agency.deleteMany({})
  await prisma.setting.deleteMany({})
  await prisma.vehicleRentalHistory.deleteMany({})
  await prisma.vehicleRentalPayment.deleteMany({})
  await prisma.vehicleRental.deleteMany({})
  await prisma.vehicle.deleteMany({})

  // Publicités (démo)
  await prisma.advertisement.deleteMany({})
  await prisma.advertisementInquiry.deleteMany({})

  // Repas à bord (démo)
  // @ts-ignore - le client Prisma sera régénéré après la mise à jour du schema
  await prisma.meal?.deleteMany?.({})
  const now = new Date()
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const bannerSvg = (title: string, subtitle: string, bg: string) =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300" viewBox="0 0 1200 300">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${bg}" stop-opacity="1"/>
            <stop offset="1" stop-color="#111827" stop-opacity="1"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="300" fill="url(#g)"/>
        <circle cx="1050" cy="60" r="110" fill="#ffffff" opacity="0.08"/>
        <circle cx="160" cy="240" r="140" fill="#ffffff" opacity="0.06"/>
        <text x="80" y="140" font-family="Arial, sans-serif" font-size="56" font-weight="800" fill="#ffffff">${title}</text>
        <text x="80" y="200" font-family="Arial, sans-serif" font-size="28" fill="#e5e7eb">${subtitle}</text>
        <text x="80" y="250" font-family="Arial, sans-serif" font-size="18" fill="#d1d5db">Aigle Royale • Espace publicitaire</text>
      </svg>`
    )}`

  if (createDemo) {
    await prisma.advertisement.createMany({
      data: [
        {
          advertiserId: admin.id,
          title: 'Annoncez ici',
          description: 'Votre publicité peut apparaître ici.',
          imageUrl: bannerSvg('Annoncez ici', 'Touchez des milliers de voyageurs', '#2563eb'),
          linkUrl: '/advertise',
          type: 'BANNER_HOMEPAGE',
          status: 'ACTIVE',
          startDate: start,
          endDate: end,
        },
        {
          advertiserId: admin.id,
          title: 'Promo partenaire',
          description: 'Espace disponible — contactez-nous.',
          imageUrl: bannerSvg('Promo partenaire', 'Affichez vos offres sur les résultats', '#16a34a'),
          linkUrl: '/advertise',
          type: 'BANNER_RESULTS',
          status: 'ACTIVE',
          startDate: start,
          endDate: end,
        },
        {
          advertiserId: admin.id,
          title: 'Publicité',
          description: 'Espace disponible — contactez-nous.',
          imageUrl: bannerSvg('Publicité', 'Visible après achat de billet', '#7c3aed'),
          linkUrl: '/advertise',
          type: 'BANNER_CONFIRMATION',
          status: 'ACTIVE',
          startDate: start,
          endDate: end,
        },
      ],
    })
  } else {
    console.log('Skipped creating demo advertisements (DEMO_SEED!=true)')
  }

  // Repas à bord (démo)
  try {
    // @ts-ignore - le client Prisma sera régénéré après la mise à jour du schema
    await prisma.meal.createMany({
      data: [
        { name: 'Poulet braisé + attiéké', description: 'Portion individuelle', price: 2500, isActive: true },
        { name: 'Sandwich', description: 'Poulet / thon (selon disponibilité)', price: 1500, isActive: true },
        { name: 'Eau + jus', description: 'Boisson', price: 700, isActive: true },
      ],
    })
  } catch (e) {
    // ok
  }

  // Créer une compagnie de bus (démo)
  const company = await prisma.busCompany.upsert({
    where: { name: 'Aigle Royale' },
    update: {},
    create: { name: 'Aigle Royale' },
  })

  const uniqueCities = Array.from(new Set(routeSeeds.flatMap((route) => route.stops.map((stop) => stop.city))))
  const cities = new Map<string, Awaited<ReturnType<typeof prisma.city.upsert>>>()

  for (const cityName of uniqueCities) {
    const city = await prisma.city.upsert({
      where: { name: cityName },
      update: { isActive: true },
      create: { name: cityName, isActive: true },
    })
    cities.set(cityName, city)
  }

  const cityStops = new Map<string, Awaited<ReturnType<typeof prisma.cityStop.upsert>>>()
  for (const route of routeSeeds) {
    for (const stop of route.stops) {
      const city = cities.get(stop.city)
      if (!city) continue

      const cityStop = await prisma.cityStop.upsert({
        where: { cityId_name: { cityId: city.id, name: stop.name } },
        update: { isActive: true, type: 'BOTH' },
        create: {
          cityId: city.id,
          name: stop.name,
          type: 'BOTH',
          isActive: true,
        },
      })

      cityStops.set(`${stop.city}:${stop.name}`, cityStop)
    }
  }

  console.log('✅ Villes et arrêts créés')

  const routeIds = routeSeeds.map((route) => route.id)
  await prisma.tripStop.deleteMany({})
  await prisma.trip.deleteMany({ where: { routeId: { in: routeIds } } })
  await prisma.routeStop.deleteMany({ where: { routeId: { in: routeIds } } })

  const routes = new Map<string, Awaited<ReturnType<typeof prisma.route.upsert>>>()
  for (const route of routeSeeds) {
    const originCity = cities.get(route.origin)
    const destinationCity = cities.get(route.destination)

    const savedRoute = await prisma.route.upsert({
      where: { id: route.id },
      update: {
        origin: route.origin,
        destination: route.destination,
        distance: route.distance,
        duration: route.durationHours,
        isActive: true,
        originCityId: originCity?.id,
        destinationCityId: destinationCity?.id,
      },
      create: {
        id: route.id,
        origin: route.origin,
        destination: route.destination,
        distance: route.distance,
        duration: route.durationHours,
        isActive: true,
        originCityId: originCity?.id,
        destinationCityId: destinationCity?.id,
      },
    })

    routes.set(route.id, savedRoute)

    for (const [index, stop] of route.stops.entries()) {
      const cityStop = cityStops.get(`${stop.city}:${stop.name}`)
      if (!cityStop) continue

      await prisma.routeStop.upsert({
        where: { routeId_order: { routeId: savedRoute.id, order: index + 1 } },
        update: {
          stopId: cityStop.id,
          role: stop.role,
        },
        create: {
          routeId: savedRoute.id,
          stopId: cityStop.id,
          order: index + 1,
          role: stop.role,
        },
      })
    }
  }

  console.log('✅ Routes créées')

  const buses = new Map<string, Awaited<ReturnType<typeof prisma.bus.upsert>>>()
  for (const config of busConfigs) {
    const bus = await prisma.bus.upsert({
      where: { plateNumber: config.plateNumber },
      update: {
        companyId: company.id,
        brand: config.brand,
        name: config.name,
        capacity: config.capacity,
        amenities: config.amenities,
        seatType: config.seatType,
        imageUrl: buildBusImageDataUri(config.name, config.plateNumber, '#1d4ed8'),
        seatLayout: buildSeatLayout(config.capacity, config.seatsPerRow),
        isActive: true,
      },
      create: {
        companyId: company.id,
        plateNumber: config.plateNumber,
        name: config.name,
        brand: config.brand,
        capacity: config.capacity,
        seatLayout: buildSeatLayout(config.capacity, config.seatsPerRow),
        amenities: config.amenities,
        seatType: config.seatType,
        imageUrl: buildBusImageDataUri(config.name, config.plateNumber, '#1d4ed8'),
        isActive: true,
      },
    })

    await prisma.seat.deleteMany({ where: { busId: bus.id } })
    await prisma.seat.createMany({
      data: buildSeats(bus.id, config.capacity, config.seatType, config.seatsPerRow),
    })

    buses.set(config.plateNumber, bus)
  }

  console.log('✅ Bus et sièges créés')

  const nowForTrips = new Date()
  const minLeadTime = new Date(nowForTrips.getTime() + 90 * 60000)
  let createdTrips = 0

  for (const [routeIndex, routeSeed] of routeSeeds.entries()) {
    const route = routes.get(routeSeed.id)
    const bus = buses.get(routeSeed.busPlateNumber)
    if (!route || !bus) continue

    let createdToday = false

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      for (const departureTemplate of routeSeed.departures) {
        const departureTime = new Date(nowForTrips)
        departureTime.setDate(departureTime.getDate() + dayOffset)
        departureTime.setHours(departureTemplate.hour, departureTemplate.minute, 0, 0)

        if (dayOffset === 0 && departureTime <= minLeadTime) {
          continue
        }

        const arrivalTime = new Date(departureTime.getTime() + routeSeed.durationHours * 60 * 60000)
        const trip = await prisma.trip.create({
          data: {
            busId: bus.id,
            routeId: route.id,
            departureTime,
            arrivalTime,
            price: routeSeed.basePrice,
            availableSeats: bus.capacity,
            promoActive: Boolean(departureTemplate.promoPercentage),
            promoMode: departureTemplate.promoPercentage ? 'PERCENTAGE' : null,
            promoPrice: departureTemplate.promoPercentage
              ? Math.max(1000, routeSeed.basePrice - (routeSeed.basePrice * departureTemplate.promoPercentage) / 100)
              : null,
            promotionPercentage: departureTemplate.promoPercentage || 0,
          },
        })

        const segmentCount = Math.max(routeSeed.stops.length - 1, 1)
        const legDurationMinutes = Math.round((routeSeed.durationHours * 60) / segmentCount)

        await prisma.tripStop.createMany({
          data: routeSeed.stops.map((stop, index) => {
            const cityStop = cityStops.get(`${stop.city}:${stop.name}`)
            const arrivalMinutes = legDurationMinutes * index
            const departureMinutes = index === 0 ? 0 : arrivalMinutes + 5

            return {
              tripId: trip.id,
              stopId: cityStop!.id,
              order: index + 1,
              arrivalTime: index === 0 ? null : new Date(departureTime.getTime() + arrivalMinutes * 60000),
              departureTime: index === routeSeed.stops.length - 1 ? null : new Date(departureTime.getTime() + departureMinutes * 60000),
              dwellMinutes: index === 0 || index === routeSeed.stops.length - 1 ? null : 5,
            }
          }),
        })

        createdTrips += 1
        if (dayOffset === 0) {
          createdToday = true
        }
      }
    }

    if (!createdToday) {
      const fallbackDeparture = new Date(nowForTrips.getTime() + (120 + routeIndex * 20) * 60000)
      if (fallbackDeparture.toDateString() === nowForTrips.toDateString()) {
        const arrivalTime = new Date(fallbackDeparture.getTime() + routeSeed.durationHours * 60 * 60000)
        const trip = await prisma.trip.create({
          data: {
            busId: bus.id,
            routeId: route.id,
            departureTime: fallbackDeparture,
            arrivalTime,
            price: routeSeed.basePrice,
            availableSeats: bus.capacity,
          },
        })

        const segmentCount = Math.max(routeSeed.stops.length - 1, 1)
        const legDurationMinutes = Math.round((routeSeed.durationHours * 60) / segmentCount)

        await prisma.tripStop.createMany({
          data: routeSeed.stops.map((stop, index) => ({
            tripId: trip.id,
            stopId: cityStops.get(`${stop.city}:${stop.name}`)!.id,
            order: index + 1,
            arrivalTime: index === 0 ? null : new Date(fallbackDeparture.getTime() + legDurationMinutes * index * 60000),
            departureTime: index === routeSeed.stops.length - 1 ? null : new Date(fallbackDeparture.getTime() + (legDurationMinutes * index + (index === 0 ? 0 : 5)) * 60000),
            dwellMinutes: index === 0 || index === routeSeed.stops.length - 1 ? null : 5,
          })),
        })

        createdTrips += 1
      }
    }
  }

  const TARGET_TRIPS = 100
  let allTrips = await prisma.trip.findMany({
    orderBy: { departureTime: 'asc' },
    select: { id: true },
  })

  if (allTrips.length > TARGET_TRIPS) {
    const tripIdsToDelete = allTrips.slice(TARGET_TRIPS).map((t) => t.id)

    await prisma.tripStop.deleteMany({
      where: { tripId: { in: tripIdsToDelete } },
    })

    await prisma.trip.deleteMany({
      where: { id: { in: tripIdsToDelete } },
    })

    allTrips = await prisma.trip.findMany({
      orderBy: { departureTime: 'asc' },
      select: { id: true },
    })
  }

  if (allTrips.length < TARGET_TRIPS) {
    const fallbackRouteSeed = routeSeeds[0]
    const fallbackRoute = routes.get(fallbackRouteSeed.id)
    const fallbackBus = buses.get(fallbackRouteSeed.busPlateNumber)

    if (fallbackRoute && fallbackBus) {
      const lastTrip = await prisma.trip.findFirst({
        orderBy: { departureTime: 'desc' },
        select: { departureTime: true },
      })

      let baseDeparture = lastTrip
        ? new Date(lastTrip.departureTime.getTime() + 2 * 60 * 60 * 1000)
        : new Date(nowForTrips.getTime() + 2 * 60 * 60 * 1000)

      const toCreate = TARGET_TRIPS - allTrips.length
      for (let i = 0; i < toCreate; i++) {
        const departureTime = new Date(baseDeparture)
        const arrivalTime = new Date(departureTime.getTime() + fallbackRouteSeed.durationHours * 60 * 60000)

        const trip = await prisma.trip.create({
          data: {
            busId: fallbackBus.id,
            routeId: fallbackRoute.id,
            departureTime,
            arrivalTime,
            price: fallbackRouteSeed.basePrice,
            availableSeats: fallbackBus.capacity,
            promoActive: false,
            promoMode: null,
            promoPrice: null,
            promotionPercentage: 0,
          },
        })

        const segmentCount = Math.max(fallbackRouteSeed.stops.length - 1, 1)
        const legDurationMinutes = Math.round((fallbackRouteSeed.durationHours * 60) / segmentCount)

        await prisma.tripStop.createMany({
          data: fallbackRouteSeed.stops.map((stop, index) => ({
            tripId: trip.id,
            stopId: cityStops.get(`${stop.city}:${stop.name}`)!.id,
            order: index + 1,
            arrivalTime: index === 0 ? null : new Date(departureTime.getTime() + legDurationMinutes * index * 60000),
            departureTime: index === fallbackRouteSeed.stops.length - 1 ? null : new Date(departureTime.getTime() + (legDurationMinutes * index + (index === 0 ? 0 : 5)) * 60000),
            dwellMinutes: index === 0 || index === fallbackRouteSeed.stops.length - 1 ? null : 5,
          })),
        })

        baseDeparture = new Date(departureTime.getTime() + 2 * 60 * 60 * 1000)
      }
    }
  }

  createdTrips = await prisma.trip.count()

  console.log(`✅ ${createdTrips} trajets créés`)

  const seededVehicles = new Map<string, Awaited<ReturnType<typeof prisma.vehicle.upsert>>>()
  for (const [index, config] of vehicleConfigs.entries()) {
    const color = index === 0 ? '#0284c7' : index === 1 ? '#059669' : '#7c3aed'
    const vehicle = await prisma.vehicle.upsert({
      where: { plateNumber: config.plateNumber },
      update: {
        brand: config.brand,
        model: config.model,
        type: config.type,
        fuelType: config.fuelType,
        transmission: config.transmission,
        seats: config.seats,
        dailyRate: config.dailyRate,
        color: config.color,
        mileage: config.mileage,
        features: JSON.stringify(config.features),
        imageUrl: buildVehicleImageDataUri(`${config.brand} ${config.model}`, config.plateNumber, color),
        isAvailable: true,
        isActive: true,
        description: `Véhicule ${config.type} disponible à la location`,
      },
      create: {
        plateNumber: config.plateNumber,
        brand: config.brand,
        model: config.model,
        type: config.type,
        fuelType: config.fuelType,
        transmission: config.transmission,
        seats: config.seats,
        dailyRate: config.dailyRate,
        color: config.color,
        mileage: config.mileage,
        features: JSON.stringify(config.features),
        imageUrl: buildVehicleImageDataUri(`${config.brand} ${config.model}`, config.plateNumber, color),
        isAvailable: true,
        isActive: true,
        description: `Véhicule ${config.type} disponible à la location`,
      },
    })
    seededVehicles.set(config.plateNumber, vehicle)
  }

  const actorUserId = admin?.id || seedClient.id
  const seededVehicleList = Array.from(seededVehicles.values()).slice(0, 3)
  if (seededVehicleList.length > 0) {
    const now = new Date()
    const renterPool = [seedClient, demoClient, demoClientAlpha, demoClientBeta]
    const statusPlan = ['CONFIRMED', 'PENDING', 'ACTIVE']

    for (let i = 0; i < seededVehicleList.length; i++) {
      const vehicle = seededVehicleList[i]
      const renter = renterPool[i % renterPool.length]
      const status = statusPlan[i % statusPlan.length]
      const startDate = new Date(now.getTime() + (i * 5 + 1) * 24 * 60 * 60 * 1000)
      const endDate = new Date(now.getTime() + (i * 5 + 4) * 24 * 60 * 60 * 1000)
      const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)))
      const extrasAmount = 2000 + i * 1500
      const baseAmount = vehicle.dailyRate * totalDays
      const totalAmount = baseAmount + extrasAmount

      const rental = await prisma.vehicleRental.create({
        data: {
          vehicleId: vehicle.id,
          userId: renter.id,
          contactName: `${renter.firstName} ${renter.lastName}`,
          contactPhone: renter.phone || `+22507000001${i}`,
          contactEmail: renter.email,
          driverName: `${renter.firstName} ${renter.lastName}`,
          startDate,
          endDate,
          pickupLocation: i % 2 === 0 ? 'Abidjan - Plateau' : 'Abidjan - Cocody',
          returnLocation: i % 2 === 0 ? 'Abidjan - Cocody' : 'Abidjan - Plateau',
          dailyRate: vehicle.dailyRate,
          totalDays,
          baseAmount,
          extrasJson: JSON.stringify([{ label: 'GPS', price: extrasAmount }]),
          extrasAmount,
          discountAmount: 0,
          totalAmount,
          status,
          paymentStatus: status === 'PENDING' ? 'UNPAID' : status === 'ACTIVE' ? 'PARTIAL' : 'PAID',
          paymentMethod: status === 'PENDING' ? null : 'CASH',
          confirmedAt: status === 'CONFIRMED' || status === 'ACTIVE' ? new Date() : null,
          startedAt: status === 'ACTIVE' ? new Date() : null,
        },
      })

      if (status === 'CONFIRMED' || status === 'ACTIVE') {
        await prisma.vehicleRentalPayment.create({
          data: {
            rentalId: rental.id,
            amount: status === 'ACTIVE' ? Math.round(totalAmount * 0.6) : totalAmount,
            method: 'CASH',
            status: status === 'ACTIVE' ? 'PENDING' : 'PAID',
            transactionId: `VR-${Date.now()}-${i}`,
            paidAt: status === 'CONFIRMED' ? new Date() : null,
          },
        })
      }

      const historyRows: Array<{
        rentalId: string
        fromStatus: string | null
        toStatus: string
        changedById: string
        reason: string
      }> = [
        {
          rentalId: rental.id,
          fromStatus: null,
          toStatus: 'PENDING',
          changedById: renter.id,
          reason: 'Création de la demande',
        },
      ]

      if (status !== 'PENDING') {
        historyRows.push({
          rentalId: rental.id,
          fromStatus: 'PENDING',
          toStatus: status,
          changedById: actorUserId,
          reason: 'Mise à jour seed',
        })
      }

      await prisma.vehicleRentalHistory.createMany({ data: historyRows })
    }
  }

  const sampleTrip = await prisma.trip.findFirst({
    include: {
      bus: { include: { seats: { orderBy: { seatNumber: 'asc' }, take: 1 } } },
    },
    orderBy: { departureTime: 'asc' },
  })

  let seededBookingId: string | null = null
  let seededBookingTotal = 0

  if (sampleTrip && sampleTrip.bus.seats.length > 0) {
    const seat = sampleTrip.bus.seats[0]
    const bookingGroup = await prisma.bookingGroup.create({
      data: {
        userId: seedClient.id,
        totalAmount: sampleTrip.price,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
    })

    const ticketNumber = `ARSEED-${Date.now().toString().slice(-8)}`
    const booking = await prisma.booking.create({
      data: {
        bookingGroupId: bookingGroup.id,
        tripId: sampleTrip.id,
        userId: seedClient.id,
        seatId: seat.id,
        passengerName: `${seedClient.firstName} ${seedClient.lastName}`,
        passengerType: 'ADULT',
        status: 'CONFIRMED',
        ticketNumber,
        totalPrice: sampleTrip.price,
        basePrice: sampleTrip.price,
      },
    })
    seededBookingId = booking.id
    seededBookingTotal = sampleTrip.price

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: sampleTrip.price,
        method: 'CASH',
        status: 'PAID',
        transactionId: `BK-${Date.now()}`,
        paidAt: new Date(),
      },
    })

    await prisma.bookingHistory.createMany({
      data: [
        {
          bookingId: booking.id,
          fromStatus: null,
          toStatus: 'PENDING',
          changedById: seedClient.id,
          reason: 'Création seed',
        },
        {
          bookingId: booking.id,
          fromStatus: 'PENDING',
          toStatus: 'CONFIRMED',
          changedById: seedClient.id,
          reason: 'Paiement seed',
          metadata: JSON.stringify({ paymentMethod: 'CASH' }),
        },
      ],
    })
  }

  // Données minimales pour couvrir toutes les tables restantes du schéma
  const agentUser = await prisma.user.findFirst({ where: { role: 'AGENT' } })
  const firstBus = Array.from(buses.values())[0]
  const firstRoute = Array.from(routes.values())[0]
  const firstCityStop = Array.from(cityStops.values())[0]
  const firstSeat = firstBus
    ? await prisma.seat.findFirst({ where: { busId: firstBus.id }, orderBy: { seatNumber: 'asc' } })
    : null

  await prisma.setting.createMany({
    data: [
      { key: 'general.siteName', value: 'Aigle Royale' },
      { key: 'general.defaultCurrency', value: 'FC' },
      { key: 'booking.paymentWindowHours', value: '24' },
    ],
  })

  await prisma.passengerPricing.createMany({
    data: [
      { passengerType: 'ADULT', discountPercent: 0, minAge: 18, description: 'Tarif standard adulte' },
      { passengerType: 'CHILD', discountPercent: 40, minAge: 3, maxAge: 11, description: 'Tarif enfant' },
      { passengerType: 'INFANT', discountPercent: 100, minAge: 0, maxAge: 2, description: 'Tarif nourrisson' },
      { passengerType: 'SENIOR', discountPercent: 20, minAge: 60, description: 'Tarif senior' },
      { passengerType: 'DISABLED', discountPercent: 30, description: 'Tarif handicap', requiresDisabilityProof: true },
    ],
  })

  const agency = await prisma.agency.create({
    data: {
      name: 'Agence Plateau',
      address: 'Boulevard du 30 Juin',
      phone: '+2250101010101',
      email: 'plateau@aigleroyale.com',
      isActive: true,
    },
  })

  const offer = await prisma.offer.create({
    data: {
      title: 'Promo Bienvenue',
      description: 'Réduction sur la première réservation',
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      usageLimit: 500,
      minAmount: 2000,
    },
  })

  const manifest = await prisma.manifestShare.create({
    data: {
      token: `MAN-${Date.now()}`,
      type: 'PASSENGERS',
      query: JSON.stringify({ period: 'today' }),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: actorUserId,
    },
  })

  let driverRecord: { id: string } | null = null
  if (firstBus) {
    const driver = await prisma.driver.create({
      data: {
        firstName: 'Koffi',
        lastName: 'Nguessan',
        phone: '+2250701020304',
        licenseNumber: `LIC-${Date.now()}`,
        busId: firstBus.id,
        isActive: true,
      },
    })
    driverRecord = { id: driver.id }

    await prisma.locationVehicule.create({
      data: {
        busId: firstBus.id,
        latitude: 5.3364,
        longitude: -4.0267,
      },
    })

    await prisma.driverScheduleEvent.create({
      data: {
        driverId: driver.id,
        type: 'TRIP_ASSIGNMENT',
        startAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        busId: firstBus.id,
        notes: 'Rotation journalière',
        createdById: actorUserId,
      },
    })
  }

  await prisma.advertisementInquiry.createMany({
    data: [
      {
        companyName: 'Orange CI',
        contactName: 'Amani Traore',
        email: 'marketing@orange.ci',
        phone: '+2250709080706',
        message: 'Demande de campagne premium',
        desiredType: 'BANNER_HOMEPAGE',
        desiredStartDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        desiredEndDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000),
        linkUrl: 'https://example.com',
        status: 'PENDING',
      },
      {
        companyName: 'MTN CI',
        contactName: 'Nadia Soro',
        email: 'ads@mtn.ci',
        phone: '+2250709080707',
        message: 'Campagne résultats de recherche',
        desiredType: 'BANNER_RESULTS',
        desiredStartDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        desiredEndDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        linkUrl: 'https://mtn.ci',
        status: 'REVIEWED',
      },
      {
        companyName: 'UBA',
        contactName: 'Serge Yao',
        email: 'partenariats@uba.ci',
        phone: '+2250709080708',
        message: 'Visibilité page confirmation',
        desiredType: 'BANNER_CONFIRMATION',
        desiredStartDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        desiredEndDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        linkUrl: 'https://www.ubagroup.com',
        status: 'PENDING',
      },
    ],
  })

  if (sampleTrip) {
    const freightPlans = [
      { senderName: 'M. Sender', receiverName: 'Mme Receiver', weight: 12.5, price: 15000 },
      { senderName: 'Kouadio David', receiverName: 'Ahoua Mireille', weight: 8.2, price: 11000 },
      { senderName: 'Bamba Idriss', receiverName: 'Konan Edith', weight: 16.4, price: 18000 },
    ]

    for (let i = 0; i < freightPlans.length; i++) {
      const plan = freightPlans[i]
      const freightOrder = await prisma.freightOrder.create({
        data: {
          tripId: sampleTrip.id,
          userId: i % 2 === 0 ? seedClient.id : demoClient.id,
          agentId: agentUser?.id || null,
          trackingCode: `FR-${Date.now()}-${i}`,
          senderName: plan.senderName,
          senderPhone: `+22507000011${10 + i}`,
          receiverName: plan.receiverName,
          receiverPhone: `+22507000022${20 + i}`,
          weight: plan.weight,
          type: 'COLIS',
          value: 180000 + i * 50000,
          price: plan.price,
          status: i === 2 ? 'IN_TRANSIT' : 'RECEIVED',
          originStopId: firstCityStop?.id || null,
          destinationStopId: firstCityStop?.id || null,
          busId: sampleTrip.busId,
          notes: i === 0 ? 'Livraison prioritaire' : 'Livraison standard',
        },
      })

      await prisma.freightPayment.create({
        data: {
          freightOrderId: freightOrder.id,
          amount: freightOrder.price,
          method: i % 2 === 0 ? 'CASH' : 'MOBILE_MONEY',
          status: 'PAID',
          transactionId: `FRT-${Date.now()}-${i}`,
          paidAt: new Date(),
        },
      })

      await prisma.logisticsIssue.create({
        data: {
          freightOrderId: freightOrder.id,
          type: i === 1 ? 'DAMAGED_PACKAGE' : 'DELAY',
          description: i === 1 ? 'Carton partiellement abîmé au déchargement' : "Retard constaté à l'embarquement",
          status: i === 1 ? 'RESOLVED' : 'OPEN',
        },
      })

      if (agentUser?.id) {
        await prisma.commission.create({
          data: {
            agentId: agentUser.id,
            freightOrderId: freightOrder.id,
            amount: Math.round(freightOrder.price * 0.08),
            percentage: 8,
            status: i === 2 ? 'PAID' : 'PENDING',
          },
        })
      }
    }
  }

  if (firstBus) {
    await prisma.busRental.createMany({
      data: [
        {
          userId: demoClient.id,
          contactName: 'Client Demo',
          contactPhone: '+2250700003333',
          contactEmail: demoClient.email,
          rentalType: 'CORPORATE',
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          startTime: '08:00',
          endTime: '18:00',
          departureLocation: agency.address,
          destination: 'Yamoussoukro',
          stops: 'Singrobo',
          estimatedDistance: 240,
          passengerCount: 30,
          preferredBusType: firstBus.seatType,
          specialRequests: 'WiFi requis',
          busId: firstBus.id,
          driverId: agentUser?.id || null,
          basePrice: 220000,
          finalPrice: 210000,
          priceDetails: 'Remise corporate',
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentMethod: 'BANK_TRANSFER',
        },
        {
          userId: seedClient.id,
          contactName: 'Client Seed',
          contactPhone: '+2250700003334',
          contactEmail: seedClient.email,
          rentalType: 'EVENT',
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          startTime: '07:00',
          endTime: '20:00',
          departureLocation: 'Abidjan - Cocody',
          destination: 'Grand-Bassam',
          stops: 'Port-Bouet',
          estimatedDistance: 65,
          passengerCount: 20,
          preferredBusType: firstBus.seatType,
          specialRequests: 'Micro à bord',
          busId: firstBus.id,
          driverId: agentUser?.id || null,
          basePrice: 140000,
          finalPrice: 140000,
          priceDetails: 'Tarif standard',
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          paymentMethod: null,
        },
        {
          userId: demoClientAlpha.id,
          contactName: 'Client Alpha',
          contactPhone: '+2250700003335',
          contactEmail: demoClientAlpha.email,
          rentalType: 'TOURISM',
          startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          startTime: '09:30',
          endTime: '17:30',
          departureLocation: 'Abidjan - Plateau',
          destination: 'Assinie',
          stops: 'Bingerville',
          estimatedDistance: 95,
          passengerCount: 16,
          preferredBusType: firstBus.seatType,
          specialRequests: 'Sièges inclinables',
          busId: firstBus.id,
          driverId: agentUser?.id || null,
          basePrice: 160000,
          finalPrice: 155000,
          priceDetails: 'Remise ponctuelle',
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          paymentMethod: 'CASH',
        },
      ],
    })
  }

  if (firstRoute && sampleTrip) {
    await prisma.travelVoucher.create({
      data: {
        code: `TV-${Date.now()}`,
        title: 'Avoir fidélité',
        beneficiaryName: `${demoClient.firstName} ${demoClient.lastName}`,
        beneficiaryPhone: demoClient.phone,
        beneficiaryEmail: demoClient.email,
        userId: demoClient.id,
        valueAmount: 5000,
        passengerCount: 1,
        status: 'ISSUED',
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        routeId: firstRoute.id,
        tripId: sampleTrip.id,
        notes: 'Émis automatiquement par le seed',
        createdById: actorUserId,
        issuedAt: new Date(),
      },
    })
  }

  await prisma.companyReview.createMany({
    data: [
      {
        userId: demoClient.id,
        companyId: company.id,
        rating: 5,
        comment: 'Service excellent',
        isVerified: true,
        isVisible: true,
      },
      {
        userId: seedClient.id,
        companyId: company.id,
        rating: 4,
        comment: 'Bonne expérience globale',
        isVerified: true,
        isVisible: true,
      },
    ],
  })

  const campaign = await prisma.notificationCampaign.create({
    data: {
      title: 'Campagne bienvenue',
      message: 'Bienvenue sur Aigle Royale',
      channels: 'EMAIL,SMS,IN_APP',
      audience: 'ALL_USERS',
      status: 'COMPLETED',
      totalTargets: 2,
      totalSent: 2,
      totalFailed: 0,
      createdById: actorUserId,
    },
  })

  await prisma.notificationLog.createMany({
    data: [
      {
        campaignId: campaign.id,
        userId: demoClient.id,
        channel: 'EMAIL',
        recipient: demoClient.email,
        title: campaign.title,
        message: campaign.message,
        status: 'SENT',
        sentAt: new Date(),
      },
      {
        campaignId: campaign.id,
        userId: demoClientAlpha.id,
        channel: 'SMS',
        recipient: demoClientAlpha.phone,
        title: campaign.title,
        message: 'Bienvenue sur Aigle Royale - SMS',
        status: 'SENT',
        sentAt: new Date(),
      },
      {
        campaignId: campaign.id,
        userId: seedClient.id,
        channel: 'IN_APP',
        recipient: seedClient.email,
        title: campaign.title,
        message: 'Bienvenue sur Aigle Royale - In-app',
        status: 'SENT',
        sentAt: new Date(),
      },
    ],
  })

  await prisma.appNotification.createMany({
    data: [
      {
        userId: demoClient.id,
        title: 'Bienvenue',
        message: 'Votre compte est prêt.',
        type: 'INFO',
        isRead: false,
      },
      {
        userId: demoClientAlpha.id,
        title: 'Promo active',
        message: '10% de réduction sur votre prochaine réservation.',
        type: 'PROMO',
        isRead: false,
      },
      {
        userId: seedClient.id,
        title: 'Mise à jour trajet',
        message: 'Un de vos trajets a été replanifié.',
        type: 'INFO',
        isRead: true,
      },
    ],
  })

  await prisma.supportComplaint.createMany({
    data: [
      {
        reference: `SUP-${Date.now()}-1`,
        userId: demoClient.id,
        category: 'RESERVATION',
        subject: "Demande d'information",
        description: 'Je souhaite plus de détails sur les horaires.',
        status: 'OPEN',
        priority: 'NORMAL',
        contactName: `${demoClient.firstName} ${demoClient.lastName}`,
        contactEmail: demoClient.email,
        contactPhone: demoClient.phone || '+2250700004444',
        bookingHint: seededBookingId,
      },
      {
        reference: `SUP-${Date.now()}-2`,
        userId: demoClientAlpha.id,
        category: 'PAIEMENT',
        subject: 'Paiement en attente',
        description: 'Mon paiement mobile money reste en attente.',
        status: 'OPEN',
        priority: 'HIGH',
        contactName: `${demoClientAlpha.firstName} ${demoClientAlpha.lastName}`,
        contactEmail: demoClientAlpha.email,
        contactPhone: demoClientAlpha.phone || '+2250700004455',
        bookingHint: null,
      },
      {
        reference: `SUP-${Date.now()}-3`,
        userId: seedClient.id,
        category: 'FRET',
        subject: 'Suivi colis',
        description: 'Je veux une mise à jour sur mon colis.',
        status: 'IN_PROGRESS',
        priority: 'NORMAL',
        contactName: `${seedClient.firstName} ${seedClient.lastName}`,
        contactEmail: seedClient.email,
        contactPhone: seedClient.phone || '+2250700004466',
        bookingHint: null,
      },
    ],
  })

  if (sampleTrip) {
    await prisma.avisClient.create({
      data: {
        userId: demoClient.id,
        tripId: sampleTrip.id,
        rating: 5,
        comment: 'Trajet confortable et ponctuel',
      },
    })
  }

  if (sampleTrip && firstSeat) {
    await prisma.seatSegmentAvailability.create({
      data: {
        tripId: sampleTrip.id,
        seatId: firstSeat.id,
        fromStopOrder: 1,
        toStopOrder: 2,
        isAvailable: true,
      },
    })
  }

  if (seededBookingId) {
    await prisma.loyaltyTransaction.create({
      data: {
        userId: seedClient.id,
        bookingId: seededBookingId,
        points: Math.max(1, Math.floor(seededBookingTotal / 1000)),
        type: 'EARN',
        reason: 'Seed loyalty points',
      },
    })
  }

  console.log('✅ Données complémentaires ajoutées sur toutes les tables')

  console.log('✅ Données véhicules, locations et historiques créées')

  console.log('🎉 Seeding terminé!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
