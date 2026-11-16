export interface RadioModel {
  model: string;
  civ: string;
  bands: string;
  category: 'hf' | 'vhf' | 'portable' | 'receiver';
  lan: boolean;
  dualRx: boolean;
  spectrum: boolean;
  highlight?: string;
}

export const SUPPORTED_RADIOS: RadioModel[] = [
  {
    model: 'IC-7300MK2',
    civ: '0xA4',
    bands: 'HF / 50 / (70) MHz',
    category: 'hf',
    lan: true,
    dualRx: false,
    spectrum: true,
    highlight: 'LAN Directo + Audio RX/TX + Cascada 30fps'
  },
  {
    model: 'IC-7300',
    civ: '0x94',
    bands: 'HF / 50 / (70) MHz',
    category: 'hf',
    lan: false,
    dualRx: false,
    spectrum: true,
    highlight: 'USB CI-V + Espectro en tiempo real'
  },
  {
    model: 'IC-7610',
    civ: '0x98',
    bands: 'HF / 50 MHz',
    category: 'hf',
    lan: true,
    dualRx: true,
    spectrum: true,
    highlight: 'Doble receptor Dualwatch + LAN nativo'
  },
  {
    model: 'IC-705',
    civ: '0xA4',
    bands: 'HF / 50 / 144 / 430 MHz',
    category: 'portable',
    lan: true,
    dualRx: false,
    spectrum: true,
    highlight: 'Portátil QRP WLAN/USB + Cascada'
  },
  {
    model: 'IC-9700',
    civ: '0xA2',
    bands: '144 / 430 / 1200 MHz',
    category: 'vhf',
    lan: true,
    dualRx: true,
    spectrum: true,
    highlight: 'VHF/UHF/SHF Satélites + LAN nativo'
  },
  {
    model: 'IC-7760',
    civ: '0xB2',
    bands: 'HF / 50 MHz (200W)',
    category: 'hf',
    lan: true,
    dualRx: true,
    spectrum: true,
    highlight: 'Doble receptor + Cabezal en red'
  },
  {
    model: 'IC-7851',
    civ: '0x8E',
    bands: 'HF / 50 MHz (200W)',
    category: 'hf',
    lan: true,
    dualRx: true,
    spectrum: true,
    highlight: 'Flagship HF + Dual Scope'
  },
  {
    model: 'IC-7850',
    civ: '0x8E',
    bands: 'HF / 50 MHz (200W)',
    category: 'hf',
    lan: true,
    dualRx: true,
    spectrum: true,
    highlight: 'Edición Limitada + Dualwatch'
  },
  {
    model: 'IC-905',
    civ: '0xAC',
    bands: '144 MHz – 10 GHz',
    category: 'vhf',
    lan: true,
    dualRx: false,
    spectrum: true,
    highlight: 'Microondas SHF + PoE LAN'
  },
  {
    model: 'IC-R8600',
    civ: '0x96',
    bands: '10 kHz – 3 GHz',
    category: 'receiver',
    lan: true,
    dualRx: false,
    spectrum: true,
    highlight: 'Receptor de comunicaciones SDR'
  },
  {
    model: 'IC-7100',
    civ: '0x88',
    bands: 'HF / 50 / 70 / 144 / 430 MHz',
    category: 'hf',
    lan: false,
    dualRx: false,
    spectrum: false,
    highlight: 'Multibanda todo modo vía USB'
  },
  {
    model: 'IC-9100',
    civ: '0x7C',
    bands: 'HF / 50 / 144 / 430 / (1200) MHz',
    category: 'vhf',
    lan: false,
    dualRx: true,
    spectrum: false,
    highlight: 'Estación todo en uno HF/VHF/UHF'
  },
  {
    model: 'IC-7600',
    civ: '0x7A',
    bands: 'HF / 50 MHz',
    category: 'hf',
    lan: false,
    dualRx: true,
    spectrum: false,
    highlight: 'Doble DSP + Dualwatch vía USB'
  },
  {
    model: 'IC-7410',
    civ: '0x80',
    bands: 'HF / 50 MHz',
    category: 'hf',
    lan: false,
    dualRx: false,
    spectrum: false,
    highlight: 'DSP 32 bits + USB CI-V integrado'
  },
  {
    model: 'IC-7200',
    civ: '0x76',
    bands: 'HF / 50 MHz',
    category: 'hf',
    lan: false,
    dualRx: false,
    spectrum: false,
    highlight: 'Robusto de campo con USB CI-V'
  },
  {
    model: 'IC-7700',
    civ: '0x74',
    bands: 'HF / 50 MHz (200W)',
    category: 'hf',
    lan: false,
    dualRx: false,
    spectrum: false,
    highlight: 'Concursos HF de alta potencia'
  },
  {
    model: 'IC-7800',
    civ: '0x6A',
    bands: 'HF / 50 MHz (200W)',
    category: 'hf',
    lan: false,
    dualRx: true,
    spectrum: false,
    highlight: 'Doble receptor independiente'
  }
];
