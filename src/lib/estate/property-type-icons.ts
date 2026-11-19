import {
  Anchor,
  Armchair,
  Bath,
  BedDouble,
  BedSingle,
  Blinds,
  Box,
  Boxes,
  BriefcaseBusiness,
  Building,
  Building2,
  Castle,
  Church,
  Coffee,
  Columns3,
  Construction,
  Container,
  DoorOpen,
  Dumbbell,
  Factory,
  Fence,
  Flower2,
  GraduationCap,
  Hammer,
  Hospital,
  Hotel,
  House,
  HousePlus,
  KeyRound,
  Landmark,
  LandPlot,
  Layers,
  LayoutGrid,
  MapPinned,
  Mountain,
  Package,
  Sailboat,
  School,
  ShoppingBag,
  Sofa,
  SquareParking,
  Sprout,
  Stethoscope,
  Store,
  Sun,
  Tent,
  Tractor,
  TreeDeciduous,
  TreePine,
  Trees,
  Utensils,
  Warehouse,
  Waves,
  WavesLadder,
  Wheat,
  CarFront,
  type LucideIcon,
} from "lucide-react";

// Biblioteca de íconos para los tipos de inmueble (Categorías → Tipo de
// propiedad). La clave es lo que se guarda en EstatePropertyType.icon, así
// que no se renombran: solo se agregan nuevas.
export const PROPERTY_TYPE_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  house: { label: "Casa", Icon: House },
  "house-plus": { label: "Casa nueva", Icon: HousePlus },
  building: { label: "Edificio", Icon: Building },
  "building-2": { label: "Edificio de oficinas", Icon: Building2 },
  hotel: { label: "Hotel / torre", Icon: Hotel },
  layers: { label: "Pisos / PH", Icon: Layers },
  "door-open": { label: "Monoambiente", Icon: DoorOpen },
  "bed-double": { label: "Dormitorio", Icon: BedDouble },
  "bed-single": { label: "Habitación", Icon: BedSingle },
  sofa: { label: "Living", Icon: Sofa },
  armchair: { label: "Amoblado", Icon: Armchair },
  blinds: { label: "Ventana", Icon: Blinds },
  "key-round": { label: "Llave", Icon: KeyRound },
  store: { label: "Local comercial", Icon: Store },
  "shopping-bag": { label: "Comercio", Icon: ShoppingBag },
  briefcase: { label: "Oficina", Icon: BriefcaseBusiness },
  coffee: { label: "Bar / café", Icon: Coffee },
  utensils: { label: "Restaurante", Icon: Utensils },
  warehouse: { label: "Galpón / depósito", Icon: Warehouse },
  factory: { label: "Industria", Icon: Factory },
  container: { label: "Contenedor", Icon: Container },
  package: { label: "Baulera", Icon: Package },
  boxes: { label: "Depósito", Icon: Boxes },
  box: { label: "Caja", Icon: Box },
  parking: { label: "Cochera", Icon: SquareParking },
  car: { label: "Auto", Icon: CarFront },
  "land-plot": { label: "Terreno / lote", Icon: LandPlot },
  fence: { label: "Lote cercado", Icon: Fence },
  "map-pinned": { label: "Ubicación", Icon: MapPinned },
  tractor: { label: "Campo", Icon: Tractor },
  wheat: { label: "Chacra", Icon: Wheat },
  sprout: { label: "Huerta / vivero", Icon: Sprout },
  trees: { label: "Quinta", Icon: Trees },
  "tree-pine": { label: "Cabaña", Icon: TreePine },
  "tree-deciduous": { label: "Parque", Icon: TreeDeciduous },
  flower: { label: "Jardín", Icon: Flower2 },
  mountain: { label: "Montaña", Icon: Mountain },
  sun: { label: "Casa de verano", Icon: Sun },
  waves: { label: "Costa / río", Icon: Waves },
  pool: { label: "Piscina", Icon: WavesLadder },
  bath: { label: "Baño", Icon: Bath },
  sailboat: { label: "Náutica", Icon: Sailboat },
  anchor: { label: "Amarra", Icon: Anchor },
  tent: { label: "Camping", Icon: Tent },
  castle: { label: "Estancia", Icon: Castle },
  landmark: { label: "Edificio histórico", Icon: Landmark },
  columns: { label: "Salón", Icon: Columns3 },
  church: { label: "Templo", Icon: Church },
  school: { label: "Escuela", Icon: School },
  "graduation-cap": { label: "Educación", Icon: GraduationCap },
  hospital: { label: "Clínica", Icon: Hospital },
  stethoscope: { label: "Consultorio", Icon: Stethoscope },
  dumbbell: { label: "Gimnasio", Icon: Dumbbell },
  "layout-grid": { label: "Loteo", Icon: LayoutGrid },
  construction: { label: "En construcción", Icon: Construction },
  hammer: { label: "A refaccionar", Icon: Hammer },
};

export const DEFAULT_PROPERTY_TYPE_ICON = "house";

// Ícono sugerido para los tipos que ya existen, según el nombre: así no
// arrancan todos con la casita.
export function suggestedPropertyTypeIcon(name: string): string {
  const n = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/monoambiente/.test(n)) return "door-open";
  if (/departamento|depto/.test(n)) return "building";
  if (/duplex|ph\b|^ph$/.test(n)) return "layers";
  if (/terreno|lote/.test(n)) return "land-plot";
  if (/local/.test(n)) return "store";
  if (/oficina|consultorio/.test(n)) return "briefcase";
  if (/galpon|deposito/.test(n)) return "warehouse";
  if (/campo|chacra/.test(n)) return "tractor";
  if (/cochera|garage/.test(n)) return "parking";
  if (/quinta/.test(n)) return "trees";
  return DEFAULT_PROPERTY_TYPE_ICON;
}

export function propertyTypeIcon(key: string | null | undefined): LucideIcon {
  return PROPERTY_TYPE_ICONS[key ?? ""]?.Icon ?? House;
}
