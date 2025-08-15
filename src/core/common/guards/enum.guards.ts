import { Preset } from '../enums';

export const isValidPreset = (preset: string): preset is Preset => {
  return Object.values(Preset).includes(preset as Preset);
};
