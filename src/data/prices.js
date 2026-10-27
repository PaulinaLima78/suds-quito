// ---------------------------------------------------------------------------
// PRECIOS UNITARIOS — Fuente: Lista de Rubros Municipio de Rumiñahui
// (precios referenciales, actualización junio 2026).
// Actualizar cada 6 meses según nueva versión del catálogo.
// © 2026 Paulina Lima. Todos los derechos reservados.
// ---------------------------------------------------------------------------
export const PRICE_SOURCE = "Lista de Rubros Municipio de Rumiñahui, junio 2026";
export const CONTINGENCY = 0.20; // imprevistos sugeridos para anteproyecto

export const UNIT_PRICES = {
  // Biorretención / Jardín de lluvia
  bio_excavacion:  8.92,   // m3 excavación a mano en tierra
  bio_abono:       0.41,   // Kg abono orgánico mezclado en sitio
  bio_arena:      23.63,   // m3 arena gruesa para filtros
  bio_grava:      20.11,   // m3 grava para drenaje
  bio_geotextil:   3.10,   // m2 geotextil 2000 NT no tejido
  bio_dren:        9.92,   // m tubería PVC perforada Ø 110mm
  bio_plantas:    17.83,   // m2 plantas ornamentales / jardinería
  bio_desalojo:   10.25,   // m3 desalojo material a 5km
  // Zanja de infiltración
  zanja_excavacion: 13.57, // m3 excavación de zanja a mano h=0-2m
  zanja_arena:    23.02,   // m3 arena en zanja de infiltración
  zanja_grava:    23.02,   // m3 grava en zanja de infiltración
  zanja_geotextil:  3.10,  // m2 geotextil 2000 NT no tejido
  zanja_desalojo: 10.25,   // m3 desalojo material a 5km
  // Pavimento permeable
  pav_adoquin:    31.25,   // m2 adoquín ecológico e=10cm f'c=400 inc. cama arena
  pav_base_grava: 20.11,   // m3 grava para drenaje (base)
  pav_geotextil:   3.10,   // m2 geotextil 2000 NT no tejido
  pav_excavacion:  8.92,   // m3 excavación a mano en tierra
  pav_desalojo:   10.25,   // m3 desalojo material a 5km
  // Cisterna / tanque
  cist_excavacion: 16.27,  // m3 excavación a mano en pozo h=0-2m
  cist_hormigon: 155.34,   // m3 hormigón simple f'c=210 kg/cm2
  cist_impermeab:  14.63,  // m2 impermeabilización de cisterna
  cist_encofrado:   7.98,  // m2 encofrado/desencofrado
  cist_desalojo:   10.25,  // m3 desalojo material a 5km
  // Depósito de infiltración bajo parqueadero
  dep_excavacion:  16.27,  // m3 excavación a mano en pozo h=0-2m
  dep_grava:       23.02,  // m3 grava en zanja de infiltración
  dep_geotextil:    3.10,  // m2 geotextil 2000 NT no tejido
  dep_desalojo:    10.25,  // m3 desalojo material a 5km
};
