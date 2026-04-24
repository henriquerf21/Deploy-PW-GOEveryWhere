export type ContinentStoreSeed = {
  code: string;
  name: string;
  city: string;
  district: string;
  address: string;
  postalCode: string;
  lat: number;
  lng: number;
  openingHours: string;
  phone: string;
  format: 'Hiper' | 'Modelo' | 'Bom Dia';
};

export const CONTINENTE_STORES_SEED: ContinentStoreSeed[] = [
  { code: 'CT-GAIA-JARDIM', name: 'Continente (Gaia Jardim)', city: 'Vila Nova de Gaia', district: 'Porto', address: 'Av. dos Escultores 119', postalCode: '4400-504 V.N. Gaia', lat: 41.137423, lng: -8.638161, openingHours: '08:00-22:00', phone: '+351 22 772 7500', format: 'Hiper' },
  { code: 'CT-ANTAS', name: 'Continente Antas', city: 'Porto', district: 'Porto', address: 'R. dos Campeões Europeus 28-198', postalCode: '4350-149 Porto', lat: 41.163563, lng: -8.584454, openingHours: '08:00-23:00', phone: '+351 22 013 1400', format: 'Hiper' },
  { code: 'CT-BD-BARCELOS', name: 'Continente Bom Dia Barcelos', city: 'Barcelos', district: 'Braga', address: 'Av. São José', postalCode: '4750-234 Barcelos', lat: 41.537859, lng: -8.621803, openingHours: '08:00-21:00', phone: '+351 253 111 900', format: 'Bom Dia' },
  { code: 'CT-BD-BRAGA-QUINTA-PORTAS', name: 'Continente Bom Dia Braga - Quinta das Portas', city: 'Braga', district: 'Braga', address: 'R. de Abraão 120', postalCode: '4705-076 Braga', lat: 41.541665, lng: -8.430103, openingHours: '08:30-21:00', phone: '+351 253 078 110', format: 'Bom Dia' },
  { code: 'CT-BD-BRAGA-OFICINA-SAO-JOSE', name: 'Continente Bom Dia Braga Oficina São José', city: 'Braga', district: 'Braga', address: 'R. 25 de Abril 10', postalCode: '4710-913 Braga', lat: 41.550324, lng: -8.417196, openingHours: '08:30-21:00', phone: '+351 253 079 440', format: 'Bom Dia' },
  { code: 'CT-BD-CABECEIRAS-BASTO', name: 'Continente Bom Dia Cabeceiras de Basto', city: 'Cabeceiras de Basto', district: 'Braga', address: 'Av. Cardeal Dom António Ribeiro', postalCode: '4860-306 Cabeceiras de Basto', lat: 41.504000, lng: -8.000000, openingHours: '08:00-21:00', phone: '', format: 'Bom Dia' },
  { code: 'CT-BD-CALDAS-TAIPAS', name: 'Continente Bom Dia Caldas das Taipas', city: 'Guimarães', district: 'Braga', address: 'R. Rio Ave', postalCode: '4805-699 Caldelas', lat: 41.482514, lng: -8.351184, openingHours: '08:00-21:00', phone: '+351 253 079 140', format: 'Bom Dia' },
  { code: 'CT-BD-CELEIROS', name: 'Continente Bom Dia Celeirós', city: 'Braga', district: 'Braga', address: 'Av. de São Lourenço', postalCode: '4705-474 Celeirós', lat: 41.504000, lng: -8.447000, openingHours: '08:00-21:00', phone: '', format: 'Bom Dia' },
  { code: 'CT-BD-DELAES', name: 'Continente Bom Dia Delães', city: 'Vila Nova de Famalicão', district: 'Braga', address: 'Av. Albino Marques 503', postalCode: '4765-096 V.N. Famalicão', lat: 41.408000, lng: -8.479000, openingHours: '08:00-21:00', phone: '', format: 'Bom Dia' },
  { code: 'CT-BD-PEVIDEM', name: 'Continente Bom Dia Pevidém', city: 'Guimarães', district: 'Braga', address: 'Av. Sociedade Musical de Pevidém 482', postalCode: '4835-297 Guimarães', lat: 41.421836, lng: -8.354217, openingHours: '08:00-21:00', phone: '+351 253 111 250', format: 'Bom Dia' },
  { code: 'CT-BD-POUSADA-SARAMAGOS', name: 'Continente Bom Dia Pousada de Saramagos', city: 'Vila Nova de Famalicão', district: 'Braga', address: 'Av. da Riopele 348', postalCode: '4770-405 V.N. Famalicão', lat: 41.424290, lng: -8.435137, openingHours: '08:00-21:00', phone: '+351 252 102 201', format: 'Bom Dia' },
  { code: 'CT-BD-POVOA-LANHOSO', name: 'Continente Bom Dia Póvoa de Lanhoso', city: 'Póvoa de Lanhoso', district: 'Braga', address: 'R. Teixeira Ribeiro 212', postalCode: '4830-512 Póvoa de Lanhoso', lat: 41.571623, lng: -8.269280, openingHours: '08:00-21:00', phone: '+351 253 069 570', format: 'Bom Dia' },
  { code: 'CT-BRAGA', name: 'Continente Braga', city: 'Braga', district: 'Braga', address: 'Av. Robert Smith', postalCode: '4710-249 Braga', lat: 41.541195, lng: -8.400127, openingHours: '08:00-23:00', phone: '+351 253 240 300', format: 'Hiper' },
  { code: 'CT-BRAGA-NOVA-ARCADA', name: 'Continente Braga Nova Arcada', city: 'Braga', district: 'Braga', address: 'Av. do Cávado 134', postalCode: '4700-084 Braga', lat: 41.579146, lng: -8.428886, openingHours: '08:00-22:00', phone: '+351 253 077 300', format: 'Hiper' },
  { code: 'CT-GAIASHOPPING', name: 'Continente Gaiashopping', city: 'Vila Nova de Gaia', district: 'Porto', address: 'Av. dos Descobrimentos', postalCode: '4400-241 V.N. Gaia', lat: 41.118330, lng: -8.620639, openingHours: '08:00-23:00', phone: '+351 22 370 1010', format: 'Hiper' },
  { code: 'CT-GUIMARAES', name: 'Continente Guimarães', city: 'Guimarães', district: 'Braga', address: 'Alameda Dr. Mariano Felgueiras', postalCode: '4805-075 Guimarães', lat: 41.439854, lng: -8.303526, openingHours: '08:00-23:00', phone: '+351 253 422 200', format: 'Hiper' },
  { code: 'CT-MAIA-JARDIM', name: 'Continente Maia Jardim', city: 'Maia', district: 'Porto', address: 'R. Agostinho da Silva Rocha', postalCode: '4475-451 Maia', lat: 41.236583, lng: -8.596673, openingHours: '08:00-22:00', phone: '+351 22 943 3803', format: 'Hiper' },
  { code: 'CT-MAIASHOPPING', name: 'Continente Maiashopping', city: 'Maia', district: 'Porto', address: 'Lugar de Ardegães 1009', postalCode: '4425-500 Águas Santas', lat: 41.220267, lng: -8.562373, openingHours: '08:00-23:00', phone: '+351 22 977 0200', format: 'Hiper' },
  { code: 'CT-MATOSINHOS', name: 'Continente Matosinhos', city: 'Matosinhos', district: 'Porto', address: 'R. João Mendonça 505', postalCode: '4464-503 Matosinhos', lat: 41.182160, lng: -8.658478, openingHours: '08:00-23:00', phone: '+351 22 956 1000', format: 'Hiper' },
  { code: 'CT-MOD-AVINTES', name: 'Continente Modelo Avintes', city: 'Vila Nova de Gaia', district: 'Porto', address: 'R. Estádio FC Avintes', postalCode: '4430-826 Avintes', lat: 41.102018, lng: -8.554852, openingHours: '08:00-22:00', phone: '+351 22 786 2120', format: 'Modelo' },
  { code: 'CT-MOD-BARCELOS', name: 'Continente Modelo Barcelos', city: 'Barcelos', district: 'Braga', address: 'R. do Passal', postalCode: '4750-850 Vila Frescainha', lat: 41.530000, lng: -8.642056, openingHours: '08:00-22:00', phone: '+351 253 801 502', format: 'Modelo' },
  { code: 'CT-MOD-BRAGA', name: 'Continente Modelo Braga', city: 'Braga', district: 'Braga', address: 'Rua de Seara', postalCode: '4700-154 Braga', lat: 41.561203, lng: -8.449206, openingHours: '08:00-22:00', phone: '+351 253 607 820', format: 'Modelo' },
  { code: 'CT-MOD-ERMESINDE', name: 'Continente Modelo Ermesinde', city: 'Valongo', district: 'Porto', address: 'R. das Macieiras 330', postalCode: '4450-502 Ermesinde', lat: 41.202062, lng: -8.545924, openingHours: '08:00-22:00', phone: '+351 22 977 1155', format: 'Modelo' },
  { code: 'CT-MOD-ESPOSENDE', name: 'Continente Modelo Esposende', city: 'Esposende', district: 'Braga', address: 'R. Dr. Francisco Sá Carneiro 10', postalCode: '4740-010 Esposende', lat: 41.530548, lng: -8.761235, openingHours: '08:00-22:00', phone: '+351 253 969 530', format: 'Modelo' },
  { code: 'CT-MOD-FAFE', name: 'Continente Modelo Fafe', city: 'Fafe', district: 'Braga', address: 'Via Circular', postalCode: '4820-273 Fafe', lat: 41.444137, lng: -8.165312, openingHours: '08:00-22:00', phone: '+351 253 509 090', format: 'Modelo' },
  { code: 'CT-MOD-FAMALICAO', name: 'Continente Modelo Famalicão', city: 'Vila Nova de Famalicão', district: 'Braga', address: 'Lugar do Xisto', postalCode: '4760-727 V.N. Famalicão', lat: 41.366937, lng: -8.545469, openingHours: '08:00-22:00', phone: '+351 252 480 450', format: 'Modelo' },
  { code: 'CT-MOD-FAMALICAO-RETAIL', name: 'Continente Modelo Famalicão Retail', city: 'Vila Nova de Famalicão', district: 'Braga', address: 'Av. Eng. Pinheiro Braga', postalCode: '4764-501 V.N. Famalicão', lat: 41.417240, lng: -8.517384, openingHours: '08:00-22:00', phone: '+351 252 111 300', format: 'Modelo' },
  { code: 'CT-MOD-GAIA-RECHOUSA', name: 'Continente Modelo Gaia (Rechousa)', city: 'Vila Nova de Gaia', district: 'Porto', address: 'R. Alto das Torres 891', postalCode: '4430-010 V.N. Gaia', lat: 41.097265, lng: -8.598185, openingHours: '08:00-22:00', phone: '+351 22 711 3056', format: 'Modelo' },
  { code: 'CT-MOD-GULPILHARES', name: 'Continente Modelo Gulpilhares', city: 'Vila Nova de Gaia', district: 'Porto', address: 'R. Norton de Matos', postalCode: '4405-671 V.N. Gaia', lat: 41.069397, lng: -8.625326, openingHours: '08:00-22:00', phone: '+351 22 730 0710', format: 'Modelo' },
  { code: 'CT-MOD-LECA-BALIO', name: 'Continente Modelo Leça do Balio', city: 'Matosinhos', district: 'Porto', address: 'R. Mainça 697', postalCode: '4465-675 Leça do Balio', lat: 41.200284, lng: -8.621632, openingHours: '08:00-22:00', phone: '+351 22 906 9050', format: 'Modelo' },
  { code: 'CT-MOD-MAIA', name: 'Continente Modelo Maia', city: 'Maia', district: 'Porto', address: 'Av. Lidador da Maia 116', postalCode: '4425-116 Águas Santas', lat: 41.206361, lng: -8.560840, openingHours: '08:00-22:00', phone: '+351 22 975 4122', format: 'Modelo' },
  { code: 'CT-MOD-MIRA-MAIA', name: 'Continente Modelo Mira Maia', city: 'Maia', district: 'Porto', address: 'Estrada Real 95', postalCode: '4470-274 Moreira', lat: 41.256078, lng: -8.653846, openingHours: '08:00-22:00', phone: '+351 22 947 1050', format: 'Modelo' },
  { code: 'CT-MOD-RIO-TINTO', name: 'Continente Modelo Rio Tinto', city: 'Gondomar', district: 'Porto', address: 'Av. Dr. Domingos Gonçalves de Sá', postalCode: '4435-213 Rio Tinto', lat: 41.174469, lng: -8.555341, openingHours: '08:00-22:00', phone: '+351 22 012 0560', format: 'Modelo' },
  { code: 'CT-VALONGO', name: 'Continente Valongo', city: 'Valongo', district: 'Porto', address: 'Av. do Conhecimento 75', postalCode: '4440-837 Valongo', lat: 41.197943, lng: -8.491280, openingHours: '08:00-22:00', phone: '+351 22 421 8400', format: 'Hiper' }
];
