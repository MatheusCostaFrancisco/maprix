import type { CoordinateSystem } from '@maprix/types';

export function projString(sys: CoordinateSystem): string {
  if (sys.type === 'UTM') {
    const ellps = sys.datum === 'SIRGAS2000' ? 'GRS80' : 'WGS84';
    const towgs = sys.datum === 'SIRGAS2000' ? ' +towgs84=0,0,0,0,0,0,0' : '';
    const hemi = sys.hemisphere === 'S' ? ' +south' : '';
    return `+proj=utm +zone=${sys.zone}${hemi} +ellps=${ellps}${towgs} +units=m +no_defs`;
  }
  if (sys.datum === 'WGS84') return '+proj=longlat +datum=WGS84 +no_defs';
  if (sys.datum === 'SIRGAS2000') return '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs';
  // SAD69
  return '+proj=longlat +ellps=aust_SA +towgs84=-57,1,-41,0,0,0,0 +no_defs';
}

export function decimalToDMS(decimal: number): string {
  const abs = Math.abs(decimal);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = (minFloat - min) * 60;
  const sign = decimal < 0 ? '-' : '';
  return `${sign}${deg}° ${min.toString().padStart(2, '0')}' ${sec.toFixed(2).padStart(5, '0')}"`;
}

export function normalizeAzimute(az: number): number {
  let n = az % 360;
  if (n < 0) n += 360;
  return n;
}
