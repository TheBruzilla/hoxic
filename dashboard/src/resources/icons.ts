import { IconType } from "react-icons";

import {
  HiArrowUpRight,
  HiOutlineLink,
  HiArrowTopRightOnSquare,
  HiEnvelope,
  HiCalendarDays,
  HiArrowRight,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineDocument,
  HiOutlineGlobeAsiaAustralia,
  HiOutlineRocketLaunch,
  HiChevronLeft,
  HiSun,
  HiMoon,
} from "react-icons/hi2";

import {
  PiHouseDuotone,
  PiGridFourDuotone,
} from "react-icons/pi";

import { FaDiscord } from "react-icons/fa6";

export const iconLibrary: Record<string, IconType> = {
  arrowUpRight: HiArrowUpRight,
  arrowRight: HiArrowRight,
  email: HiEnvelope,
  globe: HiOutlineGlobeAsiaAustralia,
  grid: PiGridFourDuotone,
  openLink: HiOutlineLink,
  calendar: HiCalendarDays,
  home: PiHouseDuotone,
  discord: FaDiscord,
  eye: HiOutlineEye,
  eyeOff: HiOutlineEyeSlash,
  arrowUpRightFromSquare: HiArrowTopRightOnSquare,
  document: HiOutlineDocument,
  chevronLeft: HiChevronLeft,
  light: HiSun,
  dark: HiMoon,
  rocket: HiOutlineRocketLaunch,
};

export type IconLibrary = typeof iconLibrary;
export type IconName = keyof IconLibrary;
