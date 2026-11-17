/**
 * Device state convention: color + icon per device type and state.
 *
 * Defined by the user on 17/11/2026 (docs/ux/DEVICE_CONVENTION.md is the
 * readable version; the tracking spreadsheet lists the same rows). This
 * table is the single source: the device windows read it for the status
 * icon and color, and the doc/spreadsheet were generated from it.
 *
 * `icon` is a Lucide icon name (bundled by @pmndrs/uikit-lucide).
 * `status`: applied = in the app now; pending = device not in the app yet;
 * proposal = the user's list does not define it yet (our suggestion).
 */
import type { DeviceEntry } from './device-registry.js';

export const CONVENTION_COLORS = {
  red: '#ff5a5f',
  green: '#3ddc84',
  blue: '#4aa8ff',
  orange: '#ff9f43',
  white: '#ffffff',
  offWhite: '#b8c4cc',
  black: '#111111',
  amber: '#ffb850',
  gray: '#6b7c8a',
  cyan: '#62e2ef',
} as const;
export type ConventionColor = keyof typeof CONVENTION_COLORS;

export interface ConventionRow {
  category: string;
  device: string;
  state: string;
  color: ConventionColor;
  icon: string;
  status: 'applied' | 'pending' | 'proposal';
  note?: string;
}

export const DEVICE_CONVENTION: readonly ConventionRow[] = [
  { category: 'Access', device: 'Door', state: 'Locked', color: 'red', icon: 'Lock', status: 'applied' },
  { category: 'Access', device: 'Door', state: 'Unlocked', color: 'green', icon: 'LockOpen', status: 'applied' },
  { category: 'Access', device: 'Gate', state: 'Locked', color: 'red', icon: 'Lock', status: 'pending' },
  { category: 'Access', device: 'Gate', state: 'Unlocked', color: 'green', icon: 'LockOpen', status: 'pending' },
  { category: 'Access', device: 'Garage', state: 'Locked', color: 'red', icon: 'Lock', status: 'pending' },
  { category: 'Access', device: 'Garage', state: 'Unlocked', color: 'green', icon: 'LockOpen', status: 'pending' },
  { category: 'HVAC', device: 'AC', state: 'On (cooling)', color: 'blue', icon: 'Snowflake', status: 'applied' },
  { category: 'HVAC', device: 'AC', state: 'Off', color: 'gray', icon: 'Snowflake', status: 'proposal', note: 'Off color not defined; gray proposed' },
  { category: 'HVAC', device: 'Heating (HV)', state: 'On', color: 'orange', icon: 'Flame', status: 'pending' },
  { category: 'HVAC', device: 'Fan', state: 'On', color: 'white', icon: 'Wind', status: 'pending' },
  { category: 'Climate', device: 'Floor heating', state: 'On', color: 'orange', icon: 'Heater', status: 'pending' },
  { category: 'Climate', device: 'Floor heating', state: 'Off', color: 'blue', icon: 'Heater', status: 'pending' },
  { category: 'Energy', device: 'Solar panels', state: 'On (input)', color: 'amber', icon: 'Sun', status: 'proposal', note: 'Color/icon not defined; no solar-panel icon in Lucide, Sun proposed' },
  { category: 'Energy', device: 'Solar panels', state: 'Off', color: 'gray', icon: 'SunDim', status: 'proposal' },
  { category: 'Shading', device: 'Blinds & curtains', state: '0% closed (open)', color: 'white', icon: 'Eclipse', status: 'pending', note: 'Icon goes from white (0%) to black (100%)' },
  { category: 'Shading', device: 'Blinds & curtains', state: '100% closed', color: 'black', icon: 'Eclipse', status: 'pending' },
  { category: 'Sense control', device: 'Smart diffusers', state: 'On', color: 'cyan', icon: 'SprayCan', status: 'proposal', note: 'Icon and color to be defined' },
  { category: 'Sense control', device: 'Smart diffusers', state: 'Off', color: 'gray', icon: 'SprayCan', status: 'proposal', note: 'The list repeats "ON"; Off assumed' },
  { category: 'Kitchen', device: 'Oven', state: 'On', color: 'red', icon: 'Flame', status: 'pending' },
  { category: 'Kitchen', device: 'Oven', state: 'Off', color: 'white', icon: 'ShieldCheck', status: 'pending', note: '"Safe" icon: ShieldCheck' },
  { category: 'Audio', device: 'Speakers', state: 'On', color: 'white', icon: 'Volume2', status: 'pending' },
  { category: 'Audio', device: 'Speakers', state: 'Off', color: 'offWhite', icon: 'VolumeX', status: 'pending' },
  { category: 'Security & surveillance', device: 'Security cameras', state: 'Live (cycle: doorbell, garage, ...)', color: 'cyan', icon: 'Cctv', status: 'proposal', note: 'Icon and color to be defined; cycle through every camera of the house' },
  { category: 'Security & surveillance', device: 'Doorbell camera', state: 'Ringing', color: 'amber', icon: 'BellRing', status: 'proposal' },
  { category: 'Lighting', device: 'Lamp', state: 'On', color: 'amber', icon: 'Lightbulb', status: 'proposal', note: 'Not in the list; amber proposed (A.U.R.A. "active")' },
  { category: 'Lighting', device: 'Lamp', state: 'Off', color: 'gray', icon: 'LightbulbOff', status: 'proposal' },
  { category: 'Media', device: 'TV', state: 'On', color: 'white', icon: 'TvMinimal', status: 'proposal', note: 'Not in the list; same rule as Speakers proposed' },
  { category: 'Media', device: 'TV', state: 'Off', color: 'offWhite', icon: 'TvMinimal', status: 'proposal' },
];

/**
 * Status icon of a device window. Each window has two icon slots
 * (state-icon-a / state-icon-b, see public/ui/panel-*.uikitml); this says
 * which one shows and in which color, following DEVICE_CONVENTION.
 */
export function deviceStateVisual(entry: DeviceEntry): { slot: 'a' | 'b'; color: string } {
  const c = CONVENTION_COLORS;
  switch (entry.deviceId) {
    case 'lock-porta-01': // Door: Lock red / LockOpen green
      return entry.state.locked ? { slot: 'a', color: c.red } : { slot: 'b', color: c.green };
    case 'ac-sala-01': // HVAC > AC: Snowflake blue (off: gray)
      return { slot: 'a', color: entry.state.power ? c.blue : c.gray };
    case 'lamp-sala-01': // Lamp (proposal): Lightbulb amber / LightbulbOff gray
      return entry.state.power ? { slot: 'a', color: c.amber } : { slot: 'b', color: c.gray };
    case 'tv-sala-01': // TV (proposal): TvMinimal white / off-white
      return { slot: 'a', color: entry.state.power ? c.white : c.offWhite };
  }
}
