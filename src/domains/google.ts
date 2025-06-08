export interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GoogleCoordinates {
  lat: number;
  lng: number;
}

export interface GoogleViewport {
  northeast: GoogleCoordinates;
  southwest: GoogleCoordinates;
}

// Geometry with location and viewport
export interface GoogleGeometry {
  location: GoogleCoordinates;
  viewport: GoogleViewport;
}

export interface GoogleTimeDetail {
  day: number; // 0 (Sunday) to 6 (Saturday)
  time: string; // "HHmm" format
}

export interface GooglePeriod {
  open: GoogleTimeDetail;
  close: GoogleTimeDetail;
}

// Opening hours structure
export interface GoogleOpeningHours {
  open_now: boolean;
  periods: GooglePeriod[];
  weekday_text: string[];
}

// Photo object structure
export interface GooglePhoto {
  photo_reference: string;
  base64: string;
  html_attributions: string[];
  height: number;
  width: number;
}

// Plus code structure
export interface GooglePlusCode {
  compound_code: string;
  global_code: string;
}

export interface GoogleReview {
  author_name: string;
  author_url: string;
  language: string;
  original_language: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  translated: boolean;
}

export enum GoogleBusinessStatus {
  Operational = 'OPERATIONAL',
  ClosedTemporarily = 'CLOSED_TEMPORARILY',
  ClosedPermanently = 'CLOSED_PERMANENTLY',
}

export interface GetGoogleInfosDto {
  query: string;
  byTitle: boolean;
}
